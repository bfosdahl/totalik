import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Search, Sparkles, FileText, Edit, Trash2, Eye, Copy,
  CheckCircle2, Archive, Send, Loader2, X, GripVertical,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const MODULES = [
  { value: "ks_ik_bygg", label: "KS/IK Bygg" },
  { value: "ik_hms", label: "HMS" },
  { value: "ik_mat", label: "IK Mat" },
  { value: "ik_alkohol", label: "IK Alkohol" },
  { value: "felles", label: "Felles" },
];

const FREQUENCIES = [
  { value: "daglig", label: "Daglig" },
  { value: "ukentlig", label: "Ukentlig" },
  { value: "maanedlig", label: "Månedlig" },
  { value: "aarlig", label: "Årlig" },
  { value: "ved_behov", label: "Ved behov" },
];

const ROLES = [
  "Daglig leder", "Verneombud", "Butikksjef", "Fagansvarlig",
  "HMS-ansvarlig", "Prosjektleder", "Kvalitetsleder", "Alle ansatte",
];

interface RoutineStep {
  id: string;
  text: string;
  is_checkbox: boolean;
}

interface RoutineTemplate {
  id: string;
  title: string;
  description: string | null;
  purpose: string | null;
  module: string;
  subcategory: string | null;
  target_roles: string[];
  frequency: string;
  steps: RoutineStep[];
  attachments: any[];
  legal_refs: any[];
  tags: string[];
  status: string;
  version: number;
  is_global_default: boolean;
  created_by: string | null;
  template_number: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  title: "",
  description: "",
  purpose: "",
  module: "felles",
  subcategory: "",
  target_roles: [] as string[],
  frequency: "ved_behov",
  steps: [] as RoutineStep[],
  legal_refs_text: "",
  tags_text: "",
  is_global_default: false,
};

