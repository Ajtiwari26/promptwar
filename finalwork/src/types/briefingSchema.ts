import { z } from "zod";
import { AQISeveritySchema, ValidationStatusSchema, DataQualityIssueTypeSchema } from "./decisionEngine.js";

export const BriefMetadataSchema = z.object({
  brief_id: z.string(),
  generated_at: z.string(),
  compared_with_brief_id: z.string().nullable()
});

export const CleanedReadingItemSchema = z.object({
  row_id: z.string(),
  sensor_id: z.string(),
  ward_name: z.string(),
  timestamp_iso: z.string(),
  pollutant: z.string(),
  raw_value: z.string(),
  raw_unit: z.string(),
  normalized_value_ugm3: z.number().nullable(),
  aqi_severity: AQISeveritySchema,
  validation_status: ValidationStatusSchema
});

export const DataQualityFlagItemSchema = z.object({
  row_id: z.string(),
  sensor_id: z.string(),
  issue_type: DataQualityIssueTypeSchema,
  raw_evidence: z.string(),
  explanation: z.string()
});

export const HotspotAndTrendItemSchema = z.object({
  hotspot_location: z.string(),
  finding_summary: z.string(),
  traceability_refs: z.array(z.string()).describe("Row IDs that support this finding")
});

export const ComparisonWithPreviousSchema = z.object({
  overall_trend: z.enum(["IMPROVED", "STABLE", "WORSENED", "NO_PREVIOUS_DATA"]),
  summary_of_changes: z.string(),
  new_sensor_failures: z.array(z.string()),
  hotspot_shifts: z.string()
});

export const ActionItemSchema = z.object({
  priority: z.enum(["IMMEDIATE", "HIGH", "MEDIUM"]),
  action: z.string(),
  traceability_refs: z.array(z.string()).describe("Row IDs justifying this action")
});

export const RoleSpecificActionsSchema = z.object({
  ward_officer: z.array(ActionItemSchema),
  housing_society: z.array(ActionItemSchema),
  school_principal: z.array(ActionItemSchema),
  gig_worker: z.array(ActionItemSchema).optional()
});

export const LanguageAdvisorySchema = z.object({
  child_friendly: z.string(),
  general_public: z.string(),
  sensitive_groups: z.string()
});

export const DualOutputsSchema = z.object({
  internal_briefing_note: z.object({
    executive_summary: z.string(),
    operational_checklist: z.array(z.string())
  }),
  citizen_advisories: z.object({
    en: LanguageAdvisorySchema,
    hi: LanguageAdvisorySchema,
    mr: LanguageAdvisorySchema.optional()
  }).and(z.record(LanguageAdvisorySchema).optional())
});

export const CivicBriefingOutputSchema = z.object({
  brief_metadata: BriefMetadataSchema,
  cleaned_readings: z.array(CleanedReadingItemSchema),
  data_quality_flags: z.array(DataQualityFlagItemSchema),
  hotspots_and_trends: z.array(HotspotAndTrendItemSchema),
  comparison_with_previous: ComparisonWithPreviousSchema,
  role_specific_actions: RoleSpecificActionsSchema,
  dual_outputs: DualOutputsSchema
});

export type CivicBriefingOutput = z.infer<typeof CivicBriefingOutputSchema>;
