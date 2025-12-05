import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  HardHat, 
  Plus, 
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Loader2,
  Trash2,
  Eye,
  ListChecks
} from "lucide-react";
import { useKsModule2Vernerunder, CreateVernerundeInput, KsModule2Vernerunde, Finding, CheckpointResponse } from "@/hooks/useKsModule2Vernerunder";
import { useKsModule2VernerundeTemplates, VernerundeTemplate } from "@/hooks/useKsModule2VernerundeTemplates";
import Ks2VernerundeWizard from "@/components/ks2/Ks2VernerundeWizard";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function Ks2Vernerunder() {
  const { projectId } = useParams();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [activeVernerunde, setActiveVernerunde] = useState<KsModule2Vernerunde | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<VernerundeTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<CreateVernerundeInput> & { template_id?: string }>({
    title: "",
    scheduled_date: format(new Date(), "yyyy-MM-dd"),
    responsible_name: "",
    template_id: "",
  });

  const { vernerunder, isLoading, createVernerunde, updateVernerunde, deleteVernerunde, completeVernerunde } = useKsModule2Vernerunder(projectId);
  const { templates, isLoading: templatesLoading } = useKsModule2VernerundeTemplates(projectId);

  const handleStartVernerunde = (vr: KsModule2Vernerunde) => {
    const template = templates.find(t => t.id === vr.template_id) || null;
    setActiveVernerunde(vr);
    setSelectedTemplate(template);
    
    // Update status to in_progress if planned
    if (vr.status === "planned") {
      updateVernerunde.mutate({ id: vr.id, status: "in_progress" });
    }
    
    setShowWizard(true);
  };

  const handleCompleteVernerunde = async (data: {
    checklist_responses: CheckpointResponse[];
    findings: Finding[];
    signature: string;
    inspector_name: string;
  }) => {
    if (!activeVernerunde) return;

    await completeVernerunde.mutateAsync({
      id: activeVernerunde.id,
      findings: data.findings,
      signature_data: data.signature,
    });

    // Also update checklist_responses
    await updateVernerunde.mutateAsync({
      id: activeVernerunde.id,
      checklist_responses: data.checklist_responses,
      completed_by_name: data.inspector_name,
    });

    setShowWizard(false);
    setActiveVernerunde(null);
    setSelectedTemplate(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Fullført</Badge>;
      case "in_progress":
        return <Badge>Pågår</Badge>;
      case "planned":
        return <Badge variant="secondary">Planlagt</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-primary" />;
      case "planned":
        return <Calendar className="h-5 w-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const planned = vernerunder.filter(v => v.status === "planned");
  const inProgress = vernerunder.filter(v => v.status === "in_progress");
  const completed = vernerunder.filter(v => v.status === "completed");
  const openFindings = vernerunder.reduce((acc, v) => 
    acc + (v.findings?.filter(f => f.status === "open")?.length || 0), 0
  );

  const handleCreate = async () => {
    if (!projectId || !formData.title || !formData.responsible_name || !formData.scheduled_date) {
      return;
    }

    const result = await createVernerunde.mutateAsync({
      project_id: projectId,
      title: formData.title,
      scheduled_date: formData.scheduled_date,
      responsible_name: formData.responsible_name,
    });

    // Update with template_id if selected
    if (formData.template_id && result) {
      await updateVernerunde.mutateAsync({
        id: result.id,
        template_id: formData.template_id,
      });
    }

    setShowNewDialog(false);
    setFormData({
      title: "",
      scheduled_date: format(new Date(), "yyyy-MM-dd"),
      responsible_name: "",
      template_id: "",
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne vernerunden?")) {
      await deleteVernerunde.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const getTemplateName = (templateId: string | null) => {
    if (!templateId) return null;
    const template = templates.find(t => t.id === templateId);
    return template?.template_name;
  };

  const renderVernerundeCard = (vr: KsModule2Vernerunde) => (
    <Card key={vr.id} className="hover:border-emerald-500/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(vr.status)}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{vr.title}</CardTitle>
                <span className="text-sm text-muted-foreground">({vr.vernerunde_number})</span>
              </div>
              <CardDescription>
                {vr.status === "completed" 
                  ? `Gjennomført: ${format(new Date(vr.completed_date!), "d. MMM yyyy", { locale: nb })}` 
                  : `Planlagt: ${format(new Date(vr.scheduled_date), "d. MMM yyyy", { locale: nb })}`}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(vr.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Ansvarlig: {vr.responsible_name}</span>
          </div>
          {vr.template_id && (
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <span>Mal: {getTemplateName(vr.template_id)}</span>
            </div>
          )}
          {vr.status === "completed" && vr.findings && (
            <>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{vr.findings.length} funn</span>
              </div>
              {vr.findings.filter(f => f.status === "open").length > 0 && (
                <div className="flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{vr.findings.filter(f => f.status === "open").length} åpne</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          {vr.status === "planned" ? (
            <Button 
              variant="default" 
              size="sm" 
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={() => handleStartVernerunde(vr)}
              disabled={updateVernerunde.isPending}
            >
              {updateVernerunde.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Start vernerunde
            </Button>
          ) : vr.status === "in_progress" ? (
            <Button 
              variant="default" 
              size="sm" 
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={() => handleStartVernerunde(vr)}
            >
              Fortsett vernerunde
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleStartVernerunde(vr)}>
              <Eye className="h-4 w-4 mr-2" />
              Vis detaljer
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDelete(vr.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <HardHat className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Vernerunder & RUH</h2>
            <p className="text-muted-foreground">Planlegg og gjennomfør vernerunder</p>
          </div>
        </div>
        <Button 
          className="bg-emerald-500 hover:bg-emerald-600"
          onClick={() => setShowNewDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Planlegg vernerunde
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gjennomført</CardDescription>
            <CardTitle className="text-2xl text-emerald-500">{completed.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pågår</CardDescription>
            <CardTitle className="text-2xl text-blue-500">{inProgress.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Planlagt</CardDescription>
            <CardTitle className="text-2xl">{planned.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Åpne funn</CardDescription>
            <CardTitle className="text-2xl text-amber-500">{openFindings}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Alle ({vernerunder.length})</TabsTrigger>
          <TabsTrigger value="in_progress">Pågår ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="planned">Planlagt ({planned.length})</TabsTrigger>
          <TabsTrigger value="completed">Fullført ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {vernerunder.length > 0 ? (
            vernerunder.map(renderVernerundeCard)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <HardHat className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen vernerunder</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Planlegg din første vernerunde for dette prosjektet
                </p>
                <Button 
                  className="bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => setShowNewDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Planlegg vernerunde
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {inProgress.length > 0 ? (
            inProgress.map(renderVernerundeCard)
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen pågående vernerunder
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="planned" className="space-y-4">
          {planned.length > 0 ? (
            planned.map(renderVernerundeCard)
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen planlagte vernerunder
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completed.length > 0 ? (
            completed.map(renderVernerundeCard)
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen fullførte vernerunder
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* New Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardHat className="h-5 w-5 text-emerald-500" />
              Planlegg vernerunde
            </DialogTitle>
            <DialogDescription>
              Opprett en ny planlagt vernerunde for prosjektet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tittel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="F.eks. Vernerunde uke 50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Sjekkliste-mal</Label>
              <Select
                value={formData.template_id}
                onValueChange={(value) => setFormData({ ...formData, template_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg mal (valgfritt)" />
                </SelectTrigger>
                <SelectContent>
                  {templatesLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <SelectItem value="none">Ingen mal</SelectItem>
                      {templates.filter(t => t.is_system_template).length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            System-maler
                          </div>
                          {templates.filter(t => t.is_system_template).map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.template_name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {templates.filter(t => !t.is_system_template).length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Egne maler
                          </div>
                          {templates.filter(t => !t.is_system_template).map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.template_name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Planlagt dato *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_name">Ansvarlig *</Label>
              <Input
                id="responsible_name"
                value={formData.responsible_name}
                onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
                placeholder="Navn på ansvarlig person"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Avbryt
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={handleCreate}
              disabled={!formData.title || !formData.responsible_name || !formData.scheduled_date || createVernerunde.isPending}
            >
              {createVernerunde.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Oppretter...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Planlegg
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vernerunde Wizard */}
      {activeVernerunde && (
        <Ks2VernerundeWizard
          open={showWizard}
          onOpenChange={(open) => {
            setShowWizard(open);
            if (!open) {
              setActiveVernerunde(null);
              setSelectedTemplate(null);
            }
          }}
          vernerunde={activeVernerunde}
          template={selectedTemplate}
          onComplete={handleCompleteVernerunde}
          isSubmitting={completeVernerunde.isPending}
        />
      )}
    </div>
  );
}
