import { createHash } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { db } from '../connection';
import { importItems, importSessions, reviewQueue, schemes } from '../schema';
import { extractTitleAndSummary, parseCsv, slugify } from '../../lib/text';

type ImportItemStatus = (typeof importItems.$inferInsert)['status'];

export class IngestionRepository {
  async createSession(adminUserId: string, urls: readonly string[]) {
    const fileHash = createHash('sha256')
      .update(`${urls.join('\n')}::${Date.now()}::${Math.random()}`)
      .digest('hex');

    const [session] = await db
      .insert(importSessions)
      .values({
        uploadedByAdminUserId: adminUserId,
        fileName: urls.length === 1 ? (urls[0] ?? 'url-import') : `bulk-prep-${urls.length}-urls`,
        filePath: urls.join('\n'),
        fileHash,
        mimeType: 'text/uri-list',
        totalRows: urls.length,
        status: 'processing',
        startedAt: new Date(),
      })
      .returning();

    if (!session) throw new Error('Failed to create import session');
    return session;
  }

  async completeSession(sessionId: string, successfulRows: number, failedRows: number) {
    await db
      .update(importSessions)
      .set({
        processedRows: successfulRows + failedRows,
        successfulRows,
        failedRows,
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(importSessions.id, sessionId));
  }

  /** Fetches a single URL, best-effort extracts a title/summary via regex (no HTML parser
   * dependency per task scope), and records honest confidence: low when extraction is thin,
   * and always routes into review_queue as needs_review rather than pretending completion. */
  async ingestUrl(sessionId: string, rowNumber: number, url: string) {
    const sourceRowHash = createHash('sha256').update(url).digest('hex');
    let extractedTitle: string | undefined;
    let extractedSummary: string | undefined;
    let status: ImportItemStatus = 'needs_review';
    let errorMessage: string | undefined;
    let confidence = 0.1;

    try {
      const response = await fetch(url, { redirect: 'follow' });
      const html = await response.text();
      const extracted = extractTitleAndSummary(html);
      extractedTitle = extracted.title;
      extractedSummary = extracted.summary;

      if (extractedTitle && extractedSummary) confidence = 0.6;
      else if (extractedTitle || extractedSummary) confidence = 0.3;

      if (!response.ok) {
        errorMessage = `Fetched with HTTP ${response.status}`;
      }
    } catch (error) {
      status = 'extraction_failed';
      errorMessage = error instanceof Error ? error.message : 'Failed to fetch URL';
      confidence = 0;
    }

    const insertValues: typeof importItems.$inferInsert = {
      importSessionId: sessionId,
      rowNumber,
      sourceRowHash,
      status,
      sourceRowData: { url },
      extractedOfficialUrl: url,
      extractionConfidence: confidence.toFixed(2),
    };
    if (extractedTitle !== undefined) insertValues.extractedTitle = extractedTitle;
    if (extractedSummary !== undefined) insertValues.extractedSummary = extractedSummary;
    if (errorMessage !== undefined) insertValues.errorMessage = errorMessage;

    const [item] = await db.insert(importItems).values(insertValues).returning();
    if (!item) throw new Error('Failed to create import item');

    const reviewValues: typeof reviewQueue.$inferInsert = {
      sourceType: 'import_item',
      importItemId: item.id,
      status: status === 'extraction_failed' ? 'extraction_failed' : 'needs_review',
      confidenceScore: confidence.toFixed(2),
    };
    if (errorMessage !== undefined) reviewValues.extractionError = errorMessage;

    await db.insert(reviewQueue).values(reviewValues);

    return item;
  }

  async listItems(limit = 300) {
    return db.select().from(importItems).orderBy(desc(importItems.createdAt)).limit(limit);
  }

  /**
   * Required CSV header, in the exact order the flat `schemes` table columns are meant to be
   * populated from — no other shape is accepted (no human review / column-mapping step).
   */
  static readonly SCHEME_CSV_COLUMNS = [
    'slug',
    'scheme_name',
    'short_title',
    'level',
    'state',
    'ministry',
    'department',
    'beneficiary_type',
    'target_beneficiaries',
    'benefit_type',
    'categories',
    'sub_categories',
    'tags',
    'brief_description',
    'detailed_description',
    'benefits',
    'eligibility',
    'exclusions',
    'application_mode',
    'application_process',
    'documents_required',
    'references',
    'scheme_open_date',
    'scheme_close_date',
    'dbt_scheme',
    'faq_count',
    'source_url',
  ] as const;

  private static splitList(value: string): string[] | undefined {
    const items = value
      .split(';')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    return items.length > 0 ? items : undefined;
  }

  private static parseDate(value: string): Date | undefined {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private static parseBoolean(value: string): boolean {
    return ['true', 'yes', '1', 'y'].includes(value.trim().toLowerCase());
  }

  /**
   * Parses a flat scheme CSV (exactly the SCHEME_CSV_COLUMNS header) and inserts every valid
   * row directly as a published scheme — no review-queue detour, no column mapping/human review,
   * no manual publish step.
   */
  async importCanonicalCsv(csvText: string) {
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      return [];
    }

    const header = (rows[0] ?? []).map((cell) => cell.trim().toLowerCase());
    const expected = IngestionRepository.SCHEME_CSV_COLUMNS;
    const headerMatches = expected.length === header.length && expected.every((col, idx) => header[idx] === col);
    if (!headerMatches) {
      throw new Error(
        `CSV header must be exactly: ${expected.join(', ')}. Received: ${header.join(', ') || '(empty)'}`,
      );
    }

    const dataRows = rows.slice(1);
    const results: Array<{
      rowNumber: number;
      status: 'imported' | 'invalid';
      extractedTitle?: string;
      errorMessage?: string;
    }> = [];

    for (let i = 0; i < dataRows.length; i += 1) {
      const rowNumber = i + 2; // account for header row, 1-indexed
      const cells = dataRows[i] ?? [];
      const record: Record<string, string> = {};
      header.forEach((key, idx) => {
        record[key] = (cells[idx] ?? '').trim();
      });

      const slugRaw = record.slug || slugify(record.scheme_name || '');
      const schemeName = record.scheme_name ?? '';
      const briefDescription = record.brief_description ?? '';
      const detailedDescription = record.detailed_description ?? '';
      const sourceUrl = record.source_url ?? '';

      const missing: string[] = [];
      if (!slugRaw) missing.push('slug');
      if (!schemeName) missing.push('scheme_name');
      if (!briefDescription) missing.push('brief_description');
      if (!detailedDescription) missing.push('detailed_description');
      if (!sourceUrl) missing.push('source_url');

      if (missing.length > 0) {
        results.push({
          rowNumber,
          status: 'invalid',
          errorMessage: `Missing required field(s): ${missing.join(', ')}`,
          ...(schemeName ? { extractedTitle: schemeName } : {}),
        });
        continue;
      }

      try {
        const slug = `${slugRaw}-${Date.now().toString(36)}-${rowNumber}`;
        const faqCountParsed = record.faq_count ? Number.parseInt(record.faq_count, 10) : NaN;

        const [scheme] = await db
          .insert(schemes)
          .values({
            slug,
            schemeName,
            ...(record.short_title ? { shortTitle: record.short_title } : {}),
            ...(record.level ? { level: record.level } : {}),
            ...(record.state ? { state: record.state } : {}),
            ...(record.ministry ? { ministry: record.ministry } : {}),
            ...(record.department ? { department: record.department } : {}),
            ...(record.beneficiary_type ? { beneficiaryType: record.beneficiary_type } : {}),
            ...(record.target_beneficiaries ? { targetBeneficiaries: record.target_beneficiaries } : {}),
            ...(record.benefit_type ? { benefitType: record.benefit_type } : {}),
            ...(IngestionRepository.splitList(record.categories ?? '') ? { categories: IngestionRepository.splitList(record.categories ?? '') } : {}),
            ...(IngestionRepository.splitList(record.sub_categories ?? '')
              ? { subCategories: IngestionRepository.splitList(record.sub_categories ?? '') }
              : {}),
            ...(IngestionRepository.splitList(record.tags ?? '') ? { tags: IngestionRepository.splitList(record.tags ?? '') } : {}),
            briefDescription,
            detailedDescription,
            ...(record.benefits ? { benefits: record.benefits } : {}),
            ...(record.eligibility ? { eligibility: record.eligibility } : {}),
            ...(record.exclusions ? { exclusions: record.exclusions } : {}),
            ...(record.application_mode ? { applicationMode: record.application_mode } : {}),
            ...(record.application_process ? { applicationProcess: record.application_process } : {}),
            ...(record.documents_required ? { documentsRequired: record.documents_required } : {}),
            ...(record.references ? { references: record.references } : {}),
            ...(IngestionRepository.parseDate(record.scheme_open_date ?? '')
              ? { schemeOpenDate: IngestionRepository.parseDate(record.scheme_open_date ?? '') }
              : {}),
            ...(IngestionRepository.parseDate(record.scheme_close_date ?? '')
              ? { schemeCloseDate: IngestionRepository.parseDate(record.scheme_close_date ?? '') }
              : {}),
            dbtScheme: IngestionRepository.parseBoolean(record.dbt_scheme ?? ''),
            ...(Number.isFinite(faqCountParsed) ? { faqCount: faqCountParsed } : {}),
            sourceUrl,
            // CSV-imported schemes are trusted, already-vetted data — auto-publish immediately
            // rather than landing in draft and requiring a manual publish click for every row.
            publicationStatus: 'published',
            publishedAt: new Date(),
          })
          .returning();

        if (!scheme) throw new Error('Insert returned no row');

        results.push({ rowNumber, status: 'imported', extractedTitle: schemeName });
      } catch (error) {
        results.push({
          rowNumber,
          status: 'invalid',
          extractedTitle: schemeName,
          errorMessage: error instanceof Error ? error.message : 'Failed to insert scheme',
        });
      }
    }

    return results;
  }
}
