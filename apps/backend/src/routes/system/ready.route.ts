import type { HttpRouteDefinition } from '../../http/types';
import { BACKEND_API_VERSION } from '../../config/constants';
import { backendModules } from '../../modules/backend-modules';
import { ingestionWorkerManifest } from '../../workers/ingestion';

export const readyRoute: HttpRouteDefinition = {
  method: 'GET',
  path: '/ready',
  summary: 'Backend readiness check',
  handler: () => ({
    statusCode: 200,
    body: {
      status: 'ok',
      data: {
        service: 'backend',
        state: 'healthy',
        checkedAt: new Date().toISOString(),
        version: BACKEND_API_VERSION,
        modules: backendModules.map((module) => module.name),
        workers: [ingestionWorkerManifest.name],
      },
    },
  }),
};
