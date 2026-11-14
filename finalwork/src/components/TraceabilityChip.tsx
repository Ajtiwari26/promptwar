import React from 'react';
import { Link2 } from 'lucide-react';

interface TraceabilityChipProps {
  rowId: string;
  onClick?: (rowId: string) => void;
  className?: string;
  isSelected?: boolean;
}

export const TraceabilityChip: React.FC<TraceabilityChipProps> = ({
  rowId,
  onClick,
  className = '',
  isSelected = false
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick && onClick(rowId)}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold tracking-tight transition border cursor-pointer ${
        isSelected
          ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200'
          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50'
      } ${className}`}
      title={`Inspect telemetry source evidence: ${rowId}`}
      aria-label={`Inspect source evidence row ${rowId}`}
    >
      <Link2 className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-400'} shrink-0`} />
      <span>{rowId}</span>
    </button>
  );
};
