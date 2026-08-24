export function joinPaths(...segments: readonly string[]): string {
  const normalizedSegments = segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''));

  if (normalizedSegments.length === 0) {
    return '/';
  }

  return `/${normalizedSegments.join('/')}`;
}

export function stripTrailingSlash(value: string): string {
  return value.length > 1 ? value.replace(/\/+$/, '') : value;
}

export interface PathMatchResult {
  readonly matched: boolean;
  readonly params: Readonly<Record<string, string>>;
}

/**
 * Matches a compiled route path (segments may be literal or `:param`) against a request
 * pathname, e.g. `/schemes/:slug` matches `/schemes/pm-kisan` with params `{ slug: 'pm-kisan' }`.
 */
export function matchPath(routePath: string, pathname: string): PathMatchResult {
  const routeSegments = routePath.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);

  if (routeSegments.length !== pathSegments.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < routeSegments.length; i += 1) {
    const routeSegment = routeSegments[i] ?? '';
    const pathSegment = pathSegments[i] ?? '';
    if (routeSegment.startsWith(':')) {
      params[routeSegment.slice(1)] = decodeURIComponent(pathSegment);
    } else if (routeSegment !== pathSegment) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}
