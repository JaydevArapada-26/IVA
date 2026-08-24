/**
 * useAssistantSocket — React hook wrapping AssistantSocket.
 *
 * Provides:
 * - connection state
 * - sendMessage helper (automatically adds requestId, locale, source)
 * - server event callbacks (onDelta, onCompleted, onError)
 *
 * The socket instance is a module-level singleton to prevent duplicate
 * connections across React StrictMode double-mount.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AssistantSocket } from './assistantSocket';
import type { SocketConnectionState } from './assistantSocket';
import type { WsServerEvent, WsMessageSendPayload } from 'shared/contracts/ws-messages';

// Module-level singleton so Strict Mode double-mount doesn't create two sockets.
let sharedSocket: AssistantSocket | null = null;
let mountCount = 0;

function getWsUrl(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_WS_URL) {
    return `${process.env.NEXT_PUBLIC_WS_URL}/ws/assistant`;
  }
  // Derive from current origin (ws: / wss: mirrors http: / https:)
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.hostname}:4000/ws/assistant`;
  }
  return 'ws://localhost:4000/ws/assistant';
}

export type SendMessageOptions = Omit<WsMessageSendPayload, 'requestId'>;

export interface UseAssistantSocketReturn {
  connectionState: SocketConnectionState;
  sendMessage: (options: SendMessageOptions) => string; // returns the requestId
}

type EventCallback = (event: WsServerEvent) => void;

export function useAssistantSocket(onEvent: EventCallback): UseAssistantSocketReturn {
  const [connectionState, setConnectionState] = useState<SocketConnectionState>('disconnected');
  const onEventRef = useRef<EventCallback>(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    // Create singleton on first mount
    if (!sharedSocket) {
      sharedSocket = new AssistantSocket(getWsUrl());
    }
    mountCount++;

    const socket = sharedSocket;

    // Connect if not already connected or connecting
    const state = socket.getState();
    if (state === 'disconnected' || state === 'closed' || state === 'error') {
      socket.connect();
    }

    // Sync current state
    setConnectionState(socket.getState());

    const unsubState = socket.onStateChange((s) => setConnectionState(s));

    const unsubMessage = socket.onMessage((event) => {
      onEventRef.current(event);
    });

    return () => {
      unsubState();
      unsubMessage();
      mountCount--;
      // Only destroy when all consumers have unmounted
      if (mountCount === 0 && sharedSocket) {
        sharedSocket.destroy();
        sharedSocket = null;
      }
    };
  }, []); // empty deps — singleton lifecycle

  const sendMessage = useCallback((options: SendMessageOptions): string => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sharedSocket?.send({
      type: 'message.send',
      payload: { requestId, ...options },
    });
    return requestId;
  }, []);

  return { connectionState, sendMessage };
}
