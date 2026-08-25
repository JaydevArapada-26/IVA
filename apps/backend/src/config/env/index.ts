import fs from 'node:fs';
import path from 'node:path';
import {
  BACKEND_DEFAULT_HOST,
  BACKEND_DEFAULT_PORT,
  BACKEND_API_BASE_PATH,
} from '../constants';

export interface BackendEnv {
  readonly nodeEnv: 'development' | 'test' | 'staging' | 'production';
  readonly host: string;
  readonly port: number;
  readonly apiBasePath: string;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  readonly databaseUrl: string;
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly supabaseServiceRoleKey: string;
  readonly supabaseJwtSecret: string;
  readonly geminiApiKey: string;
  readonly geminiModel: string;
  readonly minimaxApiKey: string;
  readonly minimaxModel: string;
  readonly minimaxApiUrl: string;
  readonly twilioAccountSid: string;
  readonly twilioAuthToken: string;
  readonly twilioMessagingServiceSid: string;
  readonly smtpHost: string;
  readonly smtpPort: number;
  readonly smtpUser: string;
  readonly smtpPass: string;
  readonly smtpFromEmail: string;
  readonly smtpFromName: string;
  readonly adminSecretKey: string;
  readonly csvImportDir: string;
  readonly csvArchiveDir: string;
  readonly ingestionBatchSize: number;
  readonly queuePollIntervalMs: number;
  readonly ingestionWorkerEnabled: boolean;
  // Daily scheme SMS automation (Stage 3) — kept false by default so the automation stays off
  // until deliberately turned on, independent of each citizen's own dailySchemeSmsEnabled
  // preference (see profiles.daily_scheme_sms_enabled).
  readonly dailySmsEnabled: boolean;
  readonly dailySmsHour: number;
  readonly dailySmsMinute: number;
  readonly appTimezone: string;
}

type EnvSource = Readonly<Record<string, string | undefined>>;

