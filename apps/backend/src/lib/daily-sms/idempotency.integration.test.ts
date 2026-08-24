/**
 * Real-DB integration test for the daily scheme SMS idempotency guarantee (spec 3.7/3.8): the
 * partial unique index on sms_notifications(user_id, delivery_date) WHERE automation_type =
 * 'daily_scheme_sms' (migration 0006_signup_profile_and_daily_sms.sql). This is the one piece
 * worth hitting the live database for — it's a DB-level constraint, not application logic, so a
 * mocked test wouldn't actually prove anything about it.
 *
 * Requires DATABASE_URL to point at a reachable Postgres (same one the app uses in dev). Cleans
 * up every row/user it creates.
 */
import { describe, expect, it, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../db/connection';
import { smsNotifications, users } from '../../db/schema';
import { SmsNotificationRepository } from '../../db/repositories/sms-notification.repository';

const TEST_AUTH_ID = `vitest-idempotency-${Date.now()}`;
const TEST_PHONE = `9${String(Date.now()).slice(-9)}`;

let createdUserId: string | undefined;

afterAll(async () => {
  if (createdUserId) {
    await db.delete(smsNotifications).where(eq(smsNotifications.userId, createdUserId));
    await db.delete(users).where(eq(users.id, createdUserId));
  }
});

describe('sms_notifications partial unique index — one daily_scheme_sms row per (user, day)', () => {
  it('rejects a second automated row for the same user and delivery date, but allows a manual row on the same day', async () => {
    const [created] = await db
      .insert(users)
      .values({ authUserId: TEST_AUTH_ID, phoneNumber: TEST_PHONE, displayName: 'Vitest Idempotency', status: 'active' })
      .returning();
    expect(created).toBeDefined();
    createdUserId = created!.id;

    const smsRepo = new SmsNotificationRepository();
    const deliveryDate = '2030-01-01'; // fixed, far-future date — never collides with a real run

    const first = await smsRepo.create({
      userId: createdUserId,
      notificationType: 'scheme_recommendation',
      automationType: 'daily_scheme_sms',
      deliveryDate,
      messageBody: 'first message',
      status: 'queued',
    });
    expect(first.id).toBeTruthy();

    await expect(
      smsRepo.create({
        userId: createdUserId,
        notificationType: 'scheme_recommendation',
        automationType: 'daily_scheme_sms',
        deliveryDate,
        messageBody: 'second message — should be rejected',
        status: 'queued',
      }),
    ).rejects.toThrow();

    // A manual admin send on the very same day must NOT be blocked by the automated index —
    // it has automationType: 'manual' and deliveryDate left null, outside the index's scope.
    const manual = await smsRepo.create({
      userId: createdUserId,
      notificationType: 'admin_manual',
      automationType: 'manual',
      messageBody: 'manual send, same day',
      status: 'queued',
    });
    expect(manual.id).toBeTruthy();

    const hasToday = await smsRepo.hasAutomatedSmsForDate(createdUserId, deliveryDate);
    expect(hasToday).toBe(true);
  });
});
