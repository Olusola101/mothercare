const env = import.meta.env;

const supabaseUrl = (env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY ?? '').trim();
const hasSupabase = supabaseUrl !== '' && supabaseAnonKey !== '';

export const appConfig = {
  /** Configurable product name. */
  appName: (env.VITE_APP_NAME ?? '').trim() || 'MotherCare',
  supabaseUrl,
  supabaseAnonKey,
  hasSupabase,
  /**
   * The development sign-in fallback is only offered when Supabase is NOT configured, and only in
   * `vite dev` (or when explicitly forced with VITE_ALLOW_DEV_AUTH=true). It does not check passwords.
   */
  devAuthEnabled: !hasSupabase && (env.DEV === true || env.VITE_ALLOW_DEV_AUTH === 'true'),
} as const;
