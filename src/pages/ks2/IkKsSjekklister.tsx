import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  CheckSquare
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
  } = useCompanyKsChecklistTemplates();
  const { checklistTemplates: adminTemplates } = useAdminKsTemplates();
  
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      await selectAdminTemplate("checklist", templateId);
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
              Bedriftens egne sjekklistemaler for bruk i prosjekter
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Velg fra maler
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Velg maler fra malbiblioteket</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  {adminTemplates?.map(template => (
                    <div 
                      key={template.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isAdminTemplateSelected("checklist", template.id)}
                          onCheckedChange={() => handleToggleAdminTemplate(template.id)}
                        />
                        <div>
                          <p className="font-medium">{template.template_name}</p>
                          {template.description && (
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                  ))}
                  {(!adminTemplates || adminTemplates.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      Ingen maler tilgjengelig
                    </p>
                  )}
                </div>
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

        {/* Selected admin templates */}
        {selectedAdminTemplates.filter(t => t.template_type === "checklist").length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Valgte maler fra malbiblioteket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedAdminTemplates
                  .filter(t => t.template_type === "checklist")
                  .map(selected => {
                    const template = adminTemplates?.find(t => t.id === selected.admin_template_id);
                    return template ? (
                      <Badge key={selected.id} variant="secondary" className="gap-1">
                        {template.template_name}
                        <button
                          onClick={() => deselectAdminTemplate("checklist", template.id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
              </div>
            </CardContent>
          </Card>
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
                onEdit={() => setEditingId(template.id)}
                onCancelEdit={() => setEditingId(null)}
                onUpdate={updateTemplate}
                onDelete={deleteTemplate}
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

function TemplateCard({
  template,
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
  template: ReturnType<typeof useCompanyKsChecklistTemplates>["templates"][0];
  isExpanded: boolean;
  onToggle: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  getCategoryLabel: (value: string) => string;
  isSaving: boolean;
}) {
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
                <div>
                  <CardTitle className="text-base">{template.template_name}</CardTitle>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{template.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
                <Badge variant="secondary">{template.checkpoints.length} punkter</Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {template.checkpoints.map((cp, idx) => (
                <div key={cp.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                  <span className="text-sm">{cp.text}</span>
                </div>
              ))}
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
                onClick={() => onDelete(template.id)}
                disabled={isSaving}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Slett
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
