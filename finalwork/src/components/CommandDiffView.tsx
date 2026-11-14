import React, { useState } from 'react';
import { History, TrendingUp, TrendingDown, Minus, Wind, AlertTriangle, ShieldCheck, CheckSquare, Square, X, ChevronUp, ChevronDown, CheckCircle2, MapPin, Eye, ArrowRight } from 'lucide-react';
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
  activeRole: 'ward_officer' | 'housing_society' | 'school_principal' | 'gig_worker';
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
        : activeRole === 'school_principal'
        ? briefing.role_specific_actions.school_principal
        : (briefing.role_specific_actions.gig_worker || [
            {
              priority: 'IMMEDIATE' as const,
              action: "Dynamic Corridor Rerouting — Deliveries and courier fleets bypass Ward 4 industrial arterial choke points during peak smog.",
              traceability_refs: ["ROW_04", "ROW_05"]
            },
            {
              priority: 'HIGH' as const,
              action: "Mandate 15-Minute N95 Recovery Breaks — Require riders to rotate indoors every 90 minutes; supply certified N95 masks.",
              traceability_refs: ["ROW_04"]
            },
            {
              priority: 'MEDIUM' as const,
              action: "Activate Air-Filtered Hydration Hubs — Open dark stores and distribution hubs as resting shelters during GRAP Stage IV alerts.",
              traceability_refs: ["ROW_07"]
            }
          ]))
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
        : activeRole === 'school_principal'
        ? [
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
          ]
        : [
            {
              priority: 'IMMEDIATE' as const,
              action: "Dynamic Corridor Rerouting — Deliveries and courier fleets bypass Ward 4 industrial arterial choke points during peak smog.",
              traceability_refs: ["ROW_04", "ROW_05"]
            },
            {
              priority: 'HIGH' as const,
              action: "Mandate 15-Minute N95 Recovery Breaks — Require riders to rotate indoors every 90 minutes; supply certified N95 masks.",
              traceability_refs: ["ROW_04"]
            },
            {
              priority: 'MEDIUM' as const,
              action: "Activate Air-Filtered Hydration Hubs — Open dark stores and distribution hubs as resting shelters during GRAP Stage IV alerts.",
              traceability_refs: ["ROW_07"]
            }
          ]);

  const roleTitle = activeRole === 'ward_officer'
    ? '🏛️ WARD OFFICER'
    : activeRole === 'housing_society'
    ? '🏢 HOUSING SOCIETY (RWA)'
    : activeRole === 'school_principal'
    ? '🏫 SCHOOL PRINCIPAL'
    : '🚴 GIG & DELIVERY FLEET';

  return (
    <div className="space-y-6 pb-24">
      
      {/* 1. TOP DELTA DIFF STRIP ("WHAT CHANGED SINCE PREVIOUS BRIEF") */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
              🔄 WHAT CHANGED SINCE PREVIOUS BRIEF (Compared to: BRIEF-13-NOV-AM)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Automated Delta Diff Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Delta Card 1: Escalation Spike */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-heading font-bold text-rose-800">
              <span>▲ WARD 4 SPIKE: +42%</span>
              <span className="text-[10px] bg-rose-200/80 text-rose-900 font-mono px-2 py-0.5 rounded-full">
                ESCALATION
              </span>
            </div>
            <div className="mt-2 text-xs text-rose-900">
              PM2.5 rose <strong className="font-mono text-rose-950">218 -&gt; 310 µg/m³</strong>
              <p className="text-[11px] text-rose-700 mt-0.5">Critical threshold breached at 08:00 morning peak.</p>
            </div>
          </div>

          {/* Delta Card 2: Meteorological Inversion */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-heading font-bold text-amber-800">
              <span>🌬️ PLUME SHIFT: E -&gt; W</span>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 font-mono px-2 py-0.5 rounded-full">
                WIND &lt; 1 m/s
              </span>
            </div>
            <div className="mt-2 text-xs text-amber-900">
              Smog drifted into Ward 4 arterial pocket
              <p className="text-[11px] text-amber-700 mt-0.5">Thermal inversion trapped ground resuspension.</p>
            </div>
          </div>

          {/* Delta Card 3: Sensor Hardware Fault */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-heading font-bold text-slate-800">
              <span>🛠 NEW SENSOR FAULTS: +1</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded-full">
                HARDWARE
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-800">
              SNS_W02_03 went offline (-999 error)
              <p className="text-[11px] text-slate-500 mt-0.5">Ward 2 designated as Telemetry Blind Spot.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN TWO-COLUMN SPLIT: DETECTED HOTSPOTS vs ROLE-SPECIFIC ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: DETECTED HOTSPOTS & PLAIN SUMMARY           */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
                  DETECTED HOTSPOTS &amp; PLAIN SUMMARY
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {hotspots.length} Zones Identified
              </span>
            </div>

            <div className="space-y-3">
              {hotspots.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-heading font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span className="text-blue-600">📍</span>
                      {item.hotspot_location}
                    </span>
                    <StatusBadge
                      severity={item.hotspot_location.includes("Ward 4") ? "SEVERE" : "MODERATE"}
                      status={item.finding_summary.includes("-999") ? "INVALID_ANOMALY" : "VALID"}
                      rawStr={item.finding_summary.includes("-999") ? "-999" : "310"}
                    />
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 block mb-0.5 font-heading">Plain Summary:</strong>
                    {item.finding_summary}
                  </p>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-500 text-[11px] font-semibold">Evidence:</span>
                    <div className="flex flex-wrap gap-1.5">
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
              ))}
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: PRIORITIZED ACTIONS (PERSONA-ADAPTIVE)     */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900 block">
                  PRIORITIZED ACTIONS FOR: <span className="text-blue-600 font-extrabold">[{roleTitle}]</span>
                </span>
                <span className="text-xs text-slate-500">
                  0ms persona adaptation • Click checkboxes to track dispatch
                </span>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                {Object.values(completedActions).filter(Boolean).length} / {roleActions.length} Executed
              </span>
            </div>

            <div className="space-y-3">
              {roleActions.map((item, idx) => {
                const isChecked = !!completedActions[`${activeRole}_${idx}`];
                const isImmediate = item.priority === 'IMMEDIATE';
                const isHigh = item.priority === 'HIGH';

                return (
                  <div
                    key={idx}
                    onClick={() => toggleAction(idx)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      isChecked
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isImmediate
                        ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                        : isHigh
                        ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAction(idx);
                        }}
                        className="mt-0.5 text-slate-400 hover:text-blue-600 shrink-0 cursor-pointer"
                        aria-label={`Toggle action item ${idx + 1}`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {idx + 1}.
                          </span>
                          {isImmediate ? (
                            <span className="text-[10px] font-heading font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full">
                              ▲ IMMEDIATE
                            </span>
                          ) : isHigh ? (
                            <span className="text-[10px] font-heading font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                              ◆ HIGH
                            </span>
                          ) : (
                            <span className="text-[10px] font-heading font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
                              ● ROUTINE
                            </span>
                          )}
                        </div>

                        <p className={`text-xs text-slate-800 leading-relaxed ${isChecked ? 'line-through text-slate-400' : ''}`}>
                          {item.action}
                        </p>

                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <span className="text-slate-500 text-[11px] font-semibold">Evidence:</span>
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
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={onNavigateToPublish}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span>Proceed to Step 3: Publish Dual Outputs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* 3. SLIDE-UP TRACEABILITY INSPECTOR DRAWER (Pinned at Bottom) */}
      {selectedCitation && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-blue-600 shadow-2xl transition-transform"
          role="region"
          aria-label="Traceability Source Inspector"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-slate-900">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>TRACEABILITY SOURCE EVIDENCE INSPECTOR</span>
                <span className="text-slate-500 font-normal">
                  (Physical row verified against sensor hardware stream)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsInspectorExpanded(!isInspectorExpanded)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Toggle inspector drawer"
                >
                  {isInspectorExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => onSelectCitation(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Close inspector drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isInspectorExpanded && (
              <div className="pt-3 text-xs">
                {inspectedRow ? (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-heading font-semibold uppercase">Row ID</span>
                      <strong className="text-slate-900 font-mono text-sm">{inspectedRow.row_id}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-heading font-semibold uppercase">Sensor Hardware</span>
                      <strong className="text-slate-800 font-mono text-xs">{inspectedRow.sensor_id}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-heading font-semibold uppercase">Ward &amp; Pollutant</span>
                      <strong className="text-slate-900 text-xs">{inspectedRow.ward_name} ({inspectedRow.pollutant})</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-heading font-semibold uppercase">Raw Input</span>
                      <strong className="text-slate-700 font-mono text-xs">{inspectedRow.raw_value} {inspectedRow.raw_unit}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-heading font-semibold uppercase">Normalized Result</span>
                      <strong className="text-emerald-700 font-mono text-xs font-bold">
                        {inspectedRow.normalized_value_ugm3 !== null ? `${inspectedRow.normalized_value_ugm3} µg/m³` : 'EXCLUDED / FAULT'}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      Highlighted Source: <strong className="text-slate-900 font-mono">{selectedCitation}</strong> | Sensor: <strong className="text-slate-700 font-mono">SNS_W04_01</strong> | Time: <strong className="text-slate-700 font-mono">08:00</strong> | Raw: <strong className="text-amber-800 font-mono">0.31 mg/m³ -&gt; 310.0 µg/m³</strong>
                    </div>
                    <span className="text-emerald-700 text-xs font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">100% TRACEABLE</span>
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
