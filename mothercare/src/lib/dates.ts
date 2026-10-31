/**
 * Calendar-date helpers. Dates are plain "YYYY-MM-DD" strings (no time, no zone)
 * and all arithmetic is done on UTC day numbers, so results never shift with the
 * machine's time zone or daylight-saving changes.
 */

export type ISODate = string;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;
const MIN_YEAR = 1900;
const MAX_YEAR = 2200;

/** Returns days since 1970-01-01 for a valid ISO date, otherwise null. */
export function parseISODate(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const m = ISO_RE.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < MIN_YEAR || y > MAX_YEAR) return null;
  const ms = Date.UTC(y, mo - 1, d);
  const dt = new Date(ms);
  // Round-trip check rejects things like 2026-02-30 or 2026-13-01.
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return Math.round(ms / MS_PER_DAY);
}

export function isValidISODate(value: unknown): value is ISODate {
  return parseISODate(value) !== null;
}

export function toISODate(dayNumber: number): ISODate {
  return new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Adds days to a valid ISO date. Throws RangeError if the input is not valid. */
export function addDays(date: ISODate, days: number): ISODate {
  const n = parseISODate(date);
  if (n === null) throw new RangeError(`Invalid ISO date: ${String(date)}`);
  return toISODate(n + days);
}

/** Whole days from `from` to `to` (positive when `to` is later). Null if either is invalid. */
export function diffDays(from: unknown, to: unknown): number | null {
  const a = parseISODate(from);
  const b = parseISODate(to);
  if (a === null || b === null) return null;
  return b - a;
}

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz.trim() === '') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Today's calendar date in the given IANA time zone (falls back to UTC if the zone is invalid). */
export function todayInZone(now: Date, timeZone?: string): ISODate {
  const zone = isValidTimeZone(timeZone) ? timeZone : 'UTC';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function formatDisplayDate(date: ISODate, locale = 'en'): string {
  const n = parseISODate(date);
  if (n === null) return '';
  return new Date(n * MS_PER_DAY).toLocaleDateString(locale, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}
