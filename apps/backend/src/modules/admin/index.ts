import { createModuleShell } from '../module-shell';
import { adminRoutes } from './routes';

export const adminModule = createModuleShell({
  name: 'admin',
  basePath: '/api/v1/admin',
  description: 'Admin controls and audit logs shell.',
  routes: adminRoutes,
});

export * from './controller';
export * from './service';
export * from './repository';
export * from './routes';
export * from './schema';
export * from './dto';
export * from './mapper';
export * from './types';
