/**
 * Canonical SchemeRecommendationService — the single "find the right schemes for this citizen"
 * implementation shared by the Assistant, the daily scheme SMS job, and the Admin manual-send
 * path (see IVA_Claude_Implementation_Plan.md's own diagram: Assistant / Daily SMS / Admin all
 * feed into one recommendation service, which feeds into eligibility evaluation and ranking).
 *
 * This module does not re-implement eligibility or ranking — it composes engines that already
 * exist:
 *   - lib/eligibility/engine.ts (`evaluateEligibilityForPublishedSchemes`) for deterministic
 *     eligible/ineligible/partial/unknown classification, per-scheme.
 *   - lib/priority/engine.ts's composite score (urgency + eligibility + recency) is mirrored here
 *     for candidate ordering, reusing the same weights.
 *   - db/repositories/scheme.repository.ts for bulk scheme metadata (title/description/
 *     eligibility text/benefits/documents/categories/close date).
 *   - lib/text/keywords.ts for the query → keyword/intent expansion used by the Assistant path.
 *
 * Never surfaces internal scores, rule ids, or database ids to end-user-facing text — callers
 * (the assistant prompt builder, the SMS body generator) work off `title`/`reasons`/`tier` only.
 */
import { SchemeRepository } from '../../db/repositories/scheme.repository';
import { SmsNotificationRepository } from '../../db/repositories/sms-notification.repository';
import { evaluateEligibilityForPublishedSchemes, fetchProfileSnapshot, type ProfileSnapshot } from '../eligibility/engine';
import { generateStructuredText, getLlmAvailability } from '../llm/client';
import { expandKeywordsWithIntent, extractKeywords } from '../text/keywords';

const ALL_INDIAN_STATES_AND_UTS: readonly string[] = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi (NCT)',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

/** True when the text contains a non-Latin script (Devanagari, Gujarati, Tamil, Telugu, Bengali,
 * etc.) — a cheap, script-based signal that local English/Romanized tokenization (extractKeywords)
 * won't find any overlap against IVA's English-language scheme text, so it's worth the one extra
 * LLM round trip to translate intent into English keywords (spec 2.17: multilingual queries must
 * still resolve to the same underlying semantic intent). */
function containsNonLatinScript(text: string): boolean {
  return /[ऀ-෿]/.test(text);
}

/** LLM-assisted keyword extraction for non-Latin-script queries — the one place this otherwise
 * deterministic service reaches for the LLM, and only as a translation aid (spec 2.19: MiniMax is
 * for "reasoning over ambiguous retrieved information," not for the eligibility/ranking itself,
 * which stays entirely rule-based below). Returns an empty array on any failure — callers already
 * degrade gracefully to profile-only ranking when there are no keywords. */
async function extractEnglishKeywordsViaLlm(queryText: string): Promise<string[]> {
  if (!getLlmAvailability().configured) return [];
  const systemPrompt =
    'You are a keyword extraction engine for an Indian government-scheme search. The user message may be in English, ' +
    'a regional Indian language (native script or Romanized), or mixed. Output ONLY a JSON object ' +
    '{"keywords": string[]} with 2-6 short English keywords capturing the core intent (e.g. scheme category, ' +
    'beneficiary group, or an official scheme name kept as-is). No markdown, no commentary.';
  try {
    const text = await generateStructuredText(systemPrompt, queryText);
    if (!text) return [];
    const parsed = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '')) as { keywords?: unknown };
    if (!Array.isArray(parsed.keywords)) return [];
    return parsed.keywords.filter((k): k is string => typeof k === 'string').map((k) => k.toLowerCase().trim());
  } catch {
    return [];
  }
}

export type RecommendationTier = 'eligible' | 'likely_eligible' | 'potentially_relevant';

