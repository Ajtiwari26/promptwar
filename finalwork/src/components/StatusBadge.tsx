import React from 'react';
import { Triangle, Diamond, Circle, X, AlertTriangle, Square } from 'lucide-react';
import { AQISeverity, ValidationStatus } from '../types/decisionEngine.js';

interface StatusBadgeProps {
  severity?: AQISeverity | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status?: ValidationStatus | 'OK' | 'ERR' | 'GAP';
  value?: number | null;
  rawStr?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  severity,
  status,
  value,
  rawStr,
  className = '',
  size = 'sm'
}) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  // Check hardware fault or gap first
  if (status === 'INVALID_ANOMALY' || status === 'ERR' || rawStr === '-999' || rawStr?.includes('ERR')) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase rounded border border-zinc-600 bg-striped-fault text-zinc-300 ${sizeClasses} ${className}`}
        role="status"
        aria-label="Sensor Hardware Fault"
      >
        <X className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-zinc-300 shrink-0 stroke-[2.5]`} />
        <span>✖ SENSOR FAULT</span>
      </span>
    );
  }

  if (status === 'MISSING' || status === 'GAP' || rawStr === 'NULL' || rawStr === 'NA') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase rounded border border-amber-600/80 bg-zinc-900 text-amber-300 ${sizeClasses} ${className}`}
        role="status"
        aria-label="Telemetry Data Gap"
      >
        <AlertTriangle className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 shrink-0 stroke-[2.5]`} />
        <span>⚠ DATA GAP</span>
      </span>
    );
  }

  // Map severity levels
  if (severity === 'SEVERE' || severity === 'VERY_POOR' || severity === 'CRITICAL' || severity === 'HIGH' || (value !== null && value !== undefined && value > 300)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase rounded border border-red-500 bg-red-950/70 text-red-200 ${sizeClasses} ${className}`}
        role="status"
        aria-label="Severe Hazard Tier"
      >
        <Triangle className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-red-400 fill-red-400 shrink-0`} />
        <span>▲ SEVERE</span>
      </span>
    );
  }

  if (severity === 'POOR' || (value !== null && value !== undefined && value >= 200 && value <= 300)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase rounded border border-amber-500 bg-amber-950/70 text-amber-200 ${sizeClasses} ${className}`}
        role="status"
        aria-label="Poor Air Quality Tier"
      >
        <Diamond className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 fill-amber-400 shrink-0`} />
        <span>◆ POOR</span>
      </span>
    );
  }

  if (severity === 'MODERATE' || (value !== null && value !== undefined && value > 100 && value < 200)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase rounded border border-yellow-500 bg-yellow-950/60 text-yellow-200 ${sizeClasses} ${className}`}
        role="status"
        aria-label="Moderate Air Quality Tier"
      >
        <Square className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-yellow-400 fill-yellow-400 shrink-0`} />
        <span>■ MODERATE</span>
      </span>
    );
  }

  // Normal / Good
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase rounded border border-emerald-500 bg-emerald-950/60 text-emerald-200 ${sizeClasses} ${className}`}
      role="status"
      aria-label="Normal Air Quality Tier"
    >
      <Circle className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-400 fill-emerald-400 shrink-0`} />
      <span>● NORMAL</span>
    </span>
  );
};
