import React from 'react';
import { cn } from '../lib/cn.js';

interface KpiTileProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  /** Icon or emoji */
  icon?: React.ReactNode;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  className?: string;
}

const trendColour = {
  up:   'text-[var(--success)]',
  down: 'text-[var(--danger)]',
  flat: 'text-[var(--text-subtle)]',
};

const trendArrow = { up: '↑', down: '↓', flat: '→' };

export const KpiTile: React.FC<KpiTileProps> = ({ label, value, sub, icon, trend, className }) => (
  <div
    className={cn(
      'glass rounded-[var(--radius)] p-4',
      'flex flex-col gap-2',
      className,
    )}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-[var(--text-subtle)] font-medium uppercase tracking-wide">
        {label}
      </span>
      {icon && (
        <span className="text-[var(--gold)] opacity-70 text-base" aria-hidden>
          {icon}
        </span>
      )}
    </div>

    <div className="flex items-end gap-2 min-w-0">
      <span className="font-display text-2xl sm:text-3xl font-light text-[var(--gold-bright)] leading-none truncate">
        {value}
      </span>
      {sub && (
        <span className="text-xs text-[var(--text-muted)] pb-0.5 truncate">{sub}</span>
      )}
    </div>

    {trend && (
      <span className={cn('text-xs font-medium', trendColour[trend.direction])}>
        {trendArrow[trend.direction]} {trend.label}
      </span>
    )}
  </div>
);
