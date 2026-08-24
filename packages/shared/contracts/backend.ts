export const BACKEND_MODULE_NAMES = [
  'auth',
  'profile',
  'schemes',
  'ingestion',
  'eligibility',
  'priority',
  'assistant',
  'sms',
  'admin',
  'queue-job',
] as const;

export type BackendModuleName = (typeof BACKEND_MODULE_NAMES)[number];

export const BACKEND_QUEUE_NAMES = [
  'ingestion',
  'sms',
  'assistant',
  'admin',
] as const;

export type BackendQueueName = (typeof BACKEND_QUEUE_NAMES)[number];

export const BACKEND_JOB_KINDS = [
  'csv-import',
  'csv-validate',
  'scheme-sync',
  'eligibility-refresh',
  'priority-rebuild',
  'assistant-summarize',
  'sms-dispatch',
] as const;

export type BackendJobKind = (typeof BACKEND_JOB_KINDS)[number];

export const BACKEND_WORKER_NAMES = ['ingestion-worker'] as const;

export type BackendWorkerName = (typeof BACKEND_WORKER_NAMES)[number];

export const SUPABASE_FUNCTION_NAMES = ['health', 'ingestion', 'sms'] as const;

export type SupabaseFunctionName = (typeof SUPABASE_FUNCTION_NAMES)[number];

export type BackendRuntimeEnvironment = 'development' | 'test' | 'staging' | 'production';

export const BACKEND_API_VERSION = 'v1' as const;

export const BACKEND_API_BASE_PATH = `/api/${BACKEND_API_VERSION}` as const;
