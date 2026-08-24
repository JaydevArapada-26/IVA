import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://oqryjwfdlncfyxvonkbh.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xcnlqd2ZkbG5jZnl4dm9ua2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTAxNDgsImV4cCI6MjEwMDQ2NjE0OH0.EHzymHeCygrYDEh_Jh55u407U9MkpoQ7LG52JB1yNws';

const REMEMBER_ME_PREFERENCE_KEY = 'iva_remember_me';

export function isRememberMePreferred(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REMEMBER_ME_PREFERENCE_KEY) === '1';
}

export function setRememberMePreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMEMBER_ME_PREFERENCE_KEY, enabled ? '1' : '0');
}

/**
 * Standardized auth storage using localStorage for session persistence across refreshes.
 * Session expiry is managed with a 2-hour cap by sessionTimeout.ts.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
