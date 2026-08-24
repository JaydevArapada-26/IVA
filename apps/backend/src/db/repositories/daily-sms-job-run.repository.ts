import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../connection';
import { dailySmsJobRuns } from '../schema';

/** Backs the admin operational view for the daily scheme SMS job (spec 3.32) — last run, current
 * run status, and per-run counters. Deliberately small; not a general analytics table. */
export class DailySmsJobRunRepository {
  async create(values: typeof dailySmsJobRuns.$inferInsert) {
    const [created] = await db.insert(dailySmsJobRuns).values(values).returning();
    if (!created) throw new Error('Failed to create daily_sms_job_runs row');
    return created;
  }

  async incrementCounters(
    id: string,
    delta: Partial<Record<'usersConsidered' | 'usersSkipped' | 'messagesEnqueued' | 'noSuitableSchemeCount', number>>,
  ) {
    await db
      .update(dailySmsJobRuns)
      .set({
        ...(delta.usersConsidered ? { usersConsidered: sql`${dailySmsJobRuns.usersConsidered} + ${delta.usersConsidered}` } : {}),
        ...(delta.usersSkipped ? { usersSkipped: sql`${dailySmsJobRuns.usersSkipped} + ${delta.usersSkipped}` } : {}),
        ...(delta.messagesEnqueued ? { messagesEnqueued: sql`${dailySmsJobRuns.messagesEnqueued} + ${delta.messagesEnqueued}` } : {}),
        ...(delta.noSuitableSchemeCount
          ? { noSuitableSchemeCount: sql`${dailySmsJobRuns.noSuitableSchemeCount} + ${delta.noSuitableSchemeCount}` }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(dailySmsJobRuns.id, id));
  }

  async complete(id: string, status: 'completed' | 'failed', errorSummary?: string) {
    await db
      .update(dailySmsJobRuns)
      .set({ status, finishedAt: new Date(), ...(errorSummary ? { errorSummary } : {}), updatedAt: new Date() })
      .where(eq(dailySmsJobRuns.id, id));
  }

  async listRecent(limit = 20) {
    return db.select().from(dailySmsJobRuns).orderBy(desc(dailySmsJobRuns.startedAt)).limit(limit);
  }

  async findById(id: string) {
    const rows = await db.select().from(dailySmsJobRuns).where(eq(dailySmsJobRuns.id, id)).limit(1);
    return rows[0];
  }
}
