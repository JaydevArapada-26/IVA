import { boolean, date, index, integer, numeric, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { createdAtColumn, updatedAtColumn, uuidPk } from '../helpers';
import { schemes } from './schemes';

/**
 * Deterministic matching layer imported from `schemes_categorized.csv` — a second, structured
 * dataset layered on top of the descriptive `schemes` table (which keeps coming from
 * `schemes.csv`). This table is the authoritative source for profile-based priority scoring
 * when a row exists for a scheme; schemes without one fall back to the flat-column heuristic on
 * `schemes` itself. Never touched by Gemini — ranking/eligibility off this table is 100%
 * deterministic comparisons.
 */
export const schemesCategorized = pgTable(
  'schemes_categorized',
  {
    id: uuidPk(),
    // Nullable: resolved by matching slug against `schemes.slug` at import time. If the matching
    // scheme is imported later, the FK stays null and lookups fall back to matching by slug.
    schemeId: uuid('scheme_id').references(() => schemes.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    schemeName: text('scheme_name').notNull(),
    level: text('level'),
    state: text('state'),
    district: text('district'),
    ageMinYears: integer('age_min_years'),
    ageMaxYears: integer('age_max_years'),
    gender: text('gender'),
    occupationCategory: text('occupation_category'),
    annualIncomeLimitInr: numeric('annual_income_limit_inr', { precision: 14, scale: 2 }),
    disabilityStatusRequired: boolean('disability_status_required').notNull().default(false),
    docAadhaar: boolean('doc_aadhaar'),
    docPan: boolean('doc_pan'),
    docIncome: boolean('doc_income'),
    docCaste: boolean('doc_caste'),
    docDomicile: boolean('doc_domicile'),
    docBank: boolean('doc_bank'),
    docRation: boolean('doc_ration'),
    docDisability: boolean('doc_disability'),
    docEducational: boolean('doc_educational'),
    docLand: boolean('doc_land'),
    beneficiaryType: text('beneficiary_type'),
    categories: text('categories').array(),
    benefitType: text('benefit_type'),
    applicationMode: text('application_mode'),
    schemeOpenDate: date('scheme_open_date', { mode: 'date' }),
    schemeCloseDate: date('scheme_close_date', { mode: 'date' }),
    briefDescription: text('brief_description'),
    eligibilityRaw: text('eligibility_raw'),
    documentsRequiredRaw: text('documents_required_raw'),
    sourceUrl: text('source_url'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    slugUnique: uniqueIndex('schemes_categorized_slug_unique').on(table.slug),
    schemeIdx: index('schemes_categorized_scheme_id_idx').on(table.schemeId),
    stateIdx: index('schemes_categorized_state_idx').on(table.state),
  }),
);
