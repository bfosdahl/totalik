import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Info, 
  Plus, 
  Trash2, 
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface RiskAssessmentStepRef {
  save: () => Promise<void>;
  hasData: () => boolean;
}

// Consequence levels based on Arbeidstilsynet methodology
const consequenceLevels = [
  {
    value: 1,
    label: "1 - Ufarlig",
    persons: "Ubetydelige personskader, Fravær < 3 dager",
    environment: "Ubetydelige miljøskader",
    material: "Ubetydelige skader på materiell: Skader under kr. 50.000",
  },
  {
    value: 2,
    label: "2 - Farlig",
    persons: "Mindre personskader, Fravær 3 – 16 dager",
    environment: "Mindre miljøskader",
    material: "Mindre materielle skader: kr. 50.000 - 250.000",
  },
  {
    value: 3,
    label: "3 - Kritisk",
    persons: "Betydelige personskader, Fravær > 16 dager",
    environment: "Betydelige skader på miljøet",
    material: "Betydelige materielle skader: kr. 250.000 - 1.000.000",
  },
  {
    value: 4,
    label: "4 - Meget kritisk",
    persons: "Kan resultere i død",
    environment: "Alvorlige skader på miljøet",
    material: "Alvorlige materielle skader: kr. 1.000.000 - 5.000.000",
  },
  {
    value: 5,
    label: "5 - Katastrofalt",
    persons: "Kan resultere i mange døde",
    environment: "Svært alvorlige skader på miljøet",
    material: "Fullstendig materiell ødeleggelse: over kr. 5.000.000",
  },
];

// Probability levels
const probabilityLevels = [
  { value: 1, label: "1 - Lite sannsynlig", description: "Sjeldnere enn en gang pr. 10 år" },
  { value: 2, label: "2 - Mindre sannsynlig", description: "1 gang hvert 5 - 10 år" },
  { value: 3, label: "3 - Sannsynlig", description: "1 gang hvert 1 - 5 år" },
  { value: 4, label: "4 - Meget sannsynlig", description: "1 - 10 ganger hvert år" },
  { value: 5, label: "5 - Svært sannsynlig", description: "Mer enn 10 ganger i året" },
];

export interface RiskItem {
  id: string;
  description: string;
  consequence: number;
  probability: number;
  existing_measures: string;
  planned_measures: string;
}

export interface RiskAssessmentData {
  risks: RiskItem[];
}

interface RiskAssessmentStepProps {
  existingData?: RiskAssessmentData;
  onSave: (data: RiskAssessmentData) => Promise<void>;
  isSaving: boolean;
}

function getRiskLevel(consequence: number, probability: number): { level: string; color: string; bgColor: string } {
  const score = consequence * probability;
  if (score <= 4) return { level: "Lav", color: "text-success", bgColor: "bg-success/20" };
  if (score <= 9) return { level: "Moderat", color: "text-warning", bgColor: "bg-warning/20" };
  if (score <= 15) return { level: "Høy", color: "text-orange-500", bgColor: "bg-orange-500/20" };
  return { level: "Svært høy", color: "text-destructive", bgColor: "bg-destructive/20" };
}

