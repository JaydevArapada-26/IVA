import type { SupportedLanguage } from '../types';

export const PROFILE_DRAFT_FIELDS = [
  'name',
  'phone',
  'age',
  'gender',
  'state',
  'district',
  'incomeRange',
  'occupation',
  'category',
  'disabilityStatus',
  'studentStatus',
  'farmerStatus',
  'seniorCitizenStatus',
  'language',
  'consentGiven',
  'phoneVerified',
  'onboardingCompleted',
] as const;

export type ProfileDraftField = (typeof PROFILE_DRAFT_FIELDS)[number];

export interface ProfileLocalePreference {
  readonly language: SupportedLanguage;
  readonly fallbackLanguage?: SupportedLanguage;
}
