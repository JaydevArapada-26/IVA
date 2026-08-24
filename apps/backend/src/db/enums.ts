import { pgEnum } from 'drizzle-orm/pg-core';

export const userStatusValues = ['active', 'inactive', 'suspended', 'deleted'] as const;
export type UserStatus = (typeof userStatusValues)[number];
export const userStatusEnum = pgEnum('user_status', userStatusValues);

export const profileStatusValues = ['incomplete', 'active', 'archived', 'deleted'] as const;
export type ProfileStatus = (typeof profileStatusValues)[number];
export const profileStatusEnum = pgEnum('profile_status', profileStatusValues);

export const profileVersionSourceValues = ['manual', 'import', 'system', 'admin_edit'] as const;
export type ProfileVersionSource = (typeof profileVersionSourceValues)[number];
export const profileVersionSourceEnum = pgEnum('profile_version_source', profileVersionSourceValues);

export const languageCodeValues = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu'] as const;
export type LanguageCode = (typeof languageCodeValues)[number];
export const languageCodeEnum = pgEnum('language_code', languageCodeValues);

export const genderValues = ['male', 'female', 'transgender', 'other', 'prefer_not_to_say'] as const;
export type GenderValue = (typeof genderValues)[number];
export const genderEnum = pgEnum('gender', genderValues);

export const incomeRangeValues = ['lt_1_lakh', '1_to_25_lakh', '25_to_5_lakh', '5_to_8_lakh', 'gt_8_lakh'] as const;
export type IncomeRangeValue = (typeof incomeRangeValues)[number];
export const incomeRangeEnum = pgEnum('income_range', incomeRangeValues);

// Note: 'prefer_not_to_say' and 'other' were added after the initial release via
// `ALTER TYPE category ADD VALUE` (see migration 0006) — Postgres enums only ever grow, so this
// array must stay in the same order the values were actually added in the database.
export const categoryValues = ['general', 'obc', 'sc', 'st', 'ews', 'prefer_not_to_say', 'other'] as const;
export type CategoryValue = (typeof categoryValues)[number];
export const categoryEnum = pgEnum('category', categoryValues);

// ---------------------------------------------------------------------------
// Signup profile expansion (progressive-profiling eligibility fields)
// ---------------------------------------------------------------------------

export const residenceTypeValues = ['rural', 'urban'] as const;
export type ResidenceTypeValue = (typeof residenceTypeValues)[number];
export const residenceTypeEnum = pgEnum('residence_type', residenceTypeValues);

export const maritalStatusValues = ['single', 'married', 'widowed', 'divorced_separated', 'prefer_not_to_say'] as const;
export type MaritalStatusValue = (typeof maritalStatusValues)[number];
export const maritalStatusEnum = pgEnum('marital_status', maritalStatusValues);

export const educationLevelValues = [
  'not_studying',
  'school_1_5',
  'school_6_8',
  'school_9_10',
  'school_11_12',
  'diploma_iti',
  'undergraduate',
  'postgraduate',
  'phd_research',
  'professional_course',
  'vocational_skill',
] as const;
export type EducationLevelValue = (typeof educationLevelValues)[number];
export const educationLevelEnum = pgEnum('education_level', educationLevelValues);

// Distinct from `occupation` (specific type of work) — this is the citizen's current work
// *situation*. Kept as a separate field/enum per the spec rather than merged into occupation.
export const employmentStatusValues = [
  'student',
  'employed',
  'self_employed',
  'business_owner',
  'farmer',
  'agricultural_worker',
  'labour_worker',
  'unemployed',
  'retired',
  'homemaker',
  'other',
] as const;
export type EmploymentStatusValue = (typeof employmentStatusValues)[number];
export const employmentStatusEnum = pgEnum('employment_status', employmentStatusValues);

export const bplEwsStatusValues = ['bpl', 'ews', 'neither', 'not_sure', 'prefer_not_to_say'] as const;
export type BplEwsStatusValue = (typeof bplEwsStatusValues)[number];
export const bplEwsStatusEnum = pgEnum('bpl_ews_status', bplEwsStatusValues);

export const disabilityPercentageValues = ['below_40', '40_59', '60_79', '80_plus', 'not_sure'] as const;
export type DisabilityPercentageValue = (typeof disabilityPercentageValues)[number];
export const disabilityPercentageEnum = pgEnum('disability_percentage', disabilityPercentageValues);

export const landOwnershipValues = ['yes', 'no', 'lease_rented', 'not_sure'] as const;
export type LandOwnershipValue = (typeof landOwnershipValues)[number];
export const landOwnershipEnum = pgEnum('land_ownership', landOwnershipValues);

