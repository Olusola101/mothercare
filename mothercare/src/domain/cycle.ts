import { addDays, diffDays, parseISODate, toISODate, type ISODate } from '../lib/dates';

/** Cycle lengths outside this range are treated as data-entry gaps/errors and excluded from statistics. */
export const MIN_PLAUSIBLE_CYCLE = 15;
export const MAX_PLAUSIBLE_CYCLE = 90;
/** Cycles whose shortest-to-longest spread is within this many days are called "regular". */
export const REGULAR_RANGE_DAYS = 7;
/** How many of the most recent cycles feed the statistics. */
export const STATS_WINDOW = 6;
/** Typical luteal phase used for the fertile-window estimate. Real values vary between people and cycles. */
export const LUTEAL_PHASE_DAYS = 14;
/** If the last logged period start is older than this, predictions are withheld. */
export const STALE_AFTER_DAYS = 90;

export interface CycleStats {
  count: number;
  mean: number;
  min: number;
  max: number;
  range: number;
  stdDev: number;
}

export type Regularity = 'insufficient' | 'regular' | 'irregular';

export interface CycleAnalysis {
  /** Valid, de-duplicated period start dates, oldest first. */
  starts: ISODate[];
  invalidCount: number;
  /** Plausible cycle lengths between consecutive starts, oldest first (all of them). */
  lengths: number[];
  /** Gaps between starts that fell outside the plausible range. */
  excludedLengths: number[];
  /** Statistics over the most recent STATS_WINDOW plausible lengths, or null when there are none. */
  stats: CycleStats | null;
  /** "insufficient" until at least 3 cycle lengths exist. */
  regularity: Regularity;
}

export function analyzeCycles(rawStarts: readonly unknown[], window: number = STATS_WINDOW): CycleAnalysis {
  const days = new Set<number>();
  let invalidCount = 0;
  for (const raw of rawStarts) {
    const n = parseISODate(raw);
    if (n === null) invalidCount += 1;
    else days.add(n);
  }
  const sorted = [...days].sort((a, b) => a - b);

  const lengths: number[] = [];
  const excludedLengths: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const len = sorted[i] - sorted[i - 1];
    if (len >= MIN_PLAUSIBLE_CYCLE && len <= MAX_PLAUSIBLE_CYCLE) lengths.push(len);
    else excludedLengths.push(len);
  }

  const recent = lengths.slice(-window);
  let stats: CycleStats | null = null;
  if (recent.length > 0) {
    const mean = recent.reduce((s, v) => s + v, 0) / recent.length;
    const min = Math.min(...recent);
    const max = Math.max(...recent);
    const variance =
      recent.length > 1 ? recent.reduce((s, v) => s + (v - mean) ** 2, 0) / (recent.length - 1) : 0;
    stats = { count: recent.length, mean, min, max, range: max - min, stdDev: Math.sqrt(variance) };
  }

  let regularity: Regularity = 'insufficient';
  if (stats && stats.count >= 3) regularity = stats.range <= REGULAR_RANGE_DAYS ? 'regular' : 'irregular';

  return { starts: sorted.map(toISODate), invalidCount, lengths, excludedLengths, stats, regularity };
}

export interface CycleInput {
  starts: readonly unknown[];
  /** The user's own reported average cycle length (optional). */
  userAverage?: number | null;
  today: string;
}

export type CyclePredictionError = 'invalid_today' | 'no_period_data' | 'stale_data' | 'insufficient_data';
export type LengthSource = 'history' | 'history_limited' | 'user_average';

export interface DateRange {
  start: ISODate;
  end: ISODate;
}

export interface CyclePrediction {
  ok: true;
  lastStart: ISODate;
  /** The first day of the period is cycle day 1. */
  cycleDay: number;
  cycleLengthUsed: number;
  lengthSource: LengthSource;
  /** Never "high": cycle predictions are estimates. */
  confidence: 'moderate' | 'low';
  regularity: Regularity;
  nextPeriod: { expected: ISODate; earliest: ISODate; latest: ISODate };
  /** Negative when the expected date has passed. */
  daysUntilNextPeriod: number;
  daysPastExpected: number;
  fertileWindow: DateRange | null;
  fertileWindowUnavailableReason: 'irregular_cycles' | null;
  ignoredFutureStarts: number;
  analysis: CycleAnalysis;
}
export type CyclePredictionResult = CyclePrediction | { ok: false; error: CyclePredictionError; analysis?: CycleAnalysis };

function isUsableAverage(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= MIN_PLAUSIBLE_CYCLE && v <= MAX_PLAUSIBLE_CYCLE;
}

/**
 * Estimates the next period and a fertile window. Output is a range, not a certainty,
 * and must not be used as contraception.
 */
export function predictCycle(input: CycleInput): CyclePredictionResult {
  const todayN = parseISODate(input.today);
  if (todayN === null) return { ok: false, error: 'invalid_today' };

  const all = analyzeCycles(input.starts);
  const usable = all.starts.filter((d) => (parseISODate(d) as number) <= todayN);
  const ignoredFutureStarts = all.starts.length - usable.length;
  if (usable.length === 0) return { ok: false, error: 'no_period_data', analysis: all };

  const analysis = analyzeCycles(usable);
  const lastStart = usable[usable.length - 1];
  const daysSince = diffDays(lastStart, input.today) as number;
  if (daysSince > STALE_AFTER_DAYS) return { ok: false, error: 'stale_data', analysis };

  const stats = analysis.stats;
  let length: number;
  let lengthSource: LengthSource;
  let confidence: 'moderate' | 'low';
  if (stats && stats.count >= 3) {
    length = Math.round(stats.mean);
    lengthSource = 'history';
    confidence = analysis.regularity === 'regular' ? 'moderate' : 'low';
  } else if (isUsableAverage(input.userAverage)) {
    length = Math.round(input.userAverage);
    lengthSource = 'user_average';
    confidence = 'low';
  } else if (stats && stats.count >= 1) {
    length = Math.round(stats.mean);
    lengthSource = 'history_limited';
    confidence = 'low';
  } else {
    return { ok: false, error: 'insufficient_data', analysis };
  }

  const halfWidth =
    stats && stats.count >= 3 ? Math.min(14, Math.max(2, Math.ceil(stats.range / 2))) : 4;
  const expected = addDays(lastStart, length);

  let fertileWindow: DateRange | null = null;
  let reason: 'irregular_cycles' | null = null;
  if (analysis.regularity === 'irregular') {
    reason = 'irregular_cycles';
  } else {
    const ovulation = addDays(expected, -LUTEAL_PHASE_DAYS);
    const start = addDays(ovulation, -5);
    fertileWindow = { start: start < lastStart ? lastStart : start, end: addDays(ovulation, 1) };
  }

  const daysUntil = diffDays(input.today, expected) as number;
  return {
    ok: true,
    lastStart,
    cycleDay: daysSince + 1,
    cycleLengthUsed: length,
    lengthSource,
    confidence,
    regularity: analysis.regularity,
    nextPeriod: { expected, earliest: addDays(expected, -halfWidth), latest: addDays(expected, halfWidth) },
    daysUntilNextPeriod: daysUntil,
    daysPastExpected: Math.max(0, -daysUntil),
    fertileWindow,
    fertileWindowUnavailableReason: reason,
    ignoredFutureStarts,
    analysis,
  };
}
