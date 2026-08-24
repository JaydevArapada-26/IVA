/**
 * Deterministic document-ownership bonus for scheme scoring.
 *
 * If a scheme's required-documents text mentions a document the citizen has indicated they
 * possess (Aadhaar, PAN, Income Certificate, etc.), that scheme's score gets a small boost —
 * so, all else equal, a scheme the citizen is actually ready to apply for outranks one they'd
 * still need to go get documents for. Purely keyword-matching, no AI involved.
 */
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { schemeDocuments, schemes } from '../../db/schema';
import type { ProfileSnapshot } from './engine';

const DOCUMENT_KEYWORDS: ReadonlyArray<{ readonly ownedKey: keyof ProfileSnapshot; readonly keywords: readonly string[] }> = [
  { ownedKey: 'docAadhaar', keywords: ['aadhaar', 'aadhar'] },
  { ownedKey: 'docPan', keywords: ['pan card', 'permanent account number'] },
  { ownedKey: 'docIncome', keywords: ['income certificate'] },
  { ownedKey: 'docCaste', keywords: ['caste certificate', 'category certificate'] },
  { ownedKey: 'docDomicile', keywords: ['domicile', 'residence certificate'] },
  { ownedKey: 'docBank', keywords: ['bank passbook', 'bank account', 'passbook'] },
  { ownedKey: 'docRation', keywords: ['ration card'] },
  { ownedKey: 'docDisability', keywords: ['disability certificate', 'udid'] },
  { ownedKey: 'docEducational', keywords: ['marksheet', 'educational certificate', 'degree certificate'] },
  { ownedKey: 'docLand', keywords: ['land record', 'land document', 'khata', 'patta'] },
];

const BONUS_PER_MATCHED_DOCUMENT = 0.04;
const MAX_TOTAL_BONUS = 0.16;

export interface DocumentBonusResult {
  readonly bonus: number;
  readonly matchedDocuments: readonly string[];
}

/** Pure — takes an already-built haystack of required-document text, no DB access. Used both by
 * the single-scheme async wrapper below and by bulk evaluators that fetch all schemes/documents
 * in a couple of queries upfront. */
export function computeDocumentBonusPure(profile: ProfileSnapshot, haystack: string): DocumentBonusResult {
  const normalizedHaystack = haystack.toLowerCase();
  if (!normalizedHaystack.trim()) return { bonus: 0, matchedDocuments: [] };

  const matchedDocuments: string[] = [];
  for (const { ownedKey, keywords } of DOCUMENT_KEYWORDS) {
    const isRequired = keywords.some((k) => normalizedHaystack.includes(k));
    if (!isRequired) continue;
    if (profile[ownedKey] === true) matchedDocuments.push(keywords[0]!);
  }

  const bonus = Math.min(matchedDocuments.length * BONUS_PER_MATCHED_DOCUMENT, MAX_TOTAL_BONUS);
  return { bonus, matchedDocuments };
}

export async function computeDocumentBonus(profile: ProfileSnapshot, schemeId: string): Promise<DocumentBonusResult> {
  const [schemeRow] = await db
    .select({ documentsRequiredText: schemes.documentsRequired })
    .from(schemes)
    .where(eq(schemes.id, schemeId))
    .limit(1);

  const normalizedDocRows = await db
    .select({ documentName: schemeDocuments.documentName })
    .from(schemeDocuments)
    .where(eq(schemeDocuments.schemeId, schemeId));

  const haystack = [schemeRow?.documentsRequiredText ?? '', ...normalizedDocRows.map((d) => d.documentName)].join(' ; ');
  return computeDocumentBonusPure(profile, haystack);
}
