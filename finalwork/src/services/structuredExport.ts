/**
 * Structured Audit & Telemetry Export Utility
 * Provides 1-click download of physical telemetry, hotspot flags, and dual advisories
 */

import { CivicBriefingOutput } from "../types/briefingSchema.js";
import { ClassifiedHotspot, DataQualityFlag, NormalizedReading, InstantTriageBanner } from "../types/decisionEngine.js";

export interface StructuredAuditPayload {
  metadata: {
    system: string;
    version: string;
    export_timestamp_iso: string;
    brief_reference_id: string;
    jurisdiction: string;
  };
  fast_triage: InstantTriageBanner;
  hotspot_classifications: ClassifiedHotspot[];
  data_quality_flags: DataQualityFlag[];
  cleaned_telemetry_table: NormalizedReading[];
  role_specific_actions?: CivicBriefingOutput["role_specific_actions"];
  citizen_advisories?: CivicBriefingOutput["dual_outputs"]["citizen_advisories"];
  internal_briefing_note?: CivicBriefingOutput["dual_outputs"]["internal_briefing_note"];
}

/**
 * Trigger browser download for any string blob
 */
function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 1-Click JSON Download of Full Structured Intelligence Package
 */
export function downloadStructuredAuditJson(payload: StructuredAuditPayload) {
  const filename = `civic-audit-${payload.metadata.brief_reference_id || "latest"}.json`;
  const jsonString = JSON.stringify(payload, null, 2);
  triggerFileDownload(jsonString, filename, "application/json");
}

/**
 * 1-Click CSV Download of Cleaned & Normalized Telemetry Table
 */
export function downloadCleanedTelemetryCsv(rows: NormalizedReading[], refId: string = "latest") {
  const headers = [
    "Row_ID",
    "Sensor_ID",
    "Ward_Name",
    "Timestamp_ISO",
    "Pollutant",
    "Raw_Value",
    "Raw_Unit",
    "Normalized_ugm3",
    "Sub_Index_AQI",
    "Severity",
    "Validation_Status"
  ];

  const csvRows = rows.map((r) => [
    `"${r.row_id}"`,
    `"${r.sensor_id}"`,
    `"${r.ward_name}"`,
    `"${r.timestamp_iso || ""}"`,
    `"${r.pollutant}"`,
    `"${r.raw_value}"`,
    `"${r.raw_unit}"`,
    r.normalized_value_ugm3 !== null ? r.normalized_value_ugm3 : "",
    r.sub_index_aqi !== null ? r.sub_index_aqi : "",
    `"${r.aqi_severity}"`,
    `"${r.validation_status}"`
  ].join(","));

  const csvContent = [headers.join(","), ...csvRows].join("\n");
  const filename = `civic-telemetry-cleaned-${refId}.csv`;
  triggerFileDownload(csvContent, filename, "text/csv;charset=utf-8;");
}
