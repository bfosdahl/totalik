import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UseSpeechOptions {
  lang?: string;
  continuous?: boolean;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseSpeechReturn {
  isListening: boolean;
  isSpeaking: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  transcript: string;
  isSupported: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const { lang = 'nb-NO', continuous = false, onResult, onError } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window;

  // Check microphone permission status
  useEffect(() => {
    if (!isSupported) return;
    
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
          
          result.onchange = () => {
            setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
          };
        }
      } catch (error) {
        // Some browsers don't support permissions API for microphone
        console.log('Could not check microphone permission:', error);
      }
    };
    
    checkPermission();
  }, [isSupported]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = lang;
    recognitionRef.current.continuous = continuous;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: WebSpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      
      if (finalTranscript && onResult) {
        onResult(finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event: WebSpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      // Provide user-friendly error messages
      switch (event.error) {
        case 'not-allowed':
          toast.error('Mikrofontilgang ble nektet. Vennligst gi tilgang i nettleserens innstillinger.');
          setPermissionStatus('denied');
          break;
        case 'no-speech':
          toast.info('Ingen tale registrert. Prøv igjen.');
          break;
        case 'audio-capture':
          toast.error('Ingen mikrofon funnet. Vennligst koble til en mikrofon.');
          break;
        case 'network':
          toast.error('Nettverksfeil. Sjekk internettforbindelsen din.');
          break;
        case 'aborted':
          // User cancelled, no need to show error
          break;
        default:
          toast.error(`Talegjenkjenning feilet: ${event.error}`);
      }
      
      if (onError) {
        onError(event.error);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onstart = () => {
      setPermissionStatus('granted');
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, continuous, onResult, onError, isSupported]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current || isListening) return;
    
    // First, try to get microphone permission explicitly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
    } catch (error) {
      console.error('Microphone permission error:', error);
      if ((error as Error).name === 'NotAllowedError') {
        toast.error('Mikrofontilgang ble nektet. Klikk på låseikonet i adressefeltet for å gi tilgang.');
        setPermissionStatus('denied');
        return;
      } else if ((error as Error).name === 'NotFoundError') {
        toast.error('Ingen mikrofon funnet på enheten.');
        return;
      }
    }
    
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
      toast.success('🎤 Lytter... Snakk nå!');
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast.error('Kunne ikke starte taleopptak. Prøv igjen.');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Try to find a Norwegian voice
    const voices = window.speechSynthesis.getVoices();
    const norwegianVoice = voices.find(voice => 
      voice.lang.startsWith('nb') || voice.lang.startsWith('no')
    );
    if (norwegianVoice) {
      utterance.voice = norwegianVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [lang, isSupported]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    transcript,
    isSupported,
    permissionStatus,
  };
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => WebSpeechRecognition;
    webkitSpeechRecognition: new () => WebSpeechRecognition;
  }
}

interface WebSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface WebSpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: WebSpeechRecognitionResultList;
}

interface WebSpeechRecognitionResultList {
  readonly length: number;
  item(index: number): WebSpeechRecognitionResult;
  [index: number]: WebSpeechRecognitionResult;
}

interface WebSpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): WebSpeechRecognitionAlternative;
  [index: number]: WebSpeechRecognitionAlternative;
}

interface WebSpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface WebSpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
