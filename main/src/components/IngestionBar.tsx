import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, CheckCircle2, Play, RefreshCw, AlertCircle } from 'lucide-react';

interface IngestionBarProps {
  onAnalyze: (payload: { text?: string; inlineData?: { data: string; mimeType: string }; presetId?: string }) => void;
  isLoading: boolean;
  activePreset: string | null;
}

export const IngestionBar: React.FC<IngestionBarProps> = ({ onAnalyze, isLoading, activePreset }) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'paste'>('presets');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; mimeType: string; base64?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        mimeType: file.type || 'text/plain',
        base64
      });
    };

    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
      reader.onload = () => {
        setPastedText(reader.result as string);
        setSelectedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          mimeType: file.type || 'text/csv'
        });
      };
    }
  };

  const handleTriggerAnalysis = () => {
    if (activeTab === 'presets' && activePreset) {
      onAnalyze({ presetId: activePreset });
    } else if (activeTab === 'upload' && selectedFile?.base64) {
      onAnalyze({ inlineData: { data: selectedFile.base64, mimeType: selectedFile.mimeType } });
    } else if (pastedText.trim()) {
      onAnalyze({ text: pastedText });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'presets'}
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            1-Click Demo Presets
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'upload'}
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            File Upload (CSV/PDF/Image)
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'paste'}
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste WhatsApp Table
          </button>
        </div>

        <button
          onClick={handleTriggerAnalysis}
          disabled={isLoading}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-semibold text-xs text-white shadow-lg transition flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Sensor Streams...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Generate Civic Briefing</span>
            </>
          )}
        </button>
      </div>

      {/* TAB 1: 1-Click Demo Presets */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Select any real-world civic scenario to test full multimodal ingestion, anomaly catching, and delta tracking:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Preset 1 */}
            <button
              type="button"
              onClick={() => onAnalyze({ presetId: 'baseline' })}
              className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden group ${
                activePreset === 'baseline'
                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md ring-1 ring-emerald-500'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Day 1: Baseline Day
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded">
                  AQI ~ 85
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Normal moderate conditions across all 4 wards. All telemetry sensors calibrated and verified.
              </p>
            </button>

            {/* Preset 2 */}
            <button
              type="button"
              onClick={() => onAnalyze({ presetId: 'crisis' })}
              className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden group ${
                activePreset === 'crisis'
                  ? 'bg-red-950/40 border-red-500/80 shadow-md ring-1 ring-red-500'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Day 2: Crisis & Anomalies
                </span>
                <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-mono font-bold">
                  AQI 413 (SEVERE)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Ward 4 spike (0.38 mg/m³), construction dust (ratio 0.21), inversion trap, and -999 hardware error.
              </p>
            </button>

            {/* Preset 3 */}
            <button
              type="button"
              onClick={() => onAnalyze({ presetId: 'post_action' })}
              className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden group ${
                activePreset === 'post_action'
                  ? 'bg-blue-950/40 border-blue-500/80 shadow-md ring-1 ring-blue-500'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Day 3: Post-Intervention
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                  -62% PM2.5 Delta
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Water mist cannons deployed, construction halted, and sensor repaired. Demonstrates improvement diff.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: File Upload (CSV, PDF, Image, XML) */}
      {activeTab === 'upload' && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.tsv,.txt,.xml,.json,.pdf,.png,.jpg,.jpeg"
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-emerald-500/60 rounded-xl p-6 text-center cursor-pointer bg-slate-950/60 transition group"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-slate-500 group-hover:text-emerald-400 transition" />
            <div className="text-xs font-semibold text-slate-300">
              {selectedFile ? selectedFile.name : "Click or Drag & Drop Civic Sensor File"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports CSV, TSV, XML, JSON, or Photos/PDFs of LED Billboards & Sensor LCDs (Max 5MB)
            </p>
            {selectedFile && (
              <span className="inline-block mt-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                Ready for Analysis ({selectedFile.size})
              </span>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Paste Raw Table */}
      {activeTab === 'paste' && (
        <div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={4}
            placeholder="Paste messy table or field WhatsApp text e.g.:&#10;Ward-4, SNS_01, 08:00, PM2.5, 0.38 mg/m3&#10;Ward-2, SNS_03, 08:15, PM10, -999 ug/m3"
            className="w-full p-3 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:border-emerald-500"
          />
        </div>
      )}
    </div>
  );
};
