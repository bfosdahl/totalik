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

// Helper to get unique storage key (for company or department)
function getStorageKey(companyId: string, departmentId?: string): string {
  return departmentId 
    ? `${CHAT_STATE_KEY}-dept-${departmentId}` 
    : `${CHAT_STATE_KEY}-${companyId}`;
}

interface ChatState {
  messages: Message[];
  pendingBrregInfo: BrregInfo | null;
  awaitingIndustrySelection: boolean;
  confirmedEmployeeCount: number | null;
  awaitingEmployeeCount: boolean;
  selectedIndustry: string | null;
}

function loadChatState(companyId: string, departmentId?: string): ChatState | null {
  try {
    const stored = sessionStorage.getItem(getStorageKey(companyId, departmentId));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load chat state:', e);
  }
  return null;
}

function saveChatState(companyId: string, departmentId: string | undefined, state: ChatState) {
  try {
    sessionStorage.setItem(getStorageKey(companyId, departmentId), JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save chat state:', e);
  }
}

function clearChatState(companyId: string, departmentId?: string) {
  try {
    sessionStorage.removeItem(getStorageKey(companyId, departmentId));
  } catch (e) {
    console.error('Failed to clear chat state:', e);
  }
}

export function IkHmsChatSetup({ companyId, departmentId, onComplete }: IkHmsChatSetupProps) {
  // Determine if we're setting up a department (separate from company)
  const isDepartmentSetup = !!departmentId;
  // Load initial state from session storage
  const initialState = loadChatState(companyId, departmentId);
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

  // Initialize chat based on whether company has org_number (skip Brreg for departments)
  useEffect(() => {
    // Skip if loaded from session or already initialized
    if (initialState || hasInitializedRef.current) return;
    if (!company) return; // Wait for company to load
    
    hasInitializedRef.current = true;

    // Departments start fresh with industry selection (no Brreg lookup)
    if (isDepartmentSetup) {
      setMessages([{
        role: "assistant",
        content: "Hei! Jeg er Oppsett-hjelperen 👋\n\nJeg skal hjelpe deg å sette opp et helt eget HMS-system for denne avdelingen. Avdelingen får sine egne mål, risikovurderinger, rutiner og handlingsplaner - helt uavhengig av hovedbedriften.\n\nHvilken bransje passer best for avdelingens arbeidsmiljø?\n\n1. Kontor/Administrasjon\n2. Bygg og anlegg\n3. Industri/Produksjon\n4. Frisør/Skjønnhetspleie\n5. Butikk/Detaljhandel\n6. Restaurant/Spisested\n7. Transport\n8. Renhold\n9. Bilpleie\n\n(Velg 1-9)",
      }]);
      setAwaitingIndustrySelection(true);
      setIsLoading(false);
      return;
    }

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
  }, [company, initialState, isDepartmentSetup]);

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

        // DEPARTMENT SETUP: Save to department-specific tables
        if (isDepartmentSetup && departmentId) {
          // Save department module settings
          const { data: existingModule } = await supabase
            .from("company_modules")
            .select("id, settings")
            .eq("company_id", companyId)
            .eq("module_type", `IK_HMS_DEPT_${departmentId}`)
            .maybeSingle();

          if (existingModule) {
            await supabase
              .from("company_modules")
              .update({
                settings: {
                  ...(existingModule.settings as Record<string, unknown>),
                  ...newSettings,
                },
                is_active: true,
              })
              .eq("id", existingModule.id);
          } else {
            await supabase
              .from("company_modules")
              .insert({
                company_id: companyId,
                module_type: `IK_HMS_DEPT_${departmentId}`,
                is_active: true,
                settings: newSettings,
              });
          }

          // Save to department-specific tables
          try {
            // Department goals
            if (data.goals?.length > 0) {
              await supabase
                .from("department_goals")
                .delete()
                .eq("department_id", departmentId)
                .eq("is_predefined", true);
              
              for (const goal of data.goals) {
                await supabase.from("department_goals").insert({
                  department_id: departmentId,
                  goal_text: goal,
                  is_predefined: true,
                });
              }
            }

            // Department organization
            if (data.organization) {
              let orgContent: string;
              if (data.organization.roles && Array.isArray(data.organization.roles)) {
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
                orgContent = data.organization.custom_content;
              } else {
                orgContent = JSON.stringify(data.organization);
              }
              
              await supabase.from("department_organization").upsert({
                department_id: departmentId,
                custom_content: orgContent,
                is_custom: true,
              });
            }

            // Department risks
            if (data.risks?.length > 0) {
              const { data: existingRisks } = await supabase
                .from("department_risk_assessments")
                .select("risks")
                .eq("department_id", departmentId)
                .single();
              
              const userRisks = (existingRisks?.risks as Array<Record<string, unknown>> || [])
                .filter((r) => !r.is_ai_generated);
              
              await supabase.from("department_risk_assessments").upsert({
                department_id: departmentId,
                risks: [...userRisks, ...transformedRisks],
              });
            }

            // Department actions
            if (data.actions?.length > 0) {
              const { data: existingActions } = await supabase
                .from("department_action_plans")
                .select("actions")
                .eq("department_id", departmentId)
                .single();
              
              const userActions = (existingActions?.actions as Array<Record<string, unknown>> || [])
                .filter((a) => !a.is_ai_generated);
              
              await supabase.from("department_action_plans").upsert({
                department_id: departmentId,
                actions: [...userActions, ...transformedActions],
              });
            }

            // Department routines
            if (data.routines?.length > 0) {
              const { data: existingRoutines } = await supabase
                .from("department_routines")
                .select("routines")
                .eq("department_id", departmentId)
                .single();
              
              const userRoutines = (existingRoutines?.routines as Array<Record<string, unknown>> || [])
                .filter((r) => !r.is_ai_generated);
              
              await supabase.from("department_routines").upsert({
                department_id: departmentId,
                routines: [...userRoutines, ...transformedRoutines],
              });
            }
          } catch (tableError) {
            console.warn("Warning: Could not save to department tables:", tableError);
          }

          // Invalidate department queries
          queryClient.invalidateQueries({ queryKey: ["department-goals"] });
          queryClient.invalidateQueries({ queryKey: ["department-organization"] });
          queryClient.invalidateQueries({ queryKey: ["department-risk-assessments"] });
          queryClient.invalidateQueries({ queryKey: ["department-action-plans"] });
          queryClient.invalidateQueries({ queryKey: ["department-routines"] });
          queryClient.invalidateQueries({ queryKey: ["company-modules"] });

          toast.success("HMS-oppsett for avdelingen fullført!");
          setIsSaving(false);
          clearChatState(companyId, departmentId);
          onComplete();
          return;
        }

        // COMPANY SETUP: Original company-level saving logic
        const { data: existingModule } = await supabase
          .from("company_modules")
          .select("id, settings")
          .eq("company_id", companyId)
          .eq("module_type", "IK_HMS")
          .maybeSingle();

        let moduleId: string;

        if (existingModule) {
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

        // Save to standard company tables
        try {
          if (data.goals?.length > 0) {
            await supabase
              .from("company_goals")
              .delete()
              .eq("company_id", companyId)
              .eq("is_predefined", true);
            
            for (const goal of data.goals) {
              await supabase.from("company_goals").insert({
                company_id: companyId,
                goal_text: goal,
                is_predefined: true,
              });
            }
          }

          if (data.organization) {
            let orgContent: string;
            if (data.organization.roles && Array.isArray(data.organization.roles)) {
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

          if (data.risks?.length > 0) {
            const { data: existingRisks } = await supabase
              .from("company_risk_assessments")
              .select("risks")
              .eq("company_id", companyId)
              .single();
            
            const userRisks = (existingRisks?.risks as Array<Record<string, unknown>> || [])
              .filter((r) => !r.is_ai_generated);
            
            await supabase.from("company_risk_assessments").upsert({
              company_id: companyId,
              risks: [...userRisks, ...transformedRisks],
            });
          }

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

          // Add laws/regulations based on industry and employee count
          const employeeCount = confirmedEmployeeCount || pendingBrregInfo?.employees || 0;
          const industryName = selectedIndustry || pendingBrregInfo?.industry || "";
          const industryCode = pendingBrregInfo?.industryCode || "";
          
          // Base laws that apply to all businesses
          const allLaws: Array<{ law_name: string; category: string; description: string; link: string; is_employee_based?: boolean; employee_threshold?: number }> = [
            { law_name: "Arbeidsmiljøloven", category: "Arbeidsmiljø", description: "Lov om arbeidsmiljø, arbeidstid og stillingsvern", link: "https://lovdata.no/dokument/NL/lov/2005-06-17-62" },
            { law_name: "Internkontrollforskriften", category: "HMS", description: "Krav til systematisk HMS-arbeid i alle virksomheter", link: "https://lovdata.no/dokument/SF/forskrift/1996-12-06-1127" },
            { law_name: "Forskrift om organisering, ledelse og medvirkning", category: "Organisering", description: "Krav til organisering av arbeidet og arbeidstakers medvirkning", link: "https://lovdata.no/dokument/SF/forskrift/2011-12-06-1355" },
            { law_name: "Arbeidsplassforskriften", category: "Arbeidsplass", description: "Krav til utforming og innretning av arbeidsplasser", link: "https://lovdata.no/dokument/SF/forskrift/2011-12-06-1356" },
            { law_name: "Forskrift om utførelse av arbeid", category: "Arbeid", description: "Krav til sikker utførelse av ulike typer arbeid", link: "https://lovdata.no/dokument/SF/forskrift/2011-12-06-1357" },
            { law_name: "Forskrift om tiltaks- og grenseverdier", category: "Grenseverdier", description: "Grenseverdier for forurensninger i arbeidsatmosfæren", link: "https://lovdata.no/dokument/SF/forskrift/2011-12-06-1358" },
            { law_name: "Brann- og eksplosjonsvernloven", category: "Brannvern", description: "Krav til forebygging av brann og eksplosjon", link: "https://lovdata.no/dokument/NL/lov/2002-06-14-20" },
          ];

          // Employee-based requirements
          if (employeeCount >= 5) {
            allLaws.push({ 
              law_name: "Krav om verneombud", 
              category: "Organisering", 
              description: "Virksomheter med 5+ ansatte må ha verneombud", 
              link: "https://lovdata.no/dokument/NL/lov/2005-06-17-62/KAPITTEL_7",
              is_employee_based: true,
              employee_threshold: 5
            });
          }
          if (employeeCount >= 30) {
            allLaws.push({ 
              law_name: "Krav om arbeidsmiljøutvalg (AMU)", 
              category: "Organisering", 
              description: "Virksomheter med 30+ ansatte skal ha AMU", 
              link: "https://lovdata.no/dokument/NL/lov/2005-06-17-62/KAPITTEL_7#§7-1",
              is_employee_based: true,
              employee_threshold: 30
            });
          }

          // Industry-specific laws
          const lowerIndustry = industryName.toLowerCase();
          const isConstruction = lowerIndustry.includes("bygg") || lowerIndustry.includes("anlegg") || industryCode.startsWith("41") || industryCode.startsWith("42") || industryCode.startsWith("43");
          const isFood = lowerIndustry.includes("restaurant") || lowerIndustry.includes("mat") || lowerIndustry.includes("spisested") || industryCode.startsWith("56") || industryCode.startsWith("10");
          const isBeauty = lowerIndustry.includes("frisør") || lowerIndustry.includes("skjønnhet") || industryCode.startsWith("96");
          const isTransport = lowerIndustry.includes("transport") || industryCode.startsWith("49") || industryCode.startsWith("50");
          const isIndustry = lowerIndustry.includes("industri") || lowerIndustry.includes("produksjon") || industryCode.startsWith("10") || industryCode.startsWith("25");

          if (isConstruction) {
            allLaws.push(
              { law_name: "Byggherreforskriften", category: "Bygg og anlegg", description: "Krav til sikkerhet, helse og arbeidsmiljø på bygge- eller anleggsplasser", link: "https://lovdata.no/dokument/SF/forskrift/2009-08-03-1028" },
              { law_name: "Forskrift om sikkerhet ved arbeid i og drift av elektriske anlegg", category: "Elektrisitet", description: "Sikkerhetskrav ved elektrisk arbeid", link: "https://lovdata.no/dokument/SF/forskrift/2006-04-28-458" }
            );
          }
          if (isFood) {
            allLaws.push(
              { law_name: "Matloven", category: "Mattrygghet", description: "Krav til trygg mat og produksjon", link: "https://lovdata.no/dokument/NL/lov/2003-12-19-124" },
              { law_name: "Næringsmiddelhygieneforskriften", category: "Mattrygghet", description: "Krav til hygiene i næringsmiddelvirksomheter", link: "https://lovdata.no/dokument/SF/forskrift/2008-12-22-1623" }
            );
          }
          if (isBeauty) {
            allLaws.push(
              { law_name: "Forskrift om hygienekrav for frisør- og hudpleievirksomhet", category: "Hygiene", description: "Hygienekrav for frisør, hudpleie og lignende", link: "https://lovdata.no/dokument/SF/forskrift/1998-06-06-581" }
            );
          }
          if (isTransport) {
            allLaws.push(
              { law_name: "Vegtrafikkloven", category: "Transport", description: "Regler for trafikk og kjøretøy", link: "https://lovdata.no/dokument/NL/lov/1965-06-18-4" },
              { law_name: "Yrkestransportforskriften", category: "Transport", description: "Krav til yrkestransport", link: "https://lovdata.no/dokument/SF/forskrift/2003-03-26-401" }
            );
          }
          if (isIndustry) {
            allLaws.push(
              { law_name: "Maskinforskriften", category: "Maskiner", description: "Krav til maskiner og sikkerhetsutstyr", link: "https://lovdata.no/dokument/SF/forskrift/2009-05-20-544" },
              { law_name: "Forskrift om stillaser, stiger og arbeid på tak m.m.", category: "Arbeidsutstyr", description: "Sikkerhetskrav for arbeid i høyden", link: "https://lovdata.no/dokument/SF/forskrift/2005-10-14-1229" }
            );
          }

          // Check if laws already exist
          const { data: existingLaws } = await supabase
            .from("company_laws_regulations")
            .select("id")
            .eq("company_id", companyId)
            .limit(1);

          if (!existingLaws || existingLaws.length === 0) {
            // Insert laws
            await supabase.from("company_laws_regulations").insert(
              allLaws.map(law => ({
                company_id: companyId,
                law_name: law.law_name,
                category: law.category,
                description: law.description,
                link: law.link,
                is_employee_based: law.is_employee_based || false,
                employee_threshold: law.employee_threshold || null,
                is_manually_added: false,
              }))
            );
          }
        } catch (tableError) {
          console.warn("Warning: Could not save to standard tables:", tableError);
        }

        queryClient.invalidateQueries({ queryKey: ["company-goals"] });
        queryClient.invalidateQueries({ queryKey: ["company-organization"] });
        queryClient.invalidateQueries({ queryKey: ["company-risk-assessments"] });
        queryClient.invalidateQueries({ queryKey: ["company-action-plans"] });
        queryClient.invalidateQueries({ queryKey: ["company-routines"] });
        queryClient.invalidateQueries({ queryKey: ["company-modules"] });
        queryClient.invalidateQueries({ queryKey: ["company-laws-regulations"] });

        toast.success("HMS-oppsett fullført!");
        setIsSaving(false);
        clearChatState(companyId, departmentId);
        onComplete();
        return;
        
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
