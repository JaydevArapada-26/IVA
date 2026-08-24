import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { schemes, schemesCategorized } from '../schema';
import { parseCsv } from '../../lib/text';

export interface CategorizedImportResult {
  readonly rowNumber: number;
  readonly status: 'imported' | 'updated' | 'invalid';
  readonly slug?: string;
  readonly errorMessage?: string;
}

/**
 * Required CSV header for `schemes_categorized.csv` — the deterministic matching-layer import,
 * separate from `schemes.csv`'s canonical descriptive import. No column-mapping/human review
 * step, same as the canonical import.
 */
const CATEGORIZED_CSV_COLUMNS = [
  'slug',
  'scheme_name',
  'level',
  'state',
  'district',
  'age_min_years',
  'age_max_years',
  'gender',
  'occupation_category',
  'annual_income_limit_inr',
  'disability_status_required',
  'doc_aadhaar_card',
  'doc_pan_card',
  'doc_income_certificate',
  'doc_caste_certificate',
  'doc_domicile_certificate',
  'doc_bank_passbook',
  'doc_ration_card',
  'doc_disability_certificate',
  'doc_educational_marksheet',
  'doc_land_document',
  'beneficiary_type',
  'categories',
  'benefit_type',
  'application_mode',
  'scheme_open_date',
  'scheme_close_date',
  'brief_description',
  'eligibility_raw',
  'documents_required_raw',
  'source_url',
] as const;

function parseBoolean(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['true', 'yes', '1', 'y'].includes(normalized)) return true;
  if (['false', 'no', '0', 'n'].includes(normalized)) return false;
  return undefined;
}

