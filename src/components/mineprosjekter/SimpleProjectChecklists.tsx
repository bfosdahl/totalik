import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Eye,
  Play,
  Loader2,
  ClipboardList,
  FolderOpen,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useAdminTemplatesForCustomers } from "@/hooks/useAdminTemplatesForCustomers";
import { useKsModule2Checklists, KsModule2Checklist } from "@/hooks/useKsModule2Checklists";
import { Ks2ChecklistWizard, PreSelectedTemplate } from "@/components/ks2/Ks2ChecklistWizard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface SimpleProjectChecklistsProps {
  projectId: string;
}

const CHECKLIST_CATEGORIES: Record<string, string> = {
  tomrerarbeid: "Tømrerarbeid",
  vatrom: "Våtrom",
  betong: "Betong",
  tak: "Tak",
  fasade: "Fasade",
  grunn: "Grunn og fundamenter",
  sluttkontroll: "Sluttkontroll",
  forprosjekt: "Førprosjekt",
  underentreprenor: "Underentreprenør",
  uk: "Uavhengig kontroll",
  general: "Generelt",
};

export function SimpleProjectChecklists({ projectId }: SimpleProjectChecklistsProps) {
  const { checklistTemplates, isLoading: loadingTemplates } = useAdminTemplatesForCustomers();
  const { checklists, isLoading: loadingChecklists, refetch: refetchChecklists } = useKsModule2Checklists(projectId);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [selectedTemplateForWizard, setSelectedTemplateForWizard] = useState<PreSelectedTemplate | null>(null);
  const [existingChecklist, setExistingChecklist] = useState<KsModule2Checklist | null>(null);
  const [viewingChecklist, setViewingChecklist] = useState<KsModule2Checklist | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

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

  // Group templates by category
  const groupedTemplates = checklistTemplates.reduce((acc, template) => {
    const category = template.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof checklistTemplates>);

  const filteredChecklists = checklists.filter(c =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      id: template.id,
      template_name: template.template_name,
      category: template.category,
      description: template.description,
      checkpoints: template.checkpoints || [],
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

  if (loadingTemplates || loadingChecklists) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold">{checklistTemplates.length}</p>
                <p className="text-xs text-muted-foreground">Maler</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-lg font-bold">{checklists.filter(c => c.status === 'in_progress').length}</p>
                <p className="text-xs text-muted-foreground">Pågår</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-lg font-bold">{checklists.filter(c => c.status === 'completed').length}</p>
                <p className="text-xs text-muted-foreground">Fullførte</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold">{checklists.length}</p>
                <p className="text-xs text-muted-foreground">Totalt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk i sjekklister..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Available Templates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Sjekkliste-maler
            </CardTitle>
            <CardDescription>Velg en mal for å starte ny egenkontroll</CardDescription>
          </div>
          <Button onClick={() => {
            setExistingChecklist(null);
            setSelectedTemplateForWizard(null);
            setShowWizard(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Ny egenkontroll</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.keys(groupedTemplates).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Ingen sjekkliste-maler tilgjengelig</p>
          ) : (
            Object.entries(groupedTemplates)
              .sort(([a], [b]) => (CHECKLIST_CATEGORIES[a] || a).localeCompare(CHECKLIST_CATEGORIES[b] || b))
              .map(([category, templates]) => {
                const isExpanded = expandedCategories[category] ?? true;
                return (
                  <Collapsible
                    key={category}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <FolderOpen className="w-4 h-4 text-primary" />
                        <span className="font-medium flex-1">{CHECKLIST_CATEGORIES[category] || category}</span>
                        <Badge variant="secondary" className="text-xs">{templates.length}</Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 mt-2 space-y-2">
                      {templates.map((template) => {
                        const checkpoints = Array.isArray(template.checkpoints) ? template.checkpoints : [];
                        return (
                          <div
                            key={template.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{template.template_name}</p>
                              <p className="text-xs text-muted-foreground">{checkpoints.length} kontrollpunkter</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewTemplate(template)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStartChecklist(template)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Start
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
          )}
        </CardContent>
      </Card>

      {/* Completed/In-Progress Checklists */}
      {checklists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Utførte sjekklister
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredChecklists.map((checklist) => {
                const items = Array.isArray(checklist.checklist_items) ? checklist.checklist_items : [];
                const completedItems = items.filter((item: any) => item.value !== null && item.value !== undefined).length;
                const progress = items.length > 0 ? Math.round((completedItems / items.length) * 100) : checklist.progress_percent || 0;

                return (
                  <div
                    key={checklist.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
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
                      {checklist.status !== "planned" && checklist.status !== "completed" && (
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
                      {getActionButton(checklist)}
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
            <DialogTitle>{previewTemplate?.template_name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Badge>{previewTemplate?.category}</Badge>
            <div>
              <h4 className="font-medium mb-2">Kontrollpunkter</h4>
              <div className="space-y-2">
                {Array.isArray(previewTemplate?.checkpoints) &&
                  previewTemplate.checkpoints.map((cp: any, idx: number) => (
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
              <div>
                <h4 className="font-medium mb-2">Kontrollpunkter</h4>
                <div className="space-y-2">
                  {Array.isArray(viewingChecklist.checklist_items) && viewingChecklist.checklist_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-muted/50 rounded">
                      <span className="text-sm">{item.text}</span>
                      <span className="text-sm font-medium">
                        {item.value === true ? "✓ Ja" : item.value === false ? "✗ Nei" : item.value ?? "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checklist Wizard */}
      {showWizard && (
        <Ks2ChecklistWizard
          onClose={handleWizardClose}
          projectId={projectId}
          preSelectedTemplate={selectedTemplateForWizard}
          existingChecklist={existingChecklist}
        />
      )}
    </div>
  );
}
