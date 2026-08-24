import { apiV1RouteGroup } from './api/v1';
import { systemRouteGroup } from './system';

export * from './api';
export * from './system';

export const backendRouteGroups = [systemRouteGroup, apiV1RouteGroup] as const;
