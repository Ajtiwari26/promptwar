import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { CleanedReadingItemSchema } from '../types/briefingSchema.js';
import { z } from 'zod';

type CleanedReading = z.infer<typeof CleanedReadingItemSchema>;

interface TelemetryChartsProps {
  readings: CleanedReading[];
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ readings }) => {
  // 1. Extract real PM2.5 readings for wards
  const pm25Readings = readings
    .filter(r => r.pollutant === 'PM2.5' && r.normalized_value_ugm3 !== null && r.validation_status === 'VALID')
    .map(r => ({
      ward: r.ward_name,
      val: r.normalized_value_ugm3 as number,
      severity: r.aqi_severity,
      rowId: r.row_id,
      timestamp: r.timestamp_iso
    }));

  const maxVal = Math.max(350, ...pm25Readings.map(p => p.val));

  // 2. Extract chronological trend points directly from CSV telemetry
  const trendPoints = readings
    .filter(r => (r.pollutant === 'PM2.5' || r.pollutant === 'PM10') && r.normalized_value_ugm3 !== null && r.validation_status === 'VALID')
    .slice(0, 10)
    .map((r, i) => {
      // Parse time string if available (e.g. 08:30 or 2026-11-14T08:30:00Z)
      let timeLabel = `R${i + 1}`;
      if (r.timestamp_iso) {
        if (r.timestamp_iso.includes('T')) {
          const parts = r.timestamp_iso.split('T')[1];
          timeLabel = parts ? parts.slice(0, 5) : timeLabel;
        } else if (r.timestamp_iso.includes(':')) {
          timeLabel = r.timestamp_iso.slice(0, 5);
        }
      }
      return {
        label: timeLabel,
        val: r.normalized_value_ugm3 as number,
        rowId: r.row_id,
        pollutant: r.pollutant,
        ward: r.ward_name
      };
    });

  // Calculate dynamic SVG coordinates from real telemetry
  const svgWidth = 320;
  const svgHeight = 90;
  const padX = 25;
  const padY = 18;
  const maxTrendVal = Math.max(300, ...trendPoints.map(t => t.val));

  const coords = trendPoints.map((pt, i) => {
    const x = trendPoints.length > 1
      ? padX + (i / (trendPoints.length - 1)) * (svgWidth - 2 * padX)
      : svgWidth / 2;
    const y = svgHeight - padY - (pt.val / maxTrendVal) * (svgHeight - 2 * padY);
    return { ...pt, x: Math.round(x), y: Math.round(y) };
  });

  const pathD = coords.length > 0
    ? coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
    : '';

  const areaD = coords.length > 0
    ? `${pathD} L ${coords[coords.length - 1].x} ${svgHeight - padY} L ${coords[0].x} ${svgHeight - padY} Z`
    : '';

  const peakPoint = coords.reduce((max, c) => (c.val > (max?.val || 0) ? c : max), coords[0]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
      
      {/* 1. Ward Particulate Benchmark Bar Chart — 100% Derived from CSV */}
      <div className="md:col-span-7 bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
              PM2.5 Ward Benchmark Comparison (µg/m³)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-0.5 bg-emerald-500 inline-block"></span>
              Safe: 60
            </span>
            <span className="flex items-center gap-1 text-rose-700">
              <span className="w-2 h-0.5 bg-rose-500 inline-block"></span>
              Emergency: 300
            </span>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {pm25Readings.length > 0 ? (
            pm25Readings.map((item, idx) => {
              const pct = Math.min(100, Math.round((item.val / maxVal) * 100));
              const isCritical = item.val >= 300;
              const isWarning = item.val > 100 && item.val < 300;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-800 truncate max-w-[200px] text-[11px]" title={item.ward}>
                      {item.ward}
                    </span>
                    <span className="font-mono text-xs font-bold flex items-center gap-1.5">
                      <span className={isCritical ? 'text-rose-700 font-extrabold' : isWarning ? 'text-amber-700' : 'text-emerald-700'}>
                        {item.val} µg/m³
                      </span>
                      {isCritical && (
                        <span className="text-[9px] bg-rose-100 text-rose-800 px-1 py-0.2 rounded font-sans font-bold">
                          ▲ SPIKE
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Visual Bar with Actual Data Proportions */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                    {/* Safe Limit Marker (60 ug) */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-10"
                      style={{ left: `${Math.round((60 / maxVal) * 100)}%` }}
                      title="CPCB Safe Limit (60 µg/m³)"
                    />
                    {/* Emergency Marker (300 ug) */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10"
                      style={{ left: `${Math.round((300 / maxVal) * 100)}%` }}
                      title="GRAP Stage IV Severe (300 µg/m³)"
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical
                          ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                          : isWarning
                          ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-xs text-slate-400 font-mono">
              No valid PM2.5 readings in telemetry input
            </div>
          )}
        </div>
      </div>

      {/* 2. Diurnal Timeline Progression Line Graph (SVG) — 100% Derived from CSV */}
      <div className="md:col-span-5 bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
              CSV Telemetry Trend ({trendPoints.length} Points)
            </span>
          </div>
          {peakPoint && (
            <span className="text-[10px] font-mono text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-bold">
              Peak: {peakPoint.val} µg
            </span>
          )}
        </div>

        {/* Dynamic SVG Sparkline Graph from Real CSV Coordinates */}
        <div className="relative py-2">
          {coords.length > 1 ? (
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-20 overflow-visible">
              {/* Threshold Line: 300 ug Critical */}
              <line
                x1={padX}
                y1={svgHeight - padY - (300 / maxTrendVal) * (svgHeight - 2 * padY)}
                x2={svgWidth - padX}
                y2={svgHeight - padY - (300 / maxTrendVal) * (svgHeight - 2 * padY)}
                stroke="#FDA4AF"
                strokeDasharray="2 2"
              />
              <text x={svgWidth - padX - 60} y={svgHeight - padY - (300 / maxTrendVal) * (svgHeight - 2 * padY) - 3} fill="#E11D48" fontSize="8" fontFamily="monospace">
                GRAP IV (300)
              </text>

              {/* Trend Gradient Area */}
              <defs>
                <linearGradient id="realTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#E11D48" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path d={areaD} fill="url(#realTrendGradient)" />

              {/* Main Line connecting CSV points */}
              <path d={pathD} fill="none" stroke="#059669" strokeWidth="2.5" />

              {/* Data Points from CSV */}
              {coords.map((c, i) => {
                const isPeak = c === peakPoint;
                return (
                  <g key={i}>
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={isPeak ? 4.5 : 3}
                      fill={isPeak ? '#DC2626' : c.val > 150 ? '#D97706' : '#059669'}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    <text
                      x={c.x}
                      y={svgHeight - 2}
                      textAnchor="middle"
                      fill={isPeak ? '#DC2626' : '#64748B'}
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight={isPeak ? 'bold' : 'normal'}
                    >
                      {c.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="h-20 flex items-center justify-center text-xs text-slate-400 font-mono">
              Insufficient time points to draw graph
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>{peakPoint ? `Max surge detected in ${peakPoint.ward}` : 'Awaiting sensor stream'}</span>
          <span className="text-emerald-700 font-semibold font-mono">
            {readings.filter(r => r.validation_status === 'VALID').length} Valid / {readings.length} Total
          </span>
        </div>
      </div>

    </div>
  );
};
