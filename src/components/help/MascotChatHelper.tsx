import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Send, Sparkles, Lightbulb, Loader2, GripVertical, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { getProffConfig, ProffConfig } from "./proffConfig";
import { useSpeech } from "@/hooks/useSpeech";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
}

export const MascotChatHelper = () => {
  const location = useLocation();
  const [proffConfig, setProffConfig] = useState<ProffConfig>(() => getProffConfig(location.pathname));
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [interimText, setInterimText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingTranscriptRef = useRef<string | null>(null);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Speech hook with auto-send on final result
  const speech = useSpeech({
    lang: 'nb-NO',
    onResult: (transcript) => {
      // Store the final transcript and trigger send
      pendingTranscriptRef.current = transcript;
      setInput(transcript);
      setInterimText("");
    },
    onInterimResult: (transcript) => {
      // Show interim results for visual feedback
      setInterimText(transcript);
    },
  });

  // Update proff config when route changes
  useEffect(() => {
    const newConfig = getProffConfig(location.pathname);
    if (newConfig.id !== proffConfig.id) {
      setProffConfig(newConfig);
      // Reset messages when switching proffs
      setMessages([
        {
          id: "welcome",
          content: newConfig.welcomeMessage,
          isBot: true,
        },
      ]);
    }
  }, [location.pathname, proffConfig.id]);

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          content: proffConfig.welcomeMessage,
          isBot: true,
        },
      ]);
    }
  }, [proffConfig.welcomeMessage, messages.length]);

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
      pendingTranscriptRef.current = null;
      // Small delay to let the user see what was transcribed
      const timer = setTimeout(() => {
        handleSend();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [input]);

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
                Tips!
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
              className={`${headerBgClass} ${headerTextClass} p-4 flex items-center gap-3 cursor-grab active:cursor-grabbing touch-none`}
              onPointerDown={(e) => dragControls.start(e)}
            >
              <GripVertical className="h-5 w-5 opacity-50 shrink-0" />
              <img
                src={proffConfig.mascotImage}
                alt={proffConfig.name}
                className="w-12 h-12 rounded-full border-2 border-white/30 object-cover bg-white"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{proffConfig.name}</h3>
                <p className="text-xs opacity-80">
                  {speech.isListening ? '🎤 Lytter...' : speech.isSpeaking ? '🔊 Snakker...' : 'Dra for å flytte'}
                </p>
              </div>
              
              {/* Voice controls */}
              {speech.isSupported && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleAutoSpeak}
                    className={`${headerTextClass} hover:bg-white/20 h-8 w-8`}
                    title={autoSpeak ? 'Skru av tale' : 'Skru på tale'}
                  >
                    {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className={`${headerTextClass} hover:bg-white/20`}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Chat messages */}
            <ScrollArea className="h-[300px] p-4" ref={scrollRef}>
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
                      {message.content}
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
            <div className={`border-t border-b ${tipsBgClass} p-3`}>
              <div className="flex items-start gap-2">
                <Lightbulb className={`h-5 w-5 ${tipsIconClass} shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Dagens tips:</p>
                  <p className="text-sm">{proffConfig.tips[currentTip]}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextTip}
                  className="shrink-0 text-xs"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Neste
                </Button>
              </div>
            </div>

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