export function loadDotEnvIfPresent(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const content = fs.readFileSync(candidate, 'utf-8');
        for (const rawLine of content.split(/\r?\n/)) {
          const line = rawLine.trim();
          if (!line || line.startsWith('#')) continue;
          const eqIdx = line.indexOf('=');
          if (eqIdx > 0) {
            const key = line.slice(0, eqIdx).trim();
            const val = line.slice(eqIdx + 1).trim();
            if (process.env[key] === undefined || process.env[key] === '') {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch {
        // ignore
      }
    }
  }
}

// Automatically load .env on module evaluation
loadDotEnvIfPresent();

function readOptionalString(source: EnvSource, key: string, fallback: string): string {
  const value = source[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function readRequiredString(source: EnvSource, key: string): string {
  const value = source[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
}

function readNumber(source: EnvSource, key: string, fallback: number): number {
  const value = source[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric environment variable: ${key}`);
  }
  return parsed;
}

/** Like readNumber, but allows 0 (needed for an hour/minute-of-day value — DAILY_SMS_HOUR=0 is
 * midnight, a valid and meaningful configuration that readNumber's `parsed <= 0` guard would reject). */
function readNonNegativeInteger(source: EnvSource, key: string, fallback: number): number {
  const value = source[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid numeric environment variable: ${key}`);
  }
  return parsed;
}

function readBoolean(source: EnvSource, key: string, fallback: boolean): boolean {
  const value = source[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }
  throw new Error(`Invalid boolean environment variable: ${key}`);
}

function readNodeEnv(source: EnvSource): BackendEnv['nodeEnv'] {
  const value = readOptionalString(source, 'NODE_ENV', 'development');
  if (value === 'development' || value === 'test' || value === 'staging' || value === 'production') {
    return value;
  }
  throw new Error('NODE_ENV must be development, test, staging, or production');
}

function readLogLevel(source: EnvSource): BackendEnv['logLevel'] {
  const value = readOptionalString(source, 'LOG_LEVEL', 'info');
  if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') {
    return value;
  }
  throw new Error('LOG_LEVEL must be debug, info, warn, or error');
}

export function loadBackendEnv(source: EnvSource = process.env): BackendEnv {
  loadDotEnvIfPresent();
  return {
    nodeEnv: readNodeEnv(source),
    host: readOptionalString(source, 'HOST', readOptionalString(source, 'BACKEND_HOST', BACKEND_DEFAULT_HOST)),
    port: source.PORT ? readNumber(source, 'PORT', BACKEND_DEFAULT_PORT) : readNumber(source, 'BACKEND_PORT', BACKEND_DEFAULT_PORT),
    apiBasePath: readOptionalString(source, 'BACKEND_API_BASE_PATH', BACKEND_API_BASE_PATH),
    logLevel: readLogLevel(source),
    databaseUrl: readOptionalString(source, 'DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/iva'),
    // Not consumed by any Supabase SDK client in this codebase today (DB access goes through
    // Drizzle + DATABASE_URL). Kept optional so the server can boot in local/dev environments
    // that haven't provisioned a Supabase project yet.
    supabaseUrl: readOptionalString(source, 'SUPABASE_URL', ''),
    supabaseAnonKey: readOptionalString(source, 'SUPABASE_ANON_KEY', ''),
    supabaseServiceRoleKey: readOptionalString(source, 'SUPABASE_SERVICE_ROLE_KEY', ''),
    supabaseJwtSecret: readOptionalString(source, 'SUPABASE_JWT_SECRET', ''),
    geminiApiKey: readOptionalString(source, 'GEMINI_API_KEY', ''),
    geminiModel: readOptionalString(source, 'GEMINI_MODEL', 'gemini-2.5-flash'),
    minimaxApiKey: readOptionalString(source, 'MINIMAX_API_KEY', ''),
    minimaxModel: readOptionalString(source, 'MINIMAX_MODEL', 'minimaxai/minimax-m3'),
    minimaxApiUrl: readOptionalString(source, 'MINIMAX_API_URL', 'https://integrate.api.nvidia.com/v1/chat/completions'),
    // Same Twilio account/number already configured for Supabase Auth's phone OTP delivery —
    // used here only for the separate IVA SMS notification pipeline (see lib/twilio/client.ts).
    twilioAccountSid: readOptionalString(source, 'TWILIO_ACCOUNT_SID', ''),
    twilioAuthToken: readOptionalString(source, 'TWILIO_AUTH_TOKEN', ''),
    twilioMessagingServiceSid: readOptionalString(source, 'TWILIO_MESSAGING_SERVICE_SID', ''),
    smtpHost: readOptionalString(source, 'SMTP_HOST', 'smtp.gmail.com'),
    smtpPort: parseInt(readOptionalString(source, 'SMTP_PORT', '587'), 10),
    smtpUser: readOptionalString(source, 'SMTP_USER', ''),
    smtpPass: readOptionalString(source, 'SMTP_PASS', ''),
    smtpFromEmail: readOptionalString(source, 'SMTP_FROM_EMAIL', ''),
    smtpFromName: readOptionalString(source, 'SMTP_FROM_NAME', 'IVA'),
    // No password-hash column exists on admin_users/users yet (see migration 0000). Admin login
    adminSecretKey: readRequiredString(source, 'ADMIN_SECRET_KEY'),
    csvImportDir: readOptionalString(source, 'CSV_IMPORT_DIR', './data/imports'),
    csvArchiveDir: readOptionalString(source, 'CSV_ARCHIVE_DIR', './data/archive'),
    ingestionBatchSize: readNumber(source, 'INGESTION_BATCH_SIZE', 50),
    queuePollIntervalMs: readNumber(source, 'QUEUE_POLL_INTERVAL_MS', 5000),
    ingestionWorkerEnabled: readBoolean(source, 'INGESTION_WORKER_ENABLED', true),
    dailySmsEnabled: readBoolean(source, 'DAILY_SMS_ENABLED', false),
    dailySmsHour: readNonNegativeInteger(source, 'DAILY_SMS_HOUR', 9),
    dailySmsMinute: readNonNegativeInteger(source, 'DAILY_SMS_MINUTE', 0),
    appTimezone: readOptionalString(source, 'APP_TIMEZONE', 'Asia/Kolkata'),
  };
}
