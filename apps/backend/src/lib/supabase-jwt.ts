import { createClient } from '@supabase/supabase-js';
import { loadBackendEnv } from '../config';

export interface SupabaseTokenClaims {
  readonly sub: string; // Supabase auth user id
  readonly email?: string;
  readonly phone?: string;
}

let cachedAdminClient: ReturnType<typeof createClient> | undefined;

export function getSupabaseAdminClient() {
  if (cachedAdminClient) return cachedAdminClient;
  const env = loadBackendEnv();
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return undefined;
  cachedAdminClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAdminClient;
}

/**
 * Verifies a Supabase Auth access token by asking Supabase's own Auth server to validate it
 * (rather than locally re-implementing JWT signature verification against SUPABASE_JWT_SECRET).
 * Local HS256 verification broke silently whenever the project used Supabase's newer asymmetric
 * JWT signing keys (ES256/RS256) — this approach works regardless of which signing scheme the
 * project uses, and doesn't require keeping a secret in sync.
 * Returns undefined if the token is missing, expired, or otherwise invalid.
 */
export async function verifySupabaseAccessToken(token: string): Promise<SupabaseTokenClaims | undefined> {
  const admin = getSupabaseAdminClient();
  if (!admin) return undefined;

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return undefined;

  return {
    sub: data.user.id,
    ...(data.user.email ? { email: data.user.email } : {}),
    ...(data.user.phone ? { phone: data.user.phone } : {}),
  };
}

/** Deletes the Supabase Auth user (auth.users row) linked to a local `users.authUserId` — best
 * effort: logs and swallows failures so an admin deleting an IVA user row is never blocked by a
 * Supabase-side hiccup (e.g. the auth user was already removed manually). */
export async function deleteSupabaseAuthUser(authUserId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) return;

  try {
    await admin.auth.admin.deleteUser(authUserId);
  } catch (error) {
    console.error(`[supabase-jwt] Could not delete Supabase auth user "${authUserId}":`, error);
  }
}
