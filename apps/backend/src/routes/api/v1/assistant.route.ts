import type { HttpRouteDefinition, JsonValue } from '../../../http/types';
import type { AssistantMessageResponse } from 'shared/contracts/assistant';
import { AssistantRepository } from '../../../db/repositories/assistant.repository';
import { ProfileRepository } from '../../../db/repositories/profile.repository';
import { err, ok, parseJsonBody, requireCitizenUserId } from '../../../lib/http-responses';
import { getCandidateSchemesForQuery } from '../../../lib/recommendation/service';
import { generateAssistantReply, getLlmAvailability } from '../../../lib/llm/client';
import { formatRecommendationContextBlock, formatSchemeContextBlock } from '../../../lib/llm/promptContext';
import { resolveLanguageName } from '../../../lib/llm/language';

/**
 * HTTP fallback path for the assistant — the primary path actually used by the web UI is the
 * WebSocket handler (ws/assistant-ws.ts). Both now share the same canonical pieces: the LLM
 * client (lib/llm/client.ts), the profile-aware SchemeRecommendationService
 * (lib/recommendation/service.ts), and the citizen's stored language preference as the
 * authoritative response language (spec 2.18) rather than a client-supplied `language` field.
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

async function buildUserPrompt(userId: string, repo: AssistantRepository, message: string, schemeId?: string): Promise<string> {
  if (schemeId) {
    const context = await repo.findSchemeContext(schemeId);
    if (context) {
      return `The citizen is asking about the following scheme:\n\n${formatSchemeContextBlock([context])}\n\nCitizen's question: ${message}`;
    }
    return `Citizen's question: ${message}`;
  }

  const candidates = await getCandidateSchemesForQuery(userId, message, { limit: 5 });
  if (candidates.length > 0) {
    return (
      `Here are the citizen's strongest matching schemes, already ranked by eligibility and relevance:\n\n${formatRecommendationContextBlock(candidates)}\n\n` +
      `Using ONLY the above, answer the citizen's question concisely: "${message}"`
    );
  }

  return (
    `No sufficiently relevant scheme was found in the database for this query. Politely say so, briefly explain the limitation, and ask one useful ` +
    `follow-up question or offer to search more broadly — do not invent or return unrelated schemes as a fallback.\n\nCitizen's question: "${message}"`
  );
}

export const postAssistantMessageRoute: HttpRouteDefinition = {
  method: 'POST',
  path: '/assistant/message',
  summary: 'Send a message to the AI assistant and persist the conversation',
  handler: async (req) => {
    const userId = requireCitizenUserId(req);
    if (!userId) {
      return err('UNAUTHORIZED', 'A valid session token is required');
    }

    const parsed = parseJsonBody(req.bodyText);
    if (!parsed.ok) {
      return err('BAD_REQUEST', 'Request body must be valid JSON');
    }

    const message = typeof parsed.value.message === 'string' ? parsed.value.message.trim() : '';
    if (!message) {
      return err('BAD_REQUEST', 'message is required');
    }
    const conversationId = typeof parsed.value.conversationId === 'string' ? parsed.value.conversationId : undefined;
    const schemeId = typeof parsed.value.schemeId === 'string' ? parsed.value.schemeId : undefined;

    const availability = getLlmAvailability();

    const repo = new AssistantRepository();
    let conversation = conversationId ? await repo.getConversation(conversationId, userId) : undefined;
    if (!conversation) {
      conversation = await repo.createConversation(userId, availability.modelName, availability.modelVersion, schemeId);
    }

    await repo.addMessage(conversation.id, 'user', message);

    let reply: string;
    if (availability.configured) {
      const { profile } = await new ProfileRepository().getOrCreateByUserId(userId);
      const systemPrompt = buildSystemPrompt(resolveLanguageName(profile.languageCode));
      const userPrompt = await buildUserPrompt(userId, repo, message, schemeId);
      const result = await generateAssistantReply(systemPrompt, userPrompt);
      reply = result.reply;
    } else {
      reply = "The AI assistant isn't configured in this environment yet.";
    }

    await repo.addMessage(conversation.id, 'assistant', reply, { modelName: availability.modelName, modelVersion: availability.modelVersion });

    const data: AssistantMessageResponse = {
      conversationId: conversation.id,
      reply,
      configured: availability.configured,
    };
    return ok(data as unknown as JsonValue);
  },
};
