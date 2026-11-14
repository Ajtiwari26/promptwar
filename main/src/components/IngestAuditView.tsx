import React, { useState, useRef } from 'react';
import { Upload, FileText, Zap, RefreshCw, Play, Filter, AlertTriangle, CheckCircle, Database, ArrowRight, ShieldCheck, Inbox, Leaf, BarChart2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge.js';
import { TraceabilityChip } from './TraceabilityChip.js';
import { TelemetryCharts } from './TelemetryCharts.js';
import { CleanedReadingItemSchema, DataQualityFlagItemSchema } from '../types/briefingSchema.js';
import { z } from 'zod';

type CleanedReading = z.infer<typeof CleanedReadingItemSchema>;
type DataQualityFlag = z.infer<typeof DataQualityFlagItemSchema>;

interface IngestAuditViewProps {
  readings: CleanedReading[];
  flags: DataQualityFlag[];
  activePreset: string | null;
  onSelectPreset: (presetId: 'baseline' | 'crisis' | 'post_action') => void;
  onAnalyze: (payload: { text?: string; inlineData?: { data: string; mimeType: string }; presetId?: string }) => void;
  isLoading: boolean;
  highlightedRowId: string | null;
  onSelectRow: (rowId: string) => void;
  onNavigateToCommand: () => void;
}

export const IngestAuditView: React.FC<IngestAuditViewProps> = ({
  readings,
  flags,
  activePreset,
  onSelectPreset,
  onAnalyze,
  isLoading,
  highlightedRowId,
  onSelectRow,
  onNavigateToCommand
}) => {
  const [filter, setFilter] = useState<'all' | 'valid' | 'flagged'>('all');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; mimeType: string; base64?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setSelectedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          mimeType: file.type || 'application/pdf',
          base64
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        const text = reader.result as string;
        setPastedText(text);
        setSelectedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          mimeType: file.type || 'text/csv'
        });
      };
      reader.readAsText(file);
    }
  };

  const handleCleanAndGenerate = () => {
    if (selectedFile?.base64) {
      onAnalyze({ inlineData: { data: selectedFile.base64, mimeType: selectedFile.mimeType } });
    } else if (pastedText.trim()) {
      onAnalyze({ text: pastedText });
    } else {
      // If user clicks without entering text, load Preset 2 (Crisis) as realistic quick demo
      onSelectPreset('crisis');
    }
  };

  // Filter calculations
  const validReadings = readings.filter(r => r.validation_status === 'VALID');
  const flaggedReadings = readings.filter(r => r.validation_status !== 'VALID');
  const displayedReadings = filter === 'valid'
    ? validReadings
    : filter === 'flagged'
    ? flaggedReadings
    : readings;

  const hasData = readings.length > 0;

  return (
    <div className="space-y-6">
      
      {/* 1. TOP PRESET STRIP - CRISP ECO-CIVIC VERDANTAIR ELEVATION */}
      <div className="p-5 rounded-2xl border border-emerald-100 bg-white shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
              QUICK DEMO PRESETS (Instant 1-Click Evaluation):
            </span>
          </div>
          <span className="text-xs text-emerald-800/80">
            Click any scenario to immediately populate telemetry and audit report
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={() => onSelectPreset('baseline')}
            disabled={isLoading}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              activePreset === 'baseline'
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200 shadow-xs'
                : 'bg-white border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/30'
            }`}
          >
            <div className="text-xs font-heading font-bold text-emerald-900 flex items-center justify-between">
              <span>⚡ Preset 1: Baseline Day</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                AQI ~85
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Normal moderate air quality across all 4 wards. All telemetry calibrated and operational.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectPreset('crisis')}
            disabled={isLoading}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              activePreset === 'crisis'
                ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-200 shadow-xs'
                : 'bg-white border-emerald-100 hover:border-rose-300 hover:bg-rose-50/30'
            }`}
          >
            <div className="text-xs font-heading font-bold text-rose-900 flex items-center justify-between">
              <span>⚡ Preset 2: Severe Spike + -999</span>
              <span className="text-[10px] bg-rose-100 text-rose-800 font-mono font-bold px-2 py-0.5 rounded-full border border-rose-200">
                ▲ AQI 413
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Ward 4 PM2.5 spike (0.31 mg/m³ = 310 µg), inversion trap, and Ward 2 optical -999 fault.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectPreset('post_action')}
            disabled={isLoading}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              activePreset === 'post_action'
                ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-200 shadow-xs'
                : 'bg-white border-emerald-100 hover:border-teal-300 hover:bg-teal-50/30'
            }`}
          >
            <div className="text-xs font-heading font-bold text-teal-900 flex items-center justify-between">
              <span>⚡ Preset 3: Post-Intervention Shift</span>
              <span className="text-[10px] bg-teal-100 text-teal-800 font-mono font-semibold px-2 py-0.5 rounded-full border border-teal-200">
                -62% Delta
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Mist cannons deployed, construction dust suppressed, and sensor repaired. Demonstrates diff.
            </p>
          </button>
        </div>
      </div>

      {/* 2. TWO-COLUMN WORKSPACE: LEFT (INPUT AREA) vs RIGHT (AUDIT & REPORT AREA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: MULTIMODAL & RAW INPUT ZONE                 */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl border border-emerald-100 bg-white shadow-2xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
                  STEP 1: SENSOR INGESTION &amp; INPUT ZONE
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Live Ingest
              </span>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-200 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-xl p-5 text-center cursor-pointer transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.json,.xml,.pdf,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-7 h-7 mx-auto text-emerald-600/70 group-hover:text-emerald-700 transition mb-2" />
              
              {selectedFile ? (
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold text-slate-900 block truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                    Staged: {selectedFile.name} ({selectedFile.size})
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-800">
                    Click to browse sensor streams or roadside photos
                  </p>
                  <p className="text-[11px] text-slate-500">
                    CSV, XML, JSON, TXT, PDF Bulletins, or Sensor LCD Photos (Max 5MB)
                  </p>
                </div>
              )}
            </div>

            {/* Paste Table / Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <label htmlFor="telemetryText" className="font-semibold text-slate-700">
                  OR PASTE FIELD REPORT / TABLE:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const sample = `# DELHI POLLUTION CONTROL COMMITTEE - CONTINUOUS AMBIENT AIR TELEMETRY
