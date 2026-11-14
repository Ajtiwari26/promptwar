import React, { useEffect, useRef } from 'react';
import { Database, AlertTriangle, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';
import { CleanedReadingItemSchema, DataQualityFlagItemSchema } from '../types/briefingSchema.js';
import { z } from 'zod';

type CleanedReading = z.infer<typeof CleanedReadingItemSchema>;
type DataQualityFlag = z.infer<typeof DataQualityFlagItemSchema>;

interface DataAuditDrawerProps {
  readings: CleanedReading[];
  flags: DataQualityFlag[];
  highlightedRowId: string | null;
  onClearHighlight: () => void;
}

export const DataAuditDrawer: React.FC<DataAuditDrawerProps> = ({
  readings,
  flags,
  highlightedRowId,
  onClearHighlight
}) => {
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // Auto-scroll to highlighted row when citation is clicked
  useEffect(() => {
    if (highlightedRowId && rowRefs.current[highlightedRowId]) {
      rowRefs.current[highlightedRowId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlightedRowId]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Telemetry Audit & Traceability Matrix
          </h2>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
            {readings.length} Ingested Rows
          </span>
        </div>

        {highlightedRowId && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-mono font-semibold animate-pulse">
              Highlighting Citation: {highlightedRowId}
            </span>
            <button
              onClick={onClearHighlight}
              className="text-[10px] text-slate-400 hover:text-white underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Flagged Hardware Anomalies Box */}
      {flags.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5" role="alert">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Telemetry Quality Alerts ({flags.length} Flagged Readings)</span>
          </div>
          <div className="space-y-1 pl-6">
            {flags.map((flag, idx) => (
              <div key={idx} className="text-[11px] text-slate-300">
                <strong className="font-mono text-amber-300">{flag.row_id} ({flag.sensor_id}):</strong> {flag.explanation}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-2.5">Row ID</th>
              <th className="p-2.5">Sensor ID</th>
              <th className="p-2.5">Ward Location</th>
              <th className="p-2.5">Pollutant</th>
              <th className="p-2.5">Raw Input</th>
              <th className="p-2.5">Normalized (µg/m³)</th>
              <th className="p-2.5">Severity</th>
              <th className="p-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {readings.map((r) => {
              const isTarget = highlightedRowId === r.row_id;
              const isInvalid = r.validation_status !== 'VALID';

              return (
                <tr
                  key={r.row_id}
                  ref={(el) => {
                    rowRefs.current[r.row_id] = el;
                  }}
                  className={`transition-colors ${
                    isTarget
                      ? 'bg-emerald-500/20 ring-2 ring-emerald-400'
                      : isInvalid
                      ? 'bg-red-950/20 hover:bg-red-950/40'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  <td className="p-2.5 font-bold text-slate-200">{r.row_id}</td>
                  <td className="p-2.5 text-slate-400">{r.sensor_id}</td>
                  <td className="p-2.5 font-sans text-slate-300">{r.ward_name}</td>
                  <td className="p-2.5 font-bold text-white">{r.pollutant}</td>
                  <td className="p-2.5 text-slate-400">
                    {r.raw_value} {r.raw_unit}
                  </td>
                  <td className="p-2.5 font-bold text-emerald-400">
                    {r.normalized_value_ugm3 !== null ? `${r.normalized_value_ugm3} µg/m³` : '—'}
                  </td>
                  <td className="p-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      r.aqi_severity === 'SEVERE'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : r.aqi_severity === 'VERY_POOR'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                        : r.aqi_severity === 'POOR'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {r.aqi_severity}
                    </span>
                  </td>
                  <td className="p-2.5">
                    {r.validation_status === 'VALID' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        VALID
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1 font-bold">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        {r.validation_status}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
