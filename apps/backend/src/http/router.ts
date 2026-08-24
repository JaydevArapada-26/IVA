import type {
  HttpMethod,
  HttpRequestContext,
  HttpRouteDefinition,
  HttpRouteGroup,
  HttpRouteResult,
} from './types';
import { joinPaths, matchPath } from './path';

export interface CompiledRoute {
  readonly method: HttpMethod;
  readonly path: string;
  readonly summary: string;
  readonly handler: HttpRouteDefinition['handler'];
}

export interface RouterResolution {
  readonly route?: CompiledRoute;
  readonly params: Readonly<Record<string, string>>;
  readonly methodAllowed: boolean;
}

export function compileRoutes(groups: readonly HttpRouteGroup[]): readonly CompiledRoute[] {
  return groups.flatMap((group) =>
    group.routes.map((route) => ({
      method: route.method,
      path: joinPaths(group.basePath, route.path),
      summary: route.summary,
      handler: route.handler,
    })),
  );
}

export function resolveRoute(
  routes: readonly CompiledRoute[],
  method: HttpMethod,
  pathname: string,
): RouterResolution {
  let methodAllowed = false;

  for (const route of routes) {
    const match = matchPath(route.path, pathname);
    if (!match.matched) continue;

    if (route.method === method) {
      return { route, params: match.params, methodAllowed: true };
    }

    methodAllowed = true;
  }

  return { params: {}, methodAllowed };
}

export async function executeRoute(
  route: CompiledRoute,
  context: HttpRequestContext,
): Promise<HttpRouteResult> {
  return route.handler(context);
}
