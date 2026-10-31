import { describe, expect, it } from 'vitest';
import { buildProfile, type OnboardingForm } from '../../domain/onboarding';
import type { HealthProfile } from '../../domain/types';

const TODAY = '2026-04-23';
const NOW = '2026-04-23T10:00:00.000Z';

const base: OnboardingForm = {
  stage: 'pregnant',
  lmp: '',
  edd: '',
  eddSource: 'user',
  avgCycleLength: '',
  pregnancyWeeks: '',
  pregnancyDays: '',
  deliveryDate: '',
  timezone: 'Africa/Lagos',
  remindersEnabled: false,
  consentReproductive: true,
};

const form = (patch: Partial<OnboardingForm>): OnboardingForm => ({ ...base, ...patch });
const run = (patch: Partial<OnboardingForm>, existing: HealthProfile | null = null) =>
  buildProfile(form(patch), existing, TODAY, NOW);

function profile(patch: Partial<OnboardingForm>, existing: HealthProfile | null = null): HealthProfile {
  const r = run(patch, existing);
  if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r.errors)}`);
  return r.profile;
}

describe('buildProfile: required items only', () => {
  it('saves a pregnant profile with no dates (all optional)', () => {
    const p = profile({});
    expect(p).toMatchObject({ stage: 'pregnant', lmp: null, edd: null, reproductiveConsentAt: NOW });
  });

  it('requires a stage and explicit consent', () => {
    const r = run({ stage: '', consentReproductive: false });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.stage).toBeTruthy();
      expect(r.errors.consentReproductive).toBeTruthy();
    }
  });

  it('rejects an invalid time zone', () => {
    const r = run({ timezone: 'Mars/Base' });
    expect(r.ok).toBe(false);
  });
});

describe('buildProfile: pregnancy', () => {
  it('stores a valid LMP', () => {
    expect(profile({ lmp: '2026-01-01' })).toMatchObject({ lmp: '2026-01-01', lmpSource: 'lmp' });
  });

  it('derives an LMP from a reported week and marks its source', () => {
    expect(profile({ pregnancyWeeks: '12', pregnancyDays: '3' })).toMatchObject({ lmp: '2026-01-26', lmpSource: 'reported_week' });
  });

  it('prefers a typed LMP over a reported week', () => {
    expect(profile({ lmp: '2026-01-01', pregnancyWeeks: '5' })).toMatchObject({ lmp: '2026-01-01', lmpSource: 'lmp' });
  });

  it('stores a clinician EDD with its source', () => {
    expect(profile({ edd: '2026-10-08', eddSource: 'clinician' })).toMatchObject({ edd: '2026-10-08', eddSource: 'clinician' });
  });

  it('rejects invalid, future and implausible dates', () => {
    expect(run({ lmp: '2026-02-30' })).toMatchObject({ ok: false, errors: { lmp: expect.any(String) } });
    expect(run({ lmp: '2026-05-01' })).toMatchObject({ ok: false, errors: { lmp: expect.any(String) } });
    expect(run({ lmp: '2025-01-01' })).toMatchObject({ ok: false, errors: { lmp: expect.any(String) } }); // > 43 weeks
    expect(run({ edd: 'soon' })).toMatchObject({ ok: false, errors: { edd: expect.any(String) } });
    expect(run({ edd: '2027-06-01' })).toMatchObject({ ok: false, errors: { edd: expect.any(String) } });
  });

  it('rejects bad week and day numbers', () => {
    expect(run({ pregnancyWeeks: '43' })).toMatchObject({ ok: false, errors: { pregnancyWeeks: expect.any(String) } });
    expect(run({ pregnancyWeeks: '-1' })).toMatchObject({ ok: false, errors: { pregnancyWeeks: expect.any(String) } });
    expect(run({ pregnancyWeeks: '10.5' })).toMatchObject({ ok: false, errors: { pregnancyWeeks: expect.any(String) } });
    expect(run({ pregnancyWeeks: '10', pregnancyDays: '7' })).toMatchObject({ ok: false, errors: { pregnancyDays: expect.any(String) } });
  });
});

describe('buildProfile: cycle tracking and postpartum', () => {
  it('records the last period as a period start and the average length', () => {
    const p = profile({ stage: 'tracking', lmp: '2026-04-10', avgCycleLength: '29' });
    expect(p.periodStarts).toEqual(['2026-04-10']);
    expect(p.avgCycleLength).toBe(29);
  });

  it('rejects an out-of-range cycle length', () => {
    for (const bad of ['14', '91', 'abc', '28.5']) {
      expect(run({ stage: 'tracking', avgCycleLength: bad }), bad).toMatchObject({ ok: false, errors: { avgCycleLength: expect.any(String) } });
    }
  });

  it('accepts a delivery date and rejects a future one', () => {
    expect(profile({ stage: 'postpartum', deliveryDate: '2026-04-01' }).deliveryDate).toBe('2026-04-01');
    expect(run({ stage: 'postpartum', deliveryDate: '2026-05-01' })).toMatchObject({ ok: false, errors: { deliveryDate: expect.any(String) } });
  });
});

describe('buildProfile: switching stage keeps history', () => {
  it('keeps logged period starts when moving to pregnancy', () => {
    const tracking = profile({ stage: 'tracking', lmp: '2026-03-01' });
    const pregnant = profile({ stage: 'pregnant', lmp: '2026-03-01' }, tracking);
    expect(pregnant.periodStarts).toEqual(['2026-03-01']);
    expect(pregnant.stage).toBe('pregnant');
  });

  it('keeps the original consent timestamp', () => {
    const first = profile({});
    const r = buildProfile(form({ stage: 'postpartum' }), first, TODAY, '2026-05-01T00:00:00.000Z');
    expect(r.ok && r.profile.reproductiveConsentAt).toBe(NOW);
  });

  it('does not duplicate an existing period start', () => {
    const first = profile({ stage: 'tracking', lmp: '2026-04-10' });
    expect(profile({ stage: 'tracking', lmp: '2026-04-10' }, first).periodStarts).toEqual(['2026-04-10']);
  });
});
