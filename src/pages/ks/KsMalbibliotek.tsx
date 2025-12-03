import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  FileText,
  Pencil,
  Trash2,
  Copy,
  CheckCircle2,
  Camera,
  Settings,
  Layers,
  Building2,
  HardHat,
  Droplets,
  Paintbrush,
  Home,
  FileCheck,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useKsTemplates } from "@/hooks/useKsProjects";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Categories with icons
const categories = [
  { id: "betong", label: "Betong", icon: Building2 },
  { id: "tommer", label: "Tømrer", icon: HardHat },
  { id: "vatrom", label: "Våtrom", icon: Droplets },
  { id: "maler", label: "Maler", icon: Paintbrush },
  { id: "sluttkontroll", label: "Sluttkontroll", icon: CheckCircle2 },
  { id: "fdv", label: "FDV", icon: FileCheck },
  { id: "annet", label: "Annet", icon: FileText },
];

// Example templates
const exampleTemplates = [
  {
    id: "1",
    name: "Betongstøp gulv på grunn",
    category: "betong",
    description: "Kontroll av betongstøp for gulv på grunn etter NS-standard",
    itemCount: 12,
    hasRequiredPhotos: true,
    isSystem: true,
  },
  {
    id: "2",
    name: "Montering våtromsplater",
    category: "vatrom",
    description: "Sjekkliste for montering av våtromsplater iht. produsentens anvisning",
    itemCount: 15,
    hasRequiredPhotos: true,
    isSystem: true,
  },
  {
    id: "3",
    name: "Sluttkontroll bad (NS 3600)",
    category: "vatrom",
    description: "Komplett sluttkontroll av våtrom etter NS 3600",
    itemCount: 24,
    hasRequiredPhotos: true,
    isSystem: true,
  },
  {
    id: "4",
    name: "FDV-kontroll før overtakelse",
    category: "fdv",
    description: "Kontroll av FDV-dokumentasjon før overtakelse",
    itemCount: 18,
    hasRequiredPhotos: false,
    isSystem: true,
  },
  {
    id: "5",
    name: "Tømrerarbeid - Yttervegg",
    category: "tommer",
    description: "Kontroll av tømrerarbeid for yttervegg",
    itemCount: 16,
    hasRequiredPhotos: true,
    isSystem: true,
  },
];

interface Template {
  id: string;
  name: string;
  category: string;
  description?: string;
  itemCount: number;
  hasRequiredPhotos: boolean;
  isSystem: boolean;
}

interface TemplateItem {
  id: string;
  text: string;
  type: "yes_no" | "number" | "photo_required" | "text";
  required: boolean;
}

