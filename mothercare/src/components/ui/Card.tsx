import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  /** Small label above the title, e.g. "Estimate". */
  eyebrow?: string;
  icon?: ReactNode;
  tone?: 'default' | 'alert' | 'muted';
  className?: string;
  children: ReactNode;
}

const tones = {
  default: 'bg-white ring-lavender-100',
  alert: 'bg-blush-50 ring-blush-300',
  muted: 'bg-lavender-50 ring-lavender-100',
} as const;

export function Card({ title, eyebrow, icon, tone = 'default', className = '', children }: CardProps) {
  return (
    <section className={`rounded-3xl p-5 shadow-soft ring-1 ${tones[tone]} ${className}`}>
      {(title || eyebrow) && (
        <header className="mb-3 flex items-start gap-3">
          {icon && <span aria-hidden="true" className="mt-0.5 text-plum-700">{icon}</span>}
          <div>
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{eyebrow}</p>}
            {title && <h2 className="text-lg font-semibold text-plum-900">{title}</h2>}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}
