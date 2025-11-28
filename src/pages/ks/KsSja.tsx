import { useState } from "react";
import { Plus, FileText, Edit2, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useKsProjects } from "@/hooks/useKsProjects";

interface KsSja {
  id: string;
  company_id: string;
  project_id?: string | null;
  sja_nr: string;
  title: string;
  aktivitet: string;
  identifisert_risiko: string;
  risikoreduserende_tiltak: string;
  utfort_sted?: string;
  utfort_dato?: string;
  utfort_navn?: string;
  tiltak_sted?: string;
  tiltak_dato?: string;
  tiltak_navn?: string;
  status: string;
  created_at: string;
}

export default function KsSja() {
  const { company } = useAuth();
  const queryClient = useQueryClient();
  const { projects } = useKsProjects();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedSja, setSelectedSja] = useState<KsSja | null>(null);
  const [formData, setFormData] = useState({
    project_id: "",
    sja_nr: "",
    title: "",
    aktivitet: "",
    identifisert_risiko: "",
    risikoreduserende_tiltak: "",
    utfort_sted: "",
    utfort_dato: new Date().toISOString().split("T")[0],
    utfort_navn: "",
    tiltak_sted: "",
    tiltak_dato: "",
    tiltak_navn: "",
  });

  // Fetch SJAs
  const { data: sjaList = [], isLoading } = useQuery({
    queryKey: ["ks-sja", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      
      const { data, error } = await supabase
        .from("ks_sja")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KsSja[];
    },
    enabled: !!company?.id,
  });

  // Create SJA mutation
  const createSjaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!company?.id) throw new Error("No company ID");

      const { data: result, error } = await supabase
        .from("ks_sja")
        .insert({
          company_id: company.id,
          project_id: data.project_id || null,
          sja_nr: data.sja_nr,
          title: data.title,
          aktivitet: data.aktivitet,
          identifisert_risiko: data.identifisert_risiko,
          risikoreduserende_tiltak: data.risikoreduserende_tiltak,
          utfort_sted: data.utfort_sted || null,
          utfort_dato: data.utfort_dato || null,
          utfort_navn: data.utfort_navn || null,
          tiltak_sted: data.tiltak_sted || null,
          tiltak_dato: data.tiltak_dato || null,
          tiltak_navn: data.tiltak_navn || null,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-sja"] });
      toast.success("SJA opprettet");
      setShowNewDialog(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Error creating SJA:", error);
      toast.error("Kunne ikke opprette SJA");
    },
  });

  // Delete SJA mutation
  const deleteSjaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ks_sja")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-sja"] });
      toast.success("SJA slettet");
      setSelectedSja(null);
    },
    onError: (error) => {
      console.error("Error deleting SJA:", error);
      toast.error("Kunne ikke slette SJA");
    },
  });

  const resetForm = () => {
    setFormData({
      project_id: "",
      sja_nr: "",
      title: "",
      aktivitet: "",
      identifisert_risiko: "",
      risikoreduserende_tiltak: "",
      utfort_sted: "",
      utfort_dato: new Date().toISOString().split("T")[0],
      utfort_navn: "",
      tiltak_sted: "",
      tiltak_dato: "",
      tiltak_navn: "",
    });
  };

  const handleCreate = () => {
    createSjaMutation.mutate(formData);
  };

  const handleEdit = (sja: KsSja) => {
    setFormData({
      project_id: sja.project_id || "",
      sja_nr: sja.sja_nr || "",
      title: sja.title || "",
      aktivitet: sja.aktivitet || "",
      identifisert_risiko: sja.identifisert_risiko || "",
      risikoreduserende_tiltak: sja.risikoreduserende_tiltak || "",
      utfort_sted: sja.utfort_sted || "",
      utfort_dato: sja.utfort_dato || new Date().toISOString().split("T")[0],
      utfort_navn: sja.utfort_navn || "",
      tiltak_sted: sja.tiltak_sted || "",
      tiltak_dato: sja.tiltak_dato || "",
      tiltak_navn: sja.tiltak_navn || "",
    });
    setSelectedSja(sja);
    setShowNewDialog(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sikker Jobb Analyse (SJA)</h1>
            <p className="text-muted-foreground">
              Analyser risikoer før oppstart av farlige arbeidsoppgaver
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowNewDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Ny SJA
          </Button>
        </div>

        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Sikker Jobb Analyse (SJA) skal gjennomføres før oppstart av kritiske eller risikofylte arbeidsoppgaver.
              SJA identifiserer farer og tiltak for å utføre arbeidet sikkert.
            </p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Laster...</p>
          </div>
        ) : sjaList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen SJA enda</h3>
              <p className="text-muted-foreground text-center mb-4">
                Opprett din første Sikker Jobb Analyse
              </p>
              <Button onClick={() => { resetForm(); setShowNewDialog(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Opprett SJA
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sjaList.map((sja) => (
              <Card key={sja.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">SJA {sja.sja_nr}</Badge>
                        <Badge variant={sja.status === 'active' ? 'default' : 'secondary'}>
                          {sja.status === 'active' ? 'Aktiv' : sja.status === 'completed' ? 'Fullført' : 'Arkivert'}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{sja.title}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(sja)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSjaMutation.mutate(sja.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sja.aktivitet && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Aktivitet</p>
                      <p className="text-sm">{sja.aktivitet}</p>
                    </div>
                  )}
                  {sja.identifisert_risiko && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Identifisert risiko</p>
                      <p className="text-sm">{sja.identifisert_risiko}</p>
                    </div>
                  )}
                  {sja.utfort_navn && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Utført av: {sja.utfort_navn}
                        {sja.utfort_dato && ` • ${new Date(sja.utfort_dato).toLocaleDateString("nb-NO")}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedSja ? 'Rediger SJA' : 'Ny Sikker Jobb Analyse'}</DialogTitle>
              <DialogDescription>
                Fyll ut skjemaet for å dokumentere sikker jobb analyse
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="project_id">Prosjekt (valgfritt)</Label>
                <Select value={formData.project_id || "none"} onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value === "none" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg prosjekt eller la stå tom for mal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ingen (mal)</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_number} - {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sja_nr">SJA Nr *</Label>
                  <Input
                    id="sja_nr"
                    value={formData.sja_nr}
                    onChange={(e) => setFormData(prev => ({ ...prev, sja_nr: e.target.value }))}
                    placeholder="F.eks. 1233"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Tittel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="F.eks. Montering av takstoler"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm">Sikker jobb analyse utført</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="utfort_sted">Sted</Label>
                    <Input
                      id="utfort_sted"
                      value={formData.utfort_sted}
                      onChange={(e) => setFormData(prev => ({ ...prev, utfort_sted: e.target.value }))}
                      placeholder="F.eks. 2. etasje"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utfort_dato">Dato</Label>
                    <Input
                      type="date"
                      id="utfort_dato"
                      value={formData.utfort_dato}
                      onChange={(e) => setFormData(prev => ({ ...prev, utfort_dato: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utfort_navn">Navn</Label>
                    <Input
                      id="utfort_navn"
                      value={formData.utfort_navn}
                      onChange={(e) => setFormData(prev => ({ ...prev, utfort_navn: e.target.value }))}
                      placeholder="Navn på utfører"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aktivitet">1. Aktivitet - Hva skal gjøres? *</Label>
                <Textarea
                  id="aktivitet"
                  value={formData.aktivitet}
                  onChange={(e) => setFormData(prev => ({ ...prev, aktivitet: e.target.value }))}
                  placeholder="Beskriv arbeidsoppgaven som skal utføres..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifisert_risiko">2. Identifisert risiko - Hva kan gå galt? *</Label>
                <Textarea
                  id="identifisert_risiko"
                  value={formData.identifisert_risiko}
                  onChange={(e) => setFormData(prev => ({ ...prev, identifisert_risiko: e.target.value }))}
                  placeholder="Beskriv risikoer og farer ved arbeidet..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="risikoreduserende_tiltak">3. Risikoreduserende tiltak *</Label>
                <Textarea
                  id="risikoreduserende_tiltak"
                  value={formData.risikoreduserende_tiltak}
                  onChange={(e) => setFormData(prev => ({ ...prev, risikoreduserende_tiltak: e.target.value }))}
                  placeholder="Beskriv tiltak for å redusere risiko..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm">Tiltak gjennomført</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="tiltak_sted">Sted</Label>
                    <Input
                      id="tiltak_sted"
                      value={formData.tiltak_sted}
                      onChange={(e) => setFormData(prev => ({ ...prev, tiltak_sted: e.target.value }))}
                      placeholder="F.eks. 2. etasje"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiltak_dato">Dato</Label>
                    <Input
                      type="date"
                      id="tiltak_dato"
                      value={formData.tiltak_dato}
                      onChange={(e) => setFormData(prev => ({ ...prev, tiltak_dato: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiltak_navn">Navn</Label>
                    <Input
                      id="tiltak_navn"
                      value={formData.tiltak_navn}
                      onChange={(e) => setFormData(prev => ({ ...prev, tiltak_navn: e.target.value }))}
                      placeholder="Navn på ansvarlig"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowNewDialog(false); setSelectedSja(null); }}>
                Avbryt
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!formData.sja_nr || !formData.title || !formData.aktivitet || !formData.identifisert_risiko || !formData.risikoreduserende_tiltak || createSjaMutation.isPending}
              >
                {selectedSja ? 'Lagre' : 'Opprett SJA'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
