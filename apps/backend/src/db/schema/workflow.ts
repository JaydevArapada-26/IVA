import { boolean, index, integer, jsonb, numeric, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  importItemStatusEnum,
  importSessionStatusEnum,
  jobAttemptStatusEnum,
  reviewQueueStatusEnum,
  reviewSourceTypeEnum,
  workerJobPriorityEnum,
  workerJobQueueEnum,
  workerJobStatusEnum,
} from '../enums';
import { createdAtColumn, deletedAtColumn, sortOrderColumn, updatedAtColumn, uuidPk } from '../helpers';
import { adminUsers } from './identity';
import { schemes } from './schemes';

export const importSessions = pgTable(
  'import_sessions',
  {
    id: uuidPk(),
    uploadedByAdminUserId: uuid('uploaded_by_admin_user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'restrict' }),
    fileName: text('file_name').notNull(),
    filePath: text('file_path').notNull(),
    fileHash: text('file_hash').notNull(),
    mimeType: text('mime_type'),
    totalRows: integer('total_rows').notNull().default(0),
    processedRows: integer('processed_rows').notNull().default(0),
    successfulRows: integer('successful_rows').notNull().default(0),
    failedRows: integer('failed_rows').notNull().default(0),
    status: importSessionStatusEnum('status').notNull().default('queued'),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    fileHashUnique: uniqueIndex('import_sessions_file_hash_unique').on(table.fileHash),
    adminIdx: index('import_sessions_uploaded_by_admin_user_id_idx').on(table.uploadedByAdminUserId),
    statusIdx: index('import_sessions_status_idx').on(table.status),
  }),
);

export const importItems = pgTable(
  'import_items',
  {
    id: uuidPk(),
    importSessionId: uuid('import_session_id')
      .notNull()
      .references(() => importSessions.id, { onDelete: 'cascade' }),
    rowNumber: integer('row_number').notNull(),
    sourceRowHash: text('source_row_hash').notNull(),
    status: importItemStatusEnum('status').notNull().default('pending'),
    sourceRowData: jsonb('source_row_data').notNull(),
    extractedTitle: text('extracted_title'),
    extractedDepartmentName: text('extracted_department_name'),
    extractedCategoryName: text('extracted_category_name'),
    extractedSubcategoryName: text('extracted_subcategory_name'),
    extractedOfficialUrl: text('extracted_official_url'),
    extractedSummary: text('extracted_summary'),
    extractionConfidence: numeric('extraction_confidence', { precision: 5, scale: 2 }),
    validationNotes: text('validation_notes'),
    errorMessage: text('error_message'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    sessionIdx: index('import_items_import_session_id_idx').on(table.importSessionId),
    rowUnique: uniqueIndex('import_items_import_session_id_row_number_unique').on(
      table.importSessionId,
      table.rowNumber,
    ),
    hashUnique: uniqueIndex('import_items_import_session_id_source_row_hash_unique').on(
      table.importSessionId,
      table.sourceRowHash,
    ),
    statusIdx: index('import_items_status_idx').on(table.status),
  }),
);

