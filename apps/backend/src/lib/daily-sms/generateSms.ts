/**
 * Localized daily scheme SMS body generation (spec 3.21-3.24). Tries a short MiniMax/Gemini
 * generation in the citizen's locale first (reusing the shared LLM client — lib/llm/client.ts),
 * and always falls back to a deterministic, `TRANSLATIONS`-keyed template if the LLM call fails
 * or returns something unusably long — so a message can always be produced, and the fallback path
 * stays testable without depending on a live LLM call.
 */
import type { SupportedLanguage } from 'shared/types';
import { callGemini, callMiniMax, getLlmAvailability } from '../llm/client';
import { resolveLanguageName } from '../llm/language';
import type { RecommendedScheme } from '../recommendation/service';

const SMS_TRANSLATIONS: Record<SupportedLanguage, { intro: string; benefit: string; details: string }> = {
  en: {
    intro: 'IVA: A scheme may be useful for you.',
    benefit: 'Benefit',
    details: 'Details',
  },
  hi: {
    intro: 'IVA: आपके लिए एक योजना उपयोगी हो सकती है।',
    benefit: 'लाभ',
    details: 'विवरण',
  },
  ta: {
    intro: 'IVA: ஒரு திட்டம் உங்களுக்குப் பயனுள்ளதாக இருக்கலாம்.',
    benefit: 'பலன்',
    details: 'விவரங்கள்',
  },
  te: {
    intro: 'IVA: ఒక పథకం మీకు ఉపయోగకరంగా ఉండవచ్చు.',
    benefit: 'ప్రయోజనం',
    details: 'వివరాలు',
  },
  bn: {
    intro: 'IVA: একটি স্কিম আপনার জন্য উপযোগী হতে পারে।',
    benefit: 'সুবিধা',
    details: 'বিবরণ',
  },
  mr: {
    intro: 'IVA: एक योजना तुमच्यासाठी उपयुक्त ठरू शकते.',
    benefit: 'लाभ',
    details: 'तपशील',
  },
  gu: {
    intro: 'IVA: તમારા માટે એક યોજના ઉપયોગી હોઈ શકે છે.',
    benefit: 'લાભ',
    details: 'વિગતો',
  },
};

const MAX_SMS_LENGTH = 320; // ~2 GSM-7 segments; keeps Twilio cost/complexity bounded

function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim();
  return trimmed.length <= maxLength ? trimmed : trimmed.slice(0, maxLength - 1).trimEnd() + '…';
}

function firstBenefitLine(benefits: string | null): string {
  if (!benefits) return '';
  const first = benefits.split(/[;\n]/).map((b) => b.trim()).find((b) => b.length > 0);
  return first ? truncate(first, 80) : '';
}

function schemeName(scheme: RecommendedScheme): string {
  const candidate = scheme.shortTitle?.trim() || scheme.title.trim();
  return truncate(candidate, 60);
}

function schemeLink(scheme: RecommendedScheme): string | null {
  return scheme.applicationUrl || scheme.sourceUrl || null;
}

/** Deterministic, always-available fallback — official scheme name and link are never
 * translated/altered; only the surrounding IVA-authored copy is localized. */
export function buildTemplateSmsBody(scheme: RecommendedScheme, locale: SupportedLanguage): string {
  const t = SMS_TRANSLATIONS[locale] ?? SMS_TRANSLATIONS.en;
  const intro = t.intro;
  const benefitLabel = t.benefit;
  const detailsLabel = t.details;
  const name = schemeName(scheme);
  const benefit = firstBenefitLine(scheme.benefits);
  const link = schemeLink(scheme);

  const lines = [intro, name];
  if (benefit) lines.push(`${benefitLabel}: ${benefit}`);
  if (link) lines.push(`${detailsLabel}: ${link}`);
  return lines.join('\n');
}

async function tryLlmSmsBody(scheme: RecommendedScheme, locale: SupportedLanguage): Promise<string | undefined> {
  if (!getLlmAvailability().configured) return undefined;

  const targetLanguage = resolveLanguageName(locale);
  const name = schemeName(scheme);
  const benefit = firstBenefitLine(scheme.benefits);
  const reason = scheme.reasons[0] ?? '';
  const link = schemeLink(scheme);

  const systemPrompt =
    `You write short SMS notifications for an Indian government-scheme app called IVA. Write ONE SMS, under 300 characters total, ` +
    `in ${targetLanguage} only (no English filler words or parentheticals). Do NOT translate or alter the official scheme name or the URL — ` +
    `keep them exactly as given. Structure: a one-line intro that a scheme may be useful, the scheme name, a short benefit line, and the link. ` +
    `Do not invent any facts beyond what is given. Output plain text only, no markdown, no quotes.`;
  const userPrompt =
    `Scheme name: ${name}\n` +
    (benefit ? `Benefit: ${benefit}\n` : '') +
    (reason ? `Why it may fit this citizen: ${reason}\n` : '') +
    (link ? `Link: ${link}\n` : '');

  const availability = getLlmAvailability();
  const result = availability.hasMiniMax ? await callMiniMax(systemPrompt, userPrompt) : await callGemini(`${systemPrompt}\n\n${userPrompt}`);
  if (!result.ok) return undefined;

  const text = result.text.trim();
  if (text.length === 0 || text.length > MAX_SMS_LENGTH) return undefined;
  // The link and scheme name must survive verbatim — if the model altered/dropped them, prefer
  // the deterministic template over a message that might send a broken/wrong URL.
  if (link && !text.includes(link)) return undefined;
  return text;
}

export async function generateDailySmsBody(scheme: RecommendedScheme, locale: SupportedLanguage): Promise<string> {
  const llmBody = await tryLlmSmsBody(scheme, locale);
  return llmBody ?? buildTemplateSmsBody(scheme, locale);
}
