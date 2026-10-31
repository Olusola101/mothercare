import { describe, expect, it } from 'vitest';
import { addDays } from '../../lib/dates';
import { analyzeCycles, predictCycle, type CyclePrediction } from '../../domain/cycle';

/** Builds period-start dates from a first date and a list of cycle lengths. */
function startsFrom(first: string, lengths: number[]): string[] {
  const out = [first];
  for (const len of lengths) out.push(addDays(out[out.length - 1], len));
  return out;
}

function ok(input: Parameters<typeof predictCycle>[0]): CyclePrediction {
  const r = predictCycle(input);
  if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
  return r;
}

const REGULAR = ['2026-01-01', '2026-01-29', '2026-02-26', '2026-03-26']; // 28-day cycles

describe('analyzeCycles', () => {
  it('returns no statistics for no data', () => {
    expect(analyzeCycles([])).toMatchObject({ starts: [], lengths: [], stats: null, regularity: 'insufficient' });
  });

  it('computes mean, range and a "regular" verdict from 3+ cycles', () => {
    const a = analyzeCycles(REGULAR);
    expect(a.lengths).toEqual([28, 28, 28]);
    expect(a.stats).toMatchObject({ count: 3, mean: 28, min: 28, max: 28, range: 0, stdDev: 0 });
    expect(a.regularity).toBe('regular');
  });

  it('does not claim regularity from fewer than 3 cycles', () => {
    expect(analyzeCycles(startsFrom('2026-01-01', [28, 28])).regularity).toBe('insufficient');
  });

  it('calls a spread of exactly 7 days regular and 8 days irregular', () => {
    expect(analyzeCycles(startsFrom('2026-01-01', [28, 31, 35])).regularity).toBe('regular'); // range 7
    expect(analyzeCycles(startsFrom('2026-01-01', [28, 31, 36])).regularity).toBe('irregular'); // range 8
  });

  it('flags irregular cycles and reports the spread', () => {
    const a = analyzeCycles(startsFrom('2026-01-01', [25, 38, 22]));
    expect(a.regularity).toBe('irregular');
    expect(a.stats).toMatchObject({ min: 22, max: 38, range: 16 });
    expect(a.stats?.mean).toBeCloseTo(28.333, 2);
    expect(a.stats?.stdDev).toBeCloseTo(8.505, 2);
  });

  it('sorts input, de-duplicates and counts invalid entries', () => {
    const a = analyzeCycles(['2026-01-29', 'bad', '2026-01-01', '2026-01-01', '2026-02-30', 42]);
    expect(a.starts).toEqual(['2026-01-01', '2026-01-29']);
    expect(a.invalidCount).toBe(3);
    expect(a.lengths).toEqual([28]);
  });

  it('excludes implausible gaps at the 15/90-day boundaries', () => {
    expect(analyzeCycles(startsFrom('2026-01-01', [14])).excludedLengths).toEqual([14]);
    expect(analyzeCycles(startsFrom('2026-01-01', [15])).lengths).toEqual([15]);
    expect(analyzeCycles(startsFrom('2026-01-01', [90])).lengths).toEqual([90]);
    expect(analyzeCycles(startsFrom('2026-01-01', [91])).excludedLengths).toEqual([91]);
  });

  it('uses only the most recent 6 cycles for statistics', () => {
    const a = analyzeCycles(startsFrom('2025-01-01', [40, 40, 28, 28, 28, 28, 28, 28]));
    expect(a.lengths).toHaveLength(8);
    expect(a.stats).toMatchObject({ count: 6, mean: 28, range: 0 });
  });
});

describe('predictCycle with regular history', () => {
  it('predicts a range for the next period and the fertile window', () => {
    const p = ok({ starts: REGULAR, today: '2026-04-01' });
    expect(p).toMatchObject({
      lastStart: '2026-03-26',
      cycleDay: 7,
      cycleLengthUsed: 28,
      lengthSource: 'history',
      confidence: 'moderate',
      regularity: 'regular',
      daysUntilNextPeriod: 22,
      daysPastExpected: 0,
    });
    expect(p.nextPeriod).toEqual({ expected: '2026-04-23', earliest: '2026-04-21', latest: '2026-04-25' });
    expect(p.fertileWindow).toEqual({ start: '2026-04-04', end: '2026-04-10' });
    expect(p.fertileWindowUnavailableReason).toBeNull();
  });

  it('counts the first day of the period as cycle day 1', () => {
    expect(ok({ starts: REGULAR, today: '2026-03-26' }).cycleDay).toBe(1);
  });

  it('reports how late the period is once the expected date has passed', () => {
    const p = ok({ starts: REGULAR, today: '2026-04-27' });
    expect(p.daysUntilNextPeriod).toBe(-4);
    expect(p.daysPastExpected).toBe(4);
  });

  it('ignores period starts dated in the future and counts them', () => {
    const p = ok({ starts: [...REGULAR, '2027-01-01'], today: '2026-04-01' });
    expect(p.ignoredFutureStarts).toBe(1);
    expect(p.lastStart).toBe('2026-03-26');
  });
});

