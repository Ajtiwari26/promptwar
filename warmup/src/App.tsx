import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { LoginGate } from './components/LoginGate.js';
import { IngestionBar } from './components/IngestionBar.js';
import { DiffBanner } from './components/DiffBanner.js';
import { PersonaSwitcher } from './components/PersonaSwitcher.js';
import { DataAuditDrawer } from './components/DataAuditDrawer.js';
import { PublisherStudio } from './components/PublisherStudio.js';
import { AuthenticatedUser } from '../server/middleware/authGuard.js';
import { InstantTriageBanner } from './types/decisionEngine.js';
import { CivicBriefingOutput } from './types/briefingSchema.js';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('civic_auth_token'));
  const [user, setUser] = useState<AuthenticatedUser | null>(() => {
    const saved = localStorage.getItem('civic_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('crisis');
  const [activeRole, setActiveRole] = useState<'ward_officer' | 'housing_society' | 'school_principal'>('ward_officer');
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  const [triage, setTriage] = useState<InstantTriageBanner | null>(null);
  const [fullBrief, setFullBrief] = useState<CivicBriefingOutput | null>(null);
  const [previousBrief, setPreviousBrief] = useState<CivicBriefingOutput | null>(null);

  // Auto-verify token on mount
  useEffect(() => {
    if (token) {
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then(data => setUser(data.user))
        .catch(() => handleLogout());
    }
  }, [token]);

  // Load default preset on initial login
  useEffect(() => {
    if (token && !fullBrief) {
      handleAnalyze({ presetId: 'crisis' });
    }
  }, [token]);

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

  const handleAnalyze = async (payload: { text?: string; inlineData?: { data: string; mimeType: string }; presetId?: string }) => {
    if (!token) return;
    setIsLoading(true);
    try {
      if (payload.presetId) {
        setActivePreset(payload.presetId);
      }

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

      if (!res.ok) {
        throw new Error('Failed to analyze data');
      }

      const data = await res.json();
      setTriage(data.fastTriage);
      if (fullBrief) {
        setPreviousBrief(fullBrief);
      }
      setFullBrief(data.fullBrief);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return <LoginGate onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header triage={triage} user={user} onLogout={handleLogout} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <IngestionBar
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          activePreset={activePreset}
        />

        {fullBrief && (
          <>
            <DiffBanner
              comparison={fullBrief.comparison_with_previous}
              previousBriefId={fullBrief.brief_metadata.compared_with_brief_id}
            />

            <PersonaSwitcher
              roleActions={fullBrief.role_specific_actions}
              activeRole={activeRole}
              onRoleChange={setActiveRole}
              onSelectCitation={(rowId) => setHighlightedRowId(rowId)}
            />

            <DataAuditDrawer
              readings={fullBrief.cleaned_readings}
              flags={fullBrief.data_quality_flags}
              highlightedRowId={highlightedRowId}
              onClearHighlight={() => setHighlightedRowId(null)}
            />

            <PublisherStudio
              dualOutputs={fullBrief.dual_outputs}
              briefId={fullBrief.brief_metadata.brief_id}
            />
          </>
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        Civic Air Quality Briefing Studio • Google for Developers PromptWars • Grounded GenAI & Fast Decision Engine
      </footer>
    </div>
  );
};

export default App;
