import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, TextField } from '../../components/ui';
import { getAuthService } from '../../lib/auth';
import { fieldErrors, loginSchema, safeRedirect } from '../../lib/validation';
import { useSession } from '../../stores/session';
import { AuthLayout } from './AuthLayout';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useSession((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    const service = getAuthService();
    if (!service) return;
    setSubmitting(true);
    try {
      const result = await service.signIn(parsed.data);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      setUser(result.user);
      const from = (location.state as { from?: unknown } | null)?.from;
      navigate(safeRedirect(from), { replace: true });
    } catch {
      setFormError('Something went wrong. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back">
      <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" loading={submitting} className="w-full">
          Sign in
        </Button>
        <p className="text-center text-sm text-ink-muted">
          New here?{' '}
          <Link to="/register" className="font-semibold text-plum-800 underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
