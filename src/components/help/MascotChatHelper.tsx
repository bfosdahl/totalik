import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Send, Sparkles, Lightbulb, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import mascotImage from "@/assets/mascot-helper.png";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
}

const tips = [
  "Visste du at jeg kan hjelpe deg å sette opp HMS-systemet automatisk basert på din bransje? ✨",
  "Tips: Røde risikoer krever obligatorisk revurdering etter at tiltak er iverksatt. 🔴",
  "Du kan laste opp sikkerhetsdatablader i Stoffkartoteket, så fyller systemet ut informasjonen automatisk! 📄",
  "HMS-håndboken oppdateres automatisk når du gjør endringer i systemet. 📚",
  "Bruk avvikssystemet til å rapportere både kvalitetsavvik og uønskede hendelser (RUH). ⚠️",
  "Ansatte kan stemple inn og ut med QR-kode i timeregistreringssystemet. ⏰",
  "Vernerunder bør gjennomføres jevnlig - systemet hjelper deg å dokumentere funnene. 🔍",
  "Du kan eksportere timelister til Excel for lønnskjøring. 📊",
];

export const MascotChatHelper = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          content: "Hei! 👋 Jeg er HMS Proffen. Spør meg om hva som helst om systemet, så skal jeg prøve å hjelpe deg!",
          isBot: true,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

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

      const { data, error } = await supabase.functions.invoke("mascot-chat", {
        body: { message: userInput, history }
      });

      if (error) throw error;

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data?.reply || "Beklager, jeg forstod ikke helt. Kan du prøve igjen?",
        isBot: true,
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Oops! Noe gikk galt. Sjekk brukerveiledningen over for svar! 📖",
        isBot: true,
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % tips.length);
  };

  return (
    <>
      {/* Drag constraints container - covers the full viewport */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-40"
      />

      {/* Floating mascot button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="relative group"
            >
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full animate-pulse">
                Tips!
              </div>
              <img
                src={mascotImage}
                alt="HMS Proffen"
                className="w-20 h-20 rounded-full border-4 border-primary shadow-lg hover:scale-110 transition-transform cursor-pointer object-cover bg-white"
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
              className="bg-primary text-primary-foreground p-4 flex items-center gap-3 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <GripVertical className="h-5 w-5 opacity-50 shrink-0" />
              <img
                src={mascotImage}
                alt="HMS Proffen"
                className="w-12 h-12 rounded-full border-2 border-white/30 object-cover bg-white"
              />
              <div className="flex-1">
                <h3 className="font-semibold">HMS Proffen</h3>
                <p className="text-xs opacity-80">Dra for å flytte</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-white/20"
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
                          : "bg-primary text-primary-foreground rounded-br-none"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Tips section */}
            <div className="border-t border-b bg-amber-50 dark:bg-amber-950/30 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Dagens tips:</p>
                  <p className="text-sm">{tips[currentTip]}</p>
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
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Skriv et spørsmål..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
