import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, Sparkles, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { checkFallbackResponse } from "@/lib/aiSetupFallback";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface IkAlkoholChatSetupProps {
  companyId: string;
  onComplete: () => void;
}

function getDisplayContent(content: string): string {
  let cleaned = content.replace(/\|\|\|JSON_START\|\|\|[\s\S]*?\|\|\|JSON_END\|\|\|/g, '');
  const jsonStartIndex = cleaned.indexOf('|||JSON_START|||');
  if (jsonStartIndex !== -1) cleaned = cleaned.slice(0, jsonStartIndex);
  cleaned = cleaned.replace(/```json[\s\S]*?```/g, '');
  const incompleteCodeBlock = cleaned.indexOf('```json');
  if (incompleteCodeBlock !== -1 && cleaned.indexOf('```', incompleteCodeBlock + 7) === -1) {
    cleaned = cleaned.slice(0, incompleteCodeBlock);
  }
  return cleaned.trim();
}

function extractJsonFromContent(content: string): string | null {
  const markedMatch = content.match(/\|\|\|JSON_START\|\|\|([\s\S]*?)\|\|\|JSON_END\|\|\|/);
  if (markedMatch) return markedMatch[1].trim();
  const codeMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeMatch) return codeMatch[1].trim();
  if (content.includes('"venue_type"') && content.includes('"goals"')) {
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) return content.slice(startIndex, endIndex + 1);
  }
  return null;
}

const CHAT_STATE_KEY = 'ik-alkohol-chat-setup-state';

function getStorageKey(companyId: string): string {
  return `${CHAT_STATE_KEY}-${companyId}`;
}

interface ChatState {
  messages: Message[];
  lastUserMessage?: string;
  wasStreaming?: boolean;
}

function loadChatState(companyId: string): ChatState | null {
  try {
    const stored = sessionStorage.getItem(getStorageKey(companyId));
    if (stored) return JSON.parse(stored);
  } catch (e) { console.error('Failed to load chat state:', e); }
  return null;
}

function saveChatState(companyId: string, state: ChatState) {
  try { sessionStorage.setItem(getStorageKey(companyId), JSON.stringify(state)); }
  catch (e) { console.error('Failed to save chat state:', e); }
}

function clearChatState(companyId: string) {
  try { sessionStorage.removeItem(getStorageKey(companyId)); }
  catch (e) { console.error('Failed to clear chat state:', e); }
}

