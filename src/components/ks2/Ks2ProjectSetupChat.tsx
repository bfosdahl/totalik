import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Bot, User, Sparkles, CheckCircle, Paperclip, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewKsModule2ProjectInput } from "@/hooks/useKsModule2Projects";
import { toast } from "sonner";
import { t } from "@/i18n/t";

async function extractPdfText(file: File): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist");
  // Use a worker-less setup via fake worker
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  const max = Math.min(pdf.numPages, 30);
  for (let i = 1; i <= max; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(" ") + "\n\n";
  }
  return text.trim();
}

/** Henter ut tekst fra en Word-fil (.docx) uten ekstra avhengigheter. */
async function extractDocxText(file: File): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) return "";
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab[^>]*\/>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type MessageContent = string | any[];

interface Message {
  role: "user" | "assistant";
  content: MessageContent;
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

📎 **Tips:** Last opp et vedlegg med 📎-knappen – PDF, Word, bilde eller tekstfil (f.eks. salgsoppgave, anbud, tegning eller et bilde av befaringen). Da fyller jeg ut prosjektinformasjon automatisk!

**Hva slags prosjekt skal du i gang med?**
- Nybygg (enebolig, leilighetsbygg)
- Totalrenovering
- Tilbygg/påbygg
- Fagentreprise (tømrer, betong, rør, elektro)

Eller bare si "sett opp et forslag" så lager jeg et eksempel du kan tilpasse! 🔨`;

function getDisplayContent(content: MessageContent): string {
  const text = Array.isArray(content)
    ? content
        .map((part: any) =>
          part?.type === "text" ? part.text : part?.type === "image_url" ? "📎 Bilde lastet opp" : ""
        )
        .filter(Boolean)
        .join("\n")
    : content;
  return String(text ?? "")
    .replace(/\|\|\|JSON_START\|\|\|[\s\S]*?\|\|\|JSON_END\|\|\|/g, "")
    .replace(/--- DOKUMENTINNHOLD ---[\s\S]*$/, "")
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
  const [parsingFile, setParsingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (userMessage: MessageContent) => {
    const isEmpty = typeof userMessage === "string" ? !userMessage.trim() : !userMessage.length;
    if (isEmpty || isLoading) return;

    const currentMessages = messagesRef.current;
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
            setupMode: true,
            messages: [...currentMessages, { role: "user", content: userMessage }].map(m => ({
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
            contractor_type: (() => {
              const ct = String(parsed.contractor_type || "").toLowerCase();
              if (["total", "totalentreprise"].includes(ct)) return "total" as const;
              if (["hoved", "hovedentreprise"].includes(ct)) return "hoved" as const;
              if (["under", "underentreprise", "fagentreprise", "fag"].includes(ct)) return "under" as const;
              return undefined;
            })(),
            recommended_checklists: parsed.recommended_checklists || [],
            recommended_routines: parsed.recommended_routines || [],
            hms_focus: parsed.hms_focus || [],
            milestones: parsed.milestones || []
          };

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
        content: t("auto.beklager_det_oppsto_en_feil_proev_igjen") 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onComplete]);

  const handleSend = () => {
    sendMessage(input.trim());
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const name = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
    const isDocx = name.endsWith(".docx");
    const isImage = file.type.startsWith("image/");
    const isText = file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".csv") || name.endsWith(".md");

    if (name.endsWith(".doc") && !isDocx) {
      toast.error("Gamle .doc-filer støttes ikke. Lagre som .docx eller PDF.");
      return;
    }
    if (!isPdf && !isDocx && !isImage && !isText) {
      toast.error("Støttede filer: PDF, Word (.docx), bilde eller tekstfil");
      return;
    }
    if (file.size > (isImage ? 10 : 15) * 1024 * 1024) {
      toast.error(`Filen er for stor (maks ${isImage ? 10 : 15} MB)`);
      return;
    }

    const instruction = `Jeg har lastet opp "${file.name}". Bruk informasjonen til å fylle ut prosjektopplysninger og lag et forslag til prosjektoppsett (sjekklister, rutiner, HMS, milepæler).`;

    setParsingFile(true);
    try {
      if (isImage) {
        const dataUrl = await fileToDataUrl(file);
        await sendMessage([
          { type: "text", text: instruction },
          { type: "image_url", image_url: { url: dataUrl } },
        ]);
        return;
      }

      const text = isPdf
        ? await extractPdfText(file)
        : isDocx
          ? await extractDocxText(file)
          : await file.text();

      if (!text || text.trim().length < 30) {
        toast.error("Klarte ikke å lese tekst fra filen. Prøv en annen fil, eller skriv inn info selv.");
        return;
      }
      const truncated = text.length > 18000 ? text.slice(0, 18000) + "\n\n[...avkortet...]" : text;
      await sendMessage(`${instruction}\n\n--- DOKUMENTINNHOLD ---\n${truncated}\n--- SLUTT ---`);
    } catch (err) {
      console.error("File parse error:", err);
      toast.error("Kunne ikke lese filen. Prøv PDF, Word (.docx), bilde eller tekstfil.");
    } finally {
      setParsingFile(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Chat Header */}
      <div className="flex items-center gap-2 pb-4 border-b">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium">{t("auto.prosjekt_hjelperen")}</h3>
          <p className="text-xs text-muted-foreground">{t("auto.ai_assistent_for_prosjektoppsett")}</p>
        </div>
        {setupComplete && (
          <div className="ml-auto flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">{t("auto.forslag_klart")}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-4">
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
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="pt-4 border-t">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf,.docx,image/*,.txt,.csv,.md"
          className="hidden"
          onChange={handleFileSelected}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || setupComplete || parsingFile}
            title="Last opp vedlegg: PDF, Word, bilde eller tekstfil"
          >
            {parsingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder={parsingFile ? "Leser dokument..." : "Skriv her... (Enter for å sende, Shift+Enter for ny linje)"}
            disabled={isLoading || setupComplete || parsingFile}
            autoComplete="off"
            autoFocus
            rows={2}
            className="resize-none min-h-[44px]"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim() || setupComplete || parsingFile}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>

        {parsingFile && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            Leser vedlegget og henter ut prosjektinformasjon...
          </div>
        )}

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {t("auto.avbryt")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => sendMessage("Sett opp et forslag for et typisk byggeprosjekt")}
            disabled={isLoading || setupComplete || parsingFile}
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
