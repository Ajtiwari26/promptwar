import { RawRow } from "../types/rawRow.js";

/**
 * Universal Deterministic Parser for Civic Air Quality Data
 * Supports: CSV, TSV, XML, JSON, and unstructured WhatsApp field logs.
 */
export function parseUniversalTelemetry(rawInput: string): RawRow[] {
  if (!rawInput || typeof rawInput !== "string") return [];
  const trimmed = rawInput.trim();

  // 1. JSON Payload Detection
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      const parsed = JSON.parse(trimmed);
      return parseJsonTelemetry(parsed);
    } catch {
      // Fall through to text parsing
    }
  }

  // 2. XML Payload Detection
  if (trimmed.startsWith("<?xml") || (trimmed.startsWith("<") && trimmed.includes("</"))) {
    const xmlRows = parseXmlTelemetry(trimmed);
    if (xmlRows.length > 0) return xmlRows;
  }

  // 3. Tabular CSV / TSV Detection
  const tabularRows = parseTabularTelemetry(trimmed);
  if (tabularRows.length > 0) return tabularRows;

  // 4. WhatsApp / Field Staff Chat Log Fallback
  return parseWhatsAppChatLog(trimmed);
}

/**
 * 1. JSON Telemetry Parser
 */
function parseJsonTelemetry(data: any): RawRow[] {
  const rows: RawRow[] = [];
  let rowCounter = 1;

  function traverse(obj: any, currentWard = "Civic Sector", currentSensor = "SNS_GENERIC") {
    if (!obj || typeof obj !== "object") return;

    if (Array.isArray(obj)) {
      for (const item of obj) traverse(item, currentWard, currentSensor);
      return;
    }

    const ward = obj.loc_ward || obj.ward || obj.ward_name || currentWard;
    const sensor = obj.sensor_id || obj.station_id || obj.id || currentSensor;

    // Check for metrics object e.g. { "PM2.5": { val: 0.38, unit: "mg/m3" } }
    if (obj.metrics && typeof obj.metrics === "object") {
      const ws = obj.weather?.ws || obj.weather?.wind_speed || null;
      const rh = obj.weather?.rh || obj.weather?.humidity || null;

      for (const [pollutant, metricData] of Object.entries(obj.metrics)) {
        const m = metricData as any;
        const val = typeof m === "object" ? String(m.val ?? m.value ?? "") : String(m);
        const unit = typeof m === "object" ? String(m.unit ?? "ug/m3") : "ug/m3";

        rows.push({
          row_id: `ROW_${String(rowCounter++).padStart(2, "0")}`,
          sensor_id: sensor,
          ward_name: ward,
          timestamp_raw: obj.time || new Date().toISOString(),
          pollutant,
          raw_value: val,
          raw_unit: unit,
          wind_speed_ms: ws !== null ? Number(ws) : undefined,
          relative_humidity_pct: rh !== null ? Number(rh) : undefined
        });
      }
      return;
    }

    // Direct row object e.g. { ward: "Ward 4", pollutant: "PM2.5", value: "340" }
    if (obj.pollutant && (obj.value !== undefined || obj.raw_value !== undefined || obj.reading !== undefined)) {
      rows.push({
        row_id: `ROW_${String(rowCounter++).padStart(2, "0")}`,
        sensor_id: sensor,
        ward_name: ward,
        timestamp_raw: String(obj.timestamp || obj.time || new Date().toISOString()),
        pollutant: String(obj.pollutant),
        raw_value: String(obj.value ?? obj.raw_value ?? obj.reading ?? ""),
        raw_unit: String(obj.unit ?? obj.raw_unit ?? "ug/m3"),
        wind_speed_ms: obj.wind_speed ? Number(obj.wind_speed) : undefined,
        relative_humidity_pct: obj.humidity ? Number(obj.humidity) : undefined
      });
      return;
    }

    // Recurse into nested keys
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "object") {
        traverse(obj[key], ward, sensor);
      }
    }
  }

  traverse(data);
  return rows;
}

/**
 * 2. XML Telemetry Parser (Lightweight, robust regex-based XML extraction)
 */
