import type { HttpRouteDefinition, JsonValue } from '../../../http/types';
import type {
  AdminBulkIdsRequest,
  AdminBulkResultResponse,
  AdminCategorizedImportRowDto,
  AdminIngestionRecordDto,
  AdminLanguageDto,
  AdminLanguageUpsertRequest,
  AdminLogEntryDto,
  AdminReviewQueueRecordDto,
  AdminSchemeDetailDto,
  AdminSchemeRecordDto,
  AdminSchemeUpsertRequest,
  AdminSendSmsResponse,
  AdminSetUserStatusRequest,
  AdminSmsRecordDto,
  AdminSourceRecordDto,
  AdminStatsDto,
  AdminUserRecordDto,
  AdminUserSmsStateDto,
  AdminUserUpdateRequest,
  AdminCanonicalImportRowDto,
  DailySmsJobRunDto,
  RunDailySmsJobResponse,
} from 'shared/contracts/admin';
import { enqueueAdminSms } from '../../../services/admin-send-sms';
import { AdminRepository } from '../../../db/repositories/admin.repository';
import { DailySmsJobRunRepository } from '../../../db/repositories/daily-sms-job-run.repository';
import { IngestionRepository } from '../../../db/repositories/ingestion.repository';
import { LanguageRepository } from '../../../db/repositories/language.repository';
import { SchemeCategorizedRepository } from '../../../db/repositories/scheme-categorized.repository';
import { SchemeRepository } from '../../../db/repositories/scheme.repository';
import { SmsNotificationRepository } from '../../../db/repositories/sms-notification.repository';
import { UserRepository } from '../../../db/repositories/user.repository';
import { createDailySmsJobRun, executeDailySmsJob } from '../../../lib/daily-sms/job';
import { db } from '../../../db';
import { schemeSources, schemes } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { err, ok, parseJsonBody, requireAdminSession } from '../../../lib/http-responses';
import { deleteSupabaseAuthUser } from '../../../lib/supabase-jwt';

function unauthorized() {
  return err('UNAUTHORIZED', 'A valid admin session token is required');
}

function toAdminSchemeRecordDto(row: {
  id: string;
  title: string;
  slug: string;
  officialUrl: string;
  isUrgent: boolean;
  isVerified: boolean;
  publicationStatus: string;
  updatedAt: Date;
  categoryName: string | null;
  departmentName: string | null;
}): AdminSchemeRecordDto {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    department: row.departmentName ?? 'Unknown Department',
    category: row.categoryName ?? 'Uncategorized',
    publicationStatus: row.publicationStatus,
    isVerified: row.isVerified,
    isUrgent: row.isUrgent,
    officialUrl: row.officialUrl,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const getAdminStatsRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/admin/stats',
  summary: 'Retrieve aggregate admin dashboard statistics',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const stats = await new AdminRepository().stats();
    const data: AdminStatsDto = stats;
    return ok(data as unknown as JsonValue);
  },
};

export const getAdminSchemesRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/admin/schemes',
  summary: 'Retrieve all schemes regardless of publication status',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const rows = await new SchemeRepository().listAllForAdmin();
    const data = rows.map(toAdminSchemeRecordDto);
    return ok(data as unknown as JsonValue);
  },
};

export const publishSchemeRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/schemes/:schemeId/publish',
  summary: 'Publish a scheme',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const schemeId = req.params.schemeId;
    if (!schemeId) return err('BAD_REQUEST', 'schemeId is required');

    const repo = new SchemeRepository();
    const updated = await repo.setPublicationStatus(schemeId, {
      publicationStatus: 'published',
      publishedAt: new Date(),
    });
    if (!updated) return err('NOT_FOUND', `No scheme found with id "${schemeId}"`);

    const record = await repo.findAdminRecordById(schemeId);
    if (!record) return err('NOT_FOUND', `No scheme found with id "${schemeId}"`);
    return ok(toAdminSchemeRecordDto(record) as unknown as JsonValue);
  },
};

export const archiveSchemeRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/schemes/:schemeId/archive',
  summary: 'Archive a scheme',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const schemeId = req.params.schemeId;
    if (!schemeId) return err('BAD_REQUEST', 'schemeId is required');

    const repo = new SchemeRepository();
    const updated = await repo.setPublicationStatus(schemeId, {
      publicationStatus: 'archived',
      archivedAt: new Date(),
    });
    if (!updated) return err('NOT_FOUND', `No scheme found with id "${schemeId}"`);

    const record = await repo.findAdminRecordById(schemeId);
    if (!record) return err('NOT_FOUND', `No scheme found with id "${schemeId}"`);
    return ok(toAdminSchemeRecordDto(record) as unknown as JsonValue);
  },
};

type SchemeRow = Awaited<ReturnType<SchemeRepository['findFullById']>>;

