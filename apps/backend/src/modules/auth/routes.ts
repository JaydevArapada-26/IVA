import type { ModuleRouteShell } from '../module-shell';

export const authRoutes: readonly ModuleRouteShell[] = [
  {
    method: 'POST',
    path: '/login',
    summary: 'Authenticate citizen via phone OTP session',
  },
];
