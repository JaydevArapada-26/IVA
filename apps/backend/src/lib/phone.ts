/**
 * Normalizes an Indian phone number to the E.164 shape used consistently everywhere it's
 * stored or compared: `+91XXXXXXXXXX`. This matters because Supabase Auth returns phone claims
 * in E.164 format after OTP verification — if what we stored in `users.phoneNumber` at signup
 * doesn't match that exact format, phone login incorrectly fails to find the account (looks
 * like "no account exists" even though it does).
 */
export function normalizePhoneNumber(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, '');
  const last10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
  return `+91${last10}`;
}