function RiskMatrix() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="border border-border p-2 bg-muted/50"></th>
            <th colSpan={5} className="border border-border p-2 bg-muted/50 text-center">Konsekvens →</th>
          </tr>
          <tr>
            <th className="border border-border p-2 bg-muted/50">Sannsynlighet ↓</th>
            {[1, 2, 3, 4, 5].map((c) => (
              <th key={c} className="border border-border p-2 bg-muted/50 text-center w-12">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[5, 4, 3, 2, 1].map((p) => (
            <tr key={p}>
              <td className="border border-border p-2 bg-muted/50 font-medium text-center">{p}</td>
              {[1, 2, 3, 4, 5].map((c) => {
                const { bgColor } = getRiskLevel(c, p);
                return (
                  <td key={c} className={cn("border border-border p-2 text-center font-medium", bgColor)}>
                    {c * p}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success/20"></span> 1-4: Lav</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning/20"></span> 5-9: Moderat</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500/20"></span> 10-15: Høy</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/20"></span> 16-25: Svært høy</div>
      </div>
    </div>
  );
}

function HelpSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <span className="font-medium text-sm flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          Veiledning for risikovurdering
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Beskrivelse av konsekvens</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border border-border p-2 text-left">Nivå</th>
                        <th className="border border-border p-2 text-left">Personer</th>
                        <th className="border border-border p-2 text-left">Miljø</th>
                        <th className="border border-border p-2 text-left">Materielle verdier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consequenceLevels.map((level) => (
                        <tr key={level.value}>
                          <td className="border border-border p-2 font-medium">{level.label}</td>
                          <td className="border border-border p-2">{level.persons}</td>
                          <td className="border border-border p-2">{level.environment}</td>
                          <td className="border border-border p-2">{level.material}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Beskrivelse av sannsynlighet</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border border-border p-2 text-left">Nivå</th>
                        <th className="border border-border p-2 text-left">Forklaring</th>
                      </tr>
                    </thead>
                    <tbody>
                      {probabilityLevels.map((level) => (
                        <tr key={level.value}>
                          <td className="border border-border p-2 font-medium">{level.label}</td>
                          <td className="border border-border p-2">{level.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Risikomatrise</h4>
                <p className="text-muted-foreground mb-2">
                  Risiko = Konsekvens × Sannsynlighet
                </p>
                <RiskMatrix />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const RiskAssessmentStep = forwardRef<RiskAssessmentStepRef, RiskAssessmentStepProps>(
  function RiskAssessmentStep({ existingData, onSave, isSaving }, ref) {
    const [risks, setRisks] = useState<RiskItem[]>([]);
    const [newRisk, setNewRisk] = useState<Partial<RiskItem>>({
      description: "",
      consequence: 0,
      probability: 0,
      existing_measures: "",
      planned_measures: "",
    });

    useEffect(() => {
      if (existingData?.risks) {
        setRisks(existingData.risks);
      }
    }, [existingData]);

    const addRisk = () => {
      if (!newRisk.description || !newRisk.consequence || !newRisk.probability) return;

      const risk: RiskItem = {
        id: crypto.randomUUID(),
        description: newRisk.description,
        consequence: newRisk.consequence,
        probability: newRisk.probability,
        existing_measures: newRisk.existing_measures || "",
        planned_measures: newRisk.planned_measures || "",
      };

      setRisks((prev) => [...prev, risk]);
      setNewRisk({
        description: "",
        consequence: 0,
        probability: 0,
        existing_measures: "",
        planned_measures: "",
      });
    };

    const removeRisk = (id: string) => {
      setRisks((prev) => prev.filter((r) => r.id !== id));
    };

    const handleSave = async () => {
      await onSave({ risks });
    };

    const canAddRisk = newRisk.description && newRisk.consequence && newRisk.probability;

    // Expose save method to parent via ref
    useImperativeHandle(ref, () => ({
      save: handleSave,
      hasData: () => risks.length > 0,
    }));

  return (
    <div className="space-y-6">
      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-info/5 border border-info/20">
        <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-info mb-1">Kartlegg farer og vurder risiko</p>
          <p className="text-muted-foreground">
            Identifiser farer i virksomheten og vurder risiko basert på konsekvens og sannsynlighet.
            Bruk Arbeidstilsynets metodikk: Risiko = Konsekvens × Sannsynlighet.
          </p>
        </div>
      </div>

      {/* Help section */}
      <HelpSection />

      {/* Add new risk */}
      <div className="space-y-4 p-4 border border-border rounded-lg bg-secondary/10">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Legg til ny risiko
        </h4>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Beskrivelse av fare/risiko *
            </label>
            <Textarea
              value={newRisk.description}
              onChange={(e) => setNewRisk((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Beskriv faren eller risikoen..."
              className="min-h-[60px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Konsekvens *
              </label>
              <Select
                value={newRisk.consequence?.toString() || ""}
                onValueChange={(v) => setNewRisk((prev) => ({ ...prev, consequence: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg konsekvens" />
                </SelectTrigger>
                <SelectContent>
                  {consequenceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value.toString()}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Sannsynlighet *
              </label>
              <Select
                value={newRisk.probability?.toString() || ""}
                onValueChange={(v) => setNewRisk((prev) => ({ ...prev, probability: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg sannsynlighet" />
                </SelectTrigger>
                <SelectContent>
                  {probabilityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value.toString()}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Eksisterende tiltak
            </label>
            <Input
              value={newRisk.existing_measures}
              onChange={(e) => setNewRisk((prev) => ({ ...prev, existing_measures: e.target.value }))}
              placeholder="Hvilke tiltak er allerede på plass?"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Planlagte tiltak
            </label>
            <Input
              value={newRisk.planned_measures}
              onChange={(e) => setNewRisk((prev) => ({ ...prev, planned_measures: e.target.value }))}
              placeholder="Hvilke tiltak skal iverksettes?"
            />
          </div>

          <Button onClick={addRisk} disabled={!canAddRisk} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Legg til risiko
          </Button>
        </div>
      </div>

      {/* Risk list */}
      {risks.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Registrerte risikoer ({risks.length})
          </h4>

          <div className="space-y-2">
            {risks.map((risk, index) => {
              const riskLevel = getRiskLevel(risk.consequence, risk.probability);
              const score = risk.consequence * risk.probability;

              return (
                <motion.div
                  key={risk.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-border rounded-lg bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-2">{risk.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded bg-muted">
                          K: {risk.consequence}
                        </span>
                        <span className="px-2 py-1 rounded bg-muted">
                          S: {risk.probability}
                        </span>
                        <span className={cn("px-2 py-1 rounded font-medium", riskLevel.bgColor, riskLevel.color)}>
                          Risiko: {score} ({riskLevel.level})
                        </span>
                      </div>
                      {(risk.existing_measures || risk.planned_measures) && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          {risk.existing_measures && (
                            <p><span className="font-medium">Eksisterende tiltak:</span> {risk.existing_measures}</p>
                          )}
                          {risk.planned_measures && (
                            <p><span className="font-medium">Planlagte tiltak:</span> {risk.planned_measures}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeRisk(risk.id)}
                      className="p-1 hover:bg-destructive/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary and save */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {risks.length > 0 ? `${risks.length} risiko(er) registrert` : "Legg til minst én risiko"}
        </div>
        <Button onClick={handleSave} disabled={isSaving || risks.length === 0}>
          {isSaving ? "Lagrer..." : "Lagre risikovurdering"}
        </Button>
      </div>
    </div>
  );
});
