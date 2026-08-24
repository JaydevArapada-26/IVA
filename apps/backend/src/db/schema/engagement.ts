import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  applicationStatusEnum,
  dailySmsJobRunStatusEnum,
  dailySmsJobTriggerSourceEnum,
  eligibilityResultStatusEnum,
  languageCodeEnum,
  notificationChannelEnum,
  notificationStatusEnum,
  notificationTypeEnum,
  savedSchemeSourceEnum,
  smsAutomationTypeEnum,
  smsNotificationStatusEnum,
  smsNotificationTypeEnum,
  smsStatusEnum,
  workerJobPriorityEnum,
} from '../enums';
import { createdAtColumn, deletedAtColumn, updatedAtColumn, uuidPk } from '../helpers';
import { adminUsers, profileVersions, profiles, users } from './identity';
import { schemes } from './schemes';

export const applications = pgTable(
  'applications',
  {
    id: uuidPk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'restrict' }),
    profileVersionId: uuid('profile_version_id').references(() => profileVersions.id, {
      onDelete: 'set null',
    }),
    schemeId: uuid('scheme_id')
      .notNull()
      .references(() => schemes.id, { onDelete: 'restrict' }),
    applicationStatus: applicationStatusEnum('application_status').notNull().default('draft'),
    externalReference: text('external_reference'),
    applicationUrl: text('application_url'),
    submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'date' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
    decidedAt: timestamp('decided_at', { withTimezone: true, mode: 'date' }),
    rejectionReason: text('rejection_reason'),
    withdrawnReason: text('withdrawn_reason'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    userIdx: index('applications_user_id_idx').on(table.userId),
    profileIdx: index('applications_profile_id_idx').on(table.profileId),
    profileVersionIdx: index('applications_profile_version_id_idx').on(table.profileVersionId),
    schemeIdx: index('applications_scheme_id_idx').on(table.schemeId),
    statusIdx: index('applications_application_status_idx').on(table.applicationStatus),
    externalReferenceUnique: uniqueIndex('applications_external_reference_unique').on(table.externalReference),
  }),
);

export const savedSchemes = pgTable(
  'saved_schemes',
  {
    id: uuidPk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    schemeId: uuid('scheme_id')
      .notNull()
      .references(() => schemes.id, { onDelete: 'cascade' }),
    source: savedSchemeSourceEnum('source').notNull().default('manual'),
    note: text('note'),
    savedAt: timestamp('saved_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    userSchemeUnique: uniqueIndex('saved_schemes_user_id_scheme_id_unique').on(table.userId, table.schemeId),
    userIdx: index('saved_schemes_user_id_idx').on(table.userId),
    schemeIdx: index('saved_schemes_scheme_id_idx').on(table.schemeId),
  }),
);

export const eligibilityResults = pgTable(
  'eligibility_results',
  {
    id: uuidPk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'restrict' }),
    profileVersionId: uuid('profile_version_id').references(() => profileVersions.id, {
      onDelete: 'set null',
    }),
    schemeId: uuid('scheme_id')
      .notNull()
      .references(() => schemes.id, { onDelete: 'cascade' }),
    resultStatus: eligibilityResultStatusEnum('result_status').notNull().default('unknown'),
    score: numeric('score', { precision: 5, scale: 2 }),
    matchedRulesCount: integer('matched_rules_count').notNull().default(0),
    failedRulesCount: integer('failed_rules_count').notNull().default(0),
    evaluatorVersion: text('evaluator_version').notNull(),
    summary: text('summary'),
    evaluatedAt: timestamp('evaluated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    userIdx: index('eligibility_results_user_id_idx').on(table.userId),
    profileIdx: index('eligibility_results_profile_id_idx').on(table.profileId),
    profileVersionIdx: index('eligibility_results_profile_version_id_idx').on(table.profileVersionId),
    schemeIdx: index('eligibility_results_scheme_id_idx').on(table.schemeId),
    statusIdx: index('eligibility_results_result_status_idx').on(table.resultStatus),
  }),
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuidPk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'set null' }),
    schemeId: uuid('scheme_id').references(() => schemes.id, { onDelete: 'set null' }),
    notificationType: notificationTypeEnum('notification_type').notNull().default('system'),
    channel: notificationChannelEnum('channel').notNull().default('in_app'),
    status: notificationStatusEnum('status').notNull().default('queued'),
    title: text('title').notNull(),
    body: text('body').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true, mode: 'date' }),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'date' }),
    readAt: timestamp('read_at', { withTimezone: true, mode: 'date' }),
    failureReason: text('failure_reason'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    userIdx: index('notifications_user_id_idx').on(table.userId),
    schemeIdx: index('notifications_scheme_id_idx').on(table.schemeId),
    applicationIdx: index('notifications_application_id_idx').on(table.applicationId),
    statusIdx: index('notifications_status_idx').on(table.status),
    channelIdx: index('notifications_channel_idx').on(table.channel),
    typeIdx: index('notifications_notification_type_idx').on(table.notificationType),
  }),
);

