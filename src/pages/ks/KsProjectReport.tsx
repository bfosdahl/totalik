import { useState } from "react";
import { FileDown, CheckSquare, FileText, Shield, Users, AlertTriangle, Building2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function KsProjectReport() {
  const { profile } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [includeOptions, setIncludeOptions] = useState({
    projectInfo: true,
    hmsPlan: true,
    documents: true,
    checklists: true,
    sja: true,
    deviations: true,
    changeOrders: true,
    safetyRounds: true,
    hazardousConditions: true,
    subcontractors: true,
    activityLog: true,
  });

  // Fetch all projects for the company
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["ks-projects", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from("ks_projects")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const handleGeneratePDF = async () => {
    if (!selectedProjectId) {
      toast.error("Vennligst velg et prosjekt");
      return;
    }

    toast.info("PDF-generering kommer snart...");
    // TODO: Implement PDF generation with selected options
    console.log("Generating PDF for project:", selectedProjectId);
    console.log("Include options:", includeOptions);
  };

  const toggleOption = (key: keyof typeof includeOptions) => {
    setIncludeOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    { key: "projectInfo", label: "Prosjektinformasjon", icon: Building2, description: "Navn, adresse, kunde, ansvarlige roller" },
    { key: "hmsPlan", label: "HMS-plan", icon: Shield, description: "Mål, organisasjon, risikovurdering, handlingsplan" },
    { key: "documents", label: "Dokumenter", icon: FileText, description: "Tegninger, beskrivelser, SHA-plan, FDV" },
    { key: "checklists", label: "Sjekklister", icon: CheckSquare, description: "Alle kvalitetskontroller og status" },
    { key: "sja", label: "SJA", icon: Shield, description: "Sikker Jobb Analyser" },
    { key: "deviations", label: "Avvik", icon: AlertTriangle, description: "Registrerte avvik og RUH" },
    { key: "changeOrders", label: "Endringsmeldinger", icon: FileText, description: "Endringer og tillegg" },
    { key: "safetyRounds", label: "Vernerunder", icon: Users, description: "Gjennomførte vernerunder" },
    { key: "hazardousConditions", label: "Farlige forhold", icon: AlertTriangle, description: "Registrerte farlige forhold" },
    { key: "subcontractors", label: "Underleverandører", icon: Users, description: "UE-register og dokumentasjon" },
    { key: "activityLog", label: "Tiltakslogg", icon: FileText, description: "Tidslinje over alle hendelser" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prosjektperm / PDF-rapport</h1>
          <p className="text-muted-foreground mt-2">
            Generer komplett dokumentasjon for prosjektet med alle registrerte data
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Project Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Velg prosjekt</CardTitle>
              <CardDescription>Velg hvilket prosjekt du vil generere rapport for</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div>
                  <Label htmlFor="project">Prosjekt</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Velg prosjekt..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                          {project.project_number && ` (${project.project_number})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedProjectId && (
                <div className="pt-4 space-y-3">
                  {projects.find((p) => p.id === selectedProjectId) && (
                    <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                      <div>
                        <p className="font-medium">
                          {projects.find((p) => p.id === selectedProjectId)?.name}
                        </p>
                        <p className="text-muted-foreground">
                          {projects.find((p) => p.id === selectedProjectId)?.client_name || "Ingen kunde"}
                        </p>
                      </div>
                      {projects.find((p) => p.id === selectedProjectId)?.address && (
                        <p className="text-muted-foreground">
                          {projects.find((p) => p.id === selectedProjectId)?.address}
                        </p>
                      )}
                    </div>
                  )}
                  <Button onClick={handleGeneratePDF} className="w-full" size="lg">
                    <FileDown className="mr-2 h-5 w-5" />
                    Generer PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Innhold i rapporten</CardTitle>
              <CardDescription>Velg hvilke seksjoner som skal inkluderes i PDF-en</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div
                      key={section.key}
                      className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => toggleOption(section.key as keyof typeof includeOptions)}
                    >
                      <Checkbox
                        id={section.key}
                        checked={includeOptions[section.key as keyof typeof includeOptions]}
                        onCheckedChange={() => toggleOption(section.key as keyof typeof includeOptions)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <Label
                            htmlFor={section.key}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {section.label}
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                <div className="flex gap-2">
                  <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Profesjonell prosjektdokumentasjon
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Rapporten genereres med alle valgte seksjoner formatert for myndighetskrav og ferdigattest.
                      Inkluderer forside med prosjektinformasjon, innholdsfortegnelse og komplett tidslinje.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}