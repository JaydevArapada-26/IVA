import type { HttpRouteDefinition } from '../../http/types';
import { BACKEND_API_VERSION } from '../../config/constants';

export const healthRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/health',
  summary: 'Backend health check',
  handler: () => ({
    statusCode: 200,
    body: {
      status: 'ok',
      data: {
        service: 'backend',
        state: 'healthy',
        checkedAt: new Date().toISOString(),
        version: BACKEND_API_VERSION,
      },
    },
  }),
};
