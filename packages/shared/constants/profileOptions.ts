/**
 * Option lists for the signup wizard (apps/web AuthPages.tsx) and profile-edit view
 * (apps/web ProfileEditView.tsx) — one definition shared by both instead of each view
 * re-declaring its own copy (they previously duplicated DOCUMENT_ITEMS independently).
 *
 * Each option carries a stable `value` (matches the backend enum values in
 * apps/backend/src/db/enums.ts 1:1 — see packages/shared/types EligibilityProfileFields doc
 * comment) and a `labelKey` that resolves through packages/shared/i18n/translations.ts via
 * getTranslation(language, labelKey) — never a literal label, so every option is localized
 * automatically wherever it's rendered.
 */
import type {
  AgricultureActivityType,
  BplEwsStatus,
  BusinessType,
  DisabilityPercentage,
  EducationLevel,
  EducationStream,
  EmploymentStatus,
  HousingSituation,
  LandOwnership,
  LandholdingSize,
  MaritalStatus,
  ResidenceType,
  SpecialCircumstance,
} from '../types';

export interface ProfileOption<T extends string> {
  readonly value: T;
  readonly labelKey: string;
}

export const RESIDENCE_TYPE_OPTIONS: ReadonlyArray<ProfileOption<ResidenceType>> = [
  { value: 'rural', labelKey: 'profileOptResidenceRural' },
  { value: 'urban', labelKey: 'profileOptResidenceUrban' },
];

export const CASTE_OPTIONS: ReadonlyArray<ProfileOption<'general' | 'obc' | 'sc' | 'st' | 'ews' | 'prefer_not_to_say' | 'other'>> = [
  { value: 'general', labelKey: 'profileOptCasteGeneral' },
  { value: 'obc', labelKey: 'profileOptCasteObc' },
  { value: 'sc', labelKey: 'profileOptCasteSc' },
  { value: 'st', labelKey: 'profileOptCasteSt' },
  { value: 'ews', labelKey: 'profileOptCasteEws' },
  { value: 'prefer_not_to_say', labelKey: 'profileOptPreferNotToSay' },
  { value: 'other', labelKey: 'profileOptOther' },
];

export const EDUCATION_LEVEL_OPTIONS: ReadonlyArray<ProfileOption<EducationLevel>> = [
  { value: 'not_studying', labelKey: 'profileOptEduNotStudying' },
  { value: 'school_1_5', labelKey: 'profileOptEduSchool15' },
  { value: 'school_6_8', labelKey: 'profileOptEduSchool68' },
  { value: 'school_9_10', labelKey: 'profileOptEduSchool910' },
  { value: 'school_11_12', labelKey: 'profileOptEduSchool1112' },
  { value: 'diploma_iti', labelKey: 'profileOptEduDiplomaIti' },
  { value: 'undergraduate', labelKey: 'profileOptEduUndergraduate' },
  { value: 'postgraduate', labelKey: 'profileOptEduPostgraduate' },
  { value: 'phd_research', labelKey: 'profileOptEduPhdResearch' },
  { value: 'professional_course', labelKey: 'profileOptEduProfessional' },
  { value: 'vocational_skill', labelKey: 'profileOptEduVocational' },
];

export const EMPLOYMENT_STATUS_OPTIONS: ReadonlyArray<ProfileOption<EmploymentStatus>> = [
  { value: 'student', labelKey: 'profileOptEmpStudent' },
  { value: 'employed', labelKey: 'profileOptEmpEmployed' },
  { value: 'self_employed', labelKey: 'profileOptEmpSelfEmployed' },
  { value: 'business_owner', labelKey: 'profileOptEmpBusinessOwner' },
  { value: 'farmer', labelKey: 'profileOptEmpFarmer' },
  { value: 'agricultural_worker', labelKey: 'profileOptEmpAgriWorker' },
  { value: 'labour_worker', labelKey: 'profileOptEmpLabourWorker' },
  { value: 'unemployed', labelKey: 'profileOptEmpUnemployed' },
  { value: 'retired', labelKey: 'profileOptEmpRetired' },
  { value: 'homemaker', labelKey: 'profileOptEmpHomemaker' },
  { value: 'other', labelKey: 'profileOptOther' },
];

export const BPL_EWS_STATUS_OPTIONS: ReadonlyArray<ProfileOption<BplEwsStatus>> = [
  { value: 'bpl', labelKey: 'profileOptBplEwsBpl' },
  { value: 'ews', labelKey: 'profileOptBplEwsEws' },
  { value: 'neither', labelKey: 'profileOptBplEwsNeither' },
  { value: 'not_sure', labelKey: 'profileOptNotSure' },
  { value: 'prefer_not_to_say', labelKey: 'profileOptPreferNotToSay' },
];

