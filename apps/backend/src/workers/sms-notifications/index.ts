/**
 * SMS notifications worker — polls the `sms_notifications` queue (IVA's own notification
 * pipeline, separate from Supabase Auth's OTP `sms_queue`) and dispatches via Twilio.
 */
import { loadBackendEnv } from '../../config';
import { SmsNotificationRepository } from '../../db/repositories/sms-notification.repository';
import { UserRepository } from '../../db/repositories/user.repository';
import { sendSms } from '../../lib/twilio/client';

const POLL_INTERVAL_MS = 15_000;
const MAX_RETRIES = 3;

// Twilio error codes that mean "this destination/request can never succeed" — retrying wastes
// provider quota and delays the (correct) permanent-failure outcome. Everything else (network
// blips, rate limiting, transient provider errors) is treated as retryable.
// 21211 invalid 'To' number, 21614 not a valid mobile number, 21617 'To' exceeds max length,
// 21408/21421 permission/number not SMS-capable for this account/region.
const PERMANENT_TWILIO_ERROR_CODES = new Set([21211, 21614, 21617, 21408, 21421]);

function isPermanentFailure(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'number' && PERMANENT_TWILIO_ERROR_CODES.has(code);
}

let _timer: ReturnType<typeof setInterval> | undefined;
let _running = false;

async function processQueue(): Promise<void> {
  if (_running) return;
  _running = true;
  try {
    const smsRepo = new SmsNotificationRepository();
    const userRepo = new UserRepository();
    const queued = await smsRepo.listQueued(20);

    for (const item of queued) {
      await smsRepo.markSending(item.id);
      try {
        const [user] = await userRepo.findById(item.userId);
        if (!user) throw new Error(`User ${item.userId} not found`);

        const result = await sendSms(user.phoneNumber, item.messageBody);
        await smsRepo.markSent(item.id, result.sid);
      } catch (error) {
        const nextRetryCount = item.retryCount + 1;
        const message = error instanceof Error ? error.message : 'Unknown Twilio error';

        if (nextRetryCount <= MAX_RETRIES && !isPermanentFailure(error)) {
          // Requeue for the next poll (~15s later) rather than marking permanently failed —
          // previously this only logged "retry N/3" without actually re-queuing the row, so
          // transient failures (network blip, provider rate limit) were never retried in
          // practice. Status goes back to 'queued' so the next processQueue() tick picks it up.
          await smsRepo.updateFields(item.id, { status: 'queued', retryCount: nextRetryCount, failureReason: message });
          console.error(`[sms-notifications-worker] Send failed (retry ${nextRetryCount}/${MAX_RETRIES}) for notification ${item.id}:`, message);
        } else {
          await smsRepo.markFailed(item.id, message, nextRetryCount);
          console.error(`[sms-notifications-worker] Send permanently failed for notification ${item.id}:`, message);
        }
      }
    }
  } finally {
    _running = false;
  }
}

export async function startSmsNotificationsWorker(): Promise<void> {
  const env = loadBackendEnv();
  if (!env.twilioAccountSid || !env.twilioAuthToken) {
    console.log('[sms-notifications-worker] Disabled — Twilio is not configured.');
    return;
  }

  console.log('[sms-notifications-worker] Starting…');
  await processQueue().catch((err) => console.error('[sms-notifications-worker] Initial run error:', err));
  _timer = setInterval(() => {
    processQueue().catch((err) => console.error('[sms-notifications-worker] Poll error:', err));
  }, POLL_INTERVAL_MS);
}

export function stopSmsNotificationsWorker(): void {
  if (_timer !== undefined) {
    clearInterval(_timer);
    _timer = undefined;
    console.log('[sms-notifications-worker] Stopped.');
  }
}