function toAdminSchemeDetailDto(scheme: NonNullable<SchemeRow>): AdminSchemeDetailDto {
  return {
    id: scheme.id,
    slug: scheme.slug,
    schemeName: scheme.schemeName,
    ...(scheme.shortTitle ? { shortTitle: scheme.shortTitle } : {}),
    ...(scheme.level ? { level: scheme.level } : {}),
    ...(scheme.state ? { state: scheme.state } : {}),
    ...(scheme.ministry ? { ministry: scheme.ministry } : {}),
    ...(scheme.department ? { department: scheme.department } : {}),
    ...(scheme.beneficiaryType ? { beneficiaryType: scheme.beneficiaryType } : {}),
    ...(scheme.targetBeneficiaries ? { targetBeneficiaries: scheme.targetBeneficiaries } : {}),
    ...(scheme.benefitType ? { benefitType: scheme.benefitType } : {}),
    ...(scheme.categories ? { categories: scheme.categories } : {}),
    ...(scheme.subCategories ? { subCategories: scheme.subCategories } : {}),
    ...(scheme.tags ? { tags: scheme.tags } : {}),
    briefDescription: scheme.briefDescription,
    detailedDescription: scheme.detailedDescription,
    ...(scheme.benefits ? { benefits: scheme.benefits } : {}),
    ...(scheme.eligibility ? { eligibility: scheme.eligibility } : {}),
    ...(scheme.exclusions ? { exclusions: scheme.exclusions } : {}),
    ...(scheme.applicationMode ? { applicationMode: scheme.applicationMode } : {}),
    ...(scheme.applicationProcess ? { applicationProcess: scheme.applicationProcess } : {}),
    ...(scheme.documentsRequired ? { documentsRequired: scheme.documentsRequired } : {}),
    ...(scheme.references ? { references: scheme.references } : {}),
    ...(scheme.schemeOpenDate ? { schemeOpenDate: new Date(scheme.schemeOpenDate).toISOString() } : {}),
    ...(scheme.schemeCloseDate ? { schemeCloseDate: new Date(scheme.schemeCloseDate).toISOString() } : {}),
    dbtScheme: scheme.dbtScheme,
    ...(scheme.faqCount != null ? { faqCount: scheme.faqCount } : {}),
    sourceUrl: scheme.sourceUrl,
    ...(scheme.applicationUrl ? { applicationUrl: scheme.applicationUrl } : {}),
    publicationStatus: scheme.publicationStatus,
    isUrgent: scheme.isUrgent,
    isVerified: scheme.isVerified,
    updatedAt: scheme.updatedAt.toISOString(),
    createdAt: scheme.createdAt.toISOString(),
  };
}

function fromSchemeUpsertRequest(body: Partial<AdminSchemeUpsertRequest>) {
  const values: Record<string, unknown> = {};
  if (body.slug !== undefined) values.slug = body.slug;
  if (body.schemeName !== undefined) values.schemeName = body.schemeName;
  if (body.shortTitle !== undefined) values.shortTitle = body.shortTitle;
  if (body.level !== undefined) values.level = body.level;
  if (body.state !== undefined) values.state = body.state;
  if (body.ministry !== undefined) values.ministry = body.ministry;
  if (body.department !== undefined) values.department = body.department;
  if (body.beneficiaryType !== undefined) values.beneficiaryType = body.beneficiaryType;
  if (body.targetBeneficiaries !== undefined) values.targetBeneficiaries = body.targetBeneficiaries;
  if (body.benefitType !== undefined) values.benefitType = body.benefitType;
  if (body.categories !== undefined) values.categories = [...body.categories];
  if (body.subCategories !== undefined) values.subCategories = [...body.subCategories];
  if (body.tags !== undefined) values.tags = [...body.tags];
  if (body.briefDescription !== undefined) values.briefDescription = body.briefDescription;
  if (body.detailedDescription !== undefined) values.detailedDescription = body.detailedDescription;
  if (body.benefits !== undefined) values.benefits = body.benefits;
  if (body.eligibility !== undefined) values.eligibility = body.eligibility;
  if (body.exclusions !== undefined) values.exclusions = body.exclusions;
  if (body.applicationMode !== undefined) values.applicationMode = body.applicationMode;
  if (body.applicationProcess !== undefined) values.applicationProcess = body.applicationProcess;
  if (body.documentsRequired !== undefined) values.documentsRequired = body.documentsRequired;
  if (body.references !== undefined) values.references = body.references;
  if (body.schemeOpenDate !== undefined) values.schemeOpenDate = body.schemeOpenDate ? new Date(body.schemeOpenDate) : null;
  if (body.schemeCloseDate !== undefined) values.schemeCloseDate = body.schemeCloseDate ? new Date(body.schemeCloseDate) : null;
  if (body.dbtScheme !== undefined) values.dbtScheme = body.dbtScheme;
  if (body.faqCount !== undefined) values.faqCount = body.faqCount;
  if (body.sourceUrl !== undefined) values.sourceUrl = body.sourceUrl;
  if (body.applicationUrl !== undefined) values.applicationUrl = body.applicationUrl;
  if (body.publicationStatus !== undefined) values.publicationStatus = body.publicationStatus;
  if (body.isUrgent !== undefined) values.isUrgent = body.isUrgent;
  if (body.isVerified !== undefined) values.isVerified = body.isVerified;
  return values;
}

export const getAdminSchemeDetailRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/admin/schemes/:schemeId/detail',
  summary: 'Retrieve the full flat-column record for a single scheme',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const schemeId = req.params.schemeId;
    if (!schemeId) return err('BAD_REQUEST', 'schemeId is required');

    const scheme = await new SchemeRepository().findFullById(schemeId);
    if (!scheme) return err('NOT_FOUND', `No scheme found with id "${schemeId}"`);
    return ok(toAdminSchemeDetailDto(scheme) as unknown as JsonValue);
  },
};

