import type { BackendQueueName, BackendWorkerName } from '../../config';

export interface WorkerCapability {
  readonly name: string;
  readonly description: string;
}

export interface WorkerManifest {
  readonly name: BackendWorkerName;
  readonly queue: BackendQueueName;
  readonly description: string;
  readonly capabilities: readonly WorkerCapability[];
}

export const ingestionWorkerManifest: WorkerManifest = {
  name: 'ingestion-worker',
  queue: 'ingestion',
  description: 'Processes CSV imports and ingestion jobs for IVA.',
  capabilities: [
    {
      name: 'csv-import',
      description: 'Consumes CSV intake jobs and stages records for validation.',
    },
    {
      name: 'queue-drain',
      description: 'Reads pending ingestion jobs from the queue boundary.',
    },
  ],
};
