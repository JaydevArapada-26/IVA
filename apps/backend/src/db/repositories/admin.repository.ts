import { desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../connection';
import {
  adminUsers,
  auditLogs,
  governmentDepartments,
  languages,
  notifications,
  reviewQueue,
  schemeCategories,
  schemeSources,
  schemes,
  smsNotifications,
  smsQueue,
  users,
  workerJobs,
  importItems,
} from '../schema';
import { slugify } from '../../lib/text';

const countExpr = sql<number>`count(*)`.mapWith(Number);

export class AdminRepository {
  /** Reflects live table data — no cached/derived counters — so the dashboard is accurate on every poll. */
  async stats() {
    const [
      publishedSchemesRows,
      totalSchemesRows,
      activeUsersRows,
      totalUsersRows,
      smsSentRows,
      smsQueuedRows,
      languagesConfiguredRows,
    ] = await Promise.all([
      db.select({ value: countExpr }).from(schemes).where(eq(schemes.publicationStatus, 'published')),
      db.select({ value: countExpr }).from(schemes),
      db.select({ value: countExpr }).from(users).where(eq(users.status, 'active')),
      db.select({ value: countExpr }).from(users),
      db.select({ value: countExpr }).from(smsNotifications).where(inArray(smsNotifications.status, ['sent', 'delivered'])),
      db.select({ value: countExpr }).from(smsNotifications).where(inArray(smsNotifications.status, ['queued', 'sending', 'retrying'])),
      db.select({ value: countExpr }).from(languages).where(eq(languages.isActive, true)),
    ]);

    return {
      publishedSchemes: publishedSchemesRows[0]?.value ?? 0,
      totalSchemes: totalSchemesRows[0]?.value ?? 0,
      activeUsers: activeUsersRows[0]?.value ?? 0,
      totalUsers: totalUsersRows[0]?.value ?? 0,
      smsSent: smsSentRows[0]?.value ?? 0,
      smsQueued: smsQueuedRows[0]?.value ?? 0,
      languagesConfigured: languagesConfiguredRows[0]?.value ?? 0,
    };
  }

  async listLogs(limit = 200) {
    return db
      .select({
        id: auditLogs.id,
        actorType: auditLogs.actorType,
        actorUserName: users.displayName,
        actorUserPhone: users.phoneNumber,
        actorAdminName: adminUsers.displayName,
        actorKey: auditLogs.actorKey,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        reason: auditLogs.reason,
        occurredAt: auditLogs.occurredAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .leftJoin(adminUsers, eq(auditLogs.actorAdminUserId, adminUsers.id))
      .orderBy(desc(auditLogs.occurredAt))
      .limit(limit);
  }

  async recordAuditLog(entry: typeof auditLogs.$inferInsert) {
    await db.insert(auditLogs).values(entry);
  }

  async deleteAuditLog(id: string) {
    const [deleted] = await db.delete(auditLogs).where(eq(auditLogs.id, id)).returning();
    return deleted;
  }

  async deleteAuditLogs(ids: readonly string[]) {
    if (ids.length === 0) return [];
    return db.delete(auditLogs).where(inArray(auditLogs.id, ids)).returning();
  }

  async listSmsQueue(limit = 200) {
    return db
      .select({
        id: smsQueue.id,
        phoneNumber: smsQueue.phoneNumber,
        messageBody: smsQueue.messageBody,
        status: smsQueue.status,
        scheduledAt: smsQueue.scheduledAt,
        sentAt: smsQueue.sentAt,
        schemeTitle: schemes.schemeName,
      })
      .from(smsQueue)
      .leftJoin(notifications, eq(smsQueue.notificationId, notifications.id))
      .leftJoin(schemes, eq(notifications.schemeId, schemes.id))
      .orderBy(desc(smsQueue.createdAt))
      .limit(limit);
  }

  async listSources(limit = 300) {
    return db
      .select({
        id: schemeSources.id,
        schemeTitle: schemes.schemeName,
        sourceUrl: schemeSources.sourceUrl,
        verificationStatus: schemeSources.verificationStatus,
        httpStatus: schemeSources.httpStatus,
        lastCheckedAt: schemeSources.lastCheckedAt,
      })
      .from(schemeSources)
      .innerJoin(schemes, eq(schemeSources.schemeId, schemes.id))
      .orderBy(desc(schemeSources.updatedAt))
      .limit(limit);
  }

  async findSourceById(sourceId: string) {
    const rows = await db.select().from(schemeSources).where(eq(schemeSources.id, sourceId)).limit(1);
    return rows[0];
  }

  async updateSourceVerification(
    sourceId: string,
    values: Partial<
      Pick<typeof schemeSources.$inferInsert, 'verificationStatus' | 'httpStatus' | 'lastCheckedAt' | 'verifiedAt' | 'notes'>
    >,
  ) {
    const [updated] = await db
      .update(schemeSources)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(schemeSources.id, sourceId))
      .returning();
    return updated;
  }

  async findSourceWithSchemeTitle(sourceId: string) {
    const rows = await db
      .select({
        id: schemeSources.id,
        schemeTitle: schemes.schemeName,
        sourceUrl: schemeSources.sourceUrl,
        verificationStatus: schemeSources.verificationStatus,
        httpStatus: schemeSources.httpStatus,
        lastCheckedAt: schemeSources.lastCheckedAt,
      })
      .from(schemeSources)
      .innerJoin(schemes, eq(schemeSources.schemeId, schemes.id))
      .where(eq(schemeSources.id, sourceId))
      .limit(1);
    return rows[0];
  }

  async listReviewQueue(limit = 300) {
    return db
      .select({
        id: reviewQueue.id,
        sourceType: reviewQueue.sourceType,
        status: reviewQueue.status,
        priority: reviewQueue.priority,
        confidenceScore: reviewQueue.confidenceScore,
        schemeTitle: schemes.schemeName,
        extractedTitle: importItems.extractedTitle,
        createdAt: reviewQueue.createdAt,
      })
      .from(reviewQueue)
      .leftJoin(schemes, eq(reviewQueue.schemeId, schemes.id))
      .leftJoin(importItems, eq(reviewQueue.importItemId, importItems.id))
      .orderBy(desc(reviewQueue.createdAt))
      .limit(limit);
  }

  async findReviewQueueEntry(reviewId: string) {
    const rows = await db.select().from(reviewQueue).where(eq(reviewQueue.id, reviewId)).limit(1);
    return rows[0];
  }

  async findReviewQueueWithTitle(reviewId: string) {
    const rows = await db
      .select({
        id: reviewQueue.id,
        sourceType: reviewQueue.sourceType,
        status: reviewQueue.status,
        priority: reviewQueue.priority,
        confidenceScore: reviewQueue.confidenceScore,
        schemeTitle: schemes.schemeName,
        extractedTitle: importItems.extractedTitle,
        createdAt: reviewQueue.createdAt,
      })
      .from(reviewQueue)
      .leftJoin(schemes, eq(reviewQueue.schemeId, schemes.id))
      .leftJoin(importItems, eq(reviewQueue.importItemId, importItems.id))
      .where(eq(reviewQueue.id, reviewId))
      .limit(1);
    return rows[0];
  }

  async updateReviewQueue(
    reviewId: string,
    values: Partial<
      Pick<typeof reviewQueue.$inferInsert, 'status' | 'reviewNotes' | 'reviewedAt' | 'reviewedByAdminUserId' | 'duplicateOfSchemeId' | 'schemeId'>
    >,
  ) {
    const [updated] = await db
      .update(reviewQueue)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(reviewQueue.id, reviewId))
      .returning();
    return updated;
  }

  async findImportItem(importItemId: string) {
    const rows = await db.select().from(importItems).where(eq(importItems.id, importItemId)).limit(1);
    return rows[0];
  }

  async findOrCreateDepartment(name: string) {
    const cleanName = name.trim() || 'Unspecified Department';
    const slug = slugify(cleanName);

    const existing = await db.select().from(governmentDepartments).where(eq(governmentDepartments.slug, slug)).limit(1);
    if (existing[0]) return existing[0];

    const [created] = await db.insert(governmentDepartments).values({ name: cleanName, slug }).returning();
    if (!created) throw new Error('Failed to create government department');
    return created;
  }

  async findOrCreateCategory(name: string) {
    const cleanName = name.trim() || 'General';
    const slug = slugify(cleanName);

    const existing = await db.select().from(schemeCategories).where(eq(schemeCategories.slug, slug)).limit(1);
    if (existing[0]) return existing[0];

    const [created] = await db.insert(schemeCategories).values({ name: cleanName, slug }).returning();
    if (!created) throw new Error('Failed to create scheme category');
    return created;
  }
}
