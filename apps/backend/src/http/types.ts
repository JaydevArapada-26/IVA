export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export type JsonArray = readonly JsonValue[];

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequestContext {
  readonly method: HttpMethod;
  readonly pathname: string;
  readonly params: Readonly<Record<string, string>>;
  readonly query: URLSearchParams;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly bodyText: string;
}

export interface HttpRouteResult {
  readonly statusCode: number;
  readonly body: JsonValue;
  readonly headers?: Readonly<Record<string, string>>;
}

export interface HttpRouteDefinition {
  readonly method: HttpMethod;
  readonly path: string;
  readonly summary: string;
  readonly handler: (context: HttpRequestContext) => Promise<HttpRouteResult> | HttpRouteResult;
}

export interface HttpRouteGroup {
  readonly basePath: string;
  readonly routes: readonly HttpRouteDefinition[];
}

export interface HttpNotFoundResult {
  readonly statusCode: 404;
  readonly body: JsonObject;
}