export const createAdminSchemeRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/schemes',
  summary: 'Create a new scheme record',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');

    const body = parsed.value as unknown as Partial<AdminSchemeUpsertRequest>;
    if (!body.slug || !body.schemeName || !body.briefDescription || !body.detailedDescription || !body.sourceUrl) {
      return err('BAD_REQUEST', 'slug, schemeName, briefDescription, detailedDescription, and sourceUrl are required');
    }

    const repo = new SchemeRepository();
    const values = fromSchemeUpsertRequest(body) as typeof schemes.$inferInsert;
    const created = await repo.createScheme(values);
    return ok(toAdminSchemeDetailDto(created) as unknown as JsonValue);
  },
};

export const updateAdminSchemeRoute: HttpRouteDefinition = {
  method: 'PATCH',
  path: '/admin/schemes/:schemeId',
  summary: 'Update a scheme record',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const schemeId = req.params.schemeId;
    if (!schemeId) return err('BAD_REQUEST', 'schemeId is required');

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');

    const repo = new SchemeRepository();
    const values = fromSchemeUpsertRequest(parsed.value as unknown as Partial<AdminSchemeUpsertRequest>) as Partial<
      typeof schemes.$inferInsert
    >;
    const updated = await repo.updateScheme(schemeId, values);
    if (!updated) return err('NOT_FOUND', `No scheme found with id "${schemeId}"`);
    return ok(toAdminSchemeDetailDto(updated) as unknown as JsonValue);
  },
};

export const deleteAdminSchemeRoute: HttpRouteDefinition = {
  method: 'DELETE',
  path: '/admin/schemes/:schemeId',
  summary: 'Hard-delete a scheme record — admin panel has direct control of the schemes table',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const schemeId = req.params.schemeId;
    if (!schemeId) return err('BAD_REQUEST', 'schemeId is required');

    const repo = new SchemeRepository();
    const deleted = await repo.deleteScheme(schemeId);
    if (!deleted) return err('NOT_FOUND', `No scheme found with id "${schemeId}"`);
    return ok({ deleted: true } as unknown as JsonValue);
  },
};

export const bulkDeleteAdminSchemesRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/schemes/bulk-delete',
  summary: 'Hard-delete multiple scheme rows at once',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');
    const body = parsed.value as unknown as AdminBulkIdsRequest;
    if (!Array.isArray(body.ids) || body.ids.length === 0) return err('BAD_REQUEST', 'ids must be a non-empty array');

    const deleted = await new SchemeRepository().deleteSchemes(body.ids);
    const data: AdminBulkResultResponse = { affected: deleted.length };
    return ok(data as unknown as JsonValue);
  },
};

function toAdminUserRecordDto(
  row: {
    id: string;
    authUserId: string;
    phoneNumber: string;
    email: string | null;
    displayName: string | null;
    status: string;
    rememberMeEnabled: boolean;
    profileStatus: string | null;
    lastSignInAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  lastAdminSms?: { status: string; schemeName: string | null; failureReason: string | null; createdAt: Date; completedAt: Date },
): AdminUserRecordDto {
  return {
    id: row.id,
    authUserId: row.authUserId,
    phoneNumber: row.phoneNumber,
    ...(row.email ? { email: row.email } : {}),
    ...(row.displayName ? { displayName: row.displayName } : {}),
    status: row.status,
    rememberMeEnabled: row.rememberMeEnabled,
    ...(row.profileStatus ? { profileStatus: row.profileStatus } : {}),
    ...(row.lastSignInAt ? { lastSignInAt: row.lastSignInAt.toISOString() } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(lastAdminSms
      ? {
          lastAdminSms: {
            status: lastAdminSms.status as AdminUserSmsStateDto['status'],
            ...(lastAdminSms.schemeName ? { schemeName: lastAdminSms.schemeName, schemeTitle: lastAdminSms.schemeName } : {}),
            ...(lastAdminSms.failureReason ? { failureReason: lastAdminSms.failureReason } : {}),
            createdAt: lastAdminSms.createdAt.toISOString(),
            completedAt: lastAdminSms.completedAt.toISOString(),
          },
        }
      : {}),
  };
}

export const getAdminUsersRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/admin/users',
  summary: 'Retrieve all citizen users with profile status — full table, admin panel is directly DB-linked',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const rows = await new UserRepository().listAllWithProfileStatus();
    const smsByUser = await new SmsNotificationRepository().listLatestByUsers(rows.map((r) => r.id), 'admin_manual');
    const data: AdminUserRecordDto[] = rows.map((row) => toAdminUserRecordDto(row, smsByUser.get(row.id)));
    return ok(data as unknown as JsonValue);
  },
};

