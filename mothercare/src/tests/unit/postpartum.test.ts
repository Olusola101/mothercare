import { describe, expect, it } from 'vitest';
import { addDays } from '../../lib/dates';
import { computePostpartum } from '../../domain/postpartum';

const D = '2026-03-01';
const at = (offset: number) => computePostpartum(D, addDays(D, offset));

describe('computePostpartum stage boundaries', () => {
  it('treats the delivery day as day 1 of days 1-7', () => {
    expect(at(0)).toMatchObject({ ok: true, day: 1, week: 1, stage: 'days_1_7' });
    expect(at(6)).toMatchObject({ day: 7, week: 1, stage: 'days_1_7' });
  });

  it('moves to weeks 2-4 on day 8 and stays through day 28', () => {
    expect(at(7)).toMatchObject({ day: 8, week: 2, stage: 'weeks_2_4' });
    expect(at(27)).toMatchObject({ day: 28, week: 4, stage: 'weeks_2_4' });
  });

  it('moves to weeks 5-8 on day 29 and stays through day 56', () => {
    expect(at(28)).toMatchObject({ day: 29, week: 5, stage: 'weeks_5_8' });
    expect(at(55)).toMatchObject({ day: 56, week: 8, stage: 'weeks_5_8' });
  });

  it('moves to weeks 9-12 on day 57 and stays through day 84', () => {
    expect(at(56)).toMatchObject({ day: 57, week: 9, stage: 'weeks_9_12', withinTwelveWeeks: true });
    expect(at(83)).toMatchObject({ day: 84, week: 12, stage: 'weeks_9_12', withinTwelveWeeks: true });
  });

  it('flags days beyond the first 12 weeks', () => {
    expect(at(84)).toMatchObject({ day: 85, stage: 'beyond_12_weeks', withinTwelveWeeks: false });
  });
});

describe('computePostpartum invalid input', () => {
  it('rejects a future delivery date', () => {
    expect(computePostpartum(addDays(D, 1), D)).toEqual({ ok: false, error: 'delivery_in_future' });
  });

  it('rejects missing or invalid dates', () => {
    expect(computePostpartum(null, D)).toEqual({ ok: false, error: 'invalid_delivery_date' });
    expect(computePostpartum(undefined, D)).toEqual({ ok: false, error: 'invalid_delivery_date' });
    expect(computePostpartum('2026-02-30', D)).toEqual({ ok: false, error: 'invalid_delivery_date' });
    expect(computePostpartum(D, 'bad')).toEqual({ ok: false, error: 'invalid_today' });
  });
});