function parseInteger(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNumeric(value: string): string | undefined {
  const trimmed = value.trim().replace(/[,₹]/g, '');
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : undefined;
}

function parseDate(value: string): Date | undefined {
  if (!value.trim()) return undefined;
  const parsed = new Date(value.trim());
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function splitList(value: string): string[] | undefined {
  const items = value
    .split(';')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  return items.length > 0 ? items : undefined;
}

export class SchemeCategorizedRepository {
  async findBySchemeId(schemeId: string) {
    const rows = await db.select().from(schemesCategorized).where(eq(schemesCategorized.schemeId, schemeId)).limit(1);
    return rows[0];
  }

  async findBySlug(slug: string) {
    const rows = await db.select().from(schemesCategorized).where(eq(schemesCategorized.slug, slug)).limit(1);
    return rows[0];
  }

  /**
   * Parses `schemes_categorized.csv` (exact CATEGORIZED_CSV_COLUMNS header) and upserts each row
   * by slug — re-importing an updated file refreshes existing rows rather than duplicating them.
   * Resolves `schemeId` by matching against `schemes.slug` at import time when possible.
   */
  async importCategorizedCsv(csvText: string): Promise<CategorizedImportResult[]> {
    const rows = parseCsv(csvText);
    if (rows.length === 0) return [];

    const header = (rows[0] ?? []).map((cell) => cell.trim().toLowerCase());
    const headerMatches =
      CATEGORIZED_CSV_COLUMNS.length === header.length &&
      CATEGORIZED_CSV_COLUMNS.every((col, idx) => header[idx] === col);
    if (!headerMatches) {
      throw new Error(
        `CSV header must be exactly: ${CATEGORIZED_CSV_COLUMNS.join(', ')}. Received: ${header.join(', ') || '(empty)'}`,
      );
    }

    const dataRows = rows.slice(1);
    const results: CategorizedImportResult[] = [];

    for (let i = 0; i < dataRows.length; i += 1) {
      const rowNumber = i + 2; // account for header row, 1-indexed
      const cells = dataRows[i] ?? [];
      const record: Record<string, string> = {};
      header.forEach((key, idx) => {
        record[key] = (cells[idx] ?? '').trim();
      });

      const slug = record.slug;
      const schemeName = record.scheme_name;
      if (!slug || !schemeName) {
        results.push({
          rowNumber,
          status: 'invalid',
          errorMessage: `Missing required field(s): ${[!slug && 'slug', !schemeName && 'scheme_name'].filter(Boolean).join(', ')}`,
        });
        continue;
      }

      try {
        const [matchingScheme] = await db.select({ id: schemes.id }).from(schemes).where(eq(schemes.slug, slug)).limit(1);

        const ageMinYears = parseInteger(record.age_min_years ?? '');
        const ageMaxYears = parseInteger(record.age_max_years ?? '');
        const annualIncomeLimitInr = parseNumeric(record.annual_income_limit_inr ?? '');
        const docAadhaar = parseBoolean(record.doc_aadhaar_card ?? '');
        const docPan = parseBoolean(record.doc_pan_card ?? '');
        const docIncome = parseBoolean(record.doc_income_certificate ?? '');
        const docCaste = parseBoolean(record.doc_caste_certificate ?? '');
        const docDomicile = parseBoolean(record.doc_domicile_certificate ?? '');
        const docBank = parseBoolean(record.doc_bank_passbook ?? '');
        const docRation = parseBoolean(record.doc_ration_card ?? '');
        const docDisability = parseBoolean(record.doc_disability_certificate ?? '');
        const docEducational = parseBoolean(record.doc_educational_marksheet ?? '');
        const docLand = parseBoolean(record.doc_land_document ?? '');
        const categories = splitList(record.categories ?? '');
        const schemeOpenDate = parseDate(record.scheme_open_date ?? '');
        const schemeCloseDate = parseDate(record.scheme_close_date ?? '');

        const values: typeof schemesCategorized.$inferInsert = {
          slug,
          schemeName,
          ...(matchingScheme ? { schemeId: matchingScheme.id } : {}),
          ...(record.level ? { level: record.level } : {}),
          ...(record.state ? { state: record.state } : {}),
          ...(record.district ? { district: record.district } : {}),
          ...(ageMinYears !== undefined ? { ageMinYears } : {}),
          ...(ageMaxYears !== undefined ? { ageMaxYears } : {}),
          ...(record.gender ? { gender: record.gender } : {}),
          ...(record.occupation_category ? { occupationCategory: record.occupation_category } : {}),
          ...(annualIncomeLimitInr !== undefined ? { annualIncomeLimitInr } : {}),
          disabilityStatusRequired: parseBoolean(record.disability_status_required ?? '') ?? false,
          ...(docAadhaar !== undefined ? { docAadhaar } : {}),
          ...(docPan !== undefined ? { docPan } : {}),
          ...(docIncome !== undefined ? { docIncome } : {}),
          ...(docCaste !== undefined ? { docCaste } : {}),
          ...(docDomicile !== undefined ? { docDomicile } : {}),
          ...(docBank !== undefined ? { docBank } : {}),
          ...(docRation !== undefined ? { docRation } : {}),
          ...(docDisability !== undefined ? { docDisability } : {}),
          ...(docEducational !== undefined ? { docEducational } : {}),
          ...(docLand !== undefined ? { docLand } : {}),
          ...(record.beneficiary_type ? { beneficiaryType: record.beneficiary_type } : {}),
          ...(categories ? { categories } : {}),
          ...(record.benefit_type ? { benefitType: record.benefit_type } : {}),
          ...(record.application_mode ? { applicationMode: record.application_mode } : {}),
          ...(schemeOpenDate ? { schemeOpenDate } : {}),
          ...(schemeCloseDate ? { schemeCloseDate } : {}),
          ...(record.brief_description ? { briefDescription: record.brief_description } : {}),
          ...(record.eligibility_raw ? { eligibilityRaw: record.eligibility_raw } : {}),
          ...(record.documents_required_raw ? { documentsRequiredRaw: record.documents_required_raw } : {}),
          ...(record.source_url ? { sourceUrl: record.source_url } : {}),
        };

        const [existing] = await db.select({ id: schemesCategorized.id }).from(schemesCategorized).where(eq(schemesCategorized.slug, slug)).limit(1);

        if (existing) {
          await db
            .update(schemesCategorized)
            .set({ ...values, updatedAt: new Date() })
            .where(eq(schemesCategorized.id, existing.id));
          results.push({ rowNumber, status: 'updated', slug });
        } else {
          await db.insert(schemesCategorized).values(values);
          results.push({ rowNumber, status: 'imported', slug });
        }
      } catch (error) {
        results.push({
          rowNumber,
          status: 'invalid',
          slug,
          errorMessage: error instanceof Error ? error.message : 'Failed to import row',
        });
      }
    }

    return results;
  }
}
