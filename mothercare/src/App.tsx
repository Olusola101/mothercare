import { useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { GuestOnly, RequireAuth } from './app/guards';
import { buttonClasses } from './components/ui';
import { appConfig } from './config/appConfig';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { ComingSoonPage } from './features/placeholder/ComingSoonPage';
import { useSession } from './stores/session';

function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-plum-900">We couldn’t find that page</h1>
      <Link to="/" className={buttonClasses('primary')}>
        Go to home
      </Link>
    </div>
  );
}

export function App() {
  useEffect(() => {
    document.title = appConfig.appName;
    void useSession.getState().init();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<OnboardingPage />} />
            <Route
              path="journal"
              element={
                <ComingSoonPage
                  title="Journal"
                  phase="Phase 3"
                  description="A private weekly pregnancy journal is planned. It is not built yet."
                />
              }
            />
            <Route
              path="care"
              element={
                <ComingSoonPage
                  title="Care"
                  phase="Phases 4–6"
                  description="Medication reminders, appointments and consultations are planned. None of them are built yet."
                />
              }
            />
            <Route
              path="community"
              element={
                <ComingSoonPage
                  title="Community"
                  phase="Phase 6"
                  description="A moderated community is planned. It is not built yet."
                />
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
