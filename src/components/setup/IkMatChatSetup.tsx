import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, Sparkles, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSafeModuleSettings } from "@/lib/moduleDefaults";
import { checkFallbackResponse } from "@/lib/aiSetupFallback";
import { t } from "@/i18n/t";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface IkMatChatSetupProps {
  companyId: string;
  onComplete: () => void;
}

// Session storage key for persisting chat state
const CHAT_STATE_KEY = 'ik-mat-chat-setup-state';

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
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load chat state:', e);
  }
  return null;
}

function saveChatState(companyId: string, state: ChatState) {
  try {
    sessionStorage.setItem(getStorageKey(companyId), JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save chat state:', e);
  }
}

function clearChatState(companyId: string) {
  try {
    sessionStorage.removeItem(getStorageKey(companyId));
  } catch (e) {
    console.error('Failed to clear chat state:', e);
  }
}

// Helper to strip JSON from display content
function getDisplayContent(content: string): string {
  // Remove JSON blocks marked with our special markers
  let cleaned = content.replace(/\|\|\|JSON_START\|\|\|[\s\S]*?\|\|\|JSON_END\|\|\|/g, '');
  const jsonStartIndex = cleaned.indexOf('|||JSON_START|||');
  if (jsonStartIndex !== -1) cleaned = cleaned.slice(0, jsonStartIndex);
  
  // Also remove any raw JSON that might slip through
  cleaned = cleaned.replace(/```json[\s\S]*?```/g, '');
  
  // Remove standalone JSON objects that look like our data structure
  if (cleaned.includes('"goals"') && cleaned.includes('"haccp"') && cleaned.includes('"routines"')) {
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.slice(0, jsonStart) + cleaned.slice(jsonEnd + 1);
    }
  }
  
  return cleaned.trim();
}

// Helper to extract JSON from content
function extractJsonFromContent(content: string): string | null {
  // First try our marked format
  const markedMatch = content.match(/\|\|\|JSON_START\|\|\|([\s\S]*?)\|\|\|JSON_END\|\|\|/);
  if (markedMatch) {
    return markedMatch[1].trim();
  }
  
  // Try markdown code blocks
  const codeMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeMatch) {
    return codeMatch[1].trim();
  }
  
  // Try finding raw JSON with IK-MAT specific keys
  if (content.includes('"goals"') && content.includes('"haccp"')) {
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      return content.slice(startIndex, endIndex + 1);
    }
  }
  
  return null;
}

