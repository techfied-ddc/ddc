import React from 'react';
import { cn } from '../lib/cn.js';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds a subtle hover lift + border brightening. */
  hoverable?: boolean;
  /** Adds the liquid-glass shimmer animation. */
  sheen?: boolean;
  /** Padding size. Defaults to 'md'. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm:   'p-3',
  md:   'p-4 sm:p-5',
  lg:   'p-5 sm:p-7',
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hoverable, sheen, padding = 'md', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'glass rounded-[var(--radius)]',
        hoverable && 'glass-hover cursor-pointer',
        sheen && 'glass-sheen',
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

GlassCard.displayName = 'GlassCard';