export const updateAdminUserRoute: HttpRouteDefinition = {
  method: 'PATCH',
  path: '/admin/users/:userId',
  summary: 'Update a citizen user record and/or their active profile fields',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const userId = req.params.userId;
    if (!userId) return err('BAD_REQUEST', 'userId is required');

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');
    const body = parsed.value as unknown as AdminUserUpdateRequest;

    const repo = new UserRepository();

    const recordValues: Record<string, unknown> = {};
    if (body.displayName !== undefined) recordValues.displayName = body.displayName;
    if (body.email !== undefined) recordValues.email = body.email;
    if (body.status !== undefined) recordValues.status = body.status;
    if (Object.keys(recordValues).length > 0) {
      await repo.updateUserRecord(userId, recordValues as never);
    }

    if (body.profile) {
      await repo.applyAdminProfileEdit(userId, body.profile as never);
    }

    const rows = await repo.listAllWithProfileStatus();
    const row = rows.find((r) => r.id === userId);
    if (!row) return err('NOT_FOUND', `No user found with id "${userId}"`);

    return ok(toAdminUserRecordDto(row) as unknown as JsonValue);
  },
};

export const setAdminUserStatusRoute: HttpRouteDefinition = {
  method: 'PATCH',
  path: '/admin/users/:userId/status',
  summary: 'Enable (active) or disable (suspended/inactive) a citizen account',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const userId = req.params.userId;
    if (!userId) return err('BAD_REQUEST', 'userId is required');

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');
    const body = parsed.value as unknown as AdminSetUserStatusRequest;
    if (body.status !== 'active' && body.status !== 'inactive' && body.status !== 'suspended') {
      return err('BAD_REQUEST', 'status must be one of active, inactive, suspended');
    }

    const updated = await new UserRepository().setStatus(userId, body.status);
    if (!updated) return err('NOT_FOUND', `No user found with id "${userId}"`);
    return ok({ affected: 1 } as unknown as JsonValue);
  },
};

export const bulkSetAdminUserStatusRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/users/bulk-status',
  summary: 'Enable or disable multiple citizen accounts at once',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');
    const body = parsed.value as unknown as AdminBulkIdsRequest & AdminSetUserStatusRequest;
    if (!Array.isArray(body.ids) || body.ids.length === 0) return err('BAD_REQUEST', 'ids must be a non-empty array');
    if (body.status !== 'active' && body.status !== 'inactive' && body.status !== 'suspended') {
      return err('BAD_REQUEST', 'status must be one of active, inactive, suspended');
    }

    const updated = await new UserRepository().setStatusBulk(body.ids, body.status);
    const data: AdminBulkResultResponse = { affected: updated.length };
    return ok(data as unknown as JsonValue);
  },
};

export const bulkDeleteAdminUsersRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/users/bulk-delete',
  summary: 'Hard-delete multiple citizen user rows at once',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');
    const body = parsed.value as unknown as AdminBulkIdsRequest;
    if (!Array.isArray(body.ids) || body.ids.length === 0) return err('BAD_REQUEST', 'ids must be a non-empty array');

    const deleted = await new UserRepository().deleteUsers(body.ids);
    // Best-effort — also remove the linked Supabase Auth identities so a deleted citizen can't
    // still "exist" from Supabase's point of view (e.g. re-triggering OTPs to their number).
    await Promise.all(deleted.map((row) => deleteSupabaseAuthUser(row.authUserId)));
    const data: AdminBulkResultResponse = { affected: deleted.length };
    return ok(data as unknown as JsonValue);
  },
};

export const deleteAdminUserRoute: HttpRouteDefinition = {
  method: 'DELETE',
  path: '/admin/users/:userId',
  summary: 'Hard-delete a citizen user record (and its linked Supabase Auth user) — admin panel has direct control of the users table',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const userId = req.params.userId;
    if (!userId) return err('BAD_REQUEST', 'userId is required');

    const deleted = await new UserRepository().deleteUser(userId);
    if (!deleted) return err('NOT_FOUND', `No user found with id "${userId}"`);
    await deleteSupabaseAuthUser(deleted.authUserId);
    return ok({ deleted: true } as unknown as JsonValue);
  },
};

export const sendAdminUserSmsRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/users/:userId/send-sms',
  summary: 'Queue a deterministic best-scheme match + SMS send for a user; processing continues in the background',
  handler: async (req) => {
    const session = requireAdminSession(req);
    if (!session) return unauthorized();
    const userId = req.params.userId;
    if (!userId) return err('BAD_REQUEST', 'userId is required');

    const outcome = await enqueueAdminSms(session.adminUserId, userId);
    const data: AdminSendSmsResponse = outcome;
    return ok(data as unknown as JsonValue);
  },
};

function toDailySmsJobRunDto(row: {
  id: string;
  triggerSource: string;
  deliveryDate: string;
  status: string;
  usersConsidered: number;
  usersSkipped: number;
  messagesEnqueued: number;
  noSuitableSchemeCount: number;
  errorSummary: string | null;
  startedAt: Date;
  finishedAt: Date | null;
}): DailySmsJobRunDto {
  return {
    id: row.id,
    triggerSource: row.triggerSource as DailySmsJobRunDto['triggerSource'],
    deliveryDate: row.deliveryDate,
    status: row.status as DailySmsJobRunDto['status'],
    usersConsidered: row.usersConsidered,
    usersSkipped: row.usersSkipped,
    messagesEnqueued: row.messagesEnqueued,
    noSuitableSchemeCount: row.noSuitableSchemeCount,
    ...(row.errorSummary ? { errorSummary: row.errorSummary } : {}),
    startedAt: row.startedAt.toISOString(),
    ...(row.finishedAt ? { finishedAt: row.finishedAt.toISOString() } : {}),
  };
}

