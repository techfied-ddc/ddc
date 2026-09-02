import React from 'react';
import { cn } from '../lib/cn.js';

interface AppBarProps {
  title?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Blurs background on scroll — pass scrolled={true} to trigger. */
  scrolled?: boolean;
  className?: string;
}

export const AppBar: React.FC<AppBarProps> = ({ title, left, right, scrolled, className }) => (
  <header
    className={cn(
      'fixed top-0 inset-x-0 z-40 h-14 flex items-center px-4 gap-3',
      'safe-top transition-all duration-300',
      scrolled
        ? 'bg-[var(--bg-base)] border-b border-[var(--border-muted)] backdrop-blur-md'
        : 'bg-transparent',
      className,
    )}
    style={{ paddingTop: 'env(safe-area-inset-top)' }}
  >
    {left && <div className="flex-shrink-0 min-w-[40px]">{left}</div>}

    <div className="flex-1 min-w-0 text-center">
      {typeof title === 'string' ? (
        <span className="font-medium text-[var(--text-primary)] text-base truncate block">
          {title}
        </span>
      ) : title}
    </div>

    {right && <div className="flex-shrink-0 min-w-[40px] flex justify-end">{right}</div>}
  </header>
);

/** Spacer that fills the AppBar height. Add below <AppBar> in your layout. */
export const AppBarSpacer: React.FC = () => (
  <div className="h-14" style={{ paddingTop: 'env(safe-area-inset-top)' }} aria-hidden />
);
