import { createSupabaseFunctionManifest } from '../_shared/manifest';

export const ingestionFunctionManifest = createSupabaseFunctionManifest({
  name: 'ingestion',
  path: '/functions/ingestion',
  description: 'Ingestion orchestration edge-function shell for CSV and source sync events.',
  triggers: ['queue', 'admin', 'webhook'],
});
