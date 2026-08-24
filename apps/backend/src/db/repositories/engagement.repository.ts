import { desc, eq } from 'drizzle-orm';
import { db } from '../connection';
import { eligibilityResults, notifications } from '../schema';

export class EligibilityResultRepository {
  async listForUser(userId: string) {
    return db
      .select()
      .from(eligibilityResults)
      .where(eq(eligibilityResults.userId, userId))
      .orderBy(desc(eligibilityResults.evaluatedAt));
  }
}

export class NotificationRepository {
  async listForUser(userId: string) {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }
}
