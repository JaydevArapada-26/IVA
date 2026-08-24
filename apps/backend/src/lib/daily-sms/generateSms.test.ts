import { describe, expect, it } from 'vitest';
import { buildTemplateSmsBody } from './generateSms';
import type { RecommendedScheme } from '../recommendation/service';

function scheme(overrides: Partial<RecommendedScheme> = {}): RecommendedScheme {
  return {
    schemeId: 's1',
    slug: 'pm-scholarship',
    title: 'PM Scholarship Scheme',
    shortTitle: 'PM Scholarship',
    briefDescription: 'A scholarship for students.',
    benefits: 'Tuition fee waiver; Annual stipend of ₹10,000',
    eligibility: 'Student, income within limit.',
    documentsRequired: 'Aadhaar',
    applicationProcess: 'Apply online',
    applicationUrl: 'https://example.gov.in/apply',
    sourceUrl: 'https://example.gov.in',
    ministry: 'Ministry of Education',
    tier: 'eligible',
    reasons: ['You are a currently enrolled student.'],
    rankScore: 100,
    ...overrides,
  };
}

describe('buildTemplateSmsBody — deterministic localized SMS fallback (spec 3.21-3.24)', () => {
  it('produces an English message including the scheme name, benefit, and link', () => {
    const body = buildTemplateSmsBody(scheme(), 'en');
    expect(body).toContain('PM Scholarship');
    expect(body).toContain('Tuition fee waiver');
    expect(body).toContain('https://example.gov.in/apply');
  });

  it('produces a Hindi message with Hindi intro/labels and no unintended English filler text', () => {
    const body = buildTemplateSmsBody(scheme(), 'hi');
    expect(body).toContain('योजना उपयोगी हो सकती है'); // Hindi intro
    expect(body).toContain('लाभ'); // Hindi "Benefit" label
    // The scheme's own name/link are proper nouns/URLs and are expected to remain as-is.
    expect(body).toContain('PM Scholarship');
    expect(body).toContain('https://example.gov.in/apply');
  });

  it('produces a Gujarati message with Gujarati intro/labels', () => {
    const body = buildTemplateSmsBody(scheme(), 'gu');
    expect(body).toContain('યોજના ઉપયોગી હોઈ શકે છે');
    expect(body).toContain('લાભ');
  });

  it('stays well under a couple of SMS segments even with a long benefit line', () => {
    const longBenefit = 'A'.repeat(500);
    const body = buildTemplateSmsBody(scheme({ benefits: longBenefit }), 'en');
    expect(body.length).toBeLessThan(320);
  });

  it('omits the benefit line entirely when the scheme has none, rather than printing an empty label', () => {
    const body = buildTemplateSmsBody(scheme({ benefits: null }), 'en');
    expect(body).not.toContain('Benefit:');
  });
});
