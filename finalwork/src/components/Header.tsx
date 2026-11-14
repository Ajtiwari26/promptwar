import React from 'react';
import { Triangle, AlertTriangle, CheckCircle2, Landmark, Building2, School, Bike, LogOut, ChevronRight, Download, FileSpreadsheet, Leaf } from 'lucide-react';
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
  onDownloadStructured?: () => void;
  onDownloadCsv?: () => void;
  hasData?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab = 'ingest',
  onTabChange = () => {},
  activeRole = 'ward_officer',
  onRoleChange = () => {},
  triage,
  user,
  onLogout,
  onCitationClick,
  onDownloadStructured,
  onDownloadCsv,
  hasData = false
}) => {
  const isEmergency = triage?.alert_level === 'EMERGENCY_CRITICAL';
  const isWarning = triage?.alert_level === 'WARNING';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-emerald-100 shadow-xs">
      
      {/* 1. Main Top Bar with Brand, 3-Step Breadcrumb, and 1-Click Structured Data Download */}
      <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xs">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold tracking-tight text-sm text-slate-900 uppercase">
                CIVIC BRIEFING STUDIO
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                VerdantAir AI
              </span>
            </div>
            <p className="text-[11px] text-emerald-900/60 hidden sm:block">
              Municipal Telemetry Triage • PromptWars Build with AI
            </p>
          </div>
        </div>

        {/* 3-Step Workflow Breadcrumb */}
        <nav aria-label="Workflow Steps" className="flex items-center gap-1 sm:gap-2 text-xs">
          <button
            onClick={() => onTabChange('ingest')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium cursor-pointer ${
              currentTab === 'ingest'
                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
            aria-current={currentTab === 'ingest' ? 'step' : undefined}
          >
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
            <span>Ingest &amp; Audit</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          <button
            onClick={() => onTabChange('command')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium cursor-pointer ${
              currentTab === 'command'
                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
            aria-current={currentTab === 'command' ? 'step' : undefined}
          >
            <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[10px] flex items-center justify-center font-bold">2</span>
            <span>Command &amp; Diff</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          <button
            onClick={() => onTabChange('publish')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium cursor-pointer ${
              currentTab === 'publish'
                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
            aria-current={currentTab === 'publish' ? 'step' : undefined}
          >
            <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[10px] flex items-center justify-center font-bold">3</span>
            <span>Publish Advisories</span>
          </button>
        </nav>

        {/* 1-Click Structured Data Download Actions */}
        <div className="flex items-center gap-2">
          {onDownloadStructured && (
            <button
              onClick={onDownloadStructured}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#05261A] hover:bg-emerald-950 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download full structured audit package (JSON) with hotspots, quality flags, and advisories"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Audit JSON</span>
            </button>
          )}

          {onDownloadCsv && hasData && (
            <button
              onClick={onDownloadCsv}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
              title="Download normalized telemetry table as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-Header: Persona Switcher Bar + Session */}
      <div className="px-4 sm:px-6 py-2 bg-emerald-50/40 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-emerald-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider font-heading">
            OPERATIONAL PERSONA:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Role Switcher">
            <button
              type="button"
              onClick={() => onRoleChange('ward_officer')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                activeRole === 'ward_officer'
                  ? 'bg-emerald-600 border-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-white border-emerald-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>🏛️ Ward Officer</span>
            </button>

            <button
              type="button"
              onClick={() => onRoleChange('housing_society')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                activeRole === 'housing_society'
                  ? 'bg-emerald-600 border-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-white border-emerald-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>🏢 Housing RWA</span>
            </button>

            <button
              type="button"
              onClick={() => onRoleChange('school_principal')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                activeRole === 'school_principal'
                  ? 'bg-emerald-600 border-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-white border-emerald-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>🏫 School</span>
            </button>

            <button
              type="button"
              onClick={() => onRoleChange('gig_worker')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                activeRole === 'gig_worker'
                  ? 'bg-emerald-600 border-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-white border-emerald-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/60'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>🚴 Gig Fleet</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden md:inline text-xs text-slate-500 font-mono">
              Node: <strong className="text-slate-800">{user.email}</strong>
            </span>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-300 text-xs font-medium transition cursor-pointer"
            title="Log Out of Studio"
          >
            <LogOut className="w-3 h-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* 3. Fast Triage Emergency Banner with WCAG Compliant Light Mode Styling */}
      <div
        role="alert"
        aria-live="assertive"
        className={`px-4 sm:px-6 py-2.5 border-b transition-colors text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 ${
          !triage
            ? 'bg-emerald-50/30 border-emerald-100 text-slate-600'
            : isEmergency
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : isWarning
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {!triage ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-heading font-bold text-slate-800">SYSTEM STANDBY:</span>
              <span className="text-slate-600">Awaiting telemetry input — Select a demo preset or upload sensor streams below</span>
            </>
          ) : isEmergency ? (
            <>
              <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                <Triangle className="w-3 h-3 fill-white" />
              </div>
              <span className="font-heading font-bold text-rose-900 uppercase tracking-tight">CRITICAL ALERT:</span>
              <span className="font-medium text-xs text-rose-800">{triage.primary_headline}</span>
            </>
          ) : isWarning ? (
            <>
              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3 h-3 fill-white" />
              </div>
              <span className="font-heading font-bold text-amber-900 uppercase tracking-tight">ADVISORY WARNING:</span>
              <span className="font-medium text-xs text-amber-800">{triage.primary_headline}</span>
            </>
          ) : (
            <>
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span className="font-heading font-bold text-emerald-900 uppercase tracking-tight">NORMAL MONITORING:</span>
              <span className="font-medium text-xs text-emerald-800">{triage.primary_headline}</span>
            </>
          )}
        </div>

        {triage ? (
          <div className="flex items-center gap-2 text-xs shrink-0 flex-wrap">
            {triage.emergency_trigger_code && (
              <span className="px-2 py-0.5 rounded-md bg-white border border-rose-200 text-rose-800 font-mono font-bold shadow-2xs">
                {triage.emergency_trigger_code}
              </span>
            )}
            {triage.peak_pm25_ugm3 && (
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 font-mono shadow-2xs">
                Peak PM2.5: <strong className="text-slate-900">{triage.peak_pm25_ugm3} µg/m³</strong>
              </span>
            )}
            {triage.unreliable_sensors_count > 0 && (
              <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md font-mono font-bold shadow-2xs">
                ✖ {triage.unreliable_sensors_count} Fault
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-emerald-800/70 font-mono">
            Deterministic Decision Engine (<span className="text-emerald-700 font-bold">&lt;5ms</span>)
          </span>
        )}
      </div>

    </header>
  );
};
