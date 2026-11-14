import React from 'react';
import { Triangle, AlertTriangle, CheckCircle2, Landmark, Building2, School, Bike, LogOut, ChevronRight, Download, FileSpreadsheet, FileCode } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      
      {/* 1. Main Top Bar with Brand, 3-Step Breadcrumb, and 1-Click Structured Data Download */}
      <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <span className="font-heading font-black text-sm">C</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold tracking-tight text-sm text-slate-900 uppercase">
                CIVIC BRIEFING STUDIO
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Decision Intelligence
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
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
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
            aria-current={currentTab === 'ingest' ? 'step' : undefined}
          >
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
            <span>Ingest & Audit</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          <button
            onClick={() => onTabChange('command')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium cursor-pointer ${
              currentTab === 'command'
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
            aria-current={currentTab === 'command' ? 'step' : undefined}
          >
            <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[10px] flex items-center justify-center font-bold">2</span>
            <span>Command & Diff</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          <button
            onClick={() => onTabChange('publish')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium cursor-pointer ${
              currentTab === 'publish'
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download full structured audit package (JSON) with hotspots, quality flags, and advisories"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit JSON</span>
            </button>
          )}

          {onDownloadCsv && hasData && (
            <button
              onClick={onDownloadCsv}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
              title="Download normalized telemetry table as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-Header: Persona Switcher Bar + Session */}
      <div className="px-4 sm:px-6 py-2 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">
            OPERATIONAL PERSONA:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Role Switcher">
            <button
              type="button"
              onClick={() => onRoleChange('ward_officer')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                activeRole === 'ward_officer'
                  ? 'bg-blue-600 border-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
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
                  ? 'bg-blue-600 border-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
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
                  ? 'bg-blue-600 border-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
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
                  ? 'bg-blue-600 border-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
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
            ? 'bg-slate-50 border-slate-200 text-slate-600'
            : isEmergency
            ? 'bg-red-50 border-red-200 text-red-900'
            : isWarning
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {!triage ? (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="font-heading font-bold text-slate-800">SYSTEM STANDBY:</span>
              <span className="text-slate-600">Awaiting telemetry input — Select a demo preset or upload sensor streams below</span>
            </>
          ) : isEmergency ? (
            <>
              <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                <Triangle className="w-3 h-3 fill-white" />
              </div>
              <span className="font-heading font-bold text-red-900 uppercase tracking-tight">CRITICAL ALERT:</span>
              <span className="font-medium text-xs text-red-800">{triage.primary_headline}</span>
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
              <span className="px-2 py-0.5 rounded-md bg-white border border-red-200 text-red-800 font-mono font-bold shadow-2xs">
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
          <span className="text-[11px] text-slate-500 font-mono">
            Deterministic Decision Engine (<span className="text-emerald-600 font-bold">&lt;5ms</span>)
          </span>
        )}
      </div>

    </header>
  );
};
