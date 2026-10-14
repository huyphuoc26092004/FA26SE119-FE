import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

export function getMatchScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (score >= 85) {
    return {
      bg: 'bg-emerald-50 text-emerald-700',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      label: 'Excellent Match',
    };
  }
  if (score >= 70) {
    return {
      bg: 'bg-blue-50 text-blue-700',
      text: 'text-blue-700',
      border: 'border-blue-200',
      label: 'Good Match',
    };
  }
  if (score >= 55) {
    return {
      bg: 'bg-amber-50 text-amber-700',
      text: 'text-amber-700',
      border: 'border-amber-200',
      label: 'Moderate Match',
    };
  }
  return {
    bg: 'bg-rose-50 text-rose-700',
    text: 'text-rose-700',
    border: 'border-rose-200',
    label: 'Low Match',
  };
}

export interface MatchScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  score,
  showLabel = true,
  size = 'md',
  className,
}) => {
  const meta = getMatchScoreColor(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-bold px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border shadow-2xs font-semibold transition-all',
        meta.bg,
        meta.border,
        sizeClasses[size],
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-80" />
      <span>{score}%</span>
      {showLabel && <span className="opacity-90">• {meta.label}</span>}
    </span>
  );
};
