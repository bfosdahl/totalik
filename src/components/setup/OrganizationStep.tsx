import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { Check, Info, Lightbulb, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface OrganizationStepRef {
  save: () => Promise<void>;
  hasData: () => boolean;
}

// Authentic Norwegian organization examples
const organizationExamples = [
  {
    id: "example1",
    title: "Detaljert organisering",
    sections: [
      {
        heading: "Virksomhetens organisering",
        content: `Daglig leder har det overordnede ansvaret for at gjeldende lover, forskrifter og interne retningslinjer etterleves.
Arbeidsleder og verneombud har ansvar for å iverksette og følge opp nødvendige tiltak innen sine ansvarsområder, og rapporterer fortløpende til daglig leder.
Verneombudet fungerer som arbeidstakernes valgte representant i spørsmål knyttet til arbeidsmiljø og sikkerhet.
Alle ansatte har en plikt til å informere nærmeste leder om forhold som kan påvirke helse, miljø eller sikkerhet, dersom dette ikke kan løses direkte.`,
      },
      {
        heading: "Kompetanse og opplæring",
        content: `Arbeidsgiver og øvrige roller med krav til opplæring har gjennomført nødvendig kursing. Dokumentasjon på kompetanse og fullførte kurs finnes vedlagt på siste side.`,
      },
    ],
  },
  {
    id: "example2",
    title: "Enkel organisering",
    sections: [
      {
        heading: "Organisering av virksomheten",
        content: `Daglig leder har et overordnet ansvar for at de lover og forskrifter virksomheten er underlagt, følges opp.
Arbeidsleder/verneombud har ansvar for å følge opp og iverksette tiltak under sitt område og rapporterer til daglig leder.
Verneombudet er de ansattes representant.
Ansatte har et ansvar for å melde fra til nærmeste overordnende om saker vedrørende Helse, - miljø og sikkerhet som ikke løses direkte.`,
      },
      {
        heading: "Opplæring",
        content: `Arbeidsgiver og andre med krav for opplæring har gjennomført opplæring og dokumentasjon vises på siste side.`,
      },
    ],
  },
];

export interface OrganizationData {
  template_id: string | null;
  custom_content: string;
  is_custom: boolean;
}

interface OrganizationStepProps {
  existingData?: OrganizationData;
  onSave: (data: OrganizationData) => Promise<void>;
  isSaving: boolean;
}

export const OrganizationStep = forwardRef<OrganizationStepRef, OrganizationStepProps>(
  function OrganizationStep({ existingData, onSave, isSaving }, ref) {
    const [selectedExample, setSelectedExample] = useState<string | null>(null);
    const [customContent, setCustomContent] = useState("");
    const [isCustomMode, setIsCustomMode] = useState(false);

    // Initialize from existing data
    useEffect(() => {
      if (existingData) {
        if (existingData.is_custom) {
          setCustomContent(existingData.custom_content);
          setIsCustomMode(true);
        } else if (existingData.template_id) {
          setSelectedExample(existingData.template_id);
        }
      }
    }, [existingData]);

    const selectExample = (exampleId: string) => {
      setSelectedExample(exampleId);
      setIsCustomMode(false);
      setCustomContent("");
    };

    const handleCustomMode = () => {
      setIsCustomMode(true);
      setSelectedExample(null);
    };

    const handleSave = async () => {
      if (isCustomMode && customContent.trim()) {
        await onSave({
          template_id: null,
          custom_content: customContent.trim(),
          is_custom: true,
        });
      } else if (selectedExample) {
        const example = organizationExamples.find((e) => e.id === selectedExample);
        if (example) {
          const fullContent = example.sections
            .map((s) => `${s.heading}\n\n${s.content}`)
            .join("\n\n");
          await onSave({
            template_id: selectedExample,
            custom_content: fullContent,
            is_custom: false,
          });
        }
      }
    };

    const hasSelection = selectedExample || (isCustomMode && customContent.trim());

    // Expose save method to parent via ref
    useImperativeHandle(ref, () => ({
      save: handleSave,
      hasData: () => !!hasSelection,
    }));

  return (
    <div className="space-y-6">
      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-info/5 border border-info/20">
        <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-info mb-1">Dokumenter virksomhetens organisering</p>
          <p className="text-muted-foreground">
            Beskriv hvordan HMS-ansvaret er fordelt i virksomheten. Velg en mal eller 
            skriv din egen beskrivelse av organisasjonsstrukturen.
          </p>
        </div>
      </div>

      {/* Organization examples */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Eksempler på organisering
        </h4>
        
        <div className="space-y-3">
          {organizationExamples.map((example, index) => (
            <motion.button
              key={example.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => selectExample(example.id)}
              className={cn(
                "w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all",
                selectedExample === example.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-secondary/30"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                  selectedExample === example.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {selectedExample === example.id && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm mb-3">{example.title}</p>
                <div className="space-y-3">
                  {example.sections.map((section, sIndex) => (
                    <div key={sIndex} className="space-y-1">
                      <p className="text-xs font-medium text-primary/80 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {section.heading}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom organization */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Eller beskriv din egen organisering
        </h4>
        
        <button
          onClick={handleCustomMode}
          className={cn(
            "w-full p-4 rounded-lg border text-left transition-all",
            isCustomMode
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/30"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                isCustomMode
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {isCustomMode && (
                <Check className="w-3 h-3 text-primary-foreground" />
              )}
            </div>
            <span className="text-sm font-medium">Egen beskrivelse av organisering</span>
          </div>
        </button>

        {isCustomMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <Textarea
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="Beskriv virksomhetens organisering, ansvarsfordeling og opplæringsrutiner..."
              className="min-h-[200px] resize-none"
            />
          </motion.div>
        )}
      </div>

      {/* Summary and save */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {hasSelection ? "Organisering valgt" : "Velg en mal eller skriv egen"}
        </div>
        <Button onClick={handleSave} disabled={isSaving || !hasSelection}>
          {isSaving ? "Lagrer..." : "Lagre organisering"}
        </Button>
      </div>
    </div>
  );
});
