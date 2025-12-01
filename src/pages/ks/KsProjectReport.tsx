import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileDown, CheckSquare, FileText, Shield, Users, AlertTriangle, Building2, ArrowLeft } from "lucide-react";
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
  const navigate = useNavigate();
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

    try {
      toast.info("Genererer PDF...");

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from("ks_projects")
        .select("*")
        .eq("id", selectedProjectId)
        .single();

      if (projectError) throw projectError;

      // Fetch all related data based on selected options
      const fetchPromises: Promise<any>[] = [];
      const dataKeys: string[] = [];

      if (includeOptions.hmsPlan) {
        fetchPromises.push(
          Promise.resolve(supabase.from("ks_project_goals").select("*").eq("project_id", selectedProjectId).order("sort_order")),
          Promise.resolve(supabase.from("ks_project_organization").select("*").eq("project_id", selectedProjectId)),
          Promise.resolve(supabase.from("ks_project_risks").select("*").eq("project_id", selectedProjectId).order("risk_score", { ascending: false })),
          Promise.resolve(supabase.from("ks_project_actions").select("*").eq("project_id", selectedProjectId).order("created_at", { ascending: false }))
        );
        dataKeys.push("goals", "organization", "risks", "actions");
      }

      if (includeOptions.documents) {
        fetchPromises.push(
          Promise.resolve(supabase.from("ks_project_documents").select("*").eq("project_id", selectedProjectId).eq("is_latest_version", true).order("created_at", { ascending: false }))
        );
        dataKeys.push("documents");
      }

      if (includeOptions.checklists) {
        fetchPromises.push(
          Promise.resolve(supabase.from("ks_checklists").select(`
            *,
            template:ks_templates(*),
            items:ks_checklist_items(
              *,
              template_item:ks_template_items(*),
              photos:ks_photos(*)
            )
          `).eq("project_id", selectedProjectId).order("created_at", { ascending: false }))
        );
        dataKeys.push("checklists");
      }

      if (includeOptions.sja) {
        fetchPromises.push(
          Promise.resolve(supabase.from("ks_sja").select("*").eq("project_id", selectedProjectId).order("date", { ascending: false }))
        );
        dataKeys.push("sja");
      }

      if (includeOptions.deviations) {
        fetchPromises.push(
          Promise.resolve(supabase.from("ks_project_deviations").select("*").eq("project_id", selectedProjectId).order("created_at", { ascending: false }))
        );
        dataKeys.push("deviations");
      }

      if (includeOptions.changeOrders) {
        fetchPromises.push(
          Promise.resolve(supabase.from("ks_change_orders").select("*").eq("project_id", selectedProjectId).order("created_at", { ascending: false }))
        );
        dataKeys.push("changeOrders");
      }

      if (includeOptions.safetyRounds) {
        fetchPromises.push(
          Promise.resolve(supabase.from("ks_safety_rounds").select("*").eq("project_id", selectedProjectId).order("round_date", { ascending: false }))
        );
        dataKeys.push("safetyRounds");
      }

      if (includeOptions.hazardousConditions) {
        fetchPromises.push(
          Promise.resolve(supabase.from("ks_hazardous_conditions").select("*").eq("project_id", selectedProjectId).order("discovered_date", { ascending: false }))
        );
        dataKeys.push("hazardousConditions");
      }

      if (includeOptions.subcontractors) {
        fetchPromises.push(
          Promise.resolve(supabase.from("ks_project_subcontractors").select("*").eq("project_id", selectedProjectId).order("created_at", { ascending: false }))
        );
        dataKeys.push("subcontractors");
      }

      if (includeOptions.activityLog) {
        fetchPromises.push(
          Promise.resolve(supabase.from("ks_project_activity_log").select("*").eq("project_id", selectedProjectId).order("created_at", { ascending: false }))
        );
        dataKeys.push("activityLog");
      }

      // Fetch all data
      const results = await Promise.all(fetchPromises);

      // Build data object
      const reportData: any = {
        project: projectData,
      };

      results.forEach((result, index) => {
        const key = dataKeys[index];
        if (key === "organization") {
          reportData[key] = result.data?.[0] || null;
        } else {
          reportData[key] = result.data || [];
        }
      });

      // Generate PDF
      const { generateProjectReport } = await import("@/utils/ksProjectReport");
      generateProjectReport(reportData, includeOptions);

      toast.success("PDF generert!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Kunne ikke generere PDF");
    }
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Prosjektperm / PDF-rapport</h1>
            <p className="text-muted-foreground mt-2">
              Generer komplett dokumentasjon for prosjektet med alle registrerte data
            </p>
          </div>
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