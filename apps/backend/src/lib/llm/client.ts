/**
 * Shared LLM client for the Assistant — MiniMax M3 (via NVIDIA NIM) primary, Gemini fallback.
 *
 * Previously duplicated near-verbatim across ws/assistant-ws.ts (the primary path actually used
 * by the web UI) and routes/api/v1/assistant.route.ts (HTTP back-compat path), with small
 * divergences between the two copies (different retry counts, one path guarding against a
 * malformed placeholder Gemini key and the other not). Consolidated here so there is exactly one
 * "call the configured LLM(s) and fall back sanely" implementation.
 */
import { loadBackendEnv } from '../../config';

interface MiniMaxResponseBody {
  readonly choices?: ReadonlyArray<{ readonly message?: { readonly content?: string } }>;
}

interface GeminiResponseBody {
  readonly candidates?: ReadonlyArray<{ readonly content?: { readonly parts?: ReadonlyArray<{ readonly text?: string }> } }>;
}

export interface LlmAvailability {
  readonly hasMiniMax: boolean;
  readonly hasGemini: boolean;
  readonly configured: boolean;
  readonly modelName: string;
  readonly modelVersion: string;
}

/** A visibly-placeholder Gemini key (e.g. copied from a template without ever being replaced)
 * would otherwise fail every call with an opaque 400 — treat it as "not configured" instead. */
function isPlaceholderGeminiKey(key: string): boolean {
  return key.length === 0 || key.startsWith('AQ.');
}

export function getLlmAvailability(): LlmAvailability {
  const env = loadBackendEnv();
  const hasMiniMax = env.minimaxApiKey.length > 0;
  const hasGemini = env.geminiApiKey.length > 0 && !isPlaceholderGeminiKey(env.geminiApiKey);
  return {
    hasMiniMax,
    hasGemini,
    configured: hasMiniMax || hasGemini,
    modelName: hasMiniMax ? env.minimaxModel : hasGemini ? env.geminiModel : 'unconfigured',
    modelVersion: hasMiniMax ? 'm3' : 'v1beta',
  };
}

async function callMiniMaxOnce(
  apiKey: string,
  model: string,
  apiUrl: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ status: number; text: string; error?: string }> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 1024,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    return { status: response.status, text: '', error: errorBody };
  }
  const json = (await response.json()) as MiniMaxResponseBody;
  return { status: response.status, text: json.choices?.[0]?.message?.content?.trim() ?? '' };
}

/** Up to two retries on 429 (1.5s, then 2.5s backoff) — matches the more resilient of the two
 * previously-duplicated implementations. */
export async function callMiniMax(systemPrompt: string, userPrompt: string): Promise<{ text: string; ok: boolean }> {
  const env = loadBackendEnv();
  try {
    let result = await callMiniMaxOnce(env.minimaxApiKey, env.minimaxModel, env.minimaxApiUrl, systemPrompt, userPrompt);
    if (result.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      result = await callMiniMaxOnce(env.minimaxApiKey, env.minimaxModel, env.minimaxApiUrl, systemPrompt, userPrompt);
    }
    if (result.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      result = await callMiniMaxOnce(env.minimaxApiKey, env.minimaxModel, env.minimaxApiUrl, systemPrompt, userPrompt);
    }
    if (result.status !== 200) {
      console.error(`[MiniMax] API request failed with status ${result.status}: ${result.error ?? ''}`);
      return { text: '', ok: false };
    }
    return { text: result.text, ok: result.text.length > 0 };
  } catch (err) {
    console.error('[MiniMax] Network/Fetch error:', err instanceof Error ? err.message : err);
    return { text: '', ok: false };
  }
}

async function callGeminiOnce(apiKey: string, model: string, prompt: string): Promise<{ status: number; text: string | undefined; error?: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    return { status: response.status, text: undefined, error: errText };
  }
  const json = (await response.json()) as GeminiResponseBody;
  return { status: response.status, text: json.candidates?.[0]?.content?.parts?.[0]?.text };
}

export async function callGemini(prompt: string): Promise<{ text: string; ok: boolean }> {
  const env = loadBackendEnv();
  try {
    let result = await callGeminiOnce(env.geminiApiKey, env.geminiModel, prompt);
    if (result.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      result = await callGeminiOnce(env.geminiApiKey, env.geminiModel, prompt);
    }
    if (result.status !== 200) {
      console.error(`[Gemini] API request failed with status ${result.status}: ${result.error ?? ''}`);
      const text =
        result.status === 429
          ? "IVA's assistant is getting a lot of questions right now — please try again in a moment."
          : `The assistant request failed (HTTP ${result.status}).`;
      return { text, ok: false };
    }
    return { text: result.text?.trim() || 'The assistant did not return a response.', ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Gemini] Network/Fetch error:', message);
    return { text: `The assistant request failed: ${message}`, ok: false };
  }
}

/**
 * The one "generate a reply" entry point both assistant pipelines call: MiniMax first, Gemini as
 * fallback on failure, a friendly message when neither is configured. Returns model metadata too,
 * for persisting alongside the conversation message.
 */
export async function generateAssistantReply(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ reply: string; availability: LlmAvailability }> {
  const availability = getLlmAvailability();

  if (!availability.configured) {
    return { reply: "The AI assistant isn't configured in this environment yet.", availability };
  }

  if (availability.hasMiniMax) {
    const result = await callMiniMax(systemPrompt, userPrompt);
    if (result.ok) return { reply: result.text, availability };
    if (availability.hasGemini) {
      console.log('[assistant] MiniMax failed, falling back to Gemini');
      const geminiResult = await callGemini(`${systemPrompt}\n\n${userPrompt}`);
      return { reply: geminiResult.text, availability };
    }
    return { reply: 'The assistant request could not be processed at the moment. Please try again shortly.', availability };
  }

  const geminiResult = await callGemini(`${systemPrompt}\n\n${userPrompt}`);
  return { reply: geminiResult.text, availability };
}

/** Small, focused call used only for local intent/keyword extraction (system+user in, raw text
 * out — callers parse the JSON themselves). Tries MiniMax then Gemini, same priority as
 * generateAssistantReply, but returns `undefined` on total failure instead of a user-facing
 * error string, since a failed intent extraction just means "fall back to no keywords". */
export async function generateStructuredText(systemPrompt: string, userPrompt: string): Promise<string | undefined> {
  const availability = getLlmAvailability();
  if (availability.hasMiniMax) {
    const res = await callMiniMax(systemPrompt, userPrompt);
    if (res.ok) return res.text;
  }
  if (availability.hasGemini) {
    const res = await callGemini(`${systemPrompt}\n\n${userPrompt}`);
    if (res.ok) return res.text;
  }
  return undefined;
}