export interface RecommendedScheme {
  readonly schemeId: string;
  readonly slug: string;
  readonly title: string;
  readonly shortTitle: string | null;
  readonly briefDescription: string;
  readonly benefits: string | null;
  readonly eligibility: string | null;
  readonly documentsRequired: string | null;
  readonly applicationProcess: string | null;
  readonly applicationUrl: string | null;
  readonly sourceUrl: string;
  readonly ministry: string | null;
  readonly tier: RecommendationTier;
  /** Short, factual, only-what-actually-applied bullets — see explainMatch below. Never scores,
   * rule ids, or internal flags. */
  readonly reasons: readonly string[];
  /** Internal ordering key — composite of tier + eligibility score + keyword relevance + urgency +
   * recency. Not meant for display. */
  readonly rankScore: number;
}

type SchemeMeta = Awaited<ReturnType<SchemeRepository['listPublishedForRecommendation']>>[number];

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

/** Exported (not just used internally) so unit tests can verify the eligible > likely-eligible >
 * potentially-relevant > (excluded) tiering directly, without needing a live DB. */
export function tierFromStatus(status: 'eligible' | 'ineligible' | 'partial' | 'unknown'): RecommendationTier | undefined {
  if (status === 'eligible') return 'eligible';
  if (status === 'partial') return 'likely_eligible';
  if (status === 'unknown') return 'potentially_relevant';
  return undefined; // ineligible — never recommended
}

export function tierWeight(tier: RecommendationTier): number {
  return tier === 'eligible' ? 2 : tier === 'likely_eligible' ? 1 : 0;
}

function recencyPoints(publishedAt: Date | null): number {
  if (!publishedAt) return 0;
  const ageMs = Date.now() - publishedAt.getTime();
  return Math.max(0, Math.round((1 - ageMs / SIX_MONTHS_MS) * 20));
}

/** Detects an explicit request to broaden beyond the citizen's stored state — spec 2.5: stored
 * profile is context, not a prison. Deliberately conservative (only fires on clear phrases/another
 * state's name), so an ordinary query never accidentally drops the state signal. Exported for
 * direct unit testing. */
export function detectGeographicOverride(queryText: string, profileState: string | null | undefined): boolean {
  const lower = queryText.toLowerCase();
  if (/\ball\s+india\b|\bacross\s+india\b|\banywhere\s+in\s+india\b|\bpan[- ]?india\b|\ball\s+states?\b|\bnationwide\b/.test(lower)) {
    return true;
  }
  const otherState = ALL_INDIAN_STATES_AND_UTS.find(
    (st) => lower.includes(st.toLowerCase()) && st.toLowerCase() !== (profileState ?? '').toLowerCase(),
  );
  return Boolean(otherState);
}

function schemeSearchText(meta: SchemeMeta): string {
  return [
    meta.title,
    meta.shortTitle ?? '',
    meta.briefDescription,
    meta.eligibility ?? '',
    meta.benefits ?? '',
    meta.ministry ?? '',
    meta.beneficiaryType ?? '',
    meta.targetBeneficiaries ?? '',
    (meta.categories ?? []).join(' '),
    (meta.tags ?? []).join(' '),
  ]
    .join(' ')
    .toLowerCase();
}

function keywordRelevanceScore(keywords: readonly string[], meta: SchemeMeta): number {
  if (keywords.length === 0) return 0;
  const haystack = schemeSearchText(meta);
  let hits = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw)) hits++;
  }
  return hits / keywords.length;
}

/**
 * Turns the profile fields that plausibly applied to this scheme into short, factual bullets.
 * Deliberately conservative: only emits a reason when the corresponding profile field is present
 * AND the scheme's own text/metadata references the matching concept — never invents a reason,
 * never repeats the whole profile (spec 2.13/2.14).
 */
