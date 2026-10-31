import { describe, expect, it } from 'vitest';
import { addDays } from '../../lib/dates';
import { computePregnancy, lmpFromReportedWeeks, trimesterOf } from '../../domain/pregnancy';

const LMP = '2026-01-01';
const at = (offset: number) => addDays(LMP, offset);

function ok(input: Parameters<typeof computePregnancy>[0]) {
  const r = computePregnancy(input);
  if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
  return r;
}

describe('computePregnancy from LMP', () => {
  it('computes the EDD as LMP + 280 days (Naegele)', () => {
    expect(ok({ lmp: LMP, today: LMP }).edd).toBe('2026-10-08');
    expect(ok({ lmp: '2024-01-01', today: '2024-01-01' }).edd).toBe('2024-10-07'); // leap year
  });

  it('is 0w0d on the LMP itself', () => {
    const r = ok({ lmp: LMP, today: LMP });
    expect([r.weeks, r.days, r.trimester, r.phase]).toEqual([0, 0, 1, 'ongoing']);
    expect(r.progress).toBe(0);
    expect(r.basis).toBe('lmp');
  });

  it('handles trimester boundaries exactly', () => {
    expect(ok({ lmp: LMP, today: at(97) })).toMatchObject({ weeks: 13, days: 6, trimester: 1 });
    expect(ok({ lmp: LMP, today: at(98) })).toMatchObject({ weeks: 14, days: 0, trimester: 2 });
    expect(ok({ lmp: LMP, today: at(195) })).toMatchObject({ weeks: 27, days: 6, trimester: 2 });
    expect(ok({ lmp: LMP, today: at(196) })).toMatchObject({ weeks: 28, days: 0, trimester: 3 });
    expect(trimesterOf(0)).toBe(1);
    expect(trimesterOf(279)).toBe(3);
  });

  it('reports the due date, progress and phases around term', () => {
    const edd = ok({ lmp: LMP, today: at(280) });
    expect(edd).toMatchObject({ weeks: 40, days: 0, daysUntilEdd: 0, progress: 1, phase: 'ongoing' });
    expect(ok({ lmp: LMP, today: at(281) })).toMatchObject({ weeks: 40, days: 1, daysUntilEdd: -1, phase: 'past_edd', progress: 1 });
    expect(ok({ lmp: LMP, today: at(301) }).phase).toBe('past_edd');
    expect(ok({ lmp: LMP, today: at(302) }).phase).toBe('implausible');
  });

  it('computes progress as a fraction of 280 days', () => {
    expect(ok({ lmp: LMP, today: at(140) }).progress).toBeCloseTo(0.5, 10);
  });
});

describe('computePregnancy from EDD', () => {
  it('derives the LMP from a due date', () => {
    const r = ok({ edd: '2026-10-08', eddSource: 'clinician', today: '2026-04-23' });
    expect(r).toMatchObject({ lmp: LMP, weeks: 16, days: 0, basis: 'edd_clinician' });
  });

  it('labels a self-entered due date separately', () => {
    expect(ok({ edd: '2026-10-08', today: '2026-04-23' }).basis).toBe('edd_user');
  });

  it('lets a clinician EDD override the LMP and reports the discrepancy', () => {
    const r = ok({ lmp: LMP, edd: '2026-10-15', eddSource: 'clinician', today: '2026-04-23' });
    expect(r).toMatchObject({ basis: 'edd_clinician', lmp: '2026-01-08', weeks: 15, days: 0, discrepancyDays: 7 });
  });

  it('keeps the LMP when the EDD is only user-entered', () => {
    const r = ok({ lmp: LMP, edd: '2026-10-15', eddSource: 'user', today: '2026-04-23' });
    expect(r).toMatchObject({ basis: 'lmp', lmp: LMP, edd: '2026-10-08', discrepancyDays: 7 });
  });

  it('has no discrepancy when only one date is supplied', () => {
    expect(ok({ lmp: LMP, today: at(10) }).discrepancyDays).toBeNull();
  });

  it('accepts an EDD exactly 280 days away but not 281', () => {
    expect(ok({ edd: addDays('2026-04-23', 280), today: '2026-04-23' })).toMatchObject({ weeks: 0, days: 0 });
    expect(computePregnancy({ edd: addDays('2026-04-23', 281), today: '2026-04-23' })).toEqual({ ok: false, error: 'edd_too_far' });
  });
});

describe('computePregnancy edge cases', () => {
  it('reports missing dates without guessing', () => {
    expect(computePregnancy({ today: '2026-04-23' })).toEqual({ ok: false, error: 'no_dates' });
    expect(computePregnancy({ lmp: '', edd: '  ', today: '2026-04-23' })).toEqual({ ok: false, error: 'no_dates' });
    expect(computePregnancy({ lmp: null, edd: null, today: '2026-04-23' })).toEqual({ ok: false, error: 'no_dates' });
  });

  it('rejects invalid dates instead of ignoring them', () => {
    expect(computePregnancy({ lmp: '2026-02-30', today: '2026-04-23' })).toEqual({ ok: false, error: 'invalid_lmp' });
    expect(computePregnancy({ lmp: 'abc', today: '2026-04-23' })).toEqual({ ok: false, error: 'invalid_lmp' });
    expect(computePregnancy({ edd: '31/12/2026', today: '2026-04-23' })).toEqual({ ok: false, error: 'invalid_edd' });
    // A valid EDD does not hide an invalid LMP.
    expect(computePregnancy({ lmp: 'bad', edd: '2026-10-08', today: '2026-04-23' })).toEqual({ ok: false, error: 'invalid_lmp' });
  });

  it('rejects an LMP in the future and an invalid "today"', () => {
    expect(computePregnancy({ lmp: '2026-05-01', today: '2026-04-23' })).toEqual({ ok: false, error: 'lmp_in_future' });
    expect(computePregnancy({ lmp: LMP, today: 'bad' })).toEqual({ ok: false, error: 'invalid_today' });
  });

  it('tags a derived LMP from a reported week', () => {
    const r = ok({ lmp: '2026-01-26', lmpSource: 'reported_week', today: '2026-04-23' });
    expect(r.basis).toBe('reported_week');
  });
});

describe('lmpFromReportedWeeks', () => {
  it('converts weeks and days to an approximate LMP', () => {
    expect(lmpFromReportedWeeks(12, 3, '2026-04-23')).toBe('2026-01-26');
    expect(lmpFromReportedWeeks(0, 0, '2026-04-23')).toBe('2026-04-23');
    expect(lmpFromReportedWeeks(42, 6, '2026-12-31')).not.toBeNull();
  });

  it('rejects out-of-range, fractional and invalid input', () => {
    expect(lmpFromReportedWeeks(-1, 0, '2026-04-23')).toBeNull();
    expect(lmpFromReportedWeeks(43, 0, '2026-04-23')).toBeNull();
    expect(lmpFromReportedWeeks(1.5, 0, '2026-04-23')).toBeNull();
    expect(lmpFromReportedWeeks(10, 7, '2026-04-23')).toBeNull();
    expect(lmpFromReportedWeeks(10, 0, 'bad')).toBeNull();
    expect(lmpFromReportedWeeks(Number.NaN, 0, '2026-04-23')).toBeNull();
  });
});
