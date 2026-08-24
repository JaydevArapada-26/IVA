import React, { useState, useRef, useCallback } from 'react';
import { ThemeColors } from 'shared/constants/theme';
import { SupportedLanguage } from 'shared/types';
import { getTranslation } from 'shared/i18n/translations';
import { FONT_SERIF, FONT_SANS } from '../design/tokens';
import { useAssistantSocket } from '../lib/useAssistantSocket';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';
import type { WsServerEvent } from 'shared/contracts/ws-messages';
import type { SocketConnectionState } from '../lib/assistantSocket';

interface WebAssistantProps {
  theme: ThemeColors;
  language: SupportedLanguage;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const MicIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MicOffIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const SendIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const SparkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const ThinkingDots: React.FC<{ theme: ThemeColors }> = ({ theme }) => (
  <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '5px', alignItems: 'center', padding: '12px 16px', backgroundColor: theme.surface, borderRadius: '16px', border: `1px solid ${theme.border}` }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: theme.primary, animation: `dotPulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
    ))}
  </div>
);

const ConnectionBadge: React.FC<{ state: SocketConnectionState; theme: ThemeColors }> = ({ state, theme }) => {
  if (state === 'connected') return null;
  const label = state === 'connecting' ? 'Connecting…'
    : state === 'reconnecting' ? 'Reconnecting…'
    : state === 'error' ? 'Connection error'
    : state === 'closed' ? 'Disconnected'
    : null;
  if (!label) return null;
  return (
    <div style={{
      fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '100px',
      backgroundColor: state === 'error' || state === 'closed' ? '#fee2e2' : '#fef9c3',
      color: state === 'error' || state === 'closed' ? '#b91c1c' : '#854d0e',
    }}>
      {label}
    </div>
  );
};

// ─── Starter prompts ──────────────────────────────────────────────────────────

const STARTER_PROMPTS = [
  'What schemes am I eligible for?',
  'How do I apply for PM Kisan?',
  'What documents do I need for Ayushman Bharat?',
  'Are there schemes for farmers in Maharashtra?',
];

// ─── Message type ─────────────────────────────────────────────────────────────

interface ChatMessage {
  readonly id: string;
  readonly sender: 'user' | 'assistant';
  text: string;
  streaming: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────

export const WebAssistant: React.FC<WebAssistantProps> = ({ theme, language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'greeting', sender: 'assistant', text: getTranslation(language, 'assistantGreeting'), streaming: false },
  ]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  const isSendingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── WebSocket ──────────────────────────────────────────────────────────────

  const handleWsEvent = useCallback((event: WsServerEvent) => {
    if (event.type === 'message.started') {
      setConversationId(event.payload.conversationId);
    } else if (event.type === 'message.delta') {
      setMessages(prev => prev.map(m =>
        m.id === event.payload.requestId
          ? { ...m, text: m.text + event.payload.delta }
          : m,
      ));
    } else if (event.type === 'message.completed') {
      setMessages(prev => prev.map(m =>
        m.id === event.payload.requestId
          ? { ...m, text: event.payload.fullText, streaming: false }
          : m,
      ));
      setConversationId(event.payload.conversationId);
      setIsSending(false);
      isSendingRef.current = false;
    } else if (event.type === 'message.error') {
      setMessages(prev => prev.map(m =>
        m.id === event.payload.requestId
          ? { ...m, text: event.payload.message || 'The assistant is unavailable right now. Please try again shortly.', streaming: false }
          : m,
      ));
      setIsSending(false);
      isSendingRef.current = false;
    }
  }, []);

  const { connectionState, sendMessage } = useAssistantSocket(handleWsEvent);

  // ── Voice recognition ──────────────────────────────────────────────────────

  const handleTranscriptReady = useCallback((text: string) => {
    setInputQuery(text);
  }, []);

  const { speechState, errorMessage: voiceError, startListening, stopListening, isSupported: voiceSupported } = useSpeechRecognition(language, handleTranscriptReady);

  const isListening = speechState === 'listening' || speechState === 'requesting' || speechState === 'processing';

  // ── Scroll ─────────────────────────────────────────────────────────────────

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // ── Send handler ───────────────────────────────────────────────────────────

  const handleSend = useCallback((text?: string) => {
    const textToSend = (text ?? inputQuery).trim();
    if (!textToSend || isSendingRef.current) return;

    isSendingRef.current = true;
    setIsSending(true);
    setInputQuery('');

    // Add user message immediately
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      streaming: false,
    }]);

    // Send via WebSocket and create an assistant placeholder keyed by requestId
    const requestId = sendMessage({
      text: textToSend,
      locale: language,
      source: speechState === 'done' ? 'voice' : 'text',
      conversationId,
    });

    // Add streaming placeholder for the assistant reply
    setMessages(prev => [...prev, {
      id: requestId,
      sender: 'assistant',
      text: '',
      streaming: true,
    }]);
  }, [inputQuery, language, speechState, conversationId, sendMessage]);

  // ── Mic toggle ─────────────────────────────────────────────────────────────

  const handleMicToggle = useCallback(() => {
    if (!voiceSupported) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [voiceSupported, isListening, startListening, stopListening]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const isEmpty = messages.length === 1;

  const micColor = !voiceSupported ? theme.textSubtle
    : isListening ? '#ef4444'
    : speechState === 'error' ? '#ef4444'
    : theme.textHeading;

  const micBg = isListening ? (theme.isDark ? '#3f1212' : '#fee2e2') : theme.surfaceSubtle;
  const micTitle = !voiceSupported ? 'Voice input not supported in this browser'
    : isListening ? 'Stop listening'
    : speechState === 'error' ? (voiceError ?? 'Voice error')
    : 'Start voice input';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: theme.background, fontFamily: FONT_SANS }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 24px', borderBottom: `1px solid ${theme.borderSubtle}`, backgroundColor: theme.surface, flexShrink: 0 }}>
        <div style={{ backgroundColor: theme.surfaceSubtle, border: `1.5px solid ${theme.border}`, borderRadius: '12px', padding: '8px', color: theme.primary, display: 'flex' }}>
          <MicIcon />
        </div>
        <div>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: '20px', fontWeight: '900', color: theme.textHeading, margin: 0, lineHeight: 1 }}>
            {getTranslation(language, 'assistantTitle')}
          </h2>
          <p style={{ fontSize: '12.5px', color: theme.textSubtle, margin: '3px 0 0', fontWeight: '500' }}>
            {getTranslation(language, 'assistantSubtitle')}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ConnectionBadge state={connectionState} theme={theme} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#dcfce7', color: '#15803d', padding: '5px 10px', borderRadius: '100px', fontSize: '11.5px', fontWeight: '800' }}>
            <SparkIcon /> {getTranslation(language, 'assistantAiActive')}
          </div>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Starter prompts when chat is empty */}
        {isEmpty && (
          <div style={{ marginTop: 'auto', paddingBottom: '24px' }}>
            <p style={{ textAlign: 'center', fontSize: '13px', color: theme.textSubtle, marginBottom: '14px', fontWeight: '600' }}>
              {getTranslation(language, 'assistantTryAsking')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {STARTER_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  style={{ backgroundColor: theme.surface, color: theme.textMuted, border: `1px solid ${theme.border}`, borderRadius: '100px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.surfaceSubtle; e.currentTarget.style.color = theme.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = theme.surface; e.currentTarget.style.color = theme.textMuted; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              animation: 'fadeUp 0.2s ease both',
            }}
          >
            <div style={{
              backgroundColor: msg.sender === 'user' ? theme.primary : theme.surface,
              color: msg.sender === 'user' ? theme.textInverse : theme.textHeading,
              borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
              padding: '13px 17px',
              fontSize: '14.5px',
              lineHeight: '1.6',
              border: msg.sender === 'user' ? 'none' : `1.5px solid ${theme.border}`,
              boxShadow: msg.sender === 'user' ? '0 4px 14px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
              whiteSpace: 'pre-wrap',
              minHeight: msg.streaming && msg.text === '' ? '44px' : undefined,
            }}>
              {msg.streaming && msg.text === ''
                ? <span style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: theme.textSubtle, display: 'inline-block', animation: `dotPulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                    ))}
                  </span>
                : msg.text}
            </div>
          </div>
        ))}

        {/* Voice state feedback */}
        {speechState === 'listening' && (
          <div style={{ alignSelf: 'flex-start', color: theme.primary, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1.5s infinite' }} />
            Listening…
          </div>
        )}
        {speechState === 'processing' && (
          <div style={{ alignSelf: 'flex-start', color: theme.textSubtle, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', border: `2px solid ${theme.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            Processing…
          </div>
        )}
        {voiceError && (
          <div style={{ alignSelf: 'flex-start', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #ef4444', borderRadius: '50%', fontSize: '10px', fontWeight: 'bold' }}>!</div>
            {voiceError}
          </div>
        )}
        {isSending && <ThinkingDots theme={theme} />}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 24px 20px', borderTop: `1px solid ${theme.borderSubtle}`, backgroundColor: theme.surface, flexShrink: 0 }}>
        <div
          style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', maxWidth: '100%', backgroundColor: theme.background, border: `1.5px solid ${theme.border}`, borderRadius: '16px', padding: '8px 8px 8px 16px', transition: 'border-color 0.15s, box-shadow 0.15s' }}
          onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.primary; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 3px ${theme.isDark ? 'rgba(82,183,136,0.15)' : 'rgba(113,131,85,0.12)'}`; }}
          onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
        >
          <input
            type="text"
            placeholder={getTranslation(language, 'assistantPrompt')}
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                handleSend();
              }
            }}
            style={{ flex: 1, backgroundColor: 'transparent', color: theme.textHeading, border: 'none', fontSize: '15px', outline: 'none', padding: '6px 0', fontFamily: FONT_SANS }}
          />

          {/* Mic button */}
          <button
            onClick={handleMicToggle}
            disabled={isSending || !voiceSupported || speechState === 'unsupported'}
            title={micTitle}
            style={{
              background: micBg,
              color: micColor,
              border: 'none',
              borderRadius: '10px',
              width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isSending || !voiceSupported ? 'default' : 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s',
              animation: isListening ? 'pulse 1.5s infinite' : 'none',
              opacity: !voiceSupported ? 0.4 : 1,
            }}
          >
            {voiceSupported ? <MicIcon /> : <MicOffIcon />}
          </button>

          {/* Send button */}
          <button
            onClick={() => handleSend()}
            disabled={isSending || !inputQuery.trim()}
            style={{
              background: (isSending || !inputQuery.trim())
                ? theme.surfaceSubtle
                : `linear-gradient(135deg, ${theme.primary}, ${theme.primaryHover})`,
              color: (isSending || !inputQuery.trim()) ? theme.textSubtle : theme.textInverse,
              border: 'none',
              borderRadius: '10px',
              width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: (isSending || !inputQuery.trim()) ? 'default' : 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            <SendIcon />
          </button>
        </div>

        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
          @keyframes dotPulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.3); opacity: 1; }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <p style={{ fontSize: '11.5px', color: theme.textSubtle, textAlign: 'center', margin: '8px 0 0', fontWeight: '500' }}>
          {getTranslation(language, 'assistantDisclaimer')}
        </p>
      </div>
    </div>
  );
};
