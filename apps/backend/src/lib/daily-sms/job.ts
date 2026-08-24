/**
 * The daily scheme-recommendation SMS job (spec Stage 3). Decides and enqueues — actually sending
 * is delegated to the existing generic dispatcher (workers/sms-notifications/index.ts), which
 * already polls `queued` sms_notifications rows and handles retry/backoff. This module's only job
 * is: for each eligible citizen, pick today's best scheme (via the canonical
 * SchemeRecommendationService) and either enqueue a localized SMS or record why it skipped them.
 *
 * Idempotency is enforced at two layers: a pre-check (`hasAutomatedSmsForDate`, cheap, avoids
 * redundant recommendation work) and the actual guarantee, a DB partial unique index on
 * (user_id, delivery_date) WHERE automation_type = 'daily_scheme_sms' — so this remains correct
 * even if invoked twice concurrently (e.g. the worker's interval and an admin manual trigger
 * overlapping).
 */
import type { SupportedLanguage } from 'shared/types';
import { DailySmsJobRunRepository } from '../../db/repositories/daily-sms-job-run.repository';
import { SmsNotificationRepository } from '../../db/repositories/sms-notification.repository';
import { UserRepository } from '../../db/repositories/user.repository';
import { getDailyRecommendation } from '../recommendation/service';
import { generateDailySmsBody } from './generateSms';
import { currentDeliveryDate } from '../time/appTimezone';

const BATCH_SIZE = 200;
const CONCURRENCY = 5;
const DEFAULT_COOLDOWN_DAYS = 14;

export interface DailySmsJobTrigger {
  readonly source: 'scheduler' | 'admin_manual';
  readonly adminUserId?: string;
}

export interface DailySmsJobSummary {
  readonly runId: string;
  readonly deliveryDate: string;
  readonly usersConsidered: number;
  readonly usersSkipped: number;
  readonly messagesEnqueued: number;
  readonly noSuitableSchemeCount: number;
  readonly status: 'completed' | 'failed';
}

/** Basic "does this look like a real 10-digit Indian mobile number" check — filters out the
 * `0000000000` guest placeholder (ws/assistant-ws.ts's findOrCreateGuestUser) and obviously
 * malformed numbers without needing a full phone-validation library. */
function looksLikeValidPhone(phoneNumber: string): boolean {
  const digits = phoneNumber.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return /^[6-9]\d{9}$/.test(last10) && !/^0+$/.test(last10);
}

/** A tiny bounded-concurrency runner — avoids a new dependency for what's a small, well-understood
 * need (spec 3.29/3.38: don't fire everything at once, don't load unbounded work into memory). */
async function runWithConcurrency<T>(items: readonly T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let index = 0;
  async function next(): Promise<void> {
    const i = index++;
    if (i >= items.length) return;
    await worker(items[i] as T);
    await next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => next()));
}

async function processOneUser(
  user: { userId: string; phoneNumber: string; languageCode: string },
  deliveryDate: string,
  smsRepo: SmsNotificationRepository,
  runRepo: DailySmsJobRunRepository,
  runId: string,
  cooldownDays: number,
): Promise<void> {
  try {
    if (!looksLikeValidPhone(user.phoneNumber)) {
      await runRepo.incrementCounters(runId, { usersSkipped: 1 });
      return;
    }

    // Idempotency pre-check — the partial unique index is the real guarantee; this just avoids
    // redoing the recommendation work when we already know today's row exists.
    const alreadySent = await smsRepo.hasAutomatedSmsForDate(user.userId, deliveryDate);
    if (alreadySent) {
      await runRepo.incrementCounters(runId, { usersSkipped: 1 });
      return;
    }

    const scheme = await getDailyRecommendation(user.userId, { cooldownDays });
    if (!scheme) {
      await smsRepo.create({
        userId: user.userId,
        notificationType: 'scheme_recommendation',
        automationType: 'daily_scheme_sms',
        deliveryDate,
        locale: user.languageCode as never,
        messageBody: '',
        status: 'skipped',
        skipReason: 'No suitable scheme found for this citizen today.',
      });
      await runRepo.incrementCounters(runId, { usersSkipped: 1, noSuitableSchemeCount: 1 });
      return;
    }

    const locale = (user.languageCode || 'en') as SupportedLanguage;
    const messageBody = await generateDailySmsBody(scheme, locale);

    // The partial unique index (sms_notifications_daily_user_date_unique) is the true idempotency
    // guarantee — if a concurrent run already inserted today's row for this user, this insert
    // fails with a unique-violation, which we treat as "already handled," not an error.
    try {
      await smsRepo.create({
        userId: user.userId,
        schemeId: scheme.schemeId,
        notificationType: 'scheme_recommendation',
        automationType: 'daily_scheme_sms',
        deliveryDate,
        locale: locale as never,
        matchReasons: scheme.reasons as string[],
        messageBody,
        status: 'queued',
      });
      await runRepo.incrementCounters(runId, { messagesEnqueued: 1 });
    } catch (insertError) {
      const message = insertError instanceof Error ? insertError.message : String(insertError);
      if (/duplicate key|unique constraint/i.test(message)) {
        await runRepo.incrementCounters(runId, { usersSkipped: 1 });
        return;
      }
      throw insertError;
    }
  } catch (error) {
    // A single user's failure must never abort the batch (spec 3.27).
    console.error(`[daily-sms] Failed to process user ${user.userId}:`, error instanceof Error ? error.message : error);
    await runRepo.incrementCounters(runId, { usersSkipped: 1 });
  }
}

