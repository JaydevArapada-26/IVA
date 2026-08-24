import { createModuleShell } from '../module-shell';
import { smsRoutes } from './routes';

export const smsModule = createModuleShell({
  name: 'sms',
  basePath: '/api/v1/sms',
  description: 'SMS dispatch module shell.',
  routes: smsRoutes,
});

export * from './controller';
export * from './service';
export * from './repository';
export * from './routes';
export * from './schema';
export * from './dto';
export * from './mapper';
export * from './types';
