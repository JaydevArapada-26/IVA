import { createModuleShell } from '../module-shell';
import { authRoutes } from './routes';

export const authModule = createModuleShell({
  name: 'auth',
  basePath: '/api/v1/auth',
  description: 'Authentication and session boundary for the IVA backend.',
  routes: authRoutes,
});

export * from './controller';
export * from './service';
export * from './repository';
export * from './routes';
export * from './schema';
export * from './dto';
export * from './mapper';
export * from './types';
