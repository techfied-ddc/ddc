import React from 'react';
import { cn } from '../lib/cn.js';

export interface TimelineStep {
  key: string;
  label: string;
  sub?: string;
  timestamp?: string;
  status: 'done' | 'active' | 'pending';
}

interface TimelineProps {
  steps: TimelineStep[];
  className?: string;
}

const dotClass: Record<TimelineStep['status'], string> = {
  done:    'bg-[var(--gold)] border-[var(--gold)]',
  active:  'bg-transparent border-[var(--gold)] ring-2 ring-[var(--gold-glow)]',
  pending: 'bg-transparent border-[var(--border-muted)]',
};

const labelClass: Record<TimelineStep['status'], string> = {
  done:    'text-[var(--text-primary)]',
  active:  'text-[var(--gold)]',
  pending: 'text-[var(--text-subtle)]',
};

export const Timeline: React.FC<TimelineProps> = ({ steps, className }) => (
  <ol className={cn('flex flex-col', className)}>
    {steps.map((step, i) => {
      const isLast = i === steps.length - 1;
      return (
        <li key={step.key} className="flex gap-3">
          {/* Track + dot */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-3 h-3 rounded-full border-2 flex-shrink-0 mt-0.5',
                dotClass[step.status],
              )}
              aria-label={step.status}
            />
            {!isLast && (
              <div className="w-px flex-1 my-1 bg-[var(--border-muted)]" />
            )}
          </div>

          {/* Content */}
          <div className={cn('pb-4 flex-1 min-w-0', isLast && 'pb-0')}>
            <p className={cn('text-sm font-medium', labelClass[step.status])}>
              {step.label}
            </p>
            {step.sub && (
              <p className="text-xs text-[var(--text-subtle)] mt-0.5">{step.sub}</p>
            )}
            {step.timestamp && (
              <p className="text-[10px] font-mono text-[var(--text-subtle)] mt-0.5">
                {step.timestamp}
              </p>
            )}
          </div>
        </li>
      );
    })}
  </ol>
);
