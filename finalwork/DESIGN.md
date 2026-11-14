# Civic Air Quality Briefing Studio — Design System & Visual Specification

## 1. Design Philosophy: Executive Civic Modernism
The Civic Air Quality Briefing Studio is an institutional intelligence tool for municipal officers, disaster cells, housing societies, schools, and gig fleets. The interface must communicate authority, physical telemetry precision, and urgent readability without visual clutter, eye fatigue, or terminal-like opacity.

---

## 2. Typography Specification

### Primary Font Families
- **Display & Section Headings**: `Plus Jakarta Sans`, sans-serif (Weights: 600 SemiBold, 700 Bold, 800 ExtraBold)
  - Purpose: Crisp geometric curves, high readability at municipal scale, modern institutional authority.
- **Body & Advisory Copy**: `Inter`, sans-serif (Weights: 400 Regular, 500 Medium, 600 SemiBold)
  - Purpose: Highly legibile micro-typography, optical clarity for multi-lingual strings (English, Hindi, Marathi).
- **Telemetry Numerals, Sensor IDs & Citations**: `JetBrains Mono`, monospace (Weights: 500 Medium, 600 SemiBold)
  - Purpose: Tabular numeral alignment (`font-variant-numeric: tabular-nums`), unmistakable distinction between zeros, Os, sensor IDs (`SNS_W04_01`), row citations (`ROW_10`), and units ($\mu\text{g/m}^3$).

### Font Hierarchy & Scale
| Level | Font Family | Size / Line Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Title / Hero** | Plus Jakarta Sans | `20px` / `28px` | `800` | `-0.02em` | Studio Header & Primary Branding |
| **Section Header** | Plus Jakarta Sans | `15px` / `22px` | `700` | `-0.01em` | Panel titles, Card headers, Workflow steps |
| **Card / Subhead** | Plus Jakarta Sans | `13px` / `18px` | `600` | `0` | Action items, Hotspot archetypes |
| **Body (Advisories)** | Inter | `14px` / `22px` | `400` / `500` | `0` | Citizen messages, Memo notes, Explanations |
| **Meta & Captions** | Inter | `12px` / `16px` | `500` | `+0.01em` | Timestamps, persona titles, status helpers |
| **Telemetry & Data** | JetBrains Mono | `13px` / `18px` | `500` / `600` | `-0.01em` | Concentrations, AQI values, Raw readings |
| **Citations / Tags** | JetBrains Mono | `11px` / `14px` | `600` | `+0.02em` | `ROW_xx`, Sensor IDs, Fault flags |

---

## 3. Bright Theme Color Palette & Tokens

### Canvas & Surfaces
- **App Canvas Background**: `#F8FAFC` (`slate-50`)
- **Card & Container Background**: `#FFFFFF` (`white`)
- **Secondary Surfaces & Table Headers**: `#F1F5F9` (`slate-100`)
- **Subtle Surface Hover**: `#F8FAFC` (`slate-50`)
- **Interactive Card Hover / Selected**: `#EFF6FF` (`blue-50`)

### Borders & Dividers
- **Standard Card Border**: `#E2E8F0` (`slate-200`)
- **Muted Table Divider**: `#F1F5F9` (`slate-100`)
- **Focus Ring**: `#2563EB` (`blue-600`) with 2px offset

### Typography Colors
- **Primary Text**: `#0F172A` (`slate-900`) — High contrast WCAG AAA (14.2:1 against white)
- **Secondary Text**: `#334155` (`slate-700`) — Clear supporting body text
- **Muted / Metadata Text**: `#64748B` (`slate-500`) — Subdued captions & footnotes
- **Disabled Text**: `#94A3B8` (`slate-400`)

### Semantic Alert & Status Tiers (Light Mode WCAG Compliant)
- **Emergency Critical (GRAP Stage IV / Severe+)**:
  - Surface: `#FEF2F2` (`red-50`)
  - Border: `#FECACA` (`red-200`)
  - Accent / Text: `#B91C1C` (`red-700`)
  - Badge Background: `#FEE2E2` (`red-100`) / Badge Text: `#991B1B` (`red-800`)
- **Severe Air Quality**:
  - Surface: `#FFF1F2` (`rose-50`)
  - Border: `#FFE4E6` (`rose-200`)
  - Badge: Background `#FFE4E6`, Text `#BE123C` (`rose-700`)
- **Very Poor / Poor (Warning)**:
  - Surface: `#FFFBEB` (`amber-50`)
  - Border: `#FDE68A` (`amber-200`)
  - Badge: Background `#FEF3C7`, Text `#B45309` (`amber-700`)
