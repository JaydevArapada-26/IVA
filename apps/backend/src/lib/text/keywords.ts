/**
 * Shared tokenizer/stop-word logic for keyword-based scheme matching. Extracted from
 * db/repositories/assistant.repository.ts (which still uses it for the schemeId-attached chat
 * case) so lib/recommendation/service.ts doesn't carry a second, drifting copy of the same list.
 */

export const STOP_WORDS = new Set([
  'what', 'which', 'where', 'when', 'who', 'how', 'why', 'whose',
  'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being',
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else',
  'for', 'in', 'on', 'at', 'by', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'to', 'from', 'up', 'down', 'out', 'off', 'over', 'under',
  'scheme', 'schemes', 'yojana', 'yojna', 'government', 'sarkari', 'sarkar',
  'apply', 'application', 'eligibility', 'eligible', 'benefit', 'benefits',
  'document', 'documents', 'doc', 'docs', 'required', 'need', 'needed',
  'tell', 'give', 'help', 'know', 'want', 'please', 'can', 'could', 'would', 'should',
  'kya', 'hai', 'hain', 'kaise', 'milega', 'chahiye', 'batao', 'bataiye', 'ke', 'ki', 'ko', 'se', 'me', 'mein',
  // Gujarati/Hindi "I want X" filler — the daily SMS / assistant intent layer already strips
  // these before matching against scheme text.
  'mare', 'joiye', 'che', 'karvi', 'karva', 'ni', 'nu',
]);

/** Lowercases, strips punctuation (keeping unicode letters/numbers), and splits into tokens ≥2
 * chars — the same normalization used across the assistant retrieval and recommendation paths. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/** Tokenizes and drops stop words — the actual "keywords" used for ILIKE/overlap matching. */
export function extractKeywords(text: string, maxTerms = 10): string[] {
  const filtered = tokenize(text).filter((t) => !STOP_WORDS.has(t));
  return filtered.slice(0, maxTerms);
}

/**
 * Intent → synonym expansion, used by the recommendation service to broaden a citizen's query
 * beyond literal title matches (spec 2.6/2.20: "I want a scholarship" should also retrieve
 * stipends/fellowships/education grants, not just schemes whose title contains "scholarship").
 * Deliberately small and curated rather than a general thesaurus — each entry maps a common
 * citizen phrasing to the scheme-text vocabulary IVA's data actually uses.
 */
export const INTENT_SYNONYMS: ReadonlyArray<{ readonly trigger: readonly string[]; readonly expansions: readonly string[] }> = [
  {
    trigger: ['scholarship', 'scholarships', 'chatravrutti', 'chhatravriti'],
    expansions: ['scholarship', 'stipend', 'fellowship', 'education grant', 'financial assistance', 'student support', 'tuition'],
  },
  {
    trigger: ['study', 'studies', 'education', 'college', 'tuition', 'fees'],
    expansions: ['scholarship', 'stipend', 'education grant', 'student', 'tuition', 'fees'],
  },
  {
    trigger: ['farmer', 'farming', 'kisan', 'agriculture', 'crop', 'crops'],
    expansions: ['farmer', 'agriculture', 'kisan', 'crop', 'irrigation', 'farming', 'agricultural'],
  },
  {
    trigger: ['house', 'housing', 'home', 'awas', 'ghar'],
    expansions: ['housing', 'awas', 'shelter', 'home loan', 'construction'],
  },
  {
    trigger: ['health', 'hospital', 'medical', 'treatment', 'ayushman'],
    expansions: ['health', 'hospital', 'medical', 'treatment', 'insurance', 'healthcare'],
  },
  {
    trigger: ['job', 'employment', 'work', 'rozgar', 'business', 'loan'],
    expansions: ['employment', 'self-employment', 'business', 'loan', 'skill', 'livelihood'],
  },
  {
    trigger: ['pension', 'old age', 'senior citizen', 'retirement'],
    expansions: ['pension', 'senior citizen', 'old age', 'retirement'],
  },
  {
    trigger: ['disability', 'divyang', 'handicap'],
    expansions: ['disability', 'divyang', 'disabled', 'handicap'],
  },
  {
    trigger: ['widow', 'women', 'mahila'],
    expansions: ['widow', 'women', 'mahila', 'girl child'],
  },
];

/** Expands a citizen's raw query keywords with any matching intent synonym groups. Both the
 * original terms and their expansions are returned (deduped) — the caller still scores by
 * overlap, so broader coverage only helps recall, never forces a false match. */
export function expandKeywordsWithIntent(keywords: readonly string[]): string[] {
  const set = new Set(keywords);
  for (const { trigger, expansions } of INTENT_SYNONYMS) {
    if (trigger.some((t) => keywords.includes(t))) {
      for (const exp of expansions) set.add(exp);
    }
  }
  return Array.from(set);
}
