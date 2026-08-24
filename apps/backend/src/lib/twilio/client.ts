import twilio from 'twilio';
import { loadBackendEnv } from '../../config';

export interface SendSmsResult {
  readonly sid: string;
  readonly status: string;
}

let _client: ReturnType<typeof twilio> | undefined;

function getClient() {
  const env = loadBackendEnv();
  if (!env.twilioAccountSid || !env.twilioAuthToken) {
    throw new Error('Twilio is not configured (missing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)');
  }
  if (!_client) {
    _client = twilio(env.twilioAccountSid, env.twilioAuthToken);
  }
  return _client;
}

/**
 * Sends an SMS via Twilio for the IVA notification pipeline. Uses MessagingServiceSid (not a
 * hardcoded From number) per spec, reusing the same Twilio account/number Supabase Auth's phone
 * OTP already sends through — this is a logically separate send path, not shared OTP logic.
 */
export async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  const env = loadBackendEnv();
  const client = getClient();

  const message = await client.messages.create({
    to,
    body,
    ...(env.twilioMessagingServiceSid
      ? { messagingServiceSid: env.twilioMessagingServiceSid }
      : { from: process.env.TWILIO_FROM_NUMBER || '' }),
  });

  return { sid: message.sid, status: message.status };
}
