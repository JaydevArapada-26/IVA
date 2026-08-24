export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export type Gender = 'Male' | 'Female' | 'Transgender' | 'Other' | 'Prefer not to say';
export type IncomeRange = '< 1 Lakh' | '1 - 2.5 Lakhs' | '2.5 - 5 Lakhs' | '5 - 8 Lakhs' | '> 8 Lakhs';
export type Category = 'General' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'Prefer not to say' | 'Other';
export type Occupation = 'Farmer' | 'Laborer' | 'Student' | 'Self-Employed' | 'Unemployed' | 'Private Sector' | 'Government Sector' | 'Homemaker';

// ---------------------------------------------------------------------------
// Signup profile expansion (progressive-profiling eligibility fields).
//
// Unlike Gender/IncomeRange/Occupation/Category above (human-readable display strings, converted
// to/from DB enum values server-side via apps/backend/src/lib/profile-enums.ts), these mirror the
// backend's stable snake_case enum values (apps/backend/src/db/enums.ts) directly and 1:1 — per
// the spec's "use stable internal values rather than UI labels" (employmentStatus = 'farmer', not
// a display string). UI components map these to localized labels via
// packages/shared/constants/profileOptions.ts, not via a second Title-Case DTO layer.
// ---------------------------------------------------------------------------

export type ResidenceType = 'rural' | 'urban';
export type MaritalStatus = 'single' | 'married' | 'widowed' | 'divorced_separated' | 'prefer_not_to_say';
export type EducationLevel =
  | 'not_studying'
  | 'school_1_5'
  | 'school_6_8'
  | 'school_9_10'
  | 'school_11_12'
  | 'diploma_iti'
  | 'undergraduate'
  | 'postgraduate'
  | 'phd_research'
  | 'professional_course'
  | 'vocational_skill';
/** Current work *situation* — distinct from `Occupation` (specific type of work). */
export type EmploymentStatus =
  | 'student'
  | 'employed'
  | 'self_employed'
  | 'business_owner'
  | 'farmer'
  | 'agricultural_worker'
  | 'labour_worker'
  | 'unemployed'
  | 'retired'
  | 'homemaker'
  | 'other';
export type BplEwsStatus = 'bpl' | 'ews' | 'neither' | 'not_sure' | 'prefer_not_to_say';
export type DisabilityPercentage = 'below_40' | '40_59' | '60_79' | '80_plus' | 'not_sure';
export type LandOwnership = 'yes' | 'no' | 'lease_rented' | 'not_sure';
export type LandholdingSize = 'lt_1_acre' | 'acre_1_2' | 'acre_2_5' | 'acre_5_10' | 'gt_10_acre';
export type AgricultureActivityType = 'crops' | 'horticulture' | 'dairy' | 'livestock' | 'fisheries' | 'mixed_farming' | 'other';
export type EducationStream =
  | 'science'
  | 'commerce'
  | 'arts_humanities'
  | 'engineering'
  | 'medicine'
  | 'law'
  | 'management'
  | 'agriculture'
  | 'it_computer_science'
  | 'vocational_technical'
  | 'other';
export type HousingSituation = 'own_home' | 'renting' | 'no_permanent_home' | 'temporary_kutcha' | 'other' | 'prefer_not_to_say';
export type BusinessType =
  | 'retail'
  | 'manufacturing'
  | 'services'
  | 'agriculture_related'
  | 'handicraft_artisan'
  | 'food_business'
  | 'technology'
  | 'other';
export type SpecialCircumstance =
  | 'farmer_agri_worker'
  | 'construction_labour'
  | 'entrepreneur_business'
  | 'artist_cultural'
  | 'sportsperson'
  | 'fisher'
  | 'shg_member'
  | 'senior_citizen'
  | 'widow'
  | 'person_with_disability'
  | 'ex_serviceman'
  | 'student'
  | 'unemployed'
  | 'other'
  | 'none';

/** Structured eligibility-relevant fields added to the signup/profile flow. All optional so
 * existing profiles (and users who skip them) remain fully valid — see the spec's "existing user
 * preservation" requirement. Mirrors packages/shared/contracts/{auth,profile}.ts field-for-field. */
