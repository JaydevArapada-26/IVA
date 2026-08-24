import type { Category, EligibilityProfileFields, Gender, IncomeRange, Occupation, SupportedLanguage } from '../types';
import type { DocumentOwnershipFields } from './auth';

export interface ProfileCompletenessDto {
  readonly isComplete: boolean;
  readonly missingFields: readonly string[];
}

export interface ProfileDto extends Partial<EligibilityProfileFields> {
  readonly id: string;
  readonly userId: string;
  readonly profileStatus: 'incomplete' | 'active' | 'archived' | 'deleted';
  readonly name?: string;
  readonly username?: string;
  readonly email?: string;
  readonly phoneNumber?: string;
  readonly dateOfBirth?: string;
  readonly age?: number;
  readonly gender?: Gender;
  readonly state?: string;
  readonly district?: string;
  readonly incomeRange?: IncomeRange;
  readonly occupation?: Occupation;
  readonly category?: Category;
  readonly disabilityStatus: boolean;
  readonly studentStatus: boolean;
  readonly farmerStatus: boolean;
  readonly seniorCitizenStatus: boolean;
  readonly documents: DocumentOwnershipFields;
  readonly languageCode: SupportedLanguage;
  readonly consentGiven: boolean;
  readonly phoneVerified: boolean;
  readonly onboardingCompleted: boolean;
  /** Daily automated scheme-recommendation SMS preference (Stage 3) — lives on `profiles`, not
   * versioned like the rest of this DTO. Defaults to true (opt-out model). */
  readonly dailySchemeSmsEnabled: boolean;
  readonly completeness: ProfileCompletenessDto;
}

export interface UpdateProfileRequest extends Partial<EligibilityProfileFields> {
  readonly name?: string;
  readonly username?: string;
  readonly dateOfBirth?: string;
  readonly gender?: Gender;
  readonly state?: string;
  readonly district?: string;
  readonly incomeRange?: IncomeRange;
  readonly occupation?: Occupation;
  readonly category?: Category;
  readonly disabilityStatus?: boolean;
  readonly studentStatus?: boolean;
  readonly farmerStatus?: boolean;
  readonly seniorCitizenStatus?: boolean;
  readonly documents?: DocumentOwnershipFields;
  readonly languageCode?: SupportedLanguage;
  readonly consentGiven?: boolean;
  readonly onboardingCompleted?: boolean;
  readonly dailySchemeSmsEnabled?: boolean;
}

/** Re-syncs users.email/phoneNumber from the citizen's current (post-change) Supabase session —
 * called after an email-change confirmation or phone-change OTP verification completes on
 * Supabase's side, so our own table reflects the new identity. */
export interface SyncIdentityRequest {
  readonly supabaseAccessToken: string;
}

export interface SyncIdentityResponse {
  readonly email?: string;
  readonly phoneNumber: string;
}

/** One IVA scheme-recommendation SMS record for the citizen-facing SMS History view. */
export interface SmsHistoryDto {
  readonly id: string;
  readonly schemeId?: string;
  readonly schemeTitle?: string;
  readonly messageBody: string;
  readonly notificationType: string;
  readonly status: string;
  readonly sentAt?: string;
  readonly createdAt: string;
}
