import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { useKsProjects } from "@/hooks/useKsProjects";

interface KsAvvik {
  id: string;
  avvik_nummer: string;
  tittel: string;
  beskrivelse: string | null;
  kategori: string;
  prioritet: string;
  status: string;
  ansvarlig: string | null;
  frist: string | null;
  oppdaget_dato: string;
  oppdaget_sted: string | null;
  company_id: string;
  project_id: string | null;
  created_at: string;
}

const priorityConfig = {
  low: { label: "Lav", color: "bg-blue-500" },
  medium: { label: "Middels", color: "bg-yellow-500" },
  high: { label: "Høy", color: "bg-red-500" },
};

const statusConfig = {
  open: { label: "Åpen", color: "bg-red-100 text-red-800" },
  in_progress: { label: "Under arbeid", color: "bg-yellow-100 text-yellow-800" },
  closed: { label: "Lukket", color: "bg-green-100 text-green-800" },
};

const categoryConfig = {
  quality: { label: "Kvalitet", icon: AlertCircle },
  safety: { label: "Sikkerhet", icon: AlertCircle },
  environment: { label: "Miljø", icon: AlertCircle },
  documentation: { label: "Dokumentasjon", icon: AlertCircle },
  other: { label: "Annet", icon: AlertCircle },
};

