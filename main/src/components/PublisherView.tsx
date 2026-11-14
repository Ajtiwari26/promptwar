import React, { useState, useMemo } from 'react';
import { Copy, Check, Printer, Share2, Globe, HeartPulse, User, Baby, CheckSquare, Square, Download, PhoneCall, FileText } from 'lucide-react';
import { CivicBriefingOutput, CleanedReadingItemSchema } from '../types/briefingSchema.js';
import { TraceabilityChip } from './TraceabilityChip.js';
import { buildLocalizedAdvisories } from '../i18n/advisories.js';
import { z } from 'zod';

type CleanedReading = z.infer<typeof CleanedReadingItemSchema>;

interface PublisherViewProps {
  briefing: CivicBriefingOutput | null;
  readings: CleanedReading[];
  onSelectCitation: (rowId: string) => void;
}

export const PublisherView: React.FC<PublisherViewProps> = ({
  briefing,
  readings,
  onSelectCitation
}) => {
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [selectedTier, setSelectedTier] = useState<'child_friendly' | 'general_public' | 'sensitive_groups'>('sensitive_groups');
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [checkedMemoItems, setCheckedMemoItems] = useState<Record<number, boolean>>({});

  const toggleMemoItem = (idx: number) => {
    setCheckedMemoItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // 1. DYNAMIC METRIC DERIVATION FROM REAL CSV READINGS
  const telemetrySummary = useMemo(() => {
    if (!readings || readings.length === 0) {
      return {
        peakVal: 60,
        worstWard: "Monitored Civic Zone",
        peakRowId: "ROW_01",
        isEmergency: false,
        faultySensors: [] as string[],
        flaggedRows: [] as CleanedReading[]
      };
    }

    const validReadings = readings.filter(r => r.normalized_value_ugm3 !== null && r.validation_status === 'VALID');
    const peakRow = validReadings.reduce((max, r) => ((r.normalized_value_ugm3 || 0) > (max?.normalized_value_ugm3 || 0) ? r : max), validReadings[0] || readings[0]);
    const peakVal = peakRow?.normalized_value_ugm3 || 0;
    const worstWard = peakRow?.ward_name || "Monitored Civic Zone";
    const isEmergency = peakVal >= 250;

    const flaggedRows = readings.filter(r => r.validation_status !== 'VALID' || r.raw_value === '-999');
    const faultySensors = Array.from(new Set(flaggedRows.map(r => r.sensor_id)));

    return {
      peakVal,
      worstWard,
      peakRowId: peakRow?.row_id || "ROW_01",
      isEmergency,
      faultySensors,
      flaggedRows
    };
  }, [readings]);

  // Dynamic localized advisories for English, Hindi, and Marathi computed strictly from CSV telemetry
  const defaultAdvisories = useMemo(() => {
    return buildLocalizedAdvisories(
      telemetrySummary.isEmergency,
      telemetrySummary.worstWard,
      telemetrySummary.peakVal
    );
  }, [telemetrySummary]);

  // Wire live backend LLM outputs if present, else dynamic localized telemetry fallback
  const liveCitizenAdvisories = briefing?.dual_outputs?.citizen_advisories;
  const currentAdvisoryText = liveCitizenAdvisories?.[selectedLang]?.[selectedTier]
    || defaultAdvisories[selectedLang][selectedTier];

  const liveExecutiveSummary = briefing?.dual_outputs?.internal_briefing_note?.executive_summary;
  const liveChecklist = briefing?.dual_outputs?.internal_briefing_note?.operational_checklist;

  // Dynamic checklist derived from real CSV telemetry
  const memoChecklist = useMemo(() => {
    if (liveChecklist && liveChecklist.length > 0) {
      return liveChecklist.map((item, idx) => ({
        time: idx === 0 ? "08:30" : idx === 1 ? "09:00" : idx === 2 ? "10:30" : "11:00",
        action: item,
        ref: idx === 0 ? telemetrySummary.peakRowId : telemetrySummary.flaggedRows[idx - 1]?.row_id || telemetrySummary.peakRowId
      }));
    }

    const list = [
      {
        time: "08:30",
        action: `Deploy high-pressure anti-smog mist water cannons along primary arterials in ${telemetrySummary.worstWard} to suppress particulate surge (${telemetrySummary.peakVal} µg/m³)`,
        ref: telemetrySummary.peakRowId
      },
      {
        time: "09:00",
        action: `Enforce mandatory dust halt and covering of unpaved excavation in ${telemetrySummary.worstWard}`,
        ref: telemetrySummary.peakRowId
      }
    ];

    if (telemetrySummary.faultySensors.length > 0) {
      list.push({
        time: "11:00",
        action: `Dispatch IoT field technician to calibrate and service flagged hardware sensors: ${telemetrySummary.faultySensors.join(', ')}`,
        ref: telemetrySummary.flaggedRows[0]?.row_id || telemetrySummary.peakRowId
      });
    } else {
      list.push({
        time: "11:00",
        action: `Perform routine 24-hour optical sensor calibration check across ${telemetrySummary.worstWard}`,
        ref: telemetrySummary.peakRowId
      });
    }

    return list;
  }, [liveChecklist, telemetrySummary]);

  // Dynamic Traceability Footnotes derived strictly from incoming CSV readings
  const dynamicFootnotes = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    
    // Pick flagged anomaly rows and top valid particulate readings
    const flagged = readings.filter(r => r.validation_status !== 'VALID' || r.raw_value === '-999');
    const validSorted = [...readings.filter(r => r.validation_status === 'VALID' && r.normalized_value_ugm3 !== null)]
      .sort((a, b) => (b.normalized_value_ugm3 || 0) - (a.normalized_value_ugm3 || 0));

    const selectedRows = Array.from(new Set([...flagged, ...validSorted.slice(0, 3)]));

    return selectedRows.map(r => {
      const isFault = r.validation_status !== 'VALID' || r.raw_value === '-999';
      const isConverted = r.raw_unit.toLowerCase().includes('mg');
      let note = `Sensor ${r.sensor_id} in ${r.ward_name}: `;
      if (isFault) {
        note += `Hardware Anomaly '${r.raw_value} ${r.raw_unit}' - flagged & excluded from statistics`;
      } else if (isConverted) {
        note += `Normalized ${r.normalized_value_ugm3} µg/m³ (converted from ${r.raw_value} ${r.raw_unit})`;
      } else {
        note += `${r.pollutant}: ${r.normalized_value_ugm3} µg/m³`;
      }
      return {
        row_id: r.row_id,
        sensor_id: r.sensor_id,
        note
      };
    });
  }, [readings]);

  // Dynamic Executive Summary text if LLM summary is not populated
  const dynamicExecutiveSummary = useMemo(() => {
    if (liveExecutiveSummary) return liveExecutiveSummary;

    if (telemetrySummary.isEmergency) {
      return `Severe particulate surge detected in ${telemetrySummary.worstWard} (Peak PM2.5: ${telemetrySummary.peakVal} µg/m³ [${telemetrySummary.peakRowId}]), breaching emergency safety thresholds. Atmospheric dispersion remains sluggish. ${telemetrySummary.faultySensors.length > 0 ? `Sensor hardware anomalies flagged on ${telemetrySummary.faultySensors.join(', ')} [${telemetrySummary.flaggedRows[0]?.row_id || 'FLAGGED'}]; station marked as Telemetry Blind Spot.` : 'All monitoring nodes fully operational.'}`;
    }

    return `Calibrated environmental baseline maintained across ${telemetrySummary.worstWard} (Peak PM2.5: ${telemetrySummary.peakVal} µg/m³ [${telemetrySummary.peakRowId}]). Ambient concentrations comply with standard dispersion parameters with zero immediate civic emergency triggers.`;
  }, [liveExecutiveSummary, telemetrySummary]);

  const handleCopyMarkdown = () => {
    const md = `# MUNICIPAL INTERNAL BRIEFING NOTE
**TO:** Municipal ${telemetrySummary.worstWard} Command
**REF:** ${briefing?.brief_metadata?.brief_id || 'BRIEF-2026-11-14-AM'}
**DATE:** 14 Nov 2026, 08:30 IST
**STATUS:** ${telemetrySummary.isEmergency ? '▲ CRITICAL GRAP STAGE IV' : '● NORMAL CALIBRATED BASELINE'}

## 1. EXECUTIVE SUMMARY
${dynamicExecutiveSummary}

## 2. MANDATORY ACTION CHECKLIST
${memoChecklist.map(c => `- [ ] ${c.time} - ${c.action} [${c.ref}]`).join('\n')}

## 3. DATA TRACEABILITY FOOTNOTES
${dynamicFootnotes.map(fn => `- ${fn.row_id}: ${fn.note}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleCopyWhatsApp = () => {
    const wa = `🚨 *CIVIC AIR QUALITY ${telemetrySummary.isEmergency ? 'EMERGENCY ADVISORY' : 'BULLETIN'}*
*${telemetrySummary.worstWard} Municipal Command Broadcast*
*Severity:* ${telemetrySummary.isEmergency ? `▲ SEVERE (Peak PM2.5: ${telemetrySummary.peakVal} µg/m³)` : `● NORMAL (PM2.5: ${telemetrySummary.peakVal} µg/m³)`}

${currentAdvisoryText}

📞 *Emergency Helplines:*
• Ward Command: 1800-11-0044
• Ambulance & Medical: 108 / 102
_Distributed via Civic Air Quality Briefing Studio_`;
    navigator.clipboard.writeText(wa);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div>
          <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900 block">
            DUAL-OUTPUT PUBLISHER &amp; CITIZEN BROADCAST STUDIO
          </span>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized generation: Internal Municipal Memo (Left) + Citizen Multilingual Advisory (Right)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Dual Outputs Synced</span>
          </span>
          {briefing?.brief_metadata?.brief_id && (
            <span className="text-xs font-mono bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
              Ref: {briefing.brief_metadata.brief_id}
            </span>
          )}
        </div>
      </div>

      {/* Side-by-Side Dual Output Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ======================================================== */}
        {/* OUTPUT A: INTERNAL OPERATIONAL BRIEFING NOTE (LEFT)      */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
            
            {/* Header & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>OUTPUT A: INTERNAL BRIEFING NOTE</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMarkdown ? 'Copied' : 'Copy MD'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </button>
              </div>
            </div>

            {/* Official Municipal Memo Body */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs space-y-4 text-slate-800">
              
              <div className="border-b border-slate-200 pb-3 text-xs text-slate-600 space-y-1 font-mono">
                <div>TO: <strong className="text-slate-900">Municipal {telemetrySummary.worstWard} Command &amp; Disaster Cell</strong></div>
                <div>REF: <strong className="text-slate-900">{briefing?.brief_metadata?.brief_id || 'BRIEF-2026-11-14-AM'}</strong></div>
                <div>DATE: <strong className="text-slate-900">14 Nov 2026, 08:30 IST</strong></div>
                <div>STATUS: <strong className={telemetrySummary.isEmergency ? "text-rose-700 font-bold" : "text-emerald-700 font-bold"}>
                  {telemetrySummary.isEmergency ? "▲ CRITICAL ESCALATION (GRAP STAGE IV)" : "● NORMAL CALIBRATED BASELINE"}
                </strong></div>
              </div>

              {/* 1. Executive Summary */}
              <div className="space-y-1.5">
                <div className="font-heading font-bold text-slate-900 text-xs uppercase tracking-wide">
                  1. EXECUTIVE SUMMARY
                </div>
                <p className="text-slate-700 leading-relaxed font-sans text-xs">
                  {dynamicExecutiveSummary}
                </p>
              </div>

              {/* 2. Mandatory Action Checklist */}
              <div className="space-y-2">
                <div className="font-heading font-bold text-slate-900 text-xs uppercase tracking-wide">
                  2. MANDATORY ACTION CHECKLIST
                </div>
                <div className="space-y-1.5">
                  {memoChecklist.map((c, idx) => {
                    const isChecked = !!checkedMemoItems[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleMemoItem(idx)}
                        className={`p-2.5 rounded-lg border transition cursor-pointer flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-slate-100/70 border-slate-200 line-through text-slate-400'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMemoItem(idx);
                          }}
                          className="mt-0.5 text-slate-400 hover:text-blue-600 shrink-0 cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <div className="flex-1 text-xs">
                          <span className="font-mono font-bold text-slate-600 mr-1.5">[{c.time}]</span>
                          <span>{c.action}</span>
                          <span className="ml-2" onClick={(e) => e.stopPropagation()}>
                            <TraceabilityChip rowId={c.ref} onClick={onSelectCitation} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Data Traceability Footnotes */}
              <div className="border-t border-slate-200 pt-3 space-y-1 text-xs text-slate-600">
                <div className="font-heading font-bold text-slate-900 uppercase tracking-wide">
                  3. DATA TRACEABILITY FOOTNOTES
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {dynamicFootnotes.map(fn => (
                    <div key={fn.row_id} className="flex items-start gap-1.5 text-slate-700">
                      <span className="text-slate-400">•</span>
                      <strong className="text-slate-900">{fn.row_id}:</strong>
                      <span className="flex-1">{fn.note}</span>
                      <TraceabilityChip rowId={fn.row_id} onClick={onSelectCitation} />
                    </div>
                  ))}
                  {dynamicFootnotes.length === 0 && (
                    <div className="text-slate-400 italic">No telemetry footnotes generated</div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* OUTPUT B: CITIZEN ADVISORY & MULTILINGUAL BROADCAST      */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
            
            {/* Header & Language Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>OUTPUT B: PUBLIC CITIZEN ADVISORY</span>
              </span>

              {/* Language Switcher: English, Hindi, Marathi */}
              <div className="flex items-center gap-1" role="group" aria-label="Advisory Language">
                <button
                  type="button"
                  onClick={() => setSelectedLang('en')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    selectedLang === 'en'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLang('hi')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    selectedLang === 'hi'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLang('mr')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    selectedLang === 'mr'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  मराठी
                </button>
              </div>
            </div>

            {/* Reading Tier & Vulnerability Tabs */}
            <div className="space-y-1.5">
              <span className="text-xs font-heading font-semibold uppercase tracking-wider text-slate-500 block">
                Reading Tier &amp; Vulnerability Level:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedTier('child_friendly')}
                  className={`p-2.5 rounded-xl text-left transition flex items-center gap-2 border cursor-pointer ${
                    selectedTier === 'child_friendly'
                      ? 'bg-blue-50 text-blue-800 font-bold border-blue-300 ring-2 ring-blue-100 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <Baby className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">🧒 Child-Friendly</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTier('general_public')}
                  className={`p-2.5 rounded-xl text-left transition flex items-center gap-2 border cursor-pointer ${
                    selectedTier === 'general_public'
                      ? 'bg-blue-50 text-blue-800 font-bold border-blue-300 ring-2 ring-blue-100 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <User className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">👥 General Public</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTier('sensitive_groups')}
                  className={`p-2.5 rounded-xl text-left transition flex items-center gap-2 border cursor-pointer ${
                    selectedTier === 'sensitive_groups'
                      ? 'bg-rose-50 text-rose-800 font-bold border-rose-300 ring-2 ring-rose-100 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <HeartPulse className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="truncate">🫁 High-Risk &amp; Seniors</span>
                </button>
              </div>
            </div>

            {/* Public Advisory Card Content */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-heading font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  {selectedTier === 'child_friendly'
                    ? 'SCHOOL & CHILD-FRIENDLY ADVISORY'
                    : selectedTier === 'general_public'
                    ? 'GENERAL PUBLIC AIR QUALITY BULLETIN'
                    : 'SPECIAL MEDICAL & VULNERABLE GROUP ADVISORY'}
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase">
                  {selectedLang.toUpperCase()}
                </span>
              </div>

              <div className="whitespace-pre-line text-sm font-sans text-slate-800 leading-relaxed bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                {currentAdvisoryText}
              </div>

              {/* Action Buttons for Broadcast */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-heading text-xs font-bold text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {copiedWhatsApp ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedWhatsApp ? 'Copied WhatsApp Msg' : '📱 Copy WhatsApp Format'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([currentAdvisoryText], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `civic_advisory_${selectedLang}_${selectedTier}.txt`;
                    link.click();
                  }}
                  className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Text</span>
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
