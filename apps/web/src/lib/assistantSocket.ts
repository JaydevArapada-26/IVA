/**
 * AssistantSocket — reusable WebSocket client abstraction for the IVA assistant.
 *
 * Handles:
 * - Connection / disconnection lifecycle
 * - Typed message send / receive using shared WsClientEvent / WsServerEvent contracts
 * - Controlled exponential-backoff reconnect (max 5 attempts, capped at 30 s)
 * - Heartbeat ping every 30 s
 * - Event listener subscriptions with cleanup
 */

import type { WsClientEvent, WsServerEvent } from 'shared/contracts/ws-messages';
import { parseWsServerEvent, serializeWsEvent } from 'shared/contracts/ws-messages';

export type SocketConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'closed';

type MessageListener = (event: WsServerEvent) => void;
type StateListener = (state: SocketConnectionState) => void;

const HEARTBEAT_INTERVAL_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export class AssistantSocket {
  private ws: WebSocket | null = null;
  private state: SocketConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private intentionallyClosed = false;

  private readonly messageListeners: Set<MessageListener> = new Set();
  private readonly stateListeners: Set<StateListener> = new Set();

  constructor(private readonly url: string) {}

  // ── Public API ──────────────────────────────────────────────────────────────

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }
    this.intentionallyClosed = false;
    this.openSocket();
  }

  disconnect(): void {
    this.intentionallyClosed = true;
    this.clearReconnectTimer();
    this.clearHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.setState('closed');
  }

  send(event: WsClientEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[AssistantSocket] Cannot send — not connected');
      return;
    }
    this.ws.send(serializeWsEvent(event));
  }

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  getState(): SocketConnectionState {
    return this.state;
  }

  destroy(): void {
    this.disconnect();
    this.messageListeners.clear();
    this.stateListeners.clear();
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private openSocket(): void {
    this.setState(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      console.error('[AssistantSocket] Failed to create WebSocket:', err);
      this.setState('error');
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setState('connected');
      this.startHeartbeat();
    };

    this.ws.onclose = (evt) => {
      this.clearHeartbeat();
      if (this.intentionallyClosed) {
        this.setState('closed');
        return;
      }
      console.warn(`[AssistantSocket] Connection closed (code=${evt.code}). Attempting reconnect...`);
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onerror always precedes onclose — let onclose drive the reconnect.
      this.setState('error');
    };

    this.ws.onmessage = (evt) => {
      if (typeof evt.data !== 'string') return;
      const event = parseWsServerEvent(evt.data);
      if (!event) return;

      // Handle server pong inline to keep heartbeat logic self-contained
      if (event.type === 'pong') return;

      this.messageListeners.forEach((listener) => listener(event));
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[AssistantSocket] Max reconnect attempts reached. Giving up.');
      this.setState('error');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * 2 ** (this.reconnectAttempts - 1),
      MAX_RECONNECT_DELAY_MS,
    );
    console.log(`[AssistantSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    this.setState('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.openSocket();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, HEARTBEAT_INTERVAL_MS);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setState(next: SocketConnectionState): void {
    if (this.state === next) return;
    this.state = next;
    this.stateListeners.forEach((listener) => listener(next));
  }
}
