import React, { useState, useRef } from 'react';
import { Upload, FileText, Zap, RefreshCw, Play, Filter, AlertTriangle, CheckCircle, Database, ArrowRight, ShieldCheck, Inbox } from 'lucide-react';
import { StatusBadge } from './StatusBadge.js';
import { TraceabilityChip } from './TraceabilityChip.js';
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
      
      {/* 1. TOP PRESET STRIP */}
      <div className="p-4 rounded-2xl border border-[#27272A] bg-[#18181B] shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              QUICK DEMO PRESETS (Instant 1-Click Evaluation):
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Click any scenario to immediately populate telemetry and audit report
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onSelectPreset('baseline')}
            disabled={isLoading}
            className={`p-3.5 rounded-xl border text-left font-mono transition ${
              activePreset === 'baseline'
                ? 'bg-zinc-800 border-white ring-1 ring-white'
                : 'bg-[#09090B] border-[#27272A] hover:border-zinc-500'
            }`}
          >
            <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
              <span>⚡ Preset 1: Baseline Day</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded">
                AQI ~85
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-1">
              Normal moderate air quality across all 4 wards. All telemetry calibrated and operational.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectPreset('crisis')}
            disabled={isLoading}
            className={`p-3.5 rounded-xl border text-left font-mono transition ${
              activePreset === 'crisis'
                ? 'bg-zinc-800 border-white ring-1 ring-white'
                : 'bg-[#09090B] border-[#27272A] hover:border-zinc-500'
            }`}
          >
            <div className="text-xs font-bold text-red-400 flex items-center justify-between">
              <span>⚡ Preset 2: Severe Spike + -999</span>
              <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.2 rounded font-bold">
                ▲ AQI 413
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-1">
              Ward 4 PM2.5 spike (0.31 mg/m³ = 310 µg), inversion trap, and Ward 2 optical -999 fault.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectPreset('post_action')}
            disabled={isLoading}
            className={`p-3.5 rounded-xl border text-left font-mono transition ${
              activePreset === 'post_action'
                ? 'bg-zinc-800 border-white ring-1 ring-white'
                : 'bg-[#09090B] border-[#27272A] hover:border-zinc-500'
            }`}
          >
            <div className="text-xs font-bold text-blue-400 flex items-center justify-between">
              <span>⚡ Preset 3: Post-Intervention Shift</span>
              <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded">
                -62% Delta
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-1">
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
          <div className="p-5 rounded-2xl border border-[#27272A] bg-[#18181B] space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-zinc-400" />
                STEP 1: SENSOR INGESTION &amp; INPUT ZONE
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Live Ingest</span>
            </div>

            {/* Multimodal Dropzone */}
            <div>
              <input
                id="telemetryUploadInput"
                name="telemetryUploadInput"
                aria-label="Upload raw CSV, XML, TXT, JSON, PDF Bulletin or LED Photo"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.tsv,.txt,.xml,.json,.pdf,.png,.jpg,.jpeg"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#27272A] hover:border-zinc-400 rounded-xl p-5 text-center cursor-pointer bg-[#09090B] transition group"
                role="button"
                tabIndex={0}
                aria-label="Upload raw CSV, XML, TXT, JSON, PDF Bulletin or LED Photo"
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-zinc-500 group-hover:text-white transition" />
                <div className="text-xs font-mono font-semibold text-zinc-300">
                  {selectedFile ? selectedFile.name : "Drop CSV, XML, TXT, JSON, PDF Bulletin, or LED Photo"}
                </div>
                <p className="text-[11px] text-zinc-500 font-mono mt-1">
                  Click to browse sensor streams or roadside photos (Max 5MB)
                </p>
                {selectedFile && (
                  <span className="inline-block mt-2 text-[10px] font-mono bg-zinc-800 text-white px-2 py-0.5 rounded border border-zinc-600">
                    Staged: {selectedFile.name} ({selectedFile.size})
                  </span>
                )}
              </div>
            </div>

            {/* Paste Messy WhatsApp / Table Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="fieldReportTextarea" className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Or Paste Field Report / Table:
                </label>
                <button
                  type="button"
                  onClick={() => setPastedText(
`Ward 4 | SNS_W04_01 | PM2.5 | 0.31 mg/m3
Ward 2 | SNS_W02_03 | PM10  | -999
Ward 3 | SNS_W03_02 | NO2   | NULL
Ward 1 | SNS_W01_01 | PM2.5 | 82 ug/m3`
                  )}
                  className="text-[10px] font-mono text-zinc-400 hover:text-white underline"
                >
                  [Insert Sample]
                </button>
              </div>
              <textarea
                id="fieldReportTextarea"
                name="fieldReportTextarea"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={5}
                placeholder="Paste messy table or field WhatsApp text e.g.:&#10;Ward 4 | PM2.5 | 0.31 mg/m3&#10;Ward 2 | PM10  | -999&#10;Ward 3 | NO2   | NULL"
                className="w-full p-3 text-xs font-mono bg-[#09090B] border border-[#27272A] rounded-xl text-zinc-200 placeholder-zinc-600 focus:border-zinc-400 focus:outline-none"
              />
            </div>

            {/* Clean & Generate Brief Button */}
            <button
              type="button"
              onClick={handleCleanAndGenerate}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#FAFAFA] text-[#09090B] hover:bg-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-50 font-mono shadow-lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>NORMALIZING SENSOR STREAMS...</span>
                </>
              ) : (
                <>
                  <span>[ Clean &amp; Generate Brief -&gt; ]</span>
                </>
              )}
            </button>

            {hasData && (
              <div className="pt-2 border-t border-[#27272A] flex justify-end">
                <button
                  onClick={onNavigateToCommand}
                  className="text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition font-semibold"
                >
                  <span>Proceed to Step 2: Command &amp; Diff</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: DETERMINISTIC AUDIT & CLEANED REPORT       */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl border border-[#27272A] bg-[#18181B] space-y-4 min-h-[480px] flex flex-col justify-between">
            
            {/* Table Header & Filter Tabs */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272A] pb-3">
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    DETERMINISTIC AUDIT &amp; CLEANED TELEMETRY TABLE
                  </span>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    Physical validation with zero hallucinated concentrations
                  </p>
                </div>

                {hasData && (
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                        filter === 'all'
                          ? 'bg-zinc-100 text-zinc-950'
                          : 'bg-[#09090B] text-zinc-400 hover:text-white border border-[#27272A]'
                      }`}
                    >
                      [Filter: All ({readings.length})]
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilter('valid')}
                      className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                        filter === 'valid'
                          ? 'bg-zinc-100 text-zinc-950'
                          : 'bg-[#09090B] text-zinc-400 hover:text-white border border-[#27272A]'
                      }`}
                    >
                      [Valid ({validReadings.length})]
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilter('flagged')}
                      className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                        filter === 'flagged'
                          ? 'bg-red-500 text-white'
                          : 'bg-[#09090B] text-zinc-400 hover:text-white border border-[#27272A]'
                      }`}
                    >
                      [✖ Flagged ({flaggedReadings.length})]
                    </button>
                  </div>
                )}
              </div>

              {/* Ingest Table OR Clean Awaiting Input State */}
              <div className="mt-4">
                {!hasData ? (
                  <div className="p-8 rounded-xl border border-dashed border-zinc-700 bg-[#09090B]/60 text-center space-y-3 my-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 mx-auto flex items-center justify-center text-zinc-400">
                      <Inbox className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                        Awaiting Telemetry Ingestion
                      </h3>
                      <p className="text-xs text-zinc-400 font-sans max-w-md mx-auto mt-1 leading-relaxed">
                        No sensor streams loaded yet. Click any <strong>1-Click Demo Preset</strong> above, or upload/paste a telemetry file on the left to run deterministic audit and generate report.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap justify-center gap-2 font-mono text-[11px]">
                      <button
                        type="button"
                        onClick={() => onSelectPreset('baseline')}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/30 transition"
                      >
                        ⚡ Load Baseline Day
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPreset('crisis')}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-red-300 border border-red-500/30 transition"
                      >
                        ⚡ Load Severe Crisis Preset
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#27272A] max-h-80 bg-[#09090B]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#18181B] text-zinc-400 sticky top-0 uppercase tracking-wider text-[10px] font-mono border-b border-[#27272A]">
                        <tr>
                          <th className="p-2.5">ID</th>
                          <th className="p-2.5">Ward</th>
                          <th className="p-2.5">Pollutant</th>
                          <th className="p-2.5">Raw</th>
                          <th className="p-2.5">Norm (µg/m³)</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272A] font-mono text-[11px]">
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
                                  ? 'bg-zinc-800 ring-1 ring-white'
                                  : isFault
                                  ? 'bg-striped-fault text-zinc-300'
                                  : isGap
                                  ? 'bg-amber-950/20 text-amber-200'
                                  : 'hover:bg-zinc-800/40 text-zinc-300'
                              }`}
                            >
                              <td className="p-2.5 font-bold text-white">
                                <span className="underline decoration-dotted">{r.row_id}</span>
                              </td>
                              <td className="p-2.5 font-sans font-medium text-zinc-200">
                                {r.ward_name}
                              </td>
                              <td className="p-2.5 font-bold text-white">
                                {r.pollutant}
                              </td>
                              <td className="p-2.5 text-zinc-400">
                                {r.raw_value} {r.raw_unit}
                              </td>
                              <td className="p-2.5 font-bold">
                                {isFault ? (
                                  <span className="text-zinc-500 font-mono">EXCLUDED</span>
                                ) : isGap ? (
                                  <span className="text-amber-400 font-mono">GAP</span>
                                ) : (
                                  <span className="text-emerald-400 flex items-center gap-1.5">
                                    <span>{r.normalized_value_ugm3}</span>
                                    {isConverted && (
                                      <span className="text-[10px] bg-zinc-800 text-cyan-300 px-1 py-0.2 rounded border border-cyan-800" title="1000x scaled from mg/m³ to µg/m³">
                                        🔄 1000x
                                      </span>
                                    )}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5">
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
                )}
              </div>
            </div>

            {/* 🛠 DATA INTEGRITY & ANOMALY LOG */}
            {hasData && (
              <div className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] space-y-2 mt-4">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-white">
                  <span>🛠 DATA INTEGRITY &amp; ANOMALY LOG</span>
                  <span className="text-[10px] text-zinc-500">Audit Trail</span>
                </div>
                
                <div className="space-y-1.5 font-mono text-xs text-zinc-300">
                  {flags.length > 0 ? (
                    flags.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-zinc-500">•</span>
                        <div>
                          <TraceabilityChip rowId={f.row_id} onClick={onSelectRow} isSelected={highlightedRowId === f.row_id} />
                          <span className="ml-1.5 text-zinc-400">{f.explanation}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span>•</span>
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
