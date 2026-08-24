import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import { BACKEND_LOG_PREFIX } from '../config/constants';
import { securityConfig } from '../config/security';
import type { HttpRouteGroup } from './types';
import { compileRoutes, executeRoute, resolveRoute } from './router';
import { readTextBody, sendJson } from './json';

function applyCorsHeaders(request: IncomingMessage, response: ServerResponse): void {
  const { origin } = securityConfig.cors;
  const rawRequestOrigin = request.headers.origin;
  const requestOrigin = Array.isArray(rawRequestOrigin) ? rawRequestOrigin[0] : rawRequestOrigin;

  let allowOrigin: string;
  if (origin === '*') {
    allowOrigin = requestOrigin ?? '*';
  } else if (Array.isArray(origin)) {
    allowOrigin = (requestOrigin && origin.includes(requestOrigin) ? requestOrigin : origin[0]) ?? '*';
  } else {
    allowOrigin = origin;
  }

  response.setHeader('Access-Control-Allow-Origin', allowOrigin);
  if (securityConfig.cors.credentials && allowOrigin !== '*') {
    response.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Vary', 'Origin');
}

export interface BackendServerOptions {
  readonly host: string;
  readonly port: number;
  readonly routeGroups: readonly HttpRouteGroup[];
  readonly serviceName: string;
  readonly version: string;
}

export interface BackendServer {
  /** The underlying Node.js HTTP server — used to attach WebSocket upgrade handling */
  readonly httpServer: Server;
  start(): Promise<void>;
  stop(): Promise<void>;
}


export function createBackendServer(options: BackendServerOptions): BackendServer {
  const routes = compileRoutes(options.routeGroups);

  const server = createServer((request, response) => {
    void handleRequest(request, response, routes, options.serviceName, options.version);
  });

  return {
    httpServer: server,
    async start() {
      await new Promise<void>((resolve) => {
        server.listen(options.port, options.host, resolve);
      });
      process.stdout.write(`${BACKEND_LOG_PREFIX} ${options.serviceName} listening on ${options.host}:${options.port}\n`);
    },
    async stop() {
      await new Promise<void>((resolve) => {
        server.close(resolve);
      });
    },
  };

}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  routes: ReturnType<typeof compileRoutes>,
  serviceName: string,
  version: string,
): Promise<void> {
  try {
    applyCorsHeaders(request, response);

    if ((request.method ?? 'GET').toUpperCase() === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }

    const method = (request.method ?? 'GET').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    const requestUrl = new URL(request.url ?? '/', 'http://localhost');
    const pathname = requestUrl.pathname;
    const bodyText = await readTextBody(request);

    const resolution = resolveRoute(routes, method, pathname);
    if (resolution.route) {
      const result = await executeRoute(resolution.route, {
        method,
        pathname,
        params: resolution.params,
        query: requestUrl.searchParams,
        headers: request.headers,
        bodyText,
      });

      sendJson(response, result.statusCode, result.body, result.headers);
      return;
    }

    if (resolution.methodAllowed) {
      sendJson(response, 405, {
        status: 'error',
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method not allowed for ${pathname}`,
        },
      });
      return;
    }

    sendJson(response, 404, {
      status: 'error',
      error: {
        code: 'NOT_FOUND',
        message: `${serviceName} does not expose ${pathname} on ${version}`,
      },
    });
  } catch (error) {
    let message = 'Unknown server error';
    if (error instanceof Error) {
      message = error.message;
      if (error.cause instanceof Error) {
        message += ` - Cause: ${error.cause.message}`;
      } else if (error.cause) {
        message += ` - Cause: ${String(error.cause)}`;
      }
    }
    console.error('[iva-backend] Request failed:', error);
    sendJson(response, 500, {
      status: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    });
  }
}
