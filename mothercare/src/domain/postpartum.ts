import { parseISODate, type ISODate } from '../lib/dates';

export type PostpartumStage = 'days_1_7' | 'weeks_2_4' | 'weeks_5_8' | 'weeks_9_12' | 'beyond_12_weeks';
export type PostpartumError = 'invalid_today' | 'invalid_delivery_date' | 'delivery_in_future';

export interface PostpartumOk {
  ok: true;
  /** Delivery day is postpartum day 1. */
  day: number;
  /** Postpartum week, 1-based (days 1-7 = week 1). */
  week: number;
  stage: PostpartumStage;
  withinTwelveWeeks: boolean;
}
export type PostpartumResult = PostpartumOk | { ok: false; error: PostpartumError };

export const POSTPARTUM_STAGE_LABELS: Record<PostpartumStage, string> = {
  days_1_7: 'Days 1–7',
  weeks_2_4: 'Weeks 2–4',
  weeks_5_8: 'Weeks 5–8',
  weeks_9_12: 'Weeks 9–12',
  beyond_12_weeks: 'Beyond 12 weeks',
};

export function postpartumStageOf(day: number): PostpartumStage {
  if (day <= 7) return 'days_1_7';
  if (day <= 28) return 'weeks_2_4';
  if (day <= 56) return 'weeks_5_8';
  if (day <= 84) return 'weeks_9_12';
  return 'beyond_12_weeks';
}

export function computePostpartum(deliveryDate: ISODate | null | undefined, today: string): PostpartumResult {
  const todayN = parseISODate(today);
  if (todayN === null) return { ok: false, error: 'invalid_today' };
  const deliveryN = parseISODate(deliveryDate);
  if (deliveryN === null) return { ok: false, error: 'invalid_delivery_date' };
  if (deliveryN > todayN) return { ok: false, error: 'delivery_in_future' };
  const day = todayN - deliveryN + 1;
  const stage = postpartumStageOf(day);
  return {
    ok: true,
    day,
    week: Math.floor((day - 1) / 7) + 1,
    stage,
    withinTwelveWeeks: stage !== 'beyond_12_weeks',
  };
}
