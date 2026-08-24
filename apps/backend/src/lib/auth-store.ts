import { randomBytes, randomInt } from 'node:crypto';

/**
 * In-memory OTP + session storage.
 *
 * There is no `otp_codes` / `sessions` table in the Drizzle schema (see migration
 * 0000_cuddly_lady_vermin.sql) and adding one is out of scope for this stage. These maps hold
 * state only for the lifetime of this process — restarting the backend invalidates every
 * pending OTP and every logged-in session. This is acceptable for the current stage but must be
 * replaced with real persistence (e.g. a `sessions` table or JWTs) before this ships to
 * multi-instance production.
 */

interface OtpEntry {
  readonly code: string;
  readonly expiresAt: number;
}

const OTP_TTL_MS = 5 * 60 * 1000;
const otpByPhone = new Map<string, OtpEntry>();

export function issueOtp(phoneNumber: string): string {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  otpByPhone.set(phoneNumber, { code, expiresAt: Date.now() + OTP_TTL_MS });
  return code;
}

export function consumeOtp(phoneNumber: string, code: string): boolean {
  const entry = otpByPhone.get(phoneNumber);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpByPhone.delete(phoneNumber);
    return false;
  }
  if (entry.code !== code) return false;
  otpByPhone.delete(phoneNumber);
  return true;
}

interface CitizenSession {
  readonly userId: string;
  readonly expiresAt: number;
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const citizenSessions = new Map<string, CitizenSession>();

export function createCitizenSession(userId: string): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  citizenSessions.set(token, { userId, expiresAt: expiresAt.getTime() });
  return { token, expiresAt };
}

export function resolveCitizenSession(token: string): CitizenSession | undefined {
  const entry = citizenSessions.get(token);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    citizenSessions.delete(token);
    return undefined;
  }
  return entry;
}

interface AdminSession {
  readonly adminUserId: string;
  readonly userId: string;
  readonly role: string;
  readonly expiresAt: number;
}

const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const adminSessions = new Map<string, AdminSession>();

export function createAdminSession(adminUserId: string, userId: string, role: string): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);
  adminSessions.set(token, { adminUserId, userId, role, expiresAt: expiresAt.getTime() });
  return { token, expiresAt };
}

export function resolveAdminSession(token: string): AdminSession | undefined {
  const entry = adminSessions.get(token);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    adminSessions.delete(token);
    return undefined;
  }
  return entry;
}
