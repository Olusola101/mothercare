import { appConfig } from '../config/appConfig';
import { Alert } from './ui';

/** Shown whenever the insecure development sign-in is active. */
export function DevAuthBanner() {
  if (!appConfig.devAuthEnabled) return null;
  return (
    <div className="px-4 pt-3 md:px-8">
      <Alert tone="warning" title="Development sign-in: not secure">
        Passwords are not checked and your information stays unencrypted in this browser. Use fictional data only.
        Configure Supabase (see the README) for real sign-in.
      </Alert>
    </div>
  );
}
