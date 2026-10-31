import { appConfig } from '../config/appConfig';
import { createDevAuth } from './auth.dev';
import { createSupabaseAuth } from './auth.supabase';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export type AuthResult =
  | { ok: true; user: AuthUser | null; needsEmailConfirmation?: boolean }
  | { ok: false; message: string };

export interface AuthService {
  /** "dev" is NOT production-secure: it does not verify passwords. */
  readonly mode: 'supabase' | 'dev';
  getUser(): Promise<AuthUser | null>;
  signUp(input: { displayName: string; email: string; password: string }): Promise<AuthResult>;
  signIn(input: { email: string; password: string }): Promise<AuthResult>;
  signOut(): Promise<void>;
  /** Notifies when the session ends or changes (e.g. expiry). Returns an unsubscribe function. */
  subscribe(listener: (user: AuthUser | null) => void): () => void;
  /** Dev mode only: removes the locally stored account record. */
  forgetLocalAccount?(userId: string): void;
}

let service: AuthService | null | undefined;

/** Returns the configured auth service, or null when no authentication is available. */
export function getAuthService(): AuthService | null {
  if (service !== undefined) return service;
  if (appConfig.hasSupabase) service = createSupabaseAuth();
  else if (appConfig.devAuthEnabled) service = createDevAuth();
  else service = null;
  return service;
}
