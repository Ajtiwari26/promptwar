import React, { useState, useMemo } from 'react';
import { Copy, Check, Printer, Share2, Globe, HeartPulse, User, Baby, CheckSquare, Square, Download, PhoneCall } from 'lucide-react';
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
    { time: "08:30", action: "Dispatch water mist cannons to Ward 4 arterial roads to suppress coarse dust", ref: "ROW_04" },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#27272A] bg-[#18181B]">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            DUAL-OUTPUT PUBLISHER & CITIZEN BROADCAST STUDIO
          </span>
          <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
            Synchronized generation: Internal Municipal Memo (Left) + Citizen Multilingual Advisory (Right)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-zinc-800 text-emerald-400 border border-zinc-700 px-2 py-0.5 rounded">
            ● Dual Outputs Synced
          </span>
          {briefing?.brief_metadata?.brief_id && (
            <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded">
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
          <div className="p-5 rounded-xl border border-[#27272A] bg-[#18181B] space-y-4 shadow-xl">
            
            {/* Header & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272A] pb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                📋 OUTPUT A: INTERNAL BRIEFING NOTE
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="px-2.5 py-1 rounded bg-[#09090B] border border-[#27272A] hover:border-zinc-400 font-mono text-[11px] font-semibold text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                >
                  {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMarkdown ? 'Copied' : '[Copy Markdown]'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded bg-[#09090B] border border-[#27272A] hover:border-zinc-400 font-mono text-[11px] font-semibold text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>[🖨️ Print / Export PDF]</span>
                </button>
              </div>
            </div>

            {/* Official Municipal Memo Body */}
            <div className="p-4 rounded-lg bg-[#09090B] border border-[#27272A] font-mono text-xs space-y-4 text-zinc-200">
              
              <div className="border-b border-[#27272A] pb-3 text-[11px] text-zinc-400 space-y-0.5">
                <div>TO: <strong className="text-white">Municipal Ward 4 Command &amp; Disaster Cell</strong></div>
                <div>REF: <strong className="text-white">{briefing?.brief_metadata?.brief_id || 'BRIEF-2026-11-14-AM'}</strong></div>
                <div>DATE: <strong className="text-white">14 Nov 2026, 08:30 IST</strong></div>
                <div>STATUS: <strong className="text-red-400">▲ CRITICAL ESCALATION (GRAP STAGE IV)</strong></div>
              </div>

              {/* 1. Executive Summary */}
              <div className="space-y-1.5">
                <div className="font-bold text-white text-xs uppercase tracking-wide">
                  1. EXECUTIVE SUMMARY
                </div>
                <p className="text-zinc-300 leading-relaxed font-sans text-xs">
                  {liveExecutiveSummary ? (
                    liveExecutiveSummary
                  ) : (
                    <>
                      Severe particulate spike in Ward 4 (<strong className="font-mono text-white">310.0 µg/m³</strong> <TraceabilityChip rowId="ROW_04" onClick={onSelectCitation} />), up <strong className="text-red-400">42%</strong> from yesterday. Ward 2 unverified due to sensor SNS_W02_03 optical error (-999 <TraceabilityChip rowId="ROW_07" onClick={onSelectCitation} />); classified as Telemetry Blind Spot.
                    </>
                  )}
                </p>
              </div>

              {/* 2. Mandatory Action Checklist */}
              <div className="space-y-2 pt-2 border-t border-[#27272A]">
                <div className="font-bold text-white text-xs uppercase tracking-wide">
                  2. MANDATORY ACTION CHECKLIST
                </div>
                <div className="space-y-2 text-xs">
                  {memoChecklist.map((item, idx) => {
                    const isChecked = !!checkedMemoItems[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleMemoItem(idx)}
                        className="flex items-center gap-2.5 p-2 rounded bg-[#18181B] border border-[#27272A] cursor-pointer hover:border-zinc-500 transition"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                        )}
                        <span className={`flex-1 text-[11px] ${isChecked ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                          [{item.time}] {item.action}
                        </span>
                        <TraceabilityChip rowId={item.ref} onClick={onSelectCitation} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Data Traceability Footnotes */}
              <div className="space-y-1.5 pt-2 border-t border-[#27272A] text-[11px] text-zinc-400">
                <div className="font-bold text-white text-xs uppercase tracking-wide">
                  3. DATA TRACEABILITY FOOTNOTES
                </div>
                <div>• <strong className="text-zinc-200 font-mono">ROW_04:</strong> Sensor SNS_W04_01 (Normalized 310.0 µg/m³, scaled from 0.31 mg/m³)</div>
                <div>• <strong className="text-zinc-200 font-mono">ROW_05:</strong> Sensor SNS_W04_01 (PM10: 480.0 µg/m³)</div>
                <div>• <strong className="text-zinc-200 font-mono">ROW_07:</strong> Sensor SNS_W02_03 (-999 Hardware Fault, excluded from statistics)</div>
              </div>

            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* OUTPUT B: PUBLIC CITIZEN ADVISORY (RIGHT)                */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-xl border border-[#27272A] bg-[#18181B] space-y-4 shadow-xl">
            
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272A] pb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                📢 OUTPUT B: PUBLIC CITIZEN ADVISORY
              </span>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedLang('en')}
                  className={`px-2 py-0.5 rounded transition text-[11px] font-bold ${
                    selectedLang === 'en'
                      ? 'bg-zinc-100 text-zinc-950'
                      : 'bg-[#09090B] text-zinc-400 hover:text-white border border-[#27272A]'
                  }`}
                >
                  [English]
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLang('hi')}
                  className={`px-2 py-0.5 rounded transition text-[11px] font-bold ${
                    selectedLang === 'hi'
                      ? 'bg-zinc-100 text-zinc-950'
                      : 'bg-[#09090B] text-zinc-400 hover:text-white border border-[#27272A]'
                  }`}
                >
                  [हिंदी]
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLang('mr')}
                  className={`px-2 py-0.5 rounded transition text-[11px] font-bold ${
                    selectedLang === 'mr'
                      ? 'bg-zinc-100 text-zinc-950'
                      : 'bg-[#09090B] text-zinc-400 hover:text-white border border-[#27272A]'
                  }`}
                >
                  [मराठी]
                </button>
              </div>
            </div>

            {/* Reading Tier & Vulnerability Tabs */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                Reading Tier &amp; Vulnerability Level:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedTier('child_friendly')}
                  className={`p-2 rounded text-left transition flex items-center gap-1.5 border ${
                    selectedTier === 'child_friendly'
                      ? 'bg-zinc-100 text-zinc-950 font-bold border-white'
                      : 'bg-[#09090B] text-zinc-400 hover:text-white border-[#27272A]'
                  }`}
                >
                  <Baby className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">[🧒 Child-Friendly]</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTier('general_public')}
                  className={`p-2 rounded text-left transition flex items-center gap-1.5 border ${
                    selectedTier === 'general_public'
                      ? 'bg-zinc-100 text-zinc-950 font-bold border-white'
                      : 'bg-[#09090B] text-zinc-400 hover:text-white border-[#27272A]'
                  }`}
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">[👥 General Public]</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTier('sensitive_groups')}
                  className={`p-2 rounded text-left transition flex items-center gap-1.5 border ${
                    selectedTier === 'sensitive_groups'
                      ? 'bg-zinc-100 text-zinc-950 font-bold border-white'
                      : 'bg-[#09090B] text-zinc-400 hover:text-white border-[#27272A]'
                  }`}
                >
                  <HeartPulse className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  <span className="truncate">[🫁 High-Risk &amp; Seniors]</span>
                </button>
              </div>
            </div>

            {/* Public Advisory Card Content */}
            <div className="p-4 rounded-lg bg-[#09090B] border border-[#27272A] space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-2">
                <span className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-red-400" />
                  {selectedTier === 'child_friendly'
                    ? 'SCHOOL & CHILD-FRIENDLY ADVISORY'
                    : selectedTier === 'general_public'
                    ? 'GENERAL PUBLIC AIR QUALITY BULLETIN'
                    : 'SPECIAL MEDICAL & VULNERABLE GROUP ADVISORY'}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase">
                  {selectedLang.toUpperCase()}
                </span>
              </div>

              <div className="whitespace-pre-line text-xs font-sans text-zinc-200 leading-relaxed bg-[#18181B] p-3.5 rounded border border-[#27272A]">
                {currentAdvisoryText}
              </div>

              {/* Action Buttons for Broadcast */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 font-mono text-xs font-bold text-white transition flex items-center gap-1.5 shadow"
                >
                  {copiedWhatsApp ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedWhatsApp ? 'Copied WhatsApp Msg' : '[📱 Copy WhatsApp Format]'}</span>
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
                  className="px-3 py-1.5 rounded bg-[#18181B] border border-[#27272A] hover:border-zinc-400 font-mono text-xs font-semibold text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>[Download Text]</span>
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
