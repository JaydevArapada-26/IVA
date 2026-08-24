/**
 * Single source of truth for "today" and "is it currently the configured send window" in the
 * app's operational timezone (APP_TIMEZONE, default Asia/Kolkata) — spec 3.6: the same timezone
 * must define the daily "one SMS" boundary. Named appTimezone.ts rather than kolkataDate.ts since
 * the timezone itself is configurable, not hardcoded.
 */
import { loadBackendEnv } from '../../config';

/** Returns the current date as YYYY-MM-DD in the configured app timezone — the `delivery_date`
 * value written to sms_notifications and daily_sms_job_runs, and the partial unique index's
 * dedupe key (see migration 0006_signup_profile_and_daily_sms.sql). */
export function currentDeliveryDate(now: Date = new Date()): string {
  const env = loadBackendEnv();
  // en-CA formats as YYYY-MM-DD, which is exactly Postgres's `date` text representation.
  return new Intl.DateTimeFormat('en-CA', { timeZone: env.appTimezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Current hour/minute in the configured app timezone. */
export function currentHourMinute(now: Date = new Date()): { hour: number; minute: number } {
  const env = loadBackendEnv();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: env.appTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return { hour, minute };
}

/** True once the current time has reached (or passed) the configured DAILY_SMS_HOUR:MINUTE for
 * today — the daily worker's "is it time yet" check. Doesn't itself prevent re-firing later the
 * same day; the worker pairs this with an in-memory last-run-date guard, and the DB partial
 * unique index is the actual per-user safety net regardless of how many times this returns true. */
export function isWithinDailySendWindow(now: Date = new Date()): boolean {
  const env = loadBackendEnv();
  const { hour, minute } = currentHourMinute(now);
  if (hour > env.dailySmsHour) return true;
  if (hour === env.dailySmsHour) return minute >= env.dailySmsMinute;
  return false;
}
