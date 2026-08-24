import { createModuleShell } from '../module-shell';
import { assistantRoutes } from './routes';

export const assistantModule = createModuleShell({
  name: 'assistant',
  basePath: '/api/v1/assistant',
  description: 'AI Assistant module shell.',
  routes: assistantRoutes,
});

export * from './controller';
export * from './service';
export * from './repository';
export * from './routes';
export * from './schema';
export * from './dto';
export * from './mapper';
export * from './types';