/** Creates the job_runs row up front — fast, synchronous-feeling — so a caller that wants to
 * return a runId immediately (the admin "run now" endpoint) doesn't have to wait for the actual
 * batch to finish first. Separated from `executeDailySchemeSmsJob` below so there's exactly one
 * row created per trigger regardless of whether the caller awaits the full run or not. */
export async function createDailySmsJobRun(trigger: DailySmsJobTrigger): Promise<{ id: string; deliveryDate: string }> {
  const deliveryDate = currentDeliveryDate();
  const run = await new DailySmsJobRunRepository().create({
    triggerSource: trigger.source,
    ...(trigger.adminUserId ? { triggeredByAdminUserId: trigger.adminUserId } : {}),
    deliveryDate,
    status: 'running',
  });
  return { id: run.id, deliveryDate };
}

/** Runs the actual batch for an already-created job_runs row (see createDailySmsJobRun). */
export async function executeDailySmsJob(
  run: { id: string; deliveryDate: string },
  trigger: DailySmsJobTrigger,
  options?: { cooldownDays?: number },
): Promise<DailySmsJobSummary> {
  const { deliveryDate } = run;
  const cooldownDays = options?.cooldownDays ?? DEFAULT_COOLDOWN_DAYS;
  const runRepo = new DailySmsJobRunRepository();
  const smsRepo = new SmsNotificationRepository();
  const userRepo = new UserRepository();

  console.log(`[daily-sms] Job run ${run.id} started (trigger=${trigger.source}, deliveryDate=${deliveryDate})`);

  try {
    let offset = 0;
    let usersConsidered = 0;
    for (;;) {
      const batch = await userRepo.listUsersEligibleForDailySms(offset, BATCH_SIZE);
      if (batch.length === 0) break;

      usersConsidered += batch.length;
      await runRepo.incrementCounters(run.id, { usersConsidered: batch.length });

      await runWithConcurrency(batch, CONCURRENCY, (user) =>
        processOneUser(user, deliveryDate, smsRepo, runRepo, run.id, cooldownDays),
      );

      if (batch.length < BATCH_SIZE) break;
      offset += BATCH_SIZE;
    }

    await runRepo.complete(run.id, 'completed');
    const final = await runRepo.findById(run.id);
    console.log(
      `[daily-sms] Job run ${run.id} completed: considered=${usersConsidered}, enqueued=${final?.messagesEnqueued ?? 0}, skipped=${final?.usersSkipped ?? 0}, noSuitableScheme=${final?.noSuitableSchemeCount ?? 0}`,
    );

    return {
      runId: run.id,
      deliveryDate,
      usersConsidered: final?.usersConsidered ?? usersConsidered,
      usersSkipped: final?.usersSkipped ?? 0,
      messagesEnqueued: final?.messagesEnqueued ?? 0,
      noSuitableSchemeCount: final?.noSuitableSchemeCount ?? 0,
      status: 'completed',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[daily-sms] Job run ${run.id} failed:`, message);
    await runRepo.complete(run.id, 'failed', message);
    const final = await runRepo.findById(run.id);
    return {
      runId: run.id,
      deliveryDate,
      usersConsidered: final?.usersConsidered ?? 0,
      usersSkipped: final?.usersSkipped ?? 0,
      messagesEnqueued: final?.messagesEnqueued ?? 0,
      noSuitableSchemeCount: final?.noSuitableSchemeCount ?? 0,
      status: 'failed',
    };
  }
}

/** Convenience one-shot wrapper (create + execute) for callers that want the simple, fully-awaited
 * behavior — the scheduler worker and tests. The admin "run now" endpoint calls
 * createDailySmsJobRun/executeDailySmsJob directly instead, so it can return the runId immediately
 * without waiting for the batch to finish. */
export async function runDailySchemeSmsJob(trigger: DailySmsJobTrigger, options?: { cooldownDays?: number }): Promise<DailySmsJobSummary> {
  const run = await createDailySmsJobRun(trigger);
  return executeDailySmsJob(run, trigger, options);
}
