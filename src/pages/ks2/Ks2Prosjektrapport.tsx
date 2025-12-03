import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  ClipboardList,
  AlertTriangle,
  Shield,
  FolderOpen,
  Info,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useKsModule2Checklists } from "@/hooks/useKsModule2Checklists";
import { useKsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { useKsModule2Uk } from "@/hooks/useKsModule2Uk";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectReportPdf } from "@/utils/ksModule2ProjectReport";
import { toast } from "sonner";

export default function Ks2Prosjektrapport() {
  const { projectId } = useParams();
  const { profile, company } = useAuth();
  const { checklists } = useKsModule2Checklists(projectId || null);
  const { avvikList } = useKsModule2Avvik(projectId || null);
  const { ukList } = useKsModule2Uk(projectId || null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState({
    includeProjectInfo: true,
    includeChecklists: true,
    includeAvvik: true,
    includeUk: true,
    includeDocuments: true,
  });

  const [project, setProject] = useState<any>(null);

  // Fetch project info
  useState(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      const { data } = await supabase
        .from("ks_module2_projects")
        .select("*")
        .eq("id", projectId)
        .single();
      setProject(data);
    };
    fetchProject();
  });

  const handleGenerateReport = async () => {
    if (!project || !projectId) {
      toast.error("Prosjektdata mangler");
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch documents
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
        })),
        avvik: avvikList.map(a => ({
          avvik_number: a.avvik_number,
          title: a.title,
          category: a.category,
          severity: a.severity,
          status: a.status,
          discovered_date: a.discovered_date,
          responsible_name: a.responsible_name,
        })),
        ukControls: ukList.map(u => ({
          uk_number: u.uk_number,
          control_area: u.control_area,
          status: u.status,
          controller_company: u.controller_company,
          result: u.result,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Prosjektrapport / FDV-pakke</h1>
        <p className="text-muted-foreground">
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
            <CardContent className="space-y-4">
              {/* Project Info */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Label className="font-medium">Prosjektinformasjon</Label>
                    <p className="text-sm text-muted-foreground">
                      Grunnleggende prosjektdata og status
                    </p>
                  </div>
                </div>
                <Checkbox
                  checked={sections.includeProjectInfo}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeProjectInfo: !!checked }))
                  }
                />
              </div>

              {/* Checklists */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <ClipboardList className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <Label className="font-medium">Sjekklister og egenkontroller</Label>
                    <p className="text-sm text-muted-foreground">
                      {completedChecklists} av {checklists.length} fullført
                    </p>
                  </div>
                </div>
                <Checkbox
                  checked={sections.includeChecklists}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeChecklists: !!checked }))
                  }
                />
              </div>

              {/* Avvik */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <Label className="font-medium">Avvik</Label>
                    <p className="text-sm text-muted-foreground">
                      {closedAvvik} av {avvikList.length} lukket
                    </p>
                  </div>
                </div>
                <Checkbox
                  checked={sections.includeAvvik}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeAvvik: !!checked }))
                  }
                />
              </div>

              {/* UK */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <Label className="font-medium">Uavhengig kontroll</Label>
                    <p className="text-sm text-muted-foreground">
                      {approvedUk} av {ukList.length} godkjent
                    </p>
                  </div>
                </div>
                <Checkbox
                  checked={sections.includeUk}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeUk: !!checked }))
                  }
                />
              </div>

              {/* Documents */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <FolderOpen className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <Label className="font-medium">Dokumentoversikt</Label>
                    <p className="text-sm text-muted-foreground">
                      Oversikt over prosjektdokumenter
                    </p>
                  </div>
                </div>
                <Checkbox
                  checked={sections.includeDocuments}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeDocuments: !!checked }))
                  }
                />
              </div>
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sjekklister</span>
                  <Badge variant="secondary">{checklists.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avvik</span>
                  <Badge variant="secondary">{avvikList.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">UK-kontroller</span>
                  <Badge variant="secondary">{ukList.length}</Badge>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                Rapporten vil inneholde alle valgte seksjoner med oppsummering og detaljer.
              </div>

              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={handleGenerateReport}
                disabled={isGenerating}
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