- **Moderate / Acceptable**:
  - Surface: `#F0FDF4` (`green-50`)
  - Border: `#BBF7D0` (`green-200`)
  - Badge: Background `#DCFCE7`, Text `#15803D` (`green-700`)
- **Sensor Fault / Anomaly Flag**:
  - Surface: `#FEF2F2` (`red-50`)
  - Border: `#FCA5A5` (`red-300`)
  - Badge: Background `#FEE2E2`, Text `#991B1B` (`red-800`) with subtle diagonal pinstripe
- **Institutional Blue (Actions & Citations)**:
  - Surface: `#EFF6FF` (`blue-50`)
  - Border: `#BFDBFE` (`blue-200`)
  - Text: `#1D4ED8` (`blue-700`)

---

## 4. Decluttering & Layout Structure

### Spacing & Layout Principles
- **Grid Layout**: 12-column responsive layout with `24px` (`gap-6`) breathing space between input and audit panels.
- **Card Padding**: Consistent `20px` to `24px` (`p-5` or `p-6`) for cards to prevent data cramming.
- **Elevation**: Soft, subtle drop shadows:
  - Standard Card: `box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)`
  - Elevated Popover / Modal: `box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)`
- **Border Radius**: Refined `10px` (`rounded-xl`) for cards and containers, `6px` (`rounded-md`) for buttons and badges.

### Telemetry Table Decluttering
- Clean white rows with `#F8FAFC` zebra striping on hover.
- Removed dark boxed cells in favor of clean open horizontal rows with `#E2E8F0` hairline dividers.
- Status badges use pill format (`rounded-full px-2.5 py-0.5 text-xs font-semibold`) instead of bulky square boxes.
- Interactive filter chips (`All`, `Valid Only`, `✖ Sensor Faults`) clearly segmented with counter badges.

---

## 5. Structured Data Export Package Specification
When the user clicks **`[⬇ Download Structured Audit Package]`**, the studio generates and downloads a clean, standardized JSON or CSV bundle with the following schema:

```json
{
  "metadata": {
    "system": "Civic Air Quality Briefing Studio",
    "version": "1.0.0",
    "export_timestamp_iso": "2026-11-14T07:20:00.000Z",
    "brief_reference_id": "BRIEF-2026-11-14-556",
    "jurisdiction": "Ward 04 Delhi / NCR Municipal Command"
  },
  "fast_triage": {
    "alert_level": "EMERGENCY_CRITICAL",
    "primary_headline": "string",
    "emergency_trigger_code": "GRAP_STAGE_IV_SEVERE_PLUS",
    "worst_affected_ward": "Ward 4 - Industrial Belt",
    "peak_pm25_ugm3": 380,
    "detected_hotspots_count": 6,
    "unreliable_sensors_count": 2
  },
  "hotspot_classifications": [
    {
      "hotspot_id": "HS_COMBUSTION_Ward_4_-_Industrial_Belt",
      "archetype": "ACUTE_COMBUSTION_BIOMASS",
      "ward_name": "Ward 4 - Industrial Belt",
      "severity": "SEVERE",
      "confidence_score": 0.92,
      "trigger_reason": "string",
      "metrics_evidence": { "avgPM25": 380, "pmRatio": 0.84 },
      "traceability_refs": ["ROW_10"]
    }
  ],
  "data_quality_flags": [
    {
      "row_id": "ROW_16",
      "sensor_id": "SNS_W02_03",
      "issue_type": "HARDWARE_ERROR_CODE",
      "raw_evidence": "PM10 recorded as '-999 ug/m3'",
      "explanation": "Sensor returned hardware fault code '-999'; excluded from calculation."
    }
  ],
  "cleaned_telemetry_table": [
    {
      "row_id": "ROW_10",
      "sensor_id": "SNS_W04_01",
      "ward_name": "Ward 4 - Industrial Belt",
      "pollutant": "PM2.5",
      "raw_value": "0.38",
      "raw_unit": "mg/m3",
      "normalized_value_ugm3": 380,
      "sub_index_aqi": 452,
      "aqi_severity": "SEVERE",
      "validation_status": "VALID"
    }
  ],
  "role_specific_actions": {
    "ward_officer": [ ... ],
    "housing_society": [ ... ],
    "school_principal": [ ... ],
    "gig_worker": [ ... ]
  },
  "citizen_advisories": {
    "en": { "child_friendly": "...", "general_public": "...", "sensitive_groups": "..." },
    "hi": { "child_friendly": "...", "general_public": "...", "sensitive_groups": "..." },
    "mr": { "child_friendly": "...", "general_public": "...", "sensitive_groups": "..." }
  }
}
```
