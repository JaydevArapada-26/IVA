/**
 * Deterministic eligibility heuristic for schemes that have no structured
 * scheme_eligibility_rule_sets (e.g. schemes imported from the flat CSV pipeline).
 *
 * Compares the user's active profile snapshot against the scheme's flat descriptive
 * columns (state, beneficiary_type, target_beneficiaries, eligibility text). Purely
 * rule-based — no AI involved — so it can feed the same downstream consumers
 * (priority engine, recommendations, SMS scheme selection) as the rule-engine path.
 */
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { schemes } from '../../db/schema';
import type { EligibilityEvaluation, EligibilityResultStatus, ProfileSnapshot } from './engine';

const INCOME_RANGE_CEILINGS: Record<string, number> = {
  lt_1_lakh: 100_000,
  '1_to_25_lakh': 250_000,
  '25_to_5_lakh': 500_000,
  '5_to_8_lakh': 800_000,
  gt_8_lakh: Number.POSITIVE_INFINITY,
};

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

interface Criterion {
  readonly label: string;
  readonly matched: boolean | null; // null = not applicable / could not be evaluated
}

function evaluateStateCriterion(profile: ProfileSnapshot, schemeState: string | null): Criterion | null {
  const stateNorm = normalize(schemeState);
  if (!stateNorm || stateNorm === 'all' || stateNorm === 'all states' || stateNorm === 'pan india' || stateNorm === 'national') {
    return null; // scheme is open to every state — not a discriminating criterion
  }
  if (!profile.state) return { label: 'State', matched: null };
  return { label: 'State', matched: normalize(profile.state) === stateNorm };
}

function evaluateBeneficiaryCriterion(profile: ProfileSnapshot, beneficiaryType: string | null, targetBeneficiaries: string | null): Criterion | null {
  const haystack = `${normalize(beneficiaryType)} ${normalize(targetBeneficiaries)}`.trim();
  if (!haystack) return null;

  const flagKeywords: ReadonlyArray<[boolean | null, readonly string[]]> = [
    [profile.studentStatus, ['student', 'scholar']],
    [profile.farmerStatus, ['farmer', 'agricultur']],
    [profile.seniorCitizenStatus, ['senior citizen', 'elderly', 'pensioner']],
    [profile.disabilityStatus, ['disab', 'divyang', 'pwd']],
  ];

  const applicableFlags = flagKeywords.filter(([, keywords]) => keywords.some((k) => haystack.includes(k)));
  if (applicableFlags.length === 0) {
    // Beneficiary text doesn't reference any of our tracked profile flags — treat as general/open.
    return null;
  }
  const matched = applicableFlags.some(([flag]) => flag === true);
  return { label: 'Beneficiary category', matched };
}

function evaluateIncomeCriterion(profile: ProfileSnapshot, eligibilityText: string | null, benefitsText: string | null): Criterion | null {
  const combined = `${eligibilityText ?? ''} ${benefitsText ?? ''}`;
  const match = combined.match(/(?:income|earn[^.]*?)[^\d₹]*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lakhs|crore)?/i);
  if (!match) return null;
  if (!profile.incomeRange) return { label: 'Income threshold', matched: null };

  const rawNumber = Number(match[1]!.replace(/,/g, ''));
  if (!Number.isFinite(rawNumber)) return null;
  const unit = (match[2] ?? '').toLowerCase();
  const thresholdRupees = unit.startsWith('lakh') ? rawNumber * 100_000 : unit.startsWith('crore') ? rawNumber * 10_000_000 : rawNumber;

  const profileCeiling = INCOME_RANGE_CEILINGS[profile.incomeRange];
  if (profileCeiling === undefined) return { label: 'Income threshold', matched: null };

  return { label: 'Income threshold', matched: profileCeiling <= thresholdRupees };
}

export interface FlatHeuristicSchemeColumns {
  readonly state: string | null;
  readonly beneficiaryType: string | null;
  readonly targetBeneficiaries: string | null;
  readonly eligibility: string | null;
  readonly benefits: string | null;
}

/** Pure — takes already-fetched scheme columns, no DB access. Used both by the single-scheme
 * async wrapper below and by bulk evaluators that fetch all schemes in one query upfront. */
export function evaluateFlatColumnHeuristicPure(profile: ProfileSnapshot, scheme: FlatHeuristicSchemeColumns): EligibilityEvaluation {
  const criteria = [
    evaluateStateCriterion(profile, scheme.state),
    evaluateBeneficiaryCriterion(profile, scheme.beneficiaryType, scheme.targetBeneficiaries),
    evaluateIncomeCriterion(profile, scheme.eligibility, scheme.benefits),
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
      summary: 'No specific eligibility criteria could be checked for this scheme',
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
      ? `Matches all ${evaluated.length} checked criteria (${evaluated.map((c) => c.label).join(', ')})`
      : status === 'ineligible'
        ? `Does not match ${failed} of ${evaluated.length} checked criteria`
        : `Matches ${matched} of ${evaluated.length} checked criteria — may still qualify`;

  return { status, score, matchedRulesCount: matched, failedRulesCount: failed, summary };
}

export async function evaluateFlatColumnHeuristic(profile: ProfileSnapshot, schemeId: string): Promise<EligibilityEvaluation> {
  const rows = await db
    .select({
      state: schemes.state,
      beneficiaryType: schemes.beneficiaryType,
      targetBeneficiaries: schemes.targetBeneficiaries,
      eligibility: schemes.eligibility,
      benefits: schemes.benefits,
    })
    .from(schemes)
    .where(eq(schemes.id, schemeId))
    .limit(1);

  const scheme = rows[0];
  if (!scheme) {
    return { status: 'unknown', score: 0, matchedRulesCount: 0, failedRulesCount: 0, summary: 'Scheme not found' };
  }

  return evaluateFlatColumnHeuristicPure(profile, scheme);
}
