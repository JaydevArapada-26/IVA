import type { JsonValue } from '../contracts/api';
import { BACKEND_JOB_KINDS, BACKEND_MODULE_NAMES, BACKEND_QUEUE_NAMES } from '../contracts/backend';

export interface ValidationIssue {
  readonly path: readonly string[];
  readonly message: string;
}

export type ValidationResult<T> =
  | {
      readonly ok: true;
      readonly value: T;
    }
  | {
      readonly ok: false;
      readonly issues: readonly ValidationIssue[];
    };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  return isRecord(value) && Object.values(value).every(isJsonValue);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isIsoDateString(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && value.includes('T');
}

export function isBackendModuleName(value: unknown): value is (typeof BACKEND_MODULE_NAMES)[number] {
  return typeof value === 'string' && BACKEND_MODULE_NAMES.includes(value as never);
}

export function isBackendQueueName(value: unknown): value is (typeof BACKEND_QUEUE_NAMES)[number] {
  return typeof value === 'string' && BACKEND_QUEUE_NAMES.includes(value as never);
}

export function isBackendJobKind(value: unknown): value is (typeof BACKEND_JOB_KINDS)[number] {
  return typeof value === 'string' && BACKEND_JOB_KINDS.includes(value as never);
}
