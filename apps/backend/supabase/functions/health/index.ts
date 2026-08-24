import { createSupabaseFunctionManifest } from '../_shared/manifest';

export const healthFunctionManifest = createSupabaseFunctionManifest({
  name: 'health',
  path: '/functions/health',
  description: 'Health probe for Supabase edge deployment wiring.',
  triggers: ['manual', 'probe'],
});
