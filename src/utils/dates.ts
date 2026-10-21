import type { ISODate } from '@/types/models';

/** Local calendar date as YYYY-MM-DD (not UTC — "today" means the user's today). */
export function toISODate(d: Date = new Date()): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = fromISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function formatLongDate(s: ISODate) {
  return fromISODate(s).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatShortDate(s: ISODate) {
  return fromISODate(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function weekdayShort(s: ISODate) {
  return fromISODate(s).toLocaleDateString(undefined, { weekday: 'short' });
}

export function relativeDay(s: ISODate, today: ISODate = toISODate()) {
  const diff = Math.round((fromISODate(s).getTime() - fromISODate(today).getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return fromISODate(s).toLocaleDateString(undefined, { weekday: 'long' });
  if (diff < 0 && diff > -7) return `${-diff} days ago`;
  return formatShortDate(s);
}

export function greeting(d: Date = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Monday-first grid of dates for a month view. */
export function monthGrid(year: number, month: number): (ISODate | null)[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (ISODate | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) cells.push(toISODate(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  return cells;
}
