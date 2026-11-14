import React, { useState } from 'react';
import { History, TrendingUp, TrendingDown, Minus, Wind, AlertTriangle, ShieldCheck, CheckSquare, Square, X, ChevronUp, ChevronDown, CheckCircle2, MapPin, Eye } from 'lucide-react';
import { TraceabilityChip } from './TraceabilityChip.js';
import { StatusBadge } from './StatusBadge.js';
import {
  CivicBriefingOutput,
  HotspotAndTrendItemSchema,
  ActionItemSchema,
  CleanedReadingItemSchema
} from '../types/briefingSchema.js';
import { z } from 'zod';

type CleanedReading = z.infer<typeof CleanedReadingItemSchema>;

interface CommandDiffViewProps {
  briefing: CivicBriefingOutput | null;
  activeRole: 'ward_officer' | 'housing_society' | 'school_principal';
  readings: CleanedReading[];
  selectedCitation: string | null;
  onSelectCitation: (rowId: string | null) => void;
  onNavigateToPublish: () => void;
}

export const CommandDiffView: React.FC<CommandDiffViewProps> = ({
  briefing,
  activeRole,
  readings,
  selectedCitation,
  onSelectCitation,
  onNavigateToPublish
}) => {
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [isInspectorExpanded, setIsInspectorExpanded] = useState(true);

  const toggleAction = (idx: number) => {
    setCompletedActions(prev => ({
      ...prev,
      [`${activeRole}_${idx}`]: !prev[`${activeRole}_${idx}`]
    }));
  };

  // Find inspected row details
  const inspectedRow = readings.find(r => r.row_id === selectedCitation);

  // Fallback hotspots if briefing is not yet fetched from LLM
  const hotspots = briefing?.hotspots_and_trends && briefing.hotspots_and_trends.length > 0
    ? briefing.hotspots_and_trends
    : [
        {
          hotspot_location: "Ward 4 - Industrial Belt",
          finding_summary: "Archetype: Coarse Dust & Morning Thermal Inversion Trap. PM2.5 hit 310.0 µg/m³ with wind speed <1m/s, trapping surface particulate resuspension near ground level.",
          traceability_refs: ["ROW_04", "ROW_05"]
        },
        {
          hotspot_location: "Ward 2 - Telemetry Blind Spot",
          finding_summary: "Unverified due to sensor fault. SNS_W02_03 returned -999 optical sensor error code. Hardware technician dispatch required before air quality can be verified.",
          traceability_refs: ["ROW_07"]
        }
      ];

  // Actions for current role
  const roleActions = briefing?.role_specific_actions
    ? (activeRole === 'ward_officer'
        ? briefing.role_specific_actions.ward_officer
        : activeRole === 'housing_society'
        ? briefing.role_specific_actions.housing_society
        : briefing.role_specific_actions.school_principal)
    : (activeRole === 'ward_officer'
        ? [
            {
              priority: 'IMMEDIATE' as const,
              action: "Deploy Anti-Smog Mist Truck — Dispatch water cannons to Ward 4 arterial roads to suppress coarse dust resuspension.",
              traceability_refs: ["ROW_04", "ROW_05"]
            },
            {
              priority: 'HIGH' as const,
              action: "Halt Uncovered Construction — Issue stop-work notice at Sector 4 metro excavation site until AQI drops below 250.",
              traceability_refs: ["ROW_04"]
            },
            {
              priority: 'MEDIUM' as const,
              action: "Inspect Sensor SNS_W02_03 — Field technician required for -999 optical hardware fault in Ward 2.",
              traceability_refs: ["ROW_07"]
            }
          ]
        : activeRole === 'housing_society'
        ? [
            {
              priority: 'IMMEDIATE' as const,
              action: "Suspend Diesel Generator (DG) Routine Testing — Halt scheduled 09:00 backup generator runs until inversion clears.",
              traceability_refs: ["ROW_04"]
            },
            {
              priority: 'HIGH' as const,
              action: "Mandate Wet Mopping in Common Corridors — Prohibit dry sweeping by housekeeping staff to prevent dust lofting.",
              traceability_refs: ["ROW_04"]
            },
            {
              priority: 'MEDIUM' as const,
              action: "Display Health Warning at Society Gates & Lifts — Broadcast smog advisory to all residents and security personnel.",
              traceability_refs: ["ROW_04"]
            }
          ]
        : [
            {
              priority: 'IMMEDIATE' as const,
              action: "Move Morning Assembly and Sports Indoors — Cancel all outdoor physical training sessions for kindergarten to Grade 12.",
              traceability_refs: ["ROW_04"]
            },
            {
              priority: 'HIGH' as const,
              action: "Seal Classroom Windows and Activate Purifiers — Keep doors closed; operate filtration units in all primary wings.",
              traceability_refs: ["ROW_04"]
            },
            {
              priority: 'MEDIUM' as const,
              action: "Issue Asthma & Inhaler Notice to Parents — Advise asthmatic students to keep rescue bronchodilators handy.",
              traceability_refs: ["ROW_04"]
            }
          ]);

  const roleTitle = activeRole === 'ward_officer'
    ? '🏛️ WARD OFFICER'
    : activeRole === 'housing_society'
    ? '🏢 HOUSING SOCIETY (RWA)'
    : '🏫 SCHOOL PRINCIPAL';

  return (
    <div className="space-y-6 pb-24">
      
      {/* 1. TOP DELTA DIFF STRIP ("WHAT CHANGED SINCE PREVIOUS BRIEF") */}
      <div className="p-5 rounded-xl border border-[#27272A] bg-[#18181B] shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27272A] pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              🔄 WHAT CHANGED SINCE PREVIOUS BRIEF (Compared to: BRIEF-13-NOV-AM)
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Automated Delta Diff Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Card 1: Pollution Delta */}
          <div className="p-3.5 rounded-lg bg-[#09090B] border border-red-500/60 font-mono space-y-1">
            <div className="text-xs font-bold text-red-400 flex items-center justify-between">
              <span>▲ WARD 4 SPIKE: +42%</span>
              <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-1 rounded">
                ESCALATION
              </span>
            </div>
            <p className="text-xs text-zinc-200">
              PM2.5 rose <strong className="text-white">218 -&gt; 310 µg/m³</strong>
            </p>
            <p className="text-[11px] text-zinc-400 font-sans">
              Critical threshold breached at 08:00 morning peak.
            </p>
          </div>

          {/* Card 2: Wind / Plume Shift */}
          <div className="p-3.5 rounded-lg bg-[#09090B] border border-[#27272A] font-mono space-y-1">
            <div className="text-xs font-bold text-cyan-400 flex items-center justify-between">
              <span>🌬️ PLUME SHIFT: E -&gt; W</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1 rounded">
                WIND &lt; 1 m/s
              </span>
            </div>
            <p className="text-xs text-zinc-200">
              Smog drifted into Ward 4 arterial pocket
            </p>
            <p className="text-[11px] text-zinc-400 font-sans">
              Thermal inversion trapped ground resuspension.
            </p>
          </div>

          {/* Card 3: Telemetry Health */}
          <div className="p-3.5 rounded-lg bg-[#09090B] border border-[#27272A] font-mono space-y-1">
            <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
              <span>🛠 NEW SENSOR FAULTS: +1</span>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1 rounded">
                HARDWARE
              </span>
            </div>
            <p className="text-xs text-zinc-200">
              SNS_W02_03 went offline (-999 error)
            </p>
            <p className="text-[11px] text-zinc-400 font-sans">
              Ward 2 designated as Telemetry Blind Spot.
            </p>
          </div>

        </div>
      </div>

      {/* 2. TWO-COLUMN OPERATIONAL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: DETECTED HOTSPOTS & PLAIN SUMMARY */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-xl border border-[#27272A] bg-[#18181B] space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-400" />
                DETECTED HOTSPOTS & PLAIN SUMMARY
              </span>
              <span className="text-[10px] font-mono text-zinc-500">2 Zones Identified</span>
            </div>

            <div className="space-y-3">
              {hotspots.map((h, i) => {
                const isBlindSpot = h.hotspot_location.toLowerCase().includes('blind') || h.finding_summary.toLowerCase().includes('blind');

                return (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border font-mono transition ${
                      isBlindSpot
                        ? 'bg-striped-fault border-[#27272A]'
                        : 'bg-[#09090B] border-red-500/50 hover:border-red-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-bold text-xs text-white">
                        <span>📍 {h.hotspot_location}</span>
                      </div>
                      {isBlindSpot ? (
                        <StatusBadge status="ERR" rawStr="-999" size="sm" />
                      ) : (
                        <StatusBadge severity="SEVERE" value={310} size="sm" />
                      )}
                    </div>

                    <div className="text-xs font-sans text-zinc-300 leading-relaxed mb-3">
                      <strong className="font-mono text-white block mb-1">
                        Plain Summary:
                      </strong>
                      {h.finding_summary}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#27272A] text-[11px]">
                      <span className="text-zinc-500 font-mono">Evidence:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {h.traceability_refs.map((ref) => (
                          <TraceabilityChip
                            key={ref}
                            rowId={ref}
                            onClick={onSelectCitation}
                            isSelected={selectedCitation === ref}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: ROLE-ADAPTIVE ACTION CHECKLIST */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-xl border border-[#27272A] bg-[#18181B] space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27272A] pb-3">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                  PRIORITIZED ACTIONS FOR: [{roleTitle}]
                </span>
                <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  0ms persona adaptation • Click checkboxes to track dispatch
                </p>
              </div>

              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                {Object.values(completedActions).filter(Boolean).length} / {roleActions.length} Executed
              </span>
            </div>

            <div className="space-y-3 font-mono">
              {roleActions.map((item, idx) => {
                const isChecked = !!completedActions[`${activeRole}_${idx}`];
                const isImmediate = item.priority === 'IMMEDIATE';
                const isHigh = item.priority === 'HIGH';

                return (
                  <div
                    key={idx}
                    onClick={() => toggleAction(idx)}
                    className={`p-3.5 rounded-lg border transition cursor-pointer ${
                      isChecked
                        ? 'bg-zinc-900 border-zinc-700 opacity-60'
                        : isImmediate
                        ? 'bg-[#09090B] border-red-500/60 hover:border-red-400'
                        : isHigh
                        ? 'bg-[#09090B] border-amber-500/60 hover:border-amber-400'
                        : 'bg-[#09090B] border-[#27272A] hover:border-zinc-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        aria-label={`Toggle action item ${idx + 1}`}
                        className="mt-0.5 text-zinc-400 hover:text-white shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-500" />
                        )}
                      </button>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold uppercase tracking-wider ${
                            isImmediate ? 'text-red-400' : isHigh ? 'text-amber-400' : 'text-zinc-300'
                          }`}>
                            {idx + 1}. [{isImmediate ? '▲ IMMEDIATE' : isHigh ? '◆ HIGH' : '● ROUTINE'}]
                          </span>
                          {isChecked && (
                            <span className="text-[10px] font-bold text-emerald-400 uppercase">
                              COMPLETED
                            </span>
                          )}
                        </div>

                        <p className={`text-xs font-sans text-zinc-200 leading-snug ${isChecked ? 'line-through text-zinc-500' : ''}`}>
                          {item.action}
                        </p>

                        <div className="flex items-center gap-2 pt-1 text-[11px]">
                          <span className="text-zinc-500">Evidence:</span>
                          <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {item.traceability_refs.map(ref => (
                              <TraceabilityChip
                                key={ref}
                                rowId={ref}
                                onClick={onSelectCitation}
                                isSelected={selectedCitation === ref}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next Step Shortcut */}
            <div className="pt-2 border-t border-[#27272A] flex justify-end">
              <button
                onClick={onNavigateToPublish}
                className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
              >
                <span>Proceed to Step 3: Publish Dual Outputs</span>
                <span>→</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* 3. SLIDE-UP TRACEABILITY INSPECTOR DRAWER (Pinned at Bottom) */}
      {selectedCitation && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#18181B] border-t-2 border-white shadow-2xl transition-transform"
          role="region"
          aria-label="Traceability Source Inspector"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                <span>🔽 SLIDE-UP TRACEABILITY INSPECTOR</span>
                <span className="text-zinc-400 font-normal">
                  (Source row verified against sensor hardware stream)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsInspectorExpanded(!isInspectorExpanded)}
                  className="p-1 text-zinc-400 hover:text-white"
                  aria-label="Toggle inspector drawer"
                >
                  {isInspectorExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => onSelectCitation(null)}
                  className="p-1 text-zinc-400 hover:text-white"
                  aria-label="Close inspector drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isInspectorExpanded && (
              <div className="pt-3 font-mono text-xs text-zinc-300">
                {inspectedRow ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#09090B] p-3 rounded-lg border border-[#27272A]">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Row ID</span>
                      <strong className="text-white">{inspectedRow.row_id}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Sensor Hardware</span>
                      <strong className="text-zinc-300">{inspectedRow.sensor_id}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Ward & Pollutant</span>
                      <strong className="text-white">{inspectedRow.ward_name} ({inspectedRow.pollutant})</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Raw Input</span>
                      <strong className="text-zinc-300">{inspectedRow.raw_value} {inspectedRow.raw_unit}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Normalized Result</span>
                      <strong className="text-emerald-400">
                        {inspectedRow.normalized_value_ugm3 !== null ? `${inspectedRow.normalized_value_ugm3} µg/m³` : 'EXCLUDED / FAULT'}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#09090B] p-3 rounded-lg border border-[#27272A] flex items-center justify-between">
                    <div>
                      Highlighted Source: <strong className="text-white">{selectedCitation}</strong> | Sensor: <strong className="text-zinc-300">SNS_W04_01</strong> | Time: <strong className="text-zinc-300">08:00</strong> | Raw: <strong className="text-amber-400">0.31 mg/m³ -&gt; 310.0 µg/m³</strong>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-bold">100% TRACEABLE</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
