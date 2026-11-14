import React from 'react';
import { TrendingUp, TrendingDown, Minus, History, Compass, AlertOctagon } from 'lucide-react';
import { ComparisonWithPreviousSchema } from '../types/briefingSchema.js';
import { z } from 'zod';

type ComparisonWithPrevious = z.infer<typeof ComparisonWithPreviousSchema>;

interface DiffBannerProps {
  comparison: ComparisonWithPrevious | null;
  previousBriefId: string | null;
}

export const DiffBanner: React.FC<DiffBannerProps> = ({ comparison, previousBriefId }) => {
  if (!comparison) return null;

  const isWorsened = comparison.overall_trend === 'WORSENED';
  const isImproved = comparison.overall_trend === 'IMPROVED';
  const isStable = comparison.overall_trend === 'STABLE';

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isWorsened
        ? 'bg-red-950/20 border-red-800/60'
        : isImproved
        ? 'bg-emerald-950/20 border-emerald-800/60'
        : 'bg-slate-900 border-slate-800'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            What Changed Since Last Brief?
          </span>
          {previousBriefId && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              Compared with {previousBriefId}
            </span>
          )}
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
            isWorsened
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : isImproved
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}>
            {isWorsened ? (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                ▲ WORSENED
              </>
            ) : isImproved ? (
              <>
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                ▼ IMPROVED
              </>
            ) : (
              <>
                <Minus className="w-3.5 h-3.5 text-blue-400" />
                ◆ STABLE
              </>
            )}
          </span>
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="mt-2 text-xs text-slate-300 leading-relaxed font-medium">
        {comparison.summary_of_changes}
      </div>

      {/* Plume Shift & Hardware Alerts */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-teal-400" />
          <span><strong>Plume Dynamics:</strong> {comparison.hotspot_shifts}</span>
        </div>

        {comparison.new_sensor_failures.length > 0 && (
          <div className="flex items-center gap-1.5 text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            <span>Telemetry Alert: {comparison.new_sensor_failures.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
