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
  const [activeRole, setActiveRole] = useState<'ward_officer' | 'housing_society' | 'school_principal'>('ward_officer');
  const [activePreset, setActivePreset] = useState<'baseline' | 'crisis' | 'post_action' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);

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
   * Deterministic 0ms Local Evaluation Engine
   * Populates triage, audit table, and fallback briefing instantaneously
   */
  const loadPresetData = (presetId: 'baseline' | 'crisis' | 'post_action') => {
    setActivePreset(presetId);
    const rawRows = presetId === 'baseline'
      ? PRESET_BASELINE_DAY
      : presetId === 'crisis'
      ? PRESET_CRISIS_DAY
      : PRESET_POST_INTERVENTION_DAY;

    // Fast deterministic evaluation in < 2ms
    const engineOutput = normalizeAndClassifyHotspots(rawRows);
    setTriage(engineOutput.instant_triage_banner);

    const mappedReadings: CleanedReading[] = engineOutput.normalized_readings.map(r => ({
      row_id: r.row_id,
      sensor_id: r.sensor_id,
      ward_name: r.ward_name,
      timestamp_iso: r.timestamp_iso,
      pollutant: r.pollutant,
      raw_value: r.raw_value,
      raw_unit: r.raw_unit,
      normalized_value_ugm3: r.normalized_value_ugm3,
      aqi_severity: r.aqi_severity,
      validation_status: r.validation_status
    }));
    setReadings(mappedReadings);
    setFlags(engineOutput.data_quality_flags);

    // Call server API asynchronously if token exists
    if (token && token !== 'offline-demo-token') {
      triggerServerAnalysis({ presetId });
    }
  };

  const triggerServerAnalysis = async (payload: { text?: string; inlineData?: { data: string; mimeType: string }; presetId?: string }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/briefing/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...payload,
          previousBrief
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.fastTriage) setTriage(data.fastTriage);
        if (data.fullBrief) {
          if (fullBrief) setPreviousBrief(fullBrief);
          setFullBrief(data.fullBrief);
          if (data.fullBrief.cleaned_readings) setReadings(data.fullBrief.cleaned_readings);
          if (data.fullBrief.data_quality_flags) setFlags(data.fullBrief.data_quality_flags);
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
  };

  const handleLogout = () => {
    localStorage.removeItem('civic_auth_token');
    localStorage.removeItem('civic_user');
    setToken(null);
    setUser(null);
  };

  const handleAnalyzeCustom = (payload: { text?: string; inlineData?: { data: string; mimeType: string }; presetId?: string }) => {
    if (payload.presetId) {
      loadPresetData(payload.presetId as any);
    } else {
      triggerServerAnalysis(payload);
    }
  };

  // If user is not logged in, render Page 1 Secure Portal Login Gate
  if (!token) {
    return <LoginGate onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans selection:bg-zinc-700">
      
      {/* Persistent Authenticated Studio Shell (Top Bar + Fast Triage Banner) */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        triage={triage}
        user={user}
        onLogout={handleLogout}
        onCitationClick={(rowId) => setSelectedCitation(rowId)}
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

      {/* Persistent Footer */}
      <footer className="border-t border-[#27272A] bg-[#09090B] py-3.5 px-6 text-center text-xs font-mono text-zinc-500">
        Civic Air Quality Briefing Studio • Google for Developers PromptWars • Build with AI
      </footer>

    </div>
  );
};

export default App;