export default function KsAvvik() {
  const { toast } = useToast();
  const { company } = useAuth();
  const queryClient = useQueryClient();
  const { projects } = useKsProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAvvik, setEditingAvvik] = useState<KsAvvik | null>(null);
  const [formData, setFormData] = useState({
    project_id: "",
    avvik_nummer: "",
    tittel: "",
    beskrivelse: "",
    kategori: "quality",
    prioritet: "medium",
    status: "open",
    ansvarlig: "",
    frist: "",
    oppdaget_dato: new Date().toISOString().split('T')[0],
    oppdaget_sted: "",
  });

  const { data: avvikList = [], isLoading } = useQuery({
    queryKey: ['ks-avvik', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from('deviations')
        .select('*')
        .eq('company_id', company.id)
        .is('project_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(d => ({
        id: d.id,
        avvik_nummer: d.deviation_number,
        tittel: d.title,
        beskrivelse: d.description,
        kategori: d.category,
        prioritet: d.priority,
        status: d.status,
        ansvarlig: d.assignee_name,
        frist: d.due_date,
        oppdaget_dato: d.created_at.split('T')[0],
        oppdaget_sted: d.description?.split('\n')[0] || null,
        company_id: d.company_id,
        project_id: null,
        created_at: d.created_at,
      })) as KsAvvik[];
    },
    enabled: !!company?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!company?.id) throw new Error("No company");
      
      const { data: result, error } = await supabase
        .from('deviations')
        .insert({
          deviation_number: data.avvik_nummer,
          title: data.tittel,
          description: data.beskrivelse,
          category: data.kategori,
          priority: data.prioritet,
          status: data.status,
          assignee_name: data.ansvarlig || null,
          due_date: data.frist || new Date().toISOString().split('T')[0],
          reporter_name: "System",
          company_id: company.id,
          project_id: data.project_id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-avvik'] });
      toast({ title: "Avvik opprettet", description: "Avviket er registrert." });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Feil", description: "Kunne ikke opprette avvik.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('deviations')
        .update({
          deviation_number: data.avvik_nummer,
          title: data.tittel,
          description: data.beskrivelse,
          category: data.kategori,
          priority: data.prioritet,
          status: data.status,
          assignee_name: data.ansvarlig || null,
          due_date: data.frist || new Date().toISOString().split('T')[0],
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-avvik'] });
      toast({ title: "Avvik oppdatert", description: "Endringene er lagret." });
      setIsDialogOpen(false);
      setEditingAvvik(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deviations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks-avvik'] });
      toast({ title: "Avvik slettet", description: "Avviket er fjernet." });
    },
  });

  const resetForm = () => {
    setFormData({
      project_id: "",
      avvik_nummer: "",
      tittel: "",
      beskrivelse: "",
      kategori: "quality",
      prioritet: "medium",
      status: "open",
      ansvarlig: "",
      frist: "",
      oppdaget_dato: new Date().toISOString().split('T')[0],
      oppdaget_sted: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.avvik_nummer || !formData.tittel) {
      toast({ title: "Feil", description: "Avviksnummer og tittel er påkrevd.", variant: "destructive" });
      return;
    }

    if (editingAvvik) {
      updateMutation.mutate({ id: editingAvvik.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (avvik: KsAvvik) => {
    setEditingAvvik(avvik);
    setFormData({
      project_id: avvik.project_id || "",
      avvik_nummer: avvik.avvik_nummer,
      tittel: avvik.tittel,
      beskrivelse: avvik.beskrivelse || "",
      kategori: avvik.kategori,
      prioritet: avvik.prioritet,
      status: avvik.status,
      ansvarlig: avvik.ansvarlig || "",
      frist: avvik.frist || "",
      oppdaget_dato: avvik.oppdaget_dato,
      oppdaget_sted: avvik.oppdaget_sted || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Er du sikker på at du vil slette dette avviket?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Avvik</h1>
            <p className="text-muted-foreground">Registrer og følg opp avvik i byggeprosjekter</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAvvik(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nytt Avvik
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAvvik ? "Rediger Avvik" : "Nytt Avvik"}</DialogTitle>
              <DialogDescription>
                Registrer avvik oppdaget under byggeprosjekt
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project_id">Prosjekt (valgfritt)</Label>
                <Select value={formData.project_id} onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg prosjekt eller la stå tom for mal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ingen (mal)</SelectItem>
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
                  <Label htmlFor="avvik_nummer">Avviksnummer *</Label>
                  <Input
                    id="avvik_nummer"
                    value={formData.avvik_nummer}
                    onChange={(e) => setFormData(prev => ({ ...prev, avvik_nummer: e.target.value }))}
                    placeholder="F.eks. AVK-001"
                  />
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="oppdaget_dato">Oppdaget dato *</Label>
                    <Input
                      type="date"
                      id="oppdaget_dato"
                      value={formData.oppdaget_dato}
                      onChange={(e) => setFormData(prev => ({ ...prev, oppdaget_dato: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tittel">Tittel *</Label>
                  <Input
                    id="tittel"
                    value={formData.tittel}
                    onChange={(e) => setFormData(prev => ({ ...prev, tittel: e.target.value }))}
                    placeholder="Kort beskrivelse av avviket"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oppdaget_sted">Sted</Label>
                  <Input
                    id="oppdaget_sted"
                    value={formData.oppdaget_sted}
                    onChange={(e) => setFormData(prev => ({ ...prev, oppdaget_sted: e.target.value }))}
                    placeholder="F.eks. 2. etasje, rom 201"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beskrivelse">Beskrivelse</Label>
                  <Textarea
                    id="beskrivelse"
                    value={formData.beskrivelse}
                    onChange={(e) => setFormData(prev => ({ ...prev, beskrivelse: e.target.value }))}
                    placeholder="Detaljert beskrivelse av avviket..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="kategori">Kategori</Label>
                    <Select value={formData.kategori} onValueChange={(value) => setFormData(prev => ({ ...prev, kategori: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryConfig).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prioritet">Prioritet</Label>
                    <Select value={formData.prioritet} onValueChange={(value) => setFormData(prev => ({ ...prev, prioritet: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ansvarlig">Ansvarlig</Label>
                    <Input
                      id="ansvarlig"
                      value={formData.ansvarlig}
                      onChange={(e) => setFormData(prev => ({ ...prev, ansvarlig: e.target.value }))}
                      placeholder="Navn på ansvarlig"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frist">Frist</Label>
                    <Input
                      type="date"
                      id="frist"
                      value={formData.frist}
                      onChange={(e) => setFormData(prev => ({ ...prev, frist: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Avbryt</Button>
                <Button onClick={handleSubmit}>
                  {editingAvvik ? "Lagre endringer" : "Opprett avvik"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Laster avvik...</div>
        ) : avvikList.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Ingen avvik registrert ennå</p>
              <p className="text-sm text-muted-foreground">Klikk "Nytt Avvik" for å registrere ditt første avvik</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {avvikList.map((avvik) => (
              <Card key={avvik.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{avvik.tittel}</CardTitle>
                        <Badge variant="outline">{avvik.avvik_nummer}</Badge>
                      </div>
                      <CardDescription>{avvik.beskrivelse}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(avvik)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(avvik.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Kategori:</span>
                      <span>{categoryConfig[avvik.kategori as keyof typeof categoryConfig]?.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Prioritet:</span>
                      <div className="flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${priorityConfig[avvik.prioritet as keyof typeof priorityConfig]?.color}`} />
                        <span>{priorityConfig[avvik.prioritet as keyof typeof priorityConfig]?.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={statusConfig[avvik.status as keyof typeof statusConfig]?.color}>
                        {statusConfig[avvik.status as keyof typeof statusConfig]?.label}
                      </Badge>
                    </div>
                    {avvik.ansvarlig && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Ansvarlig:</span>
                        <span>{avvik.ansvarlig}</span>
                      </div>
                    )}
                    {avvik.frist && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Frist:</span>
                        <span>{new Date(avvik.frist).toLocaleDateString('nb-NO')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Oppdaget:</span>
                      <span>{new Date(avvik.oppdaget_dato).toLocaleDateString('nb-NO')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
