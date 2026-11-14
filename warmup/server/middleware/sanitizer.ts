import { Request, Response, NextFunction } from "express";

/**
 * Sanitizes input strings against CSV formula injection
 * Strips leading '=', '+', '@', or '-' when immediately followed by alphabetic formula syntax,
 * while safely preserving valid negative numbers like -999, -15.4
 */
export function sanitizeCsvFormula(value: string): string {
  if (!value || typeof value !== "string") return value;

  const trimmed = value.trim();

  // If it's a valid negative number, keep it intact (e.g. -999, -12.4)
  if (/^-\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed;
  }

  // If it starts with formula characters (=, +, @, or - followed by letters)
  if (/^[=+@]/.test(trimmed) || /^-[a-zA-Z]/.test(trimmed)) {
    return `'` + trimmed; // Prepend apostrophe to neutralize formula execution in spreadsheets
  }

  return trimmed;
}

/**
 * Wraps raw text in XML boundaries to prevent prompt escape injection
 */
export function wrapInSensorDataBoundaries(rawText: string): string {
  if (!rawText) return "";
  // Strip any closing tags injected by the user
  const sanitized = rawText.replace(/<\/raw_sensor_data>/gi, "");
  return `<raw_sensor_data>\n${sanitized}\n</raw_sensor_data>`;
}

/**
 * Express middleware to validate payload size and sanitize strings
 */
export function payloadSanitizer(req: Request, res: Response, next: NextFunction): void {
  // Max payload size 5MB
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  if (contentLength > 5 * 1024 * 1024) {
    res.status(413).json({ error: "Payload exceeds 5MB size limit" });
    return;
  }

  if (req.body && typeof req.body.text === "string") {
    // Sanitize formula triggers across rows
    const lines = req.body.text.split("\n");
    const sanitizedLines = lines.map((line: string) => {
      const parts = line.split(",");
      return parts.map(sanitizeCsvFormula).join(",");
    });
    req.body.text = sanitizedLines.join("\n");
  }

  next();
}
