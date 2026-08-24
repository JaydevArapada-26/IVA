export const BACKEND_SERVICE_NAME = 'backend' as const;

export const BACKEND_DEFAULT_HOST = '0.0.0.0' as const;

export const BACKEND_DEFAULT_PORT = 4000 as const;

export const BACKEND_API_BASE_PATH = '/api/v1' as const;

export const BACKEND_HEALTH_PATH = '/health' as const;

export const BACKEND_READY_PATH = '/ready' as const;

export const BACKEND_META_PATH = '/api/v1/meta' as const;

export const BACKEND_API_VERSION = 'v1' as const;

export const BACKEND_LOG_PREFIX = '[iva-backend]' as const;

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

export const BACKEND_QUEUE_NAMES = ['ingestion', 'sms', 'assistant', 'admin'] as const;

export type BackendQueueName = (typeof BACKEND_QUEUE_NAMES)[number];

export const BACKEND_WORKER_NAMES = ['ingestion-worker'] as const;

export type BackendWorkerName = (typeof BACKEND_WORKER_NAMES)[number];

export const SUPABASE_FUNCTION_NAMES = ['health', 'ingestion', 'sms'] as const;

export type SupabaseFunctionName = (typeof SUPABASE_FUNCTION_NAMES)[number];
