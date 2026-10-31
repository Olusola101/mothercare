import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { appConfig } from '../../config/appConfig';
import { Alert, Button, CheckboxField, TextField } from '../../components/ui';
import { getAuthService } from '../../lib/auth';
import { fieldErrors, registerSchema } from '../../lib/validation';
import { useSession } from '../../stores/session';
import { AuthLayout } from './AuthLayout';

export function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useSession((s) => s.setUser);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setNotice(null);
    const parsed = registerSchema.safeParse({ displayName, email, password, acceptTerms });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    const service = getAuthService();
    if (!service) return;
    setSubmitting(true);
    try {
      const { displayName: name, email: mail, password: pw } = parsed.data;
      const result = await service.signUp({ displayName: name, email: mail, password: pw });
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      if (result.needsEmailConfirmation || !result.user) {
        setNotice('Almost there. If this email address can be registered, we have sent a link to confirm it. Open it, then sign in.');
        return;
      }
      setUser(result.user);
      navigate('/profile', { replace: true });
    } catch {
      setFormError('Something went wrong. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account">
      <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}
        <p className="text-sm text-ink-muted">
          We only ask for what we need to create your account. Anything about your cycle or pregnancy is optional and
          comes later, only if you choose.
        </p>
        <TextField
          label="First or preferred name"
          autoComplete="given-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={errors.displayName}
        />
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <details className="rounded-2xl bg-lavender-50 p-3 text-sm text-ink">
          <summary className="cursor-pointer font-medium text-plum-900">Privacy notice and terms (summary)</summary>
          <div className="mt-2 space-y-2 text-ink-muted">
            <p>
              <strong>Draft summary. Not legal text.</strong> The operator of this app must supply a reviewed privacy
              notice and terms before real people use it.
            </p>
            <p>
              At sign-up we collect your name, email and password (handled by the authentication service). Optional
              cycle, pregnancy or postpartum details are collected only if you add them, and you can change or delete
              them later. We do not use advertising trackers.
            </p>
          </div>
        </details>

        <CheckboxField
          label={
            <>
              I have read the privacy notice and agree to the terms for {appConfig.appName}.
            </>
          }
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          error={errors.acceptTerms}
        />
        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
        <p className="text-center text-sm text-ink-muted">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-plum-800 underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
