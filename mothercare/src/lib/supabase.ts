import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { appConfig } from '../config/appConfig';

let client: SupabaseClient | null = null;

/** Only the public anon key is used in the browser. Never put a service-role key in client code. */
export function getSupabase(): SupabaseClient {
  if (!appConfig.hasSupabase) throw new Error('Supabase is not configured.');
  if (!client) {
    client = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
