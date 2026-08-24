import type { BackendJobKind } from '../contracts/backend';

export interface QueueJobEnvelope {
  readonly id: string;
  readonly kind: BackendJobKind;
  readonly createdAt: string;
  readonly scheduledAt?: string;
}

export const QUEUE_JOB_PRIORITIES = ['urgent', 'high', 'normal', 'low'] as const;

export type QueueJobPriority = (typeof QUEUE_JOB_PRIORITIES)[number];
