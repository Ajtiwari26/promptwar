import { RawRow } from "../types/rawRow.js";
import {
  DecisionEngineOutput,
  NormalizedReading,
  DataQualityFlag,
  ClassifiedHotspot,
  InstantTriageBanner,
  AQISeverity
} from "../types/decisionEngine.js";
import { normalizeRawReading, getSeverityFromAQI } from "./unitConverter.js";

/**
 * Deterministic Decision Engine for Civic Air Quality
 * Executes locally in < 5ms without AI latency or hallucination.
 */
export function normalizeAndClassifyHotspots(
  rawRows: RawRow[],
  previousBriefJson?: string
): DecisionEngineOutput {
  const normalizedReadings: NormalizedReading[] = [];
  const dataQualityFlags: DataQualityFlag[] = [];
  const classifiedHotspots: ClassifiedHotspot[] = [];

  // Group readings by sensor to detect flatlining / zero-variance hardware faults
  const sensorHistory: Record<string, number[]> = {};

  // 1. Normalize each row and detect row-level anomalies
  for (const raw of rawRows) {
    const conv = normalizeRawReading(raw.pollutant, raw.raw_value, raw.raw_unit);

    const normReading: NormalizedReading = {
      row_id: raw.row_id,
      sensor_id: raw.sensor_id,
      ward_name: raw.ward_name,
      timestamp_iso: raw.timestamp_raw,
      pollutant: raw.pollutant,
      raw_value: raw.raw_value,
      raw_unit: raw.raw_unit,
      normalized_value_ugm3: conv.normalized_value_ugm3,
      sub_index_aqi: conv.sub_index_aqi,
      aqi_severity: conv.aqi_severity,
      validation_status: conv.validation_status
    };
    normalizedReadings.push(normReading);

    if (conv.issue) {
      dataQualityFlags.push({
        row_id: raw.row_id,
        sensor_id: raw.sensor_id,
        issue_type: conv.issue.type,
        raw_evidence: `${raw.pollutant} recorded as '${raw.raw_value} ${raw.raw_unit}' at ${raw.timestamp_raw}`,
        explanation: conv.issue.explanation
      });
    }

    if (conv.normalized_value_ugm3 !== null && conv.validation_status === "VALID") {
      if (!sensorHistory[raw.sensor_id]) {
        sensorHistory[raw.sensor_id] = [];
      }
      sensorHistory[raw.sensor_id].push(conv.normalized_value_ugm3);
    }
  }

  // 2. Check for Flatlined Sensors (Zero variance over >= 4 readings)
  for (const [sensorId, values] of Object.entries(sensorHistory)) {
    if (values.length >= 4) {
      const allEqual = values.every(v => v === values[0]);
      if (allEqual && values[0] > 0) {
        const matchingRow = normalizedReadings.find(r => r.sensor_id === sensorId);
        if (matchingRow) {
          matchingRow.validation_status = "UNCALIBRATED";
          dataQualityFlags.push({
            row_id: matchingRow.row_id,
            sensor_id: sensorId,
            issue_type: "SENSOR_FLATLINED",
            raw_evidence: `Sensor recorded exactly ${values[0]} ug/m3 across ${values.length} consecutive readings`,
            explanation: "Zero-variance output detected; optical sensor chamber or ADC may be stuck."
          });
        }
      }
    }
  }

  // 3. Aggregate metrics by Ward
  interface WardAccumulator {
    pm25Vals: { val: number; row_id: string }[];
    pm10Vals: { val: number; row_id: string }[];
    no2Vals: { val: number; row_id: string }[];
    so2Vals: { val: number; row_id: string }[];
    coVals: { val: number; row_id: string }[];
    o3Vals: { val: number; row_id: string }[];
    windSpeeds: number[];
    humidities: number[];
    timestamps: string[];
    validCount: number;
    flaggedCount: number;
    rows: string[];
    sensors: Set<string>;
    flaggedSensors: Set<string>;
  }

  const wardMap: Record<string, WardAccumulator> = {};

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const norm = normalizedReadings[i];
    const ward = raw.ward_name;

    if (!wardMap[ward]) {
      wardMap[ward] = {
        pm25Vals: [],
        pm10Vals: [],
        no2Vals: [],
        so2Vals: [],
        coVals: [],
        o3Vals: [],
        windSpeeds: [],
        humidities: [],
        timestamps: [],
        validCount: 0,
        flaggedCount: 0,
        rows: [],
        sensors: new Set(),
        flaggedSensors: new Set()
      };
    }

    wardMap[ward].rows.push(raw.row_id);
    wardMap[ward].sensors.add(raw.sensor_id);
    wardMap[ward].timestamps.push(raw.timestamp_raw);

    if (raw.wind_speed_ms !== undefined && raw.wind_speed_ms !== null) {
      wardMap[ward].windSpeeds.push(raw.wind_speed_ms);
    }
    if (raw.relative_humidity_pct !== undefined && raw.relative_humidity_pct !== null) {
      wardMap[ward].humidities.push(raw.relative_humidity_pct);
    }

    if (norm.validation_status === "VALID" && norm.normalized_value_ugm3 !== null) {
      wardMap[ward].validCount++;
      const p = raw.pollutant.toUpperCase().replace(/[\s\-_]/g, "");
      if (p === "PM2.5") wardMap[ward].pm25Vals.push({ val: norm.normalized_value_ugm3, row_id: raw.row_id });
      else if (p === "PM10") wardMap[ward].pm10Vals.push({ val: norm.normalized_value_ugm3, row_id: raw.row_id });
      else if (p === "NO2") wardMap[ward].no2Vals.push({ val: norm.normalized_value_ugm3, row_id: raw.row_id });
      else if (p === "SO2") wardMap[ward].so2Vals.push({ val: norm.normalized_value_ugm3, row_id: raw.row_id });
      else if (p === "CO") wardMap[ward].coVals.push({ val: norm.normalized_value_ugm3, row_id: raw.row_id });
      else if (p === "O3") wardMap[ward].o3Vals.push({ val: norm.normalized_value_ugm3, row_id: raw.row_id });
    } else {
      wardMap[ward].flaggedCount++;
      wardMap[ward].flaggedSensors.add(raw.sensor_id);
    }
  }

  // 4. Calculate Ward Aggregates and Classify 6 Hotspot Archetypes
  const wardAggregates: DecisionEngineOutput["ward_aggregates"] = {};
  let overallPeakPM25 = 0;
  let worstWard: string | null = null;
  let highestCompositeAQI = 0;

  for (const [ward, data] of Object.entries(wardMap)) {
    const avgPM25 = data.pm25Vals.length > 0
      ? Math.round((data.pm25Vals.reduce((a, b) => a + b.val, 0) / data.pm25Vals.length) * 10) / 10
      : null;
    const avgPM10 = data.pm10Vals.length > 0
      ? Math.round((data.pm10Vals.reduce((a, b) => a + b.val, 0) / data.pm10Vals.length) * 10) / 10
      : null;
    const avgNO2 = data.no2Vals.length > 0
      ? Math.round((data.no2Vals.reduce((a, b) => a + b.val, 0) / data.no2Vals.length) * 10) / 10
      : null;
    const avgCO = data.coVals.length > 0
      ? Math.round((data.coVals.reduce((a, b) => a + b.val, 0) / data.coVals.length) * 10) / 10
      : null;
    const avgO3 = data.o3Vals.length > 0
      ? Math.round((data.o3Vals.reduce((a, b) => a + b.val, 0) / data.o3Vals.length) * 10) / 10
      : null;
    const avgWindSpeed = data.windSpeeds.length > 0
      ? data.windSpeeds.reduce((a, b) => a + b, 0) / data.windSpeeds.length
      : null;
    const avgHumidity = data.humidities.length > 0
      ? data.humidities.reduce((a, b) => a + b, 0) / data.humidities.length
      : null;

    const pmRatio = (avgPM25 !== null && avgPM10 !== null && avgPM10 > 0)
      ? Math.round((avgPM25 / avgPM10) * 100) / 100
      : null;

    // Calculate composite AQI as the max sub-index among available pollutants
    let wardMaxAQI = 0;
    let dominantPollutant: string | null = null;

    if (avgPM25 !== null) {
      const aqi25 = normalizedReadings.find(r => r.ward_name === ward && r.pollutant.toUpperCase().includes("2.5"))?.sub_index_aqi || 0;
      if (aqi25 > wardMaxAQI) { wardMaxAQI = aqi25; dominantPollutant = "PM2.5"; }
    }
    if (avgPM10 !== null) {
      const aqi10 = normalizedReadings.find(r => r.ward_name === ward && r.pollutant.toUpperCase().includes("10"))?.sub_index_aqi || 0;
      if (aqi10 > wardMaxAQI) { wardMaxAQI = aqi10; dominantPollutant = "PM10"; }
    }
    if (avgNO2 !== null) {
      const aqiNO2 = normalizedReadings.find(r => r.ward_name === ward && r.pollutant.toUpperCase().includes("NO2"))?.sub_index_aqi || 0;
      if (aqiNO2 > wardMaxAQI) { wardMaxAQI = aqiNO2; dominantPollutant = "NO2"; }
    }

    const severity = getSeverityFromAQI(wardMaxAQI);

    wardAggregates[ward] = {
      avg_pm25_ugm3: avgPM25,
      avg_pm10_ugm3: avgPM10,
      pm25_to_pm10_ratio: pmRatio,
      dominant_pollutant: dominantPollutant,
      composite_aqi: wardMaxAQI,
      severity,
      valid_readings_count: data.validCount,
      flagged_readings_count: data.flaggedCount
    };

    if (avgPM25 !== null && avgPM25 > overallPeakPM25) {
      overallPeakPM25 = avgPM25;
    }
    if (wardMaxAQI > highestCompositeAQI) {
      highestCompositeAQI = wardMaxAQI;
      worstWard = ward;
    }

    // --- ARCHETYPE 1: Coarse Dust & Construction Hotspot ---
    // PM10 > 250 ug/m3 AND PM2.5 / PM10 < 0.40
    if (avgPM10 !== null && avgPM10 > 250 && pmRatio !== null && pmRatio < 0.40) {
      classifiedHotspots.push({
        hotspot_id: `HS_DUST_${ward.replace(/\s+/g, "_")}`,
        archetype: "COARSE_DUST_CONSTRUCTION",
        ward_name: ward,
        trigger_reason: `High PM10 (${avgPM10} ug/m3) with low PM2.5/PM10 ratio (${pmRatio}) indicates heavy coarse fugitive dust and unpaved excavation.`,
        severity: avgPM10 > 400 ? "SEVERE" : "VERY_POOR",
        confidence_score: 0.95,
        metrics_evidence: { avgPM10, pmRatio, threshold_pm10: 250, threshold_ratio: 0.40 },
        traceability_refs: data.pm10Vals.map(v => v.row_id)
      });
    }

    // --- ARCHETYPE 2: Acute Combustion & Biomass Burning Hotspot ---
    // PM2.5 > 180 ug/m3 AND PM2.5 / PM10 > 0.65
    if (avgPM25 !== null && avgPM25 > 180 && pmRatio !== null && pmRatio > 0.65) {
      classifiedHotspots.push({
        hotspot_id: `HS_COMBUSTION_${ward.replace(/\s+/g, "_")}`,
        archetype: "ACUTE_COMBUSTION_BIOMASS",
        ward_name: ward,
        trigger_reason: `High PM2.5 (${avgPM25} ug/m3) with fine particulate ratio (${pmRatio}) confirms acute combustion plume (open biomass fires or heavy diesel gensets).`,
        severity: avgPM25 > 250 ? "SEVERE" : "VERY_POOR",
        confidence_score: 0.92,
        metrics_evidence: { avgPM25, pmRatio, threshold_pm25: 180, threshold_ratio: 0.65 },
        traceability_refs: data.pm25Vals.map(v => v.row_id)
      });
    }

    // --- ARCHETYPE 3: Vehicular / Traffic Corridor Hotspot ---
    // NO2 > 80 ug/m3 OR CO > 2000 ug/m3 (2.0 mg/m3)
    if ((avgNO2 !== null && avgNO2 > 80) || (avgCO !== null && avgCO > 2000)) {
      const refs = [...data.no2Vals.map(v => v.row_id), ...data.coVals.map(v => v.row_id)];
      classifiedHotspots.push({
        hotspot_id: `HS_TRAFFIC_${ward.replace(/\s+/g, "_")}`,
        archetype: "VEHICULAR_TRAFFIC_CORRIDOR",
        ward_name: ward,
        trigger_reason: `Elevated NO2 (${avgNO2 || 'N/A'} ug/m3) and/or CO (${avgCO || 'N/A'} ug/m3) indicates severe vehicular congestion and diesel idling bottleneck.`,
        severity: "POOR",
        confidence_score: 0.88,
        metrics_evidence: { avgNO2, avgCO },
        traceability_refs: refs.length > 0 ? refs : data.rows
      });
    }

    // --- ARCHETYPE 4: Photochemical Ozone (O3) Hotspot ---
    // O3 > 100 ug/m3
    if (avgO3 !== null && avgO3 > 100) {
      classifiedHotspots.push({
        hotspot_id: `HS_OZONE_${ward.replace(/\s+/g, "_")}`,
        archetype: "PHOTOCHEMICAL_OZONE",
        ward_name: ward,
        trigger_reason: `High ground-level Ozone (${avgO3} ug/m3) detected; secondary photochemical smog forming under solar radiation.`,
        severity: avgO3 > 168 ? "VERY_POOR" : "MODERATE",
        confidence_score: 0.85,
        metrics_evidence: { avgO3, threshold_o3: 100 },
        traceability_refs: data.o3Vals.map(v => v.row_id)
      });
    }

    // --- ARCHETYPE 5: Meteorological Inversion & Plume-Shift Hotspot ---
    // Wind Speed < 1.0 m/s AND Relative Humidity > 70%
    if (avgWindSpeed !== null && avgWindSpeed < 1.0 && avgHumidity !== null && avgHumidity > 70 && (avgPM25 || 0) > 120) {
      classifiedHotspots.push({
        hotspot_id: `HS_INVERSION_${ward.replace(/\s+/g, "_")}`,
        archetype: "METEOROLOGICAL_INVERSION_PLUME_SHIFT",
        ward_name: ward,
        trigger_reason: `Calm stagnant winds (${avgWindSpeed} m/s) with high humidity (${avgHumidity}%) create a thermal inversion trap, preventing particulate dispersion.`,
        severity: "VERY_POOR",
        confidence_score: 0.90,
        metrics_evidence: { avgWindSpeed, avgHumidity, avgPM25 },
        traceability_refs: data.rows
      });
    }

    // --- ARCHETYPE 6: Telemetry Blind-Spot Hotspot ---
    // Flagged count / total > 30% OR flagged sensors > 0
    const totalWardReadings = data.validCount + data.flaggedCount;
    const failureRate = totalWardReadings > 0 ? data.flaggedCount / totalWardReadings : 0;
    if (failureRate >= 0.30 || data.flaggedSensors.size > 0) {
      const flaggedRowRefs = dataQualityFlags
        .filter(f => data.rows.includes(f.row_id))
        .map(f => f.row_id);

      classifiedHotspots.push({
        hotspot_id: `HS_BLINDSPOT_${ward.replace(/\s+/g, "_")}`,
        archetype: "TELEMETRY_BLIND_SPOT",
        ward_name: ward,
        trigger_reason: `Ward data integrity compromised (${Math.round(failureRate * 100)}% failure rate, ${data.flaggedSensors.size} sensor errors detected); unverified telemetry blind spot.`,
        severity: "MODERATE",
        confidence_score: 0.99,
        metrics_evidence: { failureRate, flaggedSensors: Array.from(data.flaggedSensors) },
        traceability_refs: flaggedRowRefs.length > 0 ? flaggedRowRefs : data.rows
      });
    }
  }

  // 5. Generate Instant Triage Banner (< 5ms response)
  let alertLevel: InstantTriageBanner["alert_level"] = "NORMAL";
  let emergencyCode: string | null = null;
  let headline = "Air Quality within Acceptable Baseline Limits";
  let urgent = false;

  if (highestCompositeAQI >= 401 || overallPeakPM25 >= 250) {
    alertLevel = "EMERGENCY_CRITICAL";
    emergencyCode = "GRAP_STAGE_IV_SEVERE_PLUS";
    headline = `CRITICAL CIVIC ALERT: Severe Air Emergency in ${worstWard || 'Multiple Wards'} (Peak PM2.5: ${overallPeakPM25} ug/m3). Immediate enforcement mandated.`;
    urgent = true;
  } else if (highestCompositeAQI >= 301 || overallPeakPM25 >= 121) {
    alertLevel = "WARNING";
    emergencyCode = "GRAP_STAGE_III_VERY_POOR";
    headline = `HIGH WARNING: Very Poor Air Quality concentrated in ${worstWard || 'Target Zones'}. Precautionary curbs required.`;
    urgent = true;
  } else if (highestCompositeAQI >= 201 || overallPeakPM25 >= 61) {
    alertLevel = "ADVISORY";
    headline = `Civic Advisory: Moderate air pollution detected in ${worstWard || 'Local Zones'}. Sensitive groups advised caution.`;
  }

  const instantTriageBanner: InstantTriageBanner = {
    alert_level: alertLevel,
    primary_headline: headline,
    emergency_trigger_code: emergencyCode,
    urgent_action_required: urgent,
    detected_hotspots_count: classifiedHotspots.length,
    unreliable_sensors_count: dataQualityFlags.length,
    worst_affected_ward: worstWard,
    peak_pm25_ugm3: overallPeakPM25 > 0 ? overallPeakPM25 : null
  };

  return {
    timestamp_evaluated: new Date().toISOString(),
    instant_triage_banner: instantTriageBanner,
    normalized_readings: normalizedReadings,
    data_quality_flags: dataQualityFlags,
    classified_hotspots: classifiedHotspots,
    ward_aggregates: wardAggregates
  };
}
