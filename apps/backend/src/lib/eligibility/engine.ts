/**
 * Pure eligibility evaluation engine.
 *
 * Reads scheme_eligibility_rule_sets → rule_groups → rules → rule_values from the DB
 * and evaluates them against a user's active profile version. No AI, no HTTP —
 * purely deterministic rule matching.
 *
 * When a scheme has no active structured rule set (e.g. CSV-imported schemes),
 * falls back to a deterministic flat-column heuristic — see evaluateFlatColumnHeuristic.
 *
 * Comparison operators (from eligibilityComparisonOperatorValues):
 *   eq | neq | gt | gte | lt | lte | between | in | contains | exists
 *
 * Result status (from eligibilityResultStatusValues):
 *   eligible | ineligible | partial | unknown
 */
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../../db';
import {
  eligibilityResults,
  profileVersions,
  profiles,
  schemeDocuments,
  schemeEligibilityRuleGroups,
  schemeEligibilityRuleSets,
  schemeEligibilityRuleValues,
  schemeEligibilityRules,
  schemes,
  schemesCategorized,
  users,
} from '../../db/schema';
import { evaluateFlatColumnHeuristic, evaluateFlatColumnHeuristicPure } from './flat-heuristic';
import { computeDocumentBonus, computeDocumentBonusPure } from './document-bonus';
import { evaluateCategorizedMatch, fetchCategorizedRowForScheme, type CategorizedRow } from './categorized-match';
import { computeOccupationMatch } from './occupation-match';

const EVALUATOR_VERSION = '1.0.0';

export type EligibilityResultStatus = 'eligible' | 'ineligible' | 'partial' | 'unknown';

export interface EligibilityEvaluation {
  readonly status: EligibilityResultStatus;
  readonly score: number;
  readonly matchedRulesCount: number;
  readonly failedRulesCount: number;
  readonly summary: string;
}

interface ProfileSnapshot {
  readonly profileId: string;
  readonly age: number | null;
  readonly gender: string | null;
  readonly state: string | null;
  readonly district: string | null;
  readonly incomeRange: string | null;
  readonly occupation: string | null;
  readonly category: string | null;
  readonly disabilityStatus: boolean | null;
  readonly studentStatus: boolean | null;
  readonly farmerStatus: boolean | null;
  readonly seniorCitizenStatus: boolean | null;
  readonly residenceType: string | null;
  readonly maritalStatus: string | null;
  readonly employmentStatus: string | null;
  readonly bplEwsStatus: string | null;
  readonly educationLevel: string | null;
  readonly educationStream: string | null;
  readonly currentYearClass: string | null;
  readonly hasDependents: boolean | null;
  readonly numberOfDependents: number | null;
  readonly disabilityPercentage: string | null;
  readonly ownsAgriculturalLand: string | null;
  readonly landholdingSize: string | null;
  readonly agricultureActivityType: string | null;
  readonly housingSituation: string | null;
  readonly ownsResidentialLand: boolean | null;
  readonly businessType: string | null;
  readonly docAadhaar: boolean | null;
  readonly docPan: boolean | null;
  readonly docIncome: boolean | null;
  readonly docCaste: boolean | null;
  readonly docDomicile: boolean | null;
  readonly docBank: boolean | null;
  readonly docRation: boolean | null;
  readonly docDisability: boolean | null;
  readonly docEducational: boolean | null;
  readonly docLand: boolean | null;
}

interface RuleValueRow {
  readonly textValue: string | null;
  readonly numericValue: string | null;
  readonly booleanValue: boolean | null;
}

interface RuleWithValues {
  readonly fieldKey: string;
  readonly comparisonOperator: string;
  readonly negated: boolean;
  readonly isRequired: boolean;
  readonly values: readonly RuleValueRow[];
}

// ---------------------------------------------------------------------------
// DB fetch helpers
// ---------------------------------------------------------------------------

