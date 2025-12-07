import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface IkHmsChatSetupProps {
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
  if (cleaned.includes('"goals"') && cleaned.includes('"organization"') && cleaned.includes('"risks"')) {
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
  
  // Try finding raw JSON
  if (content.includes('"goals"') && content.includes('"organization"')) {
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      return content.slice(startIndex, endIndex + 1);
    }
  }
  
  return null;
}

interface BrregInfo {
  name: string;
  orgNumber: string;
  address: string;
  industry: string;
  industryCode: string;
  employees: number;
  organizationForm: string;
}

export function IkHmsChatSetup({ companyId, onComplete }: IkHmsChatSetupProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hei! Jeg er Oppsett-hjelperen 👋\n\nJeg skal hjelpe deg å sette opp HMS-systemet for bedriften din. Det tar bare noen minutter!\n\nFor å starte trenger jeg organisasjonsnummeret ditt (9 siffer). Da kan jeg hente informasjon om bedriften automatisk fra Brønnøysundregistrene.\n\n**Skriv inn organisasjonsnummeret:**",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingBrregInfo, setPendingBrregInfo] = useState<BrregInfo | null>(null);
  const [awaitingIndustrySelection, setAwaitingIndustrySelection] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { refreshCompany } = useAuth();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const lookupBrreg = async (orgNumber: string): Promise<BrregInfo | null> => {
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ik-hms-chat`;
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ lookupOrgNumber: orgNumber }),
      });
      
      if (!response.ok) return null;
      
      const result = await response.json();
      if (result.success) {
        return result.data as BrregInfo;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Save Brreg info to company record
  const saveBrregToCompany = async (brregInfo: BrregInfo) => {
    try {
      // Parse address into components
      const addressParts = brregInfo.address.split(',');
      const mainAddress = addressParts[0]?.trim() || '';
      const postalPart = addressParts[1]?.trim() || '';
      const postalMatch = postalPart.match(/^(\d{4})\s+(.+)$/);
      const postalCode = postalMatch?.[1] || '';
      const city = postalMatch?.[2] || postalPart;

      const { error } = await supabase
        .from("companies")
        .update({
          name: brregInfo.name,
          org_number: brregInfo.orgNumber,
          address: mainAddress,
          postal_code: postalCode,
          city: city,
        })
        .eq("id", companyId);

      if (error) {
        console.error("Error saving Brreg info:", error);
        toast.error("Kunne ikke lagre bedriftsinformasjon");
      } else {
        toast.success("Bedriftsinformasjon oppdatert fra Brønnøysundregistrene");
        queryClient.invalidateQueries({ queryKey: ["company"] });
        // Refresh company in auth context so other components get updated data
        await refreshCompany();
      }
    } catch (error) {
      console.error("Error saving Brreg info:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    const userMessage: Message = { role: "user", content: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Check if user is confirming Brreg info (said "ja" or similar)
    const isConfirmingBrreg = pendingBrregInfo && 
      (userInput.toLowerCase() === 'ja' || 
       userInput.toLowerCase() === 'yes' || 
       userInput.toLowerCase().startsWith('ja,') ||
       userInput.toLowerCase().includes('stemmer'));

    if (isConfirmingBrreg && pendingBrregInfo) {
      // Save the Brreg info to company
      await saveBrregToCompany(pendingBrregInfo);
      setPendingBrregInfo(null);
      
      // Now ask for industry selection
      const industryMessage = `Flott! Bedriftsinformasjonen er lagret. 🎉\n\nNå trenger jeg å vite hvilken bransje som passer best for ${pendingBrregInfo.name}, slik at jeg kan tilpasse HMS-oppsettet:\n\n1. Kontor/Administrasjon\n2. Bygg og anlegg\n3. Industri/Produksjon\n4. Frisør/Skjønnhetspleie\n5. Butikk/Detaljhandel\n6. Restaurant/Spisested\n7. Transport\n8. Renhold\n9. Bilpleie\n\nHvilken bransje passer best? (Velg 1-9)`;
      
      setMessages((prev) => [...prev, { role: "assistant", content: industryMessage }]);
      setAwaitingIndustrySelection(true);
      setIsLoading(false);
      return;
    }
    
    // Check if user is selecting industry (only when we're awaiting industry selection)
    const isIndustrySelection = awaitingIndustrySelection && /^[1-9]$/.test(userInput.trim());
    
    if (isIndustrySelection) {
      // Map industry number to name for context
      const industryMap: Record<string, string> = {
        '1': 'Kontor/Administrasjon',
        '2': 'Bygg og anlegg',
        '3': 'Industri/Produksjon',
        '4': 'Frisør/Skjønnhetspleie',
        '5': 'Butikk/Detaljhandel',
        '6': 'Restaurant/Spisested',
        '7': 'Transport',
        '8': 'Renhold',
        '9': 'Bilpleie'
      };
      const selectedIndustry = industryMap[userInput.trim()];
      
      // Clear the awaiting flag
      setAwaitingIndustrySelection(false);
      
      // Continue with AI chat - include industry context
      const contextMessage = `Brukeren har valgt bransje: ${selectedIndustry}. Start nå med å samle informasjon for HMS-oppsettet tilpasset denne bransjen. Spør om mål for HMS-arbeidet.`;
      
      // Add system context to messages for AI
      const messagesWithContext: Message[] = [...messages, { role: "user", content: contextMessage }];
      
      try {
        const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ik-hms-chat`;
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: messagesWithContext }),
        });
        
        if (!response.ok || !response.body) {
          throw new Error("Failed to start stream");
        }
        
        // Process the streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let assistantMessage = "";
        let streamDone = false;

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

        const jsonContent = extractJsonFromContent(assistantMessage);
        if (jsonContent) {
          await saveSetupData(jsonContent);
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Noe gikk galt. Vennligst prøv igjen.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Check if user is declining Brreg info
    if (pendingBrregInfo && 
        (userInput.toLowerCase() === 'nei' || 
         userInput.toLowerCase() === 'no' ||
         userInput.toLowerCase().includes('stemmer ikke'))) {
      setPendingBrregInfo(null);
      // Continue with manual entry
      const manualMessage = "Ingen problem! La oss fylle inn informasjonen manuelt. Hva heter bedriften din?";
      setMessages((prev) => [...prev, { role: "assistant", content: manualMessage }]);
      setIsLoading(false);
      return;
    }

    // Check if user entered something that looks like an org number (9 digits)
    const orgNumberMatch = userInput.replace(/[\s.]/g, '').match(/^\d{9}$/);
    
    if (orgNumberMatch) {
      // Try Brreg lookup
      const brregInfo = await lookupBrreg(userInput);
      
      if (brregInfo) {
        // Store the Brreg info for later confirmation
        setPendingBrregInfo(brregInfo);
        
        // Create a message with the Brreg info
        const brregMessage = `Flott! Jeg fant følgende info fra Brønnøysundregistrene:\n\n📋 **Firmanavn:** ${brregInfo.name}\n📍 **Adresse:** ${brregInfo.address}\n🏭 **Bransje:** ${brregInfo.industry}\n👥 **Ansatte:** ${brregInfo.employees}\n\nStemmer dette? (Ja/Nei)`;
        
        setMessages((prev) => [...prev, { role: "assistant", content: brregMessage }]);
        setIsLoading(false);
        return;
      }
    }

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
        setIsLoading(false);
        return;
      }

      if (response.status === 402) {
        toast.error("Kreditter oppbrukt. Kontakt administrator.");
        setIsLoading(false);
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
        console.log("JSON found in response, saving setup data...");
        await saveSetupData(jsonContent);
      } else {
        // Log for debugging if we expected JSON but didn't find it
        if (assistantMessage.includes("Supert") && assistantMessage.includes("HMS-system")) {
          console.warn("Expected JSON in final message but none found. Full message:", assistantMessage);
        }
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
      const data = JSON.parse(jsonContent);

      // IMPORTANT: We now save AI-generated content to company_modules.settings.generatedContent
      // This preserves user-created data in the main tables (avvik, risikovurderinger, handlingsplaner, stoffkartotek, etc.)
      // The AI content is stored separately and can be regenerated without losing user data.
      
      // Transform routines to the expected format
      const transformedRoutines = data.routines?.map((routine: Record<string, unknown>, index: number) => ({
        id: routine.id || `ai-routine-${index + 1}`,
        routine_number: routine.routine_number || `R${(index + 1).toString().padStart(3, '0')}`,
        routine_name: routine.routine_name || routine.name || 'Ukjent rutine',
        category: routine.category || 'Generelt',
        purpose: routine.purpose || routine.description || '',
        responsibility: routine.responsibility || routine.responsible || '',
        procedure: routine.procedure || '',
        examples: routine.examples || '',
        remember: routine.remember || '',
        is_predefined: true,
        is_ai_generated: true,
      })) || [];

      // Transform risks to ensure they have AI marker
      const transformedRisks = data.risks?.map((risk: Record<string, unknown>, index: number) => ({
        ...risk,
        id: risk.id || `ai-risk-${index + 1}`,
        is_ai_generated: true,
      })) || [];

      // Transform actions to ensure they have AI marker
      const transformedActions = data.actions?.map((action: Record<string, unknown>, index: number) => ({
        ...action,
        id: action.id || `ai-action-${index + 1}`,
        is_ai_generated: true,
      })) || [];

      // Get existing module data
      const { data: moduleData } = await supabase
        .from("company_modules")
        .select("*")
        .eq("company_id", companyId)
        .eq("module_type", "IK_HMS")
        .single();

      if (moduleData) {
        // Store AI-generated content in module settings - this REPLACES previous AI content
        // but does NOT affect user-created content in main tables
        await supabase
          .from("company_modules")
          .update({
            settings: {
              ...(moduleData.settings as Record<string, unknown>),
              setupCompletedAt: new Date().toISOString(),
              industry: data.industry || (moduleData.settings as Record<string, unknown>)?.industry || null,
              generatedContent: {
                goals: data.goals || [],
                organization: data.organization || null,
                risks: transformedRisks,
                actions: transformedActions,
                routines: transformedRoutines,
                generatedAt: new Date().toISOString(),
              },
            },
          })
          .eq("id", moduleData.id);
      }

      // Also save to the standard tables for backward compatibility,
      // but ONLY add AI-generated goals (don't delete existing user-created goals)
      if (data.goals?.length > 0) {
        // Delete only AI-generated goals (is_predefined = true), keep user-created ones
        await supabase
          .from("company_goals")
          .delete()
          .eq("company_id", companyId)
          .eq("is_predefined", true);
        
        for (const goal of data.goals) {
          await supabase.from("company_goals").insert({
            company_id: companyId,
            goal_text: goal,
            is_predefined: true, // Marks as AI-generated
          });
        }
      }

      // Save organization (this is typically just company structure info, safe to update)
      if (data.organization) {
        await supabase.from("company_organization").upsert({
          company_id: companyId,
          custom_content: data.organization.custom_content,
          is_custom: data.organization.is_custom || false,
        });
      }

      // For risk assessments and action plans, we need to merge AI content with existing user content
      // We'll mark AI-generated items so they can be replaced on re-run
      if (data.risks?.length > 0) {
        // Get existing risks
        const { data: existingRisks } = await supabase
          .from("company_risk_assessments")
          .select("risks")
          .eq("company_id", companyId)
          .single();
        
        // Filter out old AI-generated risks and keep user-created ones
        const userRisks = (existingRisks?.risks as Array<Record<string, unknown>> || [])
          .filter((r) => !r.is_ai_generated);
        
        // Combine user risks with new AI risks
        await supabase.from("company_risk_assessments").upsert({
          company_id: companyId,
          risks: [...userRisks, ...transformedRisks],
        });
      }

      // Same approach for action plans
      if (data.actions?.length > 0) {
        const { data: existingActions } = await supabase
          .from("company_action_plans")
          .select("actions")
          .eq("company_id", companyId)
          .single();
        
        const userActions = (existingActions?.actions as Array<Record<string, unknown>> || [])
          .filter((a) => !a.is_ai_generated);
        
        await supabase.from("company_action_plans").upsert({
          company_id: companyId,
          actions: [...userActions, ...transformedActions],
        });
      }

      // Same approach for routines
      if (data.routines?.length > 0) {
        const { data: existingRoutines } = await supabase
          .from("company_routines")
          .select("routines")
          .eq("company_id", companyId)
          .single();
        
        const userRoutines = (existingRoutines?.routines as Array<Record<string, unknown>> || [])
          .filter((r) => !r.is_ai_generated);
        
        await supabase.from("company_routines").upsert({
          company_id: companyId,
          routines: [...userRoutines, ...transformedRoutines],
        });
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
    <div className="space-y-3 sm:space-y-4">
      <Card className="border-primary/20">
        <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px] max-h-[500px] sm:max-h-[600px] p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-2 sm:gap-3 justify-start">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3 sm:p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            {isSaving && (
              <div className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-success/10 rounded-lg border border-success/20">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-success animate-pulse" />
                <p className="text-xs sm:text-sm text-success font-medium">Setter opp HMS-systemet ditt...</p>
              </div>
            )}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
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
          className="text-base sm:text-sm"
        />
        <Button 
          onClick={handleSend} 
          disabled={isLoading || isSaving || !input.trim()}
          size="default"
          className="px-3 sm:px-4"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {messages.length <= 2 && (
        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">
          <p className="font-medium mb-2">💡 Slik fungerer det:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Jeg stiller deg noen enkle spørsmål om bedriften</li>
            <li>Basert på svarene lager jeg et tilpasset HMS-oppsett</li>
            <li>Du kan alltid gjøre endringer etterpå</li>
            <li>Oppsettet tar ca. 5-10 minutter</li>
          </ul>
        </div>
      )}
    </div>
  );
}
