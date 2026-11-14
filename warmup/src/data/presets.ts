import { RawRow } from "../types/rawRow.js";

/**
 * PRESET 1: Baseline Day
 * Normal moderate air quality across civic wards. All sensors operational.
 */
export const PRESET_BASELINE_DAY: RawRow[] = [
  {
    row_id: "ROW_01",
    sensor_id: "SNS_W01_01",
    ward_name: "Ward 1 - Green Belt",
    timestamp_raw: "2026-11-13T08:00:00Z",
    pollutant: "PM2.5",
    raw_value: "35.2",
    raw_unit: "ug/m3",
    wind_speed_ms: 2.5,
    wind_direction_deg: 180,
    relative_humidity_pct: 55,
    temperature_c: 24
  },
  {
    row_id: "ROW_02",
    sensor_id: "SNS_W01_01",
    ward_name: "Ward 1 - Green Belt",
    timestamp_raw: "2026-11-13T08:00:00Z",
    pollutant: "PM10",
    raw_value: "68.0",
    raw_unit: "ug/m3",
    wind_speed_ms: 2.5,
    relative_humidity_pct: 55
  },
  {
    row_id: "ROW_03",
    sensor_id: "SNS_W02_01",
    ward_name: "Ward 2 - Central Market",
    timestamp_raw: "2026-11-13T08:15:00Z",
    pollutant: "PM2.5",
    raw_value: "52.4",
    raw_unit: "ug/m3",
    wind_speed_ms: 1.8,
    relative_humidity_pct: 58
  },
  {
    row_id: "ROW_04",
    sensor_id: "SNS_W02_02",
    ward_name: "Ward 2 - Central Market",
    timestamp_raw: "2026-11-13T08:15:00Z",
    pollutant: "NO2",
    raw_value: "42.0",
    raw_unit: "ug/m3"
  },
  {
    row_id: "ROW_05",
    sensor_id: "SNS_W04_01",
    ward_name: "Ward 4 - Industrial Belt",
    timestamp_raw: "2026-11-13T08:30:00Z",
    pollutant: "PM2.5",
    raw_value: "75.0",
    raw_unit: "ug/m3",
    wind_speed_ms: 2.0,
    relative_humidity_pct: 50
  },
  {
    row_id: "ROW_06",
    sensor_id: "SNS_W04_01",
    ward_name: "Ward 4 - Industrial Belt",
    timestamp_raw: "2026-11-13T08:30:00Z",
    pollutant: "PM10",
    raw_value: "130.0",
    raw_unit: "ug/m3",
    wind_speed_ms: 2.0
  }
];

/**
 * PRESET 2: Crisis Day (Severe Spikes, Inconsistent Units, Inversion, Broken Sensor)
 * Triggers multiple Hotspot Archetypes simultaneously:
 * - Ward 4: Acute Combustion Spike (PM2.5 0.38 mg/m3 = 380 ug/m3)
 * - Ward 1: Coarse Construction Dust (PM10 340 ug/m3, PM2.5 80 ug/m3 -> ratio 0.23)
 * - Ward 2: Vehicular NO2 Spike (92 ug/m3) + Hardware Fault (-999 error on PM10)
 * - Ward 3: Inversion Trap (Wind 0.6 m/s, RH 78%, PM2.5 190 ug/m3)
 */
