import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import {
  governmentDepartments,
  schemeBenefits,
  schemeCategories,
  schemeDocuments,
  schemeFaqs,
  schemeSources,
  schemeTagMaps,
  schemeTags,
  schemes,
} from '../schema/schemes';

export interface SchemeListFilters {
  readonly search?: string;
  readonly categorySlug?: string;
  readonly department?: string;
  readonly limit?: number;
  readonly offset?: number;
}

const schemeSummaryColumns = {
  id: schemes.id,
  slug: schemes.slug,
  title: schemes.schemeName,
  shortTitle: schemes.shortTitle,
  summary: schemes.briefDescription,
  officialUrl: schemes.sourceUrl,
  isUrgent: schemes.isUrgent,
  isVerified: schemes.isVerified,
  publicationStatus: schemes.publicationStatus,
  publishedAt: schemes.publishedAt,
  updatedAt: schemes.updatedAt,
  categoryName: schemeCategories.name,
  categorySlug: schemeCategories.slug,
  departmentName: governmentDepartments.name,
};

export class SchemeRepository extends BaseRepository<typeof schemes> {
  constructor() {
    super(schemes);
  }

  async findBySlug(slug: string) {
    return this.db.select().from(this.table).where(eq(this.table.slug, slug)).limit(1);
  }

  async findById(id: string) {
    return this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
  }

  async listPublished(filters: SchemeListFilters) {
    const conditions: SQL[] = [eq(schemes.publicationStatus, 'published')];

    if (filters.search && filters.search.trim().length > 0) {
      const term = `%${filters.search.trim()}%`;
      const searchCondition = or(ilike(schemes.schemeName, term), ilike(schemes.briefDescription, term));
      if (searchCondition) conditions.push(searchCondition);
    }
    if (filters.categorySlug) {
      conditions.push(eq(schemeCategories.slug, filters.categorySlug));
    }
    if (filters.department) {
      conditions.push(eq(governmentDepartments.slug, filters.department));
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    return this.db
      .select(schemeSummaryColumns)
      .from(schemes)
      .leftJoin(schemeCategories, eq(schemes.categoryId, schemeCategories.id))
      .leftJoin(governmentDepartments, eq(schemes.departmentId, governmentDepartments.id))
      .where(and(...conditions))
      .orderBy(desc(schemes.publishedAt), desc(schemes.createdAt))
      .limit(limit + 1)
      .offset(offset);
  }

  async listAllForAdmin() {
    return this.db
      .select(schemeSummaryColumns)
      .from(schemes)
      .leftJoin(schemeCategories, eq(schemes.categoryId, schemeCategories.id))
      .leftJoin(governmentDepartments, eq(schemes.departmentId, governmentDepartments.id))
      .orderBy(desc(schemes.updatedAt));
  }

  async findAdminRecordById(id: string) {
    const rows = await this.db
      .select(schemeSummaryColumns)
      .from(schemes)
      .leftJoin(schemeCategories, eq(schemes.categoryId, schemeCategories.id))
      .leftJoin(governmentDepartments, eq(schemes.departmentId, governmentDepartments.id))
      .where(eq(schemes.id, id))
      .limit(1);
    return rows[0];
  }

  async findDetailBySlug(slug: string) {
    const rows = await this.db
      .select(schemeSummaryColumns)
      .from(schemes)
      .leftJoin(schemeCategories, eq(schemes.categoryId, schemeCategories.id))
      .leftJoin(governmentDepartments, eq(schemes.departmentId, governmentDepartments.id))
      .where(eq(schemes.slug, slug))
      .limit(1);

    const summary = rows[0];
    if (!summary) return undefined;

    const [scheme] = await this.db.select().from(schemes).where(eq(schemes.id, summary.id)).limit(1);
    if (!scheme) return undefined;

    const [benefits, documents, faqs, sources, tags] = await Promise.all([
      this.db
        .select()
        .from(schemeBenefits)
        .where(eq(schemeBenefits.schemeId, scheme.id))
        .orderBy(asc(schemeBenefits.sortOrder)),
      this.db
        .select()
        .from(schemeDocuments)
        .where(eq(schemeDocuments.schemeId, scheme.id))
        .orderBy(asc(schemeDocuments.sortOrder)),
      this.db.select().from(schemeFaqs).where(eq(schemeFaqs.schemeId, scheme.id)).orderBy(asc(schemeFaqs.sortOrder)),
      this.db.select().from(schemeSources).where(eq(schemeSources.schemeId, scheme.id)),
      this.db
        .select({ name: schemeTags.name })
        .from(schemeTagMaps)
        .innerJoin(schemeTags, eq(schemeTagMaps.tagId, schemeTags.id))
        .where(eq(schemeTagMaps.schemeId, scheme.id)),
    ]);

    return { summary, scheme, benefits, documents, faqs, sources, tags };
  }

  async categoriesWithPublishedCounts() {
    return this.db
      .select({
        id: schemeCategories.id,
        name: schemeCategories.name,
        slug: schemeCategories.slug,
        schemeCount: sql<number>`count(${schemes.id}) filter (where ${schemes.publicationStatus} = 'published')`.mapWith(
          Number,
        ),
      })
      .from(schemeCategories)
      .leftJoin(schemes, eq(schemes.categoryId, schemeCategories.id))
      .where(eq(schemeCategories.isActive, true))
      .groupBy(schemeCategories.id, schemeCategories.name, schemeCategories.slug)
      .orderBy(asc(schemeCategories.sortOrder));
  }

  async setPublicationStatus(
    id: string,
    values: Partial<Pick<typeof schemes.$inferInsert, 'publicationStatus' | 'publishedAt' | 'archivedAt'>>,
  ) {
    const [updated] = await this.db
      .update(schemes)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(schemes.id, id))
      .returning();
    return updated;
  }

