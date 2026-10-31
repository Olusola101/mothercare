import type { AuthService, AuthUser } from './auth';
import { readJSON, removeKey, writeJSON } from './storage';

/**
 * DEVELOPMENT-ONLY sign-in. It is NOT secure and must never be used with real people's data:
 *  - passwords are NOT stored and NOT verified (any non-empty password works);
 *  - the account list lives unencrypted in this browser's localStorage;
 *  - the session lives in sessionStorage and ends when the tab closes.
 * It exists only so the UI can be run and tested without a Supabase project.
 */
const USERS_KEY = 'mothercare.dev.users';
const SESSION_KEY = 'mothercare.dev.session';

type DevUsers = Record<string, AuthUser>; // keyed by lower-cased email

function readUsers(): DevUsers {
  const raw = readJSON('local', USERS_KEY);
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as DevUsers) : {};
}

function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDevAuth(): AuthService {
  return {
    mode: 'dev',

    async getUser() {
      const id = readJSON('session', SESSION_KEY);
      if (typeof id !== 'string') return null;
      return Object.values(readUsers()).find((u) => u.id === id) ?? null;
    },

    async signUp({ displayName, email }) {
      const users = readUsers();
      const key = email.toLowerCase();
      if (users[key]) return { ok: false, message: 'A development account with this email already exists on this device.' };
      const user: AuthUser = { id: newId(), email: key, displayName };
      users[key] = user;
      if (!writeJSON('local', USERS_KEY, users) || !writeJSON('session', SESSION_KEY, user.id)) {
        return { ok: false, message: 'Browser storage is unavailable, so the development sign-in cannot work.' };
      }
      return { ok: true, user };
    },

    async signIn({ email }) {
      const user = readUsers()[email.toLowerCase()];
      if (!user) return { ok: false, message: 'No development account for this email on this device. Register first.' };
      if (!writeJSON('session', SESSION_KEY, user.id)) {
        return { ok: false, message: 'Browser storage is unavailable, so the development sign-in cannot work.' };
      }
      return { ok: true, user };
    },

    async signOut() {
      removeKey('session', SESSION_KEY);
    },

    subscribe() {
      return () => undefined;
    },

    forgetLocalAccount(userId) {
      const users = readUsers();
      for (const [k, u] of Object.entries(users)) if (u.id === userId) delete users[k];
      writeJSON('local', USERS_KEY, users);
      removeKey('session', SESSION_KEY);
    },
  };
}
