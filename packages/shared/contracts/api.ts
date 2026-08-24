export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export type JsonArray = readonly JsonValue[];

export type ApiStatus = 'ok' | 'error';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'INTERNAL_ERROR';

export interface ApiErrorPayload {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly details?: JsonValue;
}

export interface ApiSuccessEnvelope<TData extends JsonValue = JsonValue> {
  readonly status: 'ok';
  readonly data: TData;
  readonly meta?: JsonObject;
}

export interface ApiFailureEnvelope {
  readonly status: 'error';
  readonly error: ApiErrorPayload;
  readonly meta?: JsonObject;
}

export type ApiEnvelope<TData extends JsonValue = JsonValue> =
  | ApiSuccessEnvelope<TData>
  | ApiFailureEnvelope;

export interface PaginatedResult<TItem extends JsonValue = JsonValue> {
  readonly items: readonly TItem[];
  readonly nextCursor?: string;
  readonly total?: number;
}

export type ServiceHealthState = 'healthy' | 'degraded' | 'unhealthy';

export interface ServiceHealthPayload {
  readonly service: string;
  readonly state: ServiceHealthState;
  readonly checkedAt: string;
  readonly version: string;
}
