import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, List, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TemplateItem {
  id?: string;
  text: string;
  help_text?: string;
  order_index: number;
  category?: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  trade?: string;
  phase?: string;
  company_id: string;
}

export default function KsChecklistGenerator() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    trade: "UTF - Tømrerarbeid",
    phase: "Oppstart"
  });

  const [items, setItems] = useState<TemplateItem[]>([]);
  const [newItem, setNewItem] = useState({ text: "", help_text: "" });

  // Fetch company templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["ks-custom-templates", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from("ks_templates")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("name");
      
      if (error) throw error;
      return data as Template[];
    },
    enabled: !!profile?.company_id
  });

  // Fetch items for selected template
  const { data: templateItems } = useQuery({
    queryKey: ["ks-template-items", selectedTemplateId],
    queryFn: async () => {
      if (!selectedTemplateId) return [];
      const { data, error } = await supabase
        .from("ks_template_items")
        .select("*")
        .eq("template_id", selectedTemplateId)
        .order("order_index");
      
      if (error) throw error;
      return data as TemplateItem[];
    },
    enabled: !!selectedTemplateId
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: typeof templateForm) => {
      if (!profile?.company_id) throw new Error("No company ID");
      
      const { data, error } = await supabase
        .from("ks_templates")
        .insert({
          name: template.name,
          description: template.description,
          trade: template.trade,
          phase: template.phase,
          company_id: profile.company_id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-custom-templates"] });
      toast({ title: "Mal opprettet" });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...template }: typeof templateForm & { id: string }) => {
      const { error } = await supabase
        .from("ks_templates")
        .update({
          name: template.name,
          description: template.description,
          trade: template.trade,
          phase: template.phase
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-custom-templates"] });
      toast({ title: "Mal oppdatert" });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("ks_templates")
        .delete()
        .eq("id", templateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-custom-templates"] });
      toast({ title: "Mal slettet" });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    }
  });

  // Save items mutation
  const saveItemsMutation = useMutation({
    mutationFn: async ({ templateId, items }: { templateId: string; items: TemplateItem[] }) => {
      if (!profile?.company_id) throw new Error("No company ID");
      
      // Delete existing items
      await supabase
        .from("ks_template_items")
        .delete()
        .eq("template_id", templateId);
      
      // Insert new items
      const itemsToInsert = items.map((item, index) => ({
        template_id: templateId,
        text: item.text,
        help_text: item.help_text,
        order_index: index,
        category: item.category || "general",
        company_id: profile.company_id
      }));
      
      const { error } = await supabase
        .from("ks_template_items")
        .insert(itemsToInsert);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-template-items"] });
      toast({ title: "Sjekkpunkter lagret" });
      setIsItemsDialogOpen(false);
      setItems([]);
      setSelectedTemplateId(null);
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    }
  });

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      description: "",
      trade: "UTF - Tømrerarbeid",
      phase: "Oppstart"
    });
    setEditingTemplate(null);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    resetTemplateForm();
    setIsTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || "",
      trade: template.trade || "UTF - Tømrerarbeid",
      phase: template.phase || "Oppstart"
    });
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ ...templateForm, id: editingTemplate.id });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  const handleManageItems = (template: Template) => {
    setSelectedTemplateId(template.id);
    setIsItemsDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!newItem.text.trim()) return;
    
    setItems([...items, {
      text: newItem.text,
      help_text: newItem.help_text,
      order_index: items.length
    }]);
    setNewItem({ text: "", help_text: "" });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveItems = () => {
    if (!selectedTemplateId) return;
    saveItemsMutation.mutate({ templateId: selectedTemplateId, items });
  };

  // Load existing items when dialog opens
  const handleOpenItemsDialog = (template: Template) => {
    setSelectedTemplateId(template.id);
    // Items will be loaded by the query
  };

  // Update items state when templateItems changes
  useEffect(() => {
    if (templateItems && isItemsDialogOpen) {
      setItems(templateItems);
    }
  }, [templateItems, isItemsDialogOpen]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Sjekkliste Generator</h1>
              <p className="text-muted-foreground mt-1">
                Lag egne sjekkliste maler som kan gjenbrukes på prosjekter
              </p>
            </div>
          </div>
          <Button onClick={handleCreateTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            Ny Mal
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Laster...</CardTitle>
              </CardHeader>
            </Card>
          ) : templates && templates.length > 0 ? (
            templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                  {template.phase && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Fase: {template.phase}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleOpenItemsDialog(template);
                        setIsItemsDialogOpen(true);
                      }}
                    >
                      <List className="mr-2 h-4 w-4" />
                      Sjekkpunkter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Rediger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Er du sikker på at du vil slette denne malen?")) {
                          deleteTemplateMutation.mutate(template.id);
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Ingen maler ennå</CardTitle>
                <CardDescription>
                  Klikk "Ny Mal" for å opprette din første sjekkliste mal
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Rediger Mal" : "Ny Sjekkliste Mal"}
              </DialogTitle>
              <DialogDescription>
                Opprett en gjenbrukbar sjekkliste mal for dine prosjekter
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="F.eks. Råbygg sjekkliste"
                />
              </div>
              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Kort beskrivelse av sjekklisten"
                />
              </div>
              <div>
                <Label htmlFor="phase">Fase</Label>
                <Select
                  value={templateForm.phase}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, phase: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oppstart">Oppstart</SelectItem>
                    <SelectItem value="Råbygg">Råbygg</SelectItem>
                    <SelectItem value="Utvendig">Utvendig</SelectItem>
                    <SelectItem value="Innvendig">Innvendig</SelectItem>
                    <SelectItem value="Ferdigstillelse">Ferdigstillelse</SelectItem>
                    <SelectItem value="Annet">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSaveTemplate} disabled={!templateForm.name.trim()}>
                {editingTemplate ? "Oppdater" : "Opprett"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Items Dialog */}
        <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Administrer Sjekkpunkter</DialogTitle>
              <DialogDescription>
                Legg til og rediger sjekkpunkter for denne malen
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Add new item */}
              <div className="space-y-2 p-4 border rounded-lg">
                <Label>Legg til nytt sjekkpunkt</Label>
                <Input
                  placeholder="Sjekkpunkt tekst"
                  value={newItem.text}
                  onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
                />
                <Input
                  placeholder="Hjelpetekst (valgfritt)"
                  value={newItem.help_text}
                  onChange={(e) => setNewItem({ ...newItem, help_text: e.target.value })}
                />
                <Button onClick={handleAddItem} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Legg til
                </Button>
              </div>

              {/* List existing items */}
              <div className="space-y-2">
                <Label>Sjekkpunkter ({items.length})</Label>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen sjekkpunkter lagt til ennå</p>
                ) : (
                  items.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.text}</p>
                        {item.help_text && (
                          <p className="text-sm text-muted-foreground mt-1">{item.help_text}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsItemsDialogOpen(false);
                setItems([]);
                setSelectedTemplateId(null);
              }}>
                Avbryt
              </Button>
              <Button onClick={handleSaveItems} disabled={items.length === 0}>
                Lagre Sjekkpunkter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
