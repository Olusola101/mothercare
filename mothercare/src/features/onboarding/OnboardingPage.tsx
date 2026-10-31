import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, CheckboxField, SelectField, TextField } from '../../components/ui';
import { buildProfile, type OnboardingForm } from '../../domain/onboarding';
import type { HealthProfile, Stage } from '../../domain/types';
import { isValidTimeZone, todayInZone } from '../../lib/dates';
import { Spinner } from '../../components/Spinner';
import { useProfile } from '../../stores/profile';
import { useSession } from '../../stores/session';

const STAGE_OPTIONS: Array<{ value: Stage; title: string; text: string }> = [
  { value: 'tracking', title: 'Tracking my periods', text: 'Log periods and see estimated dates.' },
  { value: 'ttc', title: 'Trying to conceive', text: 'Period tracking with an estimated fertile window.' },
  { value: 'pregnant', title: 'Pregnant', text: 'Follow your pregnancy week by week.' },
  { value: 'postpartum', title: 'Postpartum', text: 'Support for the first 12 weeks after birth.' },
];

function browserZone(): string {
  try {
    const z = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimeZone(z) ? z : 'UTC';
  } catch {
    return 'UTC';
  }
}

function zoneList(current: string): string[] {
  let zones: string[] = [];
  try {
    zones = Intl.supportedValuesOf('timeZone');
  } catch {
    zones = [];
  }
  const set = new Set(['UTC', ...zones, current]);
  return [...set].sort();
}

