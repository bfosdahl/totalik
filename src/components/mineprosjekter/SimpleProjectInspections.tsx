import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, ClipboardCheck, Calendar, MapPin, Users, Cloud, 
  Trash2, Edit, CheckCircle2, Clock, AlertTriangle, Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import type { Json } from "@/integrations/supabase/types";

interface Finding {
  id: string;
  description: string;
  severity: "ok" | "minor" | "major";
  action?: string;
}

interface Inspection {
  id: string;
  project_id: string;
  company_id: string;
  inspection_number: string;
  title: string;
  inspection_date: string;
  location: string | null;
  weather: string | null;
  participants: string | null;
  notes: string | null;
  findings: Finding[];
  status: string;
  created_by_name: string | null;
  completed_at: string | null;
  created_at: string;
}

interface SimpleProjectInspectionsProps {
  projectId: string;
}

const WEATHER_OPTIONS = [
  { value: "sol", label: "☀️ Sol" },
  { value: "skyet", label: "☁️ Skyet" },
  { value: "regn", label: "🌧️ Regn" },
  { value: "sno", label: "❄️ Snø" },
  { value: "vind", label: "💨 Vind" },
];

const SEVERITY_CONFIG = {
  ok: { label: "OK", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  minor: { label: "Mindre", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  major: { label: "Viktig", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle },
};

export function SimpleProjectInspections({ projectId }: SimpleProjectInspectionsProps) {
  const { company, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    inspection_date: format(new Date(), "yyyy-MM-dd"),
    location: "",
    weather: "",
    participants: "",
    notes: "",
    findings: [] as Finding[],
  });

  const { data: inspections, isLoading } = useQuery({
    queryKey: ["simple-project-inspections", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("simple_project_inspections")
        .select("*")
        .eq("project_id", projectId)
        .order("inspection_date", { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        findings: Array.isArray(d.findings) ? d.findings as unknown as Finding[] : []
      })) as Inspection[];
    },
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Generate inspection number
      const { data: numData } = await supabase.rpc("generate_inspection_number", {
        p_company_id: company?.id,
      });

      const { error } = await supabase
        .from("simple_project_inspections")
        .insert([{
          project_id: projectId,
          company_id: company?.id,
          inspection_number: numData || `BEF-${Date.now()}`,
          title: data.title,
          inspection_date: data.inspection_date,
          location: data.location || null,
          weather: data.weather || null,
          participants: data.participants || null,
          notes: data.notes || null,
          findings: JSON.parse(JSON.stringify(data.findings)),
          status: "draft",
          created_by_id: profile?.id,
          created_by_name: profile ? `${profile.first_name} ${profile.last_name}` : null,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simple-project-inspections", projectId] });
      toast.success("Befaring opprettet");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Kunne ikke opprette befaring");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("simple_project_inspections")
        .update({
          title: data.title,
          inspection_date: data.inspection_date,
          location: data.location || null,
          weather: data.weather || null,
          participants: data.participants || null,
          notes: data.notes || null,
          findings: JSON.parse(JSON.stringify(data.findings)),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simple-project-inspections", projectId] });
      toast.success("Befaring oppdatert");
      resetForm();
      setIsDialogOpen(false);
      setEditingId(null);
    },
    onError: () => {
      toast.error("Kunne ikke oppdatere befaring");
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("simple_project_inspections")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simple-project-inspections", projectId] });
      toast.success("Befaring fullført");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("simple_project_inspections")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simple-project-inspections", projectId] });
      toast.success("Befaring slettet");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      inspection_date: format(new Date(), "yyyy-MM-dd"),
      location: "",
      weather: "",
      participants: "",
      notes: "",
      findings: [],
    });
  };

  const handleEdit = (inspection: Inspection) => {
    setFormData({
      title: inspection.title,
      inspection_date: inspection.inspection_date,
      location: inspection.location || "",
      weather: inspection.weather || "",
      participants: inspection.participants || "",
      notes: inspection.notes || "",
      findings: inspection.findings || [],
    });
    setEditingId(inspection.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Tittel er påkrevd");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addFinding = () => {
    setFormData(prev => ({
      ...prev,
      findings: [
        ...prev.findings,
        { id: crypto.randomUUID(), description: "", severity: "ok", action: "" },
      ],
    }));
  };

  const updateFinding = (id: string, field: keyof Finding, value: string) => {
    setFormData(prev => ({
      ...prev,
      findings: prev.findings.map(f =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    }));
  };

  const removeFinding = (id: string) => {
    setFormData(prev => ({
      ...prev,
      findings: prev.findings.filter(f => f.id !== id),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" />
          Befaringer
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingId(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Ny befaring
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Rediger befaring" : "Ny befaring"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label>Tittel *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="F.eks. Oppstartsbefaring, Statusbefaring..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Dato
                  </Label>
                  <Input
                    type="date"
                    value={formData.inspection_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspection_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    Vær
                  </Label>
                  <Select
                    value={formData.weather}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, weather: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg vær..." />
                    </SelectTrigger>
                    <SelectContent>
                      {WEATHER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Sted
                  </Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Byggeplass, adresse..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Deltakere
                  </Label>
                  <Input
                    value={formData.participants}
                    onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
                    placeholder="Navn, kommaseparert"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Generelle notater</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Generelle observasjoner fra befaringen..."
                  rows={3}
                />
              </div>

              {/* Findings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Observasjoner / Funn</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFinding}>
                    <Plus className="w-4 h-4 mr-1" />
                    Legg til
                  </Button>
                </div>
                
                {formData.findings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen funn registrert. Klikk "Legg til" for å registrere observasjoner.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.findings.map((finding, index) => (
                      <Card key={finding.id} className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-muted-foreground mt-2">
                              #{index + 1}
                            </span>
                            <div className="flex-1 space-y-2">
                              <Input
                                value={finding.description}
                                onChange={(e) => updateFinding(finding.id, "description", e.target.value)}
                                placeholder="Beskriv observasjonen..."
                              />
                              <div className="grid gap-2 sm:grid-cols-2">
                                <Select
                                  value={finding.severity}
                                  onValueChange={(value) => updateFinding(finding.id, "severity", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ok">✅ OK</SelectItem>
                                    <SelectItem value="minor">⚠️ Mindre merknad</SelectItem>
                                    <SelectItem value="major">🚨 Viktig å følge opp</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={finding.action || ""}
                                  onChange={(e) => updateFinding(finding.id, "action", e.target.value)}
                                  placeholder="Tiltak (valgfritt)"
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => removeFinding(finding.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingId ? "Oppdater" : "Opprett"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {inspections?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">Ingen befaringer ennå</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Opprett din første befaring for å dokumentere observasjoner på byggeplassen.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Ny befaring
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inspections?.map((inspection) => {
            const majorFindings = inspection.findings?.filter(f => f.severity === "major").length || 0;
            const minorFindings = inspection.findings?.filter(f => f.severity === "minor").length || 0;
            
            return (
              <Card key={inspection.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          {inspection.inspection_number}
                        </span>
                        <Badge variant={inspection.status === "completed" ? "default" : "secondary"}>
                          {inspection.status === "completed" ? "Fullført" : "Utkast"}
                        </Badge>
                      </div>
                      <h4 className="font-medium mt-1">{inspection.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(inspection.inspection_date), "d. MMM yyyy", { locale: nb })}
                        </span>
                        {inspection.weather && (
                          <span>
                            {WEATHER_OPTIONS.find(w => w.value === inspection.weather)?.label || inspection.weather}
                          </span>
                        )}
                        {inspection.participants && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {inspection.participants}
                          </span>
                        )}
                      </div>
                      {(majorFindings > 0 || minorFindings > 0) && (
                        <div className="flex items-center gap-2 mt-2">
                          {majorFindings > 0 && (
                            <Badge className={SEVERITY_CONFIG.major.color}>
                              {majorFindings} viktig
                            </Badge>
                          )}
                          {minorFindings > 0 && (
                            <Badge className={SEVERITY_CONFIG.minor.color}>
                              {minorFindings} mindre
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {inspection.status !== "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => completeMutation.mutate(inspection.id)}
                          className="gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Fullfør
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(inspection)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(inspection.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
