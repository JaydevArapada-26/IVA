/**
 * Centralized mapping from IVA SupportedLanguage to BCP-47 speech recognition locale.
 *
 * All languages use the -IN suffix since the app targets Indian citizens.
 * Only extend this list when the application's SupportedLanguage union grows.
 */

import type { SupportedLanguage } from 'shared/types';

/**
 * Maps every IVA locale to the BCP-47 code that the browser Web Speech API
 * should use for speech recognition.
 *
 * IMPORTANT: Do not silently fall back to 'en-IN' for unsupported locales.
 * Return undefined and let the caller handle it explicitly so the user knows
 * their language may not work.
 */
export const SPEECH_LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
};

/**
 * Returns the BCP-47 speech recognition locale for a given IVA language code,
 * or undefined if no mapping exists.
 */
export function getSpeechLocale(language: SupportedLanguage): string | undefined {
  return SPEECH_LOCALE_MAP[language];
}
