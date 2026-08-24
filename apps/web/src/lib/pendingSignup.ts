import type { SignupCompleteRequest } from 'shared/contracts';

const STORAGE_KEY = 'iva_pending_signup';

export type PendingSignup = Omit<SignupCompleteRequest, 'supabaseAccessToken'>;

/** Persisted across the redirect that happens when the citizen clicks the "confirm your email"
 * link in a new tab/window — the signup form's in-memory state doesn't survive that. */
export function savePendingSignup(data: PendingSignup): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function readPendingSignup(): PendingSignup | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as PendingSignup;
  } catch {
    return undefined;
  }
}

export function clearPendingSignup(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