export const PRESET_CRISIS_DAY: RawRow[] = [
  // Ward 4 - Industrial Acute Combustion (Reported in mg/m3)
  {
    row_id: "ROW_10",
    sensor_id: "SNS_W04_01",
    ward_name: "Ward 4 - Industrial Belt",
    timestamp_raw: "2026-11-14T07:45:00Z",
    pollutant: "PM2.5",
    raw_value: "0.38",
    raw_unit: "mg/m3", // Unit conversion test: 0.38 mg/m3 -> 380 ug/m3
    wind_speed_ms: 0.8,
    relative_humidity_pct: 65,
    temperature_c: 16
  },
  {
    row_id: "ROW_11",
    sensor_id: "SNS_W04_01",
    ward_name: "Ward 4 - Industrial Belt",
    timestamp_raw: "2026-11-14T07:45:00Z",
    pollutant: "PM10",
    raw_value: "450.0",
    raw_unit: "ug/m3",
    wind_speed_ms: 0.8
  },
  {
    row_id: "ROW_12",
    sensor_id: "SNS_W04_02",
    ward_name: "Ward 4 - Industrial Belt",
    timestamp_raw: "2026-11-14T08:00:00Z",
    pollutant: "CO",
    raw_value: "2.8",
    raw_unit: "mg/m3" // 2.8 mg/m3 = 2800 ug/m3 (High combustion)
  },

  // Ward 1 - Construction Dust Resuspension
  {
    row_id: "ROW_13",
    sensor_id: "SNS_W01_02",
    ward_name: "Ward 1 - Green Belt North",
    timestamp_raw: "2026-11-14T08:15:00Z",
    pollutant: "PM10",
    raw_value: "360.0",
    raw_unit: "ug/m3",
    wind_speed_ms: 1.5,
    relative_humidity_pct: 45
  },
  {
    row_id: "ROW_14",
    sensor_id: "SNS_W01_02",
    ward_name: "Ward 1 - Green Belt North",
    timestamp_raw: "2026-11-14T08:15:00Z",
    pollutant: "PM2.5",
    raw_value: "78.0",
    raw_unit: "ug/m3" // Ratio 78/360 = 0.21 -> Coarse Construction Dust
  },

  // Ward 2 - Traffic Corridor + Hardware Fault
  {
    row_id: "ROW_15",
    sensor_id: "SNS_W02_01",
    ward_name: "Ward 2 - Central Junction",
    timestamp_raw: "2026-11-14T08:30:00Z",
    pollutant: "NO2",
    raw_value: "96.5",
    raw_unit: "ug/m3", // Vehicular hotspot trigger (>80)
    wind_speed_ms: 1.2
  },
  {
    row_id: "ROW_16",
    sensor_id: "SNS_W02_03",
    ward_name: "Ward 2 - Central Junction",
    timestamp_raw: "2026-11-14T08:30:00Z",
    pollutant: "PM10",
    raw_value: "-999", // HARDWARE ERROR ANOMALY
    raw_unit: "ug/m3"
  },

  // Ward 3 - Meteorological Inversion Trap
  {
    row_id: "ROW_17",
    sensor_id: "SNS_W03_01",
    ward_name: "Ward 3 - Valley Residential",
    timestamp_raw: "2026-11-14T08:45:00Z",
    pollutant: "PM2.5",
    raw_value: "195.0",
    raw_unit: "ug/m3",
    wind_speed_ms: 0.4, // Inversion trigger (<1.0 m/s)
    relative_humidity_pct: 82 // Inversion trigger (>70%)
  }
];

/**
 * PRESET 3: Post-Intervention Day
 * Demonstrates intervention success: anti-smog guns deployed, truck diversions active.
 */
export const PRESET_POST_INTERVENTION_DAY: RawRow[] = [
  {
    row_id: "ROW_20",
    sensor_id: "SNS_W04_01",
    ward_name: "Ward 4 - Industrial Belt",
    timestamp_raw: "2026-11-15T08:00:00Z",
    pollutant: "PM2.5",
    raw_value: "145.0", // Dropped from 380 -> 145 ug/m3 (-62%)
    raw_unit: "ug/m3",
    wind_speed_ms: 2.1,
    relative_humidity_pct: 48
  },
  {
    row_id: "ROW_21",
    sensor_id: "SNS_W04_01",
    ward_name: "Ward 4 - Industrial Belt",
    timestamp_raw: "2026-11-15T08:00:00Z",
    pollutant: "PM10",
    raw_value: "190.0",
    raw_unit: "ug/m3"
  },
  {
    row_id: "ROW_22",
    sensor_id: "SNS_W01_02",
    ward_name: "Ward 1 - Green Belt North",
    timestamp_raw: "2026-11-15T08:15:00Z",
    pollutant: "PM10",
    raw_value: "120.0", // Dropped from 360 -> 120 ug/m3 (-66% due to water mist cannons)
    raw_unit: "ug/m3"
  },
  {
    row_id: "ROW_23",
    sensor_id: "SNS_W02_03",
    ward_name: "Ward 2 - Central Junction",
    timestamp_raw: "2026-11-15T08:30:00Z",
    pollutant: "PM10",
    raw_value: "95.0", // Repaired sensor reading accurately
    raw_unit: "ug/m3"
  }
];
