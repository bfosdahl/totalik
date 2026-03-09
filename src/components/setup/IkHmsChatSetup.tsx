import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, Sparkles, RefreshCcw, ClipboardPaste } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { SetupStepIndicator, HMS_SETUP_STEPS } from "./SetupStepIndicator";
import { InlineHmsDeclaration } from "./InlineHmsDeclaration";
import { InlineVerneombudStep } from "./InlineVerneombudStep";
import { checkFallbackResponse } from "@/lib/aiSetupFallback";

interface Message {
  role: "user" | "assistant";
  content: string;
  inlineComponent?: string; // "declaration" | "verneombud" | "laws_summary"
}

export interface IkHmsChatSetupProps {
  companyId: string;
  departmentId?: string;
  onComplete: () => void;
}

// Helper to strip JSON from display content
function getDisplayContent(content: string): string {
  let cleaned = content.replace(/\|\|\|JSON_START\|\|\|[\s\S]*?\|\|\|JSON_END\|\|\|/g, '');
  const jsonStartIndex = cleaned.indexOf('|||JSON_START|||');
  if (jsonStartIndex !== -1) cleaned = cleaned.slice(0, jsonStartIndex);
  cleaned = cleaned.replace(/```json[\s\S]*?```/g, '');
  const incompleteCodeBlock = cleaned.indexOf('```json');
  if (incompleteCodeBlock !== -1 && cleaned.indexOf('```', incompleteCodeBlock + 7) === -1) {
    cleaned = cleaned.slice(0, incompleteCodeBlock);
  }
  if (cleaned.includes('"goals"') && cleaned.includes('"organization"') && cleaned.includes('"risks"')) {
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.slice(0, jsonStart) + cleaned.slice(jsonEnd + 1);
    }
  }
  if (cleaned.includes('"id":') && cleaned.includes('"routine_')) {
    const jsonStart = cleaned.indexOf('{');
    if (jsonStart !== -1) cleaned = cleaned.slice(0, jsonStart);
  }
  return cleaned.trim();
}

function extractJsonFromContent(content: string): string | null {
  const markedMatch = content.match(/\|\|\|JSON_START\|\|\|([\s\S]*?)\|\|\|JSON_END\|\|\|/);
  if (markedMatch) return markedMatch[1].trim();
  const codeMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeMatch) return codeMatch[1].trim();
  if (content.includes('"goals"') && content.includes('"organization"')) {
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) return content.slice(startIndex, endIndex + 1);
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

const CHAT_STATE_KEY = 'ik-hms-chat-setup-v2';

function getStorageKey(companyId: string, departmentId?: string): string {
  return departmentId ? `${CHAT_STATE_KEY}-dept-${departmentId}` : `${CHAT_STATE_KEY}-${companyId}`;
}

interface ChatState {
  messages: Message[];
  currentStep: number;
  completedSteps: string[];
  pendingBrregInfo: BrregInfo | null;
  confirmedEmployeeCount: number | null;
  selectedIndustry: string | null;
  verneombudName: string;
  hasVerneombudExemption: boolean;
}

function loadChatState(companyId: string, departmentId?: string): ChatState | null {
  try {
    const stored = sessionStorage.getItem(getStorageKey(companyId, departmentId));
    if (stored) return JSON.parse(stored);
  } catch (e) { console.error('Failed to load chat state:', e); }
  return null;
}

function saveChatState(companyId: string, departmentId: string | undefined, state: ChatState) {
  try { sessionStorage.setItem(getStorageKey(companyId, departmentId), JSON.stringify(state)); }
  catch (e) { console.error('Failed to save chat state:', e); }
}

function clearChatState(companyId: string, departmentId?: string) {
  try { sessionStorage.removeItem(getStorageKey(companyId, departmentId)); }
  catch (e) { /* ignore */ }
}

