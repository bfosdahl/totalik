import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, Send, User, Sparkles, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface KsSetupResult {
  company_type: string;
  company_type_label: string;
  selected_checklists: {
    name: string;
    category: string;
    description: string;
    checkpoints: string[];
  }[];
  selected_routines: {
    name: string;
    category: string;
    description: string;
  }[];
  quality_goals: {
    goal_text: string;
    description: string;
  }[];
  organization: {
    ks_responsible: string;
    description: string;
  };
}

interface KsSetupChatProps {
  companyId: string;
  onComplete: (result: KsSetupResult) => void;
}

const INITIAL_MESSAGE = `Hei! Jeg er KS Oppsett-hjelperen 👋

Jeg hjelper deg å tilpasse kvalitetssikringssystemet for din bedrift.

**Hva slags type bedrift driver dere?**
- Totalentreprenør
- Hovedentreprenør
- Tømrer/snekker
- Maler
- Rørlegger
- Elektriker
- Betongarbeider
- Annet

Bare skriv hva dere jobber med! 🔨`;

function getDisplayContent(content: string): string {
  return content
    .replace(/\|\|\|JSON_START\|\|\|[\s\S]*?\|\|\|JSON_END\|\|\|/g, "")
    .trim();
}

function extractJsonFromContent(content: string): string | null {
  const jsonMatch = content.match(/\|\|\|JSON_START\|\|\|([\s\S]*?)\|\|\|JSON_END\|\|\|/);
  return jsonMatch?.[1]?.trim() || null;
}

export function KsSetupChat({ companyId, onComplete }: KsSetupChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: INITIAL_MESSAGE }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Ikke logget inn");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ks-setup-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: userMessage }].map(m => ({
              role: m.role,
              content: m.content
            }))
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Feil ved kommunikasjon med AI");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullContent = "";
      let textBuffer = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: fullContent
                };
                return newMessages;
              });
            }
          } catch {
            // partial JSON, put back
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Check for JSON result
      const jsonContent = extractJsonFromContent(fullContent);
      if (jsonContent) {
        try {
          const parsed = JSON.parse(jsonContent) as KsSetupResult;
          console.log("KS setup data:", parsed);
          setSetupComplete(true);
          setTimeout(() => onComplete(parsed), 1000);
        } catch (e) {
          console.error("Error parsing KS setup JSON:", e);
        }
      }
    } catch (error) {
      console.error("KS setup chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Beklager, det oppsto en feil. Prøv igjen."
      }]);
      toast.error("Feil ved kommunikasjon med AI");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-2 pb-4 border-b">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium">KS Oppsett-hjelperen</h3>
          <p className="text-xs text-muted-foreground">AI-assistent for KS-system tilpasning</p>
        </div>
        {setupComplete && (
          <div className="ml-auto flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Oppsett klart!</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 py-4" ref={scrollRef}>
        <div className="space-y-4 pr-4">
          {messages.map((msg, i) => {
            const displayContent = getDisplayContent(msg.content);
            if (!displayContent) return null;

            return (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <Card className={`p-3 max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50"
                }`}>
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{displayContent}</ReactMarkdown>
                  </div>
                </Card>
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <Card className="p-3 bg-muted/50">
                <Loader2 className="w-4 h-4 animate-spin" />
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="pt-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv her..."
            disabled={isLoading || setupComplete}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim() || setupComplete}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
