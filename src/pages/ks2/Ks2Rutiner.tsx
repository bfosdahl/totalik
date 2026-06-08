import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Plus, Search, Library, Check, ExternalLink, Eye, UserCheck, Link2, X, ClipboardList, PenLine, Edit, Trash2, Calendar, Hash, FolderInput } from "lucide-react";
import { useKsModule2ProjectTemplates } from "@/hooks/useKsModule2ProjectTemplates";
import { useKsModule2Routines, KsModule2Routine } from "@/hooks/useKsModule2Routines";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { ImportCompanyRoutinesDialog } from "@/components/ks2/ImportCompanyRoutinesDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const ROUTINE_CATEGORIES: Record<string, string> = {
  kvalitetssikring: "Kvalitetssikring - Generelt",
  avvikshåndtering: "Avvikshåndtering",
  dokumentstyring: "Dokumentstyring",
  underentreprenor: "Underentreprenørkontroll",
  hms: "HMS på byggeplass",
  opplæring: "Opplæring",
  kontroll: "Kontroll",
  general: "Generelt",
};

export default function Ks2Rutiner() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingRoutine, setViewingRoutine] = useState<any>(null);
  const [viewingCustomRoutine, setViewingCustomRoutine] = useState<KsModule2Routine | null>(null);
  const [approverMode, setApproverMode] = useState<'select' | 'freetext'>('select');
  const [freetextApprover, setFreetextApprover] = useState("");
  const [customApproverMode, setCustomApproverMode] = useState<'select' | 'freetext'>('select');
  const [customFreetextApprover, setCustomFreetextApprover] = useState("");
  
  // Edit custom routine state
  const [editingCustomRoutine, setEditingCustomRoutine] = useState<KsModule2Routine | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("general");

  const { 
    routineTemplates, 
    checklistTemplates,
    isLoading, 
    markAsImplemented, 
    unmarkAsImplemented,
    updateApprovedBy,
    linkChecklistToRoutine,
    unlinkChecklistFromRoutine,
  } = useKsModule2ProjectTemplates(projectId);

  const {
    routines: customRoutines,
    updateRoutine,
    deleteRoutine,
    isLoading: isLoadingCustom,
    isSaving: isSavingCustom,
    linkRoutineToTemplate,
    unlinkRoutineFromTemplate,
    getLinkedTemplates,
    refetch: refetchCustomRoutines,
  } = useKsModule2Routines(projectId);
  
  const { users, getUserDisplayName } = useCompanyUsers();

  // Filter admin routines by search
  const filteredRoutines = routineTemplates.filter(pt =>
    pt.routine_template?.routine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pt.routine_template?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter custom routines by search
  const filteredCustomRoutines = customRoutines.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkImplemented = async (templateId: string, currentValue: boolean) => {
    try {
      if (currentValue) {
        await unmarkAsImplemented(templateId);
      } else {
        await markAsImplemented(templateId);
      }
    } catch (error) {
      toast.error("Kunne ikke oppdatere");
    }
  };

  const handleSetApprover = async (approverName: string) => {
    if (!viewingRoutine) return;
    await updateApprovedBy(viewingRoutine.id, approverName || null);
    setViewingRoutine({
      ...viewingRoutine,
      approved_by: approverName || null,
      approved_at: approverName ? new Date().toISOString() : null,
    });
  };

  const handleLinkChecklist = async (checklistId: string) => {
    if (!viewingRoutine) return;
    await linkChecklistToRoutine(viewingRoutine.id, checklistId);
    const currentLinked = viewingRoutine.linked_checklist_ids || [];
    setViewingRoutine({
      ...viewingRoutine,
      linked_checklist_ids: [...currentLinked, checklistId],
    });
  };

  const handleUnlinkChecklist = async (checklistId: string) => {
    if (!viewingRoutine) return;
    await unlinkChecklistFromRoutine(viewingRoutine.id, checklistId);
    const currentLinked = viewingRoutine.linked_checklist_ids || [];
    setViewingRoutine({
      ...viewingRoutine,
      linked_checklist_ids: currentLinked.filter((id: string) => id !== checklistId),
    });
  };

  const openEditCustomRoutine = (routine: KsModule2Routine) => {
    setEditingCustomRoutine(routine);
    setEditName(routine.name);
    setEditDescription(routine.description || "");
    setEditContent(routine.content || "");
    setEditCategory(routine.category || "general");
  };

  const handleSaveCustomRoutine = async () => {
    if (!editingCustomRoutine || !editName.trim()) return;
    
    await updateRoutine(editingCustomRoutine.id, {
      name: editName,
      description: editDescription || null,
      content: editContent || null,
      category: editCategory,
    });
    setEditingCustomRoutine(null);
  };

  const handleDeleteCustomRoutine = async (routine: KsModule2Routine) => {
    if (confirm("Er du sikker på at du vil slette denne rutinen?")) {
      await deleteRoutine(routine.id);
    }
  };

  const handleSetCustomApprover = async (approverName: string) => {
    if (!viewingCustomRoutine) return;
    await updateRoutine(viewingCustomRoutine.id, {
      approved_by: approverName || null,
      approved_at: approverName ? new Date().toISOString() : null,
    });
    setViewingCustomRoutine({
      ...viewingCustomRoutine,
      approved_by: approverName || null,
      approved_at: approverName ? new Date().toISOString() : null,
    });
    refetchCustomRoutines();
  };

  const handleLinkCustomChecklist = async (checklistId: string) => {
    if (!viewingCustomRoutine) return;
    await linkRoutineToTemplate(viewingCustomRoutine.id, checklistId);
  };

  const handleUnlinkCustomChecklist = async (checklistId: string) => {
    if (!viewingCustomRoutine) return;
    await unlinkRoutineFromTemplate(viewingCustomRoutine.id, checklistId);
  };

  const getCustomLinkedChecklists = () => {
    if (!viewingCustomRoutine) return [];
    const linkedIds = getLinkedTemplates(viewingCustomRoutine.id);
    return checklistTemplates.filter(ct => 
      linkedIds.includes(ct.admin_checklist_template_id!)
    );
  };

  const getCustomAvailableChecklists = () => {
    if (!viewingCustomRoutine) return checklistTemplates;
    const linkedIds = getLinkedTemplates(viewingCustomRoutine.id);
    return checklistTemplates.filter(ct => 
      !linkedIds.includes(ct.admin_checklist_template_id!)
    );
  };

  // Get linked checklists for the viewing routine
  const getLinkedChecklists = () => {
    if (!viewingRoutine?.linked_checklist_ids?.length) return [];
    return checklistTemplates.filter(ct => 
      viewingRoutine.linked_checklist_ids.includes(ct.admin_checklist_template_id)
    );
  };

  // Get available checklists that are not linked yet
  const getAvailableChecklists = () => {
    if (!viewingRoutine) return checklistTemplates;
    const linkedIds = viewingRoutine.linked_checklist_ids || [];
    return checklistTemplates.filter(ct => 
      !linkedIds.includes(ct.admin_checklist_template_id)
    );
  };

  if (isLoading || isLoadingCustom) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalRoutines = routineTemplates.length + customRoutines.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Rutinebank</h2>
          <p className="text-muted-foreground">Rutiner som gjelder for dette prosjektet</p>
        </div>
      </div>

      {/* Info about Malbibliotek if no routines */}
      {totalRoutines === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen rutiner lagt til</h3>
            <p className="text-muted-foreground mb-4">
              Gå til Malbibliotek for å legge til rutiner som skal gjelde for dette prosjektet.
            </p>
            <Button onClick={() => navigate(`/ks/project/${projectId}/maler`)}>
              <Plus className="h-4 w-4 mr-2" />
              Gå til Malbibliotek
            </Button>
          </CardContent>
        </Card>
      )}

      {totalRoutines > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Prosjektets rutiner ({totalRoutines})
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk rutiner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/ks/project/${projectId}/maler`)}
                >
                  <Library className="h-4 w-4 mr-2" />
                  Legg til flere
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Admin/System Routines */}
              {filteredRoutines.map((pt) => (
                <Card key={pt.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium">{pt.routine_template?.routine_name}</h4>
                          <Badge variant="outline">{pt.routine_template?.category}</Badge>
                          {pt.is_implemented && (
                            <Badge className="bg-green-500/10 text-green-500">
                              <Check className="h-3 w-3 mr-1" />
                              Implementert
                            </Badge>
                          )}
                          {pt.approved_by && (
                            <Badge variant="secondary">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Godkjent
                            </Badge>
                          )}
                          {pt.linked_checklist_ids && pt.linked_checklist_ids.length > 0 && (
                            <Badge variant="secondary">
                              <Link2 className="h-3 w-3 mr-1" />
                              {pt.linked_checklist_ids.length} sjekkliste{pt.linked_checklist_ids.length > 1 ? 'r' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {pt.routine_template?.description || "Ingen beskrivelse"}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          {pt.created_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Opprettet {format(new Date(pt.created_at), "dd.MM.yyyy", { locale: nb })}
                            </span>
                          )}
                          {pt.updated_at && pt.updated_at !== pt.created_at && (
                            <span>• Revidert {format(new Date(pt.updated_at), "dd.MM.yyyy", { locale: nb })}</span>
                          )}
                          {pt.approved_by && (
                            <span>• Godkjent av: {pt.approved_by}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setViewingRoutine(pt);
                            setFreetextApprover(pt.approved_by || "");
                            setApproverMode(pt.approved_by && !users.some(u => getUserDisplayName(u) === pt.approved_by) ? 'freetext' : 'select');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Les rutine
                        </Button>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`impl-${pt.id}`}
                            checked={pt.is_implemented}
                            onCheckedChange={() => handleMarkImplemented(pt.id, pt.is_implemented)}
                          />
                          <label
                            htmlFor={`impl-${pt.id}`}
                            className="text-sm cursor-pointer whitespace-nowrap"
                          >
                            Lest og implementert
                          </label>
                        </div>
                        {pt.routine_template?.file_path && (
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Åpne fil
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Custom Routines */}
              {filteredCustomRoutines.map((routine) => {
                const linkedIds = getLinkedTemplates(routine.id);
                return (
                  <Card key={routine.id} className="hover:bg-muted/50 transition-colors border-green-500/30">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {routine.routine_number && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {routine.routine_number}
                              </Badge>
                            )}
                            <h4 className="font-medium">{routine.name}</h4>
                            <Badge variant="outline">
                              {ROUTINE_CATEGORIES[routine.category || 'general'] || routine.category}
                            </Badge>
                            <Badge variant="outline" className="gap-1 text-green-600 border-green-500/50">
                              <PenLine className="h-3 w-3" />
                              Egendefinert
                            </Badge>
                            {routine.approved_by && (
                              <Badge variant="secondary">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Godkjent
                              </Badge>
                            )}
                            {linkedIds.length > 0 && (
                              <Badge variant="secondary">
                                <Link2 className="h-3 w-3 mr-1" />
                                {linkedIds.length} sjekkliste{linkedIds.length > 1 ? 'r' : ''}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {routine.description || "Ingen beskrivelse"}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            {routine.created_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Opprettet {format(new Date(routine.created_at), "dd.MM.yyyy", { locale: nb })}
                              </span>
                            )}
                            {routine.updated_at && routine.updated_at !== routine.created_at && (
                              <span>• Revidert {format(new Date(routine.updated_at), "dd.MM.yyyy", { locale: nb })}</span>
                            )}
                            {routine.approved_by && (
                              <span>• Godkjent av: {routine.approved_by}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setViewingCustomRoutine(routine);
                              setCustomFreetextApprover(routine.approved_by || "");
                              setCustomApproverMode(routine.approved_by && !users.some(u => getUserDisplayName(u) === routine.approved_by) ? 'freetext' : 'select');
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Les
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCustomRoutine(routine)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Rediger
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteCustomRoutine(routine)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Admin Routine Dialog */}
      <Dialog open={!!viewingRoutine} onOpenChange={() => setViewingRoutine(null)}>
        <DialogContent className="max-w-3xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {viewingRoutine?.routine_template?.routine_name}
            </DialogTitle>
          </DialogHeader>
          
           <Tabs defaultValue="content" className="flex-1 overflow-hidden flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Innhold</TabsTrigger>
              <TabsTrigger value="approval">Godkjenning</TabsTrigger>
              <TabsTrigger value="checklists">
                Sjekklister ({viewingRoutine?.linked_checklist_ids?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 min-h-0 mt-4">
              <TabsContent value="content" className="mt-0 space-y-4">
                {/* Metadata info box */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Kategori:</span>
                      {viewingRoutine?.routine_template?.category}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Versjon:</span>
                      v{viewingRoutine?.routine_template?.version || "1"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Opprettet:</span>
                      {viewingRoutine?.created_at ? format(new Date(viewingRoutine.created_at), "dd.MM.yyyy", { locale: nb }) : "—"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Sist revidert:</span>
                      {viewingRoutine?.updated_at ? format(new Date(viewingRoutine.updated_at), "dd.MM.yyyy", { locale: nb }) : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {viewingRoutine?.is_implemented && (
                      <Badge className="bg-green-500/10 text-green-500">
                        <Check className="h-3 w-3 mr-1" />
                        Implementert
                      </Badge>
                    )}
                    {viewingRoutine?.approved_by && (
                      <Badge variant="secondary">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Godkjent av {viewingRoutine.approved_by}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {viewingRoutine?.routine_template?.description && (
                  <div>
                    <h4 className="font-medium mb-1">Beskrivelse</h4>
                    <p className="text-sm text-muted-foreground">
                      {viewingRoutine.routine_template.description}
                    </p>
                  </div>
                )}
                
                {viewingRoutine?.routine_template?.content && (
                  <div>
                    <h4 className="font-medium mb-2">Innhold</h4>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                      {viewingRoutine.routine_template.content}
                    </div>
                  </div>
                )}

                {!viewingRoutine?.routine_template?.content && !viewingRoutine?.routine_template?.description && (
                  <p className="text-muted-foreground text-sm">
                    Ingen innhold tilgjengelig for denne rutinen.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="approval" className="mt-0 space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Godkjent av</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant={approverMode === 'select' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setApproverMode('select')}
                      >
                        Velg ansatt
                      </Button>
                      <Button
                        variant={approverMode === 'freetext' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setApproverMode('freetext')}
                      >
                        Annen person
                      </Button>
                    </div>

                    {approverMode === 'select' ? (
                      <Select
                        value={viewingRoutine?.approved_by || "__none__"}
                        onValueChange={(value) => handleSetApprover(value === "__none__" ? "" : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Velg godkjenner..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Ingen valgt</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={getUserDisplayName(user)}>
                              {getUserDisplayName(user)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Skriv inn navn..."
                          value={freetextApprover}
                          onChange={(e) => setFreetextApprover(e.target.value)}
                        />
                        <Button 
                          onClick={() => handleSetApprover(freetextApprover)}
                          disabled={!freetextApprover.trim()}
                        >
                          Lagre
                        </Button>
                      </div>
                    )}

                    {viewingRoutine?.approved_by && (
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <div className="flex items-center gap-2 text-green-600">
                          <UserCheck className="h-4 w-4" />
                          <span className="font-medium">Godkjent av: {viewingRoutine.approved_by}</span>
                        </div>
                        {viewingRoutine.approved_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(viewingRoutine.approved_at).toLocaleDateString('nb-NO')}
                          </p>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 text-red-500 hover:text-red-600"
                          onClick={() => handleSetApprover("")}
                        >
                          Fjern godkjenning
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="checklists" className="mt-0 space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Koblede sjekklister</h4>
                  
                  {getLinkedChecklists().length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {getLinkedChecklists().map((checklist) => (
                        <div 
                          key={checklist.id} 
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            <span className="font-medium">{checklist.checklist_template?.template_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {checklist.checklist_template?.category}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlinkChecklist(checklist.admin_checklist_template_id!)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">
                      Ingen sjekklister er koblet til denne rutinen ennå.
                    </p>
                  )}

                  {getAvailableChecklists().length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Legg til sjekkliste</h5>
                      <Select
                        onValueChange={(value) => handleLinkChecklist(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Velg sjekkliste å koble..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableChecklists().map((checklist) => (
                            <SelectItem 
                              key={checklist.id} 
                              value={checklist.admin_checklist_template_id!}
                            >
                              {checklist.checklist_template?.template_name} ({checklist.checklist_template?.category})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {checklistTemplates.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Ingen sjekklister er lagt til i prosjektet.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setViewingRoutine(null);
                          navigate(`/ks/project/${projectId}/maler`);
                        }}
                      >
                        Gå til Malbibliotek
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setViewingRoutine(null)}>
              Lukk
            </Button>
            {!viewingRoutine?.is_implemented && (
              <Button onClick={() => {
                handleMarkImplemented(viewingRoutine.id, false);
                setViewingRoutine(null);
              }}>
                <Check className="h-4 w-4 mr-2" />
                Marker som implementert
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Custom Routine Dialog */}
      <Dialog open={!!viewingCustomRoutine} onOpenChange={() => setViewingCustomRoutine(null)}>
        <DialogContent className="max-w-3xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-green-500" />
              {viewingCustomRoutine?.name}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="content" className="flex-1 overflow-hidden flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Innhold</TabsTrigger>
              <TabsTrigger value="approval">Godkjenning</TabsTrigger>
              <TabsTrigger value="checklists">
                Sjekklister ({viewingCustomRoutine ? getLinkedTemplates(viewingCustomRoutine.id).length : 0})
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 min-h-0 mt-4">
              <TabsContent value="content" className="mt-0 space-y-4">
                {/* Metadata info box */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                    {viewingCustomRoutine?.routine_number && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium text-foreground">Rutine nr:</span>
                        <span className="font-mono">{viewingCustomRoutine.routine_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Kategori:</span>
                      {ROUTINE_CATEGORIES[viewingCustomRoutine?.category || 'general'] || viewingCustomRoutine?.category}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Opprettet:</span>
                      {viewingCustomRoutine?.created_at ? format(new Date(viewingCustomRoutine.created_at), "dd.MM.yyyy", { locale: nb }) : "—"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Sist revidert:</span>
                      {viewingCustomRoutine?.updated_at ? format(new Date(viewingCustomRoutine.updated_at), "dd.MM.yyyy", { locale: nb }) : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-500/50">
                      <PenLine className="h-3 w-3" />
                      Egendefinert
                    </Badge>
                    {viewingCustomRoutine?.approved_by && (
                      <Badge variant="secondary">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Godkjent av {viewingCustomRoutine.approved_by}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {viewingCustomRoutine?.description && (
                  <div>
                    <h4 className="font-medium mb-1">Beskrivelse</h4>
                    <p className="text-sm text-muted-foreground">
                      {viewingCustomRoutine.description}
                    </p>
                  </div>
                )}
                
                {viewingCustomRoutine?.content && (
                  <div>
                    <h4 className="font-medium mb-2">Innhold</h4>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                      {viewingCustomRoutine.content}
                    </div>
                  </div>
                )}

                {!viewingCustomRoutine?.content && !viewingCustomRoutine?.description && (
                  <p className="text-muted-foreground text-sm">
                    Ingen innhold tilgjengelig for denne rutinen.
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="approval" className="mt-0 space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Godkjent av</h4>
                  {viewingCustomRoutine?.approved_by ? (
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary" className="gap-1">
                        <UserCheck className="h-3 w-3" />
                        {viewingCustomRoutine.approved_by}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSetCustomApprover("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">
                      Ingen godkjenner satt ennå.
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={customApproverMode === 'select' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCustomApproverMode('select')}
                      >
                        Velg fra ansatte
                      </Button>
                      <Button
                        variant={customApproverMode === 'freetext' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCustomApproverMode('freetext')}
                      >
                        Skriv inn manuelt
                      </Button>
                    </div>
                    
                    {customApproverMode === 'select' ? (
                      <Select
                        value={viewingCustomRoutine?.approved_by || "__none__"}
                        onValueChange={(value) => handleSetCustomApprover(value === "__none__" ? "" : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Velg godkjenner..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Ingen valgt</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={getUserDisplayName(user)}>
                              {getUserDisplayName(user)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Skriv inn navn..."
                          value={customFreetextApprover}
                          onChange={(e) => setCustomFreetextApprover(e.target.value)}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (customFreetextApprover.trim()) {
                              handleSetCustomApprover(customFreetextApprover.trim());
                            }
                          }}
                          disabled={!customFreetextApprover.trim()}
                        >
                          Sett
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="checklists" className="mt-0 space-y-4">
                <h4 className="font-medium">Koblede sjekklister</h4>
                
                {getCustomLinkedChecklists().length > 0 ? (
                  <div className="space-y-2">
                    {getCustomLinkedChecklists().map((checklist) => (
                      <div 
                        key={checklist.id} 
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {checklist.checklist_template?.template_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {checklist.checklist_template?.category}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlinkCustomChecklist(checklist.admin_checklist_template_id!)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ingen sjekklister er koblet til denne rutinen ennå.
                  </p>
                )}

                {getCustomAvailableChecklists().length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Legg til sjekkliste</h5>
                    <Select
                      onValueChange={(value) => handleLinkCustomChecklist(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg sjekkliste å koble..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getCustomAvailableChecklists().map((checklist) => (
                          <SelectItem 
                            key={checklist.id} 
                            value={checklist.admin_checklist_template_id!}
                          >
                            {checklist.checklist_template?.template_name} ({checklist.checklist_template?.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {checklistTemplates.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Ingen sjekklister er lagt til i prosjektet.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setViewingCustomRoutine(null);
                        navigate(`/ks/project/${projectId}/maler`);
                      }}
                    >
                      Gå til Malbibliotek
                    </Button>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setViewingCustomRoutine(null)}>
              Lukk
            </Button>
            <Button onClick={() => {
              if (viewingCustomRoutine) {
                openEditCustomRoutine(viewingCustomRoutine);
                setViewingCustomRoutine(null);
              }
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Rediger
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Custom Routine Dialog */}
      <Dialog open={!!editingCustomRoutine} onOpenChange={() => setEditingCustomRoutine(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Rediger rutine
            </DialogTitle>
            <DialogDescription>
              Rediger innholdet i rutinen nedenfor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Navn på rutine *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="F.eks. Rutine for kvalitetskontroll"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Kategori</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROUTINE_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beskrivelse</Label>
              <Input
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Kort beskrivelse av rutinen"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-content">Innhold</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Skriv rutinens fullstendige innhold her..."
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCustomRoutine(null)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleSaveCustomRoutine}
              disabled={isSavingCustom || !editName.trim()}
            >
              {isSavingCustom ? "Lagrer..." : "Lagre endringer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}