# Timestamp: 2026-11-14 08:30 IST | Emergency Monitoring Cycle
Ward_ID,Ward_Name,Sensor_ID,Pollutant,Raw_Reading,Units,Remarks
W_04,Ward 4 - Industrial Belt,SNS_W04_01,PM2.5,0.31,mg/m3,Severe smoke plume near diesel generator yard
W_04,Ward 4 - Industrial Belt,SNS_W04_01,PM10,480.0,ug/m3,Heavy particulate loading
W_04,Ward 4 - Industrial Belt,SNS_W04_02,CO,2.8,mg/m3,Spike near highway freight corridor
W_02,Ward 2 - Central Market,SNS_W02_03,PM10,-999,ug/m3,Optical sensor hardware fault
W_01,Ward 1 - Green Belt,SNS_W01_02,PM2.5,74.5,ug/m3,Normal calibrated baseline`;
                    setPastedText(sample);
                  }}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  [Insert Sample]
                </button>
              </div>

              <textarea
                id="telemetryText"
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste messy CSV, tab-separated readings, irregular units (mg/m³, ug/m³), or raw field notes..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition resize-none"
              />
            </div>

            {/* Action Button: Clean & Generate */}
            <button
              type="button"
              onClick={handleCleanAndGenerate}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs uppercase tracking-wider transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Physical Telemetry...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>CLEAN &amp; GENERATE BRIEF -&gt;</span>
                </>
              )}
            </button>

            {hasData && (
              <button
                type="button"
                onClick={onNavigateToCommand}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-heading font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Step 2: Command &amp; Diff</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: DETERMINISTIC AUDIT & CLEANED TABLE        */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl border border-emerald-100 bg-white shadow-2xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900 block">
                  DETERMINISTIC AUDIT &amp; CLEANED TELEMETRY TABLE
                </span>
                <span className="text-xs text-slate-500">
                  Physical validation with zero hallucinated concentrations
                </span>
              </div>

              {hasData && (
                <div className="flex items-center gap-1.5 self-start sm:self-auto" role="group" aria-label="Table Filter">
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      filter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({readings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('valid')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      filter === 'valid'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    Valid ({validReadings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('flagged')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      filter === 'flagged'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    ✖ Flagged ({flaggedReadings.length})
                  </button>
                </div>
              )}
            </div>

            {/* Table or Empty Standby State */}
            <div>
              {!hasData ? (
                <div className="py-16 px-6 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/20 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                    <Inbox className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-heading font-bold text-sm text-slate-800">
                      AWAITING SENSOR TELEMETRY STREAM
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Telemetry panel is in standby. Click any <strong className="text-emerald-800">1-Click Demo Preset</strong> above, or upload/paste sensor streams on the left to trigger physical validation.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => onSelectPreset('baseline')}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-emerald-200 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 cursor-pointer shadow-2xs"
                    >
                      ⚡ Load Baseline Day
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPreset('crisis')}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white cursor-pointer shadow-xs"
                    >
                      ⚡ Load Severe Crisis Preset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cleaned Telemetry Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-72 bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 sticky top-0 uppercase tracking-wider text-[11px] font-heading font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">ID</th>
                          <th className="p-3">Ward</th>
                          <th className="p-3">Pollutant</th>
                          <th className="p-3">Raw</th>
                          <th className="p-3">Norm (µg/m³)</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {displayedReadings.map((r) => {
                          const isFault = r.validation_status === 'INVALID_ANOMALY' || r.raw_value === '-999';
                          const isGap = r.validation_status === 'MISSING' || r.raw_value === 'NULL' || r.raw_value === 'NA';
                          const isConverted = r.raw_unit.toLowerCase().includes('mg');
                          const isSelected = highlightedRowId === r.row_id;

                          return (
                            <tr
                              key={r.row_id}
                              onClick={() => onSelectRow(r.row_id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-emerald-50 ring-1 ring-emerald-300'
                                  : isFault
                                  ? 'bg-rose-50/40 text-slate-800'
                                  : isGap
                                  ? 'bg-amber-50/40 text-slate-800'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <td className="p-3 font-mono font-bold text-slate-900">
                                <span className="underline decoration-dotted underline-offset-2">{r.row_id}</span>
                              </td>
                              <td className="p-3 font-medium text-slate-800">
                                {r.ward_name}
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-900">
                                {r.pollutant}
                              </td>
                              <td className="p-3 font-mono text-slate-600">
                                {r.raw_value} {r.raw_unit}
                              </td>
                              <td className="p-3 font-mono font-bold">
                                {isFault ? (
                                  <span className="text-slate-400 font-mono">EXCLUDED</span>
                                ) : isGap ? (
                                  <span className="text-amber-600 font-mono">GAP</span>
                                ) : (
                                  <span className="text-slate-900 flex items-center gap-1.5">
                                    <span>{r.normalized_value_ugm3}</span>
                                    {isConverted && (
                                      <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-semibold border border-emerald-200" title="1000x scaled from mg/m³ to µg/m³">
                                        🔄 1000x
                                      </span>
                                    )}
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <StatusBadge
                                  severity={r.aqi_severity}
                                  status={r.validation_status}
                                  value={r.normalized_value_ugm3}
                                  rawStr={r.raw_value}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Visual Air Quality Charts */}
                  <TelemetryCharts readings={readings} />
                </div>
              )}
            </div>

            {/* 🛠 DATA INTEGRITY & ANOMALY LOG */}
            {hasData && (
              <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100 space-y-2 mt-2">
                <div className="flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-slate-900">
                  <span className="text-emerald-700">🛠</span>
                  <span>DATA INTEGRITY &amp; ANOMALY LOG</span>
                  <span className="text-[10px] text-slate-500 font-mono">Audit Trail</span>
                </div>
                
                <div className="space-y-2 text-xs text-slate-700">
                  {flags.length > 0 ? (
                    flags.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <div>
                          <TraceabilityChip rowId={f.row_id} onClick={onSelectRow} isSelected={highlightedRowId === f.row_id} />
                          <span className="ml-1.5 text-slate-600">{f.explanation}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-emerald-600">•</span>
                      <span>All telemetry rows passed physical sanity checks with zero hardware faults.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
