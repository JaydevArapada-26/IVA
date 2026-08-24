import { toKebabCase } from './strings';

export function createPrefixedId(prefix: string, value: string): string {
  return `${prefix}_${toKebabCase(value)}`;
}

export function createTimestampId(prefix: string, timestamp = new Date()): string {
  return `${prefix}_${timestamp.toISOString().replace(/[:.]/g, '-')}`;
}
