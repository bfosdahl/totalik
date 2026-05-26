import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FileText, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  ChevronDown, 
  ChevronRight,
  Upload,
  Download,
  Loader2,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { RoutineLibraryDialog } from "@/components/routines/RoutineLibraryDialog";
import { AiRoutineDialog } from "@/components/routines/AiRoutineDialog";
import type { RoutineTemplate } from "@/hooks/useRoutineLibrary";
import { useCompanyKsRoutines, CompanyKsRoutine } from "@/hooks/useCompanyKsRoutines";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const CATEGORIES = [
  { value: "general", label: "Generelt" },
  { value: "quality", label: "Kvalitetssikring" },
  { value: "documentation", label: "Dokumentasjon" },
  { value: "control", label: "Kontroll" },
  { value: "subcontractor", label: "Underleverandør" },
  { value: "deviation", label: "Avvikshåndtering" },
];

export default function IkKsRutiner() {
  const { routines, isLoading, isSaving, createRoutine, updateRoutine, deleteRoutine } = useCompanyKsRoutines();
  
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newRoutine, setNewRoutine] = useState({
    routine_name: "",
    description: "",
    content: "",
    category: "general",
  });

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!newRoutine.routine_name.trim()) return;
    await createRoutine(newRoutine);
    setNewRoutine({ routine_name: "", description: "", content: "", category: "general" });
    setShowNewDialog(false);
  };

  const handleAdoptFromLibrary = async (template: RoutineTemplate) => {
    const steps = Array.isArray(template.steps) ? template.steps : [];
    const stepsText = steps.map((s: any, i: number) => 
      `${i + 1}. ${typeof s === "string" ? s : s.text || s.label || ""}`
    ).join("\n");
    const content = [
      template.purpose ? `Formål:\n${template.purpose}` : "",
      stepsText ? `\nSjekkliste:\n${stepsText}` : "",
    ].filter(Boolean).join("\n");
    await createRoutine({
      routine_name: template.title,
      description: template.description || "",
      content,
      category: template.subcategory || "general",
      routine_number: template.template_number || undefined,
    });
  };

  const adoptedKsTemplateIds = new Set(
    routines.filter(r => r.admin_template_id).map(r => r.admin_template_id!)
  );

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(c => c.value === value)?.label || value;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">KS-Rutiner</h1>
            <p className="text-muted-foreground mt-1">
              Bedriftens kvalitetssikringsrutiner som brukes i prosjekter
            </p>
          </div>
          
          <div className="flex gap-2">
            <AiRoutineDialog module="ks_ik_bygg" onAdopt={handleAdoptFromLibrary} />
            <RoutineLibraryDialog module="ks_ik_bygg" onAdopt={handleAdoptFromLibrary} adoptedIds={adoptedKsTemplateIds} />
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ny rutine
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Opprett ny rutine</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Navn</label>
                    <Input
                      value={newRoutine.routine_name}
                      onChange={(e) => setNewRoutine({ ...newRoutine, routine_name: e.target.value })}
                      placeholder="F.eks. Rutine for egenkontroll"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Kategori</label>
                    <Select
                      value={newRoutine.category}
                      onValueChange={(value) => setNewRoutine({ ...newRoutine, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Beskrivelse</label>
                    <Textarea
                      value={newRoutine.description}
                      onChange={(e) => setNewRoutine({ ...newRoutine, description: e.target.value })}
                      placeholder="Kort beskrivelse av rutinen"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Innhold</label>
                    <Textarea
                      value={newRoutine.content}
                      onChange={(e) => setNewRoutine({ ...newRoutine, content: e.target.value })}
                      placeholder="Detaljert rutinebeskrivelse..."
                      rows={6}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                      Avbryt
                    </Button>
                    <Button onClick={handleCreate} disabled={isSaving || !newRoutine.routine_name.trim()}>
                      {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Opprett
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Routine list */}
        <div className="space-y-3">
          {routines.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">Ingen rutiner ennå</h3>
                <p className="text-muted-foreground mb-4">
                  Opprett din første KS-rutine eller importer fra maler
                </p>
                <Button onClick={() => setShowNewDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Opprett rutine
                </Button>
              </CardContent>
            </Card>
          ) : (
            routines.map(routine => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                isExpanded={expandedIds.has(routine.id)}
                onToggle={() => toggleExpanded(routine.id)}
                isEditing={editingId === routine.id}
                onEdit={() => setEditingId(routine.id)}
                onCancelEdit={() => setEditingId(null)}
                onUpdate={updateRoutine}
                onDelete={deleteRoutine}
                getCategoryLabel={getCategoryLabel}
                isSaving={isSaving}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function RoutineCard({
  routine,
  isExpanded,
  onToggle,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  getCategoryLabel,
  isSaving,
}: {
  routine: CompanyKsRoutine;
  isExpanded: boolean;
  onToggle: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, updates: Partial<CompanyKsRoutine>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  getCategoryLabel: (value: string) => string;
  isSaving: boolean;
}) {
  const [editData, setEditData] = useState({
    routine_name: routine.routine_name,
    description: routine.description || "",
    content: routine.content,
  });

  const handleSave = async () => {
    await onUpdate(routine.id, editData);
    onCancelEdit();
  };

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {routine.routine_number && (
                      <Badge variant="outline" className="text-xs font-mono shrink-0">
                        {routine.routine_number}
                      </Badge>
                    )}
                    <CardTitle className="text-base">{routine.routine_name}</CardTitle>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(routine.created_at), "dd.MM.yyyy", { locale: nb })}
                </span>
                <Badge variant="outline">{getCategoryLabel(routine.category)}</Badge>
                {routine.admin_template_id && (
                  <Badge variant="secondary">Fra mal</Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Navn</label>
                  <Input
                    value={editData.routine_name}
                    onChange={(e) => setEditData({ ...editData, routine_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Beskrivelse</label>
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Innhold</label>
                  <Textarea
                    value={editData.content}
                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                    rows={8}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={onCancelEdit}>
                    <X className="w-4 h-4 mr-1" />
                    Avbryt
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-1" />
                    Lagre
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {routine.description && (
                  <p className="text-sm text-muted-foreground mb-4 italic">{routine.description}</p>
                )}
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                  {routine.content || <span className="text-muted-foreground italic">Ingen innhold</span>}
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Rediger
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(routine.id)}
                    disabled={isSaving}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Slett
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
