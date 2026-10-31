import type { ISODate } from '../lib/dates';

export type Stage = 'tracking' | 'ttc' | 'pregnant' | 'postpartum';
export type EddSource = 'clinician' | 'user';
export type LmpSource = 'lmp' | 'reported_week';

/**
 * Optional reproductive-health profile. Every field except stage, timezone and
 * consent is optional; users may skip onboarding entirely.
 */
export interface HealthProfile {
  stage: Stage;
  /** Pregnancy last menstrual period (or a date derived from a reported week). */
  lmp: ISODate | null;
  lmpSource: LmpSource;
  edd: ISODate | null;
  eddSource: EddSource;
  avgCycleLength: number | null;
  /** First day of each logged period. Kept when the stage changes. */
  periodStarts: ISODate[];
  deliveryDate: ISODate | null;
  timezone: string;
  remindersEnabled: boolean;
  /** ISO timestamp of explicit consent to record reproductive health data. */
  reproductiveConsentAt: string;
}
