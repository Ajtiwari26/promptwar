import { runCivicBriefingPipeline, PipelineInput, PipelineResult } from "../../src/services/geminiPipeline.js";
import { briefingCache } from "./lruCache.js";
import { RawRow } from "../../src/types/rawRow.js";

/**
 * Server-side proxy for Civic Briefing Analysis
 * Isolates GEMINI_API_KEY on the server and checks the SHA-256 LRU cache for 0ms execution.
 */
export async function analyzeCivicDataProxy(
  input: PipelineInput,
  preparsedRows?: RawRow[]
): Promise<PipelineResult & { cached: boolean; executionTimeMs: number }> {
  const startTime = performance.now();

  // Compute SHA-256 hash of payload
  const cacheKey = briefingCache.computeHash({
    input,
    preparsedRows
  });

  const cachedResult = briefingCache.get(cacheKey) as PipelineResult | null;
  if (cachedResult) {
    const duration = performance.now() - startTime;
    return {
      ...cachedResult,
      cached: true,
      executionTimeMs: Math.round(duration * 100) / 100
    };
  }

  // Live Server-Side Pipeline Execution
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const result = await runCivicBriefingPipeline(apiKey, input, preparsedRows);

  // Store in LRU cache
  briefingCache.set(cacheKey, result);

  const duration = performance.now() - startTime;
  return {
    ...result,
    cached: false,
    executionTimeMs: Math.round(duration * 100) / 100
  };
}
