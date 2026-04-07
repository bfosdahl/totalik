import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Bot, User, Sparkles, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewKsModule2ProjectInput } from "@/hooks/useKsModule2Projects";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Ks2ProjectSetupChatProps {
  onComplete: (data: Partial<NewKsModule2ProjectInput> & { 
    recommended_checklists?: any[]; 
    recommended_routines?: any[];
    hms_focus?: any[];
    milestones?: any[];
  }) => void;
  onCancel: () => void;
}

const INITIAL_MESSAGE = `Hei! Jeg er Prosjekt-hjelperen 👋

Jeg hjelper deg å sette opp prosjektet med riktige sjekklister, rutiner og HMS-fokusområder.

**Hva slags prosjekt skal du i gang med?**
- Nybygg (enebolig, leilighetsbygg)
- Totalrenovering
- Tilbygg/påbygg
- Fagentreprise (tømrer, betong, rør, elektro)

Eller bare si "sett opp et forslag" så lager jeg et eksempel du kan tilpasse! 🔨`;

function getDisplayContent(content: string): string {
  return content
    .replace(/\|\|\|JSON_START\|\|\|[\s\S]*?\|\|\|JSON_END\|\|\|/g, "")
    .trim();
}

function extractJsonFromContent(content: string): string | null {
  const jsonMatch = content.match(/\|\|\|JSON_START\|\|\|([\s\S]*?)\|\|\|JSON_END\|\|\|/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].trim();
  }
  return null;
}

export function Ks2ProjectSetupChat({ onComplete, onCancel }: Ks2ProjectSetupChatProps) {
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
      if (!session) {
        throw new Error("Ikke logget inn");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ks-project-chat`,
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
        const errorData = await response.json();
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
            const json = JSON.parse(jsonStr);
            const content = json.choices?.[0]?.delta?.content;
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
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Check for JSON in response
      const jsonContent = extractJsonFromContent(fullContent);
      if (jsonContent) {
        try {
          const parsed = JSON.parse(jsonContent);
          console.log("Parsed project data:", parsed);
          setSetupComplete(true);
          
          // Map to project input format
          const projectData: Partial<NewKsModule2ProjectInput> & {
            recommended_checklists?: any[];
            recommended_routines?: any[];
            hms_focus?: any[];
            milestones?: any[];
          } = {
            project_name: parsed.project_info?.project_name || "",
            description: parsed.project_info?.description || "",
            address: parsed.project_info?.address || "",
            client_name: parsed.project_info?.client_name || "",
            contractor_type: parsed.contractor_type || undefined,
            recommended_checklists: parsed.recommended_checklists || [],
            recommended_routines: parsed.recommended_routines || [],
            hms_focus: parsed.hms_focus || [],
            milestones: parsed.milestones || []
          };

          // Show completion message and pass data
          setTimeout(() => {
            onComplete(projectData);
          }, 1000);
        } catch (e) {
          console.error("Error parsing JSON:", e, jsonContent);
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Beklager, det oppsto en feil. Prøv igjen." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Chat Header */}
      <div className="flex items-center gap-2 pb-4 border-b">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium">Prosjekt-hjelperen</h3>
          <p className="text-xs text-muted-foreground">AI-assistent for prosjektoppsett</p>
        </div>
        {setupComplete && (
          <div className="ml-auto flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Forslag klart!</span>
          </div>
        )}
      </div>

      {/* Messages */}
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
                  <div className="text-sm whitespace-pre-wrap">{displayContent}</div>
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

      {/* Input */}
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

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Avbryt
          </Button>
          <Button
            variant="ghost"
            onClick={() => setInput("Sett opp et forslag for et typisk byggeprosjekt")}
            disabled={isLoading || setupComplete}
            className="text-primary"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Lag et forslag for meg
          </Button>
        </div>
      </div>
    </div>
  );
}
