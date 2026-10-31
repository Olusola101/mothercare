import { Link } from 'react-router-dom';
import { Alert, buttonClasses, Card, ProgressRing } from '../../components/ui';
import { EmergencyBanner } from '../../components/EmergencyBanner';
import { computePregnancy, type PregnancyBasis, type PregnancyError } from '../../domain/pregnancy';
import type { HealthProfile } from '../../domain/types';
import { formatDisplayDate } from '../../lib/dates';
import { ComingSoonCard } from './ComingSoonCard';
import { WellnessChecklist } from './WellnessChecklist';

const BASIS_TEXT: Record<PregnancyBasis, string> = {
  lmp: 'Calculated from the first day of your last period.',
  reported_week: 'Calculated from the week you told us, so it is approximate.',
  edd_clinician: 'Based on the due date confirmed by your healthcare professional.',
  edd_user: 'Based on the due date you entered. We could not check it against a last period date.',
};

const ERROR_TEXT: Record<PregnancyError, string> = {
  no_dates: 'Add the first day of your last period, your due date or how many weeks you are to see your progress.',
  invalid_lmp: 'The last period date saved on this device is not a valid date. Please review it in your profile.',
  invalid_edd: 'The due date saved on this device is not a valid date. Please review it in your profile.',
  lmp_in_future: 'The last period date is in the future. Please review it in your profile.',
  edd_too_far: 'The due date is more than 40 weeks away. Please review it in your profile.',
  invalid_today: 'We could not work out today’s date. Please check your time zone in your profile.',
};

const TRIMESTER = { 1: 'First trimester', 2: 'Second trimester', 3: 'Third trimester' } as const;

export function PregnancyView({ profile, today, userId }: { profile: HealthProfile; today: string; userId: string }) {
  const result = computePregnancy({
    lmp: profile.lmp,
    lmpSource: profile.lmpSource,
    edd: profile.edd,
    eddSource: profile.eddSource,
    today,
  });

  return (
    <div className="space-y-6">
      {!result.ok ? (
        <Card title="Your pregnancy">
          <p className="text-sm text-ink">{ERROR_TEXT[result.error]}</p>
          <Link to="/profile" className={buttonClasses('secondary', 'mt-4')}>
            Update my dates
          </Link>
        </Card>
      ) : (
        <Card eyebrow={TRIMESTER[result.trimester]} title="Your pregnancy">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <ProgressRing
              value={result.progress}
              label={`Pregnancy progress: ${Math.round(result.progress * 100)} percent of 40 weeks`}
            >
              <span className="text-2xl font-bold text-plum-900">{result.weeks}w {result.days}d</span>
              <span className="text-xs text-ink-muted">estimated</span>
            </ProgressRing>
            <div className="space-y-2 text-sm">
              <p className="text-base text-ink">
                About <strong>{result.weeks} weeks and {result.days} {result.days === 1 ? 'day' : 'days'}</strong>.
              </p>
              <p>
                Estimated due date: <strong>{formatDisplayDate(result.edd)}</strong>
                {result.phase === 'ongoing' && result.daysUntilEdd > 0 && (
                  <span className="text-ink-muted"> · about {result.daysUntilEdd} days to go</span>
                )}
                {result.phase === 'ongoing' && result.daysUntilEdd === 0 && (
                  <span className="text-ink-muted"> · that is today</span>
                )}
              </p>
              <p className="text-ink-muted">{BASIS_TEXT[result.basis]} Only a healthcare professional can confirm your dates.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {result.discrepancyDays !== null && result.discrepancyDays > 7 && (
              <Alert tone="info">
                Your last period date and your due date are {result.discrepancyDays} days apart. Your healthcare
                professional can tell you which is the better estimate.
              </Alert>
            )}
            {result.phase === 'past_edd' && (
              <Alert tone="info">
                You are past your estimated due date. Please contact your midwife, doctor or maternity service about
                what happens next.
              </Alert>
            )}
            {result.phase === 'implausible' && (
              <Alert tone="warning">
                These dates suggest more than 43 weeks, which is unusual. Please check your dates in your profile, or
                switch to postpartum if your baby has arrived.
              </Alert>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <WellnessChecklist userId={userId} today={today} />
        <ComingSoonCard title="This week’s development" phase="Phase 3">
          Week-by-week information will appear here only with its sources and honest review status. Nothing is shown
          until that content exists.
        </ComingSoonCard>
        <ComingSoonCard title="Appointments" phase="Phase 4">
          Booking and reminders for appointments are not built yet.
        </ComingSoonCard>
        <ComingSoonCard title="Medication reminders" phase="Phase 4">
          Reminders are not built yet. Always follow the advice of your healthcare professional about medicines.
        </ComingSoonCard>
        <ComingSoonCard title="Weekly journal" phase="Phase 3">
          Your private pregnancy journal is not built yet.
        </ComingSoonCard>
      </div>

      <EmergencyBanner audience="pregnancy" />
    </div>
  );
}
