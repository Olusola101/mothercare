import type { ReactNode } from 'react';
import { Card } from '../../components/ui';

/** Honest placeholder for features that are not built yet. Never shows fake data. */
export function ComingSoonCard({ title, phase, children }: { title: string; phase: string; children?: ReactNode }) {
  return (
    <Card title={title} eyebrow={`Not available yet · ${phase}`} tone="muted">
      <p className="text-sm text-ink-muted">{children ?? 'This feature has not been built yet.'}</p>
    </Card>
  );
}
