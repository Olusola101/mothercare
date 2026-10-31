import { Link } from 'react-router-dom';
import { buttonClasses, Card } from '../../components/ui';

interface Props {
  title: string;
  phase: string;
  description: string;
}

/** Route placeholder for features scheduled for later phases. It makes no pretence of working. */
export function ComingSoonPage({ title, phase, description }: Props) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-plum-900">{title}</h1>
      <Card eyebrow={`Not built yet · ${phase}`} title="Coming later" tone="muted">
        <p className="text-sm text-ink">{description}</p>
        <Link to="/" className={buttonClasses('secondary', 'mt-4')}>
          Back to home
        </Link>
      </Card>
    </div>
  );
}
