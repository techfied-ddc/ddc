import React from 'react';
import { cn } from '../lib/cn.js';

export interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number | string;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ tabs, activeKey, onChange, className }) => (
  <nav
    className={cn(
      'fixed bottom-0 inset-x-0 z-40',
      'bg-[var(--bg-base)] border-t border-[var(--border-muted)]',
      'backdrop-blur-md',
      'flex items-stretch',
      className,
    )}
    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    aria-label="Main navigation"
  >
    {tabs.map((tab) => {
      const active = tab.key === activeKey;
      return (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1',
            'min-h-[var(--touch-target)] transition-colors duration-150',
            active ? 'text-[var(--gold)]' : 'text-[var(--text-subtle)]',
            'hover:text-[var(--text-muted)] focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-inset',
          )}
        >
          <span className="relative flex items-center justify-center">
            {active ? (tab.activeIcon ?? tab.icon) : tab.icon}
            {tab.badge != null && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[var(--danger)] text-white text-[9px] font-mono font-medium flex items-center justify-center leading-none">
                {tab.badge}
              </span>
            )}
          </span>
          <span className={cn('text-[10px] font-medium leading-none', active && 'font-semibold')}>
            {tab.label}
          </span>
        </button>
      );
    })}
  </nav>
);

/** Spacer that fills the BottomTabBar height + safe-area. */
export const BottomTabBarSpacer: React.FC = () => (
  <div
    className="h-16"
    style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    aria-hidden
  />
);
