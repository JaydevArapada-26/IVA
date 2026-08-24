/**
 * Daily scheme SMS scheduler — checks every few minutes whether it's inside the configured send
 * window (DAILY_SMS_HOUR:DAILY_SMS_MINUTE, in APP_TIMEZONE) and today hasn't run yet, then fires
 * lib/daily-sms/job.ts. Same hand-rolled `setInterval` shape as workers/eligibility/index.ts —
 * this codebase has no cron-expression library, and a short poll interval is simpler and more
 * portable than adding one.
 *
 * The in-memory `_lastRunDate` guard below is purely an optimization to avoid re-scanning all
 * users every few minutes once today's run has already happened — it is NOT the idempotency
 * guarantee. That's the DB partial unique index on sms_notifications (see migration
 * 0006_signup_profile_and_daily_sms.sql), which stays correct across restarts, multiple backend
 * instances, and a manual admin re-trigger regardless of what this in-memory guard thinks.
 */
import { loadBackendEnv } from '../../config';
import { isWithinDailySendWindow, currentDeliveryDate } from '../../lib/time/appTimezone';
import { runDailySchemeSmsJob } from '../../lib/daily-sms/job';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes — fine-grained enough to hit an hour:minute window reliably

let _lastRunDate: string | undefined;
let _timer: ReturnType<typeof setInterval> | undefined;
let _running = false;

async function maybeRunDailyJob(): Promise<void> {
  if (_running) return; // a previous run overran the interval — don't overlap
  const env = loadBackendEnv();
  if (!env.dailySmsEnabled) return;

  const today = currentDeliveryDate();
  if (_lastRunDate === today) return;
  if (!isWithinDailySendWindow()) return;

  _running = true;
  _lastRunDate = today; // set before awaiting — a slow run must not trigger a second concurrent one
  try {
    await runDailySchemeSmsJob({ source: 'scheduler' });
  } catch (err) {
    console.error('[daily-sms-worker] Scheduled run failed:', err instanceof Error ? err.message : err);
  } finally {
    _running = false;
  }
}

export function startDailySmsWorker(): void {
  const env = loadBackendEnv();
  if (!env.dailySmsEnabled) {
    console.log('[daily-sms-worker] Disabled via DAILY_SMS_ENABLED=false');
    return;
  }

  console.log(`[daily-sms-worker] Starting — send window ${env.dailySmsHour}:${String(env.dailySmsMinute).padStart(2, '0')} (${env.appTimezone})`);
  maybeRunDailyJob().catch((err) => console.error('[daily-sms-worker] Initial check error:', err));
  _timer = setInterval(() => {
    maybeRunDailyJob().catch((err) => console.error('[daily-sms-worker] Interval check error:', err));
  }, CHECK_INTERVAL_MS);
}

export function stopDailySmsWorker(): void {
  if (_timer !== undefined) {
    clearInterval(_timer);
    _timer = undefined;
    console.log('[daily-sms-worker] Stopped.');
  }
}
