import { createSupabaseFunctionManifest } from '../_shared/manifest';

export const smsFunctionManifest = createSupabaseFunctionManifest({
  name: 'sms',
  path: '/functions/sms',
  description: 'SMS delivery edge-function shell.',
  triggers: ['queue', 'webhook'],
});
