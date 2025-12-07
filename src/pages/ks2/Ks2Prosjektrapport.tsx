import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  FileText,
  Download,
  ClipboardList,
  AlertTriangle,
  Shield,
  FolderOpen,
  Info,
  Loader2,
  HardHat,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useKsModule2Checklists } from "@/hooks/useKsModule2Checklists";
import { useKsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { useKsModule2Uk } from "@/hooks/useKsModule2Uk";
import { useKsModule2Sja } from "@/hooks/useKsModule2Sja";
import { useKsModule2Vernerunder } from "@/hooks/useKsModule2Vernerunder";
import { useKsModule2Routines } from "@/hooks/useKsModule2Routines";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectReportPdf, ReportSections } from "@/utils/ksModule2ProjectReport";
import { toast } from "sonner";

interface ProjectData {
  id: string;
  project_name: string;
  project_number: string;
  address?: string;
  client_name?: string;
  gnr_bnr?: string;
  municipality?: string;
  start_date?: string;
  end_date?: string;
  status: string;
}

export default function Ks2Prosjektrapport() {
  const { projectId } = useParams();
  const { profile, company } = useAuth();
  const { checklists } = useKsModule2Checklists(projectId || null);
  const { avvikList } = useKsModule2Avvik(projectId || null);
  const { ukList } = useKsModule2Uk(projectId || null);
  const { sjaList } = useKsModule2Sja(projectId);
  const { vernerunder } = useKsModule2Vernerunder(projectId);
  const { routines } = useKsModule2Routines(projectId);

  const [isGenerating, setIsGenerating] = useState(false);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  
  const [sections, setSections] = useState<ReportSections>({
    includeProjectInfo: true,
    includeChecklists: true,
    includeChecklistDetails: false,
    includeChecklistPhotos: false,
    includeAvvik: true,
    includeAvvikDetails: false,
    includeAvvikPhotos: false,
    includeUk: true,
    includeUkDetails: false,
    includeSja: true,
    includeSjaDetails: false,
    includeVernerunder: true,
    includeVernerundeDetails: false,
    includeRoutines: true,
    includeDocuments: true,
  });

  // Fetch project info
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      setIsLoadingProject(true);
      try {
        const { data, error } = await supabase
          .from("ks_module2_projects")
          .select("*")
          .eq("id", projectId)
          .single();
        
        if (error) throw error;
        setProject(data);
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error("Kunne ikke hente prosjektdata");
      } finally {
        setIsLoadingProject(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleGenerateReport = async () => {
    if (!project || !projectId) {
      toast.error("Prosjektdata mangler");
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch documents marked for inclusion
      const { data: documents } = await supabase
        .from("ks_module2_project_documents" as any)
        .select("*")
        .eq("project_id", projectId)
        .eq("include_in_report", true);

      const generatedBy = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.email || "Ukjent";

      generateProjectReportPdf({
        project: {
          project_name: project.project_name,
          project_number: project.project_number,
          address: project.address,
          client_name: project.client_name,
          gnr_bnr: project.gnr_bnr,
          municipality: project.municipality,
          start_date: project.start_date,
          end_date: project.end_date,
          status: project.status,
        },
        checklists: checklists.map(c => ({
          id: c.id,
          title: c.title,
          template_name: c.template_name || "Egendefinert",
          status: c.status,
          completed_at: c.completed_at,
          completed_by_name: c.responsible_user_name,
          checkpoints: c.status === "completed" && c.checklist_items?.length 
            ? c.checklist_items.map((item) => ({
                label: item.text || "Sjekkpunkt",
                response: item.value === true ? "OK" : item.value === false ? "Nei" : item.value?.toString() || "-",
                comment: item.comment,
              }))
            : undefined,
        })),
        avvik: avvikList.map(a => ({
          avvik_number: a.avvik_number,
          title: a.title,
          category: a.category,
          severity: a.severity,
          status: a.status,
          discovered_date: a.discovered_date,
          responsible_name: a.responsible_name,
          description: a.description,
          corrective_action: a.corrective_action,
          closed_date: a.closed_at,
          closed_by_name: (a as any).closed_by_name,
        })),
        ukControls: ukList.map(u => ({
          uk_number: u.uk_number,
          control_area: u.control_area,
          status: u.status,
          controller_company: u.controller_company,
          result: u.result,
          description: u.description,
          comments: u.comments,
        })),
        sjaList: sjaList.map(s => ({
          sja_number: s.sja_number,
          title: s.title,
          work_description: s.work_description,
          location: s.location,
          planned_date: s.planned_date,
          responsible_name: s.responsible_name,
          status: s.status,
          overall_risk_level: s.overall_risk_level,
          identified_risks: s.identified_risks,
          risk_reducing_measures: s.risk_reducing_measures,
          completed_at: s.completed_at,
          completed_by_name: s.completed_by_name,
        })),
        vernerunder: vernerunder.map(v => ({
          vernerunde_number: v.vernerunde_number,
          title: v.title,
          scheduled_date: v.scheduled_date,
          completed_date: v.completed_date,
          responsible_name: v.responsible_name,
          status: v.status,
          findings_count: v.findings?.length || 0,
          completed_by_name: v.completed_by_name,
          findings: v.findings?.map((f: any) => ({
            description: f.description || f.finding || "",
            severity: f.severity,
            status: f.status,
            responsible: f.responsible,
          })),
        })),
        routines: routines.map(r => ({
          routine_number: r.routine_number,
          name: r.name,
          description: r.description || undefined,
          category: r.category,
          responsible_role: r.responsible_role || undefined,
          is_document: r.is_document,
          approved_by: r.approved_by || undefined,
          approved_at: r.approved_at || undefined,
        })),
        documents: (documents || []).map((d: any) => ({
          document_name: d.document_name,
          category: d.category,
          uploaded_at: d.created_at,
        })),
        companyName: company?.name || "Ukjent bedrift",
        generatedBy,
      }, sections);

      toast.success("Prosjektrapport generert!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Kunne ikke generere rapport");
    } finally {
      setIsGenerating(false);
    }
  };

  const completedChecklists = checklists.filter(c => c.status === "completed").length;
  const closedAvvik = avvikList.filter(a => a.status === "closed").length;
  const approvedUk = ukList.filter(u => u.status === "approved").length;
  const completedSja = sjaList.filter(s => s.status === "completed").length;
  const completedVernerunder = vernerunder.filter(v => v.status === "completed").length;

  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Prosjektrapport / FDV-pakke</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Generer samlet prosjektdokumentasjon som PDF
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Section Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Velg innhold</CardTitle>
              <CardDescription>
                Velg hvilke seksjoner som skal inkluderes i rapporten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Project Info */}
              <SectionToggle
                icon={Info}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                label="Prosjektinformasjon"
                description="Grunnleggende prosjektdata og status"
                checked={sections.includeProjectInfo}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeProjectInfo: !!checked }))
                }
              />

              {/* Checklists */}
              <div className="space-y-2">
                <SectionToggle
                  icon={ClipboardList}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                  label="Sjekklister og egenkontroller"
                  description={`${completedChecklists} av ${checklists.length} fullført`}
                  checked={sections.includeChecklists}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeChecklists: !!checked }))
                  }
                />
                {sections.includeChecklists && (
                  <div className="ml-14 space-y-2">
                    <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Inkluder sjekkpunktdetaljer</Label>
                        <p className="text-xs text-muted-foreground">
                          Viser alle sjekkpunkter med svar
                        </p>
                      </div>
                      <Switch
                        checked={sections.includeChecklistDetails}
                        onCheckedChange={(checked) => 
                          setSections(s => ({ ...s, includeChecklistDetails: checked }))
                        }
                      />
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Inkluder bilder</Label>
                        <p className="text-xs text-muted-foreground">
                          Legger ved opplastede bilder fra sjekklister
                        </p>
                      </div>
                      <Switch
                        checked={sections.includeChecklistPhotos}
                        onCheckedChange={(checked) => 
                          setSections(s => ({ ...s, includeChecklistPhotos: checked }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Avvik */}
              <div className="space-y-2">
                <SectionToggle
                  icon={AlertTriangle}
                  iconBgColor="bg-red-100"
                  iconColor="text-red-600"
                  label="Avvik"
                  description={`${closedAvvik} av ${avvikList.length} lukket`}
                  checked={sections.includeAvvik}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeAvvik: !!checked }))
                  }
                />
                {sections.includeAvvik && (
                  <div className="ml-14 space-y-2">
                    <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Inkluder beskrivelser og tiltak</Label>
                        <p className="text-xs text-muted-foreground">
                          Viser full beskrivelse og korrigerende tiltak
                        </p>
                      </div>
                      <Switch
                        checked={sections.includeAvvikDetails}
                        onCheckedChange={(checked) => 
                          setSections(s => ({ ...s, includeAvvikDetails: checked }))
                        }
                      />
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Inkluder bilder</Label>
                        <p className="text-xs text-muted-foreground">
                          Legger ved opplastede bilder fra avvik
                        </p>
                      </div>
                      <Switch
                        checked={sections.includeAvvikPhotos}
                        onCheckedChange={(checked) => 
                          setSections(s => ({ ...s, includeAvvikPhotos: checked }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* UK */}
              <div className="space-y-2">
                <SectionToggle
                  icon={Shield}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                  label="Uavhengig kontroll"
                  description={`${approvedUk} av ${ukList.length} godkjent`}
                  checked={sections.includeUk}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeUk: !!checked }))
                  }
                />
                {sections.includeUk && (
                  <div className="ml-14 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Inkluder kommentarer og beskrivelser</Label>
                      <p className="text-xs text-muted-foreground">
                        Viser detaljert kontrollinformasjon
                      </p>
                    </div>
                    <Switch
                      checked={sections.includeUkDetails}
                      onCheckedChange={(checked) => 
                        setSections(s => ({ ...s, includeUkDetails: checked }))
                      }
                    />
                  </div>
                )}
              </div>

              {/* SJA */}
              <div className="space-y-2">
                <SectionToggle
                  icon={HardHat}
                  iconBgColor="bg-amber-100"
                  iconColor="text-amber-600"
                  label="Sikker Jobb Analyse (SJA)"
                  description={`${completedSja} av ${sjaList.length} fullført`}
                  checked={sections.includeSja}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeSja: !!checked }))
                  }
                />
                {sections.includeSja && (
                  <div className="ml-14 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Inkluder risikoanalyse og tiltak</Label>
                      <p className="text-xs text-muted-foreground">
                        Viser identifiserte risikoer og risikoreduserende tiltak
                      </p>
                    </div>
                    <Switch
                      checked={sections.includeSjaDetails}
                      onCheckedChange={(checked) => 
                        setSections(s => ({ ...s, includeSjaDetails: checked }))
                      }
                    />
                  </div>
                )}
              </div>

              {/* Vernerunder */}
              <div className="space-y-2">
                <SectionToggle
                  icon={ShieldCheck}
                  iconBgColor="bg-violet-100"
                  iconColor="text-violet-600"
                  label="Vernerunder"
                  description={`${completedVernerunder} av ${vernerunder.length} fullført`}
                  checked={sections.includeVernerunder}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeVernerunder: !!checked }))
                  }
                />
                {sections.includeVernerunder && (
                  <div className="ml-14 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Inkluder funn og observasjoner</Label>
                      <p className="text-xs text-muted-foreground">
                        Viser alle registrerte funn fra vernerundene
                      </p>
                    </div>
                    <Switch
                      checked={sections.includeVernerundeDetails}
                      onCheckedChange={(checked) => 
                        setSections(s => ({ ...s, includeVernerundeDetails: checked }))
                      }
                    />
                  </div>
                )}
              </div>

              {/* Routines */}
              <SectionToggle
                icon={BookOpen}
                iconBgColor="bg-teal-100"
                iconColor="text-teal-600"
                label="Rutiner"
                description={`${routines.length} rutiner`}
                checked={sections.includeRoutines}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeRoutines: !!checked }))
                }
              />

              {/* Documents */}
              <SectionToggle
                icon={FolderOpen}
                iconBgColor="bg-gray-100"
                iconColor="text-gray-600"
                label="Dokumentoversikt"
                description="Oversikt over prosjektdokumenter"
                checked={sections.includeDocuments}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeDocuments: !!checked }))
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary and Generate */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sammendrag</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <SummaryRow label="Sjekklister" count={checklists.length} />
                <SummaryRow label="Avvik" count={avvikList.length} />
                <SummaryRow label="UK-kontroller" count={ukList.length} />
                <SummaryRow label="SJA" count={sjaList.length} />
                <SummaryRow label="Vernerunder" count={vernerunder.length} />
                <SummaryRow label="Rutiner" count={routines.length} />
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                Rapporten vil inneholde alle valgte seksjoner med oppsummering og detaljer.
              </div>

              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={handleGenerateReport}
                disabled={isGenerating || !project}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Genererer...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Last ned rapport
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                FDV-dokumentasjon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                FDV-pakken genereres automatisk basert på dokumenter merket med "Inkluder i rapport" i Dokumentasjon-seksjonen.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper components
function SectionToggle({
  icon: Icon,
  iconBgColor,
  iconColor,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBgColor}`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
        </div>
        <div>
          <Label className="font-medium text-sm sm:text-base">{label}</Label>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function SummaryRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant="secondary">{count}</Badge>
    </div>
  );
}