export default function KsMalbibliotek() {
  const navigate = useNavigate();
  const { profile, isCompanyAdmin } = useAuth();
  const { templates: dbTemplates } = useKsTemplates();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
  });
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);

  // Initialize templates
  useEffect(() => {
    // Combine example templates with database templates
    const dbMapped: Template[] = dbTemplates.map((t: any) => ({
      id: t.id,
      name: t.name,
      category: t.category || "annet",
      description: "",
      itemCount: 0,
      hasRequiredPhotos: false,
      isSystem: !t.company_id,
    }));

    setTemplates([...exampleTemplates, ...dbMapped]);
    setIsLoading(false);
  }, [dbTemplates]);

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== "all" && t.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const systemTemplates = filteredTemplates.filter((t) => t.isSystem);
  const customTemplates = filteredTemplates.filter((t) => !t.isSystem);

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Fyll ut navn og kategori");
      return;
    }

    try {
      // In production, this would insert into ks_templates
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: formData.name,
        category: formData.category,
        description: formData.description,
        itemCount: templateItems.length,
        hasRequiredPhotos: templateItems.some((i) => i.type === "photo_required"),
        isSystem: false,
      };

      setTemplates((prev) => [...prev, newTemplate]);
      setShowNewDialog(false);
      setFormData({ name: "", category: "", description: "" });
      setTemplateItems([]);
      toast.success("Mal opprettet");
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Kunne ikke opprette mal");
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (template.isSystem) {
      toast.error("Kan ikke slette systemmal");
      return;
    }

    if (!confirm("Er du sikker på at du vil slette denne malen?")) {
      return;
    }

    setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    toast.success("Mal slettet");
  };

  const handleDuplicateTemplate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (kopi)`,
      isSystem: false,
    };
    setTemplates((prev) => [...prev, newTemplate]);
    toast.success("Mal duplisert");
  };

  const handleUseTemplate = (template: Template) => {
    // Navigate to create new egenkontroll with this template
    navigate(`/ks/egenkontroller?template=${template.id}`);
  };

  const addTemplateItem = () => {
    setTemplateItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: "",
        type: "yes_no",
        required: false,
      },
    ]);
  };

  const updateTemplateItem = (id: string, field: keyof TemplateItem, value: any) => {
    setTemplateItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeTemplateItem = (id: string) => {
    setTemplateItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.icon || FileText;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Malbibliotek</h1>
            <p className="text-muted-foreground">
              Administrer og opprett maler for egenkontroller
            </p>
          </div>
          {isCompanyAdmin && (
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ny mal
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk i maler..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle kategorier</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="system">
          <TabsList>
            <TabsTrigger value="system">
              Standard maler ({systemTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="custom">
              Egne maler ({customTemplates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {systemTemplates.map((template) => {
                const CategoryIcon = getCategoryIcon(template.category);
                return (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <CategoryIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              {categories.find((c) => c.id === template.category)?.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {template.description && (
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          {template.itemCount} punkter
                        </span>
                        {template.hasRequiredPhotos && (
                          <span className="flex items-center gap-1">
                            <Camera className="h-4 w-4" />
                            Obl. bilder
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUseTemplate(template)}
                        >
                          Bruk mal
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            {customTemplates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">Ingen egne maler</h3>
                  <p className="text-muted-foreground mb-4">
                    Opprett din første egenkontrollmal eller dupliser en systemmal
                  </p>
                  <Button onClick={() => setShowNewDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Opprett mal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {customTemplates.map((template) => {
                  const CategoryIcon = getCategoryIcon(template.category);
                  return (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <CategoryIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              <Badge variant="outline" className="mt-1">
                                {categories.find((c) => c.id === template.category)?.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {template.description && (
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            {template.itemCount} punkter
                          </span>
                          {template.hasRequiredPhotos && (
                            <span className="flex items-center gap-1">
                              <Camera className="h-4 w-4" />
                              Obl. bilder
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUseTemplate(template)}
                          >
                            Bruk mal
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowEditDialog(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTemplate(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* New Template Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ny mal</DialogTitle>
              <DialogDescription>
                Opprett en ny egenkontrollmal med sjekkpunkter
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Navn *</Label>
                  <Input
                    placeholder="F.eks. Våtromskontroll"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategori *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea
                  placeholder="Kort beskrivelse av malen..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Template Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Sjekkpunkter</Label>
                  <Button size="sm" variant="outline" onClick={addTemplateItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Legg til punkt
                  </Button>
                </div>
                <div className="space-y-2">
                  {templateItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 p-3 rounded-lg border bg-muted/50"
                    >
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Sjekkpunkttekst..."
                          value={item.text}
                          onChange={(e) => updateTemplateItem(item.id, "text", e.target.value)}
                        />
                        <div className="flex items-center gap-4">
                          <Select
                            value={item.type}
                            onValueChange={(val) => updateTemplateItem(item.id, "type", val)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes_no">Ja/Nei</SelectItem>
                              <SelectItem value="number">Tallverdi</SelectItem>
                              <SelectItem value="photo_required">Obligatorisk bilde</SelectItem>
                              <SelectItem value="text">Fritekst</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`required-${item.id}`}
                              checked={item.required}
                              onCheckedChange={(checked) =>
                                updateTemplateItem(item.id, "required", checked)
                              }
                            />
                            <Label htmlFor={`required-${item.id}`} className="text-sm">
                              Påkrevd
                            </Label>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeTemplateItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {templateItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Ingen sjekkpunkter lagt til enda
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreateTemplate}>Opprett mal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
