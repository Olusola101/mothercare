import { CircleAlert } from 'lucide-react';
import { Card } from './ui';

type Audience = 'pregnancy' | 'postpartum';

const PREGNANCY = [
  'Heavy vaginal bleeding',
  'Severe or constant tummy (abdominal) pain',
  'Difficulty breathing or chest pain',
  'A seizure (fit) or collapsing',
  'A severe headache that will not go away, or sudden changes in your vision',
  'Your waters breaking, or regular painful contractions, earlier than expected',
  'Your baby moving much less than usual, once you have been feeling regular movements',
];

const MOTHER = [
  'Very heavy bleeding or passing large clots',
  'Chest pain or difficulty breathing',
  'A severe headache that will not go away',
  'A seizure (fit)',
  'A high temperature, or increasing pain, redness or discharge from a tear or caesarean wound',
  'Thoughts of harming yourself or your baby',
];

const BABY = [
  'Difficulty breathing',
  'Blue or grey colour of the skin, lips or tongue',
  'Very floppy, very sleepy, or hard to wake',
  'A fever in a very young baby',
  'Not feeding, or far fewer wet nappies than usual',
];

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

/**
 * General warning-sign guidance. NOT clinically reviewed yet: a qualified reviewer and local
 * (regional) guidance must be added before launch. The app never replaces emergency care.
 */
export function EmergencyBanner({ audience }: { audience: Audience }) {
  return (
    <Card tone="alert" title="When to get urgent help" icon={<CircleAlert size={20} />}>
      <p className="mb-3 text-sm text-ink">
        Please contact your local emergency services or go to your nearest emergency department straight away if you
        notice any of these. Do not wait for the app, and do not wait for an appointment.
      </p>
      {audience === 'pregnancy' ? (
        <List items={PREGNANCY} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-1 text-sm font-semibold text-plum-900">For you</h3>
            <List items={MOTHER} />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold text-plum-900">For your baby</h3>
            <List items={BABY} />
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-ink-muted">
        If you are worried about anything else, contact your midwife, doctor or local health service. This is general
        guidance and has not yet been clinically reviewed; advice in your area may differ.
      </p>
    </Card>
  );
}
