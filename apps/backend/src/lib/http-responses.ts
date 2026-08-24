import type { HttpRequestContext, HttpRouteResult, JsonValue } from '../http/types';
import { resolveAdminSession, resolveCitizenSession } from './auth-store';

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_ERROR: 500,
};

export function ok(data: JsonValue, statusCode = 200): HttpRouteResult {
  return {
    statusCode,
    body: { status: 'ok', data },
  };
}

export function err(code: ApiErrorCode, message: string, details?: JsonValue): HttpRouteResult {
  return {
    statusCode: STATUS_BY_CODE[code],
    body: {
      status: 'error',
      error: details === undefined ? { code, message } : { code, message, details },
    },
  };
}

export function getBearerToken(req: HttpRequestContext): string | undefined {
  const raw = req.headers['authorization'] ?? req.headers['Authorization'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match?.[1]?.trim() || undefined;
}

export function requireCitizenUserId(req: HttpRequestContext): string | undefined {
  const token = getBearerToken(req);
  if (!token) return undefined;
  return resolveCitizenSession(token)?.userId;
}

export function requireAdminSession(req: HttpRequestContext) {
  const token = getBearerToken(req);
  if (!token) return undefined;
  return resolveAdminSession(token);
}

export function parseJsonBody(bodyText: string): { ok: true; value: Record<string, unknown> } | { ok: false } {
  if (!bodyText || bodyText.trim().length === 0) {
    return { ok: false };
  }
  try {
    const parsed: unknown = JSON.parse(bodyText);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false };
  }
}
