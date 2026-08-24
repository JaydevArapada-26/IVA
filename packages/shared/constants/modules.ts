import { BACKEND_MODULE_NAMES, BACKEND_QUEUE_NAMES, BACKEND_WORKER_NAMES, SUPABASE_FUNCTION_NAMES } from '../contracts/backend';

export { BACKEND_MODULE_NAMES, BACKEND_QUEUE_NAMES, BACKEND_WORKER_NAMES, SUPABASE_FUNCTION_NAMES };

export const MODULE_ROUTE_PREFIXES = {
  auth: '/api/v1/auth',
  profile: '/api/v1/profile',
  schemes: '/api/v1/schemes',
  ingestion: '/api/v1/ingestion',
  eligibility: '/api/v1/eligibility',
  priority: '/api/v1/priority',
  assistant: '/api/v1/assistant',
  sms: '/api/v1/sms',
  admin: '/api/v1/admin',
  'queue-job': '/api/v1/jobs',
} as const;

export const QUEUE_ROUTE_PREFIXES = {
  ingestion: '/api/v1/queues/ingestion',
  sms: '/api/v1/queues/sms',
  assistant: '/api/v1/queues/assistant',
  admin: '/api/v1/queues/admin',
} as const;
