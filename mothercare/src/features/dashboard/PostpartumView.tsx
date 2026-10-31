import { Link } from 'react-router-dom';
import { buttonClasses, Card, ProgressRing } from '../../components/ui';
import { EmergencyBanner } from '../../components/EmergencyBanner';
import { computePostpartum, POSTPARTUM_STAGE_LABELS, type PostpartumError } from '../../domain/postpartum';
import type { HealthProfile } from '../../domain/types';
import { formatDisplayDate } from '../../lib/dates';
import { ComingSoonCard } from './ComingSoonCard';

const ERROR_TEXT: Record<PostpartumError, string> = {
  invalid_delivery_date: 'Add your baby’s date of birth in your profile to see your timeline for the first 12 weeks.',
  delivery_in_future: 'The date of birth saved on this device is in the future. Please review it in your profile.',
  invalid_today: 'We could not work out today’s date. Please check your time zone in your profile.',
};

export function PostpartumView({ profile, today }: { profile: HealthProfile; today: string }) {
  const result = computePostpartum(profile.deliveryDate, today);

  return (
    <div className="space-y-6">
      {!result.ok ? (
        <Card title="Your postpartum journey">
          <p className="text-sm text-ink">{ERROR_TEXT[result.error]}</p>
          <Link to="/profile" className={buttonClasses('secondary', 'mt-4')}>
            Update my details
          </Link>
        </Card>
      ) : (
        <Card eyebrow={POSTPARTUM_STAGE_LABELS[result.stage]} title="Your postpartum journey">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <ProgressRing
              value={Math.min(1, result.day / 84)}
              label={`Postpartum day ${result.day} of the first 84`}
            >
              <span className="text-2xl font-bold text-plum-900">Day {result.day}</span>
              <span className="text-xs text-ink-muted">Week {result.week}</span>
            </ProgressRing>
            <div className="space-y-2 text-sm">
              <p className="text-base">
                Baby was born on <strong>{profile.deliveryDate ? formatDisplayDate(profile.deliveryDate) : ''}</strong>.
              </p>
              {result.withinTwelveWeeks ? (
                <p className="text-ink-muted">
                  You are in the {POSTPARTUM_STAGE_LABELS[result.stage].toLowerCase()} stage. Every recovery is different,
                  so these stages are only a guide.
                </p>
              ) : (
                <p className="text-ink-muted">
                  You are past the first 12 weeks. Support for you and your baby is still worth asking about at
                  your next health visit.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <ComingSoonCard title="Recovery and wellbeing" phase="Phase 3">
          Guidance for your recovery will appear here once sourced content exists. Nothing is shown until then.
        </ComingSoonCard>
        <ComingSoonCard title="Newborn care" phase="Phase 3">
          Feeding, sleep, hygiene and health-visit information will appear here once sourced content exists.
        </ComingSoonCard>
        <ComingSoonCard title="Feeding and sleep logs" phase="Phase 3">
          Optional logs are not built yet.
        </ComingSoonCard>
        <ComingSoonCard title="Follow-up appointments" phase="Phase 4">
          Appointment reminders are not built yet.
        </ComingSoonCard>
      </div>

      <EmergencyBanner audience="postpartum" />
    </div>
  );
}
