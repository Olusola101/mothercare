import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '../components/Spinner';
import { useSession } from '../stores/session';

/** Signed-in users only. Unauthenticated or expired sessions are sent to /login. */
export function RequireAuth() {
  const status = useSession((s) => s.status);
  const location = useLocation();
  if (status === 'loading') return <Spinner label="Checking your session…" />;
  if (status === 'signedOut') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Login/register pages: signed-in users go straight to the dashboard. */
export function GuestOnly() {
  const status = useSession((s) => s.status);
  if (status === 'loading') return <Spinner label="Checking your session…" />;
  if (status === 'signedIn') return <Navigate to="/" replace />;
  return <Outlet />;
}
