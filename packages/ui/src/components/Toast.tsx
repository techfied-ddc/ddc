import React from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import { cn } from '../lib/cn.js';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-[var(--border-muted)]',
  success: 'border-[rgba(95,168,122,0.3)]',
  error:   'border-[rgba(200,75,75,0.3)]',
  warning: 'border-[rgba(232,168,56,0.3)]',
};

const variantIcon: Record<ToastVariant, string> = {
  default: '',
  success: '✓',
  error:   '✕',
  warning: '⚠',
};

const iconColour: Record<ToastVariant, string> = {
  default: '',
  success: 'text-[var(--success)]',
  error:   'text-[var(--danger)]',
  warning: 'text-[var(--warning)]',
};

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const variant = toast.variant ?? 'default';
  return (
    <RadixToast.Root
      duration={toast.duration ?? 4000}
      onOpenChange={(open) => { if (!open) onDismiss(toast.id); }}
      className={cn(
        'glass rounded-[var(--radius)] p-4 flex items-start gap-3 shadow-glass',
        'data-[state=open]:animate-slideUp data-[state=closed]:animate-fadeOut',
        'border',
        variantStyles[variant],
      )}
    >
      {variantIcon[variant] && (
        <span className={cn('text-sm font-bold mt-0.5 flex-shrink-0', iconColour[variant])}>
          {variantIcon[variant]}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <RadixToast.Title className="text-sm font-semibold text-[var(--text-primary)]">
          {toast.title}
        </RadixToast.Title>
        {toast.description && (
          <RadixToast.Description className="text-xs text-[var(--text-muted)] mt-0.5">
            {toast.description}
          </RadixToast.Description>
        )}
      </div>
      <RadixToast.Close
        className="text-[var(--text-subtle)] hover:text-[var(--text-primary)] flex-shrink-0 p-0.5"
        aria-label="Dismiss"
      >
        ✕
      </RadixToast.Close>
    </RadixToast.Root>
  );
};

interface ToastProviderProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ toasts, onDismiss }) => (
  <RadixToast.Provider>
    {toasts.map((t) => (
      <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
    ))}
    <RadixToast.Viewport className="fixed bottom-20 right-4 flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)] z-[60]" />
  </RadixToast.Provider>
);