export const MARITAL_STATUS_OPTIONS: ReadonlyArray<ProfileOption<MaritalStatus>> = [
  { value: 'single', labelKey: 'profileOptMaritalSingle' },
  { value: 'married', labelKey: 'profileOptMaritalMarried' },
  { value: 'widowed', labelKey: 'profileOptMaritalWidowed' },
  { value: 'divorced_separated', labelKey: 'profileOptMaritalDivorced' },
  { value: 'prefer_not_to_say', labelKey: 'profileOptPreferNotToSay' },
];

export const DISABILITY_PERCENTAGE_OPTIONS: ReadonlyArray<ProfileOption<DisabilityPercentage>> = [
  { value: 'below_40', labelKey: 'profileOptDisabilityBelow40' },
  { value: '40_59', labelKey: 'profileOptDisability4059' },
  { value: '60_79', labelKey: 'profileOptDisability6079' },
  { value: '80_plus', labelKey: 'profileOptDisability80Plus' },
  { value: 'not_sure', labelKey: 'profileOptNotSure' },
];

export const SPECIAL_CIRCUMSTANCE_OPTIONS: ReadonlyArray<ProfileOption<SpecialCircumstance>> = [
  { value: 'farmer_agri_worker', labelKey: 'profileOptCircFarmer' },
  { value: 'construction_labour', labelKey: 'profileOptCircConstruction' },
  { value: 'entrepreneur_business', labelKey: 'profileOptCircEntrepreneur' },
  { value: 'artist_cultural', labelKey: 'profileOptCircArtist' },
  { value: 'sportsperson', labelKey: 'profileOptCircSportsperson' },
  { value: 'fisher', labelKey: 'profileOptCircFisher' },
  { value: 'shg_member', labelKey: 'profileOptCircShgMember' },
  { value: 'senior_citizen', labelKey: 'profileOptCircSeniorCitizen' },
  { value: 'widow', labelKey: 'profileOptCircWidow' },
  { value: 'person_with_disability', labelKey: 'profileOptCircPwd' },
  { value: 'ex_serviceman', labelKey: 'profileOptCircExServiceman' },
  { value: 'student', labelKey: 'profileOptEmpStudent' },
  { value: 'unemployed', labelKey: 'profileOptEmpUnemployed' },
  { value: 'other', labelKey: 'profileOptOther' },
  { value: 'none', labelKey: 'profileOptCircNone' },
];

export const LAND_OWNERSHIP_OPTIONS: ReadonlyArray<ProfileOption<LandOwnership>> = [
  { value: 'yes', labelKey: 'profileOptYes' },
  { value: 'no', labelKey: 'profileOptNo' },
  { value: 'lease_rented', labelKey: 'profileOptLandLeaseRented' },
  { value: 'not_sure', labelKey: 'profileOptNotSure' },
];

export const LANDHOLDING_SIZE_OPTIONS: ReadonlyArray<ProfileOption<LandholdingSize>> = [
  { value: 'lt_1_acre', labelKey: 'profileOptLandLt1' },
  { value: 'acre_1_2', labelKey: 'profileOptLand12' },
  { value: 'acre_2_5', labelKey: 'profileOptLand25' },
  { value: 'acre_5_10', labelKey: 'profileOptLand510' },
  { value: 'gt_10_acre', labelKey: 'profileOptLandGt10' },
];

export const AGRICULTURE_ACTIVITY_TYPE_OPTIONS: ReadonlyArray<ProfileOption<AgricultureActivityType>> = [
  { value: 'crops', labelKey: 'profileOptAgriCrops' },
  { value: 'horticulture', labelKey: 'profileOptAgriHorticulture' },
  { value: 'dairy', labelKey: 'profileOptAgriDairy' },
  { value: 'livestock', labelKey: 'profileOptAgriLivestock' },
  { value: 'fisheries', labelKey: 'profileOptAgriFisheries' },
  { value: 'mixed_farming', labelKey: 'profileOptAgriMixed' },
  { value: 'other', labelKey: 'profileOptOther' },
];

