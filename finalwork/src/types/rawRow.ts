import { z } from "zod";

/**
 * Raw Row extracted directly from messy tables/PDFs/images
 * Rule: Preserves exact original values and units without performing calculations
 */
export const RawRowSchema = z.object({
  row_id: z.string().describe("Unique identifier e.g. ROW_01, ROW_02"),
  sensor_id: z.string().describe("Sensor hardware ID or station label"),
  ward_name: z.string().describe("Civic ward, zone, or geographical sector name"),
  timestamp_raw: z.string().describe("Original timestamp string as appeared in input"),
  pollutant: z.string().describe("Target pollutant e.g. PM2.5, PM10, NO2, SO2, CO, O3, NH3"),
  raw_value: z.string().describe("Exact string representation of value e.g. '0.31', '-999', 'NA', '45.2'"),
  raw_unit: z.string().describe("Reported unit e.g. ug/m3, mg/m3, ppm, ppb, or missing"),
  wind_speed_ms: z.number().nullable().optional().describe("Wind speed in m/s if available"),
  wind_direction_deg: z.number().nullable().optional().describe("Wind direction in degrees 0-360 if available"),
  relative_humidity_pct: z.number().nullable().optional().describe("Relative humidity percentage if available"),
  temperature_c: z.number().nullable().optional().describe("Temperature in Celsius if available")
});

export type RawRow = z.infer<typeof RawRowSchema>;
