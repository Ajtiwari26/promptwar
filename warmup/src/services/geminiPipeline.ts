import { GoogleGenAI } from "@google/genai";
import { RawRow, RawRowSchema } from "../types/rawRow.js";
import { CivicBriefingOutput, CivicBriefingOutputSchema } from "../types/briefingSchema.js";
import { normalizeAndClassifyHotspots } from "./fastDecisionEngine.js";
import { DecisionEngineOutput } from "../types/decisionEngine.js";
import { parseUniversalTelemetry } from "./universalDataParser.js";

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

  // STAGE 1: Multimodal Extraction & Schema Mapping
  if (preparsedRows && preparsedRows.length > 0) {
    // Optimization: Skip extraction call if already structured (e.g. from preset)
    rawRows = preparsedRows;
  } else if (input.text) {
    // 1A. Deterministic Universal Parser (handles messy CSV, TSV, XML, JSON, WhatsApp logs instantly)
    const localParsed = parseUniversalTelemetry(input.text);
    if (localParsed.length > 0) {
      rawRows = localParsed;
    }
  }

  // 1B. If rawRows still empty and inlineData (PDF/Image) or complex unstructured text is provided
  if (rawRows.length === 0 && effectiveApiKey && (input.inlineData || input.text)) {
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
        text: `You are an environmental data parser. Extract all air quality sensor readings into an array of RawRow objects.
Rules:
- Preserve raw values and units EXACTLY as shown in the source table/image.
- Do NOT convert units.
- Do NOT fill missing values.
- Assign sequential row_id: ROW_01, ROW_02, etc.
- Return ONLY valid JSON array matching the schema.`
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
      rawRows = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("Stage 1 Extraction failed or fell back to parser:", err);
      rawRows = [];
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
2. Every item in 'role_specific_actions' (ward_officer, housing_society, school_principal) MUST include exact 'traceability_refs'.
3. In 'comparison_with_previous', compare current ward averages against the previous brief.
4. For 'citizen_advisories', provide tailored messaging in English ('en') and Hindi ('hi'):
   - 'child_friendly': playful, clear metaphors (e.g. dusty blanket, indoor games).
   - 'general_public': actionable commuter advice and mask advisories.
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

/**
 * Generates an uncompromising 100% schema-compliant grounded briefing
 * directly from the deterministic decision engine output.
 */
function generateDeterministicGroundedBrief(
  decisionContext: DecisionEngineOutput,
  previousBrief?: CivicBriefingOutput | null
): CivicBriefingOutput {
  const banner = decisionContext.instant_triage_banner;
  const hotspots = decisionContext.classified_hotspots;
  const flags = decisionContext.data_quality_flags;

  // 1. Cleaned readings matching schema
  const cleanedReadings = decisionContext.normalized_readings.map(r => ({
    row_id: r.row_id,
    sensor_id: r.sensor_id,
    ward_name: r.ward_name,
    timestamp_iso: r.timestamp_iso,
    pollutant: r.pollutant,
    raw_value: r.raw_value,
    raw_unit: r.raw_unit,
    normalized_value_ugm3: r.normalized_value_ugm3,
    aqi_severity: r.aqi_severity,
    validation_status: r.validation_status
  }));

  // 2. Data quality flags
  const dataQualityFlags = flags.map(f => ({
    row_id: f.row_id,
    sensor_id: f.sensor_id,
    issue_type: f.issue_type,
    raw_evidence: f.raw_evidence,
    explanation: f.explanation
  }));

  // 3. Hotspots & Trends with citations
  const hotspotsAndTrends = hotspots.map(h => ({
    hotspot_location: h.ward_name,
    finding_summary: `[${h.archetype}] ${h.trigger_reason}`,
    traceability_refs: h.traceability_refs
  }));

  if (hotspotsAndTrends.length === 0) {
    hotspotsAndTrends.push({
      hotspot_location: "All Monitored Wards",
      finding_summary: "No acute toxic hotspots detected; ambient particulate levels remain within standard dispersion limits.",
      traceability_refs: decisionContext.normalized_readings.slice(0, 3).map(r => r.row_id)
    });
  }

  // 4. Comparison with Previous
  let overallTrend: "IMPROVED" | "STABLE" | "WORSENED" | "NO_PREVIOUS_DATA" = "NO_PREVIOUS_DATA";
  let summaryChanges = "Baseline monitoring session established. No prior briefing available for delta computation.";
  const newFailures: string[] = flags.map(f => f.sensor_id);
  let hotspotShifts = "Stable ambient dispersion across civic boundaries.";

  if (previousBrief) {
    const prevPeak = Math.max(...previousBrief.cleaned_readings.map(r => r.normalized_value_ugm3 || 0), 0);
    const currPeak = banner.peak_pm25_ugm3 || 0;

    if (currPeak > prevPeak * 1.1) {
      overallTrend = "WORSENED";
      summaryChanges = `Air quality deteriorated: Peak PM2.5 increased from ${prevPeak} ug/m3 to ${currPeak} ug/m3 (+${Math.round(((currPeak - prevPeak) / (prevPeak || 1)) * 100)}%).`;
      hotspotShifts = `Smog plume intensified over ${banner.worst_affected_ward || 'industrial sectors'}.`;
    } else if (currPeak < prevPeak * 0.9) {
      overallTrend = "IMPROVED";
      summaryChanges = `Air quality improved: Peak PM2.5 declined from ${prevPeak} ug/m3 to ${currPeak} ug/m3 (-${Math.round(((prevPeak - currPeak) / (prevPeak || 1)) * 100)}%) following intervention measures.`;
      hotspotShifts = "High-concentration plumes dispersed into regional atmospheric baseline.";
    } else {
      overallTrend = "STABLE";
      summaryChanges = `Ambient concentrations remain stable with peak PM2.5 within 10% of prior briefing (${currPeak} ug/m3).`;
    }
  }

  // 5. Role-Specific Actions grounded in row citations
  const primaryRowRefs = decisionContext.normalized_readings
    .filter(r => (r.normalized_value_ugm3 || 0) > 100 || r.validation_status !== "VALID")
    .map(r => r.row_id);
  const fallbackRefs = primaryRowRefs.length > 0 ? primaryRowRefs : decisionContext.normalized_readings.slice(0, 2).map(r => r.row_id);

  const wardOfficerActions: Array<{ priority: "IMMEDIATE" | "HIGH" | "MEDIUM"; action: string; traceability_refs: string[] }> = [
    {
      priority: banner.alert_level === "EMERGENCY_CRITICAL" ? "IMMEDIATE" as const : "HIGH" as const,
      action: banner.worst_affected_ward
        ? `Deploy anti-smog mist water cannons along primary arterials in ${banner.worst_affected_ward} and enforce temporary halt on unpaved excavation.`
        : "Deploy mobile water mist sprinklers to control road dust resuspension.",
      traceability_refs: fallbackRefs
    },
    {
      priority: "HIGH" as const,
      action: "Order traffic police to reroute heavy commercial diesel transport away from residential corridors during peak commute hours.",
      traceability_refs: fallbackRefs
    }
  ];

  if (flags.length > 0) {
    wardOfficerActions.push({
      priority: "MEDIUM" as const,
      action: `Dispatch IoT field maintenance team to calibrate and repair flagged sensors: ${Array.from(new Set(flags.map(f => f.sensor_id))).join(", ")}.`,
      traceability_refs: flags.map(f => f.row_id)
    });
  }

  const housingSocietyActions = [
    {
      priority: banner.alert_level === "EMERGENCY_CRITICAL" ? "IMMEDIATE" as const : "HIGH" as const,
      action: "Ban routine testing of diesel power generator sets (DG sets) and switch society cleaning staff from dry brooms to wet mopping.",
      traceability_refs: fallbackRefs
    },
    {
      priority: "MEDIUM" as const,
      action: "Activate centralized HEPA filtration in residential community clubhouses and notify residents via notice board bulletin.",
      traceability_refs: fallbackRefs
    }
  ];

  const schoolPrincipalActions = [
    {
      priority: banner.alert_level === "EMERGENCY_CRITICAL" ? "IMMEDIATE" as const : "HIGH" as const,
      action: "Cancel morning outdoor assemblies and move all physical education classes into indoor gymnasiums or classrooms.",
      traceability_refs: fallbackRefs
    },
    {
      priority: "IMMEDIATE" as const,
      action: "Mandate classroom window closures, instruct school buses to enforce zero-engine-idling at gates, and alert parents of students with respiratory ailments.",
      traceability_refs: fallbackRefs
    }
  ];

  // 6. Multi-Lingual Citizen Advisories across 3 Reading Tiers
  const isEmergency = banner.alert_level === "EMERGENCY_CRITICAL" || banner.alert_level === "WARNING";

  const citizenAdvisories = {
    en: {
      child_friendly: isEmergency
        ? "The outdoor air has a dusty, smoky blanket today! Keep classroom windows shut and enjoy indoor drawing and games."
        : "The air outside is fresh today! Great weather for outdoor recess and sports activities.",
      general_public: isEmergency
        ? `High pollution alert in ${banner.worst_affected_ward || 'city zones'}. Avoid strenuous outdoor workouts during morning hours; use N95 respirators if commuting.`
        : "Air quality is currently in the satisfactory band. Normal outdoor activities and commuting may proceed without restriction.",
      sensitive_groups: isEmergency
        ? "Severe health risk for senior citizens, asthma patients, and young children. Remain strictly indoors in filtered environments and ensure rescue inhalers are readily accessible."
        : "Air quality is acceptable. Individuals with acute respiratory sensitivity should monitor personal comfort levels."
    },
    hi: {
      child_friendly: isEmergency
        ? "आज बाहर की हवा में बहुत धुआं और धूल है! आज सभी खेल क्लास या घर के अंदर ही खेलें और खिड़कियां बंद रखें।"
        : "आज बाहर की हवा बिल्कुल साफ और अच्छी है! बाहर खेलने और सैर करने के लिए बेहतरीन दिन है।",
      general_public: isEmergency
        ? `${banner.worst_affected_ward || 'प्रमुख क्षेत्रों'} में वायु गुणवत्ता गंभीर स्तर पर है। सुबह की दौड़ और भारी कसरत से बचें, बाहर निकलते समय N95 मास्क अवश्य लगाएं।`
        : "वायु गुणवत्ता संतोषजनक स्तर पर है। सामान्य दैनिक गतिविधियां बिना किसी रुकावट के जारी रखी जा सकती हैं।",
      sensitive_groups: isEmergency
        ? "वरिष्ठ नागरिकों, गर्भवती महिलाओं और दमा (अस्थमा) रोगियों के लिए विशेष चेतावनी: घर के अंदर सुरक्षित रहें और अपनी आवश्यक दवाइयां पास रखें।"
        : "हवा की स्थिति सामान्य है। संवेदनशील व्यक्ति अपनी व्यक्तिगत सुविधा के अनुसार सावधानी बरत सकते हैं।"
    }
  };

  return {
    brief_metadata: {
      brief_id: `BRIEF-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 900 + 100)}`,
      generated_at: new Date().toISOString(),
      compared_with_brief_id: previousBrief ? previousBrief.brief_metadata.brief_id : null
    },
    cleaned_readings: cleanedReadings,
    data_quality_flags: dataQualityFlags,
    hotspots_and_trends: hotspotsAndTrends,
    comparison_with_previous: {
      overall_trend: overallTrend,
      summary_of_changes: summaryChanges,
      new_sensor_failures: newFailures,
      hotspot_shifts: hotspotShifts
    },
    role_specific_actions: {
      ward_officer: wardOfficerActions,
      housing_society: housingSocietyActions,
      school_principal: schoolPrincipalActions
    },
    dual_outputs: {
      internal_briefing_note: {
        executive_summary: banner.primary_headline,
        operational_checklist: [
          ...wardOfficerActions.map(a => a.action),
          ...housingSocietyActions.slice(0, 1).map(a => a.action),
          ...schoolPrincipalActions.slice(0, 1).map(a => a.action)
        ]
      },
      citizen_advisories: citizenAdvisories
    }
  };
}
