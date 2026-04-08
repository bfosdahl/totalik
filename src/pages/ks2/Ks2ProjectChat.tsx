import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, Send, User, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

function getDisplayContent(content: string): string {
  return content
    .replace(/\|\|\|ACTION_START\|\|\|[\s\S]*?\|\|\|ACTION_END\|\|\|/g, "")
    .replace(/\|\|\|JSON_START\|\|\|[\s\S]*?\|\|\|JSON_END\|\|\|/g, "")
    .trim();
}

function extractAction(content: string): any | null {
  const match = content.match(/\|\|\|ACTION_START\|\|\|([\s\S]*?)\|\|\|ACTION_END\|\|\|/);
  if (match?.[1]) {
    try { return JSON.parse(match[1].trim()); } catch { return null; }
  }
  return null;
}

const WELCOME_MESSAGE = `Hei! Jeg er Prosjekt-assistenten 👋

Jeg er låst til dette prosjektet og kjenner all informasjon om det. Du kan spørre meg om:

- **Sjekklister** – Hvilke bør du bruke? Legg til nye sjekklister
- **Underleverandører** – Registrer nye UE, oppfølging og krav
- **Avvik** – Vurdering, tiltak og forebygging
- **SAK10-krav** – Hva kreves for dette prosjektet?
- **HMS/SHA** – Risikovurderinger og sikkerhetstiltak
- **Dokumentasjon** – Hva må dokumenteres?

Bare skriv hva du lurer på! 🔨`;

export default function Ks2ProjectChat() {
  const { projectId } = useParams();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [projectContext, setProjectContext] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load project context (project info + related data)
  useEffect(() => {
    if (!projectId || !profile?.company_id) return;

    const loadContext = async () => {
      try {
        const [projectRes, checklistsRes, subcontractorsRes, deviationsRes, milestonesRes] = await Promise.all([
          supabase.from("ks_module2_projects").select("*").eq("id", projectId).single(),
      supabase.from("ks_module2_checklists").select("id, title, status, template_name, created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(30),
          supabase.from("ks_module2_subcontractors").select("id, firm_name, trade, approval_status, contact_person").eq("project_id", projectId),
          supabase.from("ks_module2_deviations" as any).select("id, title, severity, status").eq("project_id", projectId),
          supabase.from("ks_module2_milestones" as any).select("id, name, status, target_date").eq("project_id", projectId),
        ]);

        setProjectContext({
          project: projectRes.data || {},
          checklists: checklistsRes.data || [],
          subcontractors: subcontractorsRes.data || [],
          deviations: deviationsRes.data || [],
          milestones: milestonesRes.data || [],
        });
      } catch (err) {
        console.error("Error loading project context:", err);
      }
    };

    loadContext();
  }, [projectId, profile?.company_id]);

  // Load chat history from DB
  useEffect(() => {
    if (!projectId) return;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from("ks_project_chat_messages" as any)
          .select("id, role, content, created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setMessages(data.map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
        } else {
          setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
        setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveMessage = useCallback(async (role: string, content: string) => {
    if (!projectId || !profile?.company_id || !profile?.user_id) return;
    try {
      await supabase
        .from("ks_project_chat_messages" as any)
        .insert({
          project_id: projectId,
          company_id: profile.company_id,
          user_id: profile.user_id,
          role,
          content,
        } as any);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  }, [projectId, profile?.company_id, profile?.user_id]);

  const handleAction = useCallback(async (action: any) => {
    if (!projectId || !profile?.company_id) return;

    try {
      if (action.action === "add_checklist" && action.data) {
        const checkpoints = (action.data.checkpoints || []).map((cp: string, idx: number) => ({
          id: crypto.randomUUID(),
          text: cp,
          checked: false,
          order: idx,
        }));

        const { error } = await supabase.from("ks_module2_checklists").insert({
          project_id: projectId,
          company_id: profile.company_id,
          title: action.data.title,
          category: action.data.category || "kvalitet",
          status: "ikke_startet",
          checklist_items: checkpoints,
          created_by_name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "AI-assistent",
        } as any);

        if (error) throw error;
        toast.success(`Sjekkliste "${action.data.title}" ble lagt til`);
      }

      if (action.action === "add_subcontractor" && action.data) {
        const { error } = await supabase.from("ks_module2_subcontractors").insert({
          project_id: projectId,
          company_id: profile.company_id,
          firm_name: action.data.company_name || action.data.firm_name,
          trade: action.data.trade || null,
          contact_person: action.data.contact_person || null,
          work_scope: action.data.work_scope || action.data.trade || "Ikke spesifisert",
          approval_status: "pending",
        } as any);

        if (error) throw error;
        toast.success(`Underleverandør "${action.data.company_name || action.data.firm_name}" ble lagt til`);
      }

      // Refresh context after action
      const [checklistsRes, subcontractorsRes] = await Promise.all([
        supabase.from("ks_module2_checklists").select("id, title, status, category, created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(30),
        supabase.from("ks_module2_subcontractors").select("id, firm_name, trade, approval_status, contact_person").eq("project_id", projectId),
      ]);

      setProjectContext((prev: any) => ({
        ...prev,
        checklists: checklistsRes.data || prev?.checklists || [],
        subcontractors: subcontractorsRes.data || prev?.subcontractors || [],
      }));
    } catch (err) {
      console.error("Error executing action:", err);
      toast.error("Kunne ikke utføre handlingen");
    }
  }, [projectId, profile?.company_id, profile?.first_name, profile?.last_name]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    await saveMessage("user", userMessage);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Ikke logget inn");

      const aiMessages = newMessages
        .filter(m => m.content !== WELCOME_MESSAGE)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ks-project-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: aiMessages,
            projectContext: projectContext,
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
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Process any actions in the response
      const action = extractAction(fullContent);
      if (action) {
        await handleAction(action);
      }

      if (fullContent) {
        await saveMessage("assistant", fullContent);
      }
    } catch (error) {
      console.error("Project chat error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Beklager, det oppsto en feil. Prøv igjen." }]);
      toast.error("Feil ved kommunikasjon med AI");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Laster chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] max-h-[800px]">
      <div className="flex items-center gap-2 pb-4 border-b">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium">Prosjekt-assistenten</h3>
          <p className="text-xs text-muted-foreground">
            Låst til: {projectContext?.project?.project_name || "Laster..."} ({projectContext?.project?.project_number || ""})
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 py-4" ref={scrollRef}>
        <div className="space-y-4 pr-4">
          {messages.map((msg, i) => {
            const displayContent = getDisplayContent(msg.content);
            if (!displayContent) return null;

            return (
              <div
                key={msg.id || i}
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
            placeholder="Spør om sjekklister, rutiner, SAK10-krav..."
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
