import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../connection';
import { aiConversations, conversationMessages, schemes } from '../schema';
import { STOP_WORDS } from '../../lib/text/keywords';

export interface RetrievedSchemeContext {
  readonly title: string;
  readonly briefDescription: string;
  readonly eligibility: string | null;
  readonly benefits: string | null;
  readonly documentsRequired?: string | null;
  readonly applicationProcess?: string | null;
  readonly ministry?: string | null;
  readonly state?: string | null;
  readonly benefitType?: string | null;
  readonly applicationUrl?: string | null;
}

export class AssistantRepository {
  async getConversation(conversationId: string, userId: string) {
    const rows = await db
      .select()
      .from(aiConversations)
      .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId)))
      .limit(1);
    return rows[0];
  }

  async createConversation(userId: string, modelName: string, modelVersion: string, schemeId?: string) {
    const values: typeof aiConversations.$inferInsert = { userId, modelName, modelVersion };
    if (schemeId !== undefined) values.schemeId = schemeId;

    const [conversation] = await db.insert(aiConversations).values(values).returning();
    if (!conversation) throw new Error('Failed to create conversation');
    return conversation;
  }

  private async nextMessageIndex(conversationId: string): Promise<number> {
    const rows = await db
      .select({ value: sql<number>`coalesce(max(${conversationMessages.messageIndex}), -1) + 1`.mapWith(Number) })
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId));
    return rows[0]?.value ?? 0;
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system' | 'tool',
    content: string,
    extra?: Partial<Pick<typeof conversationMessages.$inferInsert, 'modelName' | 'modelVersion' | 'latencyMs' | 'responseStatus'>>,
  ) {
    const messageIndex = await this.nextMessageIndex(conversationId);
    const [message] = await db
      .insert(conversationMessages)
      .values({ conversationId, messageIndex, role, content, ...extra })
      .returning();

    await db
      .update(aiConversations)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(aiConversations.id, conversationId));

    return message;
  }

  async findSchemeContext(schemeId: string): Promise<RetrievedSchemeContext | undefined> {
    const rows = await db
      .select({
        title: schemes.schemeName,
        briefDescription: schemes.briefDescription,
        eligibility: schemes.eligibility,
        benefits: schemes.benefits,
        documentsRequired: schemes.documentsRequired,
        applicationProcess: schemes.applicationProcess,
        ministry: schemes.ministry,
        state: schemes.state,
        benefitType: schemes.benefitType,
        applicationUrl: schemes.applicationUrl,
      })
      .from(schemes)
      .where(eq(schemes.id, schemeId))
      .limit(1);
    return rows[0];
  }

  /**
   * Keyword retrieval over the flat scheme columns — used as the RAG context source for the
   * assistant. Deliberately avoids scheme_embeddings, since CSV-imported schemes never populate
   * that table; this works uniformly across both the legacy ingestion pipeline and CSV imports.
   */
  async retrieveRelevantSchemes(keywords: string[], limit = 5): Promise<readonly RetrievedSchemeContext[]> {
    const filteredTokens = keywords
      .map(k => k.toLowerCase().trim())
      .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

    const terms = filteredTokens.slice(0, 10);

    if (terms.length === 0) return [];

    const conditions = terms.flatMap((term) => {
      const like = `%${term}%`;
      return [
        ilike(schemes.schemeName, like),
        ilike(schemes.shortTitle, like),
        ilike(schemes.briefDescription, like),
        ilike(schemes.detailedDescription, like),
        ilike(schemes.eligibility, like),
        ilike(schemes.benefits, like),
        ilike(schemes.state, like),
        ilike(schemes.ministry, like),
        ilike(schemes.beneficiaryType, like),
        ilike(schemes.documentsRequired, like),
        ilike(schemes.applicationProcess, like),
      ];
    });

    const rows = await db
      .select({
        title: schemes.schemeName,
        briefDescription: schemes.briefDescription,
        eligibility: schemes.eligibility,
        benefits: schemes.benefits,
        documentsRequired: schemes.documentsRequired,
        applicationProcess: schemes.applicationProcess,
        ministry: schemes.ministry,
        state: schemes.state,
        benefitType: schemes.benefitType,
        applicationUrl: schemes.applicationUrl,
      })
      .from(schemes)
      .where(and(eq(schemes.publicationStatus, 'published'), or(...conditions)))
      .limit(limit);

    return rows;
  }
}

