import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface IkMatChatSetupProps {
  companyId: string;
  onComplete: () => void;
}

// Helper to strip JSON from display content
function getDisplayContent(content: string): string {
  // Remove JSON blocks marked with our special markers
  let cleaned = content.replace(/\|\|\|JSON_START\|\|\|[\s\S]*?\|\|\|JSON_END\|\|\|/g, '');
  
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
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hei! Jeg skal hjelpe deg med å sette opp et komplett IK-MAT system tilpasset din virksomhet. La oss starte med noen spørsmål.\n\nHva slags type matvirksomhet driver dere? (For eksempel: restaurant, kafé, catering, bakeri, butikk, barnehage, produksjon, etc.)' 
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ik-mat-chat`;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveGeneratedContent = async (jsonContent: string) => {
    setIsSaving(true);
    try {
      const content = JSON.parse(jsonContent);
      console.log("Saving IK-MAT generated content:", content);

      // NOTE: IK-MAT stores ALL its data in company_modules.settings.generatedContent
      // It does NOT use company_goals, company_risk_assessments, or company_routines
      // Those tables are reserved for IK-HMS to avoid data conflicts between modules

      // Save all content in company_modules settings
      const { error: moduleError } = await supabase
        .from('company_modules')
        .update({
          settings: {
            generatedContent: content,
            setupCompletedAt: new Date().toISOString(),
          }
        })
        .eq('company_id', companyId)
        .eq('module_type', 'IK_MAT');

      if (moduleError) {
        console.error("Error updating module settings:", moduleError);
        throw moduleError;
      }

      toast.success("IK-MAT oppsett fullført!");
      onComplete();
    } catch (error) {
      console.error("Error saving generated content:", error);
      toast.error("Kunne ikke lagre innholdet. Prøv igjen.");
    } finally {
      setIsSaving(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputValue.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
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

      // Check if the message contains JSON (setup complete)
      const jsonContent = extractJsonFromContent(assistantMessage);
      if (jsonContent) {
        console.log("JSON found in IK-MAT response, saving setup data...");
        await saveGeneratedContent(jsonContent);
      } else {
        // Log for debugging if we expected JSON but didn't find it
        if (assistantMessage.includes("Supert") && assistantMessage.includes("IK-MAT")) {
          console.warn("Expected JSON in final IK-MAT message but none found. Full message:", assistantMessage);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Noe gikk galt. Vennligst prøv igjen.");
    } finally {
      setIsLoading(false);
    }
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
          La AI-assistenten hjelpe deg med å sette opp et komplett matsikkerhetssystem tilpasset din virksomhet.
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
                <p className="text-xs sm:text-sm text-success font-medium">Setter opp IK-MAT systemet ditt...</p>
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
              placeholder="Skriv ditt svar her..."
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
