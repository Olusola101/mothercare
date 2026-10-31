import type { User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import type { AuthService, AuthUser } from './auth';

function toUser(u: User): AuthUser {
  const name = u.user_metadata?.display_name;
  return { id: u.id, email: u.email ?? '', displayName: typeof name === 'string' ? name : '' };
}

/** Generic messages only: never reveal whether an email address is registered. */
function friendlySignUpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('password')) return 'Please choose a stronger password.';
  if (m.includes('rate') || m.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
  return 'We could not create your account. Please try again.';
}

export function createSupabaseAuth(): AuthService {
  return {
    mode: 'supabase',

    async getUser() {
      const sb = getSupabase();
      // getUser() validates the session with the server instead of trusting local storage.
      const { data, error } = await sb.auth.getUser();
      if (error || !data.user) return null;
      return toUser(data.user);
    },

    async signUp({ displayName, email, password }) {
      const sb = getSupabase();
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName, accepted_terms_at: new Date().toISOString() } },
      });
      if (error) return { ok: false, message: friendlySignUpError(error.message) };
      // With email confirmation on, no session is returned. The same message is shown whether or
      // not the address already exists, which avoids account enumeration.
      if (!data.session || !data.user) return { ok: true, user: null, needsEmailConfirmation: true };
      return { ok: true, user: toUser(data.user) };
    },

    async signIn({ email, password }) {
      const sb = getSupabase();
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        const m = (error?.message ?? '').toLowerCase();
        if (m.includes('rate') || m.includes('too many')) {
          return { ok: false, message: 'Too many attempts. Please wait a moment and try again.' };
        }
        if (m.includes('not confirmed')) return { ok: false, message: 'Please confirm your email address first.' };
        return { ok: false, message: 'Email or password is incorrect.' };
      }
      return { ok: true, user: toUser(data.user) };
    },

    async signOut() {
      await getSupabase().auth.signOut();
    },

    subscribe(listener) {
      const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
        listener(session?.user ? toUser(session.user) : null);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
