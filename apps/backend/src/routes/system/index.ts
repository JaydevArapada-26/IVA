import type { HttpRouteGroup } from '../../http/types';
import { healthRoute } from './health.route';
import { readyRoute } from './ready.route';

export const systemRouteGroup: HttpRouteGroup = {
  basePath: '',
  routes: [healthRoute, readyRoute],
};

export * from './health.route';
export * from './ready.route';
