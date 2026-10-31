import { computePregnancy, lmpFromReportedWeeks, MAX_PLAUSIBLE_DAYS } from './pregnancy';
import { MAX_PLAUSIBLE_CYCLE, MIN_PLAUSIBLE_CYCLE } from './cycle';
import type { EddSource, HealthProfile, Stage } from './types';
import { diffDays, isBlank, isValidISODate, isValidTimeZone } from '../lib/dates';

/** Raw form values (all strings, as typed by the user). Every field is optional except stage/consent. */
export interface OnboardingForm {
  stage: Stage | '';
  lmp: string;
  edd: string;
  eddSource: EddSource;
  avgCycleLength: string;
  pregnancyWeeks: string;
  pregnancyDays: string;
  deliveryDate: string;
  timezone: string;
  remindersEnabled: boolean;
  consentReproductive: boolean;
}

export type OnboardingErrors = Partial<Record<keyof OnboardingForm, string>>;
export type OnboardingResult =
  | { ok: true; profile: HealthProfile }
  | { ok: false; errors: OnboardingErrors };

export const STAGES: readonly Stage[] = ['tracking', 'ttc', 'pregnant', 'postpartum'];

function parseWholeNumber(text: string): number | null {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  return Number(t);
}

/**
 * Validates onboarding input and merges it into any existing profile so that history
 * (e.g. logged period starts) is kept when the user switches stage.
 * `now` is an ISO timestamp used for the consent record.
 */
export function buildProfile(
  form: OnboardingForm,
  existing: HealthProfile | null,
  today: string,
  now: string,
): OnboardingResult {
  const errors: OnboardingErrors = {};

  if (form.stage === '' || !STAGES.includes(form.stage)) errors.stage = 'Please choose where you are right now.';
  if (!form.consentReproductive) {
    errors.consentReproductive = 'Please confirm that you agree to us recording this information.';
  }
  if (!isValidTimeZone(form.timezone)) errors.timezone = 'Please choose a valid time zone.';

  let avg: number | null = existing?.avgCycleLength ?? null;
  if (!isBlank(form.avgCycleLength)) {
    const n = parseWholeNumber(form.avgCycleLength);
    if (n === null || n < MIN_PLAUSIBLE_CYCLE || n > MAX_PLAUSIBLE_CYCLE) {
      errors.avgCycleLength = `Enter a whole number of days between ${MIN_PLAUSIBLE_CYCLE} and ${MAX_PLAUSIBLE_CYCLE}.`;
    } else avg = n;
  }

  const stage = form.stage;
  let lmp = existing?.lmp ?? null;
  let lmpSource = existing?.lmpSource ?? 'lmp';
  let edd = existing?.edd ?? null;
  let eddSource = existing?.eddSource ?? 'user';
  let deliveryDate = existing?.deliveryDate ?? null;
  const periodStarts = [...(existing?.periodStarts ?? [])];

  if (stage === 'tracking' || stage === 'ttc') {
    if (!isBlank(form.lmp)) {
      const d = form.lmp.trim();
      const diff = diffDays(d, today);
      if (!isValidISODate(d)) errors.lmp = 'Enter a valid date.';
      else if (diff === null || diff < 0) errors.lmp = 'This date is in the future.';
      else if (!periodStarts.includes(d)) periodStarts.push(d);
    }
  }

  if (stage === 'pregnant') {
    const hasLmp = !isBlank(form.lmp);
    const hasEdd = !isBlank(form.edd);
    const hasWeeks = !isBlank(form.pregnancyWeeks);
    let candidateLmp: string | null = null;
    let candidateSource: 'lmp' | 'reported_week' = 'lmp';

    if (hasLmp) {
      candidateLmp = form.lmp.trim();
    } else if (hasWeeks) {
      const weeks = parseWholeNumber(form.pregnancyWeeks);
      const days = isBlank(form.pregnancyDays) ? 0 : parseWholeNumber(form.pregnancyDays);
      if (weeks === null || weeks > 42) errors.pregnancyWeeks = 'Enter whole weeks between 0 and 42.';
      else if (days === null || days > 6) errors.pregnancyDays = 'Enter days between 0 and 6.';
      else {
        candidateLmp = lmpFromReportedWeeks(weeks, days, today);
        candidateSource = 'reported_week';
      }
    }

    const candidateEdd = hasEdd ? form.edd.trim() : null;
    if (candidateLmp || candidateEdd) {
      const result = computePregnancy({
        lmp: candidateLmp,
        lmpSource: candidateSource,
        edd: candidateEdd,
        eddSource: form.eddSource,
        today,
      });
      if (!result.ok) {
        if (result.error === 'invalid_lmp') errors.lmp = 'Enter a valid date.';
        else if (result.error === 'lmp_in_future') errors.lmp = 'This date is in the future.';
        else if (result.error === 'invalid_edd') errors.edd = 'Enter a valid date.';
        else if (result.error === 'edd_too_far') errors.edd = 'This due date is more than 40 weeks away.';
      } else if (result.gestationalDays > MAX_PLAUSIBLE_DAYS) {
        const field = hasLmp || hasWeeks ? 'lmp' : 'edd';
        errors[field] = 'These dates suggest more than 43 weeks. Please check them.';
      } else {
        lmp = candidateLmp;
        lmpSource = candidateSource;
        edd = candidateEdd;
        eddSource = form.eddSource;
      }
    }
  }

  if (stage === 'postpartum' && !isBlank(form.deliveryDate)) {
    const d = form.deliveryDate.trim();
    const diff = diffDays(d, today);
    if (!isValidISODate(d)) errors.deliveryDate = 'Enter a valid date.';
    else if (diff === null || diff < 0) errors.deliveryDate = 'The delivery date cannot be in the future.';
    else deliveryDate = d;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  periodStarts.sort();
  return {
    ok: true,
    profile: {
      stage: stage as Stage,
      lmp,
      lmpSource,
      edd,
      eddSource,
      avgCycleLength: avg,
      periodStarts,
      deliveryDate,
      timezone: form.timezone,
      remindersEnabled: form.remindersEnabled,
      reproductiveConsentAt: existing?.reproductiveConsentAt ?? now,
    },
  };
}
