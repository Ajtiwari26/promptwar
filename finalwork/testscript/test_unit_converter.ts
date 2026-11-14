import { normalizeRawReading, calculateSubIndex, getSeverityFromAQI } from "../src/services/unitConverter.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log("=== RUNNING TEST SUITE: UNIT CONVERTER & ANOMALY DETECTOR ===\n");

// 1. mg/m3 to ug/m3 normalization
const r1 = normalizeRawReading("PM2.5", "0.31", "mg/m3");
assert(r1.normalized_value_ugm3 === 310, `0.31 mg/m3 PM2.5 converts to 310 ug/m3 (got ${r1.normalized_value_ugm3})`);
assert(r1.aqi_severity === "SEVERE", `310 ug/m3 PM2.5 is SEVERE severity (got ${r1.aqi_severity})`);
assert(r1.validation_status === "VALID", "Normal conversion has VALID status");

// 2. Hardware error code (-999)
const r2 = normalizeRawReading("PM10", "-999", "ug/m3");
assert(r2.validation_status === "INVALID_ANOMALY", "-999 is flagged as INVALID_ANOMALY");
assert(r2.issue?.type === "HARDWARE_ERROR_CODE", "-999 issue type is HARDWARE_ERROR_CODE");
assert(r2.normalized_value_ugm3 === null, "Invalid reading has null normalized value");

// 3. Negative value anomaly
const r3 = normalizeRawReading("PM2.5", "-12.5", "ug/m3");
assert(r3.validation_status === "INVALID_ANOMALY", "Negative concentration is flagged as INVALID_ANOMALY");
assert(r3.issue?.type === "NEGATIVE_VALUE", "Negative value issue type is NEGATIVE_VALUE");

// 4. Missing value string (NA)
const r4 = normalizeRawReading("NO2", "NA", "ug/m3");
assert(r4.validation_status === "MISSING", "NA string is flagged as MISSING");
assert(r4.issue?.type === "MISSING_DATA", "Missing data issue type is MISSING_DATA");

// 5. Gas ppm conversion (NO2: MW ~ 46.01, 1 ppm ~ 1881.8 ug/m3)
const r5 = normalizeRawReading("NO2", "0.05", "ppm");
assert(r5.normalized_value_ugm3 !== null && Math.abs(r5.normalized_value_ugm3 - 94.1) < 1, `0.05 ppm NO2 converts to ~94.1 ug/m3 (got ${r5.normalized_value_ugm3})`);
assert(r5.validation_status === "VALID", "NO2 ppm conversion has VALID status");

// 6. Sub-index calculation according to CPCB breakpoints
const { aqi: aqiGood, severity: sevGood } = calculateSubIndex("PM2.5", 25);
assert(aqiGood <= 50 && sevGood === "GOOD", `25 ug/m3 PM2.5 is GOOD (AQI: ${aqiGood})`);

const { aqi: aqiSevere, severity: sevSevere } = calculateSubIndex("PM2.5", 280);
assert(aqiSevere >= 401 && sevSevere === "SEVERE", `280 ug/m3 PM2.5 is SEVERE (AQI: ${aqiSevere})`);

// 7. Extreme Spike saturation test
const r7 = normalizeRawReading("PM2.5", "2850", "ug/m3");
assert(r7.validation_status === "INVALID_ANOMALY", "Reading > 2500 ug/m3 flagged as UNRELIABLE_SPIKE");
assert(r7.issue?.type === "UNRELIABLE_SPIKE", "Issue type is UNRELIABLE_SPIKE");

console.log("\n🎉 ALL UNIT CONVERTER TESTS PASSED SUCCESSFULLY!\n");
