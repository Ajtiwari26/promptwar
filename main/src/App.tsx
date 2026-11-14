import React, { useState, useEffect } from 'react';
import { Header, StudioTab } from './components/Header.js';
import { LoginGate } from './components/LoginGate.js';
import { IngestAuditView } from './components/IngestAuditView.js';
import { CommandDiffView } from './components/CommandDiffView.js';
import { PublisherView } from './components/PublisherView.js';
import { AuthenticatedUser } from '../server/middleware/authGuard.js';
import { InstantTriageBanner } from './types/decisionEngine.js';
import { CivicBriefingOutput, CleanedReadingItemSchema, DataQualityFlagItemSchema } from './types/briefingSchema.js';
import { PRESET_BASELINE_DAY, PRESET_CRISIS_DAY, PRESET_POST_INTERVENTION_DAY } from './data/presets.js';
import { normalizeAndClassifyHotspots } from './services/fastDecisionEngine.js';
import { generateDeterministicGroundedBrief } from './services/deterministicBrief.js';
import { parseUniversalTelemetry } from './services/universalDataParser.js';
import { downloadStructuredAuditJson, downloadCleanedTelemetryCsv, StructuredAuditPayload } from './services/structuredExport.js';
import { z } from 'zod';

type CleanedReading = z.infer<typeof CleanedReadingItemSchema>;
type DataQualityFlag = z.infer<typeof DataQualityFlagItemSchema>;

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('civic_auth_token'));
  const [user, setUser] = useState<AuthenticatedUser | null>(() => {
    const saved = localStorage.getItem('civic_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentTab, setCurrentTab] = useState<StudioTab>('ingest');
  const [activeRole, setActiveRole] = useState<'ward_officer' | 'housing_society' | 'school_principal' | 'gig_worker'>('ward_officer');
  // Starts as null so no fields or tables are pre-populated before user action
  const [activePreset, setActivePreset] = useState<'baseline' | 'crisis' | 'post_action' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);

  // Output States: Start completely empty / null
  const [triage, setTriage] = useState<InstantTriageBanner | null>(null);
  const [readings, setReadings] = useState<CleanedReading[]>([]);
  const [flags, setFlags] = useState<DataQualityFlag[]>([]);
  const [fullBrief, setFullBrief] = useState<CivicBriefingOutput | null>(null);
  const [previousBrief, setPreviousBrief] = useState<CivicBriefingOutput | null>(null);

  // Verify stored token if present
  useEffect(() => {
    if (token && token !== 'offline-demo-token') {
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Session invalid');
          return res.json();
        })
        .then(data => {
          if (data.user) {
            setUser(data.user);
            setActiveRole(data.user.role);
          }
        })
        .catch(() => {
          // Keep offline demo mode active if backend unavailable
        });
    }
  }, [token]);

  /**
   * Deterministic Fast Triage + Clean Audit Execution
   */
  const loadPresetData = (presetId: 'baseline' | 'crisis' | 'post_action') => {
    setIsLoading(true);
    setActivePreset(presetId);

    const sourceRows = presetId === 'baseline'
      ? PRESET_BASELINE_DAY
      : presetId === 'crisis'
      ? PRESET_CRISIS_DAY
      : PRESET_POST_INTERVENTION_DAY;

    // Run sub-second deterministic triage & normalization locally
    const decision = normalizeAndClassifyHotspots(sourceRows, fullBrief ? JSON.stringify(fullBrief) : undefined);

    setTriage(decision.instant_triage_banner);
    setReadings(decision.normalized_readings as any);
    setFlags(decision.data_quality_flags as any);

    // Synchronously generate grounded briefing so Stage 2 and Stage 3 immediately reflect CSV data
    const localBrief = generateDeterministicGroundedBrief(decision, fullBrief);
    setPreviousBrief(fullBrief);
    setFullBrief(localBrief);

    // Also trigger server analysis in background if token available
    triggerServerAnalysis({ presetId });
  };

  /**
   * Server-Side Gemini Decision Proxy Call
   */
  const triggerServerAnalysis = async (payload: { text?: string; inlineData?: any; presetId?: string }) => {
    try {
      const res = await fetch('/api/briefing/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'demo-token'}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.fastTriage) setTriage(data.fastTriage);
        if (data.decisionContext?.normalized_readings) {
          setReadings(data.decisionContext.normalized_readings);
        }
        if (data.decisionContext?.data_quality_flags) {
          setFlags(data.decisionContext.data_quality_flags);
        }
        if (data.briefing) {
          setPreviousBrief(fullBrief);
          setFullBrief(data.briefing);
        }
      }
    } catch (err) {
      console.warn('Backend server unavailable, continuing with deterministic local engine:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (newToken: string, newUser: AuthenticatedUser) => {
    setToken(newToken);
    setUser(newUser);
    setActiveRole(newUser.role);
    // DO NOT auto-load presets here! Keep state clean so user sees proper step 1 input area
  };

  const handleLogout = () => {
    localStorage.removeItem('civic_auth_token');
    localStorage.removeItem('civic_user');
    setToken(null);
    setUser(null);
    setTriage(null);
    setReadings([]);
    setFlags([]);
    setActivePreset(null);
    setFullBrief(null);
  };

  const handleAnalyzeCustom = (payload: { text?: string; inlineData?: { data: string; mimeType: string }; presetId?: string }) => {
    if (payload.presetId) {
      loadPresetData(payload.presetId as any);
    } else {
      setIsLoading(true);
      if (payload.text) {
        // Instant local parsing of CSV/text telemetry
        const parsedRows = parseUniversalTelemetry(payload.text);
        if (parsedRows.length > 0) {
          const decision = normalizeAndClassifyHotspots(parsedRows, fullBrief ? JSON.stringify(fullBrief) : undefined);
          setTriage(decision.instant_triage_banner);
          setReadings(decision.normalized_readings as any);
          setFlags(decision.data_quality_flags as any);

          const localBrief = generateDeterministicGroundedBrief(decision, fullBrief);
          setPreviousBrief(fullBrief);
          setFullBrief(localBrief);
        }
      }
      triggerServerAnalysis(payload);
    }
  };

  /**
   * 1-Click Download Handler for Complete Structured Intelligence Package
   */
  const handleDownloadStructuredPackage = () => {
    const payload: StructuredAuditPayload = {
      metadata: {
        system: "Civic Air Quality Briefing Studio",
        version: "1.0.0",
        export_timestamp_iso: new Date().toISOString(),
        brief_reference_id: fullBrief?.brief_metadata?.brief_id || `BRIEF-${Date.now().toString().slice(-4)}`,
        jurisdiction: "Municipal Command & Disaster Cell - Ward 04 Delhi NCR"
      },
      fast_triage: triage || {
        alert_level: "NORMAL",
        primary_headline: "All monitored wards within safe environmental limits.",
        emergency_trigger_code: null,
        urgent_action_required: false,
        worst_affected_ward: null,
        peak_pm25_ugm3: null,
        detected_hotspots_count: 0,
        unreliable_sensors_count: 0
      },
      hotspot_classifications: (fullBrief as any)?.classified_hotspots || [],
      data_quality_flags: flags as any,
      cleaned_telemetry_table: readings as any,
      role_specific_actions: fullBrief?.role_specific_actions,
      citizen_advisories: fullBrief?.dual_outputs?.citizen_advisories,
      internal_briefing_note: fullBrief?.dual_outputs?.internal_briefing_note
    };
    downloadStructuredAuditJson(payload);
  };

  const handleDownloadTelemetryCsv = () => {
    downloadCleanedTelemetryCsv(readings as any, activePreset || "export");
  };

  // If user is not logged in, render Page 1 Secure Portal Login Gate
  if (!token) {
    return <LoginGate onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F2F9F5] text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Persistent Authenticated Studio Shell (Top Bar + Fast Triage Banner + 1-Click Export) */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        triage={triage}
        user={user}
        onLogout={handleLogout}
        onCitationClick={(rowId) => setSelectedCitation(rowId)}
        onDownloadStructured={handleDownloadStructuredPackage}
        onDownloadCsv={handleDownloadTelemetryCsv}
        hasData={readings.length > 0}
      />

      {/* 3-Stage Connected Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* PAGE 2: DATA INGESTION & TELEMETRY AUDIT VIEW (/ingest) */}
        {currentTab === 'ingest' && (
          <IngestAuditView
            readings={readings}
            flags={flags}
            activePreset={activePreset}
            onSelectPreset={loadPresetData}
            onAnalyze={handleAnalyzeCustom}
            isLoading={isLoading}
            highlightedRowId={selectedCitation}
            onSelectRow={(rowId) => setSelectedCitation(rowId)}
            onNavigateToCommand={() => setCurrentTab('command')}
          />
        )}

        {/* PAGE 3: TACTICAL COMMAND, HOTSPOTS & HISTORICAL DELTA VIEW (/command) */}
        {currentTab === 'command' && (
          <CommandDiffView
            briefing={fullBrief}
            activeRole={activeRole}
            readings={readings}
            selectedCitation={selectedCitation}
            onSelectCitation={(rowId) => setSelectedCitation(rowId)}
            onNavigateToPublish={() => setCurrentTab('publish')}
          />
        )}

        {/* PAGE 4: DUAL-OUTPUT PUBLISHER & CITIZEN BROADCAST STUDIO (/publish) */}
        {currentTab === 'publish' && (
          <PublisherView
            briefing={fullBrief}
            readings={readings}
            onSelectCitation={(rowId) => {
              setSelectedCitation(rowId);
              setCurrentTab('command');
            }}
          />
        )}

      </main>

      {/* Persistent Light Institutional Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 font-sans">
        Civic Air Quality Briefing Studio • Google for Developers PromptWars • Build with AI
      </footer>

    </div>
  );
};

export default App;