export const EDUCATION_STREAM_OPTIONS: ReadonlyArray<ProfileOption<EducationStream>> = [
  { value: 'science', labelKey: 'profileOptStreamScience' },
  { value: 'commerce', labelKey: 'profileOptStreamCommerce' },
  { value: 'arts_humanities', labelKey: 'profileOptStreamArts' },
  { value: 'engineering', labelKey: 'profileOptStreamEngineering' },
  { value: 'medicine', labelKey: 'profileOptStreamMedicine' },
  { value: 'law', labelKey: 'profileOptStreamLaw' },
  { value: 'management', labelKey: 'profileOptStreamManagement' },
  { value: 'agriculture', labelKey: 'profileOptStreamAgriculture' },
  { value: 'it_computer_science', labelKey: 'profileOptStreamIt' },
  { value: 'vocational_technical', labelKey: 'profileOptStreamVocational' },
  { value: 'other', labelKey: 'profileOptOther' },
];

export const HOUSING_SITUATION_OPTIONS: ReadonlyArray<ProfileOption<HousingSituation>> = [
  { value: 'own_home', labelKey: 'profileOptHousingOwn' },
  { value: 'renting', labelKey: 'profileOptHousingRenting' },
  { value: 'no_permanent_home', labelKey: 'profileOptHousingNoPermanent' },
  { value: 'temporary_kutcha', labelKey: 'profileOptHousingKutcha' },
  { value: 'other', labelKey: 'profileOptOther' },
  { value: 'prefer_not_to_say', labelKey: 'profileOptPreferNotToSay' },
];

export const BUSINESS_TYPE_OPTIONS: ReadonlyArray<ProfileOption<BusinessType>> = [
  { value: 'retail', labelKey: 'profileOptBizRetail' },
  { value: 'manufacturing', labelKey: 'profileOptBizManufacturing' },
  { value: 'services', labelKey: 'profileOptBizServices' },
  { value: 'agriculture_related', labelKey: 'profileOptBizAgriRelated' },
  { value: 'handicraft_artisan', labelKey: 'profileOptBizHandicraft' },
  { value: 'food_business', labelKey: 'profileOptBizFood' },
  { value: 'technology', labelKey: 'profileOptBizTechnology' },
  { value: 'other', labelKey: 'profileOptOther' },
];

/** Employment statuses that reveal the conditional Agriculture section (1.14 triggers). */
export const AGRICULTURE_TRIGGER_EMPLOYMENT_STATUSES: ReadonlySet<EmploymentStatus> = new Set(['farmer', 'agricultural_worker']);
/** Special-circumstance selections that also reveal the conditional Agriculture section. */
export const AGRICULTURE_TRIGGER_CIRCUMSTANCES: ReadonlySet<SpecialCircumstance> = new Set(['farmer_agri_worker']);

/** Employment statuses that reveal the conditional Business/Entrepreneurship section (1.17). */
export const BUSINESS_TRIGGER_EMPLOYMENT_STATUSES: ReadonlySet<EmploymentStatus> = new Set(['business_owner', 'self_employed']);
export const BUSINESS_TRIGGER_CIRCUMSTANCES: ReadonlySet<SpecialCircumstance> = new Set(['entrepreneur_business']);

/** Document readiness checklist (Phase 3 of signup, and the profile-edit view) — hoisted here so
 * both apps/web/src/views/AuthPages.tsx and apps/web/src/views/ProfileEditView.tsx share one
 * definition instead of each maintaining its own copy. `id` matches
 * packages/shared/contracts/auth.ts DocumentOwnershipFields keys 1:1. */
export interface DocumentChecklistItem {
  readonly id: 'aadhaar' | 'pan' | 'income' | 'caste' | 'domicile' | 'bank' | 'ration' | 'disability' | 'educational' | 'land';
  readonly labelKey: string;
  readonly descKey: string;
}

export const DOCUMENT_ITEMS: readonly DocumentChecklistItem[] = [
  { id: 'aadhaar', labelKey: 'docAadhaarLabel', descKey: 'docAadhaarDesc' },
  { id: 'pan', labelKey: 'docPanLabel', descKey: 'docPanDesc' },
  { id: 'income', labelKey: 'docIncomeLabel', descKey: 'docIncomeDesc' },
  { id: 'caste', labelKey: 'docCasteLabel', descKey: 'docCasteDesc' },
  { id: 'domicile', labelKey: 'docDomicileLabel', descKey: 'docDomicileDesc' },
  { id: 'bank', labelKey: 'docBankLabel', descKey: 'docBankDesc' },
  { id: 'ration', labelKey: 'docRationLabel', descKey: 'docRationDesc' },
  { id: 'disability', labelKey: 'docDisabilityLabel', descKey: 'docDisabilityDesc' },
  { id: 'educational', labelKey: 'docEducationalLabel', descKey: 'docEducationalDesc' },
  { id: 'land', labelKey: 'docLandLabel', descKey: 'docLandDesc' },
];
