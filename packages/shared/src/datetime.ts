import { TIMEZONE } from './constants.js';

/** Format a Date as a human-readable string in Asia/Kolkata. */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    dateStyle: 'medium',
    ...options,
  }).format(typeof date === 'string' ? new Date(date) : date);

/** Format a Date as a time string in Asia/Kolkata. */
export const formatTime = (date: Date | string): string =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    timeStyle: 'short',
  }).format(typeof date === 'string' ? new Date(date) : date);

/** Format a Date as relative time (e.g. "2 hours ago"). */
export const formatRelative = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

/** Parse "HH:mm" and return a Date for today at that time in IST. */
export const parseTimeToday = (hhmm: string): Date => {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  const now = new Date();
  // Build in UTC then interpret as IST (UTC+5:30)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const utcMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - istOffsetMs;
  return new Date(utcMidnight + (h * 60 + m) * 60 * 1000);
};