export function IkHmsChatSetup({ companyId, departmentId, onComplete }: IkHmsChatSetupProps) {
  const isDepartmentSetup = !!departmentId;
  const initialState = loadChatState(companyId, departmentId);
  const { refreshCompany, company } = useAuth();
  const hasAutoCheckedOrgRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const [messages, setMessages] = useState<Message[]>(
    initialState?.messages ?? [{ role: "assistant", content: "Hei! Jeg er Oppsett-hjelperen 👋\n\nEtt øyeblikk, jeg laster inn informasjon..." }]
  );
  const [currentStep, setCurrentStep] = useState(initialState?.currentStep ?? 0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    new Set(initialState?.completedSteps ?? [])
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(!initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingBrregInfo, setPendingBrregInfo] = useState<BrregInfo | null>(initialState?.pendingBrregInfo ?? null);
  const [confirmedEmployeeCount, setConfirmedEmployeeCount] = useState<number | null>(initialState?.confirmedEmployeeCount ?? null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(initialState?.selectedIndustry ?? null);
  const [verneombudName, setVerneombudName] = useState(initialState?.verneombudName ?? "");
  const [hasVerneombudExemption, setHasVerneombudExemption] = useState(initialState?.hasVerneombudExemption ?? false);
  const [wasInterrupted, setWasInterrupted] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string | undefined>();
  const [showPasteMode, setShowPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);
  const queryClient = useQueryClient();
  const lookupBrregRef = useRef<((orgNumber: string) => Promise<BrregInfo | null>) | null>(null);

  // Persist state
  useEffect(() => {
    if (messages.length === 0) return;
    saveChatState(companyId, departmentId, {
      messages,
      currentStep,
      completedSteps: Array.from(completedSteps),
      pendingBrregInfo,
      confirmedEmployeeCount,
      selectedIndustry,
      verneombudName,
      hasVerneombudExemption,
    });
  }, [messages, currentStep, completedSteps, pendingBrregInfo, confirmedEmployeeCount, selectedIndustry, verneombudName, hasVerneombudExemption, companyId, departmentId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStep]);

  // Cleanup
  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  // When interrupted, check DB for completed fallback response
  useEffect(() => {
    if (!wasInterrupted || isLoading) return;
    
    const checkForFallback = async () => {
      const fallbackContent = await checkFallbackResponse('ik-hms-chat', companyId, messages);
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
          clearChatState(companyId, departmentId);
          await saveSetupData(jsonContent);
        }
      }
    };
    
    checkForFallback();
  }, [wasInterrupted, isLoading, companyId]);

  const completeStep = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const goToNextStep = () => {
    const nextStep = Math.min(currentStep + 1, HMS_SETUP_STEPS.length - 1);
    setCurrentStep(nextStep);
  };

  // Brreg lookup
  const lookupBrreg = async (orgNumber: string): Promise<BrregInfo | null> => {
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ik-hms-chat`;
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ lookupOrgNumber: orgNumber }),
      });
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data as BrregInfo : null;
    } catch { return null; }
  };
  lookupBrregRef.current = lookupBrreg;

  // Save Brreg to company
  const saveBrregToCompany = async (brregInfo: BrregInfo) => {
    try {
      const addressParts = brregInfo.address.split(',');
      const mainAddress = addressParts[0]?.trim() || '';
      const postalPart = addressParts[1]?.trim() || '';
      const postalMatch = postalPart.match(/^(\d{4})\s+(.+)$/);
      const postalCode = postalMatch?.[1] || '';
      const city = postalMatch?.[2] || postalPart;

      const { error } = await supabase.from("companies").update({
        name: brregInfo.name, org_number: brregInfo.orgNumber, address: mainAddress,
        postal_code: postalCode, city: city, employee_count: brregInfo.employees,
      }).eq("id", companyId);

      if (error) { toast.error("Kunne ikke lagre bedriftsinformasjon"); }
      else {
        toast.success("Bedriftsinformasjon oppdatert!");
        queryClient.invalidateQueries({ queryKey: ["company"] });
        await refreshCompany();
      }
    } catch (error) { console.error("Error saving Brreg info:", error); }
  };

  // Initialize - Step 1: Bedriftsinfo
  useEffect(() => {
    if (initialState || hasInitializedRef.current) return;
    if (!company) return;
    hasInitializedRef.current = true;

    if (isDepartmentSetup) {
      setMessages([{ role: "assistant", content: "Hei! Jeg er Oppsett-hjelperen 👋\n\nJeg skal hjelpe deg å sette opp HMS for denne avdelingen.\n\nHvilken bransje passer best?\n\n1. Kontor/Administrasjon\n2. Bygg og anlegg\n3. Industri/Produksjon\n4. Frisør/Skjønnhetspleie\n5. Butikk/Detaljhandel\n6. Restaurant/Spisested\n7. Transport\n8. Renhold\n9. Bilpleie\n\n(Velg 1-9)" }]);
      setIsLoading(false);
      return;
    }

    if (company.org_number && !hasAutoCheckedOrgRef.current) {
      hasAutoCheckedOrgRef.current = true;
      setMessages([{ role: "assistant", content: `Hei! Jeg er Oppsett-hjelperen 👋\n\nJeg skal hjelpe deg med å sette opp internkontrollsystemet for HMS – steg for steg.\n\nEtt øyeblikk, jeg henter informasjon fra Brønnøysundregistrene...` }]);
      
      const doLookup = async () => {
        if (!lookupBrregRef.current) { setIsLoading(false); return; }
        const brregInfo = await lookupBrregRef.current(company.org_number!);
        if (brregInfo) {
          setPendingBrregInfo(brregInfo);
          setMessages(prev => [...prev, { role: "assistant", content: `Jeg fant følgende info:\n\n📋 **Firmanavn:** ${brregInfo.name}\n📍 **Adresse:** ${brregInfo.address}\n🏭 **Bransje:** ${brregInfo.industry}\n👥 **Ansatte:** ${brregInfo.employees}\n\nStemmer dette? (Ja/Nei)` }]);
        } else {
          setMessages(prev => [...prev, { role: "assistant", content: "Kunne ikke hente info. Skriv inn organisasjonsnummeret ditt (9 siffer):" }]);
        }
        setIsLoading(false);
      };
      setTimeout(doLookup, 100);
    } else {
      setMessages([{ role: "assistant", content: "Hei! Jeg er Oppsett-hjelperen 👋\n\nFor å starte trenger jeg organisasjonsnummeret ditt (9 siffer):" }]);
      setIsLoading(false);
    }
  }, [company, initialState, isDepartmentSetup]);

  // Handle step transitions after confirming Brreg
  const handleBrregConfirmed = async (brregInfo: BrregInfo) => {
    await saveBrregToCompany(brregInfo);
    setSelectedIndustry(brregInfo.industry);
    setConfirmedEmployeeCount(brregInfo.employees);
    setPendingBrregInfo(null);
    
    completeStep("bedriftsinfo");

    // Move to step 2: Egenerklæring
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "Flott! Bedriftsinformasjonen er lagret. 🎉\n\n**Steg 2: Egenerklæring om HMS**\n\nFør vi fortsetter må daglig leder signere en egenerklæring om at bedriften jobber systematisk med HMS.",
      inlineComponent: "declaration",
    }]);
    setCurrentStep(1);
    setIsLoading(false);
  };

  // After declaration step
  const handleDeclarationComplete = () => {
    completeStep("egenerklaering");
    
    // Move to step 3: Verneombud
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "✅ Egenerklæring signert!\n\n**Steg 3: Verneombud**\n\nNå må vi avklare verneombud-situasjonen for bedriften.",
      inlineComponent: "verneombud",
    }]);
    setCurrentStep(2);
  };

  const handleDeclarationSkipped = () => {
    completeStep("egenerklaering");
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "OK, du kan signere egenerklæringen senere under HMS Aktiviteter.\n\n**Steg 3: Verneombud**",
      inlineComponent: "verneombud",
    }]);
    setCurrentStep(2);
  };

  // After verneombud step
  const handleVerneombudComplete = (name: string, hasExemption: boolean) => {
    setVerneombudName(name);
    setHasVerneombudExemption(hasExemption);
    completeStep("verneombud");
    
    // Move to step 4: Mål - start AI chat
    setCurrentStep(3);
    setIsLoading(true);
    
    const contextMsg = `Brukeren har valgt bransje: ${selectedIndustry}. Bedriften har ${confirmedEmployeeCount} ansatte. ${name ? `Verneombud: ${name}.` : hasExemption ? 'Bedriften har fritak fra verneombud.' : 'Verneombud er ikke avklart ennå.'} 

NÅVÆRENDE STEG: 4 - Mål for internkontroll.
Foreslå 3-5 brede HMS-mål tilpasset bransjen. Forklar at kunden kan tilpasse målene selv etterpå.`;

    continueWithAIChat(contextMsg, 4);
  };

  const handleVerneombudSkipped = () => {
    completeStep("verneombud");
    setCurrentStep(3);
    setIsLoading(true);
    
    const contextMsg = `Brukeren har valgt bransje: ${selectedIndustry}. Bedriften har ${confirmedEmployeeCount} ansatte. Verneombud er ikke avklart ennå.

NÅVÆRENDE STEG: 4 - Mål for internkontroll.
Foreslå 3-5 brede HMS-mål tilpasset bransjen. Forklar at kunden kan tilpasse målene selv etterpå.`;

    continueWithAIChat(contextMsg, 4);
  };

  // AI chat for steps 4-8
  const continueWithAIChat = async (contextMessage: string, stepNumber: number) => {
    const messagesForAI: Message[] = [...messages, { role: "user", content: contextMessage }];
    
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ik-hms-chat`;
      const { data: { session } } = await supabase.auth.getSession();
      
      abortControllerRef.current = new AbortController();
      isStreamingRef.current = true;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ 
          messages: messagesForAI.filter(m => !m.inlineComponent).map(m => ({ role: m.role, content: m.content })),
          currentStep: stepNumber,
          industry: selectedIndustry,
          employeeCount: confirmedEmployeeCount,
          verneombudName,
          hasVerneombudExemption,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 429) { toast.error("For mange forespørsler. Vent litt."); setIsLoading(false); return; }
      if (response.status === 402) { toast.error("Kreditter oppbrukt."); setIsLoading(false); return; }
      if (!response.ok || !response.body) throw new Error("Failed to start stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantMessage = "";
      let streamDone = false;

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

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
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: "assistant", content: displayContent };
                return newMessages;
              });
            }
          } catch { textBuffer = line + "\n" + textBuffer; break; }
        }
      }

      isStreamingRef.current = false;
      setWasInterrupted(false);

      // Check for JSON (setup complete)
      const jsonContent = extractJsonFromContent(assistantMessage);
      if (jsonContent) {
        await saveSetupData(jsonContent);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
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

  // Handle user send in AI chat steps (4-8)
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userInput = input.trim();
    const userMessage: Message = { role: "user", content: userInput };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLastUserMessage(userInput);
    setWasInterrupted(false);
    isStreamingRef.current = false;

    // Step 1: Check for Brreg confirmation or org number
    if (currentStep === 0) {
      // Smart matching for Brreg confirmation - accept various positive responses
      const lowerInput = userInput.toLowerCase();
      const isPositive = /^(ja|japp|jepp|ok|okei|fint|bra|stemmer|supert|korrekt|riktig|yes|yep|bekreft)$/i.test(lowerInput) 
        || lowerInput.includes('stemmer');
      const isNegative = /^(nei|nope|feil)$/i.test(lowerInput) 
        || lowerInput.includes('stemmer ikke') 
        || lowerInput.includes('er feil');
      
      if (pendingBrregInfo && isPositive) {
        await handleBrregConfirmed(pendingBrregInfo);
        return;
      }

      // Declining Brreg
      if (pendingBrregInfo && isNegative) {
        setPendingBrregInfo(null);
        setMessages(prev => [...prev, { role: "assistant", content: "OK! Skriv inn riktig organisasjonsnummer:" }]);
        setIsLoading(false);
        return;
      }

      // If Brreg info is pending and user provides additional info (e.g. employee count correction),
      // treat it as confirmation with a note
      if (pendingBrregInfo) {
        // Check if user is providing employee count info
        const employeeMatch = userInput.match(/(\d+)\s*(ansatt|person|stk|mann)/i);
        if (employeeMatch) {
          const correctedCount = parseInt(employeeMatch[1]);
          setPendingBrregInfo(prev => prev ? { ...prev, employees: correctedCount } : prev);
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: `Takk! Jeg oppdaterer antall ansatte til ${correctedCount}. Ellers stemmer informasjonen?\n\n📋 **Firmanavn:** ${pendingBrregInfo.name}\n📍 **Adresse:** ${pendingBrregInfo.address}\n🏭 **Bransje:** ${pendingBrregInfo.industry}\n👥 **Ansatte:** ${correctedCount}\n\nStemmer dette nå? (Ja/Nei)` 
          }]);
          setIsLoading(false);
          return;
        }

        // Unrecognized input while Brreg is pending - re-prompt
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `Jeg trenger en bekreftelse på bedriftsinformasjonen over. Stemmer det? Svar **Ja** for å bekrefte, eller **Nei** for å endre.` 
        }]);
        setIsLoading(false);
        return;
      }

      // Org number entered
      const orgMatch = userInput.replace(/[\s.]/g, '').match(/^\d{9}$/);
      if (orgMatch) {
        const brregInfo = await lookupBrreg(userInput);
        if (brregInfo) {
          setPendingBrregInfo(brregInfo);
          setMessages(prev => [...prev, { role: "assistant", content: `Jeg fant:\n\n📋 **Firmanavn:** ${brregInfo.name}\n📍 **Adresse:** ${brregInfo.address}\n🏭 **Bransje:** ${brregInfo.industry}\n👥 **Ansatte:** ${brregInfo.employees}\n\nStemmer dette? (Ja/Nei)` }]);
          setIsLoading(false);
          return;
        }
      }

      // Industry selection for departments
      if (isDepartmentSetup && /^[1-9]$/.test(userInput)) {
        const industryMap: Record<string, string> = { '1': 'Kontor/Administrasjon', '2': 'Bygg og anlegg', '3': 'Industri/Produksjon', '4': 'Frisør/Skjønnhetspleie', '5': 'Butikk/Detaljhandel', '6': 'Restaurant/Spisested', '7': 'Transport', '8': 'Renhold', '9': 'Bilpleie' };
        const industry = industryMap[userInput];
        setSelectedIndustry(industry);
        setConfirmedEmployeeCount(company?.employee_count || 5);
        completeStep("bedriftsinfo");
        completeStep("egenerklaering"); // Skip for departments
        completeStep("verneombud"); // Skip for departments
        setCurrentStep(3);
        
        const contextMsg = `Avdelingsoppsett. Bransje: ${industry}. NÅVÆRENDE STEG: 4 - Mål for internkontroll. Foreslå 3-5 brede HMS-mål tilpasset bransjen.`;
        await continueWithAIChat(contextMsg, 4);
        return;
      }

      // Fallback: prompt for org number
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Vennligst skriv inn organisasjonsnummeret ditt (9 siffer) for å komme i gang:" 
      }]);
      setIsLoading(false);
      return;
    }

    // Steps 4-8: Send to AI with step context
    const stepId = HMS_SETUP_STEPS[currentStep]?.id;
    const stepNumber = currentStep + 1;
    
    // Check if user confirmation means we should advance
    const isConfirmation = /^(ja|ok|okei|fint|bra|stemmer|japp|jepp|supert)$/i.test(userInput);
    
    let stepAdvanceContext = "";
    if (isConfirmation) {
      // Determine which step we're completing
      if (stepId === "maal") {
        completeStep("maal");
        setCurrentStep(4);
        stepAdvanceContext = `Brukeren bekreftet målene. NÅVÆRENDE STEG: 5 - Organisering og ansvar. Definer roller (Daglig leder, HMS-ansvarlig, ${confirmedEmployeeCount && confirmedEmployeeCount >= 5 ? 'Verneombud, ' : ''}Øvrige ansatte) med ansvarsområder. Lag et forslag til organisasjonsplan.`;
      } else if (stepId === "organisering") {
        completeStep("organisering");
        setCurrentStep(5);
        stepAdvanceContext = `Brukeren bekreftet organiseringen. NÅVÆRENDE STEG: 6 - Risikovurdering. Still enkle spørsmål: "Hva anser dere som farekildene i bedriften?" Forklar at farekilder kan være alt fra bruk av verktøy, arbeid i høyden, sittestillinger, luft- og lyskvalitet, eller kjemikalier. Kom med konkrete forslag basert på bransjen ${selectedIndustry}.`;
      } else if (stepId === "risiko") {
        completeStep("risiko");
        setCurrentStep(6);
        stepAdvanceContext = `Brukeren bekreftet risikoene. NÅVÆRENDE STEG: 7 - Handlingsplan. Spør hva de tenker kan gjøres med farekildene de har funnet. Kom med forslag som opplæring, verneutstyr, rutiner osv. Lag handlingsplaner basert på risikoene.`;
      } else if (stepId === "handlingsplan") {
        completeStep("handlingsplan");
        setCurrentStep(7);
        stepAdvanceContext = `Brukeren bekreftet handlingsplanen. NÅVÆRENDE STEG: 8 - Rutiner og prosedyrer. Foreslå standardrutiner tilpasset ${selectedIndustry}. Forklar at kunden kan legge til egne rutiner etterpå.`;
      } else if (stepId === "rutiner") {
        completeStep("rutiner");
        setCurrentStep(8);
        // Step 9: Auto-generate laws
        await handleAutoGenerateLaws();
        return;
      }
    }

    const aiMessage = stepAdvanceContext || userInput;
    await continueWithAIChat(aiMessage, stepNumber);
  };

  // Step 9: Auto-generate laws
  const handleAutoGenerateLaws = async () => {
    completeStep("lover");
    
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "**Steg 9: Lover og forskrifter** ✅\n\nJeg har automatisk lagt til relevante lover og forskrifter basert på bransjen og bedriftsinformasjonen. Du finner oversikten under «Lover og forskrifter» i systemet.\n\n🎉 **Oppsettet er nå fullført!** HMS-systemet ditt er klart til bruk. Du kan se alt i Håndboken og gjøre endringer når som helst.",
    }]);
    
    // The laws will be generated as part of saveSetupData
    // Now trigger the AI to generate the final JSON
    setIsLoading(true);
    
    const finalContext = `ALT ER BEKREFTET. Brukeren har gått gjennom alle 9 steg. GENERER NÅ KOMPLETT JSON med alle data fra samtalen. Bransje: ${selectedIndustry}. Ansatte: ${confirmedEmployeeCount}. Verneombud: ${verneombudName || 'Ikke avklart'}. Fritak: ${hasVerneombudExemption}.

KRITISK: GENERER |||JSON_START||| og |||JSON_END||| blokken NÅ med alle mål, organisering, risikoer, handlingsplaner og rutiner basert på hele samtalen.`;

    await continueWithAIChat(finalContext, 9);
  };

  // Save setup data - reuse existing logic
  const saveSetupData = async (jsonContent: string) => {
    setIsSaving(true);
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const data = JSON.parse(jsonContent);

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

        const transformedRisks = data.risks?.map((risk: Record<string, unknown>, index: number) => {
          const riskId = (risk.id as string) || `ai-risk-${index + 1}`;
          const hasNewFormat = risk.hazard_source && Array.isArray(risk.events) && (risk.events as Array<Record<string, unknown>>).length > 0;
          
          if (hasNewFormat) {
            const events = (risk.events as Array<Record<string, unknown>>).map((event) => ({
              id: (event.id as string) || crypto.randomUUID(),
              description: (event.description as string) || '',
              consequence: typeof event.consequence === 'number' && event.consequence >= 1 && event.consequence <= 5 ? event.consequence : 3,
              probability: typeof event.probability === 'number' && event.probability >= 1 && event.probability <= 5 ? event.probability : 3,
              measures: (event.measures as string) || '',
              responsible: (event.responsible as string) || '',
              deadline: (event.deadline as string) || '',
              status: (event.status as string) || 'planlagt',
            }));
            return { id: riskId, hazard_source: (risk.hazard_source as string) || 'annet', hazard_source_custom: (risk.hazard_source_custom as string) || '', events, created_at: new Date().toISOString(), created_by: 'Oppsett-hjelperen', is_ai_generated: true };
          }
          
          return {
            id: riskId, hazard_source: 'annet', hazard_source_custom: (risk.description as string) || '',
            events: [{ id: crypto.randomUUID(), description: (risk.description as string) || '', consequence: typeof risk.consequence === 'number' ? risk.consequence : 3, probability: typeof risk.probability === 'number' ? risk.probability : 3, measures: [(risk.existing_measures as string) || '', (risk.planned_measures as string) || ''].filter(Boolean).join('. '), responsible: '', deadline: '', status: 'planlagt' as const }],
            created_at: new Date().toISOString(), created_by: 'Oppsett-hjelperen', is_ai_generated: true,
          };
        }) || [];

        const transformedActions = data.actions?.map((action: Record<string, unknown>, index: number) => ({
          ...action, id: action.id || `ai-action-${index + 1}`, is_ai_generated: true,
        })) || [];

        const newSettings = {
          setupCompletedAt: new Date().toISOString(),
          industry: data.industry || selectedIndustry || null,
          verneombudNavn: verneombudName || data.verneombudNavn || '',
          hasVerneombudFritak: hasVerneombudExemption || data.hasVerneombudFritak === true,
          generatedContent: {
            goals: data.goals || [], organization: data.organization || null,
            risks: transformedRisks, actions: transformedActions, routines: transformedRoutines,
            generatedAt: new Date().toISOString(),
          },
        };

        // Department setup
        if (isDepartmentSetup && departmentId) {
          const { data: existingModule } = await supabase.from("company_modules").select("id, settings").eq("company_id", companyId).eq("module_type", `IK_HMS_DEPT_${departmentId}`).maybeSingle();
          if (existingModule) {
            await supabase.from("company_modules").update({ settings: { ...(existingModule.settings as Record<string, unknown>), ...newSettings }, is_active: true }).eq("id", existingModule.id);
          } else {
            await supabase.from("company_modules").insert({ company_id: companyId, module_type: `IK_HMS_DEPT_${departmentId}`, is_active: true, settings: newSettings });
          }

          // Save department tables
          if (data.goals?.length > 0) {
            await supabase.from("department_goals").delete().eq("department_id", departmentId).eq("is_predefined", true);
            for (const goal of data.goals) { await supabase.from("department_goals").insert({ department_id: departmentId, goal_text: goal, is_predefined: true }); }
          }
          if (data.organization) {
            let orgContent = typeof data.organization === 'string' ? data.organization : JSON.stringify(data.organization);
            await supabase.from("department_organization").upsert({ department_id: departmentId, custom_content: orgContent, is_custom: true });
          }
          if (data.risks?.length > 0) {
            const { data: existing } = await supabase.from("department_risk_assessments").select("risks").eq("department_id", departmentId).single();
            const userRisks = (existing?.risks as Array<Record<string, unknown>> || []).filter(r => !r.is_ai_generated);
            await supabase.from("department_risk_assessments").upsert({ department_id: departmentId, risks: [...userRisks, ...transformedRisks] });
          }
          if (data.actions?.length > 0) {
            const { data: existing } = await supabase.from("department_action_plans").select("actions").eq("department_id", departmentId).single();
            const userActions = (existing?.actions as Array<Record<string, unknown>> || []).filter(a => !a.is_ai_generated);
            await supabase.from("department_action_plans").upsert({ department_id: departmentId, actions: [...userActions, ...transformedActions] });
          }
          if (data.routines?.length > 0) {
            const { data: existing } = await supabase.from("department_routines").select("routines").eq("department_id", departmentId).single();
            const userRoutines = (existing?.routines as Array<Record<string, unknown>> || []).filter(r => !r.is_ai_generated);
            await supabase.from("department_routines").upsert({ department_id: departmentId, routines: [...userRoutines, ...transformedRoutines] });
          }

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

        // Company setup
        const { data: existingModule } = await supabase.from("company_modules").select("id, settings").eq("company_id", companyId).eq("module_type", "IK_HMS").maybeSingle();
        if (existingModule) {
          await supabase.from("company_modules").update({ settings: { ...(existingModule.settings as Record<string, unknown>), ...newSettings }, is_active: true }).eq("id", existingModule.id);
        } else {
          await supabase.from("company_modules").insert({ company_id: companyId, module_type: "IK_HMS", is_active: true, settings: newSettings });
        }

        // Save to standard tables
        if (data.goals?.length > 0) {
          await supabase.from("company_goals").delete().eq("company_id", companyId).eq("is_predefined", true);
          for (const goal of data.goals) { await supabase.from("company_goals").insert({ company_id: companyId, goal_text: goal, is_predefined: true }); }
        }
        if (data.organization) {
          let orgContent: string;
          if (data.organization.roles && Array.isArray(data.organization.roles)) {
            orgContent = JSON.stringify({
              roles: data.organization.roles.map((role: Record<string, unknown>, idx: number) => ({
                id: role.id || `role-${idx + 1}`, title: role.title || '', personName: role.personName || '',
                description: role.description || '', sortOrder: role.sortOrder ?? idx,
              })),
              description: data.organization.description || '',
            });
          } else { orgContent = typeof data.organization === 'string' ? data.organization : JSON.stringify(data.organization); }
          await supabase.from("company_organization").upsert({ company_id: companyId, custom_content: orgContent, is_custom: true }, { onConflict: "company_id" });
        }
        if (data.risks?.length > 0) {
          const { data: existing } = await supabase.from("company_risk_assessments").select("risks").eq("company_id", companyId).maybeSingle();
          const userRisks = (existing?.risks as Array<Record<string, unknown>> || []).filter(r => !r.is_ai_generated);
          await supabase.from("company_risk_assessments").upsert({ company_id: companyId, risks: [...userRisks, ...transformedRisks] }, { onConflict: "company_id" });
        }
        if (data.actions?.length > 0) {
          const { data: existing } = await supabase.from("company_action_plans").select("actions").eq("company_id", companyId).maybeSingle();
          const userActions = (existing?.actions as Array<Record<string, unknown>> || []).filter(a => !a.is_ai_generated);
          await supabase.from("company_action_plans").upsert({ company_id: companyId, actions: [...userActions, ...transformedActions] }, { onConflict: "company_id" });
        }
        if (data.routines?.length > 0) {
          const { data: existing } = await supabase.from("company_routines").select("routines").eq("company_id", companyId).maybeSingle();
          const userRoutines = (existing?.routines as Array<Record<string, unknown>> || []).filter(r => !r.is_ai_generated);
          await supabase.from("company_routines").upsert({ company_id: companyId, routines: [...userRoutines, ...transformedRoutines] }, { onConflict: "company_id" });
        }

        // Auto-generate laws (Step 9)
        const employeeCount = confirmedEmployeeCount || 0;
        const industryName = selectedIndustry || "";
        const industryCode = pendingBrregInfo?.industryCode || "";
        
        const allLaws: Array<{ law_name: string; category: string; description: string; link: string; is_employee_based?: boolean; employee_threshold?: number }> = [
          { law_name: "Arbeidsmiljøloven", category: "Arbeidsmiljø", description: "Lov om arbeidsmiljø, arbeidstid og stillingsvern", link: "https://lovdata.no/dokument/NL/lov/2005-06-17-62" },
          { law_name: "Internkontrollforskriften", category: "HMS", description: "Krav til systematisk HMS-arbeid", link: "https://lovdata.no/dokument/SF/forskrift/1996-12-06-1127" },
          { law_name: "Forskrift om organisering, ledelse og medvirkning", category: "Organisering", description: "Krav til organisering av arbeidet", link: "https://lovdata.no/dokument/SF/forskrift/2011-12-06-1355" },
          { law_name: "Arbeidsplassforskriften", category: "Arbeidsplass", description: "Krav til utforming av arbeidsplasser", link: "https://lovdata.no/dokument/SF/forskrift/2011-12-06-1356" },
          { law_name: "Forskrift om utførelse av arbeid", category: "Arbeid", description: "Krav til sikker utførelse av arbeid", link: "https://lovdata.no/dokument/SF/forskrift/2011-12-06-1357" },
          { law_name: "Forskrift om tiltaks- og grenseverdier", category: "Grenseverdier", description: "Grenseverdier for forurensninger", link: "https://lovdata.no/dokument/SF/forskrift/2011-12-06-1358" },
          { law_name: "Brann- og eksplosjonsvernloven", category: "Brannvern", description: "Krav til forebygging av brann", link: "https://lovdata.no/dokument/NL/lov/2002-06-14-20" },
        ];

        if (employeeCount >= 5) allLaws.push({ law_name: "Krav om verneombud", category: "Organisering", description: "Virksomheter med 5+ ansatte må ha verneombud", link: "https://lovdata.no/dokument/NL/lov/2005-06-17-62/KAPITTEL_7", is_employee_based: true, employee_threshold: 5 });
        if (employeeCount >= 30) allLaws.push({ law_name: "Krav om arbeidsmiljøutvalg (AMU)", category: "Organisering", description: "Virksomheter med 30+ ansatte skal ha AMU", link: "https://lovdata.no/dokument/NL/lov/2005-06-17-62/KAPITTEL_7#§7-1", is_employee_based: true, employee_threshold: 30 });

        const lowerIndustry = industryName.toLowerCase();
        if (lowerIndustry.includes("bygg") || lowerIndustry.includes("anlegg") || industryCode.startsWith("41") || industryCode.startsWith("42") || industryCode.startsWith("43")) {
          allLaws.push({ law_name: "Byggherreforskriften", category: "Bygg og anlegg", description: "Krav til sikkerhet på bygge-/anleggsplasser", link: "https://lovdata.no/dokument/SF/forskrift/2009-08-03-1028" });
        }
        if (lowerIndustry.includes("restaurant") || lowerIndustry.includes("mat") || lowerIndustry.includes("spisested")) {
          allLaws.push({ law_name: "Matloven", category: "Mattrygghet", description: "Krav til trygg mat", link: "https://lovdata.no/dokument/NL/lov/2003-12-19-124" });
          allLaws.push({ law_name: "Næringsmiddelhygieneforskriften", category: "Mattrygghet", description: "Krav til hygiene i næringsmiddelvirksomheter", link: "https://lovdata.no/dokument/SF/forskrift/2008-12-22-1623" });
        }
        if (lowerIndustry.includes("frisør") || lowerIndustry.includes("skjønnhet")) {
          allLaws.push({ law_name: "Forskrift om hygienekrav for frisør- og hudpleievirksomhet", category: "Hygiene", description: "Hygienekrav for frisør og hudpleie", link: "https://lovdata.no/dokument/SF/forskrift/1998-06-06-581" });
        }
        if (lowerIndustry.includes("transport")) {
          allLaws.push({ law_name: "Vegtrafikkloven", category: "Transport", description: "Regler for trafikk", link: "https://lovdata.no/dokument/NL/lov/1965-06-18-4" });
        }
        if (lowerIndustry.includes("industri") || lowerIndustry.includes("produksjon")) {
          allLaws.push({ law_name: "Maskinforskriften", category: "Maskiner", description: "Krav til maskiner og sikkerhetsutstyr", link: "https://lovdata.no/dokument/SF/forskrift/2009-05-20-544" });
        }

        const { data: existingLaws } = await supabase.from("company_laws_regulations").select("id").eq("company_id", companyId).limit(1);
        if (!existingLaws || existingLaws.length === 0) {
          await supabase.from("company_laws_regulations").insert(allLaws.map(law => ({
            company_id: companyId, law_name: law.law_name, category: law.category, description: law.description,
            link: law.link, is_employee_based: law.is_employee_based || false,
            employee_threshold: law.employee_threshold || null, is_manually_added: false,
          })));
        }

        // Handle verneombud profile update
        if (verneombudName && verneombudName.trim()) {
          const nameParts = verneombudName.trim().split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');
          if (firstName) {
            let query = supabase.from("profiles").select("id, is_verneombud").eq("company_id", companyId).ilike("first_name", firstName);
            if (lastName) query = query.ilike("last_name", lastName);
            const { data: matchingProfiles } = await query;
            if (matchingProfiles?.length === 1) {
              await supabase.from("profiles").update({ is_verneombud: true }).eq("id", matchingProfiles[0].id);
            }
          }
        }

        queryClient.invalidateQueries({ queryKey: ["company-goals"] });
        queryClient.invalidateQueries({ queryKey: ["company-organization"] });
        queryClient.invalidateQueries({ queryKey: ["company-risk-assessments"] });
        queryClient.invalidateQueries({ queryKey: ["company-action-plans"] });
        queryClient.invalidateQueries({ queryKey: ["company-routines"] });
        queryClient.invalidateQueries({ queryKey: ["company-modules"] });
        queryClient.invalidateQueries({ queryKey: ["company-laws-regulations"] });

        // Track accepted suggestions for learning (option 2)
        try {
          const industryForStats = data.industry || selectedIndustry || "";
          if (industryForStats) {
            const sizeCat = (confirmedEmployeeCount || 0) <= 10 ? 'small' : (confirmedEmployeeCount || 0) <= 50 ? 'medium' : 'large';
            
            const statsEntries: Array<{ industry: string; suggestion_type: string; suggestion_text: string; company_size_category: string }> = [];
            
            if (data.goals && Array.isArray(data.goals)) {
              data.goals.forEach((g: string) => statsEntries.push({ industry: industryForStats, suggestion_type: 'maal', suggestion_text: g, company_size_category: sizeCat }));
            }
            if (data.risks && Array.isArray(data.risks)) {
              data.risks.forEach((r: any) => {
                const desc = r.hazard_source_custom || r.hazard_source || r.description || '';
                if (desc) statsEntries.push({ industry: industryForStats, suggestion_type: 'risiko', suggestion_text: desc, company_size_category: sizeCat });
              });
            }
            if (data.routines && Array.isArray(data.routines)) {
              data.routines.forEach((r: any) => {
                const name = r.routine_name || r.name || '';
                if (name) statsEntries.push({ industry: industryForStats, suggestion_type: 'rutine', suggestion_text: name, company_size_category: sizeCat });
              });
            }
            if (data.actions && Array.isArray(data.actions)) {
              data.actions.forEach((a: any) => {
                const desc = a.action_description || '';
                if (desc) statsEntries.push({ industry: industryForStats, suggestion_type: 'handlingsplan', suggestion_text: desc, company_size_category: sizeCat });
              });
            }

            // Upsert stats - increment times_accepted for existing, insert new
            for (const entry of statsEntries) {
              const { data: existing } = await supabase
                .from('ai_setup_suggestion_stats')
                .select('id, times_suggested, times_accepted')
                .eq('industry', entry.industry)
                .eq('suggestion_type', entry.suggestion_type)
                .eq('suggestion_text', entry.suggestion_text)
                .maybeSingle();

              if (existing) {
                await supabase.from('ai_setup_suggestion_stats').update({
                  times_accepted: existing.times_accepted + 1,
                  times_suggested: existing.times_suggested + 1,
                  company_size_category: entry.company_size_category,
                }).eq('id', existing.id);
              } else {
                await supabase.from('ai_setup_suggestion_stats').insert({
                  industry: entry.industry,
                  suggestion_type: entry.suggestion_type,
                  suggestion_text: entry.suggestion_text,
                  times_suggested: 1,
                  times_accepted: 1,
                  company_size_category: entry.company_size_category,
                });
              }
            }
          }
        } catch (statsError) {
          console.error("Failed to track suggestion stats (non-critical):", statsError);
        }

        toast.success("HMS-oppsett fullført! 🎉");
        setIsSaving(false);
        clearChatState(companyId, departmentId);
        onComplete();
        return;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);
        if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    toast.error(lastError?.message || "Kunne ikke lagre oppsettdata.");
    setIsSaving(false);
  };

  const retryLastMessage = useCallback(async () => {
    if (!lastUserMessage) return;
    setWasInterrupted(false);
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant' && (last.content === '' || last.content.endsWith('...'))) return prev.slice(0, -1);
      return prev;
    });
    setInput(lastUserMessage);
    setTimeout(() => handleSend(), 0);
  }, [lastUserMessage]);

  // Determine if we should show AI chat input (steps 4-8) or step 1 input
  const showChatInput = currentStep === 0 || (currentStep >= 3 && currentStep <= 7);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Step indicator */}
      {!isDepartmentSetup && (
        <SetupStepIndicator currentStep={currentStep} completedSteps={completedSteps} />
      )}

      {/* Chat area */}
      <Card className="border-primary/20">
        <ScrollArea className="h-[calc(100vh-380px)] min-h-[300px] max-h-[500px] sm:max-h-[600px] p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {msg.role === "assistant" ? (
                      <div className="text-xs sm:text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Inline components */}
                {msg.inlineComponent === "declaration" && (
                  <div className="mt-3 ml-9 sm:ml-11">
                    <InlineHmsDeclaration
                      companyId={companyId}
                      companyName={company?.name || ""}
                      companyAddress={company?.address || undefined}
                      postalCode={company?.postal_code || undefined}
                      city={company?.city || undefined}
                      onComplete={handleDeclarationComplete}
                      onSkip={handleDeclarationSkipped}
                    />
                  </div>
                )}

                {msg.inlineComponent === "verneombud" && (
                  <div className="mt-3 ml-9 sm:ml-11">
                    <InlineVerneombudStep
                      companyId={companyId}
                      companyName={company?.name || ""}
                      companyAddress={company?.address ? `${company.address}, ${company.postal_code || ""} ${company.city || ""}` : undefined}
                      orgNumber={company?.org_number || undefined}
                      employeeCount={confirmedEmployeeCount || company?.employee_count || 1}
                      onComplete={handleVerneombudComplete}
                      onSkip={handleVerneombudSkipped}
                    />
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

            {wasInterrupted && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 bg-muted rounded-lg border">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Svaret ble avbrutt. Prøv igjen?</p>
                <Button variant="outline" size="sm" onClick={retryLastMessage} className="gap-2">
                  <RefreshCcw className="h-4 w-4" /> Prøv igjen
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </Card>

      {/* Input area */}
      {showChatInput && (
        <div className="space-y-2">
          {showPasteMode ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">📋 Lim inn kravtekst</p>
                <Button variant="ghost" size="sm" onClick={() => setShowPasteMode(false)} className="text-xs">Avbryt</Button>
              </div>
              <Textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Lim inn tekst fra forskrifter, tilsyn e.l." className="min-h-[120px] text-sm" disabled={isLoading || isSaving} />
              <Button onClick={() => { if (pasteText.trim()) { setInput(`Sett opp HMS basert på følgende krav:\n\n${pasteText.trim()}`); setShowPasteMode(false); setPasteText(""); setTimeout(() => handleSend(), 100); } }} disabled={isLoading || isSaving || !pasteText.trim()} className="w-full gap-2">
                <Send className="w-4 h-4" /> Send kravtekst
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {currentStep >= 3 && (
                <Button variant="outline" size="icon" onClick={() => setShowPasteMode(true)} disabled={isLoading || isSaving} title="Lim inn kravtekst" className="shrink-0">
                  <ClipboardPaste className="w-4 h-4" />
                </Button>
              )}
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={currentStep === 0 ? "Skriv organisasjonsnummer..." : "Skriv ditt svar her..."}
                disabled={isLoading || isSaving}
                className="text-base sm:text-sm"
              />
              <Button id="hms-chat-send-btn" onClick={handleSend} disabled={isLoading || isSaving || !input.trim()} size="default" className="px-3 sm:px-4">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      {messages.length <= 2 && (
        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">
          <p className="font-medium mb-2">💡 Slik fungerer oppsettet:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Vi går gjennom 9 steg som fyller ut håndboken din</li>
            <li>Du signerer egenerklæring og avklarer verneombud</li>
            <li>AI-en foreslår mål, risiko, handlingsplaner og rutiner</li>
            <li>Lover og forskrifter legges til automatisk</li>
            <li>Du kan alltid gjøre endringer etterpå</li>
          </ul>
        </div>
      )}
    </div>
  );
}