export const reviewQueue = pgTable(
  'review_queue',
  {
    id: uuidPk(),
    sourceType: reviewSourceTypeEnum('source_type').notNull().default('import_item'),
    importItemId: uuid('import_item_id').references(() => importItems.id, {
      onDelete: 'set null',
    }),
    schemeId: uuid('scheme_id').references(() => schemes.id, {
      onDelete: 'set null',
    }),
    status: reviewQueueStatusEnum('status').notNull().default('pending'),
    priority: workerJobPriorityEnum('priority').notNull().default('normal'),
    confidenceScore: numeric('confidence_score', { precision: 5, scale: 2 }),
    extractionError: text('extraction_error'),
    reviewNotes: text('review_notes'),
    reviewedByAdminUserId: uuid('reviewed_by_admin_user_id').references(() => adminUsers.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
    duplicateOfSchemeId: uuid('duplicate_of_scheme_id').references(() => schemes.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    sourceTypeIdx: index('review_queue_source_type_idx').on(table.sourceType),
    statusIdx: index('review_queue_status_idx').on(table.status),
    priorityIdx: index('review_queue_priority_idx').on(table.priority),
    importItemUnique: uniqueIndex('review_queue_import_item_id_unique').on(table.importItemId),
    schemeIdx: index('review_queue_scheme_id_idx').on(table.schemeId),
    reviewerIdx: index('review_queue_reviewed_by_admin_user_id_idx').on(table.reviewedByAdminUserId),
  }),
);

export const reviewComments = pgTable(
  'review_comments',
  {
    id: uuidPk(),
    reviewQueueId: uuid('review_queue_id')
      .notNull()
      .references(() => reviewQueue.id, { onDelete: 'cascade' }),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    parentCommentId: uuid('parent_comment_id').references((): AnyPgColumn => reviewComments.id, {
      onDelete: 'cascade',
    }),
    commentText: text('comment_text').notNull(),
    isInternal: boolean('is_internal').notNull().default(true),
    sortOrder: sortOrderColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    reviewIdx: index('review_comments_review_queue_id_idx').on(table.reviewQueueId),
    adminIdx: index('review_comments_admin_user_id_idx').on(table.adminUserId),
  }),
);

export const workerJobs = pgTable(
  'worker_jobs',
  {
    id: uuidPk(),
    queueName: workerJobQueueEnum('queue_name').notNull().default('system'),
    jobType: text('job_type').notNull(),
    status: workerJobStatusEnum('status').notNull().default('queued'),
    priority: workerJobPriorityEnum('priority').notNull().default('normal'),
    retryCount: integer('retry_count').notNull().default(0),
    maxRetries: integer('max_retries').notNull().default(5),
    availableAt: timestamp('available_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    deadLetteredAt: timestamp('dead_lettered_at', { withTimezone: true, mode: 'date' }),
    lockOwner: text('lock_owner'),
    payload: jsonb('payload').notNull(),
    resultPayload: jsonb('result_payload'),
    lastError: text('last_error'),
    lastErrorStack: text('last_error_stack'),
    deadLetterReason: text('dead_letter_reason'),
    importSessionId: uuid('import_session_id').references(() => importSessions.id, {
      onDelete: 'set null',
    }),
    importItemId: uuid('import_item_id').references(() => importItems.id, {
      onDelete: 'set null',
    }),
    reviewQueueId: uuid('review_queue_id').references(() => reviewQueue.id, {
      onDelete: 'set null',
    }),
    schemeId: uuid('scheme_id').references(() => schemes.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    queueIdx: index('worker_jobs_queue_name_idx').on(table.queueName),
    statusIdx: index('worker_jobs_status_idx').on(table.status),
    priorityIdx: index('worker_jobs_priority_idx').on(table.priority),
    availableAtIdx: index('worker_jobs_available_at_idx').on(table.availableAt),
    retryCountIdx: index('worker_jobs_retry_count_idx').on(table.retryCount),
    importSessionIdx: index('worker_jobs_import_session_id_idx').on(table.importSessionId),
    importItemIdx: index('worker_jobs_import_item_id_idx').on(table.importItemId),
    reviewQueueIdx: index('worker_jobs_review_queue_id_idx').on(table.reviewQueueId),
    schemeIdx: index('worker_jobs_scheme_id_idx').on(table.schemeId),
  }),
);

export const jobAttempts = pgTable(
  'job_attempts',
  {
    id: uuidPk(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => workerJobs.id, { onDelete: 'cascade' }),
    attemptNumber: integer('attempt_number').notNull(),
    status: jobAttemptStatusEnum('status').notNull(),
    workerName: text('worker_name').notNull(),
    workerInstanceId: text('worker_instance_id'),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    durationMs: integer('duration_ms'),
    logOutput: text('log_output'),
    errorMessage: text('error_message'),
    errorStack: text('error_stack'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    jobIdx: index('job_attempts_job_id_idx').on(table.jobId),
    attemptUnique: uniqueIndex('job_attempts_job_id_attempt_number_unique').on(table.jobId, table.attemptNumber),
    statusIdx: index('job_attempts_status_idx').on(table.status),
    workerIdx: index('job_attempts_worker_name_idx').on(table.workerName),
  }),
);
