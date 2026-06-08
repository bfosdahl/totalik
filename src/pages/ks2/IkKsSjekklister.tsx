import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  ClipboardList, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  ChevronDown, 
  ChevronRight,
  Download,
  Loader2,
  GripVertical,
  Search,
  CheckCircle2,
} from "lucide-react";
import { useCompanyKsChecklistTemplates, Checkpoint } from "@/hooks/useCompanyKsChecklistTemplates";
import { useAdminKsTemplates } from "@/hooks/useAdminKsTemplates";
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
import { cn } from "@/lib/utils";
import { QuickFillChecklistDialog } from "@/components/ks/QuickFillChecklistDialog";
import { AiChecklistDialog } from "@/components/admin/AiChecklistDialog";
import { PlayCircle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const CATEGORIES = [
  { value: "general", label: "Generelt" },
  { value: "inspection", label: "Befaring" },
  { value: "control", label: "Kontroll" },
  { value: "quality", label: "Kvalitet" },
  { value: "safety", label: "Sikkerhet" },
];

export default function IkKsSjekklister() {
  const { 
    templates, 
    selectedAdminTemplates,
    isLoading, 
    isSaving, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate,
    selectAdminTemplate,
    deselectAdminTemplate,
    isAdminTemplateSelected,
    refetch: refetchTemplates,
  } = useCompanyKsChecklistTemplates();
  const { checklistTemplates: adminTemplates } = useAdminKsTemplates();
  
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fillTemplate, setFillTemplate] = useState<typeof templates[0] | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newTemplate, setNewTemplate] = useState({
    template_name: "",
    description: "",
    category: "general",
    checkpoints: [] as Checkpoint[],
  });
  const [newCheckpointText, setNewCheckpointText] = useState("");

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addCheckpoint = () => {
    if (!newCheckpointText.trim()) return;
    setNewTemplate(prev => ({
      ...prev,
      checkpoints: [
        ...prev.checkpoints,
        { id: crypto.randomUUID(), text: newCheckpointText.trim() }
      ]
    }));
    setNewCheckpointText("");
  };

  const removeCheckpoint = (id: string) => {
    setNewTemplate(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.filter(c => c.id !== id)
    }));
  };

  const handleCreate = async () => {
    if (!newTemplate.template_name.trim()) return;
    await createTemplate(newTemplate);
    setNewTemplate({ template_name: "", description: "", category: "general", checkpoints: [] });
    setShowNewDialog(false);
  };

  const handleToggleAdminTemplate = async (templateId: string) => {
    if (isAdminTemplateSelected("checklist", templateId)) {
      await deselectAdminTemplate("checklist", templateId);
    } else {
      const adminTemplate = adminTemplates?.find(t => t.id === templateId);
      await selectAdminTemplate("checklist", templateId, adminTemplate ? {
        template_name: adminTemplate.template_name,
        description: adminTemplate.description,
        category: adminTemplate.category,
        checkpoints: adminTemplate.checkpoints,
      } : undefined);
    }
  };

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
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sjekklistemaler</h1>
            <p className="text-muted-foreground mt-1">
              Bedriftens sjekklistemaler for bruk i prosjekter
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <AiChecklistDialog onSaved={refetchTemplates} />
            <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Velg fra maler
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Velg maler fra malbiblioteket</DialogTitle>
                </DialogHeader>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk i maler..."
                    className="pl-9"
                    onChange={(e) => {
                      const q = e.target.value.toLowerCase();
                      // Store search in a data attribute for filtering
                      e.target.closest('[role="dialog"]')?.setAttribute('data-search', q);
                      // Force re-render by toggling a class
                      e.target.dispatchEvent(new Event('input', { bubbles: true }));
                    }}
                  />
                </div>
                <ScrollArea className="flex-1 min-h-0 max-h-[60vh]">
                  <div className="space-y-0.5 pr-4">
                    {adminTemplates?.map(template => {
                      const isSelected = isAdminTemplateSelected("checklist", template.id);
                      return (
                        <div 
                          key={template.id}
                          className={cn(
                            "flex items-center justify-between gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                            isSelected && "bg-primary/5"
                          )}
                          onClick={() => handleToggleAdminTemplate(template.id)}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {isSelected ? (
                              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{template.template_name}</p>
                              {template.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">{template.category}</Badge>
                        </div>
                      );
                    })}
                    {(!adminTemplates || adminTemplates.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">
                        Ingen maler tilgjengelig
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ny mal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Opprett sjekklistemal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Navn</label>
                    <Input
                      value={newTemplate.template_name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, template_name: e.target.value })}
                      placeholder="F.eks. Sluttbefaring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Kategori</label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
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
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                      placeholder="Kort beskrivelse..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sjekkpunkter</label>
                    <div className="space-y-2 mt-2">
                      {newTemplate.checkpoints.map((cp, idx) => (
                        <div key={cp.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                          <span className="flex-1 text-sm">{cp.text}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeCheckpoint(cp.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          value={newCheckpointText}
                          onChange={(e) => setNewCheckpointText(e.target.value)}
                          placeholder="Legg til sjekkpunkt..."
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCheckpoint())}
                        />
                        <Button variant="outline" onClick={addCheckpoint}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                      Avbryt
                    </Button>
                    <Button onClick={handleCreate} disabled={isSaving || !newTemplate.template_name.trim()}>
                      {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Opprett
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary */}
        {templates.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{templates.length} sjekklistemaler totalt</span>
            <span>•</span>
            <span>{templates.filter(t => t.is_active).length} aktive</span>
          </div>
        )}

        {/* Template list */}
        <div className="space-y-3">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">Ingen sjekklistemaler ennå</h3>
                <p className="text-muted-foreground mb-4">
                  Opprett egne maler eller velg fra malbiblioteket
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => setShowAdminDialog(true)}>
                    <Download className="w-4 h-4 mr-2" />
                    Velg fra maler
                  </Button>
                  <Button onClick={() => setShowNewDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Opprett mal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                isExpanded={expandedIds.has(template.id)}
                onToggle={() => toggleExpanded(template.id)}
                isEditing={editingId === template.id}
                onEdit={() => { setEditingId(template.id); setExpandedIds(prev => new Set(prev).add(template.id)); }}
                onCancelEdit={() => setEditingId(null)}
                onUpdate={updateTemplate}
                onDelete={deleteTemplate}
                onFill={() => setFillTemplate(template)}
                getCategoryLabel={getCategoryLabel}
                isSaving={isSaving}
              />
            ))
          )}
        </div>

        {fillTemplate && (
          <QuickFillChecklistDialog
            open={!!fillTemplate}
            onOpenChange={(open) => { if (!open) setFillTemplate(null); }}
            template={fillTemplate}
          />
        )}
      </div>
    </AppLayout>
  );
}

