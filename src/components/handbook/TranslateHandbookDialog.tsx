import { useState } from "react";
import { Languages, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LANGUAGE_CONFIG, SupportedLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { 
  CompanyGoal, 
  OrganizationData, 
  RiskAssessmentData, 
  ActionPlanData, 
  RoutinesData 
} from "@/hooks/useSetupWizard";

interface HandbookContent {
  goals?: CompanyGoal[];
  organization?: OrganizationData | null;
  riskAssessment?: RiskAssessmentData | null;
  actionPlan?: ActionPlanData | null;
  routines?: RoutinesData | null;
}

export interface TranslatedHandbookContent {
  goals?: string[];
  organizationDescription?: string;
  organizationRoles?: { title: string; personName: string; description: string }[];
  risks?: { description: string; existing_measures: string; planned_measures: string }[];
  actions?: { action_description: string; risk_description: string; responsible: string; deadline: string; status: string }[];
  routines?: { routine_name: string; purpose: string; responsibility: string; procedure: string }[];
}

interface TranslateHandbookDialogProps {
  content: HandbookContent;
  onTranslated: (translatedContent: TranslatedHandbookContent, language: SupportedLanguage) => void;
  className?: string;
}

export function TranslateHandbookDialog({
  content,
  onTranslated,
  className,
}: TranslateHandbookDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>("no");

  const handleTranslate = async (targetLang: SupportedLanguage) => {
    if (targetLang === "no") {
      // Reset to original Norwegian content
      onTranslated({
        goals: content.goals?.map(g => g.goal_text),
        organizationDescription: content.organization?.description,
        organizationRoles: content.organization?.roles?.map(r => ({
          title: r.title,
          personName: r.personName,
          description: r.description,
        })),
        risks: content.riskAssessment?.risks?.map(r => ({
          description: r.description,
          existing_measures: r.existing_measures,
          planned_measures: r.planned_measures,
        })),
        actions: content.actionPlan?.actions?.map(a => ({
          action_description: a.action_description,
          risk_description: a.risk_description,
          responsible: a.responsible,
          deadline: a.deadline,
          status: a.status,
        })),
        routines: content.routines?.routines?.map(r => ({
          routine_name: r.routine_name,
          purpose: r.purpose,
          responsibility: r.responsibility,
          procedure: r.procedure,
        })),
      }, "no");
      setCurrentLanguage("no");
      setSelectedLanguage(null);
      setIsOpen(false);
      toast.success("Tilbakestilt til norsk");
      return;
    }

    setIsTranslating(true);
    setSelectedLanguage(targetLang);

    try {
      // Prepare content for translation - extract only translatable text
      const contentToTranslate = {
        goals: content.goals?.map(g => g.goal_text) || [],
        organizationDescription: content.organization?.description || "",
        organizationRoles: content.organization?.roles?.map(r => ({
          title: r.title,
          personName: r.personName, // Keep names unchanged
          description: r.description,
        })) || [],
        risks: content.riskAssessment?.risks?.map(r => ({
          description: r.description,
          existing_measures: r.existing_measures,
          planned_measures: r.planned_measures,
        })) || [],
        actions: content.actionPlan?.actions?.map(a => ({
          action_description: a.action_description,
          risk_description: a.risk_description,
          responsible: a.responsible, // Keep names unchanged
          deadline: a.deadline, // Keep dates unchanged
          status: a.status,
        })) || [],
        routines: content.routines?.routines?.map(r => ({
          routine_name: r.routine_name,
          purpose: r.purpose,
          responsibility: r.responsibility,
          procedure: r.procedure,
        })) || [],
      };

      const { data, error } = await supabase.functions.invoke("translate-handbook", {
        body: {
          targetLanguage: targetLang,
          content: contentToTranslate,
        },
      });

      if (error) {
        console.error("Translation error:", error);
        throw new Error(error.message || "Translation failed");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.translatedContent) {
        onTranslated(data.translatedContent, targetLang);
        setCurrentLanguage(targetLang);
        toast.success(`Håndbok oversatt til ${LANGUAGE_CONFIG[targetLang].nativeName}`);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Translation failed:", error);
      toast.error(error instanceof Error ? error.message : "Kunne ikke oversette håndboken");
      setSelectedLanguage(null);
    } finally {
      setIsTranslating(false);
    }
  };

  const availableLanguages = (Object.keys(LANGUAGE_CONFIG) as SupportedLanguage[]).filter(
    lang => lang !== "no" // Norwegian is the original, so we filter it for translation targets
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentLanguage !== "no" 
              ? LANGUAGE_CONFIG[currentLanguage].nativeName 
              : "Oversett håndbok"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            Oversett hele håndboken
          </DialogTitle>
          <DialogDescription>
            Velg språk for å oversette alt innhold i håndboken. Oversettelsen bruker AI 
            og inkluderer mål, organisering, risikoer, tiltak og rutiner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Original language option */}
          <button
            onClick={() => handleTranslate("no")}
            disabled={isTranslating}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors",
              "hover:bg-muted/50",
              currentLanguage === "no" && "bg-primary/10 border-primary/30"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{LANGUAGE_CONFIG.no.flag}</span>
              <div className="text-left">
                <p className="font-medium">{LANGUAGE_CONFIG.no.nativeName}</p>
                <p className="text-xs text-muted-foreground">Original</p>
              </div>
            </div>
            {currentLanguage === "no" && <Check className="h-5 w-5 text-primary" />}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Oversett til</span>
            </div>
          </div>

          {/* Translation target languages */}
          {availableLanguages.map((lang) => {
            const config = LANGUAGE_CONFIG[lang];
            const isActive = currentLanguage === lang;
            const isLoading = isTranslating && selectedLanguage === lang;

            return (
              <button
                key={lang}
                onClick={() => handleTranslate(lang)}
                disabled={isTranslating}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors",
                  "hover:bg-muted/50 disabled:opacity-50",
                  isActive && "bg-primary/10 border-primary/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{config.flag}</span>
                  <div className="text-left">
                    <p className="font-medium">{config.nativeName}</p>
                    <p className="text-xs text-muted-foreground">{config.name}</p>
                  </div>
                </div>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : isActive ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : null}
              </button>
            );
          })}
        </div>

        {isTranslating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Oversetter innhold med AI... Dette kan ta noen sekunder.</span>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-warning/10 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
          <span>
            Oversettelsen vises kun i denne økten. Originalinnholdet på norsk forblir 
            lagret i systemet.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