  async findSummariesByIds(ids: readonly string[]) {
    if (ids.length === 0) return [];
    return this.db
      .select(schemeSummaryColumns)
      .from(schemes)
      .leftJoin(schemeCategories, eq(schemes.categoryId, schemeCategories.id))
      .leftJoin(governmentDepartments, eq(schemes.departmentId, governmentDepartments.id))
      .where(inArray(schemes.id, ids));
  }

  /** Full flat-column row for the admin detail/edit view — bypasses the summary projection. */
  async findFullById(id: string) {
    const rows = await this.db.select().from(schemes).where(eq(schemes.id, id)).limit(1);
    return rows[0];
  }

  /**
   * Bulk metadata for every published scheme — one query, used by SchemeRecommendationService
   * (lib/recommendation/service.ts) as the join target for the eligibility engine's bulk
   * evaluation (which returns scoring but not display/searchable text). Deliberately a flat
   * projection, not the full row, so the recommendation service isn't tempted to reach past its
   * intended fields.
   */
  async listPublishedForRecommendation() {
    return this.db
      .select({
        id: schemes.id,
        slug: schemes.slug,
        title: schemes.schemeName,
        shortTitle: schemes.shortTitle,
        briefDescription: schemes.briefDescription,
        eligibility: schemes.eligibility,
        benefits: schemes.benefits,
        documentsRequired: schemes.documentsRequired,
        applicationProcess: schemes.applicationProcess,
        ministry: schemes.ministry,
        state: schemes.state,
        beneficiaryType: schemes.beneficiaryType,
        targetBeneficiaries: schemes.targetBeneficiaries,
        categories: schemes.categories,
        tags: schemes.tags,
        benefitType: schemes.benefitType,
        applicationUrl: schemes.applicationUrl,
        sourceUrl: schemes.sourceUrl,
        schemeCloseDate: schemes.schemeCloseDate,
        isUrgent: schemes.isUrgent,
        publishedAt: schemes.publishedAt,
      })
      .from(schemes)
      .where(eq(schemes.publicationStatus, 'published'));
  }

  async createScheme(values: typeof schemes.$inferInsert) {
    const [created] = await this.db.insert(schemes).values(values).returning();
    if (!created) throw new Error('Failed to create scheme');
    return created;
  }

  async updateScheme(id: string, values: Partial<typeof schemes.$inferInsert>) {
    const [updated] = await this.db
      .update(schemes)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(schemes.id, id))
      .returning();
    return updated;
  }

  /** Hard delete — admin panel has direct control of the table, no soft-delete recovery path. */
  async deleteScheme(id: string) {
    const [deleted] = await this.db.delete(schemes).where(eq(schemes.id, id)).returning();
    return deleted;
  }

  async deleteSchemes(ids: readonly string[]) {
    if (ids.length === 0) return [];
    return this.db.delete(schemes).where(inArray(schemes.id, ids)).returning();
  }
}
