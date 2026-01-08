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
import { VerneombudExemptionDialog } from "./VerneombudExemptionDialog";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface IkHmsChatSetupProps {
  companyId: string;
  departmentId?: string;
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

// Session storage key for persisting chat state
const CHAT_STATE_KEY = 'ik-hms-chat-setup-state';

interface ChatState {
  messages: Message[];
  pendingBrregInfo: BrregInfo | null;
  awaitingIndustrySelection: boolean;
  confirmedEmployeeCount: number | null;
  awaitingEmployeeCount: boolean;
  selectedIndustry: string | null;
}

function loadChatState(companyId: string): ChatState | null {
  try {
    const stored = sessionStorage.getItem(`${CHAT_STATE_KEY}-${companyId}`);
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
    sessionStorage.setItem(`${CHAT_STATE_KEY}-${companyId}`, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save chat state:', e);
  }
}

function clearChatState(companyId: string) {
  try {
    sessionStorage.removeItem(`${CHAT_STATE_KEY}-${companyId}`);
  } catch (e) {
    console.error('Failed to clear chat state:', e);
  }
}

export function IkHmsChatSetup({ companyId, onComplete }: IkHmsChatSetupProps) {
  // Load initial state from session storage
  const initialState = loadChatState(companyId);
  const { refreshCompany, company } = useAuth();
  const hasAutoCheckedOrgRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
  // Start with a loading message if we have org_number
  const [messages, setMessages] = useState<Message[]>(
    initialState?.messages ?? [{
      role: "assistant",
      content: "Hei! Jeg er Oppsett-hjelperen 👋\n\nEtt øyeblikk, jeg laster inn informasjon...",
    }]
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(!initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingBrregInfo, setPendingBrregInfo] = useState<BrregInfo | null>(initialState?.pendingBrregInfo ?? null);
  const [awaitingIndustrySelection, setAwaitingIndustrySelection] = useState(initialState?.awaitingIndustrySelection ?? false);
  const [showExemptionDialog, setShowExemptionDialog] = useState(false);
  const [confirmedEmployeeCount, setConfirmedEmployeeCount] = useState<number | null>(initialState?.confirmedEmployeeCount ?? null);
  const [awaitingEmployeeCount, setAwaitingEmployeeCount] = useState(initialState?.awaitingEmployeeCount ?? false);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(initialState?.selectedIndustry ?? null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Forward declaration for lookupBrreg (used in auto-lookup effect)
  const lookupBrregRef = useRef<((orgNumber: string) => Promise<BrregInfo | null>) | null>(null);

  // Initialize chat based on whether company has org_number
  useEffect(() => {
    // Skip if loaded from session or already initialized
    if (initialState || hasInitializedRef.current) return;
    if (!company) return; // Wait for company to load
    
    hasInitializedRef.current = true;

    if (company.org_number && !hasAutoCheckedOrgRef.current) {
      // We have org_number, show loading message and auto-lookup
      hasAutoCheckedOrgRef.current = true;
      setMessages([{
        role: "assistant",
        content: `Hei! Jeg er Oppsett-hjelperen 👋\n\nJeg skal hjelpe deg å sette opp HMS-systemet for ${company.name || 'bedriften din'}. Det tar bare noen minutter!\n\nEtt øyeblikk, jeg henter informasjon fra Brønnøysundregistrene...`,
      }]);
      
      // Perform Brreg lookup
      const doLookup = async () => {
        if (!lookupBrregRef.current) {
          setIsLoading(false);
          return;
        }
        
        const brregInfo = await lookupBrregRef.current(company.org_number!);
        
        if (brregInfo) {
          setPendingBrregInfo(brregInfo);
          const brregMessage = `Flott! Jeg fant følgende info fra Brønnøysundregistrene:\n\n📋 **Firmanavn:** ${brregInfo.name}\n📍 **Adresse:** ${brregInfo.address}\n🏭 **Bransje:** ${brregInfo.industry}\n👥 **Ansatte:** ${brregInfo.employees}\n\nStemmer dette? (Ja/Nei)`;
          setMessages((prev) => [...prev, { role: "assistant", content: brregMessage }]);
        } else {
          // Brreg lookup failed, ask for manual input
          setMessages((prev) => [...prev, {
            role: "assistant",
            content: "Jeg kunne dessverre ikke hente informasjon fra Brønnøysundregistrene akkurat nå. La oss fortsette manuelt.\n\nHvilken bransje passer best for bedriften din?\n\n1. Kontor/Administrasjon\n2. Bygg og anlegg\n3. Industri/Produksjon\n4. Frisør/Skjønnhetspleie\n5. Butikk/Detaljhandel\n6. Restaurant/Spisested\n7. Transport\n8. Renhold\n9. Bilpleie\n\n(Velg 1-9)",
          }]);
          setAwaitingIndustrySelection(true);
        }
        setIsLoading(false);
      };
      
      // Small delay to ensure lookupBrregRef is set
      setTimeout(doLookup, 100);
    } else {
      // No org_number, ask for it
      setMessages([{
        role: "assistant",
        content: "Hei! Jeg er Oppsett-hjelperen 👋\n\nJeg skal hjelpe deg å sette opp HMS-systemet for bedriften din. Det tar bare noen minutter!\n\nFor å starte trenger jeg organisasjonsnummeret ditt (9 siffer). Da kan jeg hente informasjon om bedriften automatisk fra Brønnøysundregistrene.\n\n**Skriv inn organisasjonsnummeret:**",
      }]);
      setIsLoading(false);
    }
  }, [company, initialState]);

  const lookupBrreg = async (orgNumber: string): Promise<BrregInfo | null> => {
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ik-hms-chat`;
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

  // Set the ref after function is defined
  lookupBrregRef.current = lookupBrreg;

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

  const continueWithAIChat = async (contextMessage: string) => {
    const messagesWithContext: Message[] = [...messages, { role: "user", content: contextMessage }];
    
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ik-hms-chat`;
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: messagesWithContext }),
      });
      
      if (!response.ok || !response.body) {
        throw new Error("Failed to start stream");
      }
      
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
  };

  const handleExemptionComplete = () => {
    setShowExemptionDialog(false);
    setMessages((prev) => [...prev, { role: "assistant", content: "Flott! Avtalen om fritak fra verneombud er nå signert og lagret. ✅\n\nLa oss fortsette med HMS-oppsettet..." }]);
    continueWithAIChat(`Brukeren har valgt bransje: ${selectedIndustry}. Bedriften har færre enn 5 ansatte og har signert fritak fra verneombud. Start nå med å samle informasjon for HMS-oppsettet tilpasset denne bransjen. Spør om mål for HMS-arbeidet.`);
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
      
      // Use industry from Brreg directly instead of asking
      const brregIndustry = pendingBrregInfo.industry;
      setSelectedIndustry(brregIndustry);
      setPendingBrregInfo(null);
      
      // Check employee count - use Brreg data if available
      const brregEmployees = pendingBrregInfo.employees;
      
      if (brregEmployees >= 5) {
        // 5+ employees, continue directly with AI chat
        setConfirmedEmployeeCount(brregEmployees);
        setMessages((prev) => [...prev, { 
          role: "assistant", 
          content: `Flott! Bedriftsinformasjonen er lagret. 🎉\n\nJeg ser at dere har ${brregEmployees} ansatte og tilhører bransjen "${brregIndustry}". La oss tilpasse HMS-oppsettet for dere...` 
        }]);
        await continueWithAIChat(`Bedriften heter ${pendingBrregInfo.name}, bransje: ${brregIndustry}, og har ${brregEmployees} ansatte (5 eller flere). Start nå med å samle informasjon for HMS-oppsettet tilpasset denne bransjen. Spør om mål for HMS-arbeidet.`);
        return;
      } else {
        // Less than 5 employees - ask about verneombud exemption
        const employeeCountMessage = `Flott! Bedriftsinformasjonen er lagret. 🎉\n\nJeg ser at dere tilhører bransjen "${brregIndustry}" og har ${brregEmployees} registrerte ansatte.\n\nSiden dere har færre enn 5 ansatte, har dere mulighet til å inngå en skriftlig avtale om fritak fra verneombud i henhold til arbeidsmiljøloven § 6-1.\n\n✅ **Fritak fra verneombud:**\nDere kan signere en avtale digitalt her i systemet som dokumenterer at arbeidsgiver og ansatte er enige om at det ikke er nødvendig med verneombud.\n\n**Ønsker du å signere en slik avtale nå?**\n\n1. Ja, signer avtale om fritak\n2. Nei, fortsett uten avtale\n\n(Velg 1 eller 2)`;
        
        setConfirmedEmployeeCount(brregEmployees);
        setMessages((prev) => [...prev, { role: "assistant", content: employeeCountMessage }]);
        setIsLoading(false);
        return;
      }
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
      const industry = industryMap[userInput.trim()];
      setSelectedIndustry(industry);
      
      // Clear the awaiting flag
      setAwaitingIndustrySelection(false);
      
      // Ask about employee count for verneombud requirements
      const employeeCountMessage = `Bra! Du har valgt ${industry}. 👍\n\nNå trenger jeg å vite omtrent hvor mange ansatte dere har. Dette er viktig for å bestemme hvilke HMS-krav som gjelder for bedriften.\n\n**Har bedriften 5 eller flere ansatte?**\n\n1. Ja, vi har 5 eller flere ansatte\n2. Nei, vi har færre enn 5 ansatte\n\n(Velg 1 eller 2)`;
      
      setMessages((prev) => [...prev, { role: "assistant", content: employeeCountMessage }]);
      setAwaitingEmployeeCount(true);
      setIsLoading(false);
      return;
    }
    
    // Check if user is answering employee count question
    const isEmployeeCountAnswer = awaitingEmployeeCount && /^[1-2]$/.test(userInput.trim());
    
    if (isEmployeeCountAnswer) {
      setAwaitingEmployeeCount(false);
      const hasMoreThan5 = userInput.trim() === '1';
      
      if (!hasMoreThan5) {
        // Less than 5 employees - offer exemption agreement
        setConfirmedEmployeeCount(4); // We'll use this as a placeholder
        const exemptionMessage = `Siden dere har færre enn 5 ansatte, har dere mulighet til å inngå en skriftlig avtale om fritak fra verneombud i henhold til arbeidsmiljøloven § 6-1.\n\n✅ **Fritak fra verneombud:**\nDere kan signere en avtale digitalt her i systemet som dokumenterer at arbeidsgiver og ansatte er enige om at det ikke er nødvendig med verneombud.\n\n**Ønsker du å signere en slik avtale nå?**\n\n1. Ja, signer avtale om fritak\n2. Nei, fortsett uten avtale\n\n(Velg 1 eller 2)`;
        
        setMessages((prev) => [...prev, { role: "assistant", content: exemptionMessage }]);
        setIsLoading(false);
        return;
      } else {
        setConfirmedEmployeeCount(5); // 5 or more
        // Continue with AI chat
        await continueWithAIChat(`Brukeren har valgt bransje: ${selectedIndustry}. Bedriften har 5 eller flere ansatte. Start nå med å samle informasjon for HMS-oppsettet tilpasset denne bransjen. Spør om mål for HMS-arbeidet.`);
        return;
      }
    }
    
    // Check if user wants to sign exemption agreement
    if (confirmedEmployeeCount !== null && confirmedEmployeeCount < 5) {
      if (userInput.trim() === '1') {
        // Open exemption dialog
        setShowExemptionDialog(true);
        setIsLoading(false);
        return;
      } else if (userInput.trim() === '2') {
        // Continue without exemption
        setMessages((prev) => [...prev, { role: "assistant", content: "Greit! Du kan alltid signere avtalen senere under Innstillinger hvis du ombestemmer deg.\n\nLa oss fortsette med HMS-oppsettet..." }]);
        await continueWithAIChat(`Brukeren har valgt bransje: ${selectedIndustry}. Bedriften har færre enn 5 ansatte og ønsker ikke å signere fritak fra verneombud nå. Start nå med å samle informasjon for HMS-oppsettet tilpasset denne bransjen. Spør om mål for HMS-arbeidet.`);
        return;
      }
    }

    // Check if user is declining Brreg info
    if (pendingBrregInfo && 
        (userInput.toLowerCase() === 'nei' || 
         userInput.toLowerCase() === 'no' ||
         userInput.toLowerCase().includes('stemmer ikke'))) {
      setPendingBrregInfo(null);
      // Ask for industry selection manually
      const industryMessage = "Ingen problem! La oss fortsette manuelt.\n\nHvilken bransje passer best for bedriften din?\n\n1. Kontor/Administrasjon\n2. Bygg og anlegg\n3. Industri/Produksjon\n4. Frisør/Skjønnhetspleie\n5. Butikk/Detaljhandel\n6. Restaurant/Spisested\n7. Transport\n8. Renhold\n9. Bilpleie\n\n(Velg 1-9)";
      setMessages((prev) => [...prev, { role: "assistant", content: industryMessage }]);
      setAwaitingIndustrySelection(true);
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
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
    
    // Retry logic for reliability
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
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

        const newSettings = {
          setupCompletedAt: new Date().toISOString(),
          industry: data.industry || selectedIndustry || null,
          generatedContent: {
            goals: data.goals || [],
            organization: data.organization || null,
            risks: transformedRisks,
            actions: transformedActions,
            routines: transformedRoutines,
            generatedAt: new Date().toISOString(),
          },
        };

        // STEP 1: Ensure module exists and update it
        const { data: existingModule } = await supabase
          .from("company_modules")
          .select("id, settings")
          .eq("company_id", companyId)
          .eq("module_type", "IK_HMS")
          .maybeSingle();

        let moduleId: string;

        if (existingModule) {
          // Update existing module
          const { error: updateError } = await supabase
            .from("company_modules")
            .update({
              settings: {
                ...(existingModule.settings as Record<string, unknown>),
                ...newSettings,
              },
              is_active: true,
            })
            .eq("id", existingModule.id);
          
          if (updateError) {
            throw new Error(`Kunne ikke oppdatere HMS-modul: ${updateError.message}`);
          }
          moduleId = existingModule.id;
        } else {
          // Create new IK_HMS module
          const { data: newModule, error: insertError } = await supabase
            .from("company_modules")
            .insert({
              company_id: companyId,
              module_type: "IK_HMS",
              is_active: true,
              settings: newSettings,
            })
            .select()
            .single();
          
          if (insertError || !newModule) {
            throw new Error(`Kunne ikke opprette HMS-modul: ${insertError?.message || 'Ukjent feil'}`);
          }
          moduleId = newModule.id;
        }

        // STEP 2: Verify the module was saved correctly
        const { data: verifyModule, error: verifyError } = await supabase
          .from("company_modules")
          .select("id, settings")
          .eq("id", moduleId)
          .single();

        if (verifyError || !verifyModule) {
          throw new Error("Kunne ikke verifisere at HMS-modul ble lagret");
        }

        const savedSettings = verifyModule.settings as Record<string, unknown>;
        if (!savedSettings?.setupCompletedAt) {
          throw new Error("HMS-modul ble ikke lagret korrekt - mangler setupCompletedAt");
        }

        // STEP 3: Save to standard tables (with error handling but non-blocking)
        try {
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

          // Save organization - needs to be JSON with roles[] and description
          if (data.organization) {
            // If organization has roles array (new format), stringify the whole thing
            // Otherwise, use the legacy format
            let orgContent: string;
            if (data.organization.roles && Array.isArray(data.organization.roles)) {
              // New format with roles and description
              orgContent = JSON.stringify({
                roles: data.organization.roles.map((role: Record<string, unknown>, idx: number) => ({
                  id: role.id || `role-${idx + 1}`,
                  title: role.title || '',
                  personName: role.personName || '',
                  description: role.description || '',
                  sortOrder: role.sortOrder ?? idx,
                })),
                description: data.organization.description || '',
              });
            } else if (typeof data.organization.custom_content === 'string') {
              // Legacy format - just text
              orgContent = data.organization.custom_content;
            } else {
              orgContent = JSON.stringify(data.organization);
            }
            
            await supabase.from("company_organization").upsert({
              company_id: companyId,
              custom_content: orgContent,
              is_custom: true,
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
        } catch (tableError) {
          // Log but don't fail - the main module data is already saved
          console.warn("Warning: Could not save to standard tables:", tableError);
        }

        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["company-goals"] });
        queryClient.invalidateQueries({ queryKey: ["company-organization"] });
        queryClient.invalidateQueries({ queryKey: ["company-risk-assessments"] });
        queryClient.invalidateQueries({ queryKey: ["company-action-plans"] });
        queryClient.invalidateQueries({ queryKey: ["company-routines"] });
        queryClient.invalidateQueries({ queryKey: ["company-modules"] });

        // Success! Break out of retry loop
        toast.success("HMS-oppsett fullført!");
        setIsSaving(false);
        // Clear session storage since setup is complete
        clearChatState(companyId);
        onComplete();
        return; // Exit the function successfully
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    // All retries failed
    console.error("All save attempts failed:", lastError);
    toast.error(lastError?.message || "Kunne ikke lagre oppsettdata. Vennligst prøv igjen.");
    setIsSaving(false);
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

      <VerneombudExemptionDialog
        open={showExemptionDialog}
        onOpenChange={setShowExemptionDialog}
        companyId={companyId}
        companyName={company?.name || ""}
        companyAddress={company?.address ? `${company.address}, ${company.postal_code || ""} ${company.city || ""}` : undefined}
        orgNumber={company?.org_number || undefined}
        totalEmployees={confirmedEmployeeCount || 4}
        onComplete={handleExemptionComplete}
      />
    </div>
  );
}
