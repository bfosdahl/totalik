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
            <CardHeader className="pb-2">
              <CardDescription>KS Fremdrift</CardDescription>
              <CardTitle className="text-2xl">{progressPercentage}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercentage} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sjekklister</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                {checklists.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {checklistStats.completed} av {checklistStats.total} punkter OK
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avvik</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {checklistStats.avvik}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Åpne avvik</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tiltaksklasse</CardDescription>
              <CardTitle className="text-2xl">
                {project.tiltaksklasse || "-"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{project.ansvarsrolle}</p>
            </CardContent>
          </Card>
        </div>

        {/* HMS Plan Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>HMS-plan</CardTitle>
                <CardDescription>
                  {hmsProgress.is_completed 
                    ? "HMS-planen er fullført" 
                    : goals.length > 0
                    ? `Steg ${hmsProgress.current_step + 1} av 5 fullført`
                    : "Opprett HMS-plan for prosjektet"}
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => navigate(`/ks/projects/${id}/hms-plan`)}
              variant={hmsProgress.is_completed ? "outline" : "default"}
            >
              {hmsProgress.is_completed ? "Se HMS-plan" : goals.length > 0 ? "Fortsett" : "Start HMS-plan"}
            </Button>
          </CardHeader>
          {(goals.length > 0 || risks.length > 0 || actions.length > 0) && (
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span>{goals.length} HMS-mål</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span>{risks.length} Risikoer</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-green-600" />
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

        {/* Documents Section */}
        <KsProjectDocuments projectId={id!} />

        {/* Subcontractors Section */}
        <KsProjectSubcontractors projectId={id!} />

        {/* Change Orders Section */}
        <KsChangeOrders projectId={id!} />

        {/* Safety Rounds Section */}
        <KsSafetyRounds projectId={id!} />

        {/* Hazardous Conditions Section */}
        <KsHazardousConditions projectId={id!} />

        {/* Activity Log Section */}
        <KsActivityLog projectId={id!} />

        {/* SJA Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sikker Jobb Analyse (SJA)</CardTitle>
              <CardDescription>{projectSjas.length} SJA registrert for dette prosjektet</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/ks/sja')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Gå til SJA-register
            </Button>
          </CardHeader>
          <CardContent>
            {projectSjas.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Ingen SJA registrert for dette prosjektet</p>
                <p className="text-sm text-muted-foreground mb-4">Gå til SJA-registeret for å opprette ny SJA</p>
                <Button variant="outline" onClick={() => navigate('/ks/sja')}>
                  Gå til SJA-register
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {projectSjas.map((sja: any) => (
                  <div
                    key={sja.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedSja(sja)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">SJA {sja.sja_nr}</Badge>
                          <p className="font-medium">{sja.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {sja.utfort_dato && new Date(sja.utfort_dato).toLocaleDateString("nb-NO")}
                          {sja.utfort_navn && ` • ${sja.utfort_navn}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deviations Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Avvik</CardTitle>
              <CardDescription>{projectDeviations.length} avvik registrert for dette prosjektet</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/ks/avvik')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Gå til avviksregister
            </Button>
          </CardHeader>
          <CardContent>
            {projectDeviations.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Ingen avvik registrert for dette prosjektet</p>
                <p className="text-sm text-muted-foreground mb-4">Gå til avviksregisteret for å registrere avvik</p>
                <Button variant="outline" onClick={() => navigate('/ks/avvik')}>
                  Gå til avviksregister
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {projectDeviations.map((deviation: any) => (
                  <div
                    key={deviation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedDeviation(deviation)}
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{deviation.deviation_number}</Badge>
                          <p className="font-medium">{deviation.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {deviation.category} • {deviation.priority}
                          {deviation.due_date && ` • Frist: ${new Date(deviation.due_date).toLocaleDateString("nb-NO")}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={deviation.status === 'open' ? 'destructive' : deviation.status === 'in_progress' ? 'default' : 'secondary'}>
                      {deviation.status === 'open' ? 'Åpen' : deviation.status === 'in_progress' ? 'Under arbeid' : 'Lukket'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checklists Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sjekklister</CardTitle>
              <CardDescription>Kvalitetssikring og dokumentasjon</CardDescription>
            </div>
            <Button onClick={() => setShowNewChecklistDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Start sjekkliste
            </Button>
          </CardHeader>
          <CardContent>
            {checklistsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : checklists.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Ingen sjekklister enda</p>
                <Button variant="outline" onClick={() => setShowNewChecklistDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Start første sjekkliste
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {checklists.map((checklist) => (
                  <div
                    key={checklist.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/ks/checklists/${checklist.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{checklist.template?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {checklist.phase && `${checklist.phase} • `}
                          {new Date(checklist.created_at).toLocaleDateString("nb-NO")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Åpne</Badge>
                  </div>
                ))}
              </div>
            )}
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
    </AppLayout>
  );
}