export function IkAlkoholChatSetup({ companyId, onComplete }: IkAlkoholChatSetupProps) {
  const initialState = loadChatState(companyId);
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Message[]>(
    initialState?.messages ?? [{
      role: "assistant",
      content: "Hei! Jeg er Alkohol-Proffen 👋\n\nJeg skal hjelpe deg å sette opp et komplett internkontrollsystem etter alkoholloven. Det tar bare noen minutter!\n\nHvilken type sted driver dere?\n\n1. Restaurant / Kafé\n2. Pub / Bar\n3. Nattklubb / Dansested\n4. Hotell / Overnattingssted\n5. Arrangement / Festival\n6. Selskapslokale\n7. Dagligvarebutikk (salg)\n8. Nettbutikk (salg)\n\n(Velg 1-8)",
    }]
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wasInterrupted, setWasInterrupted] = useState(initialState?.wasStreaming ?? false);
  const [lastUserMessage, setLastUserMessage] = useState<string | undefined>(initialState?.lastUserMessage);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  // Persist state
  useEffect(() => {
    if (messages.length === 0) return;
    saveChatState(companyId, { messages, lastUserMessage, wasStreaming: isStreamingRef.current });
  }, [messages, lastUserMessage, companyId]);

  // Handle tab switch - save state but DON'T abort stream (let it continue in background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveChatState(companyId, { messages, lastUserMessage, wasStreaming: isStreamingRef.current });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [companyId, messages, lastUserMessage]);

  useEffect(() => {
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // When interrupted, check DB for completed fallback response
  useEffect(() => {
    if (!wasInterrupted || isLoading) return;
    
    const checkForFallback = async () => {
      const fallbackContent = await checkFallbackResponse('ik-alkohol-chat', companyId, messages);
      if (fallbackContent) {
        console.log("Found fallback response in DB, recovering...");
        const displayContent = getDisplayContent(fallbackContent);
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg?.role === 'assistant') {
            newMessages[newMessages.length - 1] = { role: "assistant", content: displayContent };
          } else {
            newMessages.push({ role: "assistant", content: displayContent });
          }
          return newMessages;
        });
        setWasInterrupted(false);
        
        // Check if the fallback contains JSON (setup complete)
        const jsonContent = extractJsonFromContent(fallbackContent);
        if (jsonContent) {
          clearChatState(companyId);
          await saveSetupData(jsonContent);
        }
      }
    };
    
    checkForFallback();
  }, [wasInterrupted, isLoading, companyId]);

  const retryLastMessage = useCallback(() => {
    if (!lastUserMessage) return;
    setWasInterrupted(false);
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastMsg = newMessages[newMessages.length - 1];
      if (lastMsg?.role === 'assistant' && (!lastMsg.content || lastMsg.content.endsWith('...'))) newMessages.pop();
      return newMessages;
    });
    setInput(lastUserMessage);
    setTimeout(() => handleSend(), 0);
  }, [lastUserMessage]);

  const saveSetupData = async (jsonContent: string) => {
    setIsSaving(true);
    try {
      const data = JSON.parse(jsonContent);

      // Save goals
      if (data.goals?.length > 0) {
        for (const goal of data.goals) {
          await supabase.from("ik_alkohol_goals").insert({
            company_id: companyId,
            goal_text: goal.goal_text || goal,
            description: goal.description || null,
            kpi_metric: goal.kpi_metric || null,
            kpi_target: goal.kpi_target || null,
            period: goal.period || 'yearly',
            status: 'on_track',
            actions: goal.actions || [],
            is_predefined: true,
            sort_order: data.goals.indexOf(goal),
          });
        }
      }

      // Save risks
      if (data.risks?.length > 0) {
        for (const risk of data.risks) {
          await supabase.from("ik_alkohol_risks").insert({
            company_id: companyId,
            risk_area: risk.risk_area || 'annet',
            risk_description: risk.risk_description || '',
            probability: risk.probability || 3,
            consequence: risk.consequence || 3,
            penalty_points: risk.penalty_points || null,
            risk_level: getRiskLevel(risk.probability || 3, risk.consequence || 3),
            existing_controls: risk.existing_controls || null,
            planned_measures: risk.planned_measures || [],
            measure_status: 'planlagt',
            is_risk_period: risk.is_risk_period || false,
            risk_period_days: risk.risk_period_days || [],
            risk_period_times: risk.risk_period_times || null,
          });
        }
      }

      // Save routines
      if (data.routines?.length > 0) {
        for (const [index, routine] of data.routines.entries()) {
          await supabase.from("ik_alkohol_routines").insert({
            company_id: companyId,
            category: routine.category || 'dokumentasjon',
            venue_type: routine.venue_type || data.venue_type || null,
            routine_name: routine.routine_name || routine.name || 'Ukjent rutine',
            description: routine.description || null,
            content: routine.content || routine.procedure || '',
            is_mandatory: false,
            is_active: true,
            sort_order: index,
          });
        }
      }

      // Save compliance controls
      if (data.compliance_controls?.length > 0) {
        for (const control of data.compliance_controls) {
          // Find matching compliance item
          const { data: items } = await supabase
            .from("ik_alkohol_compliance_items")
            .select("id")
            .eq("company_id", companyId)
            .eq("rule_reference", control.rule_reference)
            .limit(1);
          
          if (items?.[0]) {
            await supabase.from("ik_alkohol_risk_controls").upsert({
              company_id: companyId,
              compliance_item_id: items[0].id,
              challenges: control.challenges || null,
              preventive_measures: control.preventive_measures || null,
              responsible_role: control.responsible_role || null,
              status: 'Aktiv',
            });
          }
        }
      }

      // Save organization roles
      if (data.organization?.roles?.length > 0) {
        for (const role of data.organization.roles) {
          await supabase.from("ik_alkohol_organization").insert({
            company_id: companyId,
            role_type: role.role_type || 'styrer',
            employee_name: role.name || role.employee_name || 'Ikke angitt',
            responsibilities: role.responsibilities || [],
            is_active: true,
          } as any);
        }
      }

      // Mark setup as completed in module settings
      const { data: existingModule } = await supabase
        .from("company_modules")
        .select("id, settings")
        .eq("company_id", companyId)
        .eq("module_type", "IK_ALKOHOL")
        .maybeSingle();

      if (existingModule) {
        await supabase.from("company_modules").update({
          settings: {
            ...(existingModule.settings as Record<string, unknown>),
            setupCompletedAt: new Date().toISOString(),
            venueType: data.venue_type || null,
          },
          is_active: true,
        }).eq("id", existingModule.id);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-goals"] });
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-risks"] });
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-routines"] });
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol"] });
      queryClient.invalidateQueries({ queryKey: ["company-modules"] });

      toast.success("IK-Alkohol oppsett fullført!");
      clearChatState(companyId);
      onComplete();
    } catch (error) {
      console.error("Error saving setup data:", error);
      toast.error("Kunne ikke lagre oppsettet. Prøv igjen.");
    } finally {
      setIsSaving(false);
    }
  };

  function getRiskLevel(probability: number, consequence: number): string {
    const score = probability * consequence;
    if (score >= 15) return 'Svært høy';
    if (score >= 10) return 'Høy';
    if (score >= 5) return 'Middels';
    return 'Lav';
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    const userMessage: Message = { role: "user", content: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLastUserMessage(userInput);
    setWasInterrupted(false);
    isStreamingRef.current = false;

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ik-alkohol-chat`;
      const { data: { session } } = await supabase.auth.getSession();
      abortControllerRef.current = new AbortController();

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 429) { toast.error("For mange forespørsler."); setIsLoading(false); return; }
      if (response.status === 402) { toast.error("Kreditter oppbrukt."); setIsLoading(false); return; }
      if (!response.ok || !response.body) throw new Error("Failed to start stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantMessage = "";
      let streamDone = false;

      isStreamingRef.current = true;
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
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              const displayContent = getDisplayContent(assistantMessage);
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: "assistant", content: displayContent };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      isStreamingRef.current = false;
      setWasInterrupted(false);

      const jsonContent = extractJsonFromContent(assistantMessage);
      if (jsonContent) {
        console.log("JSON found, saving IK-Alkohol setup...");
        clearChatState(companyId);
        await saveSetupData(jsonContent);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setWasInterrupted(true);
      } else {
        console.error("Error:", error);
        toast.error("Noe gikk galt. Prøv igjen.");
      }
    } finally {
      setIsLoading(false);
      isStreamingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[600px] sm:h-[700px]">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-amber-600" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}>
                {message.content || (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Tenker...</span>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}

          {wasInterrupted && lastUserMessage && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={retryLastMessage} className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Fortsett der vi slapp
              </Button>
            </div>
          )}

          {isSaving && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Lagrer internkontrollsystem...</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">Mål, risikoer, rutiner og organisering settes opp.</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv her..."
            disabled={isLoading || isSaving}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading || isSaving} size="icon">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
