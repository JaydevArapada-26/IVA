import { relations } from 'drizzle-orm';
import { boolean, date, index, integer, pgTable, text, uniqueIndex, uuid, timestamp } from 'drizzle-orm/pg-core';
import {
  adminRoleEnum,
  adminStatusEnum,
  agricultureActivityTypeEnum,
  bplEwsStatusEnum,
  businessTypeEnum,
  categoryEnum,
  disabilityPercentageEnum,
  educationLevelEnum,
  educationStreamEnum,
  employmentStatusEnum,
  genderEnum,
  housingSituationEnum,
  incomeRangeEnum,
  landOwnershipEnum,
  landholdingSizeEnum,
  languageCodeEnum,
  maritalStatusEnum,
  occupationEnum,
  profileStatusEnum,
  profileVersionSourceEnum,
  residenceTypeEnum,
  userStatusEnum,
} from '../enums';
import { createdAtColumn, deletedAtColumn, updatedAtColumn, uuidPk } from '../helpers';

export const users = pgTable(
  'users',
  {
    id: uuidPk(),
    // Password auth (email tab) is verified entirely by Supabase Auth's own auth.users table —
    // no password material is stored locally. This row exists once Supabase signup/login succeeds.
    authUserId: text('auth_user_id').notNull(),
    phoneNumber: text('phone_number').notNull(),
    email: text('email'),
    displayName: text('display_name'),
    username: text('username'),
    status: userStatusEnum('status').notNull().default('active'),
    // Recorded from the last explicit login/signup submission — drives whether the web app's
    // Supabase session is persisted in localStorage (survives browser restart) or sessionStorage
    // (cleared on browser close). Not touched by silent session-restore/auto-login calls.
    rememberMeEnabled: boolean('remember_me_enabled').notNull().default(false),
    lastSignInAt: timestamp('last_sign_in_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    authUserIdUnique: uniqueIndex('users_auth_user_id_unique').on(table.authUserId),
    phoneNumberUnique: uniqueIndex('users_phone_number_unique').on(table.phoneNumber),
    emailUnique: uniqueIndex('users_email_unique').on(table.email),
    usernameUnique: uniqueIndex('users_username_unique').on(table.username),
    statusIdx: index('users_status_idx').on(table.status),
  }),
);

export const profiles = pgTable(
  'profiles',
  {
    id: uuidPk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    profileStatus: profileStatusEnum('profile_status').notNull().default('incomplete'),
    languageCode: languageCodeEnum('language_code').notNull().default('en'),
    consentGiven: boolean('consent_given').notNull().default(false),
    consentUpdatedAt: timestamp('consent_updated_at', { withTimezone: true, mode: 'date' }),
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
    currentVersionNumber: integer('current_version_number').notNull().default(1),
    activeVersionId: uuid('active_version_id'),
    // Daily automated scheme-recommendation SMS preference (Stage 3). Defaults to true (opt-out
    // model) — the global DAILY_SMS_ENABLED env flag is the separate kill switch that keeps the
    // automation itself off until deliberately turned on.
    dailySchemeSmsEnabled: boolean('daily_scheme_sms_enabled').notNull().default(true),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    userIdUnique: uniqueIndex('profiles_user_id_unique').on(table.userId),
    profileStatusIdx: index('profiles_profile_status_idx').on(table.profileStatus),
    languageIdx: index('profiles_language_code_idx').on(table.languageCode),
  }),
);