export async function fetchProfileSnapshot(userId: string): Promise<ProfileSnapshot | null> {
  const rows = await db
    .select({
      profileId: profiles.id,
      age: profileVersions.age,
      gender: profileVersions.gender,
      state: profileVersions.state,
      district: profileVersions.district,
      incomeRange: profileVersions.incomeRange,
      occupation: profileVersions.occupation,
      category: profileVersions.category,
      disabilityStatus: profileVersions.disabilityStatus,
      studentStatus: profileVersions.studentStatus,
      farmerStatus: profileVersions.farmerStatus,
      seniorCitizenStatus: profileVersions.seniorCitizenStatus,
      residenceType: profileVersions.residenceType,
      maritalStatus: profileVersions.maritalStatus,
      employmentStatus: profileVersions.employmentStatus,
      bplEwsStatus: profileVersions.bplEwsStatus,
      educationLevel: profileVersions.educationLevel,
      educationStream: profileVersions.educationStream,
      currentYearClass: profileVersions.currentYearClass,
      hasDependents: profileVersions.hasDependents,
      numberOfDependents: profileVersions.numberOfDependents,
      disabilityPercentage: profileVersions.disabilityPercentage,
      ownsAgriculturalLand: profileVersions.ownsAgriculturalLand,
      landholdingSize: profileVersions.landholdingSize,
      agricultureActivityType: profileVersions.agricultureActivityType,
      housingSituation: profileVersions.housingSituation,
      ownsResidentialLand: profileVersions.ownsResidentialLand,
      businessType: profileVersions.businessType,
      docAadhaar: profileVersions.docAadhaar,
      docPan: profileVersions.docPan,
      docIncome: profileVersions.docIncome,
      docCaste: profileVersions.docCaste,
      docDomicile: profileVersions.docDomicile,
      docBank: profileVersions.docBank,
      docRation: profileVersions.docRation,
      docDisability: profileVersions.docDisability,
      docEducational: profileVersions.docEducational,
      docLand: profileVersions.docLand,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(profileVersions, eq(profileVersions.id, profiles.activeVersionId))
    .where(eq(users.id, userId))
    .limit(1);

  return rows[0] ?? null;
}

async function fetchSchemeRules(schemeId: string): Promise<readonly RuleWithValues[]> {
  const ruleSets = await db
    .select()
    .from(schemeEligibilityRuleSets)
    .where(and(eq(schemeEligibilityRuleSets.schemeId, schemeId), eq(schemeEligibilityRuleSets.isActive, true)))
    .limit(1);

  const ruleSet = ruleSets[0];
  if (!ruleSet) return [];

  const groups = await db
    .select()
    .from(schemeEligibilityRuleGroups)
    .where(eq(schemeEligibilityRuleGroups.ruleSetId, ruleSet.id));
  if (groups.length === 0) return [];

  const groupIds = groups.map((g) => g.id);
  const allRules = await db
    .select()
    .from(schemeEligibilityRules)
    .where(groupIds.length === 1 ? eq(schemeEligibilityRules.ruleGroupId, groupIds[0]!) : inArray(schemeEligibilityRules.ruleGroupId, groupIds));
  if (allRules.length === 0) return [];

  const ruleIds = allRules.map((r) => r.id);
  const allValues = await db
    .select()
    .from(schemeEligibilityRuleValues)
    .where(ruleIds.length === 1 ? eq(schemeEligibilityRuleValues.ruleId, ruleIds[0]!) : inArray(schemeEligibilityRuleValues.ruleId, ruleIds));

  return allRules.map((rule) => ({
    fieldKey: rule.fieldKey,
    comparisonOperator: rule.comparisonOperator,
    negated: rule.negated,
    isRequired: rule.isRequired,
    values: allValues.filter((v) => v.ruleId === rule.id),
  }));
}

// ---------------------------------------------------------------------------
// Individual rule evaluation
// ---------------------------------------------------------------------------

function getProfileField(profile: ProfileSnapshot, fieldKey: string): unknown {
  return (profile as unknown as Record<string, unknown>)[fieldKey];
}

function evaluateRule(rule: RuleWithValues, profile: ProfileSnapshot): boolean {
  const profileValue = getProfileField(profile, rule.fieldKey);
  const textValues = rule.values.map((v) => v.textValue).filter((v): v is string => v !== null);
  const numericValues = rule.values
    .map((v) => (v.numericValue != null ? Number(v.numericValue) : null))
    .filter((v): v is number => v !== null);
  const boolValues = rule.values.filter((v) => v.booleanValue !== null).map((v) => v.booleanValue as boolean);

  let matches: boolean;
  switch (rule.comparisonOperator) {
    case 'eq':
      if (boolValues.length > 0) {
        matches = Boolean(profileValue) === boolValues[0];
      } else if (numericValues.length > 0) {
        matches = profileValue != null && Number(profileValue) === numericValues[0];
      } else {
        matches = textValues.length > 0 && textValues.includes(String(profileValue ?? ''));
      }
      break;
    case 'neq':
      if (textValues.length > 0) {
        matches = !textValues.includes(String(profileValue ?? ''));
      } else {
        matches = profileValue !== undefined && profileValue !== null;
      }
      break;
    case 'in':
      matches = textValues.includes(String(profileValue ?? ''));
      break;
    case 'gte':
      matches = profileValue != null && numericValues.length > 0 ? Number(profileValue) >= numericValues[0]! : false;
      break;
    case 'lte':
      matches = profileValue != null && numericValues.length > 0 ? Number(profileValue) <= numericValues[0]! : false;
      break;
    case 'gt':
      matches = profileValue != null && numericValues.length > 0 ? Number(profileValue) > numericValues[0]! : false;
      break;
    case 'lt':
      matches = profileValue != null && numericValues.length > 0 ? Number(profileValue) < numericValues[0]! : false;
      break;
    case 'between':
      matches =
        profileValue != null && numericValues.length >= 2
          ? Number(profileValue) >= numericValues[0]! && Number(profileValue) <= numericValues[1]!
          : false;
      break;
    case 'contains':
      matches = typeof profileValue === 'string' && textValues.some((v) => profileValue.toLowerCase().includes(v.toLowerCase()));
      break;
    case 'exists':
      matches = profileValue != null && profileValue !== '';
      break;
    default:
      matches = false;
  }

  return rule.negated ? !matches : matches;
}

// ---------------------------------------------------------------------------
// Main evaluate function
// ---------------------------------------------------------------------------

/**
 * Deterministic source priority when a scheme has no admin-authored structured rule set:
 *   1. `schemes_categorized` row (richer structured columns — state/age/gender/occupation/
 *      income/documents/etc.) when one exists for this scheme.
 *   2. The flat-column heuristic against `schemes` itself (state/beneficiary text/income regex)
 *      for schemes that only have the canonical CSV import.
 * Both are 100% deterministic — no AI involved in either path.
 */
async function evaluateBase(
  profile: ProfileSnapshot,
  schemeId: string,
  rules: readonly RuleWithValues[],
): Promise<{ evaluation: EligibilityEvaluation; documentsAlreadyScored: boolean }> {
  if (rules.length === 0) {
    const categorizedRow = await fetchCategorizedRowForScheme(schemeId);
    if (categorizedRow) {
      return { evaluation: evaluateCategorizedMatch(profile, categorizedRow), documentsAlreadyScored: true };
    }
    // No structured rules or categorized row (typical for canonical-only CSV imports) — fall
    // back to the flat-column heuristic instead of the old generic 0.5 "no rules" placeholder.
    return { evaluation: await evaluateFlatColumnHeuristic(profile, schemeId), documentsAlreadyScored: false };
  }

  return { evaluation: evaluateRuleSet(rules, profile), documentsAlreadyScored: false };
}

/** Pure — scores an already-fetched rule set against a profile, no DB access. Shared by the
 * single-scheme path above and the bulk evaluator below. */
function evaluateRuleSet(rules: readonly RuleWithValues[], profile: ProfileSnapshot): EligibilityEvaluation {
  let matched = 0;
  let failed = 0;
  let requiredFailed = 0;

  for (const rule of rules) {
    if (evaluateRule(rule, profile)) {
      matched++;
    } else {
      failed++;
      if (rule.isRequired) requiredFailed++;
    }
  }

  const total = rules.length;
  const score = total > 0 ? matched / total : 0;

  let status: EligibilityResultStatus;
  if (requiredFailed > 0) {
    status = 'ineligible';
  } else if (failed === 0) {
    status = 'eligible';
  } else {
    status = 'partial';
  }

  const summary =
    status === 'eligible'
      ? `Meets all ${total} eligibility criteria`
      : status === 'ineligible'
        ? `Does not meet ${requiredFailed} required criterion${requiredFailed !== 1 ? 'a' : ''}`
        : `Meets ${matched} of ${total} criteria — may still qualify`;

  return { status, score, matchedRulesCount: matched, failedRulesCount: failed, summary };
}

export async function evaluateEligibility(userId: string, schemeId: string): Promise<EligibilityEvaluation> {
  const [profile, rules] = await Promise.all([fetchProfileSnapshot(userId), fetchSchemeRules(schemeId)]);

  if (!profile) {
    return { status: 'unknown', score: 0, matchedRulesCount: 0, failedRulesCount: 0, summary: 'User profile not found' };
  }

  const { evaluation: base, documentsAlreadyScored } = await evaluateBase(profile, schemeId, rules);
  if (base.status === 'unknown') return base;

  // Document ownership never changes eligible/ineligible/partial status (that stays purely
  // rule-driven) — it only nudges the score, which is what the priority engine ranks on. A
  // citizen who's ready to apply (has the documents) should outrank an equally-eligible citizen
  // who isn't. Skipped when the categorized-match path already scored documents directly (with
  // both a positive AND negative signal) — applying this additive-only bonus on top would
  // double-count the same documents.
  if (documentsAlreadyScored) return base;

  const { bonus, matchedDocuments } = await computeDocumentBonus(profile, schemeId);
  if (bonus === 0) return base;

  return {
    ...base,
    score: Math.min(1, base.score + bonus),
    summary: `${base.summary} (+document readiness: ${matchedDocuments.join(', ')})`,
  };
}

// ---------------------------------------------------------------------------
// Upsert helper (update if exists, insert otherwise)
// ---------------------------------------------------------------------------

export async function upsertEligibilityResult(
  userId: string,
  schemeId: string,
  profileId: string,
  result: EligibilityEvaluation,
): Promise<void> {
  const existing = await db
    .select({ id: eligibilityResults.id })
    .from(eligibilityResults)
    .where(and(eq(eligibilityResults.userId, userId), eq(eligibilityResults.schemeId, schemeId)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(eligibilityResults)
      .set({
        resultStatus: result.status,
        score: result.score.toFixed(2),
        matchedRulesCount: result.matchedRulesCount,
        failedRulesCount: result.failedRulesCount,
        summary: result.summary,
        evaluatorVersion: EVALUATOR_VERSION,
        evaluatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(eligibilityResults.id, existing[0].id));
  } else {
    await db.insert(eligibilityResults).values({
      userId,
      profileId,
      schemeId,
      resultStatus: result.status,
      score: result.score.toFixed(2),
      matchedRulesCount: result.matchedRulesCount,
      failedRulesCount: result.failedRulesCount,
      summary: result.summary,
      evaluatorVersion: EVALUATOR_VERSION,
      evaluatedAt: new Date(),
    });
  }
}

// ---------------------------------------------------------------------------
// Batch query helpers used by the eligibility worker
// ---------------------------------------------------------------------------

export async function listPublishedSchemeIds(): Promise<readonly string[]> {
  const rows = await db.select({ id: schemes.id }).from(schemes).where(eq(schemes.publicationStatus, 'published'));
  return rows.map((r) => r.id);
}

export async function listActiveUsersWithProfiles(): Promise<ReadonlyArray<{ userId: string; profileId: string }>> {
  const rows = await db
    .select({ userId: users.id, profileId: profiles.id })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.status, 'active'));
  return rows;
}

export interface BulkSchemeEvaluation {
  readonly schemeId: string;
  readonly evaluation: EligibilityEvaluation;
  readonly isUrgent: boolean;
  readonly publishedAt: Date | null;
  /** True when this scheme is specifically targeted at the citizen's occupation (not just
   * open to everyone) — used to power the occupation-only "Schemes for me" filter. */
  readonly occupationMatch: boolean;
  /** Global priority bonus for highly vulnerable citizens (widows, BPL, homeless, high disability) */
  readonly vulnerabilityBonus: number;
}

/**
 * Evaluates one user's profile against every published scheme in a fixed number of bulk queries
 * instead of the naive per-scheme approach (which does 2-3 DB round trips × scheme count — with
 * several thousand published schemes that's minutes, not milliseconds). Same rule/categorized/
 * flat-heuristic priority and same document-ownership bonus as evaluateEligibility, just fed from
 * bulk-fetched data and scored in memory.
 */
export async function evaluateEligibilityForPublishedSchemes(userId: string): Promise<readonly BulkSchemeEvaluation[]> {
  const profile = await fetchProfileSnapshot(userId);
  if (!profile) return [];

  const schemeRows = await db
    .select({
      id: schemes.id,
      slug: schemes.slug,
      state: schemes.state,
      beneficiaryType: schemes.beneficiaryType,
      targetBeneficiaries: schemes.targetBeneficiaries,
      eligibility: schemes.eligibility,
      benefits: schemes.benefits,
      documentsRequired: schemes.documentsRequired,
      isUrgent: schemes.isUrgent,
      publishedAt: schemes.publishedAt,
    })
    .from(schemes)
    .where(eq(schemes.publicationStatus, 'published'));

  if (schemeRows.length === 0) return [];
  const schemeIds = schemeRows.map((s) => s.id);

  // Categorized rows are resolved by FK first, then by slug (mirrors fetchCategorizedRowForScheme) —
  // fetching the whole table once is far cheaper than one query per scheme.
  const categorizedRows = await db.select().from(schemesCategorized);
  const categorizedBySchemeId = new Map<string, CategorizedRow>();
  const categorizedBySlug = new Map<string, CategorizedRow>();
  for (const row of categorizedRows) {
    if (row.schemeId && !categorizedBySchemeId.has(row.schemeId)) categorizedBySchemeId.set(row.schemeId, row);
    if (!categorizedBySlug.has(row.slug)) categorizedBySlug.set(row.slug, row);
  }

  // Admin-authored structured rule sets are comparatively rare, so this fan-out (groups → rules →
  // values) only ever covers a small subset of schemeIds, not all of them.
  const activeRuleSets = await db
    .select({ id: schemeEligibilityRuleSets.id, schemeId: schemeEligibilityRuleSets.schemeId })
    .from(schemeEligibilityRuleSets)
    .where(and(inArray(schemeEligibilityRuleSets.schemeId, schemeIds), eq(schemeEligibilityRuleSets.isActive, true)));

  const rulesBySchemeId = new Map<string, RuleWithValues[]>();
  if (activeRuleSets.length > 0) {
    const ruleSetIds = activeRuleSets.map((rs) => rs.id);
    const schemeIdByRuleSetId = new Map(activeRuleSets.map((rs) => [rs.id, rs.schemeId]));

    const groups = await db
      .select()
      .from(schemeEligibilityRuleGroups)
      .where(inArray(schemeEligibilityRuleGroups.ruleSetId, ruleSetIds));

    if (groups.length > 0) {
      const groupIds = groups.map((g) => g.id);
      const schemeIdByGroupId = new Map(groups.map((g) => [g.id, schemeIdByRuleSetId.get(g.ruleSetId)]));

      const allRules = await db
        .select()
        .from(schemeEligibilityRules)
        .where(inArray(schemeEligibilityRules.ruleGroupId, groupIds));

      if (allRules.length > 0) {
        const ruleIds = allRules.map((r) => r.id);
        const allValues = await db
          .select()
          .from(schemeEligibilityRuleValues)
          .where(inArray(schemeEligibilityRuleValues.ruleId, ruleIds));

        const valuesByRuleId = new Map<string, RuleValueRow[]>();
        for (const value of allValues) {
          const list = valuesByRuleId.get(value.ruleId);
          if (list) list.push(value);
          else valuesByRuleId.set(value.ruleId, [value]);
        }

        for (const rule of allRules) {
          const schemeId = schemeIdByGroupId.get(rule.ruleGroupId);
          if (!schemeId) continue;
          const ruleWithValues: RuleWithValues = {
            fieldKey: rule.fieldKey,
            comparisonOperator: rule.comparisonOperator,
            negated: rule.negated,
            isRequired: rule.isRequired,
            values: valuesByRuleId.get(rule.id) ?? [],
          };
          const list = rulesBySchemeId.get(schemeId);
          if (list) list.push(ruleWithValues);
          else rulesBySchemeId.set(schemeId, [ruleWithValues]);
        }
      }
    }
  }

  const documentRows = await db
    .select({ schemeId: schemeDocuments.schemeId, documentName: schemeDocuments.documentName })
    .from(schemeDocuments)
    .where(inArray(schemeDocuments.schemeId, schemeIds));
  const documentNamesBySchemeId = new Map<string, string[]>();
  for (const row of documentRows) {
    const list = documentNamesBySchemeId.get(row.schemeId);
    if (list) list.push(row.documentName);
    else documentNamesBySchemeId.set(row.schemeId, [row.documentName]);
  }

  // Calculate global vulnerability bonus (0 to 25 points maximum)
  let vulnerabilityBonus = 0;
  if (profile.bplEwsStatus === 'bpl' || profile.bplEwsStatus === 'ews') vulnerabilityBonus += 8;
  if (profile.maritalStatus === 'widowed') vulnerabilityBonus += 8;
  if (profile.housingSituation === 'no_permanent_home' || profile.housingSituation === 'temporary_kutcha') vulnerabilityBonus += 5;
  if (profile.disabilityStatus && profile.disabilityPercentage && ['40_59', '60_79', '80_plus'].includes(profile.disabilityPercentage)) vulnerabilityBonus += 4;
  if (profile.hasDependents && profile.numberOfDependents && profile.numberOfDependents > 3) vulnerabilityBonus += 2;
  vulnerabilityBonus = Math.min(25, vulnerabilityBonus);

  const results: BulkSchemeEvaluation[] = [];
  for (const scheme of schemeRows) {
    const rules = rulesBySchemeId.get(scheme.id);
    const categorizedRow = categorizedBySchemeId.get(scheme.id) ?? categorizedBySlug.get(scheme.slug);

    let evaluation: EligibilityEvaluation;
    let documentsAlreadyScored: boolean;
    if (rules && rules.length > 0) {
      evaluation = evaluateRuleSet(rules, profile);
      documentsAlreadyScored = false;
    } else if (categorizedRow) {
      evaluation = evaluateCategorizedMatch(profile, categorizedRow);
      documentsAlreadyScored = true;
    } else {
      evaluation = evaluateFlatColumnHeuristicPure(profile, scheme);
      documentsAlreadyScored = false;
    }

    if (!documentsAlreadyScored) {
      const haystack = [scheme.documentsRequired ?? '', ...(documentNamesBySchemeId.get(scheme.id) ?? [])].join(' ; ');
      const { bonus, matchedDocuments } = computeDocumentBonusPure(profile, haystack);
      if (bonus > 0) {
        evaluation = {
          ...evaluation,
          score: Math.min(1, evaluation.score + bonus),
          summary: `${evaluation.summary} (+document readiness: ${matchedDocuments.join(', ')})`,
        };
      }
    }

    const flatText = `${scheme.beneficiaryType ?? ''} ${scheme.targetBeneficiaries ?? ''} ${scheme.eligibility ?? ''}`;
    const occupationMatch = computeOccupationMatch(profile, categorizedRow, flatText);

    results.push({ schemeId: scheme.id, evaluation, isUrgent: scheme.isUrgent, publishedAt: scheme.publishedAt, occupationMatch, vulnerabilityBonus });
  }

  return results;
}

export type { ProfileSnapshot };
