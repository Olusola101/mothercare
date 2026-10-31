import { Link } from 'react-router-dom';
import { Spinner } from '../../components/Spinner';
import { buttonClasses, Card } from '../../components/ui';
import { useProfile } from '../../stores/profile';
import { useSession } from '../../stores/session';
import { CycleView } from './CycleView';
import { PostpartumView } from './PostpartumView';
import { PregnancyView } from './PregnancyView';
import { useToday } from './useToday';

const STAGE_LABEL = {
  tracking: 'Tracking periods',
  ttc: 'Trying to conceive',
  pregnant: 'Pregnancy',
  postpartum: 'Postpartum',
} as const;

export function DashboardPage() {
  const user = useSession((s) => s.user);
  const { profile, loadedFor } = useProfile();
  const today = useToday(profile?.timezone);

  if (!user || loadedFor !== user.id) return <Spinner />;

  const name = user.displayName.trim();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-plum-900">{name ? `Hello, ${name}` : 'Hello'}</h1>
        {profile && <p className="text-ink-muted">{STAGE_LABEL[profile.stage]}</p>}
      </header>

      {!profile && (
        <Card title="Make this space yours" tone="muted">
          <p className="text-sm text-ink">
            If you would like, tell us where you are right now and we will show what is relevant. It is entirely
            optional, and you can do it whenever you like.
          </p>
          <Link to="/profile" className={buttonClasses('primary', 'mt-4')}>
            Set up my home screen
          </Link>
        </Card>
      )}

      {profile && (profile.stage === 'tracking' || profile.stage === 'ttc') && (
        <CycleView profile={profile} today={today} userId={user.id} />
      )}
      {profile?.stage === 'pregnant' && <PregnancyView profile={profile} today={today} userId={user.id} />}
      {profile?.stage === 'postpartum' && <PostpartumView profile={profile} today={today} />}
    </div>
  );
}
