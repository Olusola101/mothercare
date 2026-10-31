import { isValidISODate, isValidTimeZone } from './dates';
import { readJSON, STORAGE_PREFIX, writeJSON } from './storage';
import { STAGES } from '../domain/onboarding';
import type { HealthProfile } from '../domain/types';

/**
 * PHASE 2 LIMITATION: reproductive-health data is kept only on this device (localStorage,
 * unencrypted) and is keyed by user id. Server-side storage with Row Level Security arrives in Phase 3.
 */
const key = (userId: string) => `${STORAGE_PREFIX}profile.${userId}`;

const orNull = (v: unknown): string | null => (isValidISODate(v) ? v : null);

/** Defensive parse of stored data. Returns null when it is malformed or consent is missing. */
export function sanitizeProfile(raw: unknown): HealthProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.stage !== 'string' || !(STAGES as readonly string[]).includes(r.stage)) return null;
  if (typeof r.reproductiveConsentAt !== 'string' || r.reproductiveConsentAt === '') return null;
  const starts = Array.isArray(r.periodStarts) ? r.periodStarts.filter(isValidISODate) : [];
  const avg = typeof r.avgCycleLength === 'number' && Number.isInteger(r.avgCycleLength) ? r.avgCycleLength : null;
  return {
    stage: r.stage as HealthProfile['stage'],
    lmp: orNull(r.lmp),
    lmpSource: r.lmpSource === 'reported_week' ? 'reported_week' : 'lmp',
    edd: orNull(r.edd),
    eddSource: r.eddSource === 'clinician' ? 'clinician' : 'user',
    avgCycleLength: avg,
    periodStarts: [...new Set(starts)].sort(),
    deliveryDate: orNull(r.deliveryDate),
    timezone: isValidTimeZone(r.timezone) ? r.timezone : 'UTC',
    remindersEnabled: r.remindersEnabled === true,
    reproductiveConsentAt: r.reproductiveConsentAt,
  };
}

export function loadProfile(userId: string): HealthProfile | null {
  return sanitizeProfile(readJSON('local', key(userId)));
}

export function saveProfile(userId: string, profile: HealthProfile): boolean {
  return writeJSON('local', key(userId), profile);
}
