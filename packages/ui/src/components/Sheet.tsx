import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../lib/cn.js';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Height of the sheet. Defaults to 'auto'. */
  height?: 'auto' | 'half' | 'full';
}

const heightMap = {
  auto: 'max-h-[90vh]',
  half: 'h-1/2',
  full: 'h-screen',
};

export const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  height = 'auto',
}) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      {/* Overlay */}
      <Dialog.Overlay
        className={cn(
          'fixed inset-0 z-50',
          'bg-black/60 backdrop-blur-sm',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        )}
      />

      {/* Sheet panel — slides up from bottom */}
      <Dialog.Content
        className={cn(
          'fixed bottom-0 inset-x-0 z-50',
          'bg-[var(--bg-base)] border-t border-[var(--glass-border)]',
          'rounded-t-[20px]',
          'flex flex-col',
          heightMap[height],
          'overflow-hidden',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
          'duration-300',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden>
          <div className="w-10 h-1 rounded-full bg-[var(--bg-ash)]" />
        </div>

        {(title || description) && (
          <div className="px-5 pt-2 pb-4 flex-shrink-0 border-b border-[var(--border-muted)]">
            {title && (
              <Dialog.Title className="text-base font-semibold text-[var(--text-primary)]">
                {title}
              </Dialog.Title>
            )}
            {description && (
              <Dialog.Description className="text-sm text-[var(--text-muted)] mt-1">
                {description}
              </Dialog.Description>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
