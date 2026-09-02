import React, { useRef, useEffect } from 'react';
import { cn } from '../lib/cn.js';

interface OtpInputProps {
  length?: 4 | 6;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  error,
  autoFocus,
}) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  const digits = value.split('').slice(0, length);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const next = [...digits];
    next[index] = char.slice(-1); // take last char (for autocomplete paste)
    const joined = next.join('').slice(0, length);
    onChange(joined);
    if (joined.length === length) onComplete?.(joined);
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      onChange(next.join(''));
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(text);
    if (text.length === length) onComplete?.(text);
    const nextFocus = Math.min(text.length, length - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  return (
    <div
      className={cn('flex gap-2 sm:gap-3', length === 6 && 'gap-1.5 sm:gap-2')}
      role="group"
      aria-label={`${length}-digit code`}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digits[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          className={cn(
            'w-10 h-12 sm:w-12 sm:h-14 text-center',
            'font-mono text-xl sm:text-2xl font-medium tracking-wider',
            'bg-[var(--bg-elevated)] text-[var(--text-primary)]',
            'border rounded-[var(--radius-sm)]',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)]',
            digits[i]
              ? 'border-[var(--gold)] text-[var(--gold)]'
              : 'border-[var(--border-muted)]',
            error && 'border-[var(--danger)] ring-1 ring-[var(--danger)]',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />
      ))}
    </div>
  );
};
