import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../connection';
import { savedSchemes, schemes } from '../schema';

export class SavedSchemeRepository {
  /** Returns all saved scheme IDs (and summary data) for a citizen user. */
  async listForUser(userId: string) {
    return db
      .select({
        savedSchemeId: savedSchemes.id,
        schemeId: savedSchemes.schemeId,
        savedAt: savedSchemes.savedAt,
        schemeSlug: schemes.slug,
        schemeTitle: schemes.schemeName,
        schemeSummary: schemes.briefDescription,
        schemeOfficialUrl: schemes.sourceUrl,
      })
      .from(savedSchemes)
      .innerJoin(schemes, eq(savedSchemes.schemeId, schemes.id))
      .where(and(eq(savedSchemes.userId, userId)))
      .orderBy(desc(savedSchemes.savedAt));
  }

  /** Returns a Set of scheme IDs that are currently saved by the user — used to render
   *  save/unsave icon state on the scheme list / recommendation cards. */
  async getSavedIdSet(userId: string): Promise<Set<string>> {
    const rows = await db
      .select({ schemeId: savedSchemes.schemeId })
      .from(savedSchemes)
      .where(eq(savedSchemes.userId, userId));
    return new Set(rows.map((r) => r.schemeId));
  }

  /** Saves a scheme for the user. No-ops gracefully if already saved (unique constraint). */
  async save(userId: string, schemeId: string) {
    const existing = await db
      .select({ id: savedSchemes.id })
      .from(savedSchemes)
      .where(and(eq(savedSchemes.userId, userId), eq(savedSchemes.schemeId, schemeId)))
      .limit(1);
    if (existing.length > 0) return;

    await db.insert(savedSchemes).values({
      userId,
      schemeId,
      source: 'manual',
      savedAt: new Date(),
    });
  }

  /** Removes a saved scheme. Safe to call even if not currently saved. */
  async unsave(userId: string, schemeId: string) {
    await db
      .delete(savedSchemes)
      .where(and(eq(savedSchemes.userId, userId), eq(savedSchemes.schemeId, schemeId)));
  }

  /** Checks whether a specific scheme is saved by the user. */
  async isSaved(userId: string, schemeId: string): Promise<boolean> {
    const rows = await db
      .select({ id: savedSchemes.id })
      .from(savedSchemes)
      .where(and(eq(savedSchemes.userId, userId), eq(savedSchemes.schemeId, schemeId)))
      .limit(1);
    return rows.length > 0;
  }
}
