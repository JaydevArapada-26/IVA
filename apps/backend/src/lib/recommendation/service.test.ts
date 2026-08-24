import { describe, expect, it } from 'vitest';
import { detectGeographicOverride, explainMatch, tierFromStatus, tierWeight } from './service';
import type { ProfileSnapshot } from '../eligibility/engine';

function profile(overrides: Partial<ProfileSnapshot> = {}): ProfileSnapshot {
  return {
    profileId: 'p1',
    age: 20,
    gender: 'female',
    state: 'Gujarat',
    district: 'Ahmedabad',
    incomeRange: '1_to_25_lakh',
    occupation: 'student',
    category: 'obc',
    disabilityStatus: false,
    studentStatus: true,
    farmerStatus: false,
    seniorCitizenStatus: false,
    docAadhaar: true,
    docPan: null,
    docIncome: null,
    docCaste: null,
    docDomicile: null,
    docBank: null,
    docRation: null,
    docDisability: null,
    docEducational: null,
    docLand: null,
    ...overrides,
  };
}

function meta(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    slug: 'scheme-1',
    title: 'Sample Scholarship Scheme',
    shortTitle: null,
    briefDescription: 'A scholarship for undergraduate students in Gujarat.',
    eligibility: 'Student, income within limit, OBC category considered.',
    benefits: 'Tuition fee waiver; Annual stipend of ₹10,000',
    documentsRequired: 'Aadhaar; Income certificate',
    applicationProcess: 'Apply online',
    ministry: 'Ministry of Education',
    state: 'Gujarat',
    beneficiaryType: 'Student',
    targetBeneficiaries: 'Undergraduate students',
    categories: ['education'],
    tags: ['scholarship'],
    benefitType: 'financial',
    applicationUrl: 'https://example.gov.in/apply',
    sourceUrl: 'https://example.gov.in',
    schemeCloseDate: null,
    isUrgent: false,
    publishedAt: new Date(),
    ...overrides,
  } as never;
}

describe('tierFromStatus / tierWeight — eligibility → recommendation tier mapping', () => {
  it('maps eligible/partial/unknown to a tier, ineligible to undefined (never recommended)', () => {
    expect(tierFromStatus('eligible')).toBe('eligible');
    expect(tierFromStatus('partial')).toBe('likely_eligible');
    expect(tierFromStatus('unknown')).toBe('potentially_relevant');
    expect(tierFromStatus('ineligible')).toBeUndefined();
  });

  it('ranks eligible above likely_eligible above potentially_relevant', () => {
    expect(tierWeight('eligible')).toBeGreaterThan(tierWeight('likely_eligible'));
    expect(tierWeight('likely_eligible')).toBeGreaterThan(tierWeight('potentially_relevant'));
  });
});

describe('detectGeographicOverride — spec 2.5 explicit broadening', () => {
  it('does not fire on an ordinary query mentioning nothing geographic', () => {
    expect(detectGeographicOverride('I want a scholarship', 'Gujarat')).toBe(false);
  });

  it('fires on "anywhere in India" / "all India" style phrasing', () => {
    expect(detectGeographicOverride('Show me scholarships available anywhere in India', 'Gujarat')).toBe(true);
    expect(detectGeographicOverride('any scheme all India', 'Gujarat')).toBe(true);
  });

  it('fires when the query names a different state than the profile', () => {
    expect(detectGeographicOverride('schemes available in Kerala', 'Gujarat')).toBe(true);
  });

  it('does not fire when the query names the citizen\'s own state', () => {
    expect(detectGeographicOverride('schemes available in Gujarat', 'Gujarat')).toBe(false);
  });
});

describe('explainMatch — only surfaces reasons that actually applied (spec 2.13/2.14)', () => {
  it('emits a student reason only when the profile is a student AND the scheme text mentions it', () => {
    const reasons = explainMatch(profile({ studentStatus: true }), meta());
    expect(reasons.some((r) => /student/i.test(r))).toBe(true);
  });

  it('never emits a farmer reason for a non-farmer profile even if the scheme mentions farmers', () => {
    const reasons = explainMatch(profile({ farmerStatus: false, studentStatus: false }), meta({ briefDescription: 'A scheme for farmers.' }));
    expect(reasons.some((r) => /farmer/i.test(r))).toBe(false);
  });

  it('returns no reasons when there is no profile (guest/anonymous citizen)', () => {
    expect(explainMatch(null, meta())).toEqual([]);
  });

  it('never includes scores, ids, or internal flags in any reason', () => {
    const reasons = explainMatch(profile(), meta());
    for (const reason of reasons) {
      expect(reason).not.toMatch(/score|rank|schemeId|s1\b/i);
    }
  });
});
