import * as nodemailer from 'nodemailer';
import { loadBackendEnv } from '../../config';

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

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Sends one transactional email via SMTP. Throws if SMTP isn't configured or the API call
 * fails — callers decide how to handle that (log-and-continue for a best-effort notification,
 * surface an error for something the citizen is actively waiting on).
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const env = loadBackendEnv();
  
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass || !env.smtpFromEmail) {
    throw new Error('SMTP is not configured (missing SMTP_HOST, SMTP_USER, SMTP_PASS, or SMTP_FROM_EMAIL)');
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  const fromString = env.smtpFromName 
    ? `"${env.smtpFromName}" <${env.smtpFromEmail}>`
    : env.smtpFromEmail;

  const toString = input.toName
    ? `"${input.toName}" <${input.to}>`
    : input.to;

  const info = await transporter.sendMail({
    from: fromString,
    to: toString,
    subject: input.subject,
    text: input.text ?? stripHtml(input.html),
    html: input.html,
  });

  return { 
    messageId: info.messageId, 
    status: 'success'
  };
}

export function isSmtpConfigured(): boolean {
  const env = loadBackendEnv();
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.smtpFromEmail);
}

