import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface IkHmsChatSetupProps {
  companyId: string;
  onComplete: () => void;
}

export function IkHmsChatSetup({ companyId, onComplete }: IkHmsChatSetupProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hei! Jeg skal hjelpe deg med å sette opp ditt HMS-system. La oss starte med litt grunnleggende informasjon.\n\nHvilken type virksomhet driver du? (f.eks. tømrerfirma, verksted, kontor, butikk, produksjon)",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ik-hms-chat`;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (response.status === 429) {
        toast.error("For mange forespørsler. Vennligst vent litt og prøv igjen.");
        return;
      }

      if (response.status === 402) {
        toast.error("Kreditter oppbrukt. Kontakt administrator.");
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Failed to start stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantMessage = "";
      let streamDone = false;

      // Add placeholder for assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
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
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
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

      // Check if assistant message contains JSON structure (setup complete)
      if (assistantMessage.includes('"goals"') && assistantMessage.includes('"organization"')) {
        await saveSetupData(assistantMessage);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Noe gikk galt. Vennligst prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSetupData = async (jsonContent: string) => {
    setIsSaving(true);
    try {
      // Extract JSON from potential markdown code blocks
      let jsonStr = jsonContent;
      const jsonMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        // Try to find JSON object directly
        const startIndex = jsonContent.indexOf("{");
        const endIndex = jsonContent.lastIndexOf("}");
        if (startIndex !== -1 && endIndex !== -1) {
          jsonStr = jsonContent.slice(startIndex, endIndex + 1);
        }
      }

      const data = JSON.parse(jsonStr);

      // Save goals
      if (data.goals?.length > 0) {
        for (const goal of data.goals) {
          await supabase.from("company_goals").insert({
            company_id: companyId,
            goal_text: goal,
            is_predefined: true,
          });
        }
      }

      // Save organization
      if (data.organization) {
        await supabase.from("company_organization").upsert({
          company_id: companyId,
          custom_content: data.organization.custom_content,
          is_custom: data.organization.is_custom || false,
        });
      }

      // Save risk assessment
      if (data.risks?.length > 0) {
        await supabase.from("company_risk_assessments").upsert({
          company_id: companyId,
          risks: data.risks,
        });
      }

      // Save action plan
      if (data.actions?.length > 0) {
        await supabase.from("company_action_plans").upsert({
          company_id: companyId,
          actions: data.actions,
        });
      }

      // Save routines - transform AI format to expected format
      if (data.routines?.length > 0) {
        const transformedRoutines = data.routines.map((routine: Record<string, unknown>, index: number) => ({
          id: routine.id || `routine-${index + 1}`,
          routine_number: routine.routine_number || `R${(index + 1).toString().padStart(3, '0')}`,
          routine_name: routine.routine_name || routine.name || 'Ukjent rutine',
          category: routine.category || 'Generelt',
          purpose: routine.purpose || routine.description || '',
          responsibility: routine.responsibility || routine.responsible || '',
          procedure: routine.procedure || '',
          examples: routine.examples || '',
          remember: routine.remember || '',
          is_predefined: false,
        }));
        
        await supabase.from("company_routines").upsert({
          company_id: companyId,
          routines: transformedRoutines,
        });
      }

      // Update module settings to mark setup as completed
      const { data: moduleData } = await supabase
        .from("company_modules")
        .select("*")
        .eq("company_id", companyId)
        .eq("module_type", "IK_HMS")
        .single();

      if (moduleData) {
        await supabase
          .from("company_modules")
          .update({
            settings: {
              ...(moduleData.settings as Record<string, unknown>),
              setupCompletedAt: new Date().toISOString(),
            },
          })
          .eq("id", moduleData.id);
      }

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["company-goals"] });
      queryClient.invalidateQueries({ queryKey: ["company-organization"] });
      queryClient.invalidateQueries({ queryKey: ["company-risk-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["company-action-plans"] });
      queryClient.invalidateQueries({ queryKey: ["company-routines"] });
      queryClient.invalidateQueries({ queryKey: ["company-modules"] });

      toast.success("HMS-oppsett fullført!");
      onComplete();
    } catch (error) {
      console.error("Error saving setup data:", error);
      toast.error("Kunne ikke lagre oppsettdata. Vennligst prøv igjen.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <ScrollArea ref={scrollRef} className="h-[500px] p-6">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            {isSaving && (
              <div className="flex items-center justify-center gap-2 p-4 bg-success/10 rounded-lg">
                <Sparkles className="w-4 h-4 text-success animate-pulse" />
                <p className="text-sm text-success font-medium">Lagrer HMS-systemet ditt...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Skriv ditt svar her..."
          disabled={isLoading || isSaving}
        />
        <Button onClick={handleSend} disabled={isLoading || isSaving || !input.trim()}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {messages.length <= 2 && (
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-medium mb-2">💡 Tips:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Svar så detaljert som mulig for best resultat</li>
            <li>Si fra hvis du er usikker - jeg gir deg forslag!</li>
            <li>Oppsettet tar ca. 5-10 minutter</li>
          </ul>
        </div>
      )}
    </div>
  );
}