function TemplateCard({
  template,
  isExpanded,
  onToggle,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onFill,
  getCategoryLabel,
  isSaving,
}: {
  template: ReturnType<typeof useCompanyKsChecklistTemplates>["templates"][0];
  isExpanded: boolean;
  onToggle: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onFill: () => void;
  getCategoryLabel: (value: string) => string;
  isSaving: boolean;
}) {
  const [editName, setEditName] = useState(template.template_name);
  const [editDescription, setEditDescription] = useState(template.description || "");
  const [editCategory, setEditCategory] = useState(template.category);
  const [editCheckpoints, setEditCheckpoints] = useState<Checkpoint[]>(template.checkpoints);
  const [addText, setAddText] = useState("");

  const startEdit = () => {
    setEditName(template.template_name);
    setEditDescription(template.description || "");
    setEditCategory(template.category);
    setEditCheckpoints([...template.checkpoints]);
    setAddText("");
    onEdit();
  };

  const handleSave = async () => {
    await onUpdate(template.id, {
      template_name: editName,
      description: editDescription || null,
      category: editCategory,
      checkpoints: editCheckpoints,
    });
    onCancelEdit();
  };

  const addEditCheckpoint = () => {
    if (!addText.trim()) return;
    setEditCheckpoints(prev => [...prev, { id: crypto.randomUUID(), text: addText.trim() }]);
    setAddText("");
  };

  const removeEditCheckpoint = (id: string) => {
    setEditCheckpoints(prev => prev.filter(c => c.id !== id));
  };

  const updateCheckpointText = (id: string, text: string) => {
    setEditCheckpoints(prev => prev.map(c => c.id === id ? { ...c, text } : c));
  };

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <ClipboardList className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{template.template_name}</p>
              {template.description && !isExpanded && (
                <p className="text-xs text-muted-foreground truncate">{template.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs">{getCategoryLabel(template.category)}</Badge>
              <Badge variant="secondary" className="text-xs">{template.checkpoints.length} punkter</Badge>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 border-t">
            {isEditing ? (
              /* Edit mode */
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Navn</label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Kategori</label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Beskrivelse</label>
                  <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2} className="mt-1" />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Sjekkpunkter ({editCheckpoints.length})
                  </label>
                  <div className="space-y-1.5">
                    {editCheckpoints.map((cp, idx) => (
                      <div key={cp.id} className="flex items-center gap-2 group">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                        <Input
                          value={cp.text}
                          onChange={e => updateCheckpointText(cp.id, e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => removeEditCheckpoint(cp.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <Input
                        value={addText}
                        onChange={e => setAddText(e.target.value)}
                        placeholder="Legg til nytt sjekkpunkt..."
                        className="h-8 text-sm"
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addEditCheckpoint())}
                      />
                      <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={addEditCheckpoint}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Legg til
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={onCancelEdit}>
                    <X className="w-3.5 h-3.5 mr-1" />
                    Avbryt
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving || !editName.trim()}>
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    Lagre
                  </Button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="pt-4">
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                )}
                <div className="space-y-1">
                  {template.checkpoints.map((cp, idx) => (
                    <div key={cp.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30">
                      <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm">{cp.text}</span>
                        {cp.description && (
                          <span className="text-xs text-muted-foreground ml-2">— {cp.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {template.checkpoints.length === 0 && (
                    <p className="text-sm text-muted-foreground italic py-2">Ingen sjekkpunkter lagt til ennå</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                  <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); onFill(); }}>
                    <PlayCircle className="w-3.5 h-3.5 mr-1" />
                    Gjennomfør
                  </Button>
                  <Button variant="outline" size="sm" onClick={startEdit}>
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Rediger
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(template.id)}
                    disabled={isSaving}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Slett
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
