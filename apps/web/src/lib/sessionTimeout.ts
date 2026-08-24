/**
 * Manages 2-hour session expiry for IVA citizen sessions.
 * Timestamps are stored in localStorage so session state survives page refreshes,
 * reloads, and tab navigation, while enforcing a hard 2-hour timeout.
 */
const KEY = 'iva_login_at';
export const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function markLoginTimestamp(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, String(Date.now()));
}

export function clearLoginTimestamp(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}

export function getLoginTimestamp(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  const loginAt = Number(raw);
  return Number.isFinite(loginAt) ? loginAt : null;
}

export function isSessionExpired(): boolean {
  const loginAt = getLoginTimestamp();
  if (!loginAt) return false;
  return Date.now() - loginAt > TWO_HOURS_MS;
}
