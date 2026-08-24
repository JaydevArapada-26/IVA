import type { EligibilityProfileFields } from '../types';

export interface RequestOtpRequest {
  readonly phoneNumber: string;
}

export interface RequestOtpResponse {
  readonly phoneNumber: string;
  readonly otpRequested: true;
  /** Only present when SMS_PROVIDER is not configured, so local dev can proceed without a real SMS. */
  readonly devOtp?: string;
}

export interface LoginRequestDto {
  readonly phoneNumber: string;
  readonly otp: string;
}

export interface LoginResponseDto {
  readonly token: string;
  readonly userId: string;
  readonly expiresAt: string;
}

export interface AdminLoginRequestDto {
  readonly email: string;
  readonly password: string;
}

export interface AdminLoginResponseDto {
  readonly token: string;
  readonly adminUserId: string;
  readonly role: string;
  readonly displayName?: string;
  readonly expiresAt: string;
}

/** Exchanges a verified Supabase Auth access token (from email+password+OTP or phone+OTP)
 * for an IVA citizen session. Login is rejected if no local `users` row exists yet. */
export interface SessionExchangeRequest {
  readonly supabaseAccessToken: string;
  /** Only sent on an explicit interactive login submission — omitted on silent session-restore
   * calls so auto-login never overwrites the citizen's last saved preference. */
  readonly rememberMe?: boolean;
}

export interface SessionExchangeResponse {
  readonly token: string;
  readonly userId: string;
  readonly expiresAt: string;
  readonly displayName?: string;
}

/** Document ownership is Yes/No only — IVA never stores the documents themselves. Keys match the
 * signup wizard's checklist ids (apps/web AuthPages.tsx DOCUMENT_ITEMS) 1:1. */
export interface DocumentOwnershipFields {
  readonly aadhaar?: boolean;
  readonly pan?: boolean;
  readonly income?: boolean;
  readonly caste?: boolean;
  readonly domicile?: boolean;
  readonly bank?: boolean;
  readonly ration?: boolean;
  readonly disability?: boolean;
  readonly educational?: boolean;
  readonly land?: boolean;
}

export interface SignupProfileFields extends Partial<EligibilityProfileFields> {
  /** ISO date (YYYY-MM-DD). Age is derived from this server-side and kept in sync on every save. */
  readonly dateOfBirth?: string;
  readonly gender?: string;
  readonly state?: string;
  readonly district?: string;
  readonly incomeRange?: string;
  readonly occupation?: string;
  readonly category?: string;
  readonly disabilityStatus?: boolean;
  /** Derived client-side strictly from employmentStatus === 'student' — drives student-scheme
   * matching throughout the eligibility engine. Not inferred from educationLevel. */
  readonly studentStatus?: boolean;
  readonly documents?: DocumentOwnershipFields;
}

/** Finalizes signup after Supabase Auth account creation — creates the local users/profiles
 * rows. Rejected if the email, phone number, or username already exists in the local users table. */
export interface SignupCompleteRequest {
  readonly supabaseAccessToken: string;
  readonly displayName: string;
  readonly username: string;
  readonly phoneNumber: string;
  readonly email: string;
  readonly profile?: SignupProfileFields;
  readonly rememberMe?: boolean;
}

export type SignupCompleteResponse = SessionExchangeResponse;

/** Checked before triggering an OTP send, so login doesn't waste an OTP on an unknown account. */
export interface CheckAccountResponse {
  readonly exists: boolean;
}
