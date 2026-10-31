import { describe, expect, it } from 'vitest';
import { addDays, diffDays, isValidISODate, isValidTimeZone, parseISODate, todayInZone } from '../../lib/dates';

describe('parseISODate / isValidISODate', () => {
  it('accepts real calendar dates, including leap days', () => {
    expect(isValidISODate('2026-01-01')).toBe(true);
    expect(isValidISODate('2024-02-29')).toBe(true);
  });

  it('rejects impossible dates and wrong formats', () => {
    for (const bad of ['2026-02-30', '2025-02-29', '2026-13-01', '2026-00-10', '2026/01/01', '26-01-01', 'abc', '', ' 2026-01-01', '2026-1-1']) {
      expect(parseISODate(bad), bad).toBeNull();
    }
  });

  it('rejects non-string input and implausible years', () => {
    expect(parseISODate(undefined)).toBeNull();
    expect(parseISODate(null)).toBeNull();
    expect(parseISODate(20260101)).toBeNull();
    expect(parseISODate('1850-01-01')).toBeNull();
    expect(parseISODate('2300-01-01')).toBeNull();
  });
});

describe('addDays / diffDays', () => {
  it('crosses month, year and leap-year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('throws on an invalid date', () => {
    expect(() => addDays('nope', 1)).toThrow(RangeError);
  });

  it('computes signed whole-day differences and returns null for bad input', () => {
    expect(diffDays('2026-01-01', '2026-01-31')).toBe(30);
    expect(diffDays('2026-01-31', '2026-01-01')).toBe(-30);
    expect(diffDays('2026-01-01', '2026-01-01')).toBe(0);
    expect(diffDays('bad', '2026-01-01')).toBeNull();
  });
});

describe('time zones', () => {
  it('validates IANA zone names', () => {
    expect(isValidTimeZone('Africa/Lagos')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });

  it('computes the calendar date in a zone, not the machine zone', () => {
    const instant = new Date('2026-03-10T23:30:00Z');
    expect(todayInZone(instant, 'UTC')).toBe('2026-03-10');
    expect(todayInZone(instant, 'Africa/Lagos')).toBe('2026-03-11'); // UTC+1
    expect(todayInZone(instant, 'America/Los_Angeles')).toBe('2026-03-10');
  });

  it('falls back to UTC for an invalid zone', () => {
    expect(todayInZone(new Date('2026-03-10T23:30:00Z'), 'Bad/Zone')).toBe('2026-03-10');
  });
});