export function explainMatch(profile: ProfileSnapshot | null, meta: SchemeMeta): string[] {
  if (!profile) return [];
  const reasons: string[] = [];
  const haystack = schemeSearchText(meta);

  if (profile.studentStatus && /\bstudent|scholarship|education|stipend\b/.test(haystack)) {
    reasons.push('You are a currently enrolled student.');
  }
  if (profile.farmerStatus && /\bfarmer|agricultur|kisan|crop\b/.test(haystack)) {
    reasons.push('This scheme is relevant to farmers.');
  }
  if (profile.seniorCitizenStatus && /\bsenior citizen|pension|old age\b/.test(haystack)) {
    reasons.push('You are a senior citizen.');
  }
  if (profile.disabilityStatus && /\bdisab|divyang|pwd\b/.test(haystack)) {
    reasons.push('This scheme supports persons with disabilities.');
  }
  if (profile.state && meta.state && profile.state.toLowerCase() === meta.state.toLowerCase()) {
    reasons.push(`This scheme is available in ${profile.state}.`);
  } else if (profile.state && !meta.state) {
    reasons.push('This scheme is available nationwide.');
  }
  if (profile.occupation && haystack.includes(profile.occupation.replace(/_/g, ' '))) {
    reasons.push(`This scheme matches your occupation (${profile.occupation.replace(/_/g, ' ')}).`);
  }
  if (profile.incomeRange && /\bincome\b/.test(haystack)) {
    reasons.push('Your income falls within the scheme’s stated limits.');
  }
  if (profile.category && /\bobc|sc\/st|\bsc\b|\bst\b|\bews\b|caste|category\b/.test(haystack)) {
    reasons.push('This scheme considers your caste category.');
  }

  return reasons.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Shared candidate-building pipeline
// ---------------------------------------------------------------------------

interface CandidateInputs {
  readonly profile: ProfileSnapshot | null;
  readonly metaBySchemeId: Map<string, SchemeMeta>;
  readonly evaluations: Awaited<ReturnType<typeof evaluateEligibilityForPublishedSchemes>>;
}

async function loadCandidateInputs(userId: string): Promise<CandidateInputs> {
  const [profile, evaluations, metaRows] = await Promise.all([
    fetchProfileSnapshot(userId),
    evaluateEligibilityForPublishedSchemes(userId),
    new SchemeRepository().listPublishedForRecommendation(),
  ]);
  const metaBySchemeId = new Map(metaRows.map((m) => [m.id, m]));
  return { profile, evaluations, metaBySchemeId };
}

function isExpired(meta: SchemeMeta): boolean {
  if (!meta.schemeCloseDate) return false;
  return meta.schemeCloseDate.getTime() < Date.now();
}

function toRecommendedScheme(
  meta: SchemeMeta,
  tier: RecommendationTier,
  profile: ProfileSnapshot | null,
  isUrgent: boolean,
  publishedAt: Date | null,
  eligibilityScore: number,
  keywordScore: number,
): RecommendedScheme {
  const rankScore =
    tierWeight(tier) * 1000 + Math.round(eligibilityScore * 40) + Math.round(keywordScore * 100) + (isUrgent ? 40 : 0) + recencyPoints(publishedAt);

  return {
    schemeId: meta.id,
    slug: meta.slug,
    title: meta.title,
    shortTitle: meta.shortTitle,
    briefDescription: meta.briefDescription,
    benefits: meta.benefits,
    eligibility: meta.eligibility,
    documentsRequired: meta.documentsRequired,
    applicationProcess: meta.applicationProcess,
    applicationUrl: meta.applicationUrl,
    sourceUrl: meta.sourceUrl,
    ministry: meta.ministry,
    tier,
    reasons: explainMatch(profile, meta),
    rankScore,
  };
}

// ---------------------------------------------------------------------------
// Public API — Assistant path
// ---------------------------------------------------------------------------

export interface QueryRecommendationOptions {
  readonly limit?: number;
}

/**
 * Query-based candidate retrieval for the Assistant (spec 2.1-2.13). Combines the citizen's
 * current question with their stored profile: broadens the query via intent synonyms, scores
 * every published scheme by keyword relevance, filters out clearly ineligible schemes, and ranks
 * eligible/likely-eligible/potentially-relevant candidates ahead of a pure keyword match.
 *
 * Works with no stored profile (guest/anonymous citizens) by degrading to keyword-only
 * "potentially relevant" results — never invents profile data (spec 2.15/2.22).
 */
export async function getCandidateSchemesForQuery(
  userId: string,
  queryText: string,
  options?: QueryRecommendationOptions,
): Promise<RecommendedScheme[]> {
  const limit = options?.limit ?? 5;
  const { profile, evaluations, metaBySchemeId } = await loadCandidateInputs(userId);

  let rawKeywords = extractKeywords(queryText, 12);
  if (rawKeywords.length === 0 || containsNonLatinScript(queryText)) {
    const translated = await extractEnglishKeywordsViaLlm(queryText);
    if (translated.length > 0) rawKeywords = Array.from(new Set([...rawKeywords, ...translated]));
  }
  const keywords = expandKeywordsWithIntent(rawKeywords);
  const broadenGeography = detectGeographicOverride(queryText, profile?.state);

  const candidates: RecommendedScheme[] = [];

  for (const evaluation of evaluations) {
    const meta = metaBySchemeId.get(evaluation.schemeId);
    if (!meta || isExpired(meta)) continue;

    let tier = tierFromStatus(evaluation.evaluation.status);
    if (!tier) {
      // Ineligible — normally excluded, unless the citizen explicitly asked to broaden beyond
      // their stored state and this scheme's own state restriction differs from it. That's the
      // one dimension this heuristic can safely second-guess without re-deriving the whole
      // eligibility result (spec 2.5).
      if (broadenGeography && meta.state && meta.state.toLowerCase() !== (profile?.state ?? '').toLowerCase()) {
        tier = 'potentially_relevant';
      } else {
        continue;
      }
    }

    const keywordScore = keywordRelevanceScore(keywords, meta);
    // With no query keywords at all (rare — e.g. a pure follow-up message), don't zero everyone
    // out; fall back to pure eligibility/priority ordering.
    if (keywords.length > 0 && keywordScore === 0 && tier === 'potentially_relevant') continue;

    candidates.push(
      toRecommendedScheme(meta, tier, profile, evaluation.isUrgent, evaluation.publishedAt, evaluation.evaluation.score, keywordScore),
    );
  }

  candidates.sort((a, b) => b.rankScore - a.rankScore);
  return candidates.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Public API — Daily SMS path
// ---------------------------------------------------------------------------

export interface DailyRecommendationOptions {
  /** How many days a previously-sent scheme stays deprioritized before it can be picked again
   * (spec 3.15/3.16). Default 14 days. */
  readonly cooldownDays?: number;
}

/**
 * Picks the single best current scheme for a citizen's daily automated SMS — no query text, just
 * profile + eligibility + freshness + recommendation history (spec 3.12-3.20). Returns `undefined`
 * when nothing suitable exists; callers must not fall back to a random scheme (spec 3.20).
 */
export async function getDailyRecommendation(
  userId: string,
  options?: DailyRecommendationOptions,
): Promise<RecommendedScheme | undefined> {
  const cooldownDays = options?.cooldownDays ?? 14;
  const { profile, evaluations, metaBySchemeId } = await loadCandidateInputs(userId);
  if (!profile) return undefined; // no profile → nothing deterministic to recommend on

  const sinceDate = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);
  const recentSchemeIds = new Set(await new SmsNotificationRepository().listRecentAutomatedSchemeIds(userId, sinceDate));

  const candidates: RecommendedScheme[] = [];
  for (const evaluation of evaluations) {
    const tier = tierFromStatus(evaluation.evaluation.status);
    // Daily SMS is proactive, not requested — hold it to a higher bar than the assistant's
    // "potentially relevant" tier, which exists mainly to keep a conversation useful when profile
    // data is thin. An unsolicited text should be eligible or at least likely-eligible.
    if (tier !== 'eligible' && tier !== 'likely_eligible') continue;

    const meta = metaBySchemeId.get(evaluation.schemeId);
    if (!meta || isExpired(meta)) continue;

    candidates.push(toRecommendedScheme(meta, tier, profile, evaluation.isUrgent, evaluation.publishedAt, evaluation.evaluation.score, 0));
  }

  if (candidates.length === 0) return undefined;

  candidates.sort((a, b) => b.rankScore - a.rankScore);

  // Cooldown: prefer a candidate not recently sent, but don't leave the citizen with nothing just
  // because their one strong match was mentioned recently (spec 3.16 — no permanent blacklist).
  const fresh = candidates.find((c) => !recentSchemeIds.has(c.schemeId));
  return fresh ?? candidates[0];
}
