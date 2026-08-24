/**
 * In-process TTL cache for per-citizen ranked scheme entry lists.
 *
 * Stores ordered `{ schemeId, priorityScore, eligibilityScore, isUrgent }` arrays
 * so the pagination layer can slice without re-scoring, then hydrate only the
 * requested page from the DB.
 *
 * Single-instance caveat: this cache lives in process memory. On a multi-instance
 * deployment behind a load balancer, each instance keeps its own cache —
 * re-scoring can happen once per instance on cold cache, but no stale or wrong
 * data is ever served. When Redis is added, replace the three exported functions
 * with Redis get/set/del calls; all callers stay unchanged.
 */

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface CachedScoredEntry {
  readonly schemeId: string;
  readonly priorityScore: number;
  readonly eligibilityScore: number;
  readonly isUrgent: boolean;
  readonly occupationMatch: boolean;
}

interface RankingCacheEntry {
  readonly orderedEntries: readonly CachedScoredEntry[];
  readonly totalCount: number;
  readonly cachedAt: number;
}

const rankingCache = new Map<string, RankingCacheEntry>();

export function getCachedRanking(userId: string): RankingCacheEntry | null {
  const entry = rankingCache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    rankingCache.delete(userId);
    return null;
  }
  return entry;
}

export function setCachedRanking(userId: string, orderedEntries: readonly CachedScoredEntry[]): void {
  rankingCache.set(userId, {
    orderedEntries,
    totalCount: orderedEntries.length,
    cachedAt: Date.now(),
  });
}

/**
 * Removes the cached ranking for a user, forcing a full re-score on the next
 * dashboard request. Call this whenever the citizen's profile or documents change.
 */
export function bustRankingCache(userId: string): void {
  rankingCache.delete(userId);
}
