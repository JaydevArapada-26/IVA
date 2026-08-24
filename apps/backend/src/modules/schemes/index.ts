import { createModuleShell } from '../module-shell';
import { schemesRoutes } from './routes';

export const schemesModule = createModuleShell({
  name: 'schemes',
  basePath: '/api/v1/schemes',
  description: 'Schemes listing and information retrieval module shell.',
  routes: schemesRoutes,
});

export * from './controller';
export * from './service';
export * from './repository';
export * from './routes';
export * from './schema';
export * from './dto';
export * from './mapper';
export * from './types';
