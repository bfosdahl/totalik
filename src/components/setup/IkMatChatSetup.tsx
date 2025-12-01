import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface IkMatChatSetupProps {
  companyId: string;
  onComplete: () => void;
}

export const IkMatChatSetup = ({ companyId, onComplete }: IkMatChatSetupProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hei! Jeg skal hjelpe deg med å sette opp et komplett IK-MAT system tilpasset din virksomhet. La oss starte med noen spørsmål.\n\nHva slags type matvirksomhet driver dere? (For eksempel: restaurant, kafé, catering, bakeri, butikk, barnehage, produksjon, etc.)' 
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ik-mat-chat`;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveGeneratedContent = async (content: any) => {
    setIsSaving(true);
    try {
      console.log("Saving generated content:", content);

      // Save goals if present
      if (content.goals && content.goals.length > 0) {
        const goalsToInsert = content.goals.map((goal: string, index: number) => ({
          company_id: companyId,
          goal_text: goal,
          is_predefined: false,
          sort_order: index,
        }));

        const { error: goalsError } = await supabase
          .from('company_goals')
          .insert(goalsToInsert);

        if (goalsError && goalsError.code !== '23505') {
          console.error("Error saving goals:", goalsError);
        }
      }

      // Save risk assessment if present
      if (content.risks && content.risks.length > 0) {
        const { error: risksError } = await supabase
          .from('company_risk_assessments')
          .upsert({
            company_id: companyId,
            risks: content.risks,
          }, {
            onConflict: 'company_id'
          });

        if (risksError) {
          console.error("Error saving risks:", risksError);
        }
      }

      // Save routines if present
      if (content.routines && content.routines.length > 0) {
        const { error: routinesError } = await supabase
          .from('company_routines')
          .upsert({
            company_id: companyId,
            routines: content.routines,
          }, {
            onConflict: 'company_id'
          });

        if (routinesError) {
          console.error("Error saving routines:", routinesError);
        }
      }

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

      toast({
        title: "Suksess!",
        description: "IK-MAT innhold er generert og lagret. Du kan nå begynne å bruke systemet.",
      });

      onComplete();
    } catch (error) {
      console.error("Error saving generated content:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke lagre innholdet. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const parseJsonFromResponse = (text: string): any | null => {
    try {
      // Try to parse as direct JSON
      return JSON.parse(text);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch {
          return null;
        }
      }
      // Try to find JSON object in text
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      const updateAssistantMessage = (chunk: string) => {
        assistantMessage += chunk;
        setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);
      };

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
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              updateAssistantMessage(content);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              updateAssistantMessage(content);
            }
          } catch { /* ignore */ }
        }
      }

      // Check if response contains JSON structure
      const generatedContent = parseJsonFromResponse(assistantMessage);
      if (generatedContent && generatedContent.goals && generatedContent.haccp) {
        console.log("Detected complete JSON structure, saving...");
        await saveGeneratedContent(generatedContent);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende melding. Prøv igjen.",
        variant: "destructive",
      });
      setMessages(messages); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          IK-MAT Assistent
        </CardTitle>
        <CardDescription>
          La AI-assistenten hjelpe deg med å sette opp et komplett matsikkerhetssystem tilpasset din virksomhet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            {isSaving && (
              <div className="flex gap-3 justify-center">
                <div className="bg-success/10 text-success rounded-lg px-4 py-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Lagrer IK-MAT innhold...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Skriv ditt svar her..."
              disabled={isLoading || isSaving}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading || isSaving}
              size="icon"
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