describe('predictCycle with irregular cycles', () => {
  const IRREGULAR = ['2026-01-01', '2026-01-26', '2026-03-05', '2026-03-27']; // 25, 38, 22

  it('widens the range, lowers confidence and withholds the fertile window', () => {
    const p = ok({ starts: IRREGULAR, today: '2026-04-01' });
    expect(p.regularity).toBe('irregular');
    expect(p.confidence).toBe('low');
    expect(p.cycleLengthUsed).toBe(28);
    expect(p.fertileWindow).toBeNull();
    expect(p.fertileWindowUnavailableReason).toBe('irregular_cycles');
    expect(p.nextPeriod.expected).toBe('2026-04-24');
    expect(p.nextPeriod.earliest).toBe('2026-04-16'); // 8 days either side
    expect(p.nextPeriod.latest).toBe('2026-05-02');
  });

  it('caps the half-width of the range at 14 days', () => {
    const p = ok({ starts: startsFrom('2026-01-01', [20, 60, 20]), today: '2026-05-20' });
    const half = Math.abs(
      (Date.parse(p.nextPeriod.latest) - Date.parse(p.nextPeriod.expected)) / 86_400_000,
    );
    expect(half).toBe(14);
  });
});

describe('predictCycle with little or no data', () => {
  it('reports when there is no period data at all', () => {
    expect(predictCycle({ starts: [], today: '2026-04-01' })).toMatchObject({ ok: false, error: 'no_period_data' });
    expect(predictCycle({ starts: ['bad'], today: '2026-04-01' })).toMatchObject({ ok: false, error: 'no_period_data' });
  });

  it('reports no data when every logged start is in the future', () => {
    expect(predictCycle({ starts: ['2026-05-01'], today: '2026-04-01' })).toMatchObject({ ok: false, error: 'no_period_data' });
  });

  it('refuses to predict from a single date with no reported average', () => {
    expect(predictCycle({ starts: ['2026-03-20'], today: '2026-04-01' })).toMatchObject({ ok: false, error: 'insufficient_data' });
  });

  it('uses the reported average, with low confidence, when history is short', () => {
    const p = ok({ starts: ['2026-03-20'], userAverage: 30, today: '2026-04-01' });
    expect(p).toMatchObject({ lengthSource: 'user_average', confidence: 'low', cycleLengthUsed: 30 });
    expect(p.nextPeriod.expected).toBe('2026-04-19');
    expect(p.nextPeriod.earliest).toBe('2026-04-15'); // default ±4 days
  });

  it('uses limited history, with low confidence, for 1-2 cycles and no reported average', () => {
    const p = ok({ starts: startsFrom('2026-01-01', [30, 30]), today: '2026-03-10' });
    expect(p).toMatchObject({ lengthSource: 'history_limited', confidence: 'low', cycleLengthUsed: 30 });
  });

  it('ignores an unusable reported average', () => {
    for (const bad of [10, 200, Number.NaN, null, undefined]) {
      expect(predictCycle({ starts: ['2026-03-20'], userAverage: bad as number, today: '2026-04-01' })).toMatchObject({
        ok: false,
        error: 'insufficient_data',
      });
    }
  });

  it('keeps the fertile window inside the current cycle for very short cycles', () => {
    const p = ok({ starts: ['2026-01-01'], userAverage: 15, today: '2026-01-05' });
    expect(p.fertileWindow?.start).toBe('2026-01-01');
  });

  it('withholds predictions when the last logged start is stale (>90 days)', () => {
    expect(predictCycle({ starts: ['2025-01-01'], userAverage: 28, today: '2026-04-01' })).toMatchObject({ ok: false, error: 'stale_data' });
    expect(predictCycle({ starts: ['2026-01-01'], userAverage: 28, today: '2026-04-01' })).toMatchObject({ ok: true }); // exactly 90 days
    expect(predictCycle({ starts: ['2025-12-31'], userAverage: 28, today: '2026-04-01' })).toMatchObject({ ok: false, error: 'stale_data' }); // 91 days
  });

  it('rejects an invalid "today"', () => {
    expect(predictCycle({ starts: REGULAR, today: 'bad' })).toEqual({ ok: false, error: 'invalid_today' });
  });
});
