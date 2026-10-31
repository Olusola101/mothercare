import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, buttonClasses, Card, TextField } from '../../components/ui';
import { analyzeCycles, predictCycle, type CyclePredictionError } from '../../domain/cycle';
import type { HealthProfile } from '../../domain/types';
import { diffDays, formatDisplayDate, isValidISODate } from '../../lib/dates';
import { useProfile } from '../../stores/profile';
import { ComingSoonCard } from './ComingSoonCard';

const ERROR_TEXT: Record<CyclePredictionError, string> = {
  no_period_data: 'Log the first day of your most recent period to see estimates.',
  insufficient_data:
    'With only one period logged we cannot estimate a cycle length. Log another period, or add your usual cycle length in your profile.',
  stale_data: 'Your last logged period was more than 90 days ago, so estimates are paused. Log your most recent period to restore them.',
  invalid_today: 'We could not work out today’s date. Please check your time zone in your profile.',
};

function LogPeriodForm({ profile, userId, today }: { profile: HealthProfile; userId: string; today: string }) {
  const save = useProfile((s) => s.save);
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidISODate(date)) return setError('Enter a valid date.');
    const d = diffDays(date, today);
    if (d === null || d < 0) return setError('A period start cannot be in the future.');
    if (profile.periodStarts.includes(date)) return setError('That date is already logged.');
    const next = { ...profile, periodStarts: [...profile.periodStarts, date].sort() };
    if (!save(userId, next)) return setError('Your browser would not let us save this on your device.');
    setError(null);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-end gap-3">
      <TextField
        className="min-w-44 flex-1"
        label="First day of a period"
        type="date"
        value={date}
        max={today}
        onChange={(e) => setDate(e.target.value)}
        error={error ?? undefined}
      />
      <Button type="submit">Log period start</Button>
    </form>
  );
}

export function CycleView({ profile, today, userId }: { profile: HealthProfile; today: string; userId: string }) {
  const save = useProfile((s) => s.save);
  const prediction = predictCycle({ starts: profile.periodStarts, userAverage: profile.avgCycleLength, today });
  const analysis = analyzeCycles(profile.periodStarts);
  const history = [...analysis.starts].reverse().slice(0, 8);

  function remove(date: string) {
    save(userId, { ...profile, periodStarts: profile.periodStarts.filter((d) => d !== date) });
  }

  return (
    <div className="space-y-6">
      {!prediction.ok ? (
        <Card title="Your cycle">
          <p className="text-sm text-ink">{ERROR_TEXT[prediction.error]}</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card eyebrow="Today" title={`Cycle day ${prediction.cycleDay}`}>
            <p className="text-sm text-ink-muted">Counted from your period that began on {formatDisplayDate(prediction.lastStart)}.</p>
          </Card>

          <Card eyebrow={`Estimate · ${prediction.confidence} confidence`} title="Next period">
            <p className="text-lg font-semibold text-plum-900">
              Around {formatDisplayDate(prediction.nextPeriod.expected)}
            </p>
            <p className="text-sm text-ink-muted">
              Most likely between {formatDisplayDate(prediction.nextPeriod.earliest)} and{' '}
              {formatDisplayDate(prediction.nextPeriod.latest)}.
            </p>
            <p className="mt-2 text-sm">
              {prediction.daysUntilNextPeriod > 0 && <>About {prediction.daysUntilNextPeriod} days from now.</>}
              {prediction.daysUntilNextPeriod === 0 && <>The estimate is for today.</>}
              {prediction.daysPastExpected > 0 && (
                <>
                  Your period is {prediction.daysPastExpected} {prediction.daysPastExpected === 1 ? 'day' : 'days'} later
                  than the estimate. Cycles often vary. If you are worried, or think you may be pregnant, speak to a
                  healthcare professional.
                </>
              )}
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              {prediction.lengthSource === 'history' && `Based on your last ${prediction.analysis.stats?.count ?? 0} cycles.`}
              {prediction.lengthSource === 'history_limited' && 'Based on very few logged cycles, so this is rough.'}
              {prediction.lengthSource === 'user_average' && 'Based on the cycle length you told us, not your own history yet.'}
            </p>
          </Card>

          <Card eyebrow="Estimate" title="Fertile window">
            {prediction.fertileWindow ? (
              <>
                <p className="text-lg font-semibold text-plum-900">
                  {formatDisplayDate(prediction.fertileWindow.start)} – {formatDisplayDate(prediction.fertileWindow.end)}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  This is an estimate worked out from your expected next period. Ovulation can vary from cycle to cycle,
                  so it may not match what actually happens.
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-muted">
                Your cycle lengths have varied by more than a week, so we cannot give a reliable fertile window.
              </p>
            )}
            <p className="mt-2 text-xs font-medium text-blush-700">
              Do not use these dates as contraception.
            </p>
          </Card>

          <Card eyebrow="Your history" title="Cycle pattern">
            {analysis.stats ? (
              <p className="text-sm">
                Average {Math.round(analysis.stats.mean)} days, ranging from {analysis.stats.min} to {analysis.stats.max} (
                {analysis.stats.count} recent {analysis.stats.count === 1 ? 'cycle' : 'cycles'}).
              </p>
            ) : (
              <p className="text-sm text-ink-muted">Not enough logged cycles yet.</p>
            )}
            <p className="mt-1 text-sm text-ink-muted">
              {analysis.regularity === 'insufficient' && 'We need at least three cycles before describing how regular they are.'}
              {analysis.regularity === 'regular' && 'Your recent cycles have been similar in length.'}
              {analysis.regularity === 'irregular' && 'Your recent cycles have varied quite a bit, which is common. Estimates are less certain.'}
            </p>
          </Card>
        </div>
      )}

      {prediction.ok && prediction.ignoredFutureStarts > 0 && (
        <Alert tone="warning">Some logged dates are in the future and were ignored. You can remove them below.</Alert>
      )}

      <Card title="Log a period">
        <LogPeriodForm profile={profile} userId={userId} today={today} />
      </Card>

      <Card title="Logged periods">
        {history.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing logged yet.</p>
        ) : (
          <ul className="divide-y divide-lavender-100">
            {history.map((start, i) => {
              const index = analysis.starts.length - 1 - i;
              const next = analysis.starts[index + 1];
              const length = next ? diffDays(start, next) : null;
              return (
                <li key={start} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    <strong>{formatDisplayDate(start)}</strong>
                    <span className="text-ink-muted">
                      {length !== null ? ` · ${length}-day cycle` : ' · latest'}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => remove(start)}
                    aria-label={`Remove period start ${formatDisplayDate(start)}`}
                  >
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-xs text-ink-muted">Made a mistake? Remove the entry and log the right date.</p>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <ComingSoonCard title="Symptoms and mood" phase="Phase 3">
          Tracking for cramps, symptoms and mood is not built yet.
        </ComingSoonCard>
        <ComingSoonCard title="Period calendar" phase="Phase 3">
          A calendar view is not built yet.
        </ComingSoonCard>
      </div>

      <p className="text-sm text-ink-muted">
        Want to track a pregnancy or postpartum instead? Your logged periods are kept.{' '}
        <Link to="/profile" className={buttonClasses('ghost', 'min-h-0 px-2 py-1')}>
          Change where I am
        </Link>
      </p>
    </div>
  );
}
