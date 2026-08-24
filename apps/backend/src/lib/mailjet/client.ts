/**
 * Mailjet transactional email client for the backend — mirrors lib/twilio/client.ts's shape
 * (a single sendX function backed by lazily-validated env config), so any future feature that
 * needs to send an email from IVA's own backend (as opposed to Supabase Auth's own emails —
 * confirmation/reset/magic-link, which are configured separately via Supabase's SMTP settings
 * using the same Mailjet credentials, see MAILJET_* env vars) has one place to do it.
 *
 * Uses Mailjet's Send API v3.1 directly over fetch (Basic Auth: API Key / Secret Key) rather than
 * the `node-mailjet` SDK, matching this codebase's existing preference for plain fetch calls over
 * provider SDKs (see lib/llm/client.ts) — one fewer dependency to track.
 */
import { loadBackendEnv } from '../../config';

const MAILJET_SEND_URL = 'https://api.mailjet.com/v3.1/send';

export interface SendEmailInput {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  /** Plain-text fallback. If omitted, a stripped-tags version of `html` is sent instead. */
  readonly text?: string;
  readonly toName?: string;
}

export interface SendEmailResult {
  readonly messageId: string | number;
  readonly status: string;
}

interface MailjetSendResponseBody {
  readonly Messages?: ReadonlyArray<{
    readonly Status?: string;
    readonly To?: ReadonlyArray<{ readonly MessageID?: number }>;
  }>;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Sends one transactional email via Mailjet. Throws if Mailjet isn't configured or the API call
 * fails — callers decide how to handle that (log-and-continue for a best-effort notification,
 * surface an error for something the citizen is actively waiting on).
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const env = loadBackendEnv();
  if (!env.mailjetApiKey || !env.mailjetApiSecret) {
    throw new Error('Mailjet is not configured (missing MAILJET_API_KEY / MAILJET_API_SECRET)');
  }
  if (!env.mailjetFromEmail) {
    throw new Error('Mailjet is not configured (missing MAILJET_FROM_EMAIL — must be a verified Mailjet sender)');
  }

  const auth = Buffer.from(`${env.mailjetApiKey}:${env.mailjetApiSecret}`).toString('base64');

  const response = await fetch(MAILJET_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Messages: [
        {
          From: { Email: env.mailjetFromEmail, Name: env.mailjetFromName },
          To: [{ Email: input.to, ...(input.toName ? { Name: input.toName } : {}) }],
          Subject: input.subject,
          HTMLPart: input.html,
          TextPart: input.text ?? stripHtml(input.html),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Mailjet send failed with status ${response.status}: ${errorBody}`);
  }

  const json = (await response.json()) as MailjetSendResponseBody;
  const message = json.Messages?.[0];
  const messageId = message?.To?.[0]?.MessageID ?? 'unknown';
  const status = message?.Status ?? 'unknown';

  if (status !== 'success') {
    throw new Error(`Mailjet reported non-success status: ${status}`);
  }

  return { messageId, status };
}

export function isMailjetConfigured(): boolean {
  const env = loadBackendEnv();
  return Boolean(env.mailjetApiKey && env.mailjetApiSecret && env.mailjetFromEmail);
}
