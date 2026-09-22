// Local calendar dates for study days. Everything uses local Date components,
// never UTC parsing, so a start date never shifts across a timezone boundary.

import { isValidIsoDate } from './progress.ts';

export function localDateForDay(startIso: string, dayNumber: number): Date | null {
  if (!isValidIsoDate(startIso)) return null;
  const [y, m, d] = startIso.split('-').map(Number);
  return new Date(y, m - 1, d + dayNumber - 1);
}

export function toLocalIso(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function formatLocalDate(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
