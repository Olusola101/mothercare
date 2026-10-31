import type { ReactNode } from 'react';

type Tone = 'info' | 'success' | 'warning' | 'error';

const tones: Record<Tone, string> = {
  info: 'bg-lavender-50 text-plum-900 ring-lavender-200',
  success: 'bg-emerald-50 text-success ring-emerald-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  error: 'bg-blush-50 text-danger ring-blush-300',
};

export function Alert({ tone = 'info', title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-2xl p-4 text-sm ring-1 ${tones[tone]}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}
