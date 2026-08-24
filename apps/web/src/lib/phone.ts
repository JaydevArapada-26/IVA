/** Fixed +91 prefix — citizens only ever type the 10-digit local number. Matches the backend's
 * normalizePhoneNumber() so the stored/compared value is always the same E.164 shape. */
export const PHONE_COUNTRY_CODE = '+91';

export function toLocalDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10);
}

export function toE164(localDigits: string): string {
  return `${PHONE_COUNTRY_CODE}${toLocalDigits(localDigits)}`;
}
