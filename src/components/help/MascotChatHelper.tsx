import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AI_DATA_CHANGED_EVENT } from "@/lib/aiDataEvents";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Send, Lightbulb, Loader2, GripVertical, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProffConfig, ProffConfig } from "./proffConfig";
import { useSpeech } from "@/hooks/useSpeech";
import { t } from "@/i18n/t";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
}

const STORAGE_PREFIX = "mascot-chat:";
const SCOPED_PREFIX = "mascot-chat:v2:";
const OPEN_STORAGE_KEY = "mascot-chat:isOpen";

const loadPersistedMessages = (storageKey: string | null): Message[] | null => {
  if (typeof window === "undefined" || !storageKey) return null;
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const MascotChatHelper = () => {
  const location = useLocation();
  const { user, company, profile } = useAuth();
  const [proffConfig, setProffConfig] = useState<ProffConfig>(() => getProffConfig(location.pathname));
  const scopeKey = user
    ? `${user.id}:${company?.id ?? profile?.company_id ?? "none"}`
    : null;
  const storageKey = scopeKey ? `${SCOPED_PREFIX}${scopeKey}:${proffConfig.id}` : null;
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(OPEN_STORAGE_KEY) === "1";
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const persisted = loadPersistedMessages(storageKey);
    if (persisted && persisted.length > 0) return persisted;
    return [{ id: "welcome", content: proffConfig.welcomeMessage, isBot: true }];
  });

  // Remove legacy unscoped history keys (privacy: they were shared across users)
  useEffect(() => {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX) && !key.startsWith(SCOPED_PREFIX) && key !== OPEN_STORAGE_KEY) {
          toRemove.push(key);
        }
      }
      toRemove.forEach((key) => sessionStorage.removeItem(key));
    } catch { /* ignore */ }
  }, []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Refresh lists after the assistant performed an action
  const notifyDataChanged = useCallback((data: unknown) => {
    const actions = (data as { actions?: unknown[] } | null)?.actions;
    if (Array.isArray(actions) && actions.length > 0) {
      queryClient.invalidateQueries();
      window.dispatchEvent(new CustomEvent(AI_DATA_CHANGED_EVENT));
    }
  }, [queryClient]);
  const [currentTip, setCurrentTip] = useState(0);
  const tipsDismissedKey = user ? `mascot-chat:tipsDismissed:${user.id}` : null;
  const [tipsDismissed, setTipsDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined" || !tipsDismissedKey) return false;
    try {
      return localStorage.getItem(tipsDismissedKey) === "1";
    } catch {
      return false;
    }
  });
  const [tipsMobileShown, setTipsMobileShown] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(max-width: 639px)").matches;
  });

  // Track viewport width; treat missing matchMedia as desktop
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(max-width: 639px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const showTips = tipsMobileShown || (!isMobile && !tipsDismissed);

  const dismissTips = () => {
    if (tipsDismissedKey) {
      try {
        localStorage.setItem(tipsDismissedKey, "1");
      } catch { /* ignore */ }
    }
    setTipsDismissed(true);
    setTipsMobileShown(false);
  };

  const showTipsAgain = () => {
    if (tipsDismissedKey) {
      try {
        localStorage.removeItem(tipsDismissedKey);
      } catch { /* ignore */ }
    }
    setTipsDismissed(false);
    setTipsMobileShown(true);
  };
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [interimText, setInterimText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingTranscriptRef = useRef<string | null>(null);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const messagesKeyRef = useRef<string | null>(null);

  // Speech hook with auto-send on final result
  const speech = useSpeech({
    lang: 'nb-NO',
    onResult: (transcript) => {
      pendingTranscriptRef.current = transcript;
      setInput(transcript);
      setInterimText("");
    },
    onInterimResult: (transcript) => {
      setInterimText(transcript);
    },
  });

  // Persist open state across route changes
  useEffect(() => {
    try {
      sessionStorage.setItem(OPEN_STORAGE_KEY, isOpen ? "1" : "0");
    } catch { /* ignore */ }
  }, [isOpen]);

  // Persist messages per user+company+proff so tab/route switches don't wipe history
  useEffect(() => {
    if (!storageKey || messagesKeyRef.current !== storageKey) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch { /* ignore */ }
  }, [messages, storageKey]);

  // Update proff config when route or user/company scope changes; load that scope's history
  useEffect(() => {
    const newConfig = getProffConfig(location.pathname);
    const key = scopeKey ? `${SCOPED_PREFIX}${scopeKey}:${newConfig.id}` : null;
    if (newConfig.id !== proffConfig.id) {
      setProffConfig(newConfig);
      setCurrentTip(0);
    }
    const persisted = loadPersistedMessages(key);
    setMessages(
      persisted && persisted.length > 0
        ? persisted
        : [{ id: "welcome", content: newConfig.welcomeMessage, isBot: true }]
    );
    messagesKeyRef.current = key;
  }, [location.pathname, proffConfig.id, scopeKey]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  // Auto-send when speech recognition completes with final result
  useEffect(() => {
    if (pendingTranscriptRef.current && input === pendingTranscriptRef.current && !isLoading) {
      const transcriptToSend = pendingTranscriptRef.current;
      pendingTranscriptRef.current = null;
      // Small delay to let the user see what was transcribed, then send
      const timer = setTimeout(async () => {
        if (!transcriptToSend.trim()) return;
        
        // Stop listening if active
        if (speech.isListening) {
          speech.stopListening();
        }

        const userMessage: Message = {
          id: Date.now().toString(),
          content: transcriptToSend,
          isBot: false,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
          // Prepare history for context
          const historyForApi = messages
            .filter(m => m.id !== "welcome")
            .map(m => ({
              role: m.isBot ? "assistant" : "user",
              content: m.content
            }));

          const { data, error } = await supabase.functions.invoke(proffConfig.edgeFunction, {
            body: { message: transcriptToSend, history: historyForApi }
          });

          if (error) throw error;

          notifyDataChanged(data);
          const responseText = data?.reply || "Beklager, jeg forstod ikke helt. Kan du prøve igjen?";
          const botResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: responseText,
            isBot: true,
          };
          setMessages((prev) => [...prev, botResponse]);
          
          // Speak response if autoSpeak is enabled
          if (autoSpeak && speech.isSupported) {
            speech.speak(responseText);
          }
        } catch (error) {
          console.error("Chat error:", error);
          const errorText = "Oops! Noe gikk galt. Prøv igjen senere! 📖";
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: errorText,
            isBot: true,
          };
          setMessages((prev) => [...prev, errorResponse]);
        } finally {
          setIsLoading(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [input, isLoading, messages, proffConfig.edgeFunction, autoSpeak, speech, notifyDataChanged]);

  // Speak new bot messages if autoSpeak is enabled
  const handleBotResponse = useCallback((response: string) => {
    if (autoSpeak && speech.isSupported) {
      speech.speak(response);
    }
  }, [autoSpeak, speech]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Stop listening if active
    if (speech.isListening) {
      speech.stopListening();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isBot: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Prepare history for context
      const history = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({
          role: m.isBot ? "assistant" : "user",
          content: m.content
        }));

      const { data, error } = await supabase.functions.invoke(proffConfig.edgeFunction, {
        body: { message: userInput, history }
      });

      if (error) throw error;

      notifyDataChanged(data);
      const responseText = data?.reply || "Beklager, jeg forstod ikke helt. Kan du prøve igjen?";
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        isBot: true,
      };
      setMessages((prev) => [...prev, botResponse]);
      handleBotResponse(responseText);
    } catch (error) {
      console.error("Chat error:", error);
      const errorText = "Oops! Noe gikk galt. Prøv igjen senere! 📖";
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: errorText,
        isBot: true,
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % proffConfig.tips.length);
  };

  const toggleListening = async () => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      await speech.startListening();
    }
  };

  const toggleAutoSpeak = () => {
    if (speech.isSpeaking) {
      speech.stopSpeaking();
    }
    setAutoSpeak(!autoSpeak);
  };

  // Dynamic styles based on proff
  const headerBgClass = proffConfig.id === 'mat' 
    ? 'bg-orange-500' 
    : 'bg-primary';
  
  const headerTextClass = proffConfig.id === 'mat'
    ? 'text-white'
    : 'text-primary-foreground';

  const tipsBgClass = proffConfig.id === 'mat'
    ? 'bg-orange-50 dark:bg-orange-950/30'
    : 'bg-amber-50 dark:bg-amber-950/30';

  const tipsIconClass = proffConfig.id === 'mat'
    ? 'text-orange-500'
    : 'text-amber-500';

  return (
    <>
      {/* Drag constraints container */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-40"
      />

      {/* Floating mascot button - draggable */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            whileDrag={{ scale: 1.1 }}
            className="fixed bottom-6 right-6 z-50 touch-none"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="relative group cursor-grab active:cursor-grabbing"
            >
              <div className={`absolute -top-2 -right-2 ${proffConfig.id === 'mat' ? 'bg-orange-500' : 'bg-primary'} text-white text-xs px-2 py-1 rounded-full animate-pulse pointer-events-none`}>
                {t("auto.tips")}
              </div>
              <img
                src={proffConfig.mascotImage}
                alt={proffConfig.name}
                className={`w-20 h-20 rounded-full border-4 ${proffConfig.id === 'mat' ? 'border-orange-500' : 'border-primary'} shadow-lg hover:scale-110 transition-transform object-cover bg-white pointer-events-none`}
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window - draggable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            drag
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-background border rounded-2xl shadow-2xl overflow-hidden cursor-default"
          >
            {/* Header - drag handle */}
            <div 
              className={`${headerBgClass} ${headerTextClass} px-3 py-3 flex items-center gap-2 cursor-grab active:cursor-grabbing touch-none`}
              onPointerDown={(e) => dragControls.start(e)}
            >
              <GripVertical className="h-5 w-5 opacity-50 shrink-0" />
              <img
                src={proffConfig.mascotImage}
                alt={proffConfig.name}
                className="w-12 h-12 rounded-full border-2 border-white/30 object-cover bg-white shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold whitespace-nowrap truncate">{proffConfig.name}</h3>
                <p className="text-xs opacity-80 whitespace-nowrap truncate">
                  {speech.isListening ? '🎤 Lytter...' : speech.isSpeaking ? '🔊 Snakker...' : 'Dra for å flytte'}
                </p>
              </div>
              
              {/* Voice controls */}
              {speech.isSupported && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleAutoSpeak}
                    className={`${headerTextClass} hover:bg-white/20 h-8 w-8 shrink-0`}
                    title={autoSpeak ? 'Skru av tale' : 'Skru på tale'}
                  >
                    {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>
              )}
              
              {!showTips && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Vis tips"
                  title="Vis tips"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={showTipsAgain}
                  className={`${headerTextClass} hover:bg-white/20 h-8 w-8 shrink-0`}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className={`${headerTextClass} hover:bg-white/20 h-8 w-8 shrink-0`}
              </Button>
            </div>

            {/* Chat messages */}
            <ScrollArea className={`${isMobile && !showTips ? "h-[380px]" : "h-[300px]"} p-4`} ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        message.isBot
                          ? "bg-muted text-foreground rounded-bl-none"
                          : proffConfig.id === 'mat'
                            ? "bg-orange-500 text-white rounded-br-none"
                            : "bg-primary text-primary-foreground rounded-br-none"
                      }`}
                    >
                      {message.isBot ? <ChatMarkdown content={message.content} /> : message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-2xl rounded-bl-none">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Tips section */}
            {showTips && (
              <div className={`border-t border-b ${tipsBgClass} p-3`}>
                <div className="flex items-start gap-2 min-w-0">
                  <Lightbulb className={`h-5 w-5 ${tipsIconClass} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">{t("auto.dagens_tips")}</p>
                    <p className="text-sm break-words">{proffConfig.tips[currentTip % proffConfig.tips.length]}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextTip}
                    className="shrink-0 text-xs h-7"
                  >
                    {t("auto.neste")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Skjul tips"
                    onClick={dismissTips}
                    className="shrink-0 h-7 w-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 flex gap-2">
              {speech.isSupported && (
                <Button
                  size="icon"
                  variant={speech.isListening ? "destructive" : speech.permissionStatus === 'denied' ? "secondary" : "outline"}
                  onClick={toggleListening}
                  disabled={isLoading}
                  title={
                    speech.permissionStatus === 'denied' 
                      ? 'Mikrofontilgang nektet - klikk for å prøve igjen' 
                      : speech.isListening 
                        ? 'Stopp opptak' 
                        : 'Start taleopptak'
                  }
                  className={speech.permissionStatus === 'denied' ? 'opacity-60' : ''}
                >
                  {speech.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Input
                value={speech.isListening && interimText ? interimText : input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={speech.isListening ? "🎤 Lytter..." : "Skriv eller snakk..."}
                className={`flex-1 ${speech.isListening ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}`}
                disabled={isLoading || speech.isListening}
              />
              <Button 
                size="icon" 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                className={proffConfig.id === 'mat' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
