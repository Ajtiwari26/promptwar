import http from "http";
import express from "express";
import { normalizeAndClassifyHotspots } from "../src/services/fastDecisionEngine.js";
import { RawRow } from "../src/types/rawRow.js";
import { authGuard, generateToken, AuthenticatedRequest } from "../server/middleware/authGuard.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runHotspotEngineTests() {
  console.log("==========================================================================");
  console.log("  DECISION ENGINE: 6 HOTSPOT ARCHETYPES & DECISION API VERIFICATION       ");
  console.log("==========================================================================\n");

  // ------------------------------------------------------------------------
  // 1. ISOLATED TEST CASE FOR EACH OF THE 6 ARCHETYPES
  // ------------------------------------------------------------------------

  // Archetype 1: Coarse Dust & Construction (PM10 > 250, PM2.5/PM10 < 0.40)
  const dustDataset: RawRow[] = [
    {
      row_id: "ROW_DUST_01",
      sensor_id: "SNS_W01_DUST",
      ward_name: "Ward 1 - Metro Construction",
      timestamp_raw: "2026-11-14T08:00:00Z",
      pollutant: "PM10",
      raw_value: "350.0",
      raw_unit: "ug/m3"
    },
    {
      row_id: "ROW_DUST_02",
      sensor_id: "SNS_W01_DUST",
      ward_name: "Ward 1 - Metro Construction",
      timestamp_raw: "2026-11-14T08:00:00Z",
      pollutant: "PM2.5",
      raw_value: "70.0", // Ratio = 70/350 = 0.20 (< 0.40)
      raw_unit: "ug/m3"
    }
  ];
  console.log("▶ Testing Archetype 1: COARSE_DUST_CONSTRUCTION...");
  const dustResult = normalizeAndClassifyHotspots(dustDataset);
  const dustHotspot = dustResult.classified_hotspots.find(h => h.archetype === "COARSE_DUST_CONSTRUCTION");
  assert(!!dustHotspot, "Detected COARSE_DUST_CONSTRUCTION hotspot");
  assert(dustHotspot?.ward_name === "Ward 1 - Metro Construction", "Ward correctly attributed");
  assert(Boolean(dustHotspot?.traceability_refs.includes("ROW_DUST_01")), "Cites ROW_DUST_01");

  // Archetype 2: Acute Combustion & Biomass (PM2.5 > 180, PM2.5/PM10 > 0.65)
  const combustionDataset: RawRow[] = [
    {
      row_id: "ROW_COMB_01",
      sensor_id: "SNS_W04_FIRE",
      ward_name: "Ward 4 - Waste Disposal Area",
      timestamp_raw: "2026-11-14T08:00:00Z",
      pollutant: "PM2.5",
      raw_value: "250.0",
      raw_unit: "ug/m3"
    },
    {
      row_id: "ROW_COMB_02",
      sensor_id: "SNS_W04_FIRE",
      ward_name: "Ward 4 - Waste Disposal Area",
      timestamp_raw: "2026-11-14T08:00:00Z",
      pollutant: "PM10",
      raw_value: "280.0", // Ratio = 250/280 = 0.89 (> 0.65)
      raw_unit: "ug/m3"
    }
  ];
  console.log("\n▶ Testing Archetype 2: ACUTE_COMBUSTION_BIOMASS...");
  const combResult = normalizeAndClassifyHotspots(combustionDataset);
  const combHotspot = combResult.classified_hotspots.find(h => h.archetype === "ACUTE_COMBUSTION_BIOMASS");
  assert(!!combHotspot, "Detected ACUTE_COMBUSTION_BIOMASS hotspot");
  assert(Boolean(combHotspot?.traceability_refs.includes("ROW_COMB_01")), "Cites ROW_COMB_01");

  // Archetype 3: Vehicular Traffic Corridor (NO2 > 80 or CO > 2000)
  const trafficDataset: RawRow[] = [
    {
      row_id: "ROW_TRAF_01",
      sensor_id: "SNS_W02_JAM",
      ward_name: "Ward 2 - Arterial Highway Ring",
      timestamp_raw: "2026-11-14T08:30:00Z",
      pollutant: "NO2",
      raw_value: "96.0",
      raw_unit: "ug/m3"
    }
  ];
  console.log("\n▶ Testing Archetype 3: VEHICULAR_TRAFFIC_CORRIDOR...");
  const trafficResult = normalizeAndClassifyHotspots(trafficDataset);
  const trafficHotspot = trafficResult.classified_hotspots.find(h => h.archetype === "VEHICULAR_TRAFFIC_CORRIDOR");
  assert(!!trafficHotspot, "Detected VEHICULAR_TRAFFIC_CORRIDOR hotspot for NO2 > 80");
  assert(Boolean(trafficHotspot?.traceability_refs.includes("ROW_TRAF_01")), "Cites ROW_TRAF_01");

  // Archetype 4: Photochemical Ozone (O3 > 100)
  const ozoneDataset: RawRow[] = [
    {
      row_id: "ROW_OZONE_01",
      sensor_id: "SNS_W05_SUN",
      ward_name: "Ward 5 - Sunny Boulevard",
      timestamp_raw: "2026-11-14T13:30:00Z",
      pollutant: "O3",
      raw_value: "142.0",
      raw_unit: "ug/m3"
    }
  ];
  console.log("\n▶ Testing Archetype 4: PHOTOCHEMICAL_OZONE...");
  const ozoneResult = normalizeAndClassifyHotspots(ozoneDataset);
  const ozoneHotspot = ozoneResult.classified_hotspots.find(h => h.archetype === "PHOTOCHEMICAL_OZONE");
  assert(!!ozoneHotspot, "Detected PHOTOCHEMICAL_OZONE hotspot for O3 > 100 ug/m3");
  assert(Boolean(ozoneHotspot?.traceability_refs.includes("ROW_OZONE_01")), "Cites ROW_OZONE_01");

  // Archetype 5: Meteorological Inversion Trap (Wind < 1.0 m/s & RH > 70% & PM2.5 > 120)
  const inversionDataset: RawRow[] = [
    {
      row_id: "ROW_INV_01",
      sensor_id: "SNS_W03_MIST",
      ward_name: "Ward 3 - Lowland Basin",
      timestamp_raw: "2026-11-14T07:30:00Z",
      pollutant: "PM2.5",
      raw_value: "185.0",
      raw_unit: "ug/m3",
      wind_speed_ms: 0.5, // Calm wind (< 1.0)
      relative_humidity_pct: 82 // High humidity (> 70%)
    }
  ];
  console.log("\n▶ Testing Archetype 5: METEOROLOGICAL_INVERSION_PLUME_SHIFT...");
  const invResult = normalizeAndClassifyHotspots(inversionDataset);
  const invHotspot = invResult.classified_hotspots.find(h => h.archetype === "METEOROLOGICAL_INVERSION_PLUME_SHIFT");
  assert(!!invHotspot, "Detected METEOROLOGICAL_INVERSION_PLUME_SHIFT hotspot");
  assert(Boolean(invHotspot?.traceability_refs.includes("ROW_INV_01")), "Cites ROW_INV_01");

  // Archetype 6: Telemetry Blind-Spot (Hardware code -999 & flatlining)
  const faultDataset: RawRow[] = [
    {
      row_id: "ROW_FAULT_01",
      sensor_id: "SNS_W02_BROKEN",
      ward_name: "Ward 2 - Industrial Depot",
      timestamp_raw: "2026-11-14T08:00:00Z",
      pollutant: "PM10",
      raw_value: "-999",
      raw_unit: "ug/m3"
    }
  ];
  console.log("\n▶ Testing Archetype 6: TELEMETRY_BLIND_SPOT...");
  const faultResult = normalizeAndClassifyHotspots(faultDataset);
  const blindHotspot = faultResult.classified_hotspots.find(h => h.archetype === "TELEMETRY_BLIND_SPOT");
  assert(!!blindHotspot, "Detected TELEMETRY_BLIND_SPOT hotspot for hardware failure");

  // ------------------------------------------------------------------------
  // 2. TEST STANDALONE REST API ENDPOINT: POST /api/decision/hotspots
  // ------------------------------------------------------------------------
  console.log("\n▶ Testing Standalone REST API Endpoint: POST /api/decision/hotspots...");
  
  const app = express();
  app.use(express.json());

  app.post("/api/decision/hotspots", authGuard, (req: AuthenticatedRequest, res) => {
    const startTime = performance.now();
    const rows = req.body.rows || [];
    const result = normalizeAndClassifyHotspots(rows);
    const duration = performance.now() - startTime;
    res.json({
      success: true,
      latency_ms: Math.round(duration * 100) / 100,
      instant_triage_banner: result.instant_triage_banner,
      classified_hotspots: result.classified_hotspots
    });
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3098, () => resolve()));

  const token = generateToken({
    userId: "USR_OFFICER",
    email: "guest.officer@civicstudio.in",
    role: "ward_officer",
    displayName: "Ward Officer"
  });

  try {
    const combinedRows = [...dustDataset, ...combustionDataset, ...ozoneDataset];
    const res = await fetch("http://localhost:3098/api/decision/hotspots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ rows: combinedRows })
    });

    assert(res.status === 200, "Decision API returned status 200 OK");
    const data = (await res.json()) as any;
    assert(data.success === true, "Response indicated success: true");
    assert(data.latency_ms < 5, `Decision API executed in ${data.latency_ms} ms (< 5ms benchmark)`);
    assert(data.classified_hotspots.length >= 3, `Returned ${data.classified_hotspots.length} classified hotspots`);

    console.log(`  ⏱️ Decision API Latency: ${data.latency_ms} ms`);
    console.log("  ✅ Standalone Decision API Verified Successfully!\n");
  } finally {
    server.close();
  }

  console.log("==========================================================================");
  console.log("  🎉 ALL 6 HOTSPOT ARCHETYPES & STANDALONE DECISION API VERIFIED (10/10)   ");
  console.log("==========================================================================\n");
}

runHotspotEngineTests().catch((err) => {
  console.error("Hotspot engine test failure:", err);
  process.exit(1);
});
