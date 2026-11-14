import { AQISeverity, ValidationStatus, DataQualityIssueType } from "../types/decisionEngine.js";

// Gas Molecular Weights (g/mol) at 25°C, 1 atm
const MOLECULAR_WEIGHTS: Record<string, number> = {
  NO2: 46.01,
  SO2: 64.06,
  CO: 28.01,
  O3: 48.00,
  NH3: 17.03
};

const MOLAR_VOLUME_L = 24.45; // Liters at 25°C, 1 atm

export interface UnitConversionResult {
  normalized_value_ugm3: number | null;
  sub_index_aqi: number | null;
  aqi_severity: AQISeverity;
  validation_status: ValidationStatus;
  issue?: {
    type: DataQualityIssueType;
    explanation: string;
  };
}

/**
 * Standard CPCB Breakpoints for AQI calculation
 */
const BREAKPOINTS: Record<string, Array<{ c_low: number; c_high: number; i_low: number; i_high: number }>> = {
  "PM2.5": [
    { c_low: 0, c_high: 30, i_low: 0, i_high: 50 },
    { c_low: 31, c_high: 60, i_low: 51, i_high: 100 },
    { c_low: 61, c_high: 90, i_low: 101, i_high: 200 },
    { c_low: 91, c_high: 120, i_low: 201, i_high: 300 },
    { c_low: 121, c_high: 250, i_low: 301, i_high: 400 },
    { c_low: 251, c_high: 500, i_low: 401, i_high: 500 }
  ],
  "PM10": [
    { c_low: 0, c_high: 50, i_low: 0, i_high: 50 },
    { c_low: 51, c_high: 100, i_low: 51, i_high: 100 },
    { c_low: 101, c_high: 250, i_low: 101, i_high: 200 },
    { c_low: 251, c_high: 350, i_low: 201, i_high: 300 },
    { c_low: 351, c_high: 430, i_low: 301, i_high: 400 },
    { c_low: 431, c_high: 600, i_low: 401, i_high: 500 }
  ],
  "NO2": [
    { c_low: 0, c_high: 40, i_low: 0, i_high: 50 },
    { c_low: 41, c_high: 80, i_low: 51, i_high: 100 },
    { c_low: 81, c_high: 180, i_low: 101, i_high: 200 },
    { c_low: 181, c_high: 280, i_low: 201, i_high: 300 },
    { c_low: 281, c_high: 400, i_low: 301, i_high: 400 },
    { c_low: 401, c_high: 600, i_low: 401, i_high: 500 }
  ],
  "SO2": [
    { c_low: 0, c_high: 40, i_low: 0, i_high: 50 },
    { c_low: 41, c_high: 80, i_low: 51, i_high: 100 },
    { c_low: 81, c_high: 380, i_low: 101, i_high: 200 },
    { c_low: 381, c_high: 800, i_low: 201, i_high: 300 },
    { c_low: 801, c_high: 1600, i_low: 301, i_high: 400 },
    { c_low: 1601, c_high: 2000, i_low: 401, i_high: 500 }
  ],
  "CO": [
    // Note: CO raw often reported in mg/m3; breakpoints here are in ug/m3 (mg/m3 * 1000)
    { c_low: 0, c_high: 1000, i_low: 0, i_high: 50 },
    { c_low: 1001, c_high: 2000, i_low: 51, i_high: 100 },
    { c_low: 2001, c_high: 10000, i_low: 101, i_high: 200 },
    { c_low: 10001, c_high: 17000, i_low: 201, i_high: 300 },
    { c_low: 17001, c_high: 34000, i_low: 301, i_high: 400 },
    { c_low: 34001, c_high: 50000, i_low: 401, i_high: 500 }
  ],
  "O3": [
    { c_low: 0, c_high: 50, i_low: 0, i_high: 50 },
    { c_low: 51, c_high: 100, i_low: 51, i_high: 100 },
    { c_low: 101, c_high: 168, i_low: 101, i_high: 200 },
    { c_low: 169, c_high: 208, i_low: 201, i_high: 300 },
    { c_low: 209, c_high: 748, i_low: 301, i_high: 400 },
    { c_low: 749, c_high: 1000, i_low: 401, i_high: 500 }
  ]
};

/**
 * Calculates sub-index AQI for a given pollutant and concentration in ug/m3
 */
export function calculateSubIndex(pollutantNorm: string, concentrationUgM3: number): { aqi: number; severity: AQISeverity } {
  const bands = BREAKPOINTS[pollutantNorm];
  if (!bands) {
    // Fallback severity mapping
    return { aqi: Math.min(500, Math.round(concentrationUgM3)), severity: "MODERATE" };
  }

  for (const b of bands) {
    if (concentrationUgM3 >= b.c_low && concentrationUgM3 <= b.c_high) {
      const aqi = Math.round(((b.i_high - b.i_low) / (b.c_high - b.c_low)) * (concentrationUgM3 - b.c_low) + b.i_low);
      return { aqi, severity: getSeverityFromAQI(aqi) };
    }
  }

  // Above max breakpoint
  if (concentrationUgM3 > bands[bands.length - 1].c_high) {
    return { aqi: 500, severity: "SEVERE" };
  }

  return { aqi: 0, severity: "GOOD" };
}

export function getSeverityFromAQI(aqi: number): AQISeverity {
  if (aqi <= 50) return "GOOD";
  if (aqi <= 100) return "SATISFACTORY";
  if (aqi <= 200) return "MODERATE";
  if (aqi <= 300) return "POOR";
  if (aqi <= 400) return "VERY_POOR";
  return "SEVERE";
}

/**
 * Deterministically normalizes any raw value and unit into ug/m3
 */
