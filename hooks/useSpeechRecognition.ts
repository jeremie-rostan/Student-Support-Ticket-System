'use client';

import { useState, useCallback, useRef } from 'react';

// Use browser's built-in Web Speech API
const SpeechRecognition = typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null;

export function useSpeechRecognition() {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(!!SpeechRecognition);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  const loadModel = useCallback(async () => {
    // Check if Web Speech API is available
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setIsReady(false);
      return;
    }

    console.log('[loadModel] Web Speech API is available');
    setIsReady(true);
  }, []);

  const startLiveTranscription = useCallback((onTranscript: (text: string) => void, onEnd: () => void) => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser');
      return null;
    }

    console.log('[startLiveTranscription] Starting live speech recognition');

    // Create recognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Get interim results as user speaks
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    transcriptRef.current = '';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        transcriptRef.current += finalTranscript;
        console.log('[recognition] Final transcript:', transcriptRef.current);
      }

      // Call the callback with current transcript (final + interim)
      onTranscript(transcriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('[recognition] Error:', event.error);

      // Ignore "no-speech" errors as they're normal
      if (event.error !== 'no-speech') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log('[recognition] Recognition ended');
      onEnd();
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      console.log('[recognition] Started successfully');
      return recognition;
    } catch (err) {
      console.error('[recognition] Failed to start:', err);
      setError('Failed to start speech recognition');
      return null;
    }
  }, []);

  const stopLiveTranscription = useCallback(() => {
    if (recognitionRef.current) {
      console.log('[stopLiveTranscription] Stopping recognition');
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    return transcriptRef.current.trim();
  }, []);

  return {
    loadModel,
    startLiveTranscription,
    stopLiveTranscription,
    error,
    isReady,
    isModelLoading: false,
    transcriptionProgress: 0,
    transcribe: async () => '' // Deprecated, not used anymore
  };
}
