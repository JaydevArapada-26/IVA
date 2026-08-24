/**
 * Admin "Send SMS to User" pipeline.
 *
 * Scheme selection reuses the canonical SchemeRecommendationService (lib/recommendation/service.ts)
 * — the same eligible/likely-eligible-first selection the daily scheme SMS job uses, so Assistant,
 * Daily SMS, and Admin manual-send all provably pick from the same underlying logic rather than
 * three independent callers of the lower-level engines. `cooldownDays: 0` disables the recent-
 * recommendation cooldown that only makes sense for the *automated* daily job — an admin
 * deliberately clicking "Send SMS" should get today's best pick even if the same scheme was
 * already texted recently. The SMS body is deliberately minimal (scheme name + up to 2 benefits,
 * nothing else) to stay within a single Twilio segment and avoid "message length exceeded" failures.
 */
import { SmsNotificationRepository } from '../db/repositories/sms-notification.repository';
import { UserRepository } from '../db/repositories/user.repository';
import { getDailyRecommendation, type RecommendedScheme } from '../lib/recommendation/service';
import { sendSms } from '../lib/twilio/client';

const PLACEHOLDER_MESSAGE_BODY = 'Preparing message…'; // messageBody is NOT NULL; replaced once the real one is composed

export interface AdminSendSmsOutcome {
  readonly accepted: boolean;
  readonly reason?: string;
  readonly notificationId?: string;
}

async function selectTopScheme(userId: string): Promise<RecommendedScheme | undefined> {
  return getDailyRecommendation(userId, { cooldownDays: 0 });
}

function formatSchemeNameForSms(schemeName: string, shortTitle?: string | null, maxLength = 50): string {
  const candidate = shortTitle && shortTitle.trim().length > 0 ? shortTitle.trim() : schemeName.trim();
  if (candidate.length <= maxLength) {
    return candidate;
  }
  return candidate.slice(0, maxLength - 1).trimEnd() + '…';
}

function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim();
  return trimmed.length <= maxLength ? trimmed : trimmed.slice(0, maxLength - 1).trimEnd() + '…';
}

/** Scheme name + up to 2 benefits + the application link — nothing else. Benefits are kept short
 * so the total stays well under the 160-char single-segment SMS limit even with a URL attached. */
function buildSmsBody(schemeName: string, benefits: readonly string[], link: string | null): string {
  const topBenefits = benefits.slice(0, 2).map((b) => truncate(b, 40));
  const lines = [schemeName];
  if (topBenefits.length > 0) lines.push(topBenefits.join('; '));
  if (link) lines.push(link);
  return lines.join('\n');
}

/**
 * Enqueues an admin-triggered SMS and returns immediately — the actual scheme-matching/Gemini/
 * Twilio work (`processAdminSms`, below) runs afterward without the caller awaiting it, so the
 * HTTP request (and the admin's browser tab) is never blocked on the scan of published schemes.
 * The `sms_notifications` row created here is itself the lock: while its status is queued/sending,
 * `hasActive` below reports true and a second click for the same user is rejected — a lock that's
 * visible in the DB (and therefore the admin panel, on any device, after any reload) rather than
 * living only in the requesting browser tab's memory.
 */
export async function enqueueAdminSms(adminUserId: string, targetUserId: string): Promise<AdminSendSmsOutcome> {
  const smsRepo = new SmsNotificationRepository();

  const alreadyActive = await smsRepo.hasActive(targetUserId, 'admin_manual');
  if (alreadyActive) {
    return { accepted: false, reason: 'An SMS is already in progress for this user.' };
  }

  const [user] = await new UserRepository().findById(targetUserId);
  if (!user) return { accepted: false, reason: 'User not found.' };

  const created = await smsRepo.create({
    userId: targetUserId,
    notificationType: 'admin_manual',
    messageBody: PLACEHOLDER_MESSAGE_BODY,
    status: 'queued',
    triggeredByAdminUserId: adminUserId,
  });

  // Deliberately not awaited — errors are caught and persisted onto the row inside
  // processAdminSms itself, so there's nothing further for this handler to do with them.
  void processAdminSms(created.id, targetUserId);

  return { accepted: true, notificationId: created.id };
}

async function processAdminSms(notificationId: string, targetUserId: string): Promise<void> {
  const smsRepo = new SmsNotificationRepository();
  const userRepo = new UserRepository();

  try {
    await smsRepo.updateFields(notificationId, { status: 'sending' });

    const [user] = await userRepo.findById(targetUserId);
    if (!user) {
      await smsRepo.updateFields(notificationId, { status: 'failed', failureReason: 'User not found.' });
      return;
    }

    const scheme = await selectTopScheme(targetUserId);
    if (!scheme) {
      await smsRepo.updateFields(notificationId, { status: 'failed', failureReason: 'No suitable scheme found for this user.' });
      return;
    }

    const smsSchemeName = formatSchemeNameForSms(scheme.title, scheme.shortTitle, 50);

    const benefits = (scheme.benefits ?? '')
      .split(/[;\n]/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const link = scheme.applicationUrl || scheme.sourceUrl || null;
    const messageBody = buildSmsBody(smsSchemeName, benefits, link);

    let sendResult: { sid: string; status: string } | undefined;
    let failureReason: string | undefined;
    try {
      sendResult = await sendSms(user.phoneNumber, messageBody);
    } catch (error) {
      failureReason = error instanceof Error ? error.message : 'Unknown Twilio error';
    }

    await smsRepo.updateFields(notificationId, {
      schemeId: scheme.schemeId,
      messageBody,
      status: sendResult ? 'sent' : 'failed',
      ...(sendResult ? { twilioMessageSid: sendResult.sid, sentAt: new Date() } : {}),
      ...(failureReason ? { failureReason } : {}),
    });
  } catch (error) {
    // Catch-all so a bug anywhere in the pipeline still resolves the row instead of leaving it
    // stuck on "queued"/"sending" forever (which would leave the admin's button locked for good).
    const failureReason = error instanceof Error ? error.message : 'Unknown error';
    await smsRepo.updateFields(notificationId, { status: 'failed', failureReason });
  }
}
