import { createModuleShell } from '../module-shell';
import { ingestionRoutes } from './routes';

export const ingestionModule = createModuleShell({
  name: 'ingestion',
  basePath: '/api/v1/ingestion',
  description: 'Ingestion module shell.',
  routes: ingestionRoutes,
});

export * from './controller';
export * from './service';
export * from './repository';
export * from './routes';
export * from './schema';
export * from './dto';
export * from './mapper';
export * from './types';
