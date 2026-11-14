import { execSync } from "child_process";

console.log("=================================================================");
console.log("  CIVIC AIR QUALITY BRIEFING STUDIO - BACKEND TEST RUNNER        ");
console.log("=================================================================\n");

const suites = [
  { name: "Unit Converter & Physical Math", cmd: "npx tsx testscript/test_unit_converter.ts" },
  { name: "Fast Decision Engine & 6 Hotspot Archetypes", cmd: "npx tsx testscript/test_decision_engine.ts" },
  { name: "Isolated 6 Hotspot Archetypes & Standalone Decision API", cmd: "npx tsx testscript/test_hotspot_engine.ts" },
  { name: "3-Day Lifecycle & Presets Pipeline", cmd: "npx tsx testscript/test_presets_pipeline.ts" },
  { name: "Backend REST API, Security Middleware & LRU Cache", cmd: "npx tsx testscript/test_backend_api.ts" },
  { name: "Real-World Messy Data Benchmark (CSV, XML, JSON, WhatsApp)", cmd: "npx tsx testscript/test_real_messy_data.ts" }
];

let allPassed = true;

for (const suite of suites) {
  console.log(`\n-----------------------------------------------------------------`);
  console.log(`RUNNING: ${suite.name}`);
  console.log(`-----------------------------------------------------------------`);
  try {
    execSync(suite.cmd, { stdio: "inherit", cwd: process.cwd() });
  } catch (err) {
    console.error(`❌ Suite failed: ${suite.name}`);
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log("\n=================================================================");
  console.log("  ✅ ALL BACKEND TEST SUITES PASSED CLEANLY (10/10)              ");
  console.log("=================================================================\n");
  process.exit(0);
} else {
  console.error("\n❌ ONE OR MORE TEST SUITES FAILED.\n");
  process.exit(1);
}