export const landholdingSizeValues = ['lt_1_acre', 'acre_1_2', 'acre_2_5', 'acre_5_10', 'gt_10_acre'] as const;
export type LandholdingSizeValue = (typeof landholdingSizeValues)[number];
export const landholdingSizeEnum = pgEnum('landholding_size', landholdingSizeValues);

export const agricultureActivityTypeValues = [
  'crops',
  'horticulture',
  'dairy',
  'livestock',
  'fisheries',
  'mixed_farming',
  'other',
] as const;
export type AgricultureActivityTypeValue = (typeof agricultureActivityTypeValues)[number];
export const agricultureActivityTypeEnum = pgEnum('agriculture_activity_type', agricultureActivityTypeValues);

export const educationStreamValues = [
  'science',
  'commerce',
  'arts_humanities',
  'engineering',
  'medicine',
  'law',
  'management',
  'agriculture',
  'it_computer_science',
  'vocational_technical',
  'other',
] as const;
export type EducationStreamValue = (typeof educationStreamValues)[number];
export const educationStreamEnum = pgEnum('education_stream', educationStreamValues);

export const housingSituationValues = [
  'own_home',
  'renting',
  'no_permanent_home',
  'temporary_kutcha',
  'other',
  'prefer_not_to_say',
] as const;
export type HousingSituationValue = (typeof housingSituationValues)[number];
export const housingSituationEnum = pgEnum('housing_situation', housingSituationValues);

export const businessTypeValues = [
  'retail',
  'manufacturing',
  'services',
  'agriculture_related',
  'handicraft_artisan',
  'food_business',
  'technology',
  'other',
] as const;
export type BusinessTypeValue = (typeof businessTypeValues)[number];
export const businessTypeEnum = pgEnum('business_type', businessTypeValues);

// Multi-select — stored as a text array on profile_versions, validated at the app layer against
// this list (same convention as schemes.categories/tags, which are also plain text arrays).
export const specialCircumstanceValues = [
  'farmer_agri_worker',
  'construction_labour',
  'entrepreneur_business',
  'artist_cultural',
  'sportsperson',
  'fisher',
  'shg_member',
  'senior_citizen',
  'widow',
  'person_with_disability',
  'ex_serviceman',
  'student',
  'unemployed',
  'other',
  'none',
] as const;
export type SpecialCircumstanceValue = (typeof specialCircumstanceValues)[number];

export const occupationValues = [
  'farmer',
  'laborer',
  'student',
  'self_employed',
  'unemployed',
  'private_sector',
  'government_sector',
  'homemaker',
] as const;
export type OccupationValue = (typeof occupationValues)[number];
export const occupationEnum = pgEnum('occupation', occupationValues);

export const schemePublicationStatusValues = [
  'draft',
  'in_review',
  'published',
  'archived',
  'retired',
] as const;
export type SchemePublicationStatus = (typeof schemePublicationStatusValues)[number];
export const schemePublicationStatusEnum = pgEnum('scheme_publication_status', schemePublicationStatusValues);

export const schemeSourceTypeValues = [
  'official_portal',
  'notification',
  'gazette',
  'pdf',
  'web_page',
  'manual',
  'other',
] as const;
export type SchemeSourceType = (typeof schemeSourceTypeValues)[number];
export const schemeSourceTypeEnum = pgEnum('scheme_source_type', schemeSourceTypeValues);

export const schemeSourceVerificationStatusValues = [
  'unverified',
  'pending',
  'verified',
  'needs_review',
  'unreachable',
  'rejected',
] as const;
export type SchemeSourceVerificationStatus = (typeof schemeSourceVerificationStatusValues)[number];
export const schemeSourceVerificationStatusEnum = pgEnum(
  'scheme_source_verification_status',
  schemeSourceVerificationStatusValues,
);

export const schemeBenefitTypeValues = [
  'financial',
  'insurance',
  'subsidy',
  'service',
  'loan',
  'education',
  'housing',
  'healthcare',
  'employment',
  'other',
] as const;
export type SchemeBenefitType = (typeof schemeBenefitTypeValues)[number];
export const schemeBenefitTypeEnum = pgEnum('scheme_benefit_type', schemeBenefitTypeValues);

export const eligibilityLogicOperatorValues = ['and', 'or'] as const;
export type EligibilityLogicOperator = (typeof eligibilityLogicOperatorValues)[number];
export const eligibilityLogicOperatorEnum = pgEnum('eligibility_logic_operator', eligibilityLogicOperatorValues);

