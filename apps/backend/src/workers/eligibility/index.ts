/**
 * Eligibility worker — evaluates scheme eligibility for all active users
 * on startup, then re-evaluates on a slower background interval.
 *
 * Keeps a lightweight in-memory stamp of the last full run so we don't
 * re-run the entire matrix more than once per interval.
 */
import { loadBackendEnv } from '../../config';
import {
  evaluateEligibility,
  listActiveUsersWithProfiles,
  listPublishedSchemeIds,
  upsertEligibilityResult,
} from '../../lib/eligibility/engine';

// Full-matrix re-evaluation cadence: every 30 minutes by default
const EVAL_INTERVAL_MS = 30 * 60 * 1000;

let _lastFullRun = 0;
let _evalTimer: ReturnType<typeof setInterval> | undefined;

async function runFullEligibilityMatrix(): Promise<void> {
  const now = Date.now();
  if (now - _lastFullRun < EVAL_INTERVAL_MS) return; // debounce

  const [activeUsers, schemeIds] = await Promise.all([listActiveUsersWithProfiles(), listPublishedSchemeIds()]);

  if (activeUsers.length === 0 || schemeIds.length === 0) {
    console.log('[eligibility-worker] Nothing to evaluate (no active users or no published schemes).');
    _lastFullRun = now;
    return;
  }

  console.log(`[eligibility-worker] Evaluating ${activeUsers.length} users × ${schemeIds.length} schemes…`);
  let ok = 0;
  let errors = 0;

  for (const { userId, profileId } of activeUsers) {
    for (const schemeId of schemeIds) {
      let attempts = 0;
      let evaluated = false;
      while (attempts < 2 && !evaluated) {
        attempts++;
        try {
          const result = await evaluateEligibility(userId, schemeId);
          await upsertEligibilityResult(userId, schemeId, profileId, result);
          ok++;
          evaluated = true;
        } catch (err) {
          if (attempts >= 2) {
            errors++;
            if (errors <= 3) {
              console.warn(`[eligibility-worker] Transient error evaluating user=${userId} scheme=${schemeId}:`, err instanceof Error ? err.message : err);
            }
          } else {
            // Brief pause on connection drop to allow connection pool to refresh
            await new Promise((r) => setTimeout(r, 150));
          }
        }
      }
      // Micro-pause between queries to stay well within Supabase pooler limits
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  _lastFullRun = Date.now();
  console.log(`[eligibility-worker] ✓ Done — ${ok} evaluated, ${errors} errors`);
}

export async function startEligibilityWorker(): Promise<void> {
  const env = loadBackendEnv();
  if (!env.ingestionWorkerEnabled) {
    console.log('[eligibility-worker] Disabled via INGESTION_WORKER_ENABLED=false');
    return;
  }

  console.log('[eligibility-worker] Starting…');
  try {
    await runFullEligibilityMatrix();
  } catch (err) {
    console.error('[eligibility-worker] Initial run error:', err);
  }

  _evalTimer = setInterval(() => {
    runFullEligibilityMatrix().catch((err) => {
      console.error('[eligibility-worker] Interval run error:', err);
    });
  }, EVAL_INTERVAL_MS);
}

export function stopEligibilityWorker(): void {
  if (_evalTimer !== undefined) {
    clearInterval(_evalTimer);
    _evalTimer = undefined;
    console.log('[eligibility-worker] Stopped.');
  }
}

/**
 * Trigger a single-user re-evaluation for all published schemes.
 * Called after profile updates to keep results fresh.
 */
export async function evaluateUserEligibility(userId: string, profileId: string): Promise<void> {
  try {
    const schemeIds = await listPublishedSchemeIds();
    for (const schemeId of schemeIds) {
      try {
        const result = await evaluateEligibility(userId, schemeId);
        await upsertEligibilityResult(userId, schemeId, profileId, result);
      } catch (err) {
        console.error(`[eligibility-worker] Error evaluating scheme ${schemeId} for user ${userId}:`, err);
      }
    }
  } catch (err) {
    console.error(`[eligibility-worker] Error during evaluateUserEligibility for user ${userId}:`, err);
  }
}
