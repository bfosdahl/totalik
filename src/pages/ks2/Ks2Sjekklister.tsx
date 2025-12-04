import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Eye
} from "lucide-react";
import { useKsModule2ProjectTemplates } from "@/hooks/useKsModule2ProjectTemplates";
import { useKsModule2Checklists } from "@/hooks/useKsModule2Checklists";
import { Ks2ChecklistWizard } from "@/components/ks2/Ks2ChecklistWizard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Ks2Sjekklister() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [selectedTemplateForWizard, setSelectedTemplateForWizard] = useState<any>(null);
  
  const { checklistTemplates, isLoading: loadingTemplates } = useKsModule2ProjectTemplates(projectId || "");
  const { checklists, isLoading: loadingChecklists, refetch: refetchChecklists } = useKsModule2Checklists(projectId || "");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Fullført</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Pågår</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Ikke startet</Badge>;
    }
  };

  const filteredTemplates = checklistTemplates.filter(t => 
    t.checklist_template?.template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.checklist_template?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChecklists = checklists.filter(c =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWizardClose = () => {
    setShowWizard(false);
    setSelectedTemplateForWizard(null);
    refetchChecklists();
  };

  const handleStartChecklist = (template: any) => {
    setSelectedTemplateForWizard({
      id: template.admin_checklist_template_id,
      template_name: template.checklist_template?.template_name,
      category: template.checklist_template?.category,
      description: template.checklist_template?.description,
      checkpoints: template.checklist_template?.checkpoints || [],
    });
    setShowWizard(true);
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
          <h1 className="text-2xl font-bold">Sjekklister</h1>
          <p className="text-muted-foreground">Maler og utførte sjekklister i prosjektet</p>
        </div>
        <Button onClick={() => navigate(`/ks2/project/${projectId}/maler`)}>
          <Library className="h-4 w-4 mr-2" />
          Gå til Malbibliotek
        </Button>
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
                <p className="text-2xl font-bold">{checklists.filter(c => c.status === 'in_progress').length}</p>
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

      {/* No templates message */}
      {checklistTemplates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Ingen sjekkliste-maler valgt</h3>
            <p className="text-muted-foreground mb-4">
              Gå til Malbibliotek for å velge hvilke sjekklister som skal brukes i dette prosjektet
            </p>
            <Button onClick={() => navigate(`/ks2/project/${projectId}/maler`)}>
              <Library className="h-4 w-4 mr-2" />
              Gå til Malbibliotek
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available Templates from Malbibliotek */}
      {checklistTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Tilgjengelige sjekkliste-maler
                </CardTitle>
                <CardDescription>
                  Sjekklister valgt fra Malbibliotek – klikk "Start" for å utføre en kontroll
                </CardDescription>
              </div>
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ny egenkontroll
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Vis
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleStartChecklist(template)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed/In-Progress Checklists */}
      {checklists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Utførte og pågående sjekklister
            </CardTitle>
            <CardDescription>
              Sjekklister som er startet eller fullført i prosjektet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredChecklists.map((checklist) => {
                const items = Array.isArray(checklist.checklist_items) ? checklist.checklist_items : [];
                const completedItems = items.filter((item: any) => item.status === 'ok' || item.status === 'not_applicable').length;
                const progress = items.length > 0 ? Math.round((completedItems / items.length) * 100) : checklist.progress_percent || 0;

                return (
                  <div 
                    key={checklist.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 cursor-pointer"
                    onClick={() => navigate(`/ks2/project/${projectId}/egenkontroller`)}
                  >
                    <div className="flex items-start gap-3">
                      {checklist.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">{checklist.title}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-1">
                          {checklist.responsible_user_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {checklist.responsible_user_name}
                            </span>
                          )}
                          {checklist.deadline_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(checklist.deadline_date).toLocaleDateString('nb-NO')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-8 sm:ml-0">
                      {checklist.status !== "planned" && (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                      )}
                      {getStatusBadge(checklist.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                      <span className="text-sm">{cp.text || cp.label || cp}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checklist Wizard */}
      {showWizard && (
        <Ks2ChecklistWizard
          projectId={projectId || ""}
          onClose={handleWizardClose}
          preSelectedTemplate={selectedTemplateForWizard}
        />
      )}
    </div>
  );
}
