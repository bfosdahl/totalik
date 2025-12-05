import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  Building2, 
  AlertTriangle,
  FileSignature,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useKsModule2ShaPlan, DEFAULT_RISK_AREAS, RiskArea } from "@/hooks/useKsModule2ShaPlan";
import { useToast } from "@/hooks/use-toast";

interface Props {
  projectId: string;
  onCancel: () => void;
}

export function Ks2ShaPlanCreate({ projectId, onCancel }: Props) {
  const { createInternalPlan, isSaving } = useKsModule2ShaPlan(projectId);
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  
  // Form state
  const [projectData, setProjectData] = useState({
    project_name: "",
    project_address: "",
    client_name: "",
    client_org_number: "",
    client_contact_person: "",
    sha_coordinator_kp: "",
    sha_coordinator_ku: "",
    contractor_type: "",
    planned_start_date: "",
    planned_end_date: "",
  });

  const [riskAreas, setRiskAreas] = useState<RiskArea[]>(
    DEFAULT_RISK_AREAS.map((ra, index) => ({
      id: `risk-${index}`,
      ...ra,
      checked: false,
      measures: "",
    }))
  );

  const [changeRoutineText, setChangeRoutineText] = useState(
    "Ved endringer i prosjektet som påvirker sikkerhet, helse og arbeidsmiljø, skal SHA-planen revideres. Alle parter skal varsles om endringer og motta oppdatert versjon av planen."
  );

  // Fetch project data on mount
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const { data, error } = await supabase
          .from("ks_module2_projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (error) throw error;

        if (data) {
          setProjectData({
            project_name: data.project_name || "",
            project_address: data.address || "",
            client_name: data.client_name || "",
            client_org_number: data.client_org_number || "",
            client_contact_person: data.client_contact_person || "",
            sha_coordinator_kp: data.sha_coordinator_kp || "",
            sha_coordinator_ku: data.sha_coordinator_ku || "",
            contractor_type: data.contractor_type || "",
            planned_start_date: data.planned_start_date || "",
            planned_end_date: data.planned_end_date || "",
          });
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke hente prosjektdata",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProjectData();
  }, [projectId, toast]);

  const handleRiskAreaChange = (index: number, field: "checked" | "measures", value: boolean | string) => {
    setRiskAreas(prev => prev.map((ra, i) => 
      i === index ? { ...ra, [field]: value } : ra
    ));
  };

  const handleSubmit = async () => {
    const result = await createInternalPlan(projectData);
    if (result) {
      // The hook will refetch and update the parent state
    }
  };

  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Prosjektinfo", icon: Building2 },
    { number: 2, title: "Risikoområder", icon: AlertTriangle },
    { number: 3, title: "Endringsrutine", icon: FileText },
    { number: 4, title: "Oppsummering", icon: FileSignature },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Opprett SHA-plan</h2>
          <p className="text-muted-foreground">Steg {step} av 4</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center">
            <div 
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= s.number 
                  ? "bg-emerald-500 text-white" 
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s.number ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <s.icon className="h-5 w-5" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-full h-1 mx-2 ${
                step > s.number ? "bg-emerald-500" : "bg-muted"
              }`} style={{ width: "60px" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Prosjektinformasjon</CardTitle>
            <CardDescription>Informasjonen er automatisk hentet fra prosjektet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Prosjektnavn</Label>
                <Input 
                  value={projectData.project_name} 
                  onChange={(e) => setProjectData(prev => ({ ...prev, project_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Prosjektadresse</Label>
                <Input 
                  value={projectData.project_address} 
                  onChange={(e) => setProjectData(prev => ({ ...prev, project_address: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Byggherre</Label>
                <Input 
                  value={projectData.client_name} 
                  onChange={(e) => setProjectData(prev => ({ ...prev, client_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Org.nr</Label>
                <Input 
                  value={projectData.client_org_number} 
                  onChange={(e) => setProjectData(prev => ({ ...prev, client_org_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kontaktperson byggherre</Label>
              <Input 
                value={projectData.client_contact_person} 
                onChange={(e) => setProjectData(prev => ({ ...prev, client_contact_person: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Koordinator prosjektering (KP)</Label>
                <Input 
                  value={projectData.sha_coordinator_kp} 
                  onChange={(e) => setProjectData(prev => ({ ...prev, sha_coordinator_kp: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Koordinator utførelse (KU)</Label>
                <Input 
                  value={projectData.sha_coordinator_ku} 
                  onChange={(e) => setProjectData(prev => ({ ...prev, sha_coordinator_ku: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Planlagt oppstart</Label>
                <Input 
                  type="date"
                  value={projectData.planned_start_date} 
                  onChange={(e) => setProjectData(prev => ({ ...prev, planned_start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Planlagt ferdigstillelse</Label>
                <Input 
                  type="date"
                  value={projectData.planned_end_date} 
                  onChange={(e) => setProjectData(prev => ({ ...prev, planned_end_date: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Risikoområder (Byggherreforskriften §8 bokstav c)</CardTitle>
            <CardDescription>Kryss av for relevante risikoområder og beskriv tiltak</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {riskAreas.map((ra, index) => (
              <div key={ra.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id={ra.id}
                    checked={ra.checked}
                    onCheckedChange={(checked) => handleRiskAreaChange(index, "checked", !!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={ra.id} className="cursor-pointer">
                      <Badge variant="outline" className="mr-2">{ra.paragraph})</Badge>
                      {ra.description}
                    </Label>
                  </div>
                </div>
                {ra.checked && (
                  <div className="pl-7">
                    <Label className="text-sm text-muted-foreground">Tiltak for å ivareta risiko:</Label>
                    <Textarea 
                      className="mt-1"
                      placeholder="Beskriv tiltak..."
                      value={ra.measures}
                      onChange={(e) => handleRiskAreaChange(index, "measures", e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Endringsrutine</CardTitle>
            <CardDescription>Rutine for håndtering av endringer i SHA-planen</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              rows={6}
              value={changeRoutineText}
              onChange={(e) => setChangeRoutineText(e.target.value)}
              placeholder="Beskriv rutine for endringer..."
            />
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Oppsummering</CardTitle>
            <CardDescription>Gjennomgå informasjonen før du oppretter SHA-planen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Prosjektinformasjon</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prosjekt:</span>
                  <span>{projectData.project_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Byggherre:</span>
                  <span>{projectData.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KP:</span>
                  <span>{projectData.sha_coordinator_kp || "Ikke angitt"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KU:</span>
                  <span>{projectData.sha_coordinator_ku || "Ikke angitt"}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Identifiserte risikoområder</h4>
              <div className="flex flex-wrap gap-2">
                {riskAreas.filter(ra => ra.checked).map(ra => (
                  <Badge key={ra.id} variant="outline">{ra.paragraph}) {ra.description.substring(0, 30)}...</Badge>
                ))}
                {riskAreas.filter(ra => ra.checked).length === 0 && (
                  <p className="text-sm text-muted-foreground">Ingen risikoområder valgt</p>
                )}
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Merk:</strong> Etter opprettelse kan SHA-planen sendes til signering av byggherre, KP og KU.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => step === 1 ? onCancel() : setStep(step - 1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 1 ? "Avbryt" : "Tilbake"}
        </Button>
        
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} className="bg-emerald-500 hover:bg-emerald-600">
            Neste
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Oppretter...
              </>
            ) : (
              <>
                <FileSignature className="h-4 w-4 mr-2" />
                Opprett SHA-plan
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
