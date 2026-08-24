/** A lightweight, non-sensitive marker (just the login identifier — email or phone) used to show
 * the "Continue as {account}" quick-login chooser on app boot. Always in localStorage since it's
 * only ever written when "Remember me" was checked (which already implies localStorage-tier
 * persistence for the real session) and needs to be visible to a fresh tab. */
const KEY = 'iva_remembered_account';

export function saveRememberedAccount(identifier: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, identifier);
}

export function readRememberedAccount(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
}

export function clearRememberedAccount(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
