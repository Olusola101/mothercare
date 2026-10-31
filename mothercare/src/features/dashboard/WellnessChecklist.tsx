import { useState } from 'react';
import { Card } from '../../components/ui';
import { readJSON, STORAGE_PREFIX, writeJSON } from '../../lib/storage';

const ITEMS = [
  { id: 'water', label: 'Drink water through the day' },
  { id: 'rest', label: 'Take a little time to rest' },
  { id: 'move', label: 'Some gentle movement, if your healthcare professional has said it is right for you' },
  { id: 'questions', label: 'Jot down any questions for your next appointment' },
  { id: 'kind', label: 'Do one kind thing for yourself' },
];

export function WellnessChecklist({ userId, today }: { userId: string; today: string }) {
  const key = `${STORAGE_PREFIX}checklist.${userId}.${today}`;
  const [checked, setChecked] = useState<string[]>(() => {
    const raw = readJSON('local', key);
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
  });

  function toggle(id: string) {
    const next = checked.includes(id) ? checked.filter((c) => c !== id) : [...checked, id];
    setChecked(next);
    writeJSON('local', key, next);
  }

  return (
    <Card title="Today’s wellness checklist">
      <ul className="space-y-2">
        {ITEMS.map((item) => (
          <li key={item.id}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-5 shrink-0 accent-plum-700"
                checked={checked.includes(item.id)}
                onChange={() => toggle(item.id)}
              />
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-muted">Resets each day. Kept only on this device.</p>
    </Card>
  );
}
