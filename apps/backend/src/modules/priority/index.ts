import { createModuleShell } from '../module-shell';
import { priorityRoutes } from './routes';

export const priorityModule = createModuleShell({
  name: 'priority',
  basePath: '/api/v1/priority',
  description: 'Priority queue/job scheduler module shell.',
  routes: priorityRoutes,
});

export * from './controller';
export * from './service';
export * from './repository';
export * from './routes';
export * from './schema';
export * from './dto';
export * from './mapper';
export * from './types';
