/**
 * Lightweight priority/ranking engine for schemes.
 *
 * Ranks schemes for a given user based on:
 *   1. Urgency flag (isUrgent)
 *   2. Live eligibility score (computed deterministically from the citizen's profile
 *      via evaluateEligibilityForPublishedSchemes — no pre-computed table lookup)
 *   3. Recency (publishedAt)
 *
 * Scores are cached in-process (see lib/priority/cache.ts) so pagination does not
 * re-score the full scheme table on every "Next" click — only the first request
 * (or after a profile change) triggers the full bulk evaluation pass.
 *
 * Returns schemes sorted highest-priority first with a 0–100 priority score.
 * Stable tiebreak on schemeId ensures page order never jitters between requests.
 */
import { eq, inArray } from 'drizzle-orm';
import { db } from '../../db';
import { schemeCategories, schemes } from '../../db/schema';
import { evaluateEligibilityForPublishedSchemes } from '../eligibility/engine';
import { type CachedScoredEntry, bustRankingCache, getCachedRanking, setCachedRanking } from './cache';

export { bustRankingCache } from './cache';

export interface RankedScheme {
  readonly schemeId: string;
  readonly title: string;
  readonly slug: string;
  readonly category: string | null;
  readonly isUrgent: boolean;
  readonly eligibilityScore: number;
  readonly priorityScore: number;
  readonly occupationMatch: boolean;
}

export interface RankingOptions {
  /** When true, restrict to schemes specifically targeted at the citizen's occupation (e.g. a
   * student only sees student schemes). Falls back to the unfiltered ranking when the occupation
   * filter would return nothing (unset occupation, or an occupation with no dedicated schemes). */
  readonly occupationOnly?: boolean;
}

export interface PagedRanking {
  readonly schemes: readonly RankedScheme[];
  readonly totalCount: number;
  readonly hasNextPage: boolean;
}

/**
 * Compute a 0–100 composite priority score.
 *
 * Weights:
 *   - Urgency flag   : 40 pts
 *   - Eligibility    : 40 pts (eligibilityScore × 40)
 *   - Recency        : 20 pts (decays linearly to 0 over 6 months)
 */
function computePriority(isUrgent: boolean, eligibilityScore: number, publishedAt: Date | null, vulnerabilityBonus: number = 0): number {
  const urgencyPts = isUrgent ? 40 : 0;
  const eligibilityPts = Math.round(eligibilityScore * 40);

  let recencyPts = 0;
  if (publishedAt) {
    const ageMs = Date.now() - publishedAt.getTime();
    const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
    recencyPts = Math.max(0, Math.round((1 - ageMs / SIX_MONTHS_MS) * 20));
  }

  return Math.min(100, urgencyPts + eligibilityPts + recencyPts + vulnerabilityBonus);
}

/**
 * Run a full bulk evaluation for the user, score every scheme in memory, and
 * return a sorted + cached entry list. Called only on cache miss.
 */
async function buildAndCacheRanking(userId: string): Promise<readonly CachedScoredEntry[]> {
  const evaluations = await evaluateEligibilityForPublishedSchemes(userId);

  const scored: CachedScoredEntry[] = evaluations
    .map((e) => ({
      schemeId: e.schemeId,
      isUrgent: e.isUrgent,
      eligibilityScore: e.evaluation.score,
      priorityScore: computePriority(e.isUrgent, e.evaluation.score, e.publishedAt, e.vulnerabilityBonus),
      occupationMatch: e.occupationMatch,
    }))
    .sort((a, b) => {
      const diff = b.priorityScore - a.priorityScore;
      if (diff !== 0) return diff;
      // Stable tiebreak: deterministic order so page boundaries never shift.
      return a.schemeId.localeCompare(b.schemeId);
    });

  setCachedRanking(userId, scored);
  return scored;
}

/**
 * Hydrate a page-sized slice of scored entries with title / slug / category from
 * the DB. One query for up to `pageSize` rows — never the full table.
 */
async function hydrateEntries(entries: readonly CachedScoredEntry[]): Promise<readonly RankedScheme[]> {
  if (entries.length === 0) return [];

  const ids = entries.map((e) => e.schemeId);
  const metaRows = await db
    .select({
      id: schemes.id,
      title: schemes.schemeName,
      slug: schemes.slug,
      categoryName: schemeCategories.name,
    })
    .from(schemes)
    .leftJoin(schemeCategories, eq(schemes.categoryId, schemeCategories.id))
    .where(inArray(schemes.id, ids));

  const metaById = new Map(metaRows.map((r) => [r.id, r]));

  // Preserve ranked order; skip any scheme deleted between cache build and hydration.
  return entries.flatMap((e) => {
    const meta = metaById.get(e.schemeId);
    if (!meta) return [];
    return [
      {
        schemeId: e.schemeId,
        title: meta.title,
        slug: meta.slug,
        category: meta.categoryName ?? null,
        isUrgent: e.isUrgent,
        eligibilityScore: e.eligibilityScore,
        priorityScore: e.priorityScore,
        occupationMatch: e.occupationMatch,
      } satisfies RankedScheme,
    ];
  });
}

/** Resolve the cached ranking or build it fresh on a miss. */
async function resolveRanking(userId: string): Promise<readonly CachedScoredEntry[]> {
  const cached = getCachedRanking(userId);
  if (cached) return cached.orderedEntries;
  return buildAndCacheRanking(userId);
}

/** Applies the occupation-only filter, falling back to the unfiltered ranking if it would
 * otherwise return nothing (unknown occupation, or an occupation with no dedicated schemes). */
function applyRankingOptions(ranked: readonly CachedScoredEntry[], options?: RankingOptions): readonly CachedScoredEntry[] {
  if (!options?.occupationOnly) return ranked;
  const filtered = ranked.filter((e) => e.occupationMatch);
  return filtered.length > 0 ? filtered : ranked;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Paginated ranked schemes for the citizen dashboard.
 *
 * On the first call (or after a cache bust/TTL expiry), scores all published
 * schemes in a single in-memory pass (~6 DB queries total) and caches the
 * ordered entry list. Subsequent "Next page" requests slice the cached list and
 * hydrate only the requested `pageSize` rows — no rescoring.
 *
 * @param page     1-indexed page number (default 1)
 * @param pageSize records per page (default 8)
 */
export async function getRankedSchemesPage(userId: string, page = 1, pageSize = 8, options?: RankingOptions): Promise<PagedRanking> {
  const ranked = applyRankingOptions(await resolveRanking(userId), options);
  const totalCount = ranked.length;

  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  const pageEntries = ranked.slice(start, start + pageSize);
  const hasNextPage = start + pageSize < totalCount;

  const rankedSchemes = await hydrateEntries(pageEntries);
  return { schemes: rankedSchemes, totalCount, hasNextPage };
}

/**
 * Returns the top `limit` ranked schemes for the given user.
 * Used by the SMS notification path and any caller that doesn't need pagination.
 * Shares the same cache as getRankedSchemesPage.
 */
export async function getRankedSchemesForUser(userId: string, limit = 20, options?: RankingOptions): Promise<readonly RankedScheme[]> {
  const ranked = applyRankingOptions(await resolveRanking(userId), options);
  return hydrateEntries(ranked.slice(0, limit));
}
