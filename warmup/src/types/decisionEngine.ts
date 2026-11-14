import { z } from "zod";

export const AQISeveritySchema = z.enum([
  "GOOD",
  "SATISFACTORY",
  "MODERATE",
  "POOR",
  "VERY_POOR",
  "SEVERE"
]);
export type AQISeverity = z.infer<typeof AQISeveritySchema>;

export const ValidationStatusSchema = z.enum([
  "VALID",
  "INVALID_ANOMALY",
  "UNCALIBRATED",
  "MISSING"
]);
export type ValidationStatus = z.infer<typeof ValidationStatusSchema>;

export const DataQualityIssueTypeSchema = z.enum([
  "NEGATIVE_VALUE",
  "HARDWARE_ERROR_CODE",
  "UNRELIABLE_SPIKE",
  "SENSOR_FLATLINED",
  "MISSING_DATA",
  "UNKNOWN_UNIT"
]);
export type DataQualityIssueType = z.infer<typeof DataQualityIssueTypeSchema>;

export const NormalizedReadingSchema = z.object({
  row_id: z.string(),
  sensor_id: z.string(),
  ward_name: z.string(),
  timestamp_iso: z.string(),
  pollutant: z.string(),
  raw_value: z.string(),
  raw_unit: z.string(),
  normalized_value_ugm3: z.number().nullable(),
  sub_index_aqi: z.number().nullable(),
  aqi_severity: AQISeveritySchema,
  validation_status: ValidationStatusSchema
});
export type NormalizedReading = z.infer<typeof NormalizedReadingSchema>;

export const DataQualityFlagSchema = z.object({
  row_id: z.string(),
  sensor_id: z.string(),
  issue_type: DataQualityIssueTypeSchema,
  raw_evidence: z.string(),
  explanation: z.string()
});
export type DataQualityFlag = z.infer<typeof DataQualityFlagSchema>;

export const HotspotArchetypeSchema = z.enum([
  "COARSE_DUST_CONSTRUCTION",
  "ACUTE_COMBUSTION_BIOMASS",
  "VEHICULAR_TRAFFIC_CORRIDOR",
  "PHOTOCHEMICAL_OZONE",
  "METEOROLOGICAL_INVERSION_PLUME_SHIFT",
  "TELEMETRY_BLIND_SPOT"
]);
export type HotspotArchetype = z.infer<typeof HotspotArchetypeSchema>;

export const ClassifiedHotspotSchema = z.object({
  hotspot_id: z.string(),
  archetype: HotspotArchetypeSchema,
  ward_name: z.string(),
  trigger_reason: z.string(),
  severity: AQISeveritySchema,
  confidence_score: z.number().min(0).max(1),
  metrics_evidence: z.record(z.any()),
  traceability_refs: z.array(z.string()).describe("Row IDs that triggered this classification")
});
export type ClassifiedHotspot = z.infer<typeof ClassifiedHotspotSchema>;

export const InstantTriageBannerSchema = z.object({
  alert_level: z.enum(["NORMAL", "ADVISORY", "WARNING", "EMERGENCY_CRITICAL"]),
  primary_headline: z.string(),
  emergency_trigger_code: z.string().nullable().describe("e.g. GRAP_STAGE_IV or CPCB_SEVERE"),
  urgent_action_required: z.boolean(),
  detected_hotspots_count: z.number(),
  unreliable_sensors_count: z.number(),
  worst_affected_ward: z.string().nullable(),
  peak_pm25_ugm3: z.number().nullable()
});
export type InstantTriageBanner = z.infer<typeof InstantTriageBannerSchema>;

export const DecisionEngineOutputSchema = z.object({
  timestamp_evaluated: z.string(),
  instant_triage_banner: InstantTriageBannerSchema,
  normalized_readings: z.array(NormalizedReadingSchema),
  data_quality_flags: z.array(DataQualityFlagSchema),
  classified_hotspots: z.array(ClassifiedHotspotSchema),
  ward_aggregates: z.record(z.object({
    avg_pm25_ugm3: z.number().nullable(),
    avg_pm10_ugm3: z.number().nullable(),
    pm25_to_pm10_ratio: z.number().nullable(),
    dominant_pollutant: z.string().nullable(),
    composite_aqi: z.number().nullable(),
    severity: AQISeveritySchema,
    valid_readings_count: z.number(),
    flagged_readings_count: z.number()
  }))
});
export type DecisionEngineOutput = z.infer<typeof DecisionEngineOutputSchema>;
