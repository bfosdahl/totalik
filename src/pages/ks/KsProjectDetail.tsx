import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  ClipboardCheck,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ExternalLink,
  ListTodo,
  Shield,
  AlertCircle,
  FileEdit,
  Layers,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KsProjectDocuments } from "@/components/ks/KsProjectDocuments";
import { KsProjectSubcontractors } from "@/components/ks/KsProjectSubcontractors";
import { KsChangeOrders } from "@/components/ks/KsChangeOrders";
import { KsSafetyRounds } from "@/components/ks/KsSafetyRounds";
import { KsHazardousConditions } from "@/components/ks/KsHazardousConditions";
import { KsActivityLog } from "@/components/ks/KsActivityLog";
import { CopyProjectDialog } from "@/components/ks/CopyProjectDialog";
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
import { supabase } from "@/integrations/supabase/client";
import { useKsChecklists, useKsTemplates, KsProject } from "@/hooks/useKsProjects";
import { useKsHmsPlan } from "@/hooks/useKsHmsPlan";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  planlagt: { label: "Planlagt", variant: "secondary" },
  pågår: { label: "Pågår", variant: "default" },
  ferdig: { label: "Ferdig", variant: "outline" },
  arkivert: { label: "Arkivert", variant: "destructive" },
};

export default function KsProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<KsProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChecklistDialog, setShowNewChecklistDialog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [checklistStats, setChecklistStats] = useState({ total: 0, completed: 0, avvik: 0 });
  const [selectedSja, setSelectedSja] = useState<any>(null);
  const [selectedDeviation, setSelectedDeviation] = useState<any>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  const { checklists, isLoading: checklistsLoading, createChecklist } = useKsChecklists(id || null);
  const { templates } = useKsTemplates();
  const { progress: hmsProgress, goals, risks, actions, sjaList } = useKsHmsPlan(id || null);

  // Fetch project SJAs
  const { data: projectSjas = [] } = useQuery({
    queryKey: ["project-sjas", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("ks_sja")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch project deviations
  const { data: projectDeviations = [] } = useQuery({
    queryKey: ["project-deviations", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("deviations")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('ks_projects')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Kunne ikke hente prosjekt');
        navigate('/ks/projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id, navigate]);

  // Calculate checklist stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!id || checklists.length === 0) {
        setChecklistStats({ total: 0, completed: 0, avvik: 0 });
        return;
      }

      try {
        const checklistIds = checklists.map(c => c.id);
        const { data: items, error } = await supabase
          .from('ks_checklist_items')
          .select('status')
          .in('checklist_id', checklistIds);

        if (error) throw error;

        const total = items?.length || 0;
        const completed = items?.filter(i => i.status === 'OK').length || 0;
        const avvik = items?.filter(i => i.status === 'AVVIK').length || 0;

        setChecklistStats({ total, completed, avvik });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [id, checklists]);

  const handleCreateChecklist = async () => {
    if (!selectedTemplateId) return;
    
    const result = await createChecklist(selectedTemplateId);
    if (result) {
      setShowNewChecklistDialog(false);
      setSelectedTemplateId("");
    }
  };

  const progressPercentage = checklistStats.total > 0 
    ? Math.round((checklistStats.completed / checklistStats.total) * 100) 
    : 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Prosjekt ikke funnet</p>
          <Button onClick={() => navigate('/ks/projects')} className="mt-4">
            Tilbake til prosjekter
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/ks/projects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              {project.client_name || "Ingen kunde"} 
              {project.address && (
                <>
                  <span className="mx-2">•</span>
                  <MapPin className="h-4 w-4" />
                  {project.address}
                </>
              )}
            </p>
          </div>
          <Badge variant={statusConfig[project.status]?.variant || "secondary"}>
            {statusConfig[project.status]?.label || project.status}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">KS Fremdrift</p>
                  <p className="text-3xl font-bold mt-2">{progressPercentage}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Oppfyller krav</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <Progress value={progressPercentage} className="h-2 mt-4" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sjekklister</p>
                  <p className="text-3xl font-bold mt-2">{checklists.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{checklistStats.completed} av {checklistStats.total} OK</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <ClipboardCheck className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Åpne avvik</p>
                  <p className="text-3xl font-bold mt-2">{checklistStats.avvik}</p>
                  <p className="text-xs text-muted-foreground mt-1">Krever handling</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SJA</p>
                  <p className="text-3xl font-bold mt-2">{projectSjas.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Neste 7 dager</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HMS Plan Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle>HMS-plan</CardTitle>
                <CardDescription>
                  {hmsProgress.is_completed 
                    ? "6 av 6 steg fullført" 
                    : goals.length > 0
                    ? `${hmsProgress.current_step + 1} av 6 steg fullført`
                    : "Opprett HMS-plan for prosjektet"}
                </CardDescription>
              </div>
              <Button 
                onClick={() => navigate(`/ks/projects/${id}/hms-plan`)}
                variant={hmsProgress.is_completed ? "outline" : "default"}
              >
                {hmsProgress.is_completed ? "Se HMS-plan" : goals.length > 0 ? "Fortsett" : "Start HMS-plan"}
              </Button>
            </div>
          </CardHeader>
          {(goals.length > 0 || risks.length > 0 || actions.length > 0) && (
            <CardContent>
              <Progress 
                value={hmsProgress.is_completed ? 100 : ((hmsProgress.current_step + 1) / 6) * 100} 
                className="h-2 mb-4" 
              />
              <div className="grid gap-3 md:grid-cols-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{goals.length} HMS-mål</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span>{risks.length} Risikoer</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-blue-600" />
                  <span>{actions.length} Tiltak</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span>{sjaList.length} SJA</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hurtighandlinger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => setShowNewChecklistDialog(true)}
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <ClipboardCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Start sjekkliste</p>
                  <p className="text-xs text-muted-foreground">Intern gjennomgang</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate('/ks/checklists')}
              >
                <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                  <ListTodo className="h-6 w-6 text-teal-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Se sjekklister</p>
                  <p className="text-xs text-muted-foreground">Alle utførte sjekklister</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate('/ks/templates')}
              >
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Layers className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Se maler</p>
                  <p className="text-xs text-muted-foreground">Tilgjengelige sjekklister</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate('/ks/sja')}
              >
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">SJA</p>
                  <p className="text-xs text-muted-foreground">Sikker jobb analyse</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate('/ks/avvik')}
              >
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Registrer avvik</p>
                  <p className="text-xs text-muted-foreground">Logg nytt avvik</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate('/ks/vernerunder')}
              >
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
                  <Shield className="h-6 w-6 text-cyan-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Vernerunde</p>
                  <p className="text-xs text-muted-foreground">HMS-inspeksjon</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate('/ks/farlige-fohold')}
              >
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Farlige forhold</p>
                  <p className="text-xs text-muted-foreground">Registrer fare</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate(`/ks/client/${id}`)}
              >
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <Building2 className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Byggherre</p>
                  <p className="text-xs text-muted-foreground">BH-dokumentasjon</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate(`/ks/projects/${id}/report`)}
              >
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <FileEdit className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Eksporter rapport</p>
                  <p className="text-xs text-muted-foreground">Last ned PDF</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => setShowCopyDialog(true)}
              >
                <div className="p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                  <Layers className="h-6 w-6 text-gray-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Kopier prosjekt</p>
                  <p className="text-xs text-muted-foreground">Gjenbruk oppsett</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => navigate('/ks/routines')}
              >
                <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                  <ListTodo className="h-6 w-6 text-teal-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Rutiner</p>
                  <p className="text-xs text-muted-foreground">Se rutinebank</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Nylige aktiviteter */}
        <Card>
          <CardHeader>
            <CardTitle>Siste aktivitet</CardTitle>
            <CardDescription>Nylige hendelser på prosjektet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checklists.length > 0 && (
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <ClipboardCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Sjekkliste opprettet</p>
                    <p className="text-xs text-muted-foreground">{checklists[0].template?.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(checklists[0].created_at).toLocaleDateString("nb-NO")}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => navigate(`/ks/checklists/${checklists[0].id}`)}
                  >
                    Se
                  </Button>
                </div>
              )}
              
              {projectSjas.length > 0 && (
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">SJA registrert</p>
                    <p className="text-xs text-muted-foreground">{projectSjas[0].title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(projectSjas[0].created_at).toLocaleDateString("nb-NO")}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedSja(projectSjas[0])}
                  >
                    Se
                  </Button>
                </div>
              )}

              {projectDeviations.length > 0 && (
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Avvik rapportert</p>
                    <p className="text-xs text-muted-foreground">{projectDeviations[0].title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(projectDeviations[0].created_at).toLocaleDateString("nb-NO")}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedDeviation(projectDeviations[0])}
                  >
                    Se
                  </Button>
                </div>
              )}

              {checklists.length === 0 && projectSjas.length === 0 && projectDeviations.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Ingen aktivitet enda</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start med å opprette en sjekkliste eller registrere en SJA
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Checklist Dialog */}
      <Dialog open={showNewChecklistDialog} onOpenChange={setShowNewChecklistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start ny sjekkliste</DialogTitle>
            <DialogDescription>
              Velg en KS-mal for å starte utfylling
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg mal" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span>{template.name}</span>
                      {template.phase && (
                        <span className="text-xs text-muted-foreground">{template.phase}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChecklistDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateChecklist} disabled={!selectedTemplateId}>
              Start sjekkliste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SJA Detail Dialog */}
      <Dialog open={!!selectedSja} onOpenChange={() => setSelectedSja(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>SJA {selectedSja?.sja_nr} - {selectedSja?.title}</DialogTitle>
            <DialogDescription>Sikker Jobb Analyse detaljer</DialogDescription>
          </DialogHeader>
          {selectedSja && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3 text-sm">
                {selectedSja.utfort_sted && (
                  <div>
                    <p className="font-medium text-muted-foreground">Sted</p>
                    <p>{selectedSja.utfort_sted}</p>
                  </div>
                )}
                {selectedSja.utfort_dato && (
                  <div>
                    <p className="font-medium text-muted-foreground">Dato</p>
                    <p>{new Date(selectedSja.utfort_dato).toLocaleDateString("nb-NO")}</p>
                  </div>
                )}
                {selectedSja.utfort_navn && (
                  <div>
                    <p className="font-medium text-muted-foreground">Utført av</p>
                    <p>{selectedSja.utfort_navn}</p>
                  </div>
                )}
              </div>
              
              {selectedSja.aktivitet && (
                <div>
                  <p className="font-medium mb-1">1. Aktivitet - Hva skal gjøres?</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedSja.aktivitet}</p>
                </div>
              )}
              
              {selectedSja.identifisert_risiko && (
                <div>
                  <p className="font-medium mb-1">2. Identifisert risiko - Hva kan gå galt?</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedSja.identifisert_risiko}</p>
                </div>
              )}
              
              {selectedSja.risikoreduserende_tiltak && (
                <div>
                  <p className="font-medium mb-1">3. Risikoreduserende tiltak</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedSja.risikoreduserende_tiltak}</p>
                </div>
              )}

              {(selectedSja.tiltak_sted || selectedSja.tiltak_dato || selectedSja.tiltak_navn) && (
                <div>
                  <p className="font-medium mb-2">Tiltak gjennomført</p>
                  <div className="grid gap-4 md:grid-cols-3 text-sm">
                    {selectedSja.tiltak_sted && (
                      <div>
                        <p className="font-medium text-muted-foreground">Sted</p>
                        <p>{selectedSja.tiltak_sted}</p>
                      </div>
                    )}
                    {selectedSja.tiltak_dato && (
                      <div>
                        <p className="font-medium text-muted-foreground">Dato</p>
                        <p>{new Date(selectedSja.tiltak_dato).toLocaleDateString("nb-NO")}</p>
                      </div>
                    )}
                    {selectedSja.tiltak_navn && (
                      <div>
                        <p className="font-medium text-muted-foreground">Ansvarlig</p>
                        <p>{selectedSja.tiltak_navn}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate('/ks/sja')}>
              Gå til SJA-register
            </Button>
            <Button onClick={() => setSelectedSja(null)}>Lukk</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deviation Detail Dialog */}
      <Dialog open={!!selectedDeviation} onOpenChange={() => setSelectedDeviation(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDeviation?.deviation_number} - {selectedDeviation?.title}</DialogTitle>
            <DialogDescription>Avviksdetaljer</DialogDescription>
          </DialogHeader>
          {selectedDeviation && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Kategori</p>
                  <p>{selectedDeviation.category}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Prioritet</p>
                  <p>{selectedDeviation.priority}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Status</p>
                  <Badge variant={selectedDeviation.status === 'open' ? 'destructive' : selectedDeviation.status === 'in_progress' ? 'default' : 'secondary'}>
                    {selectedDeviation.status === 'open' ? 'Åpen' : selectedDeviation.status === 'in_progress' ? 'Under arbeid' : 'Lukket'}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Frist</p>
                  <p>{selectedDeviation.due_date && new Date(selectedDeviation.due_date).toLocaleDateString("nb-NO")}</p>
                </div>
              </div>

              {selectedDeviation.description && (
                <div>
                  <p className="font-medium mb-1">Beskrivelse</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedDeviation.description}</p>
                </div>
              )}

              {selectedDeviation.assignee_name && (
                <div>
                  <p className="font-medium text-muted-foreground">Ansvarlig</p>
                  <p>{selectedDeviation.assignee_name}</p>
                </div>
              )}

              {selectedDeviation.reporter_name && (
                <div>
                  <p className="font-medium text-muted-foreground">Rapportert av</p>
                  <p>{selectedDeviation.reporter_name}</p>
                </div>
              )}

              <div>
                <p className="font-medium text-muted-foreground">Opprettet</p>
                <p className="text-sm">{new Date(selectedDeviation.created_at).toLocaleDateString("nb-NO")}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate('/ks/avvik')}>
              Gå til avviksregister
            </Button>
            <Button onClick={() => setSelectedDeviation(null)}>Lukk</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CopyProjectDialog
        open={showCopyDialog}
        onOpenChange={setShowCopyDialog}
        sourceProject={project}
        onSuccess={() => {
          navigate("/ks/projects");
        }}
      />
    </AppLayout>
  );
}