export const profileVersions = pgTable(
  'profile_versions',
  {
    id: uuidPk(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    source: profileVersionSourceEnum('source').notNull().default('manual'),
    name: text('name'),
    phoneNumber: text('phone_number'),
    dateOfBirth: date('date_of_birth', { mode: 'string' }),
    age: integer('age'),
    gender: genderEnum('gender'),
    state: text('state'),
    district: text('district'),
    incomeRange: incomeRangeEnum('income_range'),
    occupation: occupationEnum('occupation'),
    category: categoryEnum('category'),
    disabilityStatus: boolean('disability_status').notNull().default(false),
    studentStatus: boolean('student_status').notNull().default(false),
    farmerStatus: boolean('farmer_status').notNull().default(false),
    seniorCitizenStatus: boolean('senior_citizen_status').notNull().default(false),
    // Document ownership (Yes/No only — IVA never stores the documents themselves, just whether
    // the citizen has each one). Nullable: null = not yet indicated, distinct from a confirmed
    // "No", so profile completeness can tell the two apart. Keys match the signup wizard's
    // document checklist ids (apps/web AuthPages.tsx DOCUMENT_ITEMS) so payloads pass through
    // without renaming. Also feeds the deterministic priority engine's document-match bonus.
    docAadhaar: boolean('doc_aadhaar'),
    docPan: boolean('doc_pan'),
    docIncome: boolean('doc_income'),
    docCaste: boolean('doc_caste'),
    docDomicile: boolean('doc_domicile'),
    docBank: boolean('doc_bank'),
    docRation: boolean('doc_ration'),
    docDisability: boolean('doc_disability'),
    docEducational: boolean('doc_educational'),
    docLand: boolean('doc_land'),
    // --- Signup profile expansion (progressive profiling) ---------------------------------
    // All nullable: null means "not yet indicated", not a negative answer — same convention as
    // the doc* flags above. Existing profile rows/users remain fully valid with these unset.
    residenceType: residenceTypeEnum('residence_type'),
    maritalStatus: maritalStatusEnum('marital_status'),
    educationLevel: educationLevelEnum('education_level'),
    // Distinct from `occupation` (specific type of work) — current work *situation*.
    employmentStatus: employmentStatusEnum('employment_status'),
    bplEwsStatus: bplEwsStatusEnum('bpl_ews_status'),
    disabilityPercentage: disabilityPercentageEnum('disability_percentage'),
    hasDependents: boolean('has_dependents'),
    numberOfDependents: integer('number_of_dependents'),
    // Multi-select, validated at the app layer against specialCircumstanceValues.
    specialCircumstances: text('special_circumstances').array(),
    ownsAgriculturalLand: landOwnershipEnum('owns_agricultural_land'),
    landholdingSize: landholdingSizeEnum('landholding_size'),
    agricultureActivityType: agricultureActivityTypeEnum('agriculture_activity_type'),
    educationStream: educationStreamEnum('education_stream'),
    // Free text ("Class 10", "2nd Year", "Postgraduate"...) — depends on educationLevel, kept
    // flexible rather than a rigid enum per the spec.
    currentYearClass: text('current_year_class'),
    housingSituation: housingSituationEnum('housing_situation'),
    ownsResidentialLand: boolean('owns_residential_land'),
    businessType: businessTypeEnum('business_type'),
    languageCode: languageCodeEnum('language_code').notNull().default('en'),
    consentGiven: boolean('consent_given').notNull().default(false),
    phoneVerified: boolean('phone_verified').notNull().default(false),
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    profileVersionUnique: uniqueIndex('profile_versions_profile_id_version_number_unique').on(
      table.profileId,
      table.versionNumber,
    ),
    profileIdx: index('profile_versions_profile_id_idx').on(table.profileId),
    sourceIdx: index('profile_versions_source_idx').on(table.source),
    versionIdx: index('profile_versions_version_number_idx').on(table.versionNumber),
  }),
);

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuidPk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: adminRoleEnum('role').notNull().default('reviewer'),
    status: adminStatusEnum('status').notNull().default('active'),
    displayName: text('display_name'),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    userIdUnique: uniqueIndex('admin_users_user_id_unique').on(table.userId),
    roleIdx: index('admin_users_role_idx').on(table.role),
    statusIdx: index('admin_users_status_idx').on(table.status),
  }),
);

export const identityRelations = {
  users: relations(users, ({ one, many }) => ({
    profile: one(profiles, {
      fields: [users.id],
      references: [profiles.userId],
    }),
    adminUser: one(adminUsers, {
      fields: [users.id],
      references: [adminUsers.userId],
    }),
    profileVersions: many(profileVersions),
  })),
  profiles: relations(profiles, ({ one, many }) => ({
    user: one(users, {
      fields: [profiles.userId],
      references: [users.id],
    }),
    activeVersion: one(profileVersions, {
      fields: [profiles.activeVersionId],
      references: [profileVersions.id],
    }),
    versions: many(profileVersions),
  })),
  profileVersions: relations(profileVersions, ({ one }) => ({
    profile: one(profiles, {
      fields: [profileVersions.profileId],
      references: [profiles.id],
    }),
    creator: one(users, {
      fields: [profileVersions.createdByUserId],
      references: [users.id],
    }),
  })),
  adminUsers: relations(adminUsers, ({ one }) => ({
    user: one(users, {
      fields: [adminUsers.userId],
      references: [users.id],
    }),
  })),
} as const;
