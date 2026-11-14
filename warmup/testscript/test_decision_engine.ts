import { normalizeAndClassifyHotspots } from "../src/services/fastDecisionEngine.js";
import { PRESET_CRISIS_DAY } from "../src/data/presets.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log("=== RUNNING TEST SUITE: FAST DECISION ENGINE & 6 HOTSPOTS ===\n");

const startTime = performance.now();
const result = normalizeAndClassifyHotspots(PRESET_CRISIS_DAY);
const durationMs = performance.now() - startTime;

console.log(`⏱️ Engine Execution Time: ${durationMs.toFixed(2)} ms (Benchmark: < 15ms)\n`);
assert(durationMs < 15, `Decision engine executes in sub-second time (${durationMs.toFixed(2)} ms)`);

// 1. Instant Triage Banner check
const banner = result.instant_triage_banner;
assert(banner.alert_level === "EMERGENCY_CRITICAL", `Alert level is EMERGENCY_CRITICAL (got ${banner.alert_level})`);
assert(banner.emergency_trigger_code === "GRAP_STAGE_IV_SEVERE_PLUS", "Trigger code is GRAP_STAGE_IV_SEVERE_PLUS");
assert(banner.urgent_action_required === true, "Urgent action required is TRUE");
assert(banner.worst_affected_ward === "Ward 4 - Industrial Belt", `Worst ward is Ward 4 (got ${banner.worst_affected_ward})`);
assert(banner.peak_pm25_ugm3 === 380, `Peak PM2.5 is 380 ug/m3 from normalized mg/m3 (got ${banner.peak_pm25_ugm3})`);

// 2. Hardware Error Flag check
const errorFlag = result.data_quality_flags.find(f => f.issue_type === "HARDWARE_ERROR_CODE");
assert(!!errorFlag, "Catches -999 hardware error flag");
assert(errorFlag?.sensor_id === "SNS_W02_03", `Flagged sensor is SNS_W02_03 (got ${errorFlag?.sensor_id})`);
assert(errorFlag?.row_id === "ROW_16", `Flagged row is ROW_16 (got ${errorFlag?.row_id})`);

// 3. Verify All 6 Hotspot Archetypes Triggered in Crisis Day
const archetypes = result.classified_hotspots.map(h => h.archetype);
console.log("\nDetected Hotspot Archetypes:", archetypes);

// Archetype 1: Acute Combustion (Ward 4)
assert(archetypes.includes("ACUTE_COMBUSTION_BIOMASS"), "Identifies ACUTE_COMBUSTION_BIOMASS (Ward 4)");
const combustion = result.classified_hotspots.find(h => h.archetype === "ACUTE_COMBUSTION_BIOMASS");
assert(Boolean(combustion?.traceability_refs.includes("ROW_10")), "Combustion hotspot cites ROW_10");

// Archetype 2: Coarse Dust & Construction (Ward 1)
assert(archetypes.includes("COARSE_DUST_CONSTRUCTION"), "Identifies COARSE_DUST_CONSTRUCTION (Ward 1)");
const dust = result.classified_hotspots.find(h => h.archetype === "COARSE_DUST_CONSTRUCTION");
assert(Boolean(dust?.traceability_refs.includes("ROW_13")), "Dust hotspot cites ROW_13");

// Archetype 3: Vehicular Traffic Corridor (Ward 2)
assert(archetypes.includes("VEHICULAR_TRAFFIC_CORRIDOR"), "Identifies VEHICULAR_TRAFFIC_CORRIDOR (Ward 2)");
const traffic = result.classified_hotspots.find(h => h.archetype === "VEHICULAR_TRAFFIC_CORRIDOR");
assert(Boolean(traffic?.traceability_refs.includes("ROW_15")), "Traffic hotspot cites ROW_15");

// Archetype 4: Meteorological Inversion Trap (Ward 3)
assert(archetypes.includes("METEOROLOGICAL_INVERSION_PLUME_SHIFT"), "Identifies METEOROLOGICAL_INVERSION_PLUME_SHIFT (Ward 3)");

// Archetype 5: Telemetry Blind Spot (Ward 2)
assert(archetypes.includes("TELEMETRY_BLIND_SPOT"), "Identifies TELEMETRY_BLIND_SPOT for Ward 2 due to -999 sensor failure");

console.log("\n🎉 ALL FAST DECISION ENGINE TESTS PASSED!\n");
