/// <reference types="vite/client" />

// Adds the app's own variables to Vite's ImportMetaEnv (interface merging).
interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ALLOW_DEV_AUTH?: string;
}
