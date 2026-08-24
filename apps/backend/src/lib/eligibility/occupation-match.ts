/**
 * Strict occupation-specific match check, used by the "Schemes for me" recommendation filter.
 *
 * Unlike `evaluateOccupationCriterion` (which treats a scheme with no occupation restriction as
 * "not discriminating" and lets it through the general ranking), this answers a narrower question:
 * is this scheme specifically targeted at the citizen's occupation? Schemes open to "general / any"
 * or with no occupation signal at all are excluded here, even though they'd still show up in the
 * unfiltered dashboard ranking.
 */
import type { ProfileSnapshot } from './engine';
import { evaluateOccupationCriterion, type CategorizedRow } from './categorized-match';

const FLAT_OCCUPATION_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  farmer: ['farmer', 'agricultur'],
  laborer: ['laborer', 'labourer', 'labour', 'worker'],
  student: ['student', 'scholar'],
  self_employed: ['entrepreneur', 'business owner', 'self-employed', 'self employed', 'artisan', 'craftsperson'],
  unemployed: ['unemployed', 'jobless'],
  private_sector: [],
  government_sector: ['government employee', 'govt employee', 'government servant', 'public sector employee'],
  homemaker: ['housewife', 'homemaker', 'widow', 'self help group', 'shg'],
};

function evaluateFlatOccupationMatch(profile: ProfileSnapshot, haystack: string): boolean {
  if (!profile.occupation) return false;
  const text = haystack.toLowerCase();
  const keywords = [...(FLAT_OCCUPATION_KEYWORDS[profile.occupation] ?? [])];
  if (profile.farmerStatus) keywords.push('farmer');
  if (profile.studentStatus) keywords.push('student');
  if (profile.seniorCitizenStatus) keywords.push('senior citizen');
  if (profile.disabilityStatus) keywords.push('disab');
  return keywords.some((k) => k && text.includes(k));
}

export function computeOccupationMatch(profile: ProfileSnapshot, categorizedRow: CategorizedRow | undefined, flatText: string): boolean {
  if (categorizedRow?.occupationCategory) {
    const criterion = evaluateOccupationCriterion(profile, categorizedRow);
    // null means "general / any" or no restriction — not occupation-specific, so excluded here
    // even though it's a fine general-purpose match for the unfiltered dashboard ranking.
    return criterion?.matched === true;
  }
  return evaluateFlatOccupationMatch(profile, flatText);
}