export const IkMatChatSetup = ({ companyId, onComplete }: IkMatChatSetupProps) => {
  const initialState = loadChatState(companyId);
  
  const [messages, setMessages] = useState<Message[]>(
    initialState?.messages ?? [
      { 
        role: 'assistant', 
        content: 'Hei! Jeg skal hjelpe deg med å sette opp et komplett IK-MAT system tilpasset din virksomhet. La oss starte med noen spørsmål.\n\nHva slags type matvirksomhet driver dere? (For eksempel: restaurant, kafé, catering, bakeri, butikk, barnehage, produksjon, etc.)' 
      }
    ]
  );
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wasInterrupted, setWasInterrupted] = useState(initialState?.wasStreaming ?? false);
  const [streamCutOff, setStreamCutOff] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string | undefined>(initialState?.lastUserMessage);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ik-mat-chat`;

  // Persist chat state to sessionStorage whenever relevant state changes
  useEffect(() => {
    if (messages.length === 0) return;
    
    saveChatState(companyId, {
      messages,
      lastUserMessage,
      wasStreaming: isStreamingRef.current,
    });
  }, [messages, lastUserMessage, companyId]);

  // Handle visibility change (tab switching) - save state but DON'T abort stream
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Save state when user switches away, but let stream continue in background
        saveChatState(companyId, {
          messages,
          lastUserMessage,
          wasStreaming: isStreamingRef.current,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [companyId, messages, lastUserMessage]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveGeneratedContent = async (jsonContent: string) => {
    setIsSaving(true);
    try {
      const content = JSON.parse(jsonContent);

      // NOTE: IK-MAT stores ALL its data in company_modules.settings.generatedContent
      // It does NOT use company_goals, company_risk_assessments, or company_routines
      // Those tables are reserved for IK-HMS to avoid data conflicts between modules

      const { data: existingModule, error: existingError } = await supabase
        .from('company_modules')
        .select('settings')
        .eq('company_id', companyId)
        .eq('module_type', 'IK_MAT')
        .maybeSingle();

      if (existingError) {
        console.error("Error fetching existing module settings:", existingError);
        throw existingError;
      }

      const existingSettings = (existingModule?.settings && typeof existingModule.settings === 'object' && !Array.isArray(existingModule.settings)) 
        ? existingModule.settings as Record<string, any>
        : {};
      const safe = getSafeModuleSettings('IK_MAT', existingSettings);

      // Save all content in company_modules settings
      const { error: moduleError } = await supabase
        .from('company_modules')
        .update({
          settings: {
            ...safe,
            generatedContent: content,
            setupCompletedAt: new Date().toISOString(),
          },
        })
        .eq('company_id', companyId)
        .eq('module_type', 'IK_MAT');

      if (moduleError) {
        console.error("Error updating module settings:", moduleError);
        throw moduleError;
      }

      // Sync kjøler/fryser from generatedContent into ik_mat_temperature_equipment
      try {
        const lokaler = (content.lokaler_og_utstyr || {}) as Record<string, any>;
        type EquipmentItem = { name: string; location: string | null; equipment_type: 'fridge' | 'freezer' };
        const newItems: EquipmentItem[] = [];

        const collect = (list: unknown, equipment_type: 'fridge' | 'freezer') => {
          if (!Array.isArray(list)) return;
          for (const raw of list) {
            let name = '';
            let location: string | null = null;
            if (typeof raw === 'string') {
              name = raw.trim();
            } else if (raw && typeof raw === 'object') {
              const obj = raw as Record<string, any>;
              name = String(obj.navn || obj.name || '').trim();
              const loc = obj.lokasjon || obj.location || obj.plassering;
              location = loc != null && String(loc).trim() !== '' ? String(loc) : null;
            }
            if (name) newItems.push({ name, location, equipment_type });
          }
        };
        collect(lokaler.kjolere, 'fridge');
        collect(lokaler.frysere, 'freezer');

        if (newItems.length > 0) {
          const { data: existingEquipment, error: equipmentFetchError } = await supabase
            .from('ik_mat_temperature_equipment')
            .select('name, sort_order')
            .eq('company_id', companyId);
          if (equipmentFetchError) throw equipmentFetchError;
          const existingNames = new Set(
            (existingEquipment || []).map((e: { name: string }) => e.name.trim().toLowerCase())
          );
          const seen = new Set<string>();
          const toInsert = newItems.filter((item) => {
            const key = item.name.toLowerCase();
            if (existingNames.has(key) || seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          if (toInsert.length > 0) {
            const maxSortOrder = (existingEquipment || []).reduce(
              (max: number, e: { sort_order: number | null }) =>
                e.sort_order != null && e.sort_order > max ? e.sort_order : max,
              0
            );
            const { error: equipmentInsertError } = await supabase.from('ik_mat_temperature_equipment').insert(
              toInsert.map((item, i) => ({
                company_id: companyId,
                name: item.name,
                location: item.location,
                equipment_type: item.equipment_type,
                min_temp: item.equipment_type === 'fridge' ? 0 : -24,
                max_temp: item.equipment_type === 'fridge' ? 4 : -18,
                measurement_frequency: 'daily',
                is_active: true,
                sort_order: maxSortOrder + i + 1,
              }))
            );
            if (equipmentInsertError) throw equipmentInsertError;
          }
        }
      } catch (equipmentError) {
        console.error("Error syncing temperature equipment from setup:", equipmentError);
      }

      toast.success(t("auto.ik_mat_oppsett_fullfoert"));
      onComplete();
    } catch (error) {
      console.error("Error saving generated content:", error);
      toast.error(t("auto.kunne_ikke_lagre_innholdet_proev_igjen"));
    } finally {
      setIsSaving(false);
    }
  };

  // When interrupted, check DB for completed fallback response
  useEffect(() => {
    if (!wasInterrupted || isLoading) return;
    
    const checkForFallback = async () => {
      const fallbackContent = await checkFallbackResponse('ik-mat-chat', companyId, messages);
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
        
        const jsonContent = extractJsonFromContent(fallbackContent);
        if (jsonContent) {
          clearChatState(companyId);
          await saveGeneratedContent(jsonContent);
        }
      }
    };
    
    checkForFallback();
  }, [wasInterrupted, isLoading, companyId]);

  const retryLastMessage = useCallback(async () => {
    if (!lastUserMessage) return;
    
    setWasInterrupted(false);
    
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastMsg = newMessages[newMessages.length - 1];
      if (lastMsg?.role === 'assistant' && (lastMsg.content === '' || lastMsg.content.endsWith('...'))) {
        newMessages.pop();
      }
      return newMessages;
    });
    
    await sendMessageInternal(lastUserMessage);
  }, [lastUserMessage]);

  const sendMessageInternal = async (messageText: string) => {
    const userMessageObj: Message = { role: 'user', content: messageText };
    
    // Check if this message is already in messages (retry scenario)
    const messageExists = messages.some(m => m.role === 'user' && m.content === messageText);
    
    if (!messageExists) {
      setMessages((prev) => [...prev, userMessageObj]);
    }
    
    setLastUserMessage(messageText);
    setIsLoading(true);
    isStreamingRef.current = true;
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const currentMessages = messageExists 
        ? messages 
        : [...messages, userMessageObj];
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: currentMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 429) {
        toast.error(t("auto.for_mange_forespoersler_vennligst_vent_l"));
        setIsLoading(false);
        isStreamingRef.current = false;
        return;
      }

      if (response.status === 402) {
        toast.error(t("auto.kreditter_oppbrukt_kontakt_administrator"));
        setIsLoading(false);
        isStreamingRef.current = false;
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Failed to start stream");
      }

      setStreamCutOff(false);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantMessage = "";
      let streamDone = false;
      let lastFinishReason: string | null = null;

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
            const finishReason = parsed.choices?.[0]?.finish_reason as string | null | undefined;
            if (finishReason) lastFinishReason = finishReason;
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              // Show only the display content (without JSON)
              const displayContent = getDisplayContent(assistantMessage);
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: displayContent,
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

      // Stream completed successfully - clear the wasStreaming flag
      isStreamingRef.current = false;
      setWasInterrupted(false);
      if (!streamDone || (lastFinishReason && lastFinishReason.toLowerCase() !== 'stop')) {
        setStreamCutOff(true);
      }
      
      // Update storage to reflect completed state
      saveChatState(companyId, {
        messages: messages,
        lastUserMessage,
        wasStreaming: false,
      });

      // Check if the message contains JSON (setup complete)
      const jsonContent = extractJsonFromContent(assistantMessage);
      if (jsonContent) {
        clearChatState(companyId); // Clear state on successful completion
        await saveGeneratedContent(jsonContent);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted (e.g., component unmounted or tab switch)
        console.log('Request aborted');
        setWasInterrupted(true);
      } else {
        console.error("Error:", error);
        toast.error(t("auto.noe_gikk_galt_vennligst_proev_igjen"));
      }
    } finally {
      setIsLoading(false);
      isStreamingRef.current = false;
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const messageText = inputValue.trim();
    setInputValue("");
    setWasInterrupted(false);
    await sendMessageInternal(messageText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[calc(100vh-200px)] min-h-[400px] max-h-[700px] flex flex-col">
      <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
          IK-MAT Assistent
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t("auto.la_ai_assistenten_hjelpe_deg_med_aa_sett")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 sm:gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 py-2 sm:px-4 whitespace-pre-wrap text-xs sm:text-sm break-words ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-2 sm:gap-3 justify-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2 sm:px-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            {isSaving && (
              <div className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-success/10 rounded-lg border border-success/20">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-success animate-pulse" />
                <p className="text-xs sm:text-sm text-success font-medium">{t("auto.setter_opp_ik_mat_systemet_ditt")}</p>
              </div>
            )}
            {wasInterrupted && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 font-medium text-center">
                  {t("auto.det_ser_ut_som_svaret_ble_avbrutt_vil_du")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryLastMessage}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  {t("auto.proev_igjen")}
                </Button>
              </div>
            )}
            {streamCutOff && !isLoading && (
              <div className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 font-medium text-center">
                  {t("auto.svaret_ble_avbrutt_skriv_fortsett")}
                </p>
              </div>
            )}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="p-3 sm:p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("auto.skriv_ditt_svar_her")}
              disabled={isLoading || isSaving}
              className="flex-1 text-base sm:text-sm"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading || isSaving}
              size="icon"
              className="h-10 w-10"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
