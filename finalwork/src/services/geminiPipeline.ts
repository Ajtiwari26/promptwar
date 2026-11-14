import { GoogleGenAI } from "@google/genai";
import { RawRow, RawRowSchema } from "../types/rawRow.js";
import { CivicBriefingOutput, CivicBriefingOutputSchema } from "../types/briefingSchema.js";
import { normalizeAndClassifyHotspots } from "./fastDecisionEngine.js";
import { DecisionEngineOutput } from "../types/decisionEngine.js";
import { parseUniversalTelemetry } from "./universalDataParser.js";
import { buildLocalizedAdvisories } from "../i18n/advisories.js";
import { generateDeterministicGroundedBrief, formatPlainLanguageHotspot } from "./deterministicBrief.js";

export { generateDeterministicGroundedBrief, formatPlainLanguageHotspot };

export interface PipelineInput {
  text?: string;
  inlineData?: {
    data: string; // base64 encoded string
    mimeType: string; // e.g. "image/png", "image/jpeg", "application/pdf"
  };
  previousBrief?: CivicBriefingOutput | null;
}

export interface PipelineResult {
  fastTriage: DecisionEngineOutput["instant_triage_banner"];
  decisionContext: DecisionEngineOutput;
  fullBrief: CivicBriefingOutput;
  executionMode: "LIVE_GEMINI_3_8_FLASH" | "DETERMINISTIC_OFFLINE_SIMULATION";
}

/**
 * Executes the complete Civic Briefing Pipeline
 */
export async function runCivicBriefingPipeline(
  apiKey: string | undefined,
  input: PipelineInput,
  preparsedRows?: RawRow[]
): Promise<PipelineResult> {
  const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  let rawRows: RawRow[] = [];

  // STAGE 1: Generative AI Multimodal Extraction & Schema Interpretation
  if (preparsedRows && preparsedRows.length > 0) {
    // Optimization: Skip extraction call if already structured (e.g. from preset)
    rawRows = preparsedRows;
  } else if (effectiveApiKey && (input.inlineData || input.text)) {
    // Leverage Generative AI as core component to interpret messy tables, inconsistent formats, and missing readings
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });

      const contents: any[] = [];
      if (input.inlineData) {
        contents.push({
          inlineData: {
            data: input.inlineData.data,
            mimeType: input.inlineData.mimeType
          }
        });
      }
      if (input.text) {
        contents.push({ text: input.text });
      }

      contents.push({
        text: `You are an expert environmental intelligence agent. Interpret and extract all air quality sensor readings from this raw or messy data table into an array of RawRow objects.
Rules:
- Robustly interpret inconsistent formats, irregular units (e.g. mg/m3, ug/m3, ppm), header comments, or missing/fault readings.
- Preserve raw values and units EXACTLY as reported in the source table/document.
- Do NOT convert units.
- Do NOT fill missing values.
- Assign sequential row_id: ROW_01, ROW_02, etc.
- Return ONLY valid JSON array matching the schema: [{ "row_id": "ROW_01", "ward_name": "...", "sensor_id": "...", "timestamp_iso": "...", "pollutant": "...", "raw_value": "...", "raw_unit": "..." }]`
      });

      const extractionRes = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          temperature: 0,
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(extractionRes.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        rawRows = parsed;
      }
    } catch (err) {
      console.warn("Generative AI Stage 1 extraction failed, falling back to universal parser:", err);
      rawRows = [];
    }
  }

  // Resilient fallback to deterministic universal parser if rawRows is still empty
  if (rawRows.length === 0 && input.text) {
    const localParsed = parseUniversalTelemetry(input.text);
    if (localParsed.length > 0) {
      rawRows = localParsed;
    }
  }

  // TIER 1.5: Deterministic Decision Engine (< 5ms local execution)
  const previousBriefStr = input.previousBrief ? JSON.stringify(input.previousBrief) : undefined;
  const decisionContext = normalizeAndClassifyHotspots(rawRows, previousBriefStr);

  // STAGE 2: Deep Grounded Briefing & Multi-Lingual Synthesis
  if (effectiveApiKey && rawRows.length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });

      const prompt = `You are the Lead Environmental Intelligence Officer for the Civic Air Quality Briefing Studio.
Generate the complete grounded Civic Air Quality Briefing based STRICTLY on this verified decision engine payload:

DECISION ENGINE VERIFIED DATA:
${JSON.stringify(decisionContext, null, 2)}

PREVIOUS BRIEFING FOR DELTA COMPARISON:
${previousBriefStr || "None (First baseline reading)"}

STRICT GROUNDING & CITATION RULES:
1. Every claim in 'hotspots_and_trends' MUST include exact 'traceability_refs' (array of row_id like ['ROW_01', 'ROW_02']).
2. Every item in 'role_specific_actions' (ward_officer, housing_society, school_principal, gig_worker) MUST include exact 'traceability_refs'.
   - For 'gig_worker', include operational outdoor safety: corridor rerouting away from severe combustion hotspots, mandatory N95 respirator rest intervals every 90 minutes, and indoor air-filtered hydration stops.
3. In 'comparison_with_previous', compare current ward averages against the previous brief.
4. For 'citizen_advisories', provide tailored messaging in English ('en'), Hindi ('hi'), and Marathi ('mr'):
   - 'child_friendly': playful, clear metaphors (e.g. dusty blanket, indoor games).
   - 'general_public': actionable commuter, gig worker, and delivery shift safety advice.
   - 'sensitive_groups': clinical warnings for asthma, COPD, seniors, pregnant women.
5. In 'dual_outputs.internal_briefing_note', provide an executive summary and operational checklist with specific ward actions.`;

      const synthesisRes = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ text: prompt }],
        config: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      const rawJson = JSON.parse(synthesisRes.text || "{}");
      const validatedBrief = CivicBriefingOutputSchema.parse(rawJson);

      return {
        fastTriage: decisionContext.instant_triage_banner,
        decisionContext,
        fullBrief: validatedBrief,
        executionMode: "LIVE_GEMINI_3_8_FLASH"
      };
    } catch (err) {
      console.warn("Stage 2 Gemini call failed, generating deterministic grounded brief:", err);
    }
  }

  // DETERMINISTIC GROUNDED SYNTHESIS (Offline / Fast Simulation Engine)
  const fallbackBrief = generateDeterministicGroundedBrief(decisionContext, input.previousBrief);

  return {
    fastTriage: decisionContext.instant_triage_banner,
    decisionContext,
    fullBrief: fallbackBrief,
    executionMode: "DETERMINISTIC_OFFLINE_SIMULATION"
  };
}
