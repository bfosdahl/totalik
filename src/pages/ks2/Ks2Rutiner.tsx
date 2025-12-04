import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Plus, Search, Library, Check, ExternalLink, Eye, UserCheck, Link2, X, ClipboardList } from "lucide-react";
import { useKsModule2ProjectTemplates } from "@/hooks/useKsModule2ProjectTemplates";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

export default function Ks2Rutiner() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingRoutine, setViewingRoutine] = useState<any>(null);
  const [approverMode, setApproverMode] = useState<'select' | 'freetext'>('select');
  const [freetextApprover, setFreetextApprover] = useState("");

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
  
  const { users, getUserDisplayName } = useCompanyUsers();

  // Filter by search
  const filteredRoutines = routineTemplates.filter(pt =>
    pt.routine_template?.routine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pt.routine_template?.category?.toLowerCase().includes(searchTerm.toLowerCase())
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
    // Update local state
    setViewingRoutine({
      ...viewingRoutine,
      approved_by: approverName || null,
      approved_at: approverName ? new Date().toISOString() : null,
    });
  };

  const handleLinkChecklist = async (checklistId: string) => {
    if (!viewingRoutine) return;
    await linkChecklistToRoutine(viewingRoutine.id, checklistId);
    // Update local state
    const currentLinked = viewingRoutine.linked_checklist_ids || [];
    setViewingRoutine({
      ...viewingRoutine,
      linked_checklist_ids: [...currentLinked, checklistId],
    });
  };

  const handleUnlinkChecklist = async (checklistId: string) => {
    if (!viewingRoutine) return;
    await unlinkChecklistFromRoutine(viewingRoutine.id, checklistId);
    // Update local state
    const currentLinked = viewingRoutine.linked_checklist_ids || [];
    setViewingRoutine({
      ...viewingRoutine,
      linked_checklist_ids: currentLinked.filter((id: string) => id !== checklistId),
    });
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

  if (isLoading) {
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
          <h2 className="text-2xl font-bold">Rutinebank</h2>
          <p className="text-muted-foreground">Rutiner som gjelder for dette prosjektet</p>
        </div>
      </div>

      {/* Info about Malbibliotek if no routines */}
      {routineTemplates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen rutiner lagt til</h3>
            <p className="text-muted-foreground mb-4">
              Gå til Malbibliotek for å legge til rutiner som skal gjelde for dette prosjektet.
            </p>
            <Button onClick={() => navigate(`/ks2/project/${projectId}/maler`)}>
              <Plus className="h-4 w-4 mr-2" />
              Gå til Malbibliotek
            </Button>
          </CardContent>
        </Card>
      )}

      {routineTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Prosjektets rutiner ({filteredRoutines.length})
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
                  onClick={() => navigate(`/ks2/project/${projectId}/maler`)}
                >
                  <Library className="h-4 w-4 mr-2" />
                  Legg til flere
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
                        {pt.approved_by && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Godkjent av: {pt.approved_by}
                          </p>
                        )}
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Routine Dialog */}
      <Dialog open={!!viewingRoutine} onOpenChange={() => setViewingRoutine(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {viewingRoutine?.routine_template?.routine_name}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="content" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Innhold</TabsTrigger>
              <TabsTrigger value="approval">Godkjenning</TabsTrigger>
              <TabsTrigger value="checklists">
                Sjekklister ({viewingRoutine?.linked_checklist_ids?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="content" className="mt-0 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{viewingRoutine?.routine_template?.category}</Badge>
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
                  
                  {/* Linked checklists */}
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

                  {/* Available checklists to link */}
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
                          navigate(`/ks2/project/${projectId}/maler`);
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
    </div>
  );
}