import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Save, Trash2, Loader2, Building2, User, Calendar, 
  FileText, CheckSquare, Users, Receipt, BookOpen, Camera, StickyNote, Clock, ClipboardCheck, CheckCircle2, RotateCcw
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { toast } from "sonner";
import { SimpleProjectDocuments } from "@/components/mineprosjekter/SimpleProjectDocuments";
import { SimpleProjectChecklists } from "@/components/mineprosjekter/SimpleProjectChecklists";
import { SimpleProjectSubcontractors } from "@/components/mineprosjekter/SimpleProjectSubcontractors";
import { SimpleProjectFinances } from "@/components/mineprosjekter/SimpleProjectFinances";
import { SimpleProjectTemplates } from "@/components/mineprosjekter/SimpleProjectTemplates";
import { SimpleProjectPhotos } from "@/components/mineprosjekter/SimpleProjectPhotos";
import { SimpleProjectNotes } from "@/components/mineprosjekter/SimpleProjectNotes";
import { SimpleProjectTimesheet } from "@/components/mineprosjekter/SimpleProjectTimesheet";
import { SimpleProjectInspections } from "@/components/mineprosjekter/SimpleProjectInspections";
import { t } from "@/i18n/t";

const statusOptions = [
  { value: "planned", label: t("auto.planlagt") },
  { value: "active", label: t("auto.aktiv") },
  { value: "handover", label: t("auto.overlevering") },
  { value: "warranty", label: t("auto.garanti") },
  { value: "completed", label: t("auto.ferdig") },
];

