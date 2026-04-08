import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ClipboardCheck, Plus, Search, FileText, Calendar, User, ArrowRight, Library, Eye, Play, Download, Image, X } from "lucide-react";
import { useKsModule2ProjectTemplates, ProjectTemplate } from "@/hooks/useKsModule2ProjectTemplates";
import { useKsModule2Checklists, KsModule2Checklist } from "@/hooks/useKsModule2Checklists";
import { Ks2ChecklistWizard, PreSelectedTemplate } from "@/components/ks2/Ks2ChecklistWizard";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadChecklistPdf } from "@/utils/saveChecklistToDocumentation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Ks2Egenkontroller() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTemplateForWizard, setSelectedTemplateForWizard] = useState<PreSelectedTemplate | null>(null);
  const [existingChecklist, setExistingChecklist] = useState<KsModule2Checklist | null>(null);
  const [viewingChecklist, setViewingChecklist] = useState<KsModule2Checklist | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  const { checklistTemplates, isLoading: templatesLoading } = useKsModule2ProjectTemplates(projectId);
  const { checklists, isLoading: checklistsLoading, refetch: refetchChecklists } = useKsModule2Checklists(projectId || "");

  // Fetch project and company data
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !profile?.company_id) return;
      const [projRes, compRes] = await Promise.all([
        supabase.from("ks_module2_projects").select("*").eq("id", projectId).single(),
        supabase.from("companies").select("*").eq("id", profile.company_id).single(),
      ]);
      if (projRes.data) setProjectData(projRes.data);
      if (compRes.data) setCompanyData(compRes.data);
    };
    fetchData();
  }, [projectId, profile?.company_id]);

  const handleDownloadPdf = async () => {
    if (!viewingChecklist || !projectData || !companyData) return;
    setIsDownloading(true);
    try {
      await downloadChecklistPdf({ checklist: viewingChecklist, project: projectData, company: companyData });
      toast.success("PDF lastet ned");
    } catch (e) {
      toast.error("Kunne ikke laste ned PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  // Filter completed checklists
  const filteredChecklists = checklists.filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.responsible_user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500">Fullført</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Pågår</Badge>;
      default:
        return <Badge variant="secondary">Planlagt</Badge>;
    }
  };

  const handleStartChecklist = (template: ProjectTemplate) => {
    setExistingChecklist(null);
    setSelectedTemplateForWizard({
      id: template.admin_checklist_template_id || template.id,
      template_name: template.checklist_template?.template_name || "",
      category: template.checklist_template?.category || "",
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

  const handleViewChecklist = (checklist: KsModule2Checklist) => {
    setViewingChecklist(checklist);
  };

  const handleWizardClose = (result?: { saved: boolean }) => {
    setShowWizard(false);
    setSelectedTemplateForWizard(null);
    setExistingChecklist(null);
    if (result?.saved) {
      refetchChecklists();
    }
  };

  const getActionButton = (checklist: KsModule2Checklist) => {
    switch (checklist.status) {
      case 'completed':
        return (
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewChecklist(checklist); }}>
            <Eye className="h-4 w-4 mr-1" />
            Se
          </Button>
        );
      case 'in_progress':
        return (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); handleContinueChecklist(checklist); }}>
            <Play className="h-4 w-4 mr-1" />
            Fortsett
          </Button>
        );
      default:
        return (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); handleContinueChecklist(checklist); }}>
            <Play className="h-4 w-4 mr-1" />
            Start
          </Button>
        );
    }
  };

  if (templatesLoading || checklistsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Egenkontroller</h2>
          <p className="text-muted-foreground">Utfør og administrer egenkontroller for prosjektet</p>
        </div>
        <Button onClick={() => {
          setSelectedTemplateForWizard(null);
          setExistingChecklist(null);
          setShowWizard(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Ny egenkontroll
        </Button>
      </div>

      {/* Info about Malbibliotek if no templates */}
      {checklistTemplates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen sjekklister lagt til fra Malbibliotek</h3>
            <p className="text-muted-foreground mb-4">
              Du kan fortsatt opprette egenkontroller. Gå til Malbibliotek for å legge til forhåndsdefinerte maler.
            </p>
            <Button variant="outline" onClick={() => navigate(`/ks/project/${projectId}/maler`)}>
              <Library className="h-4 w-4 mr-2" />
              Gå til Malbibliotek
            </Button>
          </CardContent>
        </Card>
      )}

      {checklistTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Tilgjengelige maler fra Malbibliotek ({checklistTemplates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {checklistTemplates.map((pt) => (
                <Card key={pt.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium line-clamp-2">
                        {pt.checklist_template?.template_name}
                      </h4>
                      <Badge variant="outline" className="shrink-0 ml-2">
                        {pt.checklist_template?.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {pt.checklist_template?.description || "Ingen beskrivelse"}
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleStartChecklist(pt)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start egenkontroll
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/ks/project/${projectId}/maler`)}
              >
                <Library className="h-4 w-4 mr-2" />
                Legg til flere maler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Checklists */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Alle egenkontroller ({filteredChecklists.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredChecklists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen egenkontroller ennå</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChecklists.map((checklist) => (
                <Card key={checklist.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{checklist.title}</h4>
                          {getStatusBadge(checklist.status)}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="text-xs">{checklist.template_name}</span>
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
                      {getActionButton(checklist)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Wizard */}
      {showWizard && projectId && (
        <Ks2ChecklistWizard
          projectId={projectId}
          onClose={handleWizardClose}
          preSelectedTemplate={selectedTemplateForWizard}
          existingChecklist={existingChecklist}
        />
      )}

      {/* View Checklist Dialog */}
      <Dialog open={!!viewingChecklist} onOpenChange={() => setViewingChecklist(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewingChecklist?.title}</span>
              {viewingChecklist?.status === 'completed' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadPdf}
                  disabled={isDownloading || !projectData || !companyData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? "Laster..." : "Last ned PDF"}
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewingChecklist && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge>{viewingChecklist.template_name}</Badge>
                {getStatusBadge(viewingChecklist.status)}
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
              
               {(() => {
                const allPhotos = viewingChecklist.checklist_items
                  ?.filter((item: any) => item.photos?.length > 0)
                  .flatMap((item: any, idx: number) => 
                    item.photos.map((p: string) => ({ url: p, itemText: item.text, itemIdx: idx }))
                  ) || [];
                return allPhotos.length > 0 ? (
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                    const el = document.getElementById('checklist-photos-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    <Image className="h-4 w-4" />
                    Se bilder ({allPhotos.length})
                  </Button>
                ) : null;
              })()}

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
                          {item.photos?.length > 0 && (
                            <span className="ml-2 text-xs text-primary inline-flex items-center gap-1">
                              <Image className="h-3 w-3" />
                              {item.photos.length} bilde{item.photos.length > 1 ? 'r' : ''}
                            </span>
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

              {(() => {
                const allPhotos = viewingChecklist.checklist_items
                  ?.filter((item: any) => item.photos?.length > 0)
                  .flatMap((item: any) => 
                    item.photos.map((p: string) => ({ url: p, itemText: item.text }))
                  ) || [];
                if (allPhotos.length === 0) return null;
                return (
                  <div id="checklist-photos-section">
                    <h4 className="font-medium mb-2">Alle bilder ({allPhotos.length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {allPhotos.map((photo: any, pIdx: number) => {
                        const url = photo.url.startsWith('http') ? photo.url : supabase.storage.from('ks-module2-checklist-photos').getPublicUrl(photo.url).data.publicUrl;
                        return (
                          <a key={pIdx} href={url} target="_blank" rel="noopener noreferrer" className="group relative">
                            <img src={url} alt={photo.itemText} className="w-full h-32 object-cover rounded-lg border hover:opacity-90 transition-opacity" />
                            <span className="absolute bottom-1 left-1 right-1 text-[10px] bg-black/60 text-white rounded px-1 py-0.5 truncate">
                              {photo.itemText}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
