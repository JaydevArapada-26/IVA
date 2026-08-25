/**
 * Deterministic eligibility/priority evaluator for schemes that have a `schemes_categorized` row
 * — the authoritative matching layer when present, ranked above the free-text flat-column
 * heuristic. Every comparison here is a plain rule check against structured columns; no AI
 * involved anywhere in this file.
 */
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { schemes, schemesCategorized } from '../../db/schema';
import type { EligibilityEvaluation, EligibilityResultStatus, ProfileSnapshot } from './engine';

export type CategorizedRow = typeof schemesCategorized.$inferSelect;

const INCOME_RANGE_CEILINGS: Record<string, number> = {
  lt_1_lakh: 100_000,
  '1_to_25_lakh': 250_000,
  '25_to_5_lakh': 500_000,
  '5_to_8_lakh': 800_000,
  gt_8_lakh: Number.POSITIVE_INFINITY,
};

/** Resolves the categorized row for a scheme — first by the FK set at import time, then falling
 * back to matching the scheme's own slug (covers a categorized row imported before the matching
 * canonical scheme existed, or a schemeId that was never resolved). */
export async function fetchCategorizedRowForScheme(schemeId: string): Promise<CategorizedRow | undefined> {
  const byFk = await db.select().from(schemesCategorized).where(eq(schemesCategorized.schemeId, schemeId)).limit(1);
  if (byFk[0]) return byFk[0];

  const [scheme] = await db.select({ slug: schemes.slug }).from(schemes).where(eq(schemes.id, schemeId)).limit(1);
  if (!scheme) return undefined;

  const bySlug = await db.select().from(schemesCategorized).where(eq(schemesCategorized.slug, scheme.slug)).limit(1);
  return bySlug[0];
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

interface Criterion {
  readonly label: string;
  readonly matched: boolean | null; // null = not applicable / could not be evaluated
}

function evaluateLocationCriteria(profile: ProfileSnapshot, row: CategorizedRow): Criterion[] {
  const criteria: Criterion[] = [];

  const stateNorm = normalize(row.state);
  if (stateNorm && !['all', 'all states', 'pan india', 'national'].includes(stateNorm)) {
    criteria.push({ label: 'State', matched: profile.state ? normalize(profile.state) === stateNorm : null });
  }

  const districtNorm = normalize(row.district);
  if (districtNorm && !['all', 'all districts'].includes(districtNorm)) {
    criteria.push({ label: 'District', matched: profile.district ? normalize(profile.district) === districtNorm : null });
  }

  return criteria;
}

function evaluateAgeCriterion(profile: ProfileSnapshot, row: CategorizedRow): Criterion | null {
  if (row.ageMinYears == null && row.ageMaxYears == null) return null;
  if (profile.age == null) return { label: 'Age range', matched: null };

  const aboveMin = row.ageMinYears == null || profile.age >= row.ageMinYears;
  const belowMax = row.ageMaxYears == null || profile.age <= row.ageMaxYears;
  return { label: 'Age range', matched: aboveMin && belowMax };
}

function evaluateGenderCriterion(profile: ProfileSnapshot, row: CategorizedRow): Criterion | null {
  const genderNorm = normalize(row.gender);
  if (!genderNorm || ['all', 'any', 'all genders'].includes(genderNorm)) return null;
  if (!profile.gender) return { label: 'Gender', matched: null };

  const profileGenderNorm = normalize(profile.gender);
  // DB stores lowercase enum values (male/female/transgender/other/prefer_not_to_say); CSV gender
  // is free text (e.g. "Male", "Female", "Transgender") — compare on the common prefix.
  return { label: 'Gender', matched: genderNorm === profileGenderNorm || genderNorm.startsWith(profileGenderNorm) || profileGenderNorm.startsWith(genderNorm) };
}

/**
 * Maps the 8-value profile occupation enum to the natural-language terms used in
 * `schemes_categorized.occupationCategory`. Multiple terms per enum value cover
 * the different ways the CSV authors named similar roles.
 *
 * Profile values with no mapping (`private_sector`) score 0 for occupation-restricted
 * schemes — correct behaviour, since no CSV category fits that group.
 */
const OCCUPATION_TO_CATEGORIZED_TERMS: Readonly<Record<string, readonly string[]>> = {
  farmer: ['farmer'],
  laborer: ['laborer / worker'],
  student: ['student'],
  self_employed: ['entrepreneur / business owner', 'artisan / craftsperson', 'artist / cultural worker'],
  unemployed: ['unemployed'],
  private_sector: [],
  government_sector: ['government employee'],
  homemaker: ['women / shg member', 'widow'],
};

export function evaluateOccupationCriterion(profile: ProfileSnapshot, row: CategorizedRow): Criterion | null {
  if (!row.occupationCategory) return null; // no occupation restriction → skip

  // Split the semicolon-separated list and normalise each entry (spacing around
  // the ';' is inconsistent in the CSV data — trim is essential).
  const schemeTerms = row.occupationCategory
    .split(';')
    .map((t) => t.trim().toLowerCase());

  // If the scheme is open to any occupation → not a discriminating criterion.
  if (schemeTerms.includes('general / any')) return null;

  if (!profile.occupation) return { label: 'Occupation', matched: null };

  // Resolved terms for this citizen's occupation enum value.
  const profileTerms: string[] = [...(OCCUPATION_TO_CATEGORIZED_TERMS[profile.occupation ?? ''] ?? [])];

  // Supplement with status-flag-derived terms so farmers who set farmerStatus=true
  // (but have occupation=self_employed) also match farmer schemes, and similarly
  // for students and senior citizens.
  if (profile.farmerStatus || profile.employmentStatus === 'farmer' || profile.employmentStatus === 'agricultural_worker') profileTerms.push('farmer');
  if (profile.studentStatus || profile.employmentStatus === 'student') profileTerms.push('student');
  if (profile.seniorCitizenStatus || (profile.age != null && profile.age >= 60) || profile.employmentStatus === 'retired') profileTerms.push('senior citizen');
  if (profile.disabilityStatus) profileTerms.push('person with disability');
  // SC/ST and BPL categories appear in occupation_category in some CSV rows —
  // match them via the category/income profile fields.
  if (profile.category === 'sc' || profile.category === 'st') profileTerms.push('scheduled caste / tribe');
  if (profile.incomeRange === 'lt_1_lakh' || profile.bplEwsStatus === 'bpl' || profile.bplEwsStatus === 'ews') profileTerms.push('bpl / economically weaker');
  if (profile.maritalStatus === 'widowed') profileTerms.push('widow');
  if (profile.employmentStatus === 'homemaker') profileTerms.push('women / shg member');

  const matched = schemeTerms.some((term) => profileTerms.includes(term));
  return { label: 'Occupation', matched };
}

function evaluateIncomeCriterion(profile: ProfileSnapshot, row: CategorizedRow): Criterion | null {
  if (row.annualIncomeLimitInr == null) return null;
  if (!profile.incomeRange) return { label: 'Income limit', matched: null };

  const profileCeiling = INCOME_RANGE_CEILINGS[profile.incomeRange];
  if (profileCeiling === undefined) return { label: 'Income limit', matched: null };

  const limit = Number(row.annualIncomeLimitInr);
  if (!Number.isFinite(limit)) return null;

  return { label: 'Income limit', matched: profileCeiling <= limit };
}

function evaluateDisabilityCriterion(profile: ProfileSnapshot, row: CategorizedRow): Criterion | null {
  if (!row.disabilityStatusRequired) return null;
  return { label: 'Disability requirement', matched: profile.disabilityStatus === true };
}

function evaluateBeneficiaryCriterion(profile: ProfileSnapshot, row: CategorizedRow): Criterion | null {
  const haystack = normalize(row.beneficiaryType);
  if (!haystack) return null;

  const flagKeywords: ReadonlyArray<[boolean | null, readonly string[]]> = [
    [profile.studentStatus || profile.employmentStatus === 'student', ['student', 'scholar']],
    [profile.farmerStatus || profile.employmentStatus === 'farmer' || profile.employmentStatus === 'agricultural_worker', ['farmer', 'agricultur', 'kisan']],
    [profile.seniorCitizenStatus || (profile.age != null && profile.age >= 60) || profile.employmentStatus === 'retired', ['senior citizen', 'elderly', 'pensioner']],
    [profile.disabilityStatus, ['disab', 'divyang', 'pwd']],
    [profile.maritalStatus === 'widowed', ['widow', 'destitute']],
    [profile.bplEwsStatus === 'bpl' || profile.bplEwsStatus === 'ews', ['bpl', 'ews', 'poor']],
    [profile.employmentStatus === 'unemployed', ['unemployed', 'youth']],
  ];

  const applicableFlags = flagKeywords.filter(([, keywords]) => keywords.some((k) => haystack.includes(k)));
  if (applicableFlags.length === 0) return null;

  return { label: 'Beneficiary type', matched: applicableFlags.some(([flag]) => flag === true) };
}

function evaluateDateWindowCriterion(row: CategorizedRow): Criterion | null {
  if (!row.schemeOpenDate && !row.schemeCloseDate) return null;
  const now = Date.now();
  const afterOpen = !row.schemeOpenDate || now >= new Date(row.schemeOpenDate).getTime();
  const beforeClose = !row.schemeCloseDate || now <= new Date(row.schemeCloseDate).getTime();
  return { label: 'Application window', matched: afterOpen && beforeClose };
}

const DOCUMENT_CRITERIA: ReadonlyArray<{
  readonly label: string;
  readonly required: (row: CategorizedRow) => boolean | null;
  readonly owned: (profile: ProfileSnapshot) => boolean | null;
}> = [
  { label: 'Aadhaar Card', required: (r) => r.docAadhaar, owned: (p) => p.docAadhaar },
  { label: 'PAN Card', required: (r) => r.docPan, owned: (p) => p.docPan },
  { label: 'Income Certificate', required: (r) => r.docIncome, owned: (p) => p.docIncome },
  { label: 'Caste Certificate', required: (r) => r.docCaste, owned: (p) => p.docCaste },
  { label: 'Domicile Certificate', required: (r) => r.docDomicile, owned: (p) => p.docDomicile },
  { label: 'Bank Passbook', required: (r) => r.docBank, owned: (p) => p.docBank },
  { label: 'Ration Card', required: (r) => r.docRation, owned: (p) => p.docRation },
  { label: 'Disability Certificate', required: (r) => r.docDisability, owned: (p) => p.docDisability },
  { label: 'Educational Marksheet', required: (r) => r.docEducational, owned: (p) => p.docEducational },
  { label: 'Land Document', required: (r) => r.docLand, owned: (p) => p.docLand },
];

/** One criterion per document the scheme explicitly requires (Doc_* = true) — matched when the
 * citizen has indicated they own it, unmatched (weaker match) when they haven't. Documents the
 * scheme doesn't require, or the citizen hasn't indicated either way, aren't scored at all. */
function evaluateDocumentCriteria(profile: ProfileSnapshot, row: CategorizedRow): Criterion[] {
  const criteria: Criterion[] = [];
  for (const doc of DOCUMENT_CRITERIA) {
    if (doc.required(row) !== true) continue;
    const owned = doc.owned(profile);
    criteria.push({ label: doc.label, matched: owned === null ? null : owned });
  }
  return criteria;
}

export function evaluateCategorizedMatch(profile: ProfileSnapshot, row: CategorizedRow): EligibilityEvaluation {
  const criteria = [
    ...evaluateLocationCriteria(profile, row),
    evaluateAgeCriterion(profile, row),
    evaluateGenderCriterion(profile, row),
    evaluateOccupationCriterion(profile, row),
    evaluateIncomeCriterion(profile, row),
    evaluateDisabilityCriterion(profile, row),
    evaluateBeneficiaryCriterion(profile, row),
    evaluateDateWindowCriterion(row),
    ...evaluateDocumentCriteria(profile, row),
  ].filter((c): c is Criterion => c !== null);

  const evaluated = criteria.filter((c) => c.matched !== null);
  if (evaluated.length === 0) {
    // No applicable (non-sentinel) criteria → score 0, not 0.5. A fully generic
    // scheme with no restrictions gives no evidence of a match; treating it as a
    // half-match would artificially inflate its ranking above specific schemes that
    // partially match real profile attributes.
    return {
      status: 'partial',
      score: 0,
      matchedRulesCount: 0,
      failedRulesCount: 0,
      summary: 'No specific categorized criteria could be checked for this scheme',
    };
  }

  const matched = evaluated.filter((c) => c.matched === true).length;
  const failed = evaluated.length - matched;
  const score = matched / evaluated.length;

  let status: EligibilityResultStatus;
  if (failed === 0) {
    status = 'eligible';
  } else if (matched === 0) {
    status = 'ineligible';
  } else {
    status = 'partial';
  }

  const summary =
    status === 'eligible'
      ? `Matches all ${evaluated.length} categorized criteria (${evaluated.map((c) => c.label).join(', ')})`
      : status === 'ineligible'
        ? `Does not match ${failed} of ${evaluated.length} categorized criteria`
        : `Matches ${matched} of ${evaluated.length} categorized criteria — may still qualify`;

  return { status, score, matchedRulesCount: matched, failedRulesCount: failed, summary };
}