export const eligibilityComparisonOperatorValues = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
  'in',
  'contains',
  'exists',
] as const;
export type EligibilityComparisonOperator = (typeof eligibilityComparisonOperatorValues)[number];
export const eligibilityComparisonOperatorEnum = pgEnum(
  'eligibility_comparison_operator',
  eligibilityComparisonOperatorValues,
);

export const eligibilitySourceKindValues = [
  'profile_field',
  'derived_value',
  'document',
  'scheme_metadata',
] as const;
export type EligibilitySourceKind = (typeof eligibilitySourceKindValues)[number];
export const eligibilitySourceKindEnum = pgEnum('eligibility_source_kind', eligibilitySourceKindValues);

export const reviewQueueStatusValues = [
  'pending',
  'needs_review',
  'approved',
  'rejected',
  'duplicate',
  'extraction_failed',
  'updated',
] as const;
export type ReviewQueueStatus = (typeof reviewQueueStatusValues)[number];
export const reviewQueueStatusEnum = pgEnum('review_queue_status', reviewQueueStatusValues);

export const reviewSourceTypeValues = ['import_item', 'manual', 'api', 'system'] as const;
export type ReviewSourceType = (typeof reviewSourceTypeValues)[number];
export const reviewSourceTypeEnum = pgEnum('review_source_type', reviewSourceTypeValues);

export const importSessionStatusValues = ['queued', 'processing', 'completed', 'failed', 'cancelled'] as const;
export type ImportSessionStatus = (typeof importSessionStatusValues)[number];
export const importSessionStatusEnum = pgEnum('import_session_status', importSessionStatusValues);

export const importItemStatusValues = [
  'pending',
  'validated',
  'needs_review',
  'approved',
  'rejected',
  'duplicate',
  'extraction_failed',
  'imported',
] as const;
export type ImportItemStatus = (typeof importItemStatusValues)[number];
export const importItemStatusEnum = pgEnum('import_item_status', importItemStatusValues);

export const workerJobQueueValues = ['ingestion', 'sms', 'assistant', 'admin', 'review', 'system'] as const;
export type WorkerJobQueue = (typeof workerJobQueueValues)[number];
export const workerJobQueueEnum = pgEnum('worker_job_queue', workerJobQueueValues);

export const workerJobStatusValues = [
  'queued',
  'running',
  'completed',
  'failed',
  'retrying',
  'dead_letter',
] as const;
export type WorkerJobStatus = (typeof workerJobStatusValues)[number];
export const workerJobStatusEnum = pgEnum('worker_job_status', workerJobStatusValues);

export const workerJobPriorityValues = ['low', 'normal', 'high', 'urgent'] as const;
export type WorkerJobPriority = (typeof workerJobPriorityValues)[number];
export const workerJobPriorityEnum = pgEnum('worker_job_priority', workerJobPriorityValues);

export const jobAttemptStatusValues = ['running', 'completed', 'failed'] as const;
export type JobAttemptStatus = (typeof jobAttemptStatusValues)[number];
export const jobAttemptStatusEnum = pgEnum('job_attempt_status', jobAttemptStatusValues);

export const applicationStatusValues = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'withdrawn',
  'disbursed',
  'completed',
] as const;
export type ApplicationStatus = (typeof applicationStatusValues)[number];
export const applicationStatusEnum = pgEnum('application_status', applicationStatusValues);

export const savedSchemeSourceValues = ['manual', 'recommendation', 'imported'] as const;
export type SavedSchemeSource = (typeof savedSchemeSourceValues)[number];
export const savedSchemeSourceEnum = pgEnum('saved_scheme_source', savedSchemeSourceValues);

export const eligibilityResultStatusValues = ['eligible', 'ineligible', 'partial', 'unknown'] as const;
export type EligibilityResultStatus = (typeof eligibilityResultStatusValues)[number];
export const eligibilityResultStatusEnum = pgEnum('eligibility_result_status', eligibilityResultStatusValues);

export const notificationChannelValues = ['in_app', 'sms', 'email', 'push'] as const;
export type NotificationChannel = (typeof notificationChannelValues)[number];
export const notificationChannelEnum = pgEnum('notification_channel', notificationChannelValues);

export const notificationStatusValues = ['queued', 'sent', 'delivered', 'read', 'failed', 'cancelled'] as const;
export type NotificationStatus = (typeof notificationStatusValues)[number];
export const notificationStatusEnum = pgEnum('notification_status', notificationStatusValues);

