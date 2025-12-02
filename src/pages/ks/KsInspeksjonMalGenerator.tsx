import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FileText, Edit, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useInspectionTemplates, useInspectionTemplateItems } from "@/hooks/useInspectionTemplates";
import { useAuth } from "@/contexts/AuthContext";

const inspectionTypeLabels: Record<string, string> = {
  ferdigbefaring: "Ferdigbefaring",
  forhåndsbefaring: "Forhåndsbefaring",
  hms: "HMS Inspeksjon",
  sluttbefaring: "Sluttbefaring",
  vernerunde: "Vernerunde",
  befaring: "Kundebesøk",
};

interface TemplateItemForm {
  checkpoint_text: string;
  help_text: string;
  order: number;
}

export default function KsInspeksjonMalGenerator() {
  const { profile } = useAuth();
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useInspectionTemplates();
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [showItemsDialog, setShowItemsDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  const [templateForm, setTemplateForm] = useState({
    template_name: "",
    inspection_type: "vernerunde",
    description: "",
  });

  const [items, setItems] = useState<TemplateItemForm[]>([]);
  const { items: templateItems, saveItems } = useInspectionTemplateItems(selectedTemplate?.id);

  useEffect(() => {
    if (showItemsDialog && templateItems.length > 0) {
      setItems(
        templateItems.map((item, idx) => ({
          checkpoint_text: item.checkpoint_text,
          help_text: item.help_text || "",
          order: idx,
        }))
      );
    }
  }, [templateItems, showItemsDialog]);

  const handleCreateTemplate = async () => {
    if (!profile?.company_id) return;

    if (editingTemplate) {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        ...templateForm,
      });
      setEditingTemplate(null);
    } else {
      await createTemplate.mutateAsync({
        ...templateForm,
        company_id: profile.company_id,
      });
    }

    setTemplateForm({
      template_name: "",
      inspection_type: "vernerunde",
      description: "",
    });
    setShowNewTemplateDialog(false);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateForm({
      template_name: template.template_name,
      inspection_type: template.inspection_type,
      description: template.description || "",
    });
    setShowNewTemplateDialog(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne malen?")) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  const handleOpenItems = (template: any) => {
    setSelectedTemplate(template);
    setItems([]);
    setShowItemsDialog(true);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        checkpoint_text: "",
        help_text: "",
        order: items.length,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveItems = async () => {
    if (!selectedTemplate) return;

    const itemsToSave = items.map((item, index) => ({
      template_id: selectedTemplate.id,
      checkpoint_text: item.checkpoint_text,
      help_text: item.help_text || null,
      sort_order: index,
    }));

    await saveItems.mutateAsync({
      templateId: selectedTemplate.id,
      items: itemsToSave,
    });

    setShowItemsDialog(false);
    setSelectedTemplate(null);
    setItems([]);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inspeksjonsmaler</h1>
            <p className="text-muted-foreground">
              Lag maler for inspeksjoner og vernerunder
            </p>
          </div>
          <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({
                  template_name: "",
                  inspection_type: "vernerunde",
                  description: "",
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Ny mal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Rediger mal" : "Ny inspeksjonsmal"}</DialogTitle>
                <DialogDescription>
                  Opprett en mal som kan gjenbrukes for inspeksjoner
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template_name">Malnavn *</Label>
                  <Input
                    id="template_name"
                    value={templateForm.template_name}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, template_name: e.target.value })
                    }
                    placeholder="F.eks. Standard HMS Vernerunde"
                  />
                </div>
                <div>
                  <Label htmlFor="inspection_type">Inspeksjonstype *</Label>
                  <Select
                    value={templateForm.inspection_type}
                    onValueChange={(value) =>
                      setTemplateForm({ ...templateForm, inspection_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(inspectionTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Textarea
                    id="description"
                    value={templateForm.description}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewTemplateDialog(false);
                    setEditingTemplate(null);
                  }}
                >
                  Avbryt
                </Button>
                <Button onClick={handleCreateTemplate}>
                  {editingTemplate ? "Oppdater" : "Opprett"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{template.template_name}</span>
                </CardTitle>
                <CardDescription>
                  {inspectionTypeLabels[template.inspection_type] || template.inspection_type}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenItems(template)}
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Sjekkliste
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={showItemsDialog} onOpenChange={setShowItemsDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rediger sjekkliste</DialogTitle>
              <DialogDescription>
                Legg til sjekkliste-punkter for {selectedTemplate?.template_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex gap-2 items-start">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Sjekkpunkt"
                          value={item.checkpoint_text}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].checkpoint_text = e.target.value;
                            setItems(newItems);
                          }}
                        />
                        <Input
                          placeholder="Hjelpetekst (valgfritt)"
                          value={item.help_text}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].help_text = e.target.value;
                            setItems(newItems);
                          }}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" onClick={handleAddItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Legg til sjekkpunkt
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowItemsDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSaveItems}>Lagre sjekkliste</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
