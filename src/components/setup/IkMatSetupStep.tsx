import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Loader2, Snowflake, Refrigerator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Equipment {
  name: string;
  location: string;
}

interface IkMatSetupStepProps {
  companyId: string;
  onComplete: () => void;
}

export const IkMatSetupStep = ({ companyId, onComplete }: IkMatSetupStepProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form state
  const [businessType, setBusinessType] = useState("");
  const [numberOfEmployees, setNumberOfEmployees] = useState("");
  const [hasCleanZone, setHasCleanZone] = useState(false);
  const [allergens, setAllergens] = useState("");
  const [specificProcesses, setSpecificProcesses] = useState("");
  const [coolers, setCoolers] = useState<Equipment[]>([{ name: "", location: "" }]);
  const [freezers, setFreezers] = useState<Equipment[]>([{ name: "", location: "" }]);

  const addEquipment = (type: 'cooler' | 'freezer') => {
    if (type === 'cooler') {
      setCoolers([...coolers, { name: "", location: "" }]);
    } else {
      setFreezers([...freezers, { name: "", location: "" }]);
    }
  };

  const removeEquipment = (type: 'cooler' | 'freezer', index: number) => {
    if (type === 'cooler') {
      setCoolers(coolers.filter((_, i) => i !== index));
    } else {
      setFreezers(freezers.filter((_, i) => i !== index));
    }
  };

  const updateEquipment = (type: 'cooler' | 'freezer', index: number, field: 'name' | 'location', value: string) => {
    if (type === 'cooler') {
      const updated = [...coolers];
      updated[index][field] = value;
      setCoolers(updated);
    } else {
      const updated = [...freezers];
      updated[index][field] = value;
      setFreezers(updated);
    }
  };

  const handleGenerate = async () => {
    // Validation
    if (!businessType) {
      toast({
        title: "Mangler informasjon",
        description: "Vennligst velg virksomhetstype",
        variant: "destructive",
      });
      return;
    }

    if (!numberOfEmployees) {
      toast({
        title: "Mangler informasjon",
        description: "Vennligst oppgi antall ansatte",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Prepare setup answers
      const setupAnswers = {
        businessType,
        numberOfEmployees: parseInt(numberOfEmployees),
        coolers: coolers.filter(c => c.name && c.location),
        freezers: freezers.filter(f => f.name && f.location),
        hasCleanZone,
        allergens: allergens ? allergens.split(',').map(a => a.trim()).filter(Boolean) : [],
        specificProcesses,
      };

      console.log("Sending setup answers to AI:", setupAnswers);

      // Call edge function to generate content
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-ik-mat-content', {
        body: { setupAnswers }
      });

      if (functionError) {
        console.error("Edge function error:", functionError);
        throw new Error(functionError.message || "Kunne ikke generere innhold");
      }

      if (!functionData?.success) {
        throw new Error(functionData?.error || "Kunne ikke generere innhold");
      }

      const generatedContent = functionData.content;
      console.log("Generated content:", generatedContent);

      // Save generated content to database
      // 1. Save goals
      if (generatedContent.goals && generatedContent.goals.length > 0) {
        const { error: goalsError } = await supabase
          .from('company_goals')
          .insert(
            generatedContent.goals.map((goal: any, index: number) => ({
              company_id: companyId,
              goal_text: goal.goal_text,
              is_predefined: goal.is_predefined || false,
              sort_order: index,
            }))
          );

        if (goalsError) {
          console.error("Error saving goals:", goalsError);
          throw goalsError;
        }
      }

      // 2. Save risk assessment
      if (generatedContent.risks && generatedContent.risks.length > 0) {
        const { error: risksError } = await supabase
          .from('company_risk_assessments')
          .upsert({
            company_id: companyId,
            risks: generatedContent.risks,
          });

        if (risksError) {
          console.error("Error saving risks:", risksError);
          throw risksError;
        }
      }

      // 3. Save routines
      if (generatedContent.routines && generatedContent.routines.length > 0) {
        const { error: routinesError } = await supabase
          .from('company_routines')
          .upsert({
            company_id: companyId,
            routines: generatedContent.routines,
          });

        if (routinesError) {
          console.error("Error saving routines:", routinesError);
          throw routinesError;
        }
      }

      // 4. Save setup answers and generated content in company_modules settings
      const { error: moduleError } = await supabase
        .from('company_modules')
        .update({
          settings: {
            setupAnswers: JSON.parse(JSON.stringify(setupAnswers)),
            generatedContent: JSON.parse(JSON.stringify(generatedContent)),
            setupCompletedAt: new Date().toISOString(),
          }
        })
        .eq('company_id', companyId)
        .eq('module_type', 'IK_MAT');

      if (moduleError) {
        console.error("Error updating module settings:", moduleError);
        throw moduleError;
      }

      toast({
        title: "Suksess!",
        description: "IK-MAT innhold er generert og lagret. Du kan nå begynne å bruke systemet.",
      });

      onComplete();
    } catch (error) {
      console.error("Error generating IK-MAT content:", error);
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Kunne ikke generere innhold. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>IK-MAT Oppsett</CardTitle>
          <CardDescription>
            Svar på noen spørsmål om din virksomhet, så genererer vi skreddersydd IK-MAT innhold for deg.
            Dette inkluderer mål, risikovurdering, rutiner, temperaturkontrollskjemaer og renholdsplan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Type */}
          <div className="space-y-2">
            <Label htmlFor="businessType">Virksomhetstype *</Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger>
                <SelectValue placeholder="Velg virksomhetstype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="kafe">Kafé</SelectItem>
                <SelectItem value="catering">Catering</SelectItem>
                <SelectItem value="bakeri">Bakeri</SelectItem>
                <SelectItem value="barnehage">Barnehage/skole</SelectItem>
                <SelectItem value="butikk">Butikk/dagligvare</SelectItem>
                <SelectItem value="produksjon">Matproduksjon</SelectItem>
                <SelectItem value="annet">Annet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Number of Employees */}
          <div className="space-y-2">
            <Label htmlFor="employees">Antall ansatte *</Label>
            <Input
              id="employees"
              type="number"
              min="1"
              value={numberOfEmployees}
              onChange={(e) => setNumberOfEmployees(e.target.value)}
              placeholder="F.eks. 5"
            />
          </div>

          {/* Coolers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Refrigerator className="h-4 w-4" />
                Kjølere
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addEquipment('cooler')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Legg til kjøler
              </Button>
            </div>
            {coolers.map((cooler, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  placeholder="Navn (f.eks. Hovedkjøler)"
                  value={cooler.name}
                  onChange={(e) => updateEquipment('cooler', index, 'name', e.target.value)}
                />
                <Input
                  placeholder="Lokasjon (f.eks. Kjøkken)"
                  value={cooler.location}
                  onChange={(e) => updateEquipment('cooler', index, 'location', e.target.value)}
                />
                {coolers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEquipment('cooler', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Freezers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Snowflake className="h-4 w-4" />
                Frysere
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addEquipment('freezer')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Legg til fryser
              </Button>
            </div>
            {freezers.map((freezer, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  placeholder="Navn (f.eks. Hovedfryser)"
                  value={freezer.name}
                  onChange={(e) => updateEquipment('freezer', index, 'name', e.target.value)}
                />
                <Input
                  placeholder="Lokasjon (f.eks. Lager)"
                  value={freezer.location}
                  onChange={(e) => updateEquipment('freezer', index, 'location', e.target.value)}
                />
                {freezers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEquipment('freezer', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Clean Zone */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ren / uren sone</Label>
              <p className="text-sm text-muted-foreground">
                Har dere separate ren og uren sone i produksjonen?
              </p>
            </div>
            <Switch checked={hasCleanZone} onCheckedChange={setHasCleanZone} />
          </div>

          {/* Allergens */}
          <div className="space-y-2">
            <Label htmlFor="allergens">Allergener</Label>
            <Input
              id="allergens"
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              placeholder="F.eks. gluten, melk, egg, nøtter (kommaseparert)"
            />
            <p className="text-sm text-muted-foreground">
              Liste opp allergener dere håndterer, separert med komma
            </p>
          </div>

          {/* Specific Processes */}
          <div className="space-y-2">
            <Label htmlFor="processes">Spesielle prosesser (valgfritt)</Label>
            <Textarea
              id="processes"
              value={specificProcesses}
              onChange={(e) => setSpecificProcesses(e.target.value)}
              placeholder="F.eks. vakuumpakking, sous vide, fermentering..."
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Beskriv eventuelle spesielle matproduksjonsprosesser
            </p>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !businessType || !numberOfEmployees}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Genererer innhold...
                </>
              ) : (
                "Generer IK-MAT innhold"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