export const notificationTypeValues = [
  'scheme_alert',
  'deadline_reminder',
  'application_update',
  'eligibility_update',
  'sms_delivery',
  'admin_broadcast',
  'system',
] as const;
export type NotificationType = (typeof notificationTypeValues)[number];
export const notificationTypeEnum = pgEnum('notification_type', notificationTypeValues);

export const smsStatusValues = ['queued', 'sending', 'sent', 'failed', 'dead_letter', 'cancelled'] as const;
export type SmsStatus = (typeof smsStatusValues)[number];
export const smsStatusEnum = pgEnum('sms_status', smsStatusValues);

export const adminRoleValues = ['owner', 'super_admin', 'reviewer', 'operator', 'auditor'] as const;
export type AdminRole = (typeof adminRoleValues)[number];
export const adminRoleEnum = pgEnum('admin_role', adminRoleValues);

export const adminStatusValues = ['active', 'disabled', 'locked'] as const;
export type AdminStatus = (typeof adminStatusValues)[number];
export const adminStatusEnum = pgEnum('admin_status', adminStatusValues);

export const messageRoleValues = ['system', 'user', 'assistant', 'tool'] as const;
export type MessageRole = (typeof messageRoleValues)[number];
export const messageRoleEnum = pgEnum('message_role', messageRoleValues);

export const conversationStatusValues = ['active', 'archived', 'closed'] as const;
export type ConversationStatus = (typeof conversationStatusValues)[number];
export const conversationStatusEnum = pgEnum('conversation_status', conversationStatusValues);

export const auditActorTypeValues = ['user', 'admin', 'worker', 'system'] as const;
export type AuditActorType = (typeof auditActorTypeValues)[number];
export const auditActorTypeEnum = pgEnum('audit_actor_type', auditActorTypeValues);

export const auditActionValues = [
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'duplicate',
  'publish',
  'retry',
  'import',
  'login',
  'logout',
  'assign',
  'revoke',
] as const;
export type AuditAction = (typeof auditActionValues)[number];
export const auditActionEnum = pgEnum('audit_action', auditActionValues);

export const schemeEmbeddingKindValues = [
  'overview',
  'benefits',
  'eligibility',
  'faq',
  'source',
  'full_text',
] as const;
export type SchemeEmbeddingKind = (typeof schemeEmbeddingKindValues)[number];
export const schemeEmbeddingKindEnum = pgEnum('scheme_embedding_kind', schemeEmbeddingKindValues);

// IVA SMS notification pipeline (separate from Supabase-auth-backed sms_queue / OTP delivery).
export const smsNotificationTypeValues = [
  'scheme_recommendation',
  'eligibility_alert',
  'new_scheme_alert',
  'deadline_reminder',
  'admin_manual',
] as const;
export type SmsNotificationType = (typeof smsNotificationTypeValues)[number];
export const smsNotificationTypeEnum = pgEnum('sms_notification_type', smsNotificationTypeValues);

export const smsNotificationStatusValues = [
  'queued',
  'sending',
  'sent',
  'delivered',
  'failed',
  'retrying',
  // Added for the daily scheme SMS automation: recorded (not silently dropped) when a user was
  // considered but no suitable scheme/recipient was found — see skipReason on sms_notifications.
  'skipped',
] as const;
export type SmsNotificationStatus = (typeof smsNotificationStatusValues)[number];
export const smsNotificationStatusEnum = pgEnum('sms_notification_status', smsNotificationStatusValues);

// Distinguishes an admin-triggered one-off SMS from an automated daily-recommendation SMS on the
// same sms_notifications table, so both can share one delivery-tracking table (per the "don't
// create parallel implementations" principle) while each has its own idempotency scope.
export const smsAutomationTypeValues = ['manual', 'daily_scheme_sms'] as const;
export type SmsAutomationType = (typeof smsAutomationTypeValues)[number];
export const smsAutomationTypeEnum = pgEnum('sms_automation_type', smsAutomationTypeValues);

export const dailySmsJobTriggerSourceValues = ['scheduler', 'admin_manual'] as const;
export type DailySmsJobTriggerSource = (typeof dailySmsJobTriggerSourceValues)[number];
export const dailySmsJobTriggerSourceEnum = pgEnum('daily_sms_job_trigger_source', dailySmsJobTriggerSourceValues);

export const dailySmsJobRunStatusValues = ['running', 'completed', 'failed'] as const;
export type DailySmsJobRunStatus = (typeof dailySmsJobRunStatusValues)[number];
export const dailySmsJobRunStatusEnum = pgEnum('daily_sms_job_run_status', dailySmsJobRunStatusValues);