/**
 * Admin-only operational control (spec 3.31) — distinct from sendAdminUserSmsRoute above (which
 * lets an admin pick one citizen and send one message). This runs the same automated
 * recommendation logic the scheduler uses, for every eligible citizen, and still fully respects
 * the "one automated SMS per user per day" guarantee (the DB partial unique index) — it does not
 * bypass idempotency, it just triggers the same job on demand for testing/ops purposes.
 */
export const runDailySmsJobRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/daily-sms/run',
  summary: 'Manually trigger the automated daily scheme-recommendation SMS job',
  handler: async (req) => {
    const session = requireAdminSession(req);
    if (!session) return unauthorized();

    // Returns immediately; the job itself can take a while over many users (same "accept now,
    // finish in the background" shape as enqueueAdminSms). Poll GET /admin/daily-sms/runs for status.
    const trigger = { source: 'admin_manual' as const, adminUserId: session.adminUserId };
    const run = await createDailySmsJobRun(trigger);

    void executeDailySmsJob(run, trigger).catch((error) => {
      console.error('[admin] Manually-triggered daily SMS job failed:', error instanceof Error ? error.message : error);
    });

    const data: RunDailySmsJobResponse = { accepted: true, runId: run.id };
    return ok(data as unknown as JsonValue);
  },
};

export const getDailySmsJobRunsRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/admin/daily-sms/runs',
  summary: 'Retrieve recent daily scheme SMS job runs (last run / status / counts)',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const rows = await new DailySmsJobRunRepository().listRecent(20);
    const data: DailySmsJobRunDto[] = rows.map(toDailySmsJobRunDto);
    return ok(data as unknown as JsonValue);
  },
};

export const getAdminLogsRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/admin/logs',
  summary: 'Retrieve audit log entries',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const rows = await new AdminRepository().listLogs();
    const data: AdminLogEntryDto[] = rows.map((row) => ({
      id: row.id,
      actorType: row.actorType,
      actorLabel: row.actorAdminName ?? row.actorUserName ?? row.actorUserPhone ?? row.actorKey ?? row.actorType,
      action: row.action,
      entityType: row.entityType,
      ...(row.entityId ? { entityId: row.entityId } : {}),
      ...(row.reason ? { reason: row.reason } : {}),
      occurredAt: row.occurredAt.toISOString(),
    }));
    return ok(data as unknown as JsonValue);
  },
};

export const deleteAdminLogRoute: HttpRouteDefinition = {
  method: 'DELETE',
  path: '/admin/logs/:logId',
  summary: 'Hard-delete a single audit log entry',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const logId = req.params.logId;
    if (!logId) return err('BAD_REQUEST', 'logId is required');

    const deleted = await new AdminRepository().deleteAuditLog(logId);
    if (!deleted) return err('NOT_FOUND', `No audit log entry found with id "${logId}"`);
    return ok({ deleted: true } as unknown as JsonValue);
  },
};

export const bulkDeleteAdminLogsRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/logs/bulk-delete',
  summary: 'Hard-delete multiple audit log entries at once',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');
    const body = parsed.value as unknown as AdminBulkIdsRequest;
    if (!Array.isArray(body.ids) || body.ids.length === 0) return err('BAD_REQUEST', 'ids must be a non-empty array');

    const deleted = await new AdminRepository().deleteAuditLogs(body.ids);
    const data: AdminBulkResultResponse = { affected: deleted.length };
    return ok(data as unknown as JsonValue);
  },
};

function toAdminSmsRecordDto(row: {
  id: string;
  phoneNumber: string | null;
  schemeTitle: string | null;
  messageBody: string;
  status: string;
  notificationType: string;
  failureReason: string | null;
  sentAt: Date | null;
  createdAt: Date;
}): AdminSmsRecordDto {
  return {
    id: row.id,
    ...(row.phoneNumber ? { phoneNumber: row.phoneNumber } : {}),
    ...(row.schemeTitle ? { schemeTitle: row.schemeTitle } : {}),
    messageBody: row.messageBody,
    status: row.status,
    notificationType: row.notificationType,
    ...(row.failureReason ? { failureReason: row.failureReason } : {}),
    ...(row.sentAt ? { sentAt: row.sentAt.toISOString() } : {}),
    createdAt: row.createdAt.toISOString(),
  };
}

export const getAdminSmsQueueRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/admin/sms-queue',
  summary: 'Retrieve the SMS notification log (IVA notification pipeline — scheme alerts, admin-triggered sends, etc.)',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const rows = await new SmsNotificationRepository().listAllWithDetails();
    const data: AdminSmsRecordDto[] = rows.map(toAdminSmsRecordDto);
    return ok(data as unknown as JsonValue);
  },
};

export const deleteAdminSmsLogRoute: HttpRouteDefinition = {
  method: 'DELETE',
  path: '/admin/sms-queue/:smsLogId',
  summary: 'Hard-delete a single SMS log entry',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const smsLogId = req.params.smsLogId;
    if (!smsLogId) return err('BAD_REQUEST', 'smsLogId is required');

    const deleted = await new SmsNotificationRepository().deleteById(smsLogId);
    if (!deleted) return err('NOT_FOUND', `No SMS log entry found with id "${smsLogId}"`);
    return ok({ deleted: true } as unknown as JsonValue);
  },
};

export const bulkDeleteAdminSmsLogsRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/sms-queue/bulk-delete',
  summary: 'Hard-delete multiple SMS log entries at once',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');
    const body = parsed.value as unknown as AdminBulkIdsRequest;
    if (!Array.isArray(body.ids) || body.ids.length === 0) return err('BAD_REQUEST', 'ids must be a non-empty array');

    const deleted = await new SmsNotificationRepository().deleteMany(body.ids);
    const data: AdminBulkResultResponse = { affected: deleted.length };
    return ok(data as unknown as JsonValue);
  },
};

function toAdminSourceRecordDto(row: {
  id: string;
  schemeTitle: string;
  sourceUrl: string;
  verificationStatus: string;
  httpStatus: number | null;
  lastCheckedAt: Date | null;
}): AdminSourceRecordDto {
  return {
    id: row.id,
    schemeTitle: row.schemeTitle,
    sourceUrl: row.sourceUrl,
    verificationStatus: row.verificationStatus,
    ...(row.httpStatus !== null ? { httpStatus: row.httpStatus } : {}),
    ...(row.lastCheckedAt ? { lastCheckedAt: row.lastCheckedAt.toISOString() } : {}),
  };
}

export const getAdminSourcesRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/admin/sources',
  summary: 'Retrieve scheme source verification records',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const rows = await new AdminRepository().listSources();
    return ok(rows.map(toAdminSourceRecordDto) as unknown as JsonValue);
  },
};

export const reverifySourceRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/sources/:sourceId/reverify',
  summary: 'Re-check a scheme source URL and update its verification status',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const sourceId = req.params.sourceId;
    if (!sourceId) return err('BAD_REQUEST', 'sourceId is required');

    const repo = new AdminRepository();
    const source = await repo.findSourceById(sourceId);
    if (!source) return err('NOT_FOUND', `No source found with id "${sourceId}"`);

    let httpStatus: number | undefined;
    let verificationStatus: 'verified' | 'needs_review' | 'unreachable' = 'unreachable';

    try {
      let response = await fetch(source.sourceUrl, { method: 'HEAD', redirect: 'follow' });
      if (response.status === 405 || response.status === 501) {
        response = await fetch(source.sourceUrl, { method: 'GET', redirect: 'follow' });
      }
      httpStatus = response.status;
      verificationStatus = response.ok ? 'verified' : 'needs_review';
    } catch {
      httpStatus = undefined;
      verificationStatus = 'unreachable';
    }

    const now = new Date();
    await repo.updateSourceVerification(sourceId, {
      verificationStatus,
      ...(httpStatus !== undefined ? { httpStatus } : {}),
      lastCheckedAt: now,
      ...(verificationStatus === 'verified' ? { verifiedAt: now } : {}),
    });

    const updated = await repo.findSourceWithSchemeTitle(sourceId);
    if (!updated) return err('NOT_FOUND', `No source found with id "${sourceId}"`);
    return ok(toAdminSourceRecordDto(updated) as unknown as JsonValue);
  },
};

function toAdminReviewQueueRecordDto(row: {
  id: string;
  sourceType: string;
  status: string;
  priority: string;
  confidenceScore: string | null;
  schemeTitle: string | null;
  extractedTitle: string | null;
  createdAt: Date;
}): AdminReviewQueueRecordDto {
  const title = row.schemeTitle ?? row.extractedTitle;
  return {
    id: row.id,
    sourceType: row.sourceType,
    status: row.status,
    priority: row.priority,
    ...(row.confidenceScore !== null ? { confidenceScore: Number(row.confidenceScore) } : {}),
    ...(title ? { schemeTitle: title } : {}),
    createdAt: row.createdAt.toISOString(),
  };
}

export const getAdminReviewQueueRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/admin/review-queue',
  summary: 'Retrieve pending review queue entries',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const rows = await new AdminRepository().listReviewQueue();
    return ok(rows.map(toAdminReviewQueueRecordDto) as unknown as JsonValue);
  },
};

