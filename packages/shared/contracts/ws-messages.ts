/**
 * IVA WebSocket message contract.
 *
 * Client → Server events
 * Server → Client events
 *
 * Every payload carries a `requestId` so the UI can correlate
 * streaming deltas with the originating send.
 */

// ─── Client → Server ──────────────────────────────────────────────────────────

export interface WsMessageSendPayload {
  readonly requestId: string;
  readonly text: string;
  readonly locale: string;
  /** Discriminates typed vs voice input in backend analytics/logging */
  readonly source: 'text' | 'voice';
  readonly conversationId?: string;
  readonly schemeId?: string;
}

export interface WsMessageCancelPayload {
  readonly requestId: string;
}

export type WsClientEvent =
  | { readonly type: 'message.send'; readonly payload: WsMessageSendPayload }
  | { readonly type: 'message.cancel'; readonly payload: WsMessageCancelPayload }
  | { readonly type: 'ping' };

// ─── Server → Client ──────────────────────────────────────────────────────────

export interface WsMessageStartedPayload {
  readonly requestId: string;
  readonly conversationId: string;
}

export interface WsMessageDeltaPayload {
  readonly requestId: string;
  readonly delta: string;
}

export interface WsMessageCompletedPayload {
  readonly requestId: string;
  readonly conversationId: string;
  readonly fullText: string;
}

export interface WsMessageErrorPayload {
  readonly requestId: string;
  readonly code: string;
  readonly message: string;
}

export interface WsMessageCancelledPayload {
  readonly requestId: string;
}

export type WsServerEvent =
  | { readonly type: 'message.started'; readonly payload: WsMessageStartedPayload }
  | { readonly type: 'message.delta'; readonly payload: WsMessageDeltaPayload }
  | { readonly type: 'message.completed'; readonly payload: WsMessageCompletedPayload }
  | { readonly type: 'message.error'; readonly payload: WsMessageErrorPayload }
  | { readonly type: 'message.cancelled'; readonly payload: WsMessageCancelledPayload }
  | { readonly type: 'pong' };

// ─── Type Guards ──────────────────────────────────────────────────────────────

export function parseWsClientEvent(raw: string): WsClientEvent | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.type !== 'string') return null;
    return parsed as WsClientEvent;
  } catch {
    return null;
  }
}

export function parseWsServerEvent(raw: string): WsServerEvent | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.type !== 'string') return null;
    return parsed as WsServerEvent;
  } catch {
    return null;
  }
}

export function serializeWsEvent(event: WsClientEvent | WsServerEvent): string {
  return JSON.stringify(event);
}
