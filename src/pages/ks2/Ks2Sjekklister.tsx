import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  FileText,
  Library,
  ArrowRight,
  Eye,
  Play,
  Pencil,
  Image as ImageIcon,
  Download,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useKsModule2ProjectTemplates } from "@/hooks/useKsModule2ProjectTemplates";
import { useKsModule2Checklists, KsModule2Checklist } from "@/hooks/useKsModule2Checklists";
import { Ks2ChecklistWizard, PreSelectedTemplate } from "@/components/ks2/Ks2ChecklistWizard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { downloadChecklistPdf } from "@/utils/saveChecklistToDocumentation";
import { useToast } from "@/hooks/use-toast";

export default function Ks2Sjekklister() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"maler" | "pagaende" | "fullforte">("maler");
  const [showWizard, setShowWizard] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [selectedTemplateForWizard, setSelectedTemplateForWizard] = useState<PreSelectedTemplate | null>(null);
  const [existingChecklist, setExistingChecklist] = useState<KsModule2Checklist | null>(null);
  const [viewingChecklist, setViewingChecklist] = useState<KsModule2Checklist | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { checklistTemplates, isLoading: loadingTemplates } = useKsModule2ProjectTemplates(projectId || "");
  const { checklists, isLoading: loadingChecklists, refetch: refetchChecklists, updateChecklist } = useKsModule2Checklists(projectId || "");

  const handleToggleIncludeInReport = async (checklist: KsModule2Checklist) => {
    const newValue = !(checklist.include_in_report ?? true);
    await updateChecklist(checklist.id, { include_in_report: newValue });
    toast({ title: newValue ? "Inkludert i rapport" : "Ekskludert fra rapport" });
  };


  const handleDownloadChecklist = async (checklist: KsModule2Checklist) => {
    if (!profile?.company_id || !projectId) return;
    setIsDownloading(true);
    try {
      const [projectRes, companyRes] = await Promise.all([
        supabase.from("ks_module2_projects").select("*").eq("id", projectId).single(),
        supabase.from("companies").select("*").eq("id", profile.company_id).single(),
      ]);
      if (projectRes.error || companyRes.error) throw new Error("Kunne ikke hente data");
      await downloadChecklistPdf({
        checklist,
        project: projectRes.data as any,
        company: companyRes.data as any,
      });
      toast({ title: "PDF lastet ned" });
    } catch (error) {
      console.error("Error downloading checklist PDF:", error);
      toast({ title: "Feil", description: "Kunne ikke laste ned PDF", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Fullført</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Pågår</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Avvist</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Planlagt</Badge>;
    }
  };

  const filteredTemplates = checklistTemplates.filter(t =>
    t.checklist_template?.template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.checklist_template?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChecklists = checklists.filter(c =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.responsible_user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ongoing = filteredChecklists.filter(c => c.status === "in_progress" || c.status === "planned");
  const completed = filteredChecklists.filter(c => c.status === "completed" || c.status === "rejected");

  const handleWizardClose = (result?: { saved: boolean }) => {
    setShowWizard(false);
    setSelectedTemplateForWizard(null);
    setExistingChecklist(null);
    if (result?.saved) {
      refetchChecklists();
    }
  };

  const handleStartChecklist = (template: any) => {
    setExistingChecklist(null);
    setSelectedTemplateForWizard({
      id: template.admin_checklist_template_id || template.id,
      template_name: template.checklist_template?.template_name,
      category: template.checklist_template?.category,
      description: template.checklist_template?.description,
      checkpoints: template.checklist_template?.checkpoints || [],
    });
    setShowWizard(true);
  };

  const handleContinueChecklist = (checklist: KsModule2Checklist) => {
    setExistingChecklist(checklist);
    setSelectedTemplateForWizard(null);
    setShowWizard(true);
  };

  const renderChecklistRow = (checklist: KsModule2Checklist) => {
    const items = Array.isArray(checklist.checklist_items) ? checklist.checklist_items : [];
    const completedItems = items.filter((item: any) => item.value !== null && item.value !== undefined).length;
    const progress = items.length > 0 ? Math.round((completedItems / items.length) * 100) : checklist.progress_percent || 0;

    return (
      <div
        key={checklist.id}
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {checklist.status === "completed" ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
          ) : (
            <Clock className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{checklist.title}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
              <span>{checklist.template_name}</span>
              {checklist.responsible_user_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {checklist.responsible_user_name}
                </span>
              )}
              {checklist.completed_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(checklist.completed_at), "d. MMM yyyy", { locale: nb })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-8 sm:ml-0">
          {checklist.status === "in_progress" && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          )}
          {getStatusBadge(checklist.status)}
          {checklist.status === "completed" ? (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setViewingChecklist(checklist)}>
                <Eye className="h-4 w-4 mr-1" />
                Se
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleContinueChecklist(checklist)} title="Rediger fullført sjekkliste">
                <Pencil className="h-4 w-4 mr-1" />
                Rediger
              </Button>
              <Button variant="outline" size="sm" disabled={isDownloading} onClick={() => handleDownloadChecklist(checklist)}>
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => handleContinueChecklist(checklist)}>
              <Play className="h-4 w-4 mr-1" />
              {checklist.status === "in_progress" ? "Fortsett" : "Start"}
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loadingTemplates || loadingChecklists) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sjekklister & egenkontroller</h1>
          <p className="text-muted-foreground">Maler, pågående og fullførte kontroller for prosjektet</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/ks/project/${projectId}/maler`)}>
            <Library className="h-4 w-4 mr-2" />
            Velg sjekklister fra malbibliotek
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{checklistTemplates.length}</p>
                <p className="text-sm text-muted-foreground">Aktive maler</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{checklists.filter(c => c.status === 'in_progress' || c.status === 'planned').length}</p>
                <p className="text-sm text-muted-foreground">Pågående</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{checklists.filter(c => c.status === 'completed').length}</p>
                <p className="text-sm text-muted-foreground">Fullførte</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk i sjekklister og maler..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
          <TabsTrigger value="maler">Maler ({filteredTemplates.length})</TabsTrigger>
          <TabsTrigger value="pagaende">Pågående ({ongoing.length})</TabsTrigger>
          <TabsTrigger value="fullforte">Fullførte ({completed.length})</TabsTrigger>
        </TabsList>

        {/* Maler */}
        <TabsContent value="maler" className="mt-4">
          {checklistTemplates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Ingen sjekkliste-maler valgt</h3>
                <p className="text-muted-foreground mb-4">
                  Gå til Malbibliotek for å velge hvilke sjekklister som skal brukes i dette prosjektet
                </p>
                <Button onClick={() => navigate(`/ks/project/${projectId}/maler`)}>
                  <Library className="h-4 w-4 mr-2" />
                  Gå til Malbibliotek
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const checkpoints = Array.isArray(template.checklist_template?.checkpoints)
                  ? template.checklist_template.checkpoints
                  : [];

                return (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                          <ClipboardList className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium truncate">{template.checklist_template?.template_name}</h4>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {template.checklist_template?.category}
                          </Badge>
                        </div>
                      </div>
                      {template.checklist_template?.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {template.checklist_template.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mb-3">
                        {checkpoints.length} kontrollpunkter
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewTemplate(template)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Vis
                        </Button>
                        <Button size="sm" className="flex-1" onClick={() => handleStartChecklist(template)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Pågående */}
        <TabsContent value="pagaende" className="mt-4">
          {ongoing.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen pågående sjekklister</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">{ongoing.map(renderChecklistRow)}</div>
          )}
        </TabsContent>

        {/* Fullførte */}
        <TabsContent value="fullforte" className="mt-4">
          {completed.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen fullførte sjekklister ennå</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">{completed.map(renderChecklistRow)}</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.checklist_template?.template_name}</DialogTitle>
            <DialogDescription>
              {previewTemplate?.checklist_template?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge>{previewTemplate?.checklist_template?.category}</Badge>
              {previewTemplate?.checklist_template?.version && (
                <Badge variant="outline">v{previewTemplate?.checklist_template?.version}</Badge>
              )}
            </div>
            <div>
              <h4 className="font-medium mb-2">Kontrollpunkter</h4>
              <div className="space-y-2">
                {Array.isArray(previewTemplate?.checklist_template?.checkpoints) &&
                  previewTemplate.checklist_template.checkpoints.map((cp: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground text-sm">{idx + 1}.</span>
                      <span className="text-sm">{cp.checkpoint_text || cp.text || cp.label || (typeof cp === 'string' ? cp : 'Kontrollpunkt')}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Checklist Dialog */}
      <Dialog open={!!viewingChecklist} onOpenChange={() => setViewingChecklist(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingChecklist?.title}</DialogTitle>
          </DialogHeader>
          {viewingChecklist && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge>{viewingChecklist.template_name}</Badge>
                {getStatusBadge(viewingChecklist.status)}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto gap-2"
                  disabled={isDownloading}
                  onClick={() => handleDownloadChecklist(viewingChecklist)}
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Last ned PDF
                </Button>
              </div>

              {viewingChecklist.responsible_user_name && (
                <p className="text-sm text-muted-foreground">
                  Ansvarlig: {viewingChecklist.responsible_user_name}
                </p>
              )}

              {viewingChecklist.completed_at && (
                <p className="text-sm text-muted-foreground">
                  Fullført: {format(new Date(viewingChecklist.completed_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                </p>
              )}

              <div>
                <h4 className="font-medium mb-2">Kontrollpunkter</h4>
                <div className="space-y-2">
                  {Array.isArray(viewingChecklist.checklist_items) &&
                    viewingChecklist.checklist_items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground text-sm">{idx + 1}.</span>
                        <div className="flex-1">
                          <span className="text-sm">{item.text}</span>
                          {item.value !== null && item.value !== undefined && (
                            <Badge variant="outline" className="ml-2">
                              {item.value === true ? 'OK' : item.value === false ? 'Ikke OK' : item.value}
                            </Badge>
                          )}
                          {item.comment && (
                            <p className="text-xs text-muted-foreground mt-1">Kommentar: {item.comment}</p>
                          )}
                          {item.photos?.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {item.photos.map((photo: string, pIdx: number) => {
                                const url = photo.startsWith('http') ? photo : supabase.storage.from('ks-module2-checklist-photos').getPublicUrl(photo).data.publicUrl;
                                return (
                                  <a key={pIdx} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                    <img src={url} alt={`Bilde ${pIdx + 1}`} className="h-20 w-20 object-cover rounded border hover:opacity-80 transition-opacity" />
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checklist Wizard */}
      {showWizard && (
        <Ks2ChecklistWizard
          projectId={projectId || ""}
          onClose={handleWizardClose}
          preSelectedTemplate={selectedTemplateForWizard}
          existingChecklist={existingChecklist}
        />
      )}
    </div>
  );
}