export const decideReviewRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/review-queue/:reviewId/decide',
  summary: 'Apply an approve/reject/duplicate decision to a review queue entry',
  handler: async (req) => {
    const session = requireAdminSession(req);
    if (!session) return unauthorized();

    const reviewId = req.params.reviewId;
    if (!reviewId) return err('BAD_REQUEST', 'reviewId is required');

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');

    const decision = parsed.value.decision;
    if (decision !== 'approved' && decision !== 'rejected' && decision !== 'duplicate') {
      return err('BAD_REQUEST', 'decision must be one of approved, rejected, duplicate');
    }
    const reviewNotes = typeof parsed.value.reviewNotes === 'string' ? parsed.value.reviewNotes : undefined;
    const duplicateOfSchemeId =
      typeof parsed.value.duplicateOfSchemeId === 'string' ? parsed.value.duplicateOfSchemeId : undefined;

    const repo = new AdminRepository();
    const entry = await repo.findReviewQueueEntry(reviewId);
    if (!entry) return err('NOT_FOUND', `No review queue entry found with id "${reviewId}"`);

    if (decision === 'duplicate' && !duplicateOfSchemeId) {
      return err('BAD_REQUEST', 'duplicateOfSchemeId is required when decision is duplicate');
    }

    let createdOrUpdatedSchemeId: string | undefined = entry.schemeId ?? undefined;

    if (decision === 'approved') {
      if (!entry.importItemId) {
        return err('UNPROCESSABLE_ENTITY', 'This review entry has no linked import item to publish from');
      }
      const importItem = await repo.findImportItem(entry.importItemId);
      if (!importItem) {
        return err('UNPROCESSABLE_ENTITY', 'Linked import item could not be found');
      }
      const rowData = importItem.sourceRowData as { url?: string } | null;
      const officialUrl = importItem.extractedOfficialUrl ?? rowData?.url;
      const title = importItem.extractedTitle;
      if (!title || !officialUrl) {
        return err(
          'UNPROCESSABLE_ENTITY',
          'Cannot publish: the import item is missing a required field (title or officialUrl)',
        );
      }

      const department = await repo.findOrCreateDepartment(importItem.extractedDepartmentName ?? 'Unspecified Department');
      const category = await repo.findOrCreateCategory(importItem.extractedCategoryName ?? 'General');
      const summary = importItem.extractedSummary ?? title;

      if (entry.schemeId) {
        await db
          .update(schemes)
          .set({
            schemeName: title,
            briefDescription: summary,
            detailedDescription: summary,
            sourceUrl: officialUrl,
            departmentId: department.id,
            categoryId: category.id,
            updatedAt: new Date(),
          })
          .where(eq(schemes.id, entry.schemeId));
        createdOrUpdatedSchemeId = entry.schemeId;
      } else {
        const slug = `${title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 100) || 'scheme'}-${Date.now().toString(36)}`;

        const [created] = await db
          .insert(schemes)
          .values({
            departmentId: department.id,
            categoryId: category.id,
            schemeName: title,
            slug,
            briefDescription: summary,
            detailedDescription: summary,
            sourceUrl: officialUrl,
            publicationStatus: 'in_review',
          })
          .returning();
        if (!created) return err('INTERNAL_ERROR', 'Failed to create scheme from review item');
        createdOrUpdatedSchemeId = created.id;

        await db.insert(schemeSources).values({
          schemeId: created.id,
          sourceType: 'web_page',
          sourceUrl: officialUrl,
          verificationStatus: 'unverified',
        });
      }
    }

    const status = decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'duplicate';
    await repo.updateReviewQueue(reviewId, {
      status,
      reviewedAt: new Date(),
      reviewedByAdminUserId: session.adminUserId,
      ...(reviewNotes !== undefined ? { reviewNotes } : {}),
      ...(duplicateOfSchemeId !== undefined ? { duplicateOfSchemeId } : {}),
      ...(createdOrUpdatedSchemeId !== undefined ? { schemeId: createdOrUpdatedSchemeId } : {}),
    });

    const updated = await repo.findReviewQueueWithTitle(reviewId);
    if (!updated) return err('NOT_FOUND', `No review queue entry found with id "${reviewId}"`);
    return ok(toAdminReviewQueueRecordDto(updated) as unknown as JsonValue);
  },
};

function toAdminIngestionRecordDto(row: {
  id: string;
  extractedOfficialUrl: string | null;
  sourceRowData: unknown;
  status: string;
  extractedTitle: string | null;
  extractionConfidence: string | null;
  errorMessage: string | null;
  createdAt: Date;
}): AdminIngestionRecordDto {
  const rowData = row.sourceRowData as { url?: string } | null;
  const sourceUrl = row.extractedOfficialUrl ?? rowData?.url ?? '';
  return {
    id: row.id,
    sourceUrl,
    status: row.status,
    ...(row.extractedTitle ? { extractedTitle: row.extractedTitle } : {}),
    ...(row.extractionConfidence !== null ? { extractionConfidence: Number(row.extractionConfidence) } : {}),
    ...(row.errorMessage ? { errorMessage: row.errorMessage } : {}),
    createdAt: row.createdAt.toISOString(),
  };
}

export const bulkPrepIngestionRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/ingestion/bulk-prep',
  summary: 'Fetch and pre-extract a batch of scheme source URLs into the review queue',
  handler: async (req) => {
    const session = requireAdminSession(req);
    if (!session) return unauthorized();

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');

    const urlsRaw = parsed.value.urls;
    if (!Array.isArray(urlsRaw) || urlsRaw.length === 0 || !urlsRaw.every((u) => typeof u === 'string')) {
      return err('BAD_REQUEST', 'urls must be a non-empty array of strings');
    }
    const urls = urlsRaw as string[];

    const repo = new IngestionRepository();
    const session_ = await repo.createSession(session.adminUserId, urls);

    const items = [];
    let successCount = 0;
    let failCount = 0;
    for (let i = 0; i < urls.length; i += 1) {
      const url = urls[i];
      if (!url) continue;
      const item = await repo.ingestUrl(session_.id, i + 1, url);
      items.push(item);
      if (item.status === 'extraction_failed') failCount += 1;
      else successCount += 1;
    }
    await repo.completeSession(session_.id, successCount, failCount);

    return ok(items.map(toAdminIngestionRecordDto) as unknown as JsonValue);
  },
};