export const smsQueue = pgTable(
  'sms_queue',
  {
    id: uuidPk(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    notificationId: uuid('notification_id').references(() => notifications.id, {
      onDelete: 'set null',
    }),
    phoneNumber: text('phone_number').notNull(),
    messageBody: text('message_body').notNull(),
    providerName: text('provider_name'),
    providerMessageId: text('provider_message_id'),
    status: smsStatusEnum('status').notNull().default('queued'),
    priority: workerJobPriorityEnum('priority').notNull().default('normal'),
    retryCount: integer('retry_count').notNull().default(0),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true, mode: 'date' }),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
    deadLetteredAt: timestamp('dead_lettered_at', { withTimezone: true, mode: 'date' }),
    lastError: text('last_error'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    userIdx: index('sms_queue_user_id_idx').on(table.userId),
    notificationIdx: index('sms_queue_notification_id_idx').on(table.notificationId),
    statusIdx: index('sms_queue_status_idx').on(table.status),
    priorityIdx: index('sms_queue_priority_idx').on(table.priority),
    providerIdx: index('sms_queue_provider_name_idx').on(table.providerName),
  }),
);

/**
 * IVA notification-sms pipeline — logically separate from `sms_queue` above, which backs
 * Supabase Auth's phone OTP delivery. This table backs scheme recommendation / eligibility /
 * new-scheme / deadline-reminder / admin-triggered SMS notifications sent via Twilio directly.
 */
export const smsNotifications = pgTable(
  'sms_notifications',
  {
    id: uuidPk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    schemeId: uuid('scheme_id').references(() => schemes.id, { onDelete: 'set null' }),
    notificationType: smsNotificationTypeEnum('notification_type').notNull(),
    eligibilityResultStatus: eligibilityResultStatusEnum('eligibility_result_status'),
    matchScore: numeric('match_score', { precision: 5, scale: 2 }),
    matchReasons: text('match_reasons').array(),
    messageBody: text('message_body').notNull(),
    status: smsNotificationStatusEnum('status').notNull().default('queued'),
    twilioMessageSid: text('twilio_message_sid'),
    failureReason: text('failure_reason'),
    retryCount: integer('retry_count').notNull().default(0),
    triggeredByAdminUserId: uuid('triggered_by_admin_user_id').references(() => adminUsers.id, {
      onDelete: 'set null',
    }),
    // --- Daily scheme SMS automation (Stage 3) ---------------------------------------------
    // Distinguishes an admin one-off send from an automated daily pick on this same table.
    // Defaults to 'manual' so every pre-existing row (and every future admin send, which sets
    // this explicitly) is unambiguously outside the daily job's idempotency scope below.
    automationType: smsAutomationTypeEnum('automation_type').notNull().default('manual'),
    // Only ever set for automationType = 'daily_scheme_sms' rows — the calendar day (Asia/Kolkata
    // by default; see APP_TIMEZONE) this automated send belongs to. Paired with the partial
    // unique index below, this is the actual "one automated SMS per user per day" guarantee.
    deliveryDate: date('delivery_date', { mode: 'string' }),
    locale: languageCodeEnum('locale'),
    // Recorded when a considered user was skipped instead of sent (e.g. no suitable scheme) —
    // status is 'skipped' in that case, so the daily job's per-user outcome is always visible
    // here rather than silently absent.
    skipReason: text('skip_reason'),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    userIdx: index('sms_notifications_user_id_idx').on(table.userId),
    schemeIdx: index('sms_notifications_scheme_id_idx').on(table.schemeId),
    statusIdx: index('sms_notifications_status_idx').on(table.status),
    typeIdx: index('sms_notifications_notification_type_idx').on(table.notificationType),
    automationTypeIdx: index('sms_notifications_automation_type_idx').on(table.automationType),
    // DB-backed idempotency: at most one 'daily_scheme_sms' row per (user, delivery_date),
    // regardless of retries, restarts, concurrent workers, or a manual admin re-trigger.
    dailyUserDateUnique: uniqueIndex('sms_notifications_daily_user_date_unique')
      .on(table.userId, table.deliveryDate)
      .where(sql`${table.automationType} = 'daily_scheme_sms'`),
  }),
);

/**
 * One row per execution of the daily scheme-recommendation SMS job (scheduled or admin-triggered)
 * — backs the admin operational view (last run / status / counts), deliberately small rather than
 * a full analytics table.
 */
export const dailySmsJobRuns = pgTable(
  'daily_sms_job_runs',
  {
    id: uuidPk(),
    triggerSource: dailySmsJobTriggerSourceEnum('trigger_source').notNull(),
    triggeredByAdminUserId: uuid('triggered_by_admin_user_id').references(() => adminUsers.id, {
      onDelete: 'set null',
    }),
    deliveryDate: date('delivery_date', { mode: 'string' }).notNull(),
    status: dailySmsJobRunStatusEnum('status').notNull().default('running'),
    usersConsidered: integer('users_considered').notNull().default(0),
    usersSkipped: integer('users_skipped').notNull().default(0),
    messagesEnqueued: integer('messages_enqueued').notNull().default(0),
    noSuitableSchemeCount: integer('no_suitable_scheme_count').notNull().default(0),
    errorSummary: text('error_summary'),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    statusIdx: index('daily_sms_job_runs_status_idx').on(table.status),
    deliveryDateIdx: index('daily_sms_job_runs_delivery_date_idx').on(table.deliveryDate),
  }),
);
