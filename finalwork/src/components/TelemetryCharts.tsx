import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { CleanedReadingItemSchema } from '../types/briefingSchema.js';
import { z } from 'zod';

type CleanedReading = z.infer<typeof CleanedReadingItemSchema>;

interface TelemetryChartsProps {
  readings: CleanedReading[];
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ readings }) => {
  // Extract PM2.5 readings for wards
  const pm25Readings = readings
    .filter(r => r.pollutant === 'PM2.5' && r.normalized_value_ugm3 !== null)
    .map(r => ({
      ward: r.ward_name,
      val: r.normalized_value_ugm3 as number,
      severity: r.aqi_severity,
      rowId: r.row_id
    }));

  const maxVal = Math.max(400, ...pm25Readings.map(p => p.val));

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
      
      {/* 1. Ward Particulate Benchmark Bar Chart */}
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
                    <span className="text-slate-800 truncate max-w-[200px] text-[11px]">
                      {item.ward}
                    </span>
                    <span className="font-mono text-xs font-bold flex items-center gap-1.5">
                      <span className={isCritical ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'}>
                        {item.val} µg/m³
                      </span>
                      {isCritical && (
                        <span className="text-[9px] bg-rose-100 text-rose-800 px-1 py-0.2 rounded font-sans font-bold">
                          ▲ SPIKE
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Visual Bar */}
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
              Load telemetry preset to display ward comparison bars
            </div>
          )}
        </div>
      </div>

      {/* 2. Diurnal Timeline Progression Line Graph (SVG) */}
      <div className="md:col-span-5 bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs space-y-3 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
              Diurnal Morning Spike Trend
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
            07:30 - 09:00 IST
          </span>
        </div>

        {/* SVG Sparkline Graph */}
        <div className="relative py-2">
          <svg viewBox="0 0 300 90" className="w-full h-20 overflow-visible">
            {/* Guide Gridlines */}
            <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
            <line x1="0" y1="50" x2="300" y2="50" stroke="#F1F5F9" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2="300" y2="80" stroke="#E2E8F0" />

            {/* Threshold Line: 300 ug Critical */}
            <line x1="0" y1="30" x2="300" y2="30" stroke="#FDA4AF" strokeDasharray="2 2" />
            <text x="230" y="26" fill="#E11D48" fontSize="8" fontFamily="monospace">GRAP IV (300)</text>

            {/* Trend Gradient Area */}
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#E11D48" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <path
              d="M 10 75 Q 70 65, 120 45 T 200 15 T 280 40 L 280 80 L 10 80 Z"
              fill="url(#trendGradient)"
            />

            {/* Main Trend Line */}
            <path
              d="M 10 75 Q 70 65, 120 45 T 200 15 T 280 40"
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
            />

            {/* Data Points */}
            <circle cx="10" cy="75" r="3.5" fill="#059669" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="120" cy="45" r="3.5" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="200" cy="15" r="4.5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="280" cy="40" r="3.5" fill="#059669" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Point Labels */}
            <text x="6" y="88" fill="#64748B" fontSize="8" fontFamily="monospace">07:30</text>
            <text x="110" y="88" fill="#64748B" fontSize="8" fontFamily="monospace">08:00</text>
            <text x="190" y="88" fill="#DC2626" fontSize="8" fontWeight="bold" fontFamily="monospace">08:30 (Peak)</text>
            <text x="268" y="88" fill="#64748B" fontSize="8" fontFamily="monospace">09:00</text>
          </svg>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Inversion trap peaked at 08:30</span>
          <span className="text-emerald-700 font-semibold">Morning Rush Hours</span>
        </div>
      </div>

    </div>
  );
};
