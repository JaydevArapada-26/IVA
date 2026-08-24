/**
 * WebSocket assistant handler.
 *
 * Attaches to the existing Node.js http.Server so voice and typed messages
 * share exactly the same port as the REST API.
 *
 * Message lifecycle per request:
 *   client → message.send
 *   server → message.started (conversationId confirmed)
 *   server → message.completed (full reply — non-streaming for now)
 *   server → message.error (on failure)
 */

import type { Server as HttpServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import { verifySupabaseAccessToken } from '../lib/supabase-jwt';
import { resolveCitizenSession } from '../lib/auth-store';
import { AssistantRepository } from '../db/repositories/assistant.repository';
import { ProfileRepository } from '../db/repositories/profile.repository';
import { db } from '../db/connection';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type {
  WsClientEvent,
  WsServerEvent,
  WsMessageSendPayload,
} from 'shared/contracts/ws-messages';
import { getCandidateSchemesForQuery } from '../lib/recommendation/service';
import { generateAssistantReply, getLlmAvailability } from '../lib/llm/client';
import { formatRecommendationContextBlock, formatSchemeContextBlock } from '../lib/llm/promptContext';
import { resolveLanguageName } from '../lib/llm/language';

function parseWsClientEvent(raw: string): WsClientEvent | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.type !== 'string') return null;
    return parsed as WsClientEvent;
  } catch {
    return null;
  }
}

function serializeWsEvent(event: WsServerEvent): string {
  return JSON.stringify(event);
}

// ─── Guest user resolver ──────────────────────────────────────────────────────

const GUEST_AUTH_ID = 'guest-anonymous-citizen';

async function findOrCreateGuestUser(): Promise<string> {
  try {
    const existing = await db.select().from(users).where(eq(users.authUserId, GUEST_AUTH_ID)).limit(1);
    if (existing[0]) return existing[0].id;
    const [created] = await db
      .insert(users)
      .values({
        authUserId: GUEST_AUTH_ID,
        phoneNumber: '0000000000',
        displayName: 'Guest Citizen',
        status: 'active',
      })
      .returning();
    if (created) return created.id;
    const fallback = await db.select().from(users).limit(1);
    if (fallback[0]) return fallback[0].id;
    throw new Error('No user record available to associate conversation');
  } catch (err) {
    const fallback = await db.select().from(users).limit(1);
    if (fallback[0]) return fallback[0].id;
    throw err;
  }
}

async function resolveLocalUserId(token?: string): Promise<string> {
  if (token && token.trim().length > 0) {
    const session = resolveCitizenSession(token);
    if (session?.userId) return session.userId;

    try {
      const claims = await verifySupabaseAccessToken(token);
      if (claims?.sub) {
        const [byAuthId] = await db.select().from(users).where(eq(users.authUserId, claims.sub)).limit(1);
        if (byAuthId) return byAuthId.id;
      }
    } catch {
      // ignore
    }
  }

  return await findOrCreateGuestUser();
}

// ─── AI Pipeline ─────────────────────────────────────────────────────────────

/**
 * Builds the assistant's system prompt. When the citizen has a stored language preference, that
 * is authoritative (spec 2.18) — the database's language is never allowed to leak through, and
 * the LLM is still told to gracefully handle a query typed in a different script/language (code-
 * switching, Romanized input) rather than translating it verbatim.
 */
function buildSystemPrompt(targetLanguage: string): string {
  return (
    `You are IVA (Indian Citizen Welfare Assistant), a helpful, compassionate voice and text assistant for Indian government schemes.\n` +
    `GUIDELINES:\n` +
    `1. LANGUAGE: Respond in ${targetLanguage}. If the citizen's message is typed in a different language or script (including Romanized/Hinglish-style input), still understand it correctly, but reply in ${targetLanguage} unless they explicitly ask for another language. NEVER include English parentheticals, translations, or filler text.\n` +
    `2. STYLE & FORMAT: Format the response as a concise summary covering: what the scheme is, who it is for, main benefits, important eligibility, required documents, and next action. Use simple, plain language and brief, clean bullet points.\n` +
    `3. ACCURACY & GROUNDING: Ground your answers strictly in the scheme information provided below, if any. Never invent scheme names, benefits, or eligibility rules. If nothing relevant is attached, say so honestly in ${targetLanguage} rather than guessing.\n` +
    `4. PERSONALIZATION: When schemes are marked "Eligible" or "Likely eligible" with a "Why this may fit" note, you may briefly mention the one or two most relevant reasons — never repeat the citizen's entire profile, and never mention scores, ranks, or database ids.\n` +
    `5. ACTIONABLE: Clearly list steps and documents so citizens can take immediate action.`
  );
}

