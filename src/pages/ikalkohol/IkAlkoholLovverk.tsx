import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Scale,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Building2,
  Globe,
  BookOpen,
  ClipboardCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useAuth } from "@/contexts/AuthContext";
import { useIkAlkoholLovverk, AlkoholLovverk } from "@/hooks/useIkAlkoholLovverk";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const CATEGORY_CONFIG = {
  nasjonal: { label: "Nasjonal lov/forskrift", icon: Scale, color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
  kommunal: { label: "Kommunal retningslinje", icon: Building2, color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  veileder: { label: "Veileder/Ressurs", icon: BookOpen, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200" },
};

const COMPLIANCE_CATEGORY_LABELS: Record<string, string> = {
  lovverk: "Lovverk & retningslinjer",
  dokumentasjon: "Dokumentasjon",
  opplaering: "Opplæring & kompetanse",
  rutiner: "Rutiner & avvik",
  kontroll: "Kontroll & revidering",
};

export default function IkAlkoholLovverk() {
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { company, isLoading: authLoading } = useAuth();
  const {
    lovverk,
    complianceChecklist,
    isLoading,
    initializeDefaults,
    initializeChecklist,
    addLovverk,
    updateLovverk,
    deleteLovverk,
    toggleCompliance,
  } = useIkAlkoholLovverk();

  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<AlkoholLovverk | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    category: "kommunal" as "nasjonal" | "kommunal" | "veileder",
    source: "",
    municipality: "",
  });

  const loading = modulesLoading || authLoading || isLoading;

  // Redirect if module not active
  useEffect(() => {
    if (!loading && !hasModule("IK_ALKOHOL")) {
      navigate("/");
    }
  }, [hasModule, loading, navigate]);

  // Initialize defaults on first load
  useEffect(() => {
    if (company?.id && !isLoading && lovverk.length === 0) {
      initializeDefaults.mutate();
    }
  }, [company?.id, isLoading, lovverk.length]);

  useEffect(() => {
    if (company?.id && !isLoading && complianceChecklist.length === 0) {
      initializeChecklist.mutate();
    }
  }, [company?.id, isLoading, complianceChecklist.length]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const nasjonale = lovverk.filter(l => l.category === "nasjonal");
  const kommunale = lovverk.filter(l => l.category === "kommunal");
  const veiledere = lovverk.filter(l => l.category === "veileder");

  const fulfilledCount = complianceChecklist.filter(c => c.is_fulfilled).length;
  const totalCount = complianceChecklist.length;
  const compliancePercent = totalCount > 0 ? Math.round((fulfilledCount / totalCount) * 100) : 0;

  const groupedChecklist = complianceChecklist.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof complianceChecklist>);

  const openAdd = (category: "nasjonal" | "kommunal" | "veileder" = "kommunal") => {
    setEditingItem(null);
    setForm({ title: "", description: "", url: "", category, source: "", municipality: "" });
    setShowDialog(true);
  };

  const openEdit = (item: AlkoholLovverk) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description || "",
      url: item.url || "",
      category: item.category,
      source: item.source || "",
      municipality: item.municipality || "",
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("Tittel er påkrevd");
      return;
    }
    if (editingItem) {
      updateLovverk.mutate({ id: editingItem.id, ...form });
    } else {
      addLovverk.mutate(form as any);
    }
    setShowDialog(false);
  };

  const renderLovverkList = (items: AlkoholLovverk[], category: "nasjonal" | "kommunal" | "veileder") => {
    const config = CATEGORY_CONFIG[category];
    if (items.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <config.icon className={`h-8 w-8 mx-auto mb-3 ${config.color} opacity-50`} />
            <p className="text-muted-foreground text-sm mb-3">
              {category === "kommunal"
                ? "Ingen kommunale retningslinjer lagt til ennå"
                : `Ingen ${config.label.toLowerCase()} lagt til`}
            </p>
            <Button variant="outline" size="sm" onClick={() => openAdd(category)}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-2">
        {items.map(item => (
          <Card key={item.id} className={`${config.bgColor} hover:shadow-sm transition-shadow`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <config.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {item.source && (
                        <Badge variant="secondary" className="text-xs">{item.source}</Badge>
                      )}
                      {item.municipality && (
                        <Badge variant="outline" className="text-xs">{item.municipality}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(item.url!, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  {!item.is_default && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteLovverk.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Scale className="h-8 w-8 text-amber-600" />
            Lovverk & Etterlevelse
          </h1>
          <p className="text-muted-foreground mt-1">
            Nasjonale lover, kommunale retningslinjer og dokumentasjonskrav for alkoholhåndtering
          </p>
        </div>

        {/* Compliance overview card */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-amber-600" />
                Etterlevelse av IK-krav
              </h3>
              <span className="text-sm font-medium">
                {fulfilledCount} av {totalCount} krav oppfylt
              </span>
            </div>
            <Progress value={compliancePercent} className="h-2" />
            {compliancePercent < 100 && (
              <p className="text-xs text-muted-foreground mt-2">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Alle krav må dokumenteres for å bestå kontroll fra kommunen
              </p>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="lovverk">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lovverk">Lovverk & Retningslinjer</TabsTrigger>
            <TabsTrigger value="krav">Dokumentasjonskrav ({fulfilledCount}/{totalCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="lovverk" className="space-y-6 mt-4">
            {/* National laws */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Scale className="h-5 w-5 text-red-600" />
                  Nasjonale lover og forskrifter
                </h2>
                <Button variant="outline" size="sm" onClick={() => openAdd("nasjonal")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Legg til
                </Button>
              </div>
              {renderLovverkList(nasjonale, "nasjonal")}
            </div>

            {/* Municipal guidelines */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Kommunale alkoholpolitiske retningslinjer
                </h2>
                <Button variant="outline" size="sm" onClick={() => openAdd("kommunal")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Legg til
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Legg til alkoholpolitiske retningslinjer fra kommunen dere driver i. 
                Disse finner du vanligvis på kommunens nettside under &quot;Skjenkebevilling&quot; eller &quot;Alkoholpolitisk handlingsplan&quot;.
              </p>
              {renderLovverkList(kommunale, "kommunal")}
            </div>

            {/* Guides */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  Veiledere og ressurser
                </h2>
                <Button variant="outline" size="sm" onClick={() => openAdd("veileder")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Legg til
                </Button>
              </div>
              {renderLovverkList(veiledere, "veileder")}
            </div>
          </TabsContent>

          <TabsContent value="krav" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Krav til internkontroll etter alkoholloven</CardTitle>
                <CardDescription>
                  Huk av krav etter hvert som de er dokumentert i systemet. 
                  Klikk på lenken for å gå direkte til hvor kravet dokumenteres.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(groupedChecklist).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                      {COMPLIANCE_CATEGORY_LABELS[category] || category}
                    </h3>
                    <div className="space-y-2">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            item.is_fulfilled
                              ? "bg-green-50 border-green-200"
                              : "bg-background border-border"
                          }`}
                        >
                          <Checkbox
                            checked={item.is_fulfilled}
                            onCheckedChange={(checked) =>
                              toggleCompliance.mutate({ id: item.id, is_fulfilled: !!checked })
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${item.is_fulfilled ? "line-through text-muted-foreground" : ""}`}>
                              {item.requirement_text}
                            </p>
                            {item.is_fulfilled && item.fulfilled_by_name && item.fulfilled_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Bekreftet av {item.fulfilled_by_name},{" "}
                                {format(new Date(item.fulfilled_at), "d. MMM yyyy", { locale: nb })}
                              </p>
                            )}
                          </div>
                          {item.evidence_link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-shrink-0 text-xs"
                              onClick={() => navigate(item.evidence_link!)}
                            >
                              Gå til
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Rediger lovverk" : "Legg til lovverk"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Kategori</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm(f => ({ ...f, category: v as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nasjonal">Nasjonal lov/forskrift</SelectItem>
                    <SelectItem value="kommunal">Kommunal retningslinje</SelectItem>
                    <SelectItem value="veileder">Veileder/Ressurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tittel *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="F.eks. Alkoholpolitiske retningslinjer for Lillestrøm kommune"
                />
              </div>
              <div>
                <Label>Beskrivelse</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Kort beskrivelse av innholdet"
                  rows={2}
                />
              </div>
              <div>
                <Label>Lenke (URL)</Label>
                <Input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Kilde</Label>
                <Input
                  value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  placeholder="F.eks. Lillestrøm kommune, Lovdata"
                />
              </div>
              {form.category === "kommunal" && (
                <div>
                  <Label>Kommune</Label>
                  <Input
                    value={form.municipality}
                    onChange={e => setForm(f => ({ ...f, municipality: e.target.value }))}
                    placeholder="F.eks. Lillestrøm"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Avbryt</Button>
              <Button onClick={handleSave}>
                {editingItem ? "Lagre endringer" : "Legg til"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
