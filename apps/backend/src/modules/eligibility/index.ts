import { createModuleShell } from '../module-shell';
import { eligibilityRoutes } from './routes';

export const eligibilityModule = createModuleShell({
  name: 'eligibility',
  basePath: '/api/v1/eligibility',
  description: 'Scheme eligibility engine shell.',
  routes: eligibilityRoutes,
});

export * from './controller';
export * from './service';
export * from './repository';
export * from './routes';
export * from './schema';
export * from './dto';
export * from './mapper';
export * from './types';
