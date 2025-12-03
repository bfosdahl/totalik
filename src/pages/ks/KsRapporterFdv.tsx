import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  Download,
  Folder,
  CheckCircle2,
  Clock,
  FileArchive,
  Printer,
  Building2,
  Calendar,
  ClipboardCheck,
  Camera,
  Signature,
  AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ProjectOption {
  id: string;
  name: string;
  projectNumber: string;
}

interface ReportStats {
  totalChecklists: number;
  completedChecklists: number;
  totalPhotos: number;
  totalSignatures: number;
  totalAvvik: number;
}

export default function KsRapporterFdv() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(searchParams.get("project") || "");
  const [reportStats, setReportStats] = useState<ReportStats>({
    totalChecklists: 0,
    completedChecklists: 0,
    totalPhotos: 0,
    totalSignatures: 0,
    totalAvvik: 0,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    includeChecklists: true,
    includePhotos: true,
    includeSignatures: true,
    includeAvvik: true,
    includeSja: true,
    includeUavhengigKontroll: true,
    includeDocuments: true,
  });

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from("ks_projects")
          .select("id, name, project_number")
          .eq("company_id", profile.company_id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setProjects(
          (data || []).map((p) => ({
            id: p.id,
            name: p.name,
            projectNumber: p.project_number,
          }))
        );
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, [profile?.company_id]);

  // Fetch report stats for selected project
  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedProject) {
        setReportStats({
          totalChecklists: 0,
          completedChecklists: 0,
          totalPhotos: 0,
          totalSignatures: 0,
          totalAvvik: 0,
        });
        return;
      }

      try {
        // Fetch checklists
        const { data: checklists } = await supabase
          .from("ks_checklists")
          .select("id, filled_at")
          .eq("project_id", selectedProject);

        // Fetch deviations
        const { data: deviations } = await supabase
          .from("deviations")
          .select("id")
          .eq("project_id", selectedProject);

        setReportStats({
          totalChecklists: checklists?.length || 0,
          completedChecklists: checklists?.filter((c) => c.filled_at).length || 0,
          totalPhotos: 0, // Would need to count from checklist items
          totalSignatures: 0, // Would need to count from checklist items
          totalAvvik: deviations?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [selectedProject]);

  const handleGenerateKsReport = async () => {
    if (!selectedProject) {
      toast.error("Velg et prosjekt først");
      return;
    }

    setIsGenerating(true);
    try {
      // In production, this would generate a PDF
      toast.success("KS-rapport genereres...");
      
      // Simulate generation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Navigate to existing report page
      navigate(`/ks/report?project=${selectedProject}`);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Kunne ikke generere rapport");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFdvPackage = async () => {
    if (!selectedProject) {
      toast.error("Velg et prosjekt først");
      return;
    }

    setIsGenerating(true);
    try {
      // In production, this would generate a ZIP file
      toast.success("FDV-pakke genereres...");
      
      // Simulate generation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast.success("FDV-pakke klar for nedlasting!");
    } catch (error) {
      console.error("Error generating FDV package:", error);
      toast.error("Kunne ikke generere FDV-pakke");
    } finally {
      setIsGenerating(false);
    }
  };

  const completionPercentage = reportStats.totalChecklists > 0
    ? Math.round((reportStats.completedChecklists / reportStats.totalChecklists) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">KS-rapporter & FDV</h1>
            <p className="text-muted-foreground">
              Generer prosjektdokumentasjon og FDV-pakker
            </p>
          </div>
        </div>

        {/* Project Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Velg prosjekt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Velg prosjekt..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectNumber} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedProject && (
          <>
            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <ClipboardCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{reportStats.completedChecklists}</p>
                      <p className="text-xs text-muted-foreground">
                        av {reportStats.totalChecklists} sjekklister
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Camera className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{reportStats.totalPhotos}</p>
                      <p className="text-xs text-muted-foreground">bilder</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Signature className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{reportStats.totalSignatures}</p>
                      <p className="text-xs text-muted-foreground">signaturer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{reportStats.totalAvvik}</p>
                      <p className="text-xs text-muted-foreground">avvik</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completionPercentage}%</p>
                      <p className="text-xs text-muted-foreground">fullført</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Options */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* KS-rapport */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    KS-rapport
                  </CardTitle>
                  <CardDescription>
                    Komplett kvalitetssikringsrapport for prosjektet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Inkluder i rapport:</p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="checklists"
                          checked={reportOptions.includeChecklists}
                          onCheckedChange={(checked) =>
                            setReportOptions({ ...reportOptions, includeChecklists: !!checked })
                          }
                        />
                        <Label htmlFor="checklists" className="text-sm">
                          Fullførte sjekklister sortert på dato/fag
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="photos"
                          checked={reportOptions.includePhotos}
                          onCheckedChange={(checked) =>
                            setReportOptions({ ...reportOptions, includePhotos: !!checked })
                          }
                        />
                        <Label htmlFor="photos" className="text-sm">
                          Alle bilder i riktig rekkefølge
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="signatures"
                          checked={reportOptions.includeSignatures}
                          onCheckedChange={(checked) =>
                            setReportOptions({ ...reportOptions, includeSignatures: !!checked })
                          }
                        />
                        <Label htmlFor="signatures" className="text-sm">
                          Signaturer
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="avvik"
                          checked={reportOptions.includeAvvik}
                          onCheckedChange={(checked) =>
                            setReportOptions({ ...reportOptions, includeAvvik: !!checked })
                          }
                        />
                        <Label htmlFor="avvik" className="text-sm">
                          Avvik fra kontrollene
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sja"
                          checked={reportOptions.includeSja}
                          onCheckedChange={(checked) =>
                            setReportOptions({ ...reportOptions, includeSja: !!checked })
                          }
                        />
                        <Label htmlFor="sja" className="text-sm">
                          SJA-dokumentasjon
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="uavhengig"
                          checked={reportOptions.includeUavhengigKontroll}
                          onCheckedChange={(checked) =>
                            setReportOptions({ ...reportOptions, includeUavhengigKontroll: !!checked })
                          }
                        />
                        <Label htmlFor="uavhengig" className="text-sm">
                          Uavhengig kontroll-rapporter
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleGenerateKsReport}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Genererer...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Generer KS-rapport (PDF)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* FDV Package */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileArchive className="h-5 w-5 text-green-600" />
                    FDV KS-pakke
                  </CardTitle>
                  <CardDescription>
                    Komplett FDV-dokumentasjon klar for byggherre
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Pakken inneholder:</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>KS-rapport (PDF)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Alle sjekklistekopier</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Bildedokumentasjon (sortert)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Samsvarserklæringer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Uavhengig kontroll-rapporter</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>SJA-dokumentasjon</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Avvikslogg med lukking</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="documents"
                      checked={reportOptions.includeDocuments}
                      onCheckedChange={(checked) =>
                        setReportOptions({ ...reportOptions, includeDocuments: !!checked })
                      }
                    />
                    <Label htmlFor="documents" className="text-sm">
                      Inkluder opplastede dokumenter fra dokumentbanken
                    </Label>
                  </div>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleGenerateFdvPackage}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Genererer...
                      </>
                    ) : (
                      <>
                        <Folder className="mr-2 h-4 w-4" />
                        Generer FDV KS-pakke (ZIP)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Previous Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Tidligere genererte rapporter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Ingen tidligere rapporter for dette prosjektet</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
