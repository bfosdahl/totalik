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
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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

  const { checklists, isLoading: checklistsLoading, createChecklist } = useKsChecklists(id || null);
  const { templates } = useKsTemplates();

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
    </AppLayout>
  );
}