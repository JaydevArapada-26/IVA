/**
 * Formats scheme records (either the schemeId-attached chat context, or ranked
 * SchemeRecommendationService candidates) into the block of text handed to the LLM as grounding —
 * shared by both assistant pipelines so the prompt shape doesn't drift between them.
 */
import type { RetrievedSchemeContext } from '../../db/repositories/assistant.repository';
import type { RecommendedScheme } from '../recommendation/service';

interface SchemeLike {
  readonly title: string;
  readonly ministry?: string | null;
  readonly briefDescription?: string | null;
  readonly eligibility?: string | null;
  readonly benefits?: string | null;
  readonly documentsRequired?: string | null;
  readonly applicationProcess?: string | null;
  readonly applicationUrl?: string | null;
}

export function formatSchemeContextBlock(schemes: readonly (RetrievedSchemeContext | SchemeLike)[]): string {
  return schemes
    .map((s, i) => {
      const parts = [`${i + 1}. **${s.title}**`];
      if (s.ministry) parts.push(`   - Ministry/Dept: ${s.ministry}`);
      if (s.briefDescription) parts.push(`   - Description: ${s.briefDescription}`);
      if (s.eligibility) parts.push(`   - Eligibility: ${s.eligibility}`);
      if (s.benefits) parts.push(`   - Benefits: ${s.benefits}`);
      if (s.documentsRequired) parts.push(`   - Required Documents: ${s.documentsRequired}`);
      if (s.applicationProcess) parts.push(`   - How to Apply: ${s.applicationProcess}`);
      if (s.applicationUrl) parts.push(`   - Portal Link: ${s.applicationUrl}`);
      return parts.join('\n');
    })
    .join('\n\n');
}

/**
 * Same as formatSchemeContextBlock, but for profile-aware SchemeRecommendationService candidates —
 * appends each candidate's eligibility tier and `explainMatch` reasons (spec 2.13), so the LLM can
 * ground "why this may fit you" in real, already-computed factors instead of guessing. Never
 * includes rankScore, schemeId, or any other internal field (spec 2.13's "never reveal ranking
 * scores / internal ids").
 */
export function formatRecommendationContextBlock(candidates: readonly RecommendedScheme[]): string {
  const tierLabel: Record<RecommendedScheme['tier'], string> = {
    eligible: 'Eligible',
    likely_eligible: 'Likely eligible (some details unconfirmed)',
    potentially_relevant: 'Potentially relevant (profile information insufficient to confirm)',
  };

  return candidates
    .map((s, i) => {
      const parts = [`${i + 1}. **${s.title}** — ${tierLabel[s.tier]}`];
      if (s.ministry) parts.push(`   - Ministry/Dept: ${s.ministry}`);
      if (s.briefDescription) parts.push(`   - Description: ${s.briefDescription}`);
      if (s.eligibility) parts.push(`   - Eligibility: ${s.eligibility}`);
      if (s.benefits) parts.push(`   - Benefits: ${s.benefits}`);
      if (s.documentsRequired) parts.push(`   - Required Documents: ${s.documentsRequired}`);
      if (s.applicationProcess) parts.push(`   - How to Apply: ${s.applicationProcess}`);
      if (s.applicationUrl) parts.push(`   - Portal Link: ${s.applicationUrl}`);
      if (s.reasons.length > 0) parts.push(`   - Why this may fit the citizen: ${s.reasons.join(' ')}`);
      return parts.join('\n');
    })
    .join('\n\n');
}