export default function SimpleProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { users } = useCompanyUsers();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    project_name: "",
    project_number: "",
    address: "",
    gnr_bnr: "",
    client_name: "",
    client_org_number: "",
    client_contact_person: "",
    client_phone: "",
    client_email: "",
    contractor_type: "",
    project_leader_id: "",
    project_leader_name: "",
    planned_start_date: "",
    planned_end_date: "",
    contract_sum: "",
    description: "",
    status: "planned",
  });

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("ks_module2_projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            project_name: data.project_name || "",
            project_number: data.project_number || "",
            address: data.address || "",
            gnr_bnr: data.gnr_bnr || "",
            client_name: data.client_name || "",
            client_org_number: data.client_org_number || "",
            client_contact_person: data.client_contact_person || "",
            client_phone: data.client_phone || "",
            client_email: data.client_email || "",
            contractor_type: data.contractor_type || "",
            project_leader_id: data.project_leader_id || "",
            project_leader_name: data.project_leader_name || "",
            planned_start_date: data.planned_start_date || "",
            planned_end_date: data.planned_end_date || "",
            contract_sum: data.contract_sum?.toString() || "",
            description: data.description || "",
            status: data.status || "planned",
          });
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error(t("auto.kunne_ikke_hente_prosjekt"));
        navigate("/ks/smaaprosjekter");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, navigate]);

  const handleSave = async () => {
    if (!projectId) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("ks_module2_projects")
        .update({
          project_name: formData.project_name,
          project_number: formData.project_number,
          address: formData.address || null,
          gnr_bnr: formData.gnr_bnr || null,
          client_name: formData.client_name || null,
          client_org_number: formData.client_org_number || null,
          client_contact_person: formData.client_contact_person || null,
          client_phone: formData.client_phone || null,
          client_email: formData.client_email || null,
          contractor_type: formData.contractor_type || null,
          project_leader_id: formData.project_leader_id || null,
          project_leader_name: formData.project_leader_name || null,
          planned_start_date: formData.planned_start_date || null,
          planned_end_date: formData.planned_end_date || null,
          contract_sum: formData.contract_sum ? parseFloat(formData.contract_sum) : null,
          description: formData.description || null,
          status: formData.status,
        })
        .eq("id", projectId);

      if (error) throw error;
      toast.success(t("auto.prosjekt_lagret"));
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error(t("auto.kunne_ikke_lagre_prosjekt"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from("ks_module2_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      toast.success(t("auto.prosjekt_slettet"));
      navigate("/ks/smaaprosjekter");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(t("auto.kunne_ikke_slette_prosjekt"));
    }
  };

  const handleCompleteProject = async () => {
    if (!projectId) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("ks_module2_projects")
        .update({ status: "completed" })
        .eq("id", projectId);

      if (error) throw error;
      setFormData((prev) => ({ ...prev, status: "completed" }));
      toast.success(t("auto.prosjekt_fullfoert_det_vil_ikke_lenger_v"));
    } catch (error) {
      console.error("Error completing project:", error);
      toast.error(t("auto.kunne_ikke_fullfoere_prosjekt"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReopenProject = async () => {
    if (!projectId) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("ks_module2_projects")
        .update({ status: "active" })
        .eq("id", projectId);

      if (error) throw error;
      setFormData((prev) => ({ ...prev, status: "active" }));
      toast.success(t("auto.prosjekt_gjenaapnet"));
    } catch (error) {
      console.error("Error reopening project:", error);
      toast.error(t("auto.kunne_ikke_gjenaapne_prosjekt"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleProjectLeaderChange = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    setFormData((prev) => ({
      ...prev,
      project_leader_id: userId,
      project_leader_name: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "",
    }));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/ks/smaaprosjekter")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{formData.project_name || "Prosjekt"}</h1>
              {formData.project_number && (
                <p className="text-muted-foreground">#{formData.project_number}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {formData.status === "completed" ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Fullført
              </Badge>
            ) : null}
            
            {formData.status === "completed" ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Gjenåpne
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("auto.gjenaapne_prosjekt")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("auto.prosjektet_vil_bli_satt_til_aktiv_status")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReopenProject}>
                      {t("auto.gjenaapne")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-green-700 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Fullfør
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("auto.fullfoer_prosjekt")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("auto.prosjektet_vil_bli_markert_som_fullfoert")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCompleteProject} className="bg-green-600 hover:bg-green-700">
                      {t("auto.fullfoer_prosjekt_2")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Slett
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("auto.slett_prosjekt")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("auto.dette_vil_slette_prosjektet_og_all_tilho")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t("auto.slett")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Lagre
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="info" className="gap-2 py-2 px-3">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auto.info")}</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2 py-2 px-3">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auto.malbank")}</span>
            </TabsTrigger>
            <TabsTrigger value="checklists" className="gap-2 py-2 px-3">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auto.sjekklister")}</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="gap-2 py-2 px-3">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auto.bilder")}</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2 py-2 px-3">
              <StickyNote className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auto.notater")}</span>
            </TabsTrigger>
            <TabsTrigger value="timesheet" className="gap-2 py-2 px-3">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auto.timer")}</span>
            </TabsTrigger>
            <TabsTrigger value="inspections" className="gap-2 py-2 px-3">
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auto.befaringer")}</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2 py-2 px-3">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auto.dokumenter")}</span>
            </TabsTrigger>
            <TabsTrigger value="subcontractors" className="gap-2 py-2 px-3">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">UE</span>
            </TabsTrigger>
            <TabsTrigger value="finances" className="gap-2 py-2 px-3">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auto.oekonomi")}</span>
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Prosjektinfo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("auto.prosjektnavn")}</Label>
                    <Input
                      value={formData.project_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, project_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.prosjektnummer")}</Label>
                    <Input
                      value={formData.project_number}
                      onChange={(e) => setFormData((prev) => ({ ...prev, project_number: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.adresse")}</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.status_2")}</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Client Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Kunde
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("auto.kundenavn")}</Label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.kontaktperson_2")}</Label>
                    <Input
                      value={formData.client_contact_person}
                      onChange={(e) => setFormData((prev) => ({ ...prev, client_contact_person: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.telefon")}</Label>
                    <Input
                      value={formData.client_phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, client_phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.e_post_2")}</Label>
                    <Input
                      value={formData.client_email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, client_email: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Datoer & økonomi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t("auto.oppstart")}</Label>
                      <Input
                        type="date"
                        value={formData.planned_start_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, planned_start_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("auto.ferdig")}</Label>
                      <Input
                        type="date"
                        value={formData.planned_end_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, planned_end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Kontraktssum (kr)</Label>
                    <Input
                      type="number"
                      value={formData.contract_sum}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contract_sum: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auto.ansvarlig_2")}</Label>
                    <Select
                      value={formData.project_leader_id}
                      onValueChange={handleProjectLeaderChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("auto.velg_ansvarlig")} />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("auto.beskrivelse")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder={t("auto.beskrivelse_av_prosjektet")}
                    rows={6}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <SimpleProjectTemplates projectId={projectId!} />
          </TabsContent>

          {/* Checklists Tab */}
          <TabsContent value="checklists">
            <SimpleProjectChecklists projectId={projectId!} />
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <SimpleProjectPhotos projectId={projectId!} />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <SimpleProjectNotes projectId={projectId!} />
          </TabsContent>

          {/* Inspections Tab */}
          <TabsContent value="inspections">
            <SimpleProjectInspections projectId={projectId!} />
          </TabsContent>

          {/* Timesheet Tab */}
          <TabsContent value="timesheet">
            <SimpleProjectTimesheet projectId={projectId!} />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <SimpleProjectDocuments projectId={projectId!} />
          </TabsContent>

          {/* Subcontractors Tab */}
          <TabsContent value="subcontractors">
            <SimpleProjectSubcontractors projectId={projectId!} />
          </TabsContent>

          {/* Finances Tab */}
          <TabsContent value="finances">
            <SimpleProjectFinances projectId={projectId!} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
