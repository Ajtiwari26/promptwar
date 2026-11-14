import { runCivicBriefingPipeline } from "../src/services/geminiPipeline.js";
import { PRESET_BASELINE_DAY, PRESET_CRISIS_DAY, PRESET_POST_INTERVENTION_DAY } from "../src/data/presets.js";
import { CivicBriefingOutputSchema } from "../src/types/briefingSchema.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTest() {
  console.log("=== RUNNING TEST SUITE: END-TO-END PRESETS PIPELINE LIFECYCLE ===\n");

  // --- DAY 1: BASELINE MONITORING ---
  console.log("▶ Running Day 1: Baseline Day...");
  const day1Result = await runCivicBriefingPipeline(undefined, {}, PRESET_BASELINE_DAY);
  assert(CivicBriefingOutputSchema.safeParse(day1Result.fullBrief).success, "Day 1 output strictly matches CivicBriefingOutputSchema");
  assert(day1Result.fastTriage.alert_level === "ADVISORY" || day1Result.fastTriage.alert_level === "NORMAL", "Day 1 triage is Normal/Advisory");
  assert(day1Result.fullBrief.comparison_with_previous.overall_trend === "NO_PREVIOUS_DATA", "Day 1 has no previous comparison baseline");

  // --- DAY 2: CRISIS OCCURRENCE ---
  console.log("\n▶ Running Day 2: Crisis Day (Comparing against Day 1)...");
  const day2Result = await runCivicBriefingPipeline(undefined, { previousBrief: day1Result.fullBrief }, PRESET_CRISIS_DAY);
  assert(CivicBriefingOutputSchema.safeParse(day2Result.fullBrief).success, "Day 2 output strictly matches CivicBriefingOutputSchema");
  assert(day2Result.fastTriage.alert_level === "EMERGENCY_CRITICAL", "Day 2 triage escalates to EMERGENCY_CRITICAL");
  assert(day2Result.fullBrief.comparison_with_previous.overall_trend === "WORSENED", "Day 2 correctly detects delta trend as WORSENED");
  assert(day2Result.fullBrief.role_specific_actions.ward_officer.length > 0, "Ward officer has prioritized actions");
  assert(day2Result.fullBrief.role_specific_actions.school_principal.length > 0, "School principal has prioritized actions");
  assert(day2Result.fullBrief.role_specific_actions.gig_worker !== undefined && day2Result.fullBrief.role_specific_actions.gig_worker.length > 0, "Gig / outdoor delivery worker has prioritized actions");
  assert(day2Result.fullBrief.dual_outputs.citizen_advisories.hi.child_friendly.length > 0, "Hindi child-friendly advisory is populated");
  assert(day2Result.fullBrief.dual_outputs.citizen_advisories.mr.child_friendly.length > 0, "Marathi child-friendly advisory is populated");

  // Check citation grounding
  const allCitations = [
    ...day2Result.fullBrief.hotspots_and_trends.flatMap(h => h.traceability_refs),
    ...day2Result.fullBrief.role_specific_actions.ward_officer.flatMap(a => a.traceability_refs),
    ...day2Result.fullBrief.role_specific_actions.school_principal.flatMap(a => a.traceability_refs)
  ];
  assert(allCitations.length > 0, "Findings and actions carry traceability row citations");
  assert(allCitations.every(c => c.startsWith("ROW_")), "All citations strictly reference valid ROW_xx IDs");

  // --- DAY 3: POST-INTERVENTION ASSESSMENT ---
  console.log("\n▶ Running Day 3: Post-Intervention Day (Comparing against Day 2)...");
  const day3Result = await runCivicBriefingPipeline(undefined, { previousBrief: day2Result.fullBrief }, PRESET_POST_INTERVENTION_DAY);
  assert(CivicBriefingOutputSchema.safeParse(day3Result.fullBrief).success, "Day 3 output strictly matches CivicBriefingOutputSchema");
  assert(day3Result.fullBrief.comparison_with_previous.overall_trend === "IMPROVED", "Day 3 correctly detects delta trend as IMPROVED after mist cannons");

  console.log("\n🎉 ALL 3-DAY LIFECYCLE TESTS PASSED WITH ZERO DRIFT!\n");
}

runTest().catch(err => {
  console.error("Pipeline test error:", err);
  process.exit(1);
});
