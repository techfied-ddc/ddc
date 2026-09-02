import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn.js';

const buttonVariants = cva(
  // Base — always applied
  [
    'inline-flex items-center justify-center gap-2 font-sans font-medium',
    'rounded-[var(--radius)] transition-all duration-150',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)] focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.97]',
  ],
  {
    variants: {
      variant: {
        gold: [
          'bg-[var(--gold)] text-[var(--gold-text-on)]',
          'hover:bg-[var(--gold-bright)] shadow-[var(--shadow,0_0_12px_rgba(212,175,55,0.3))]',
        ],
        outline: [
          'border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)]',
          'hover:border-[var(--gold)] hover:bg-[rgba(212,175,55,0.06)]',
        ],
        ghost: [
          'text-[var(--text-primary)] bg-transparent',
          'hover:bg-[var(--glass-bg)] hover:border-[var(--border-muted)] border border-transparent',
        ],
        danger: [
          'bg-[var(--danger)] text-white',
          'hover:bg-[#a83c3c]',
        ],
        link: [
          'text-[var(--gold)] underline-offset-4 hover:underline bg-transparent p-0 h-auto',
        ],
      },
      size: {
        xs:  'h-7  px-3  text-xs',
        sm:  'h-9  px-4  text-sm',
        md:  'h-11 px-5  text-base',   // 44px — meets touch-target
        lg:  'h-13 px-6  text-md',
        icon: 'h-11 w-11 p-0',         // square icon button
      },
      fullWidth: {
        true:  'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant:   'gold',
      size:      'md',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  ),
);

Button.displayName = 'Button';
