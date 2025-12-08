import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hms-chat`;

export default function HmsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Kunne ikke starte chat");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = textBuffer.split("\n");
        // Keep the last potentially incomplete line in buffer
        textBuffer = lines.pop() || "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          
          // Skip empty lines and SSE comments
          if (!line || line.startsWith(":")) continue;
          
          // Only process data lines
          if (!line.startsWith("data:")) continue;

          const jsonStr = line.slice(5).trim();
          
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              updateAssistant(content);
            }
          } catch (e) {
            console.log("Parse error for line:", line, e);
          }
        }
      }

      // Process any remaining buffer
      if (textBuffer.trim()) {
        const line = textBuffer.trim();
        if (line.startsWith("data:") && !line.includes("[DONE]")) {
          try {
            const parsed = JSON.parse(line.slice(5).trim());
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* ignore incomplete data */ }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke sende melding",
        variant: "destructive",
      });
      // Remove the user message if we failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">HMS Assistent</h1>
          <p className="text-muted-foreground">
            Still spørsmål om Internkontrollforskriften og Arbeidsmiljøloven
          </p>
        </div>

        <Card className="h-[calc(100vh-280px)] flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">IK & Arbeidsmiljø Chat</CardTitle>
                  <CardDescription>
                    Få svar på spørsmål om HMS-regelverk
                  </CardDescription>
                </div>
              </div>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearChat}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Tøm chat
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                  <h3 className="font-medium text-lg mb-2">Velkommen til HMS Assistenten</h3>
                  <p className="max-w-md text-sm">
                    Jeg kan hjelpe deg med spørsmål om Internkontrollforskriften, 
                    Arbeidsmiljøloven, HMS-rutiner, risikovurdering og mer.
                  </p>
                  <div className="mt-6 grid gap-2 text-sm">
                    <p className="font-medium">Eksempler på spørsmål:</p>
                    <button 
                      className="text-left px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      onClick={() => setInput("Hva krever Internkontrollforskriften av en liten bedrift?")}
                    >
                      "Hva krever IK-forskriften av en liten bedrift?"
                    </button>
                    <button 
                      className="text-left px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      onClick={() => setInput("Hvordan gjennomfører jeg en god risikovurdering?")}
                    >
                      "Hvordan gjennomfører jeg en god risikovurdering?"
                    </button>
                    <button 
                      className="text-left px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      onClick={() => setInput("Hva er verneombudets oppgaver?")}
                    >
                      "Hva er verneombudets oppgaver?"
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Skriv ditt spørsmål her..."
                  className="min-h-[60px] resize-none"
                  disabled={isLoading}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!input.trim() || isLoading}
                  className="px-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Dette er en AI-assistent og erstatter ikke profesjonell juridisk rådgivning.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
