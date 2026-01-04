import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import mascotImage from "@/assets/mascot-helper.png";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
}

const tips = [
  "Visste du at du kan bruke Oppsett-hjelperen for å sette opp HMS-systemet automatisk basert på din bransje?",
  "Tips: Røde risikoer krever obligatorisk revurdering etter at tiltak er iverksatt.",
  "Du kan laste opp sikkerhetsdatablader i Stoffkartoteket, så fyller systemet ut informasjonen automatisk!",
  "HMS-håndboken oppdateres automatisk når du gjør endringer i systemet.",
  "Bruk avvikssystemet til å rapportere både kvalitetsavvik og uønskede hendelser (RUH).",
  "Ansatte kan stemple inn og ut med QR-kode i timeregistreringssystemet.",
  "Vernerunder bør gjennomføres jevnlig - systemet hjelper deg å dokumentere funnene.",
  "Du kan eksportere timelister til Excel for lønnskjøring.",
];

const quickAnswers: Record<string, string> = {
  "oppsett": "For å sette opp HMS-systemet, gå til Oppsett-siden og bruk enten den manuelle veiviseren eller klikk på 'Oppsett-hjelperen' for AI-assistert oppsett basert på din bransje.",
  "risikovurdering": "Risikovurdering gjøres ved å identifisere farekilder, vurdere sannsynlighet og konsekvens (1-5), og planlegge tiltak. Gå til Risikoanalyse i menyen for å komme i gang.",
  "avvik": "For å registrere avvik, gå til Avvik-siden og klikk 'Nytt avvik'. Velg mellom Avvik (kvalitet) eller RUH (uønsket hendelse).",
  "handbok": "HMS-håndboken genereres automatisk basert på informasjonen du har lagt inn. Gå til Handbok-siden for å se og laste ned PDF.",
  "ansatte": "Administrer ansatte under Ansattoversikt. Der kan du legge til kurs, HMS-kort og dokumenter per ansatt.",
  "timer": "Timeregistrering finner du under Mine timer. Du kan registrere manuelt eller bruke stemplingsuret.",
  "stoffkartotek": "I Stoffkartoteket registrerer du kjemikalier. Last opp sikkerhetsdatablader så fyller systemet ut informasjonen automatisk.",
  "vernerunde": "Vernerunder planlegges og gjennomføres under HMS aktiviteter. Bruk sjekklisten for systematisk gjennomgang.",
};

export const MascotChatHelper = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentTip, setCurrentTip] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          content: "Hei! 👋 Jeg er din HMS-hjelper. Spør meg om hva som helst, eller se på tipsene under!",
          isBot: true,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const findAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    for (const [keyword, answer] of Object.entries(quickAnswers)) {
      if (lowerQuestion.includes(keyword)) {
        return answer;
      }
    }
    
    if (lowerQuestion.includes("hjelp") || lowerQuestion.includes("hvordan")) {
      return "Jeg kan hjelpe deg med oppsett, risikovurdering, avvik, håndbok, ansatte, timer, stoffkartotek og vernerunder. Hva lurer du på?";
    }
    
    return "Beklager, jeg forstår ikke helt spørsmålet. Prøv å spørre om oppsett, risikovurdering, avvik, håndbok, ansatte, timer, stoffkartotek eller vernerunder. Du kan også lese mer i veiledningen over!";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isBot: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: findAnswer(input),
        isBot: true,
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 500);
  };

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % tips.length);
  };

  return (
    <>
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
                alt="HMS-hjelper"
                className="w-20 h-20 rounded-full border-4 border-primary shadow-lg hover:scale-110 transition-transform cursor-pointer object-cover bg-white"
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-background border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
              <img
                src={mascotImage}
                alt="HMS-hjelper"
                className="w-12 h-12 rounded-full border-2 border-white/30 object-cover bg-white"
              />
              <div className="flex-1">
                <h3 className="font-semibold">HMS-hjelperen</h3>
                <p className="text-xs opacity-80">Alltid klar til å hjelpe!</p>
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
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
