# System Architecture

## Workspace Structure

This project is set up as an enterprise monorepo using npm workspaces. It isolates application code from shared libraries to ensure absolute decoupling.

- `apps/web`: Next.js 14 + React 18 citizen web portal.
- `apps/admin`: Next.js 14 + React 18 admin panel.
- `apps/backend`: Node.js + TypeScript backend (plain `http.createServer`, no framework).
- `packages/shared`: Shared types, contracts, API client, i18n, constants, schemas, and utilities.

## Workspace Core Rules

1. UI code lives under application workspaces (`apps/`).
2. Shared logic lives strictly under `packages/shared/` and must never depend on application modules.
3. Decoupled path aliases (`shared`, `@iva/backend`, etc.) are configured at the workspace level.

## Voice Input Architecture

Voice input is entirely **client-side** using the browser's **Web Speech API** (`SpeechRecognition`). No audio is uploaded to any server for transcription.

```
Microphone
  → Browser SpeechRecognition (Web Speech API)
  → Transcript text
  → Assistant text input (same as typed input)
  → WebSocket → Backend → RAG → MiniMax M3
  → Streaming response → UI
```

The selected application locale controls the speech recognition language via a centralized
BCP-47 mapping in `apps/web/src/lib/speechLocale.ts`.

## WebSocket Architecture

Real-time assistant communication uses a WebSocket server attached to the same Node.js
`http.Server` as the REST API (port 4000). No separate service is required.

```
Browser WebAssistant
  → AssistantSocket (apps/web/src/lib/assistantSocket.ts)
  → ws://host:4000/ws/assistant
  → apps/backend/src/ws/assistant-ws.ts
  → AssistantRepository (RAG keyword retrieval)
  → MiniMax M3 (primary) / Gemini (fallback)
  → message.completed event
  → UI update
```

### WebSocket Message Contract

Typed contracts are defined in `packages/shared/contracts/ws-messages.ts`.

**Client → Server:**
- `message.send` — send a user message with locale, source (text/voice), and optional conversationId
- `message.cancel` — cancel an in-flight request
- `ping` — heartbeat

**Server → Client:**
- `message.started` — confirms conversationId
- `message.delta` — streaming text chunk
- `message.completed` — final full text
- `message.error` — pipeline failure
- `pong` — heartbeat response

## HTTP REST API

REST endpoints remain available for all non-realtime operations. The assistant pipeline
is also accessible via HTTP POST `/api/v1/assistant/message` for backwards compatibility.