export default function AdminRoutineMaker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showEditor, setShowEditor] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [showPreview, setShowPreview] = useState<RoutineTemplate | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  // AI state
  const [aiTema, setAiTema] = useState("");
  const [aiBransje, setAiBransje] = useState("");
  const [aiNivaa, setAiNivaa] = useState("standard");
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["admin-routine-templates-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_routine_templates_v2")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as RoutineTemplate[];
    },
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (isUpdate: boolean) => {
      const payload = {
        title: form.title,
        description: form.description || null,
        purpose: form.purpose || null,
        module: form.module,
        subcategory: form.subcategory || null,
        target_roles: form.target_roles,
        frequency: form.frequency,
        steps: JSON.parse(JSON.stringify(form.steps)),
        legal_refs: form.legal_refs_text
          ? JSON.parse(JSON.stringify(form.legal_refs_text.split("\n").filter(Boolean).map(t => ({ text: t }))))
          : [],
        tags: form.tags_text ? form.tags_text.split(",").map(t => t.trim()).filter(Boolean) : [],
        is_global_default: form.is_global_default,
      };

      if (isUpdate && editingId) {
        const { error } = await supabase
          .from("admin_routine_templates_v2")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_routine_templates_v2")
          .insert([{ ...payload, created_by: user?.id }]);
        if (error) throw error;
      }
    },
    onSuccess: async (_data, isUpdate) => {
      toast.success(editingId ? "Rutinemal oppdatert" : "Rutinemal opprettet");
      queryClient.invalidateQueries({ queryKey: ["admin-routine-templates-v2"] });
      
      // Auto-generate matching checklist when creating a new routine (not updating)
      if (!isUpdate && form.module === "ks_ik_bygg" && form.steps.length > 0) {
        try {
          toast.info("Genererer tilhørende sjekkliste...");
          const { data: checklistData, error: checklistError } = await supabase.functions.invoke("generate-checklist-template", {
            body: {
              tema: form.title,
              kategori: form.subcategory || undefined,
              trade: form.tags_text?.split(",")[0]?.trim() || undefined,
              detaljer: `Basert på rutine: ${form.title}. ${form.description || ""}. Steg: ${form.steps.map(s => s.text).join(", ")}`,
              rutine_referanse: form.title,
            },
          });
          if (checklistError) throw checklistError;
          if (checklistData?.checklist) {
            const cl = checklistData.checklist;
            const { error: saveErr } = await supabase.from("admin_checklist_templates").insert({
              template_name: cl.template_name || `Sjekkliste – ${form.title}`,
              description: cl.description || `Auto-generert sjekkliste for rutine: ${form.title}`,
              category: cl.category || form.subcategory || "Generell egenkontroll",
              trade: cl.trade || null,
              checkpoints: cl.checkpoints || [],
              is_active: true,
            });
            if (saveErr) throw saveErr;
            toast.success("Tilhørende sjekkliste opprettet automatisk!");
            queryClient.invalidateQueries({ queryKey: ["admin-checklist-templates"] });
          }
        } catch (e) {
          console.error("Auto-checklist generation failed:", e);
          toast.warning("Rutinen ble lagret, men sjekklisten kunne ikke genereres automatisk");
        }
      }
      
      resetEditor();
    },
    onError: () => toast.error("Kunne ikke lagre rutinemal"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_routine_templates_v2")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rutinemal slettet");
      queryClient.invalidateQueries({ queryKey: ["admin-routine-templates-v2"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "published") {
        // Bump version on publish
        const current = templates.find(t => t.id === id);
        if (current && current.status === "published") {
          updates.version = current.version + 1;
        }
      }
      const { error } = await supabase
        .from("admin_routine_templates_v2")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status oppdatert");
      queryClient.invalidateQueries({ queryKey: ["admin-routine-templates-v2"] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: RoutineTemplate) => {
      const { error } = await supabase
        .from("admin_routine_templates_v2")
        .insert([{
          title: `${template.title} (kopi)`,
          description: template.description,
          purpose: template.purpose,
          module: template.module,
          subcategory: template.subcategory,
          target_roles: template.target_roles,
          frequency: template.frequency,
          steps: JSON.parse(JSON.stringify(template.steps)),
          attachments: JSON.parse(JSON.stringify(template.attachments)),
          legal_refs: JSON.parse(JSON.stringify(template.legal_refs)),
          tags: template.tags,
          is_global_default: template.is_global_default,
          status: "draft",
          version: 1,
          created_by: user?.id,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rutinemal kopiert");
      queryClient.invalidateQueries({ queryKey: ["admin-routine-templates-v2"] });
    },
  });

  // Filtered templates
  const filtered = useMemo(() => {
    return templates.filter(t => {
      const matchSearch = searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchModule = filterModule === "all" || t.module === filterModule;
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      return matchSearch && matchModule && matchStatus;
    });
  }, [templates, searchQuery, filterModule, filterStatus]);

  const resetEditor = () => {
    setShowEditor(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEditor = (template?: RoutineTemplate) => {
    if (template) {
      setEditingId(template.id);
      setForm({
        title: template.title,
        description: template.description || "",
        purpose: template.purpose || "",
        module: template.module,
        subcategory: template.subcategory || "",
        target_roles: template.target_roles || [],
        frequency: template.frequency,
        steps: (template.steps || []) as RoutineStep[],
        legal_refs_text: (template.legal_refs as any[] || []).map((r: any) => r.text || r).join("\n"),
        tags_text: (template.tags || []).join(", "),
        is_global_default: template.is_global_default,
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setShowEditor(true);
  };

  const addStep = () => {
    setForm(prev => ({
      ...prev,
      steps: [...prev.steps, { id: crypto.randomUUID(), text: "", is_checkbox: true }],
    }));
  };

  const updateStep = (id: string, updates: Partial<RoutineStep>) => {
    setForm(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  };

  const removeStep = (id: string) => {
    setForm(prev => ({ ...prev, steps: prev.steps.filter(s => s.id !== id) }));
  };

  const toggleRole = (role: string) => {
    setForm(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role],
    }));
  };

  // AI generation
  const handleAiGenerate = async () => {
    if (!aiTema.trim()) {
      toast.error("Skriv inn et tema");
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-routine-template", {
        body: { tema: aiTema, bransje: aiBransje, nivaa: aiNivaa },
      });
      if (error) throw error;
      if (data?.routine) {
        const r = data.routine;
        setForm({
          title: r.title || "",
          description: r.description || "",
          purpose: r.purpose || "",
          module: r.module || "felles",
          subcategory: r.subcategory || "",
          target_roles: r.target_roles || [],
          frequency: r.frequency || "ved_behov",
          steps: (r.steps || []).map((s: any) => ({
            id: crypto.randomUUID(),
            text: typeof s === "string" ? s : s.text,
            is_checkbox: typeof s === "string" ? true : s.is_checkbox ?? true,
          })),
          legal_refs_text: (r.legal_refs || []).join("\n"),
          tags_text: (r.tags || []).join(", "),
          is_global_default: false,
        });
        setShowAiDialog(false);
        setShowEditor(true);
        toast.success("AI-forslag generert – rediger og lagre!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Kunne ikke generere rutine med AI");
    } finally {
      setAiLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="secondary">Utkast</Badge>;
      case "published": return <Badge className="bg-primary text-primary-foreground">Publisert</Badge>;
      case "archived": return <Badge variant="outline">Arkivert</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getModuleLabel = (mod: string) => MODULES.find(m => m.value === mod)?.label || mod;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Rutine Maker</h1>
            <p className="text-muted-foreground">Opprett og administrer rutinemaler for alle moduler</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAiDialog(true)}>
              <Sparkles className="w-4 h-4 mr-2" /> Lag med AI
            </Button>
            <Button onClick={() => openEditor()}>
              <Plus className="w-4 h-4 mr-2" /> Lag manuelt
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søk i rutinemaler..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle moduler</SelectItem>
              {MODULES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              <SelectItem value="draft">Utkast</SelectItem>
              <SelectItem value="published">Publisert</SelectItem>
              <SelectItem value="archived">Arkivert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Template list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Ingen rutinemaler funnet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Opprett din første rutinemal manuelt eller med AI</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map(t => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      {t.template_number && (
                        <span className="text-xs font-mono font-semibold text-primary shrink-0">{t.template_number}</span>
                      )}
                      <h3 className="font-semibold truncate max-w-[300px] sm:max-w-[400px] lg:max-w-none">{t.title}</h3>
                      {getStatusBadge(t.status)}
                      <Badge variant="outline">{getModuleLabel(t.module)}</Badge>
                      {t.is_global_default && <Badge variant="default" className="text-xs">Standard</Badge>}
                      <span className="text-xs text-muted-foreground">v{t.version}</span>
                    </div>
                    {t.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{t.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{FREQUENCIES.find(f => f.value === t.frequency)?.label || t.frequency}</span>
                      {t.subcategory && <span>• {t.subcategory}</span>}
                      <span>• Oppdatert {format(new Date(t.updated_at), "dd.MM.yyyy", { locale: nb })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setShowPreview(t)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditor(t)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => duplicateMutation.mutate(t)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    {t.status === "draft" && (
                      <Button variant="ghost" size="icon"
                        onClick={() => statusMutation.mutate({ id: t.id, status: "published" })}>
                        <Send className="w-4 h-4 text-primary" />
                      </Button>
                    )}
                    {t.status === "published" && (
                      <Button variant="ghost" size="icon"
                        onClick={() => statusMutation.mutate({ id: t.id, status: "archived" })}>
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon"
                      onClick={() => { if (confirm("Slette denne rutinen?")) deleteMutation.mutate(t.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={v => { if (!v) resetEditor(); }}>
         <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? "Rediger rutinemal" : "Ny rutinemal"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto pr-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            <div className="space-y-6 pb-4">
              {/* Basic info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Tittel *</Label>
                  <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="F.eks. Rutine for vernerunde" />
                </div>
                <div className="md:col-span-2">
                  <Label>Kort beskrivelse</Label>
                  <Textarea value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Hva handler denne rutinen om?" rows={2} />
                </div>
                <div className="md:col-span-2">
                  <Label>Formål</Label>
                  <Textarea value={form.purpose}
                    onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                    placeholder="Hvorfor er denne rutinen viktig?" rows={2} />
                </div>
              </div>

              <Separator />

              {/* Module & category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Modul *</Label>
                  <Select value={form.module} onValueChange={v => setForm(p => ({ ...p, module: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODULES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Underkategori (valgfritt)</Label>
                  <Input value={form.subcategory}
                    onChange={e => setForm(p => ({ ...p, subcategory: e.target.value }))}
                    placeholder="F.eks. Vernerunde, Renhold" />
                </div>
                <div>
                  <Label>Frekvens</Label>
                  <Select value={form.frequency} onValueChange={v => setForm(p => ({ ...p, frequency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tagger (kommaseparert)</Label>
                  <Input value={form.tags_text}
                    onChange={e => setForm(p => ({ ...p, tags_text: e.target.value }))}
                    placeholder="hms, kvalitet, bygg" />
                </div>
              </div>

              <Separator />

              {/* Roles */}
              <div>
                <Label>Målgruppe / roller</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ROLES.map(role => (
                    <Badge key={role}
                      variant={form.target_roles.includes(role) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleRole(role)}>
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Steg / sjekkliste</Label>
                  <Button variant="outline" size="sm" onClick={addStep}>
                    <Plus className="w-3 h-3 mr-1" /> Legg til punkt
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                      <Input
                        value={step.text}
                        onChange={e => updateStep(step.id, { text: e.target.value })}
                        placeholder="Beskriv steg..."
                        className="flex-1"
                      />
                      <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                        <input type="checkbox" checked={step.is_checkbox}
                          onChange={e => updateStep(step.id, { is_checkbox: e.target.checked })} />
                        Avkryssing
                      </label>
                      <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {form.steps.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Ingen steg lagt til ennå
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Legal refs */}
              <div>
                <Label>Lover/forskrifter (én per linje)</Label>
                <Textarea value={form.legal_refs_text}
                  onChange={e => setForm(p => ({ ...p, legal_refs_text: e.target.value }))}
                  placeholder="Arbeidsmiljøloven § 3-1&#10;Internkontrollforskriften § 5"
                  rows={3} />
              </div>

              {/* Global default */}
              <div className="flex items-center gap-3">
                <Switch checked={form.is_global_default}
                  onCheckedChange={v => setForm(p => ({ ...p, is_global_default: v }))} />
                <Label>Gjør til standardmal (tilgjengelig for alle kunder)</Label>
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={resetEditor}>Avbryt</Button>
            <Button onClick={() => saveMutation.mutate(!!editingId)} disabled={!form.title || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Oppdater" : "Opprett som utkast"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Dialog */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Generer rutine med AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tema / hva skal rutinen handle om? *</Label>
              <Textarea value={aiTema} onChange={e => setAiTema(e.target.value)}
                placeholder="F.eks. Vernerunde på byggeplass, Temperaturkontroll i matbutikk, Skjenkekontroll..."
                rows={3} />
            </div>
            <div>
              <Label>Bransje (valgfritt)</Label>
              <Input value={aiBransje} onChange={e => setAiBransje(e.target.value)}
                placeholder="F.eks. Bygg og anlegg, Restaurant, Dagligvare" />
            </div>
            <div>
              <Label>Detaljnivå</Label>
              <Select value={aiNivaa} onValueChange={setAiNivaa}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kort">Kort – få punkter</SelectItem>
                  <SelectItem value="standard">Standard – balansert</SelectItem>
                  <SelectItem value="detaljert">Detaljert – grundig</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAiGenerate} disabled={aiLoading || !aiTema.trim()} className="w-full">
              {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {aiLoading ? "Genererer..." : "Generer rutineforslag"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Forhåndsvisning</DialogTitle>
          </DialogHeader>
          {showPreview && (
            <ScrollArea className="flex-1 overflow-y-auto pr-4" style={{ maxHeight: "calc(90vh - 120px)" }}>
              <div className="space-y-4 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {showPreview.template_number && (
                    <span className="text-sm font-mono font-semibold text-primary">{showPreview.template_number}</span>
                  )}
                  {getStatusBadge(showPreview.status)}
                  <Badge variant="outline">{getModuleLabel(showPreview.module)}</Badge>
                  {showPreview.subcategory && <Badge variant="secondary">{showPreview.subcategory}</Badge>}
                  <span className="text-xs text-muted-foreground">v{showPreview.version}</span>
                </div>

                <div>
                  <h2 className="text-xl font-bold">{showPreview.title}</h2>
                  {showPreview.description && <p className="text-muted-foreground mt-1">{showPreview.description}</p>}
                </div>

                {showPreview.purpose && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Formål</h4>
                    <p className="text-sm">{showPreview.purpose}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Frekvens</h4>
                    <p className="text-sm">{FREQUENCIES.find(f => f.value === showPreview.frequency)?.label}</p>
                  </div>
                  {showPreview.target_roles?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Målgruppe</h4>
                      <div className="flex flex-wrap gap-1">
                        {showPreview.target_roles.map(r => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>

                {(showPreview.steps as RoutineStep[])?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Sjekkliste / steg</h4>
                    <div className="space-y-2">
                      {(showPreview.steps as RoutineStep[]).map((step, idx) => (
                        <div key={step.id || idx} className="flex items-start gap-2">
                          {step.is_checkbox ? (
                            <div className="w-4 h-4 mt-0.5 border rounded flex-shrink-0" />
                          ) : (
                            <span className="text-sm text-muted-foreground w-4">{idx + 1}.</span>
                          )}
                          <span className="text-sm">{step.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(showPreview.legal_refs as any[])?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Lover/forskrifter</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {(showPreview.legal_refs as any[]).map((ref, i) => (
                        <li key={i}>{typeof ref === "string" ? ref : ref.text}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {showPreview.tags?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Tagger</h4>
                    <div className="flex flex-wrap gap-1">
                      {showPreview.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
