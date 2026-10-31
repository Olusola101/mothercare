import { addDays, diffDays, isBlank, isValidISODate, parseISODate, toISODate, type ISODate } from '../lib/dates';
import type { EddSource, LmpSource } from './types';

/** Gestational age is counted from the first day of the last menstrual period. */
export const FULL_TERM_DAYS = 280; // 40w0d
/** Beyond 43w0d the dates are treated as implausible and the user is asked to check them. */
export const MAX_PLAUSIBLE_DAYS = 301;

export interface PregnancyInput {
  lmp?: string | null;
  lmpSource?: LmpSource;
  edd?: string | null;
  eddSource?: EddSource;
  /** Today's calendar date in the user's time zone. */
  today: string;
}

export type PregnancyError =
  | 'invalid_today'
  | 'no_dates'
  | 'invalid_lmp'
  | 'invalid_edd'
  | 'lmp_in_future'
  | 'edd_too_far';

export type PregnancyBasis = 'lmp' | 'reported_week' | 'edd_clinician' | 'edd_user';
export type PregnancyPhase = 'ongoing' | 'past_edd' | 'implausible';

export interface PregnancyOk {
  ok: true;
  basis: PregnancyBasis;
  lmp: ISODate;
  edd: ISODate;
  gestationalDays: number;
  weeks: number;
  days: number;
  trimester: 1 | 2 | 3;
  /** Negative once the estimated due date has passed. */
  daysUntilEdd: number;
  /** 0..1, capped at 1. */
  progress: number;
  phase: PregnancyPhase;
  /** Gap between the two estimates when both an LMP and an EDD were supplied. */
  discrepancyDays: number | null;
}
export type PregnancyResult = PregnancyOk | { ok: false; error: PregnancyError };

export function trimesterOf(gestationalDays: number): 1 | 2 | 3 {
  const weeks = Math.floor(gestationalDays / 7);
  if (weeks < 14) return 1;
  if (weeks < 28) return 2;
  return 3;
}

/**
 * Which date wins:
 *  - a clinician-confirmed EDD overrides an LMP;
 *  - otherwise an LMP (or a date derived from a reported week) wins;
 *  - a user-entered EDD is used only when nothing better exists.
 */
export function computePregnancy(input: PregnancyInput): PregnancyResult {
  const todayN = parseISODate(input.today);
  if (todayN === null) return { ok: false, error: 'invalid_today' };

  const hasLmp = !isBlank(input.lmp);
  const hasEdd = !isBlank(input.edd);
  if (!hasLmp && !hasEdd) return { ok: false, error: 'no_dates' };
  if (hasLmp && !isValidISODate(input.lmp)) return { ok: false, error: 'invalid_lmp' };
  if (hasEdd && !isValidISODate(input.edd)) return { ok: false, error: 'invalid_edd' };

  const lmpGiven = hasLmp ? (input.lmp as ISODate) : null;
  const eddGiven = hasEdd ? (input.edd as ISODate) : null;
  const eddSource: EddSource = input.eddSource ?? 'user';
  const lmpSource: LmpSource = input.lmpSource ?? 'lmp';

  let basis: PregnancyBasis;
  let lmp: ISODate;
  let edd: ISODate;
  if (eddGiven && (eddSource === 'clinician' || !lmpGiven)) {
    basis = eddSource === 'clinician' ? 'edd_clinician' : 'edd_user';
    edd = eddGiven;
    lmp = addDays(eddGiven, -FULL_TERM_DAYS);
  } else {
    basis = lmpSource === 'reported_week' ? 'reported_week' : 'lmp';
    lmp = lmpGiven as ISODate;
    edd = addDays(lmp, FULL_TERM_DAYS);
  }

  const gestationalDays = todayN - (parseISODate(lmp) as number);
  if (gestationalDays < 0) {
    return { ok: false, error: basis.startsWith('edd') ? 'edd_too_far' : 'lmp_in_future' };
  }

  let discrepancyDays: number | null = null;
  if (lmpGiven && eddGiven) {
    const derived = addDays(lmpGiven, FULL_TERM_DAYS);
    discrepancyDays = Math.abs(diffDays(derived, eddGiven) as number);
  }

  const phase: PregnancyPhase =
    gestationalDays > MAX_PLAUSIBLE_DAYS ? 'implausible' : gestationalDays > FULL_TERM_DAYS ? 'past_edd' : 'ongoing';

  return {
    ok: true,
    basis,
    lmp,
    edd,
    gestationalDays,
    weeks: Math.floor(gestationalDays / 7),
    days: gestationalDays % 7,
    trimester: trimesterOf(gestationalDays),
    daysUntilEdd: (parseISODate(edd) as number) - todayN,
    progress: Math.min(1, gestationalDays / FULL_TERM_DAYS),
    phase,
    discrepancyDays,
  };
}

/**
 * Converts "I am X weeks (and Y days) pregnant" into an approximate LMP date.
 * Returns null for non-integer or out-of-range input (weeks 0-42, days 0-6).
 */
export function lmpFromReportedWeeks(weeks: number, days: number, today: string): ISODate | null {
  const todayN = parseISODate(today);
  if (todayN === null) return null;
  if (!Number.isInteger(weeks) || weeks < 0 || weeks > 42) return null;
  if (!Number.isInteger(days) || days < 0 || days > 6) return null;
  return toISODate(todayN - (weeks * 7 + days));
}
