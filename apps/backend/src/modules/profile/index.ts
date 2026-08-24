import { createModuleShell } from '../module-shell';
import { profileRoutes } from './routes';

export const profileModule = createModuleShell({
  name: 'profile',
  basePath: '/api/v1/profile',
  description: 'User Profile module shell.',
  routes: profileRoutes,
});

export * from './controller';
export * from './service';
export * from './repository';
export * from './routes';
export * from './schema';
export * from './dto';
export * from './mapper';
export * from './types';
