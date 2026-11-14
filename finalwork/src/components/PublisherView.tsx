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

  // Shared localized fallback advisories for English, Hindi, and Marathi
  const defaultAdvisories = useMemo(() => {
    return buildLocalizedAdvisories(
      true,
      "Ward 4 - Industrial Belt",
      310
    );
  }, []);

  // Wire live backend LLM outputs if present, else fallback
  const liveCitizenAdvisories = briefing?.dual_outputs?.citizen_advisories;
  const currentAdvisoryText = liveCitizenAdvisories?.[selectedLang]?.[selectedTier]
    || defaultAdvisories[selectedLang][selectedTier];

  const liveExecutiveSummary = briefing?.dual_outputs?.internal_briefing_note?.executive_summary;
  const liveChecklist = briefing?.dual_outputs?.internal_briefing_note?.operational_checklist;

  const defaultChecklist = [
    { time: "08:30", action: "Deploy anti-smog water mist cannons to Ward 4 arterial roads to suppress coarse dust", ref: "ROW_04" },
    { time: "09:00", action: "Enforce dust stop-work notice at Sector 4 metro excavation site", ref: "ROW_04" },
    { time: "11:00", action: "Replace Ward 2 optical sensor fuse & recalibrate SNS_W02_03", ref: "ROW_07" }
  ];

  const memoChecklist = liveChecklist && liveChecklist.length > 0
    ? liveChecklist.map((item, idx) => ({
        time: idx === 0 ? "08:30" : idx === 1 ? "09:00" : "11:00",
        action: item,
        ref: idx === 2 ? "ROW_07" : "ROW_04"
      }))
    : defaultChecklist;

  const handleCopyMarkdown = () => {
    const md = `# MUNICIPAL INTERNAL BRIEFING NOTE
**TO:** Municipal Ward 4 Command
**REF:** ${briefing?.brief_metadata?.brief_id || 'BRIEF-2026-11-14-AM'}
**DATE:** 14 Nov 2026, 08:30 IST
**STATUS:** ▲ CRITICAL GRAP STAGE IV

## 1. EXECUTIVE SUMMARY
${liveExecutiveSummary || 'Severe particulate spike in Ward 4 (310.0 µg/m³ [ROW_04]), up 42% from yesterday. Unfavorable micro-meteorology with wind speed <1m/s creating an inversion trap. Ward 2 telemetry unverified due to sensor SNS_W02_03 hardware error (-999 [ROW_07]); flagged as Telemetry Blind Spot.'}

## 2. MANDATORY ACTION CHECKLIST
${memoChecklist.map(c => `- [ ] ${c.time} - ${c.action} [${c.ref}]`).join('\n')}

## 3. DATA TRACEABILITY FOOTNOTES
- ROW_04: Sensor SNS_W04_01 (310.0 µg/m³, converted from 0.31 mg/m³)
- ROW_05: Sensor SNS_W04_01 (PM10: 480.0 µg/m³)
- ROW_07: Sensor SNS_W02_03 (Hardware Error: -999, excluded from statistics)
`;
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleCopyWhatsApp = () => {
    const wa = `🚨 *CIVIC AIR QUALITY EMERGENCY ADVISORY*
*Ward 04 Municipal Command Broadcast*
*Severity:* ▲ SEVERE (PM2.5: 310 µg/m³)

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
                <div>TO: <strong className="text-slate-900">Municipal Ward 4 Command &amp; Disaster Cell</strong></div>
                <div>REF: <strong className="text-slate-900">{briefing?.brief_metadata?.brief_id || 'BRIEF-2026-11-14-AM'}</strong></div>
                <div>DATE: <strong className="text-slate-900">14 Nov 2026, 08:30 IST</strong></div>
                <div>STATUS: <strong className="text-rose-700 font-bold">▲ CRITICAL ESCALATION (GRAP STAGE IV)</strong></div>
              </div>

              {/* 1. Executive Summary */}
              <div className="space-y-1.5">
                <div className="font-heading font-bold text-slate-900 text-xs uppercase tracking-wide">
                  1. EXECUTIVE SUMMARY
                </div>
                <p className="text-slate-700 leading-relaxed font-sans text-xs">
                  {liveExecutiveSummary ? (
                    liveExecutiveSummary
                  ) : (
                    <>
                      Severe particulate spike in Ward 4 (<strong className="font-mono text-slate-900">310.0 µg/m³</strong> <TraceabilityChip rowId="ROW_04" onClick={onSelectCitation} />), up <strong className="text-rose-700">42%</strong> from yesterday. Unfavorable micro-meteorology with wind speed &lt;1m/s creating an inversion trap. Ward 2 telemetry unverified due to sensor SNS_W02_03 hardware error (<strong className="font-mono text-rose-700">-999</strong> <TraceabilityChip rowId="ROW_07" onClick={onSelectCitation} />); flagged as Telemetry Blind Spot.
                    </>
                  )}
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
                <div className="space-y-1 font-mono text-[11px]">
                  <div>• <strong className="text-slate-900">ROW_04:</strong> Sensor SNS_W04_01 (Normalized 310.0 µg/m³, scaled from 0.31 mg/m³)</div>
                  <div>• <strong className="text-slate-900">ROW_05:</strong> Sensor SNS_W04_01 (PM10: 480.0 µg/m³)</div>
                  <div>• <strong className="text-slate-900">ROW_07:</strong> Sensor SNS_W02_03 (-999 Hardware Fault, excluded from statistics)</div>
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