export function normalizeRawReading(
  pollutantRaw: string,
  valueRaw: string,
  unitRaw: string
): UnitConversionResult {
  const cleanVal = (valueRaw || "").trim().toUpperCase();
  const cleanUnit = (unitRaw || "").trim().toLowerCase().replace(/[\^³]/g, "3");
  const normPollutant = pollutantRaw.trim().toUpperCase().replace(/[\s\-_]/g, "");

  // 1. Check for Hardware Error / Missing Values
  const nullPlaceholders = ["NA", "N/A", "NULL", "NONE", "OFFLINE", "NAN", "", "-", "--"];
  if (nullPlaceholders.includes(cleanVal)) {
    return {
      normalized_value_ugm3: null,
      sub_index_aqi: null,
      aqi_severity: "MODERATE",
      validation_status: "MISSING",
      issue: {
        type: "MISSING_DATA",
        explanation: `Value was reported as missing placeholder '${valueRaw}'`
      }
    };
  }

  // Error codes like -999, ERR, ERR_04
  if (cleanVal === "-999" || cleanVal === "-99" || cleanVal.startsWith("ERR")) {
    return {
      normalized_value_ugm3: null,
      sub_index_aqi: null,
      aqi_severity: "MODERATE",
      validation_status: "INVALID_ANOMALY",
      issue: {
        type: "HARDWARE_ERROR_CODE",
        explanation: `Sensor returned hardware fault code '${valueRaw}'; excluded from calculation.`
      }
    };
  }

  const numeric = parseFloat(cleanVal);
  if (isNaN(numeric)) {
    return {
      normalized_value_ugm3: null,
      sub_index_aqi: null,
      aqi_severity: "MODERATE",
      validation_status: "INVALID_ANOMALY",
      issue: {
        type: "MISSING_DATA",
        explanation: `Unable to parse '${valueRaw}' as a valid number.`
      }
    };
  }

  // 2. Check for Negative Physical Values
  if (numeric < 0) {
    return {
      normalized_value_ugm3: null,
      sub_index_aqi: null,
      aqi_severity: "MODERATE",
      validation_status: "INVALID_ANOMALY",
      issue: {
        type: "NEGATIVE_VALUE",
        explanation: `Negative concentration (${numeric}) violates physical bounds; sensor baseline drift likely.`
      }
    };
  }

  // 3. Deterministic Unit Conversion to ug/m3
  let ugm3: number | null = null;

  if (cleanUnit === "ug/m3" || cleanUnit === "µg/m3" || cleanUnit === "ugm3") {
    ugm3 = numeric;
  } else if (cleanUnit === "mg/m3" || cleanUnit === "mgm3") {
    ugm3 = numeric * 1000.0;
  } else if (cleanUnit === "ppm") {
    const mw = MOLECULAR_WEIGHTS[normPollutant];
    if (mw) {
      // ppm * (MW / 24.45) * 1000 = ug/m3
      ugm3 = numeric * (mw / MOLAR_VOLUME_L) * 1000.0;
    } else {
      // Default particulate fallback or unknown gas
      return {
        normalized_value_ugm3: null,
        sub_index_aqi: null,
        aqi_severity: "MODERATE",
        validation_status: "UNCALIBRATED",
        issue: {
          type: "UNKNOWN_UNIT",
          explanation: `Cannot convert unit 'ppm' for pollutant '${pollutantRaw}' without known molecular weight.`
        }
      };
    }
  } else if (cleanUnit === "ppb") {
    const mw = MOLECULAR_WEIGHTS[normPollutant];
    if (mw) {
      ugm3 = (numeric / 1000.0) * (mw / MOLAR_VOLUME_L) * 1000.0;
    } else {
      return {
        normalized_value_ugm3: null,
        sub_index_aqi: null,
        aqi_severity: "MODERATE",
        validation_status: "UNCALIBRATED",
        issue: {
          type: "UNKNOWN_UNIT",
          explanation: `Cannot convert unit 'ppb' for pollutant '${pollutantRaw}' without known molecular weight.`
        }
      };
    }
  } else {
    // If unit missing, try to infer based on magnitude
    if (cleanUnit === "" || cleanUnit === "unknown") {
      // For PM2.5/PM10, standard unit is ug/m3
      ugm3 = numeric;
    } else {
      return {
        normalized_value_ugm3: null,
        sub_index_aqi: null,
        aqi_severity: "MODERATE",
        validation_status: "UNCALIBRATED",
        issue: {
          type: "UNKNOWN_UNIT",
          explanation: `Unrecognized unit '${unitRaw}' for ${pollutantRaw}.`
        }
      };
    }
  }

  // 4. Extreme Spike Anomaly Check
  if (ugm3 !== null) {
    ugm3 = Math.round(ugm3 * 10) / 10; // Round to 1 decimal place

    // Extreme impossible ceiling check (e.g. PM > 2500 ug/m3 or NO2 > 3000 ug/m3)
    if (ugm3 > 2500) {
      return {
        normalized_value_ugm3: ugm3,
        sub_index_aqi: 500,
        aqi_severity: "SEVERE",
        validation_status: "INVALID_ANOMALY",
        issue: {
          type: "UNRELIABLE_SPIKE",
          explanation: `Extreme spike (${ugm3} ug/m3) exceeds realistic atmospheric ceiling; optical sensor saturation likely.`
        }
      };
    }

    const { aqi, severity } = calculateSubIndex(normPollutant, ugm3);
    return {
      normalized_value_ugm3: ugm3,
      sub_index_aqi: aqi,
      aqi_severity: severity,
      validation_status: "VALID"
    };
  }

  return {
    normalized_value_ugm3: null,
    sub_index_aqi: null,
    aqi_severity: "MODERATE",
    validation_status: "UNCALIBRATED"
  };
}
