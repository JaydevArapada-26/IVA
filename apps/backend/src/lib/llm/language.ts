/** Shared locale → display-name map for LLM prompts. Previously only existed in
 * routes/api/v1/assistant.route.ts; the WS assistant pipeline relied purely on the LLM inferring
 * language from the message text. Both pipelines now use the citizen's stored
 * profiles.languageCode as the authoritative response language (spec 2.18), falling back to
 * "mirror the query's language" only when no stored preference exists. */
export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिंदी)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  bn: 'Bengali (বাংলা)',
  mr: 'Marathi (मराठी)',
  gu: 'Gujarati (ગુજરાતી)',
};

export function resolveLanguageName(code: string | null | undefined): string {
  if (!code) return LANGUAGE_NAMES.en!;
  return LANGUAGE_NAMES[code] ?? LANGUAGE_NAMES.en!;
}
