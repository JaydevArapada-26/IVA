import { createModuleShell } from '../module-shell';
import { queueJobRoutes } from './routes';

export const queueJobModule = createModuleShell({
  name: 'queue-job',
  basePath: '/api/v1/queue-job',
  description: 'Queue Job worker helper shell.',
  routes: queueJobRoutes,
});

export * from './controller';
export * from './service';
export * from './repository';
export * from './routes';
export * from './schema';
export * from './dto';
export * from './mapper';
export * from './types';