export interface EligibilityProfileFields {
  residenceType?: ResidenceType;
  maritalStatus?: MaritalStatus;
  educationLevel?: EducationLevel;
  employmentStatus?: EmploymentStatus;
  bplEwsStatus?: BplEwsStatus;
  disabilityPercentage?: DisabilityPercentage;
  hasDependents?: boolean;
  numberOfDependents?: number;
  specialCircumstances?: SpecialCircumstance[];
  ownsAgriculturalLand?: LandOwnership;
  landholdingSize?: LandholdingSize;
  agricultureActivityType?: AgricultureActivityType;
  educationStream?: EducationStream;
  currentYearClass?: string;
  housingSituation?: HousingSituation;
  ownsResidentialLand?: boolean;
  businessType?: BusinessType;
}

export interface UserProfile extends Partial<EligibilityProfileFields> {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  dob?: string;
  age?: number;
  gender?: Gender;
  state?: string;
  district?: string;
  annualIncome?: string;
  incomeRange?: IncomeRange;
  occupation?: Occupation;
  category?: Category;
  disabilityStatus?: boolean;
  studentStatus?: boolean;
  farmerStatus?: boolean;
  seniorCitizenStatus?: boolean;
  documentsAvailability?: Record<string, boolean>;
  language: SupportedLanguage;
  consentGiven: boolean;
  phoneVerified: boolean;
  onboardingCompleted: boolean;
  /** Daily automated scheme-recommendation SMS preference (Stage 3). Defaults to true. */
  dailySchemeSmsEnabled?: boolean;
  completeness?: { isComplete: boolean; missingFields: readonly string[] };
}

export interface Scheme {
  id: string;
  title: string;
  nativeTitle?: Record<SupportedLanguage, string>;
  category: string;
  department: string;
  summary: string;
  fullDescription: string;
  eligibilityCriteria: {
    maxIncome?: string;
    allowedCategories?: Category[];
    minAge?: number;
    maxAge?: number;
    occupations?: Occupation[];
    requiresDisability?: boolean;
    genderTarget?: Gender[];
    stateRestriction?: string;
  };
  benefits: string[];
  documentsRequired: string[];
  deadline?: string;
  applicationSteps: string[];
  officialUrl: string;
  sourceVerifiedDate: string;
  isUrgent?: boolean;
  iconName: string;
  popularityScore: number;
}

export interface NotificationAlert {
  id: string;
  title: string;
  body: string;
  date: string;
  schemeId?: string;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  deepLink?: string;
}

export interface DocumentCheckItem {
  id: string;
  schemeId: string;
  documentName: string;
  description: string;
  isUploaded: boolean;
  uploadedFileName?: string;
  verificationStatus?: 'verified' | 'pending' | 'rejected' | 'not_submitted';
}

export interface AdminIngestionRecord {
  id: string;
  sourceUrl: string;
  domain: string;
  importDate: string;
  rawTitle: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'verified';
  confidenceScore: number;
  extractedDepartment: string;
  changesDetected: string;
}

export interface AdminUserRecord {
  id: string;
  phone: string;
  name: string;
  state: string;
  district: string;
  registeredDate: string;
  preferredLanguage: SupportedLanguage;
  lastActive: string;
  status: 'Active' | 'Inactive' | 'Flagged';
}

export interface AdminSMSItem {
  id: string;
  recipientPhone: string;
  message: string;
  schemeTitle: string;
  scheduledAt: string;
  status: 'Queued' | 'Sent' | 'Failed';
  priority: 'Urgent' | 'Standard';
  retryCount: number;
}

export interface AdminLogEntry {
  id: string;
  timestamp: string;
  adminUser: string;
  action: string;
  details: string;
  ipAddress: string;
  severity?: 'info' | 'warning' | 'error';
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
}

export interface AdminSourceVerification {
  id: string;
  schemeId: string;
  schemeTitle: string;
  officialSourceUrl: string;
  lastCheckedDate: string;
  httpStatus: number;
  verificationState: 'Verified' | 'Needs Review' | 'Source Unreachable';
  verifierNotes?: string;
}