function parseXmlTelemetry(xml: string): RawRow[] {
  const rows: RawRow[] = [];
  let rowCounter = 1;

  // Match Station elements
  const stationRegex = /<Station\s+[^>]*id=["']([^"']+)["'][^>]*ward=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Station>/gi;
  let match: RegExpExecArray | null;

  while ((match = stationRegex.exec(xml)) !== null) {
    const sensorId = match[1];
    const wardName = match[2];
    const content = match[3];

    // Extract time and weather
    const timeMatch = /time=["']([^"']+)["']/i.exec(content);
    const time = timeMatch ? timeMatch[1] : new Date().toISOString();

    const wsMatch = /windSpeed=["']([^"']+)["']/i.exec(content);
    const ws = wsMatch ? parseFloat(wsMatch[1]) : undefined;

    const rhMatch = /humidity=["']([^"']+)["']/i.exec(content);
    const rh = rhMatch ? parseFloat(rhMatch[1]) : undefined;

    // Match Pollutant tags: <Pollutant name="PM2.5" unit="mg/m3">0.39</Pollutant>
    const pollutantRegex = /<Pollutant\s+[^>]*name=["']([^"']+)["'][^>]*unit=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Pollutant>/gi;
    let pMatch: RegExpExecArray | null;

    while ((pMatch = pollutantRegex.exec(content)) !== null) {
      const pollutant = pMatch[1];
      const unit = pMatch[2];
      const val = pMatch[3].trim();

      rows.push({
        row_id: `ROW_${String(rowCounter++).padStart(2, "0")}`,
        sensor_id: sensorId,
        ward_name: wardName,
        timestamp_raw: time,
        pollutant,
        raw_value: val,
        raw_unit: unit,
        wind_speed_ms: ws,
        relative_humidity_pct: rh
      });
    }
  }

  return rows;
}

/**
 * 3. Tabular CSV / TSV Parser with Dirty Header & Footer Neutralization
 */
