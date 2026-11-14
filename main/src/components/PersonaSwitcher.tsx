import React from 'react';
import { Landmark, Building2, School, Bike, CheckSquare, AlertCircle, ArrowUpRight } from 'lucide-react';
import { RoleSpecificActionsSchema } from '../types/briefingSchema.js';
import { z } from 'zod';

type RoleSpecificActions = z.infer<typeof RoleSpecificActionsSchema>;
export type SupportedRole = 'ward_officer' | 'housing_society' | 'school_principal' | 'gig_worker';

interface PersonaSwitcherProps {
  roleActions: RoleSpecificActions | null;
  activeRole: SupportedRole;
  onRoleChange: (role: SupportedRole) => void;
  onSelectCitation: (rowId: string) => void;
}

export const PersonaSwitcher: React.FC<PersonaSwitcherProps> = ({
  roleActions,
  activeRole,
  onRoleChange,
  onSelectCitation
}) => {
  const currentActions = roleActions ? roleActions[activeRole] || [] : [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Role Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Role-Specific Interventions (0ms In-Memory Triage)
          </h2>
          <p className="text-[11px] text-slate-400">Tailored operational powers suited to who is asking</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800" role="tablist">
          <button
            role="tab"
            aria-selected={activeRole === 'ward_officer'}
            onClick={() => onRoleChange('ward_officer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeRole === 'ward_officer'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            Ward Officer
          </button>

          <button
            role="tab"
            aria-selected={activeRole === 'housing_society'}
            onClick={() => onRoleChange('housing_society')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeRole === 'housing_society'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Housing Society RWA
          </button>

          <button
            role="tab"
            aria-selected={activeRole === 'school_principal'}
            onClick={() => onRoleChange('school_principal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeRole === 'school_principal'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            School Principal
          </button>

          <button
            role="tab"
            aria-selected={activeRole === 'gig_worker'}
            onClick={() => onRoleChange('gig_worker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeRole === 'gig_worker'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            Gig / Delivery Worker
          </button>
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-2.5">
        {currentActions.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500 text-center">
            No specific actions required for this role at current ambient baseline levels.
          </div>
        ) : (
          currentActions.map((item, idx) => {
            const isImmediate = item.priority === 'IMMEDIATE';
            const isHigh = item.priority === 'HIGH';

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1 rounded-md ${
                    isImmediate
                      ? 'bg-red-500/20 text-red-400'
                      : isHigh
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <CheckSquare className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        isImmediate
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : isHigh
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">{item.action}</p>
                  </div>
                </div>

                {/* Clickable Traceability Badges */}
                <div className="flex flex-wrap gap-1 shrink-0 pt-0.5">
                  {item.traceability_refs.map((ref) => (
                    <button
                      key={ref}
                      onClick={() => onSelectCitation(ref)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700 hover:border-emerald-500 transition flex items-center gap-1 group"
                      title={`Click to inspect telemetry proof in ${ref}`}
                    >
                      <span>{ref}</span>
                      <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-white" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
