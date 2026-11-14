import React, { useState } from 'react';
import { FileText, Megaphone, Copy, Check, Printer, HeartPulse, Baby, Users } from 'lucide-react';
import { DualOutputsSchema } from '../types/briefingSchema.js';
import { z } from 'zod';

type DualOutputs = z.infer<typeof DualOutputsSchema>;

interface PublisherStudioProps {
  dualOutputs: DualOutputs | null;
  briefId: string;
}

export const PublisherStudio: React.FC<PublisherStudioProps> = ({ dualOutputs, briefId }) => {
  const [activeLang, setActiveLang] = useState<'en' | 'hi'>('en');
  const [activeTier, setActiveTier] = useState<'child_friendly' | 'general_public' | 'sensitive_groups'>('general_public');
  const [copied, setCopied] = useState(false);

  if (!dualOutputs) return null;

  const currentAdvisory = dualOutputs.citizen_advisories[activeLang] || dualOutputs.citizen_advisories.en;
  const advisoryText = currentAdvisory[activeTier] || '';

  const handleCopyWhatsApp = () => {
    const textToCopy = `📢 *CIVIC AIR QUALITY ADVISORY* [${briefId}]\n\n${advisoryText}\n\n*Issued by:* Civic Intelligence Operations`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 1. INTERNAL BRIEFING NOTE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Internal Operational Briefing Note
              </h2>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              Confidential • Civic Authority
            </span>
          </div>

          {/* Executive Summary */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Executive Summary
            </span>
            <p className="text-xs text-slate-200 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed">
              {dualOutputs.internal_briefing_note.executive_summary}
            </p>
          </div>

          {/* Operational Action Checklist */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Enforcement Checklist
            </span>
            <ul className="space-y-2">
              {dualOutputs.internal_briefing_note.operational_checklist.map((item, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 flex items-start gap-2.5"
                >
                  <span className="font-mono text-emerald-400 font-bold text-[11px] shrink-0 mt-0.5">
                    0{idx + 1}.
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80 mt-4 flex justify-end">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save Operational PDF
          </button>
        </div>
      </div>

      {/* 2. MULTI-LINGUAL CITIZEN ADVISORY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-teal-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Public Citizen Advisory
              </h2>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800" role="tablist">
              <button
                role="tab"
                aria-selected={activeLang === 'en'}
                onClick={() => setActiveLang('en')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  activeLang === 'en' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                role="tab"
                aria-selected={activeLang === 'hi'}
                onClick={() => setActiveLang('hi')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  activeLang === 'hi' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>
          </div>

          {/* Reading Level / Risk Tier Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800" role="tablist">
            <button
              role="tab"
              aria-selected={activeTier === 'child_friendly'}
              onClick={() => setActiveTier('child_friendly')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                activeTier === 'child_friendly'
                  ? 'bg-slate-800 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Baby className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">Children & Schools</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTier === 'general_public'}
              onClick={() => setActiveTier('general_public')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                activeTier === 'general_public'
                  ? 'bg-slate-800 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="truncate">General Public</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTier === 'sensitive_groups'}
              onClick={() => setActiveTier('sensitive_groups')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                activeTier === 'sensitive_groups'
                  ? 'bg-slate-800 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-red-400" />
              <span className="truncate">Sensitive Groups</span>
            </button>
          </div>

          {/* Advisory Content Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 min-h-[140px] flex items-center">
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {advisoryText}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-800/80 mt-4 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">Ready for WhatsApp Broadcast & Notice Boards</span>
          <button
            onClick={handleCopyWhatsApp}
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white flex items-center gap-1.5 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy WhatsApp Broadcast Card</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