function parseTabularTelemetry(text: string): RawRow[] {
  const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (rawLines.length < 2) return [];

  // Filter out leading comment lines and find the actual header row
  let headerIndex = -1;
  let delimiter = ",";

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (line.startsWith("#") || line.startsWith("//") || line.startsWith("---")) continue;

    // Detect delimiter
    const commaCount = (line.match(/,/g) || []).length;
    const tabCount = (line.match(/\t/g) || []).length;
    const semiCount = (line.match(/;/g) || []).length;

    const maxSep = Math.max(commaCount, tabCount, semiCount);
    if (maxSep >= 2) {
      if (tabCount > commaCount && tabCount > semiCount) delimiter = "\t";
      else if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
      else delimiter = ",";

      const lower = line.toLowerCase();
      // Check if line looks like a header (contains at least 2 relevant column names)
      const keywords = ["ward", "station", "sensor", "pollutant", "reading", "value", "unit", "time", "date"];
      const matches = keywords.filter(k => lower.includes(k));
      if (matches.length >= 2) {
        headerIndex = i;
        break;
      }
    }
  }

  if (headerIndex === -1) return [];

  const headers = rawLines[headerIndex].split(delimiter).map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
  
  // Find column indices
  const wardIdx = headers.findIndex(h => h.includes("ward") || h.includes("location") || h.includes("loc") || h.includes("area"));
  const sensorIdx = headers.findIndex(h => h.includes("station") || h.includes("sensor") || h.includes("id") || h.includes("device"));
  const timeIdx = headers.findIndex(h => h.includes("time") || h.includes("date") || h.includes("timestamp"));
  const pollutantIdx = headers.findIndex(h => h.includes("pollutant") || h.includes("parameter") || h.includes("gas"));
  const valueIdx = headers.findIndex(h => h.includes("reading") || h.includes("value") || h.includes("val") || h.includes("conc"));
  const unitIdx = headers.findIndex(h => h.includes("unit"));
  const wsIdx = headers.findIndex(h => h.includes("wind") || h.includes("speed"));
  const rhIdx = headers.findIndex(h => h.includes("humid") || h.includes("rh"));

  const rows: RawRow[] = [];
  let rowCounter = 1;

  for (let i = headerIndex + 1; i < rawLines.length; i++) {
    const line = rawLines[i];
    // Skip comment lines, divider lines, and trailing footers
    if (line.startsWith("#") || line.startsWith("//") || line.startsWith("---") || line.toLowerCase().includes("verified by") || line.toLowerCase().includes("end of")) {
      continue;
    }

    const parts = line.split(delimiter).map(p => p.trim().replace(/^['"]|['"]$/g, ""));
    if (parts.length < 3) continue;

    const ward = wardIdx !== -1 && parts[wardIdx] ? parts[wardIdx] : "Civic Ward";
    const sensor = sensorIdx !== -1 && parts[sensorIdx] ? parts[sensorIdx] : `SNS_${rowCounter}`;
    const time = timeIdx !== -1 && parts[timeIdx] ? parts[timeIdx] : new Date().toISOString();
    const pollutant = pollutantIdx !== -1 && parts[pollutantIdx] ? parts[pollutantIdx] : "PM2.5";
    const val = valueIdx !== -1 && parts[valueIdx] ? parts[valueIdx] : "";
    const unit = unitIdx !== -1 && parts[unitIdx] ? parts[unitIdx] : "ug/m3";
    const ws = wsIdx !== -1 && parts[wsIdx] ? parseFloat(parts[wsIdx]) : undefined;
    const rh = rhIdx !== -1 && parts[rhIdx] ? parseFloat(parts[rhIdx]) : undefined;

    if (!val) continue;

    rows.push({
      row_id: `ROW_${String(rowCounter++).padStart(2, "0")}`,
      sensor_id: sensor,
      ward_name: ward,
      timestamp_raw: time,
      pollutant,
      raw_value: val,
      raw_unit: unit,
      wind_speed_ms: isNaN(ws as number) ? undefined : ws,
      relative_humidity_pct: isNaN(rh as number) ? undefined : rh
    });
  }

  return rows;
}

/**
 * 4. WhatsApp / Field Staff Chat Log Parser
 */
function parseWhatsAppChatLog(text: string): RawRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const rows: RawRow[] = [];
  let rowCounter = 1;

  for (const line of lines) {
    // Extract sensor ID e.g. SNS_W04_01 or SNS-01
    const sensorMatch = /(SNS[-_][A-Z0-9]+(?:[-_][0-9]+)?)/i.exec(line);
    const sensorId = sensorMatch ? sensorMatch[1].toUpperCase() : `SNS_FIELD_${rowCounter}`;

    // Extract Ward e.g. Ward 4, Ward-1, Sector 1
    const wardMatch = /(Ward[\s\-_]?[0-9]+(?:\s*-\s*[A-Za-z\s]+)?|Sector[\s\-_]?[0-9]+)/i.exec(line);
    const wardName = wardMatch ? wardMatch[1].trim() : "Monitored Zone";

    // Extract time e.g. 08:00 AM or [14/11/2026, 08:05]
    const timeMatch = /(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)/i.exec(line);
    const time = timeMatch ? timeMatch[1] : "08:00";

    // Extract weather
    const wsMatch = /wind\s*(?:speed)?\s*(?:is|around|at)?\s*([0-9.]+)\s*m\/s/i.exec(line);
    const ws = wsMatch ? parseFloat(wsMatch[1]) : undefined;

    const rhMatch = /humidity\s*(?:is|around|at)?\s*([0-9.]+)\s*%/i.exec(line);
    const rh = rhMatch ? parseFloat(rhMatch[1]) : undefined;

    // Check for hardware error codes e.g. error code -999, ERR_04
    if (line.includes("-999") || line.includes("ERR_") || line.toLowerCase().includes("not responding")) {
      rows.push({
        row_id: `ROW_${String(rowCounter++).padStart(2, "0")}`,
        sensor_id: sensorId,
        ward_name: wardName,
        timestamp_raw: time,
        pollutant: line.includes("PM10") ? "PM10" : line.includes("PM2.5") ? "PM2.5" : "PM10",
        raw_value: "-999",
        raw_unit: "ug/m3",
        wind_speed_ms: ws,
        relative_humidity_pct: rh
      });
      continue;
    }

    // Match pollutant readings e.g. PM2.5 = 0.42 mg/m3, PM10 is 510 ug/m3, NO2 reading 95 ug/m3
    const metricMatches = line.matchAll(/(PM2\.5|PM10|NO2|SO2|CO|O3)\s*(?:=|is|at|reading)?\s*([0-9.]+)\s*(mg\/m3|ug\/m3|ppm|ppb)/gi);

    for (const m of metricMatches) {
      const pollutant = m[1].toUpperCase();
      const val = m[2];
      const unit = m[3].toLowerCase();

      rows.push({
        row_id: `ROW_${String(rowCounter++).padStart(2, "0")}`,
        sensor_id: sensorId,
        ward_name: wardName,
        timestamp_raw: time,
        pollutant,
        raw_value: val,
        raw_unit: unit,
        wind_speed_ms: ws,
        relative_humidity_pct: rh
      });
    }
  }

  return rows;
}
