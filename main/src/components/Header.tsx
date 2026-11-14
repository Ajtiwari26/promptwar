import React from 'react';
import { Triangle, AlertTriangle, CheckCircle2, Landmark, Building2, School, Bike, LogOut, ChevronRight, Activity } from 'lucide-react';
import { InstantTriageBanner } from '../types/decisionEngine.js';
import { AuthenticatedUser } from '../../server/middleware/authGuard.js';

export type StudioTab = 'ingest' | 'command' | 'publish';
export type ActiveRole = 'ward_officer' | 'housing_society' | 'school_principal' | 'gig_worker';

interface HeaderProps {
  currentTab?: StudioTab;
  onTabChange?: (tab: StudioTab) => void;
  activeRole?: ActiveRole;
  onRoleChange?: (role: ActiveRole) => void;
  triage: InstantTriageBanner | null;
  user: AuthenticatedUser | null;
  onLogout: () => void;
  onCitationClick?: (rowId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab = 'ingest',
  onTabChange = () => {},
  activeRole = 'ward_officer',
  onRoleChange = () => {},
  triage,
  user,
  onLogout,
  onCitationClick
}) => {
  const isEmergency = triage?.alert_level === 'EMERGENCY_CRITICAL';
  const isWarning = triage?.alert_level === 'WARNING';

  return (
    <header className="sticky top-0 z-50 bg-[#18181B] border-b border-[#27272A] shadow-lg">
      
      {/* 1. Main Top Bar with Brand & 3-Step Workflow Breadcrumb */}
      <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#27272A]/80">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-xs font-bold text-white">
            ■
          </div>
          <span className="font-bold tracking-tight text-xs sm:text-sm text-[#FAFAFA] uppercase font-mono">
            CIVIC BRIEFING STUDIO
          </span>
          <span className="hidden sm:inline text-zinc-600 font-mono">|</span>
        </div>

        {/* 3-Step Workflow Breadcrumb */}
        <nav aria-label="Workflow Steps" className="flex items-center gap-1 sm:gap-2 font-mono text-xs">
          <button
            onClick={() => onTabChange('ingest')}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
              currentTab === 'ingest'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent'
            }`}
            aria-current={currentTab === 'ingest' ? 'step' : undefined}
          >
            <span>1. Ingest & Audit</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

          <button
            onClick={() => onTabChange('command')}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
              currentTab === 'command'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent'
            }`}
            aria-current={currentTab === 'command' ? 'step' : undefined}
          >
            <span>2. Command & Diff</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

          <button
            onClick={() => onTabChange('publish')}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
              currentTab === 'publish'
                ? 'bg-zinc-100 text-zinc-950 font-bold border border-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent'
            }`}
            aria-current={currentTab === 'publish' ? 'step' : undefined}
          >
            <span>3. Publish Advisories</span>
          </button>
        </nav>
      </div>

      {/* 2. Sub-Header: 0ms Persona Switcher Bar + Logout */}
      <div className="px-4 sm:px-6 py-2 bg-[#09090B] flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#27272A]/70">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            ACTIVE ROLE:
          </span>
          <div className="flex items-center gap-1.5" role="group" aria-label="Role Switcher">
            <button
              type="button"
              onClick={() => onRoleChange('ward_officer')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1.5 border ${
                activeRole === 'ward_officer'
                  ? 'bg-zinc-800 border-zinc-400 text-white font-bold ring-1 ring-zinc-400'
                  : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-zinc-300" />
              <span>🏛️ Ward Officer {activeRole === 'ward_officer' ? '(Active)' : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => onRoleChange('housing_society')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1.5 border ${
                activeRole === 'housing_society'
                  ? 'bg-zinc-800 border-zinc-400 text-white font-bold ring-1 ring-zinc-400'
                  : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-zinc-300" />
              <span>🏢 Housing RWA {activeRole === 'housing_society' ? '(Active)' : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => onRoleChange('school_principal')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1.5 border ${
                activeRole === 'school_principal'
                  ? 'bg-zinc-800 border-zinc-400 text-white font-bold ring-1 ring-zinc-400'
                  : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
              }`}
            >
              <School className="w-3.5 h-3.5 text-zinc-300" />
              <span>🏫 School {activeRole === 'school_principal' ? '(Active)' : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => onRoleChange('gig_worker')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1.5 border ${
                activeRole === 'gig_worker'
                  ? 'bg-zinc-800 border-zinc-400 text-white font-bold ring-1 ring-zinc-400'
                  : 'bg-[#18181B] border-[#27272A] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
              }`}
            >
              <Bike className="w-3.5 h-3.5 text-zinc-300" />
              <span>🚴 Gig Fleet {activeRole === 'gig_worker' ? '(Active)' : ''}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden md:inline font-mono text-[11px] text-zinc-500">
              Session: {user.email}
            </span>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2 py-1 rounded border border-[#27272A] bg-[#18181B] text-zinc-400 hover:text-red-400 hover:border-red-900 text-[11px] font-mono transition"
            title="Log Out of Studio"
          >
            <LogOut className="w-3 h-3" />
            <span>[Logout]</span>
          </button>
        </div>
      </div>

      {/* 3. Sub-Second Fast Triage Emergency Banner with role="alert" & aria-live="assertive" */}
      <div
        role="alert"
        aria-live="assertive"
        className={`px-4 sm:px-6 py-2 border-b transition-colors font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 ${
          !triage
            ? 'bg-[#09090B] border-[#27272A] text-zinc-400'
            : isEmergency
            ? 'bg-red-950 border-red-600 text-red-100'
            : isWarning
            ? 'bg-amber-950 border-amber-600 text-amber-100'
            : 'bg-zinc-900 border-zinc-700 text-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {!triage ? (
            <>
              <span className="text-zinc-500">●</span>
              <span className="font-bold text-zinc-300">SYSTEM STANDBY:</span>
              <span className="text-zinc-400">Awaiting telemetry input — Select a demo preset or upload sensor streams below</span>
            </>
          ) : isEmergency ? (
            <>
              <Triangle className="w-4 h-4 text-red-400 fill-red-400 shrink-0" />
              <span className="font-bold tracking-tight">▲ CRITICAL FAST TRIAGE:</span>
              <span className="font-medium text-xs">{triage.primary_headline}</span>
            </>
          ) : isWarning ? (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              <span className="font-bold tracking-tight">◆ WARNING FAST TRIAGE:</span>
              <span className="font-medium text-xs">{triage.primary_headline}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold tracking-tight">● NORMAL MONITORING:</span>
              <span className="font-medium text-xs">{triage.primary_headline}</span>
            </>
          )}
        </div>

        {triage ? (
          <div className="flex items-center gap-2 text-[11px] shrink-0">
            {triage.emergency_trigger_code && (
              <span className="px-1.5 py-0.5 rounded bg-black/50 border border-white/20 font-bold">
                {triage.emergency_trigger_code}
              </span>
            )}
            {triage.peak_pm25_ugm3 && (
              <span className="bg-black/30 px-2 py-0.5 rounded border border-white/10">
                Peak PM2.5: <strong className="text-white">{triage.peak_pm25_ugm3} µg/m³</strong>
              </span>
            )}
            {triage.unreliable_sensors_count > 0 && (
              <span className="bg-red-900/60 text-red-200 border border-red-400/40 px-1.5 py-0.5 rounded">
                ✖ {triage.unreliable_sensors_count} Fault
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-zinc-500 font-mono">
            Deterministic Decision Engine Online (<span className="text-emerald-400">&lt;5ms</span>)
          </span>
        )}
      </div>

    </header>
  );
};