export const ingestUrlRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/ingestion/url',
  summary: 'Fetch and pre-extract a single scheme source URL into the review queue',
  handler: async (req) => {
    const session = requireAdminSession(req);
    if (!session) return unauthorized();

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');

    const url = typeof parsed.value.url === 'string' ? parsed.value.url.trim() : '';
    if (!url) return err('BAD_REQUEST', 'url is required');

    const repo = new IngestionRepository();
    const session_ = await repo.createSession(session.adminUserId, [url]);
    const item = await repo.ingestUrl(session_.id, 1, url);
    await repo.completeSession(session_.id, item.status === 'extraction_failed' ? 0 : 1, item.status === 'extraction_failed' ? 1 : 0);

    return ok(toAdminIngestionRecordDto(item) as unknown as JsonValue);
  },
};

export const getAdminIngestionRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/admin/ingestion',
  summary: 'Retrieve all ingestion import items',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const rows = await new IngestionRepository().listItems();
    return ok(rows.map(toAdminIngestionRecordDto) as unknown as JsonValue);
  },
};

function toAdminLanguageDto(row: {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt: Date;
}): AdminLanguageDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    nativeName: row.nativeName,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const getAdminLanguagesRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/admin/languages',
  summary: 'Retrieve all configured UI languages',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const rows = await new LanguageRepository().listAll();
    return ok(rows.map(toAdminLanguageDto) as unknown as JsonValue);
  },
};

export const createAdminLanguageRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/languages',
  summary: 'Add a new UI language',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');

    const body = parsed.value as unknown as AdminLanguageUpsertRequest;
    if (!body.code?.trim() || !body.name?.trim() || !body.nativeName?.trim()) {
      return err('BAD_REQUEST', 'code, name, and nativeName are required');
    }

    const created = await new LanguageRepository().create({
      code: body.code.trim().toLowerCase(),
      name: body.name.trim(),
      nativeName: body.nativeName.trim(),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
    });
    return ok(toAdminLanguageDto(created) as unknown as JsonValue);
  },
};

export const updateAdminLanguageRoute: HttpRouteDefinition = {
  method: 'PATCH',
  path: '/admin/languages/:languageId',
  summary: 'Update a UI language',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const languageId = req.params.languageId;
    if (!languageId) return err('BAD_REQUEST', 'languageId is required');

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');
    const body = parsed.value as unknown as Partial<AdminLanguageUpsertRequest>;

    const values: Record<string, unknown> = {};
    if (body.code !== undefined) values.code = body.code.trim().toLowerCase();
    if (body.name !== undefined) values.name = body.name.trim();
    if (body.nativeName !== undefined) values.nativeName = body.nativeName.trim();
    if (body.isActive !== undefined) values.isActive = body.isActive;
    if (body.sortOrder !== undefined) values.sortOrder = body.sortOrder;

    const updated = await new LanguageRepository().update(languageId, values as never);
    if (!updated) return err('NOT_FOUND', `No language found with id "${languageId}"`);
    return ok(toAdminLanguageDto(updated) as unknown as JsonValue);
  },
};

export const deleteAdminLanguageRoute: HttpRouteDefinition = {
  method: 'DELETE',
  path: '/admin/languages/:languageId',
  summary: 'Remove a UI language',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();
    const languageId = req.params.languageId;
    if (!languageId) return err('BAD_REQUEST', 'languageId is required');

    const deleted = await new LanguageRepository().delete(languageId);
    if (!deleted) return err('NOT_FOUND', `No language found with id "${languageId}"`);
    return ok({ deleted: true } as unknown as JsonValue);
  },
};

export const canonicalImportRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/ingestion/canonical-import',
  summary: 'Parse and import a canonical scheme CSV as draft schemes',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');

    const csvText = typeof parsed.value.csvText === 'string' ? parsed.value.csvText : '';
    if (!csvText.trim()) return err('BAD_REQUEST', 'csvText is required');

    const results = await new IngestionRepository().importCanonicalCsv(csvText);
    const data: AdminCanonicalImportRowDto[] = results.map((r) => ({
      rowNumber: r.rowNumber,
      status: r.status,
      ...(r.extractedTitle ? { extractedTitle: r.extractedTitle } : {}),
      ...(r.errorMessage ? { errorMessage: r.errorMessage } : {}),
    }));
    return ok(data as unknown as JsonValue);
  },
};

/**
 * Imports `schemes_categorized.csv` — the deterministic matching-layer dataset, separate from
 * the canonical `schemes.csv` import above. Not wired into the admin frontend (per spec); call
 * directly via the API (or use Supabase's own CSV table-import tooling against the same table).
 */
export const categorizedImportRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/admin/ingestion/categorized-import',
  summary: 'Parse and import schemes_categorized.csv into the deterministic matching table',
  handler: async (req) => {
    if (!requireAdminSession(req)) return unauthorized();

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) return err('BAD_REQUEST', 'Request body must be valid JSON');

    const csvText = typeof parsed.value.csvText === 'string' ? parsed.value.csvText : '';
    if (!csvText.trim()) return err('BAD_REQUEST', 'csvText is required');

    const results = await new SchemeCategorizedRepository().importCategorizedCsv(csvText);
    const data: AdminCategorizedImportRowDto[] = results.map((r) => ({
      rowNumber: r.rowNumber,
      status: r.status,
      ...(r.slug ? { slug: r.slug } : {}),
      ...(r.errorMessage ? { errorMessage: r.errorMessage } : {}),
    }));
    return ok(data as unknown as JsonValue);
  },
};
