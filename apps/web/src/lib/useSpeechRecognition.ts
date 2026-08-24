/**
 * useSpeechRecognition — React hook for the browser Web Speech API.
 *
 * States:
 *  idle          — ready but not listening
 *  requesting    — requesting microphone permission
 *  listening     — actively listening for speech
 *  processing    — recognition engine is processing audio
 *  done          — transcript ready in `transcript`
 *  unsupported   — browser does not support SpeechRecognition
 *  error         — recognition failed (see `errorMessage`)
 *
 * The hook never silently falls back to English when the selected language
 * is unsupported — it surfaces an explicit error state instead.
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { SupportedLanguage } from 'shared/types';
import { getSpeechLocale } from './speechLocale';

export type SpeechState =
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'processing'
  | 'done'
  | 'unsupported'
  | 'error';

export interface UseSpeechRecognitionReturn {
  speechState: SpeechState;
  transcript: string;
  errorMessage: string | null;
  /** Starts recognition. If already listening, stops it first. */
  startListening: () => void;
  /** Manually stops recognition. */
  stopListening: () => void;
  /** Resets state back to idle and clears transcript. */
  reset: () => void;
  isSupported: boolean;
}

// Augment window type for webkit prefix
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

function getSpeechRecognitionCtor(): any {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(
  language: SupportedLanguage,
  onTranscriptReady?: (text: string) => void,
): UseSpeechRecognitionReturn {
  const isSupported = typeof window !== 'undefined' && getSpeechRecognitionCtor() !== null;

  const [speechState, setSpeechState] = useState<SpeechState>(
    isSupported ? 'idle' : 'unsupported',
  );
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any | null>(null);
  const onTranscriptReadyRef = useRef(onTranscriptReady);
  onTranscriptReadyRef.current = onTranscriptReady;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setTranscript('');
    setErrorMessage(null);
    setSpeechState(isSupported ? 'idle' : 'unsupported');
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setSpeechState('unsupported');
      return;
    }

    const locale = getSpeechLocale(language);
    if (!locale) {
      setSpeechState('error');
      setErrorMessage(`Speech recognition is not configured for "${language}".`);
      return;
    }

    // Stop any existing session
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const Ctor = getSpeechRecognitionCtor()!;
    const recognition = new Ctor();
    recognitionRef.current = recognition;

    recognition.lang = locale;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    setSpeechState('requesting');
    setTranscript('');
    setErrorMessage(null);

    recognition.onstart = () => {
      setSpeechState('listening');
    };

    recognition.onspeechend = () => {
      setSpeechState('processing');
    };

    recognition.onresult = (event) => {
      const result = event.results[0]?.[0]?.transcript?.trim() ?? '';
      setTranscript(result);
      setSpeechState('done');
      if (result && onTranscriptReadyRef.current) {
        onTranscriptReadyRef.current(result);
      }
    };

    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setSpeechState('error');
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setErrorMessage('Microphone access denied. Please allow microphone permissions.');
          break;
        case 'no-speech':
          setErrorMessage('No speech detected. Please try again.');
          break;
        case 'language-not-supported':
          setErrorMessage(`Voice recognition is not supported for the selected language.`);
          break;
        case 'network':
          setErrorMessage('Network error during voice recognition. Please check your connection.');
          break;
        default:
          setErrorMessage('Voice recognition failed. Please try again.');
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      // Only reset to idle if we're still in processing/listening state
      // (onresult and onerror set their own states)
      setSpeechState((prev) =>
        prev === 'listening' || prev === 'processing' ? 'idle' : prev,
      );
    };

    try {
      recognition.start();
    } catch (err) {
      recognitionRef.current = null;
      setSpeechState('error');
      setErrorMessage('Could not start voice recognition.');
      console.error('[useSpeechRecognition] start() failed:', err);
    }
  }, [language, isSupported]);

  return {
    speechState,
    transcript,
    errorMessage,
    startListening,
    stopListening,
    reset,
    isSupported,
  };
}
