# Civic Air Quality Briefing Studio — Backend API Contract

This document provides the exact API specification for the frontend agent working in `warmup/`.

---

## 1. Base URL & Port
- **Development Proxy**: `http://localhost:3001` (proxied by Vite from `/api`)
- **Headers Required for Protected Routes**:  
  `Authorization: Bearer <JWT_TOKEN>`  
  `Content-Type: application/json`

---

## 2. Authentication Endpoints

### `POST /api/auth/login`
Authenticates civic officers and evaluators. Supports 1-click guest evaluator accounts.

**Request Body:**
```json
{
  "email": "guest.officer@civicstudio.in",
  "password": "CivicBrief#2026"
}
```

**Pre-configured Evaluator & Guest Accounts:**
| Email | Password | Role | Display Name |
| :--- | :--- | :--- | :--- |
| `guest.officer@civicstudio.in` | `CivicBrief#2026` | `ward_officer` | Executive Ward Officer (Evaluator) |
| `ward.guest@civic.gov.in` | `CivicGuest@2026` | `ward_officer` | Municipal Ward Officer |
| `rwa.guest@civic.gov.in` | `CivicGuest@2026` | `housing_society` | RWA Housing Society President |
| `school.guest@civic.gov.in` | `CivicGuest@2026` | `school_principal` | Senior School Administrator |

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "USR_GUEST.OFFICER",
    "email": "guest.officer@civicstudio.in",
    "role": "ward_officer",
    "displayName": "Executive Ward Officer (Evaluator)"
  }
}
```

---

### `GET /api/auth/verify`
Validates the current session token.

**Headers:** `Authorization: Bearer <token>`  
**Response (200 OK):**
```json
{
  "user": {
    "userId": "USR_GUEST.OFFICER",
    "email": "guest.officer@civicstudio.in",
    "role": "ward_officer",
    "displayName": "Executive Ward Officer (Evaluator)"
  }
}
```

---

## 3. Presets Endpoint

### `GET /api/presets/:id`
Retrieves pre-loaded multi-ward telemetry scenarios for 1-click evaluator demonstrations.

**Path Parameters:**
- `id`: `baseline` | `crisis` | `post_action`

**Headers:** `Authorization: Bearer <token>`  
**Response (200 OK):**
```json
{
  "id": "crisis",
  "label": "Day 2: Crisis & Anomaly Day",
  "rows": [
    {
      "row_id": "ROW_10",
      "sensor_id": "SNS_W04_01",
      "ward_name": "Ward 4 - Industrial Belt",
      "timestamp_raw": "2026-11-14T07:45:00Z",
      "pollutant": "PM2.5",
      "raw_value": "0.38",
      "raw_unit": "mg/m3"
    }
  ]
}
```

---

## 4. Civic Briefing Analysis Endpoint

### `POST /api/briefing/analyze`
Executes the two-stage `gemini-3.8-flash` pipeline with the deterministic Decision Engine and $O(1)$ SHA-256 LRU cache.

**Headers:** `Authorization: Bearer <token>`  
**Request Body:**
```json
{
  "presetId": "crisis", // Optional: "baseline" | "crisis" | "post_action"
  "text": "Ward-4, SNS_01, PM2.5, 380, ug/m3", // Optional: Raw CSV/table
  "inlineData": { // Optional: For PDF or Image upload
    "data": "<BASE64_STRING>",
    "mimeType": "image/png"
  },
  "previousBrief": { ... } // Optional: Pass prior fullBrief object for delta comparison
}
```

**Response (200 OK):**
```json
{
  "fastTriage": {
    "alert_level": "EMERGENCY_CRITICAL", // "NORMAL" | "ADVISORY" | "WARNING" | "EMERGENCY_CRITICAL"
    "primary_headline": "CRITICAL CIVIC ALERT: Severe Air Emergency in Ward 4...",
    "emergency_trigger_code": "GRAP_STAGE_IV_SEVERE_PLUS",
    "urgent_action_required": true,
    "detected_hotspots_count": 5,
    "unreliable_sensors_count": 1,
    "worst_affected_ward": "Ward 4 - Industrial Belt",
    "peak_pm25_ugm3": 380
  },
  "decisionContext": {
    "normalized_readings": [...],
    "data_quality_flags": [...],
    "classified_hotspots": [...],
    "ward_aggregates": { ... }
  },
  "fullBrief": {
    "brief_metadata": { "brief_id": "BRIEF-2026-11-14-...", "generated_at": "..." },
    "cleaned_readings": [...],
    "data_quality_flags": [...],
    "hotspots_and_trends": [
      {
        "hotspot_location": "Ward 4 - Industrial Belt",
        "finding_summary": "[ACUTE_COMBUSTION_BIOMASS] ...",
        "traceability_refs": ["ROW_10", "ROW_11"]
      }
    ],
    "comparison_with_previous": {
      "overall_trend": "WORSENED", // "IMPROVED" | "STABLE" | "WORSENED" | "NO_PREVIOUS_DATA"
      "summary_of_changes": "...",
      "new_sensor_failures": ["SNS_W02_03"],
      "hotspot_shifts": "..."
    },
    "role_specific_actions": {
      "ward_officer": [
        { "priority": "IMMEDIATE", "action": "...", "traceability_refs": ["ROW_10"] }
      ],
      "housing_society": [...],
      "school_principal": [...]
    },
    "dual_outputs": {
      "internal_briefing_note": {
        "executive_summary": "...",
        "operational_checklist": ["..."]
      },
      "citizen_advisories": {
        "en": { "child_friendly": "...", "general_public": "...", "sensitive_groups": "..." },
        "hi": { "child_friendly": "...", "general_public": "...", "sensitive_groups": "..." }
      }
    }
  },
  "cached": false, // true if returned in 0ms from SHA-256 LRU cache
  "executionTimeMs": 2.45,
  "executionMode": "DETERMINISTIC_OFFLINE_SIMULATION" // or "LIVE_GEMINI_3_8_FLASH"
}
```
