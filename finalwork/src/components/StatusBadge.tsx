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
        className={`inline-flex items-center gap-1.5 font-mono font-semibold uppercase rounded-md border border-rose-200 bg-rose-50 text-rose-700 shadow-xs ${sizeClasses} ${className}`}
        role="status"
        aria-label="Sensor Hardware Fault"
      >
        <X className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-rose-600 shrink-0 stroke-[2.5]`} />
        <span>✖ SENSOR FAULT</span>
      </span>
    );
  }

  if (status === 'MISSING' || status === 'GAP' || rawStr === 'NULL' || rawStr === 'NA') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-semibold uppercase rounded-md border border-amber-200 bg-amber-50 text-amber-800 shadow-xs ${sizeClasses} ${className}`}
        role="status"
        aria-label="Telemetry Data Gap"
      >
        <AlertTriangle className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-600 shrink-0 stroke-[2.5]`} />
        <span>⚠ DATA GAP</span>
      </span>
    );
  }

  // Map severity levels
  if (severity === 'SEVERE' || severity === 'VERY_POOR' || severity === 'CRITICAL' || severity === 'HIGH' || (value !== null && value !== undefined && value > 300)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-semibold uppercase rounded-md border border-red-200 bg-red-50 text-red-700 shadow-xs ${sizeClasses} ${className}`}
        role="status"
        aria-label="Severe Hazard Tier"
      >
        <Triangle className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-red-600 fill-red-600 shrink-0`} />
        <span>▲ SEVERE</span>
      </span>
    );
  }

  if (severity === 'POOR' || (value !== null && value !== undefined && value >= 200 && value <= 300)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-semibold uppercase rounded-md border border-orange-200 bg-orange-50 text-orange-800 shadow-xs ${sizeClasses} ${className}`}
        role="status"
        aria-label="Poor Air Quality Tier"
      >
        <Diamond className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-orange-600 fill-orange-600 shrink-0`} />
        <span>◆ POOR</span>
      </span>
    );
  }

  if (severity === 'MODERATE' || (value !== null && value !== undefined && value > 100 && value < 200)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-semibold uppercase rounded-md border border-amber-200 bg-amber-50 text-amber-800 shadow-xs ${sizeClasses} ${className}`}
        role="status"
        aria-label="Moderate Air Quality Tier"
      >
        <Square className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-600 fill-amber-600 shrink-0`} />
        <span>■ MODERATE</span>
      </span>
    );
  }

  // Normal / Good
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold uppercase rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-xs ${sizeClasses} ${className}`}
      role="status"
      aria-label="Normal Air Quality Tier"
    >
      <Circle className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-600 fill-emerald-600 shrink-0`} />
      <span>● NORMAL</span>
    </span>
  );
};