function formFrom(profile: HealthProfile | null): OnboardingForm {
  return {
    stage: profile?.stage ?? '',
    lmp: profile?.stage === 'pregnant' ? (profile.lmpSource === 'lmp' ? (profile.lmp ?? '') : '') : '',
    edd: profile?.edd ?? '',
    eddSource: profile?.eddSource ?? 'user',
    avgCycleLength: profile?.avgCycleLength ? String(profile.avgCycleLength) : '',
    pregnancyWeeks: '',
    pregnancyDays: '',
    deliveryDate: profile?.deliveryDate ?? '',
    timezone: profile?.timezone ?? browserZone(),
    remindersEnabled: profile?.remindersEnabled ?? false,
    consentReproductive: profile !== null,
  };
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const { profile, loadedFor, save } = useProfile();
  const [form, setForm] = useState<OnboardingForm | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingForm, string>>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialise once the stored profile has been loaded.
  const ready = user !== null && loadedFor === user.id;
  const current = form ?? (ready ? formFrom(profile) : null);
  const zones = useMemo(() => zoneList(current?.timezone ?? 'UTC'), [current?.timezone]);

  if (!user || !current) return <Spinner />;

  const set = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) =>
    setForm({ ...current, [key]: value });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !current) return;
    setSaveError(null);
    const today = todayInZone(new Date(), current.timezone);
    const result = buildProfile(current, profile, today, new Date().toISOString());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    if (!save(user.id, result.profile)) {
      setSaveError('Your browser would not let us save this on your device (private mode or blocked storage?).');
      return;
    }
    navigate('/');
  }

  const stage = current.stage;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-plum-900">{profile ? 'Your profile' : 'Make it yours (optional)'}</h1>
        <p className="mt-1 text-ink-muted">
          Everything on this page is optional. You can skip it, and change or add details whenever you like.
        </p>
      </header>

      <Alert tone="info" title="Where your information is kept">
        In this early version, what you enter is stored only on this device, in this browser, and is not encrypted.
        Secure account storage with strict access rules comes in a later phase. Please do not enter real health
        information if you are testing.
      </Alert>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {saveError && <Alert tone="error">{saveError}</Alert>}

        <Card title="Where are you right now?">
          <fieldset>
            <legend className="mb-2 text-sm text-ink-muted">
              We ask so your home screen shows what is relevant to you. You can change this at any time and your
              earlier records are kept.
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {STAGE_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className={`flex min-h-11 cursor-pointer flex-col gap-1 rounded-2xl p-4 ring-1 focus-within:outline-2 focus-within:outline-plum-700 ${
                    stage === o.value ? 'bg-lavender-100 ring-plum-700' : 'bg-white ring-lavender-200'
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold text-plum-900">
                    <input
                      type="radio"
                      name="stage"
                      value={o.value}
                      checked={stage === o.value}
                      onChange={() => set('stage', o.value)}
                      className="size-4 accent-plum-700"
                    />
                    {o.title}
                  </span>
                  <span className="text-sm text-ink-muted">{o.text}</span>
                </label>
              ))}
            </div>
            {errors.stage && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {errors.stage}
              </p>
            )}
          </fieldset>
        </Card>

        {(stage === 'tracking' || stage === 'ttc') && (
          <Card title="Your cycle">
            <div className="space-y-4">
              <TextField
                label="First day of your last period"
                type="date"
                hint="Lets us estimate your next period. Skip it if you are not sure."
                value={current.lmp}
                max={todayInZone(new Date(), current.timezone)}
                onChange={(e) => set('lmp', e.target.value)}
                error={errors.lmp}
              />
              <TextField
                label="Usual cycle length (days)"
                inputMode="numeric"
                hint="Counted from the first day of one period to the first day of the next. Typical range is 21–35, but yours may differ."
                value={current.avgCycleLength}
                onChange={(e) => set('avgCycleLength', e.target.value)}
                error={errors.avgCycleLength}
              />
            </div>
          </Card>
        )}

        {stage === 'pregnant' && (
          <Card title="Your pregnancy">
            <div className="space-y-4">
              <TextField
                label="First day of your last period"
                type="date"
                hint="Used to estimate how far along you are. Skip it if you are not sure."
                value={current.lmp}
                max={todayInZone(new Date(), current.timezone)}
                onChange={(e) => set('lmp', e.target.value)}
                error={errors.lmp}
              />
              <TextField
                label="Estimated due date"
                type="date"
                hint="Only if you already know it."
                value={current.edd}
                onChange={(e) => set('edd', e.target.value)}
                error={errors.edd}
              />
              {current.edd !== '' && (
                <SelectField
                  label="Where did this due date come from?"
                  hint="A date confirmed by a healthcare professional (for example after a scan) is treated as more reliable."
                  value={current.eddSource}
                  onChange={(e) => set('eddSource', e.target.value === 'clinician' ? 'clinician' : 'user')}
                >
                  <option value="user">I worked it out or estimated it myself</option>
                  <option value="clinician">Confirmed by a doctor, midwife or scan</option>
                </SelectField>
              )}
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="Weeks pregnant, if you know"
                  inputMode="numeric"
                  hint="Used only if you gave no other date."
                  value={current.pregnancyWeeks}
                  onChange={(e) => set('pregnancyWeeks', e.target.value)}
                  error={errors.pregnancyWeeks}
                />
                <TextField
                  label="Extra days"
                  inputMode="numeric"
                  value={current.pregnancyDays}
                  onChange={(e) => set('pregnancyDays', e.target.value)}
                  error={errors.pregnancyDays}
                />
              </div>
            </div>
          </Card>
        )}

        {stage === 'postpartum' && (
          <Card title="Your baby">
            <TextField
              label="Baby’s date of birth"
              type="date"
              hint="Lets us show where you are in the first 12 weeks after birth."
              value={current.deliveryDate}
              max={todayInZone(new Date(), current.timezone)}
              onChange={(e) => set('deliveryDate', e.target.value)}
              error={errors.deliveryDate}
            />
          </Card>
        )}

        <Card title="Time zone and reminders">
          <div className="space-y-4">
            <SelectField
              label="Time zone"
              hint="So “today” and your dates line up with where you are."
              value={current.timezone}
              onChange={(e) => set('timezone', e.target.value)}
              error={errors.timezone}
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </SelectField>
            <CheckboxField
              label="I’d like in-app reminders when they become available"
              checked={current.remindersEnabled}
              onChange={(e) => set('remindersEnabled', e.target.checked)}
            />
            <p className="text-sm text-ink-muted">
              Reminders are not built yet. When they are, browser notifications may not arrive if your browser or
              device is inactive, so important appointments and medicines should also be noted elsewhere.
            </p>
          </div>
        </Card>

        <Card tone="muted">
          <CheckboxField
            label="I agree to this app recording the health information I enter above, on this device, so it can show my dates and estimates. I can change or delete it at any time."
            checked={current.consentReproductive}
            onChange={(e) => set('consentReproductive', e.target.checked)}
            error={errors.consentReproductive}
          />
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit">Save</Button>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-plum-800 hover:bg-lavender-50"
          >
            {profile ? 'Cancel' : 'Skip for now'}
          </Link>
        </div>
      </form>
    </div>
  );
}
