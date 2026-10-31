import type { ReactNode } from 'react';
import { appConfig } from '../../config/appConfig';
import { DevAuthBanner } from '../../components/DevAuthBanner';
import { DisclaimerNote } from '../../components/DisclaimerNote';
import { Alert, Card } from '../../components/ui';
import { getAuthService } from '../../lib/auth';

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  const available = getAuthService() !== null;
  return (
    <div className="min-h-dvh bg-gradient-to-b from-lavender-50 to-cream-50">
      <DevAuthBanner />
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
        <p className="text-center text-2xl font-bold text-plum-800">{appConfig.appName}</p>
        <Card title={title}>
          {available ? (
            children
          ) : (
            <Alert tone="warning" title="Sign-in is not configured">
              This copy of the app has no authentication service set up, so accounts cannot be created or used yet.
              Add your Supabase URL and anon key to <code>.env</code> (see the README), or run <code>npm run dev</code>{' '}
              to use the clearly-labelled development sign-in.
            </Alert>
          )}
        </Card>
        <DisclaimerNote />
      </main>
    </div>
  );
}
