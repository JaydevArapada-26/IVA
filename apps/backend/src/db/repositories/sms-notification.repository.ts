import { and, desc, eq, gte, inArray, isNotNull } from 'drizzle-orm';
import { db } from '../connection';
import { schemes, smsNotifications, users } from '../schema';

export class SmsNotificationRepository {
  async create(values: typeof smsNotifications.$inferInsert) {
    const [created] = await db.insert(smsNotifications).values(values).returning();
    if (!created) throw new Error('Failed to create sms_notifications row');
    return created;
  }

  async updateFields(id: string, values: Partial<typeof smsNotifications.$inferInsert>) {
    await db
      .update(smsNotifications)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(smsNotifications.id, id));
  }

  /** Prevents duplicate sends while a previous one is genuinely still in flight — status-based
   * (not a time window), so it stays locked exactly as long as the send actually takes and clears
   * itself the moment the background job finalizes it as sent/failed. */
  async hasActive(userId: string, notificationType: string): Promise<boolean> {
    const rows = await db
      .select({ id: smsNotifications.id })
      .from(smsNotifications)
      .where(
        and(
          eq(smsNotifications.userId, userId),
          eq(smsNotifications.notificationType, notificationType as never),
          inArray(smsNotifications.status, ['queued', 'sending']),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  /** Latest row (any status) per user for a given notification type — used to show the admin
   * panel's persistent "queued / sending / sent / failed" state, sourced from the DB rather than
   * local component state so it survives navigation and reloads. */
  async listLatestByUsers(userIds: readonly string[], notificationType: string) {
    if (userIds.length === 0)
      return new Map<string, { status: string; schemeName: string | null; failureReason: string | null; createdAt: Date; completedAt: Date }>();

    const rows = await db
      .select({
        userId: smsNotifications.userId,
        status: smsNotifications.status,
        schemeName: schemes.schemeName,
        failureReason: smsNotifications.failureReason,
        createdAt: smsNotifications.createdAt,
        // Reflects when the send actually finished (success or failure) — used by the admin panel
        // to hide the "Sent: [scheme]" status 5 real-clock seconds after completion, instead of 5
        // seconds after the page happens to mount (which made it reappear on every reload/login).
        completedAt: smsNotifications.updatedAt,
      })
      .from(smsNotifications)
      .leftJoin(schemes, eq(smsNotifications.schemeId, schemes.id))
      .where(and(inArray(smsNotifications.userId, userIds), eq(smsNotifications.notificationType, notificationType as never)))
      .orderBy(desc(smsNotifications.createdAt));

    const latestByUser = new Map<string, { status: string; schemeName: string | null; failureReason: string | null; createdAt: Date; completedAt: Date }>();
    for (const row of rows) {
      if (!latestByUser.has(row.userId)) latestByUser.set(row.userId, row);
    }
    return latestByUser;
  }

  async listQueued(limit = 50) {
    return db
      .select()
      .from(smsNotifications)
      .where(eq(smsNotifications.status, 'queued'))
      .orderBy(smsNotifications.createdAt)
      .limit(limit);
  }

  async markSending(id: string) {
    await db.update(smsNotifications).set({ status: 'sending', updatedAt: new Date() }).where(eq(smsNotifications.id, id));
  }

  async markSent(id: string, twilioMessageSid: string) {
    await db
      .update(smsNotifications)
      .set({ status: 'sent', twilioMessageSid, sentAt: new Date(), updatedAt: new Date() })
      .where(eq(smsNotifications.id, id));
  }

  async markFailed(id: string, failureReason: string, retryCount: number) {
    await db
      .update(smsNotifications)
      .set({ status: 'failed', failureReason, retryCount, updatedAt: new Date() })
      .where(eq(smsNotifications.id, id));
  }

  /** Full "SMS Logs" listing for the admin panel — every notification ever created, with the
   * recipient phone and scheme title joined in for display/search. */
  async listAllWithDetails(limit = 500) {
    return db
      .select({
        id: smsNotifications.id,
        phoneNumber: users.phoneNumber,
        schemeTitle: schemes.schemeName,
        messageBody: smsNotifications.messageBody,
        status: smsNotifications.status,
        notificationType: smsNotifications.notificationType,
        failureReason: smsNotifications.failureReason,
        twilioMessageSid: smsNotifications.twilioMessageSid,
        sentAt: smsNotifications.sentAt,
        createdAt: smsNotifications.createdAt,
      })
      .from(smsNotifications)
      .leftJoin(users, eq(smsNotifications.userId, users.id))
      .leftJoin(schemes, eq(smsNotifications.schemeId, schemes.id))
      .orderBy(desc(smsNotifications.createdAt))
      .limit(limit);
  }

  /**
   * Idempotency pre-check for the daily scheme SMS job (Stage 3) — a cheap SELECT before doing
   * any recommendation work. The real, race-safe guarantee is the partial unique index on
   * (user_id, delivery_date) WHERE automation_type = 'daily_scheme_sms' (see migration
   * 0006_signup_profile_and_daily_sms.sql); this just avoids redundant work on the common path.
   */
  async hasAutomatedSmsForDate(userId: string, deliveryDate: string): Promise<boolean> {
    const rows = await db
      .select({ id: smsNotifications.id })
      .from(smsNotifications)
      .where(
        and(
          eq(smsNotifications.userId, userId),
          eq(smsNotifications.automationType, 'daily_scheme_sms'),
          eq(smsNotifications.deliveryDate, deliveryDate),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  /** Scheme ids sent to this citizen via the daily automation within the cooldown window —
   * negative ranking signal for SchemeRecommendationService.getDailyRecommendation (spec 3.15/3.16:
   * avoid repeating the same scheme every day, without permanently blacklisting it). Only counts
   * rows that actually reached the provider (queued/sending/sent/delivered) — a skipped or failed
   * row never occupied the citizen's "today's message" and shouldn't suppress a future pick. */
  async listRecentAutomatedSchemeIds(userId: string, sinceDate: Date): Promise<readonly string[]> {
    const rows = await db
      .select({ schemeId: smsNotifications.schemeId })
      .from(smsNotifications)
      .where(
        and(
          eq(smsNotifications.userId, userId),
          eq(smsNotifications.automationType, 'daily_scheme_sms'),
          isNotNull(smsNotifications.schemeId),
          inArray(smsNotifications.status, ['queued', 'sending', 'sent', 'delivered']),
          gte(smsNotifications.createdAt, sinceDate),
        ),
      );
    return rows.flatMap((r) => (r.schemeId ? [r.schemeId] : []));
  }

  async deleteById(id: string) {
    const [deleted] = await db.delete(smsNotifications).where(eq(smsNotifications.id, id)).returning();
    return deleted;
  }

  async deleteMany(ids: readonly string[]) {
    if (ids.length === 0) return [];
    return db.delete(smsNotifications).where(inArray(smsNotifications.id, ids)).returning();
  }

  /** Scheme-recommendation SMS history for a single citizen — used by the citizen-facing
   *  "SMS History" page. Returns rows most recent first, joining scheme name for display. */
  async listForCitizen(userId: string, limit = 100) {
    return db
      .select({
        id: smsNotifications.id,
        schemeId: smsNotifications.schemeId,
        schemeTitle: schemes.schemeName,
        messageBody: smsNotifications.messageBody,
        notificationType: smsNotifications.notificationType,
        status: smsNotifications.status,
        sentAt: smsNotifications.sentAt,
        createdAt: smsNotifications.createdAt,
      })
      .from(smsNotifications)
      .leftJoin(schemes, eq(smsNotifications.schemeId, schemes.id))
      .where(eq(smsNotifications.userId, userId))
      .orderBy(desc(smsNotifications.createdAt))
      .limit(limit);
  }
}
