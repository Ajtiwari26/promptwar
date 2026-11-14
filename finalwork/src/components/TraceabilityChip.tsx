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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-bold tracking-tight transition border ${
        isSelected
          ? 'bg-zinc-100 text-zinc-950 border-white ring-2 ring-zinc-400'
          : 'bg-[#18181B] text-zinc-300 border-[#27272A] hover:border-zinc-500 hover:text-white hover:bg-zinc-800'
      } ${className}`}
      title={`Inspect telemetry source evidence: ${rowId}`}
      aria-label={`Inspect source evidence row ${rowId}`}
    >
      <Link2 className="w-3 h-3 text-zinc-400 shrink-0" />
      <span>{rowId}</span>
    </button>
  );
};
