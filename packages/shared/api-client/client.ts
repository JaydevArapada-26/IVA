import type { ApiEnvelope, HttpMethod, JsonValue } from '../contracts/api';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: JsonValue,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientConfig {
  /** e.g. http://localhost:4000/api/v1 */
  readonly baseUrl: string;
  /** Resolved fresh on every request so a login can update it without re-creating the client. */
  getToken?: () => string | undefined;
}

export interface RequestOptions {
  readonly method?: HttpMethod;
  readonly body?: unknown;
  readonly query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']): string {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${trimmedBase}${trimmedPath}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export function createApiClient(config: ApiClientConfig) {
  async function request<TData>(path: string, options: RequestOptions = {}): Promise<TData> {
    const url = buildUrl(config.baseUrl, path, options.query);
    const token = config.getToken?.();

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    let envelope: ApiEnvelope<TData extends JsonValue ? TData : never>;
    try {
      envelope = await response.json();
    } catch {
      throw new ApiError('INTERNAL_ERROR', `Could not parse response from ${url}`, response.status);
    }

    if (envelope.status === 'error') {
      throw new ApiError(envelope.error.code, envelope.error.message, response.status, envelope.error.details);
    }

    return envelope.data as TData;
  }
  
  async function requestForm<TData>(path: string, options: { method: HttpMethod, body: FormData }): Promise<TData> {
    const url = buildUrl(config.baseUrl, path);
    const token = config.getToken?.();

    const response = await fetch(url, {
      method: options.method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body,
    });

    let envelope: ApiEnvelope<TData extends JsonValue ? TData : never>;
    try {
      envelope = await response.json();
    } catch {
      throw new ApiError('INTERNAL_ERROR', `Could not parse response from ${url}`, response.status);
    }

    if (envelope.status === 'error') {
      throw new ApiError(envelope.error.code, envelope.error.message, response.status, envelope.error.details);
    }

    return envelope.data as TData;
  }

  return {
    get: <TData>(path: string, query?: RequestOptions['query']) => request<TData>(path, { method: 'GET', query }),
    post: <TData>(path: string, body?: unknown) => request<TData>(path, { method: 'POST', body }),
    put: <TData>(path: string, body?: unknown) => request<TData>(path, { method: 'PUT', body }),
    patch: <TData>(path: string, body?: unknown) => request<TData>(path, { method: 'PATCH', body }),
    del: <TData>(path: string) => request<TData>(path, { method: 'DELETE' }),
    postForm: <TData>(path: string, body: FormData) => requestForm<TData>(path, { method: 'POST', body }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
