import { BACKEND_API_VERSION } from '../../../config/constants';
import { backendModules } from '../../../modules/backend-modules';
import type { HttpRouteDefinition } from '../../../http/types';

interface ApiMetaPayload {
  readonly service: 'backend';
  readonly version: typeof BACKEND_API_VERSION;
  readonly moduleNames: readonly string[];
  readonly moduleCount: number;
}

export const apiMetaRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/meta',
  summary: 'Backend API metadata',
  handler: () => {
    const payload = {
      status: 'ok',
      data: {
        service: 'backend' as const,
        version: BACKEND_API_VERSION,
        moduleNames: backendModules.map((module) => module.name),
        moduleCount: backendModules.length,
      },
      meta: {
        routeBasePath: '/api/v1',
      },
    };

    return {
      statusCode: 200,
      body: payload,
    };
  },
};