async function buildUserPrompt(userId: string, repo: AssistantRepository, payload: WsMessageSendPayload): Promise<string> {
  if (payload.schemeId) {
    const context = await repo.findSchemeContext(payload.schemeId);
    if (context) {
      return `The citizen is asking about the following scheme:\n\n${formatSchemeContextBlock([context])}\n\nCitizen's question: ${payload.text}`;
    }
    return `Citizen's question: ${payload.text}`;
  }

  // Profile-aware retrieval (spec 2.1-2.13) — reuses the same eligibility/ranking engine as the
  // daily SMS job and admin manual send, not a separate keyword search.
  const candidates = await getCandidateSchemesForQuery(userId, payload.text, { limit: 5 });
  if (candidates.length > 0) {
    return (
      `Here are the citizen's strongest matching schemes, already ranked by eligibility and relevance:\n\n${formatRecommendationContextBlock(candidates)}\n\n` +
      `Using ONLY the above, answer the citizen's question concisely: "${payload.text}"`
    );
  }

  return (
    `No sufficiently relevant scheme was found in the database for this query. Politely say so, briefly explain the limitation, and ask one useful ` +
    `follow-up question or offer to search more broadly — do not invent or return unrelated schemes as a fallback.\n\nCitizen's question: "${payload.text}"`
  );
}

async function runAssistantPipeline(
  userId: string,
  payload: WsMessageSendPayload,
): Promise<{ reply: string; conversationId: string; configured: boolean }> {
  const availability = getLlmAvailability();

  const repo = new AssistantRepository();
  let conversation = payload.conversationId
    ? await repo.getConversation(payload.conversationId, userId)
    : undefined;
  if (!conversation) {
    conversation = await repo.createConversation(userId, availability.modelName, availability.modelVersion, payload.schemeId);
  }

  await repo.addMessage(conversation.id, 'user', payload.text);

  let reply: string;
  if (availability.configured) {
    const { profile } = await new ProfileRepository().getOrCreateByUserId(userId);
    const systemPrompt = buildSystemPrompt(resolveLanguageName(profile.languageCode));
    const userPrompt = await buildUserPrompt(userId, repo, payload);
    const result = await generateAssistantReply(systemPrompt, userPrompt);
    reply = result.reply;
  } else {
    reply = "The AI assistant isn't configured in this environment yet.";
  }

  await repo.addMessage(conversation.id, 'assistant', reply, { modelName: availability.modelName, modelVersion: availability.modelVersion });

  return { reply, conversationId: conversation.id, configured: availability.configured };
}

// ─── WebSocket server ─────────────────────────────────────────────────────────

const HEARTBEAT_INTERVAL_MS = 30_000;

function send(ws: WebSocket, event: WsServerEvent): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(serializeWsEvent(event));
  }
}

function extractTokenFromRequest(req: any): string | undefined {
  const url = new URL(req.url ?? '/', `http://${req.headers?.host ?? 'localhost'}`);
  return url.searchParams.get('token') ?? undefined;
}

export function attachAssistantWebSocket(httpServer: any): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/assistant' });

  wss.on('connection', (ws, req) => {
    const urlToken = extractTokenFromRequest(req);
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
    let isAlive = true;

    // ── Heartbeat ──────────────────────────────────────────────────────────
    heartbeatTimer = setInterval(() => {
      if (!isAlive) {
        ws.terminate();
        return;
      }
      isAlive = false;
      ws.ping();
    }, HEARTBEAT_INTERVAL_MS);

    ws.on('pong', () => { isAlive = true; });

    ws.on('close', () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    });

    ws.on('error', (err) => {
      console.error('[ws/assistant] Socket error:', err.message);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    });

    // ── Message handler ────────────────────────────────────────────────────
    ws.on('message', (raw) => {
      void (async () => {
        const text = typeof raw === 'string' ? raw : raw.toString('utf8');
        const event = parseWsClientEvent(text);
        if (!event) return;

        if (event.type === 'ping') {
          send(ws, { type: 'pong' });
          return;
        }

        if (event.type === 'message.send') {
          const p = event.payload;

          try {
            const tokenToUse = (p as any).token || urlToken;
            const effectiveUserId = await resolveLocalUserId(tokenToUse);

            const { reply, conversationId } = await runAssistantPipeline(effectiveUserId, p);

            send(ws, {
              type: 'message.started',
              payload: { requestId: p.requestId, conversationId },
            });

            send(ws, {
              type: 'message.completed',
              payload: { requestId: p.requestId, conversationId, fullText: reply },
            });
          } catch (err) {
            const message = err instanceof Error ? err.stack || err.message : String(err);
            console.error('[ws/assistant] Pipeline error:\n', message);
            send(ws, {
              type: 'message.error',
              payload: {
                requestId: p.requestId,
                code: 'INTERNAL_ERROR',
                message: err instanceof Error ? err.message : 'The assistant encountered an error.',
              },
            });
          }
        }
      })();
    });
  });

  console.log('[ws/assistant] WebSocket server attached at /ws/assistant');
  return wss;
}
