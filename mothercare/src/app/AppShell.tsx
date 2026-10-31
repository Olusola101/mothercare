import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, CalendarDays, Heart, User, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { appConfig } from '../config/appConfig';
import { DevAuthBanner } from '../components/DevAuthBanner';
import { DisclaimerNote } from '../components/DisclaimerNote';
import { Button } from '../components/ui';
import { useProfile } from '../stores/profile';
import { useSession } from '../stores/session';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: <Heart size={20} aria-hidden="true" />, end: true },
  { to: '/journal', label: 'Journal', icon: <BookOpen size={20} aria-hidden="true" /> },
  { to: '/care', label: 'Care', icon: <CalendarDays size={20} aria-hidden="true" /> },
  { to: '/community', label: 'Community', icon: <Users size={20} aria-hidden="true" /> },
  { to: '/profile', label: 'Profile', icon: <User size={20} aria-hidden="true" /> },
];

function AccountActions() {
  const signOut = useSession((s) => s.signOut);
  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" onClick={() => void signOut()}>
        Sign out
      </Button>
      <Button
        variant="danger"
        onClick={() => {
          if (window.confirm('Sign out and erase this account’s data stored on this device?')) {
            void signOut({ erase: true });
          }
        }}
      >
        Sign out and erase data on this device
      </Button>
    </div>
  );
}

export function AppShell() {
  const user = useSession((s) => s.user);
  const load = useProfile((s) => s.load);

  useEffect(() => {
    if (user) load(user.id);
  }, [user, load]);

  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-plum-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {/* Desktop / tablet sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-lavender-100 bg-white p-5 md:flex">
        <p className="text-xl font-bold text-plum-800">{appConfig.appName}</p>
        <nav aria-label="Main" className="flex-1">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-3 rounded-2xl px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-plum-700 ${
                      isActive ? 'bg-lavender-100 text-plum-900' : 'text-ink-muted hover:bg-lavender-50'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="mb-2 truncate text-sm text-ink-muted">{user?.displayName || user?.email}</p>
          <AccountActions />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-lavender-100 bg-white px-4 py-3 md:hidden">
          <p className="text-lg font-bold text-plum-800">{appConfig.appName}</p>
          <details className="relative">
            <summary className="min-h-11 cursor-pointer list-none rounded-full px-4 py-2 text-sm font-medium text-plum-800 hover:bg-lavender-50">
              Account
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-72 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-lavender-100">
              <p className="mb-2 truncate text-sm text-ink-muted">{user?.displayName || user?.email}</p>
              <AccountActions />
            </div>
          </details>
        </header>

        <DevAuthBanner />

        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10">
          <Outlet />
        </main>

        <footer className="mx-auto w-full max-w-5xl px-4 pb-24 md:px-8 md:pb-8">
          <DisclaimerNote />
        </footer>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-lavender-100 bg-white/95 backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-plum-700 ${
                    isActive ? 'text-plum-800' : 'text-ink-muted'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
