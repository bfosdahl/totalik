import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useToast } from "@/hooks/use-toast";
import Ks2ProjectMap from "@/components/ks2/Ks2ProjectMap";
import { t } from "@/i18n/t";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Ks2Prosjektinfo() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { users } = useCompanyUsers();
  const [project, setProject] = useState<KsModule2Project | null>(null);
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
    contractor_type: "" as "total" | "hoved" | "under" | "",
    project_leader_id: "",
    project_leader_name: "",
    sha_coordinator_kp: "",
    sha_coordinator_ku: "",
    planned_start_date: "",
    planned_end_date: "",
    contract_sum: "",
    description: "",
    status: "active" as "planned" | "active" | "handover" | "warranty" | "completed",
    partner_name: "",
    partner_org_number: "",
    partner_logo_url: "",
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        const { data, error } = await supabase
          .from("ks_module2_projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (error) throw error;
        
        const p = data as KsModule2Project;
        setProject(p);
        setFormData({
          project_name: p.project_name || "",
          project_number: p.project_number || "",
          address: p.address || "",
          gnr_bnr: p.gnr_bnr || "",
          client_name: p.client_name || "",
          client_org_number: p.client_org_number || "",
          client_contact_person: p.client_contact_person || "",
          client_phone: p.client_phone || "",
          client_email: p.client_email || "",
          contractor_type: p.contractor_type || "",
          project_leader_id: p.project_leader_id || "",
          project_leader_name: p.project_leader_name || "",
          sha_coordinator_kp: p.sha_coordinator_kp || "",
          sha_coordinator_ku: p.sha_coordinator_ku || "",
          planned_start_date: p.planned_start_date || "",
          planned_end_date: p.planned_end_date || "",
          contract_sum: p.contract_sum?.toString() || "",
          description: p.description || "",
          status: p.status,
          partner_name: (p as any).partner_name || "",
          partner_org_number: (p as any).partner_org_number || "",
          partner_logo_url: (p as any).partner_logo_url || "",
        });
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectLeader = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    setFormData((prev) => ({
      ...prev,
      project_leader_id: userId,
      project_leader_name: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "",
    }));
  };

  const handleSave = async () => {
    if (!projectId) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("ks_module2_projects")
        .update({
          project_name: formData.project_name,
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
          sha_coordinator_kp: formData.sha_coordinator_kp || null,
          sha_coordinator_ku: formData.sha_coordinator_ku || null,
          planned_start_date: formData.planned_start_date || null,
          planned_end_date: formData.planned_end_date || null,
          contract_sum: formData.contract_sum ? parseFloat(formData.contract_sum) : null,
          description: formData.description || null,
          status: formData.status,
          partner_name: formData.partner_name || null,
          partner_org_number: formData.partner_org_number || null,
          partner_logo_url: formData.partner_logo_url || null,
        } as any)
        .eq("id", projectId);

      if (error) throw error;
      toast({ title: t("auto.prosjekt_oppdatert") });
    } catch (error) {
      console.error("Error saving:", error);
      toast({ title: t("auto.feil"), description: t("auto.kunne_ikke_lagre_2"), variant: "destructive" });
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
      toast({ title: t("auto.prosjekt_slettet") });
      navigate("/ks");
    } catch (error) {
      console.error("Error deleting:", error);
      toast({ title: t("auto.feil"), description: t("auto.kunne_ikke_slette"), variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("auto.prosjektinfo")}</h1>
          <p className="text-muted-foreground">{t("auto.rediger_prosjektdetaljer")}</p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                {t("auto.slett")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("auto.slett_prosjekt")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("auto.dette_vil_permanent_slette_prosjektet_og")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                  {t("auto.slett_prosjekt_2")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Lagre
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("auto.grunnleggende_info")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("auto.prosjektnavn_2")}</Label>
              <Input
                value={formData.project_name}
                onChange={(e) => handleChange("project_name", e.target.value)}
              />
            </div>
            <div>
              <Label>{t("auto.prosjektnummer")}</Label>
              <Input value={formData.project_number} disabled className="bg-muted" />
            </div>
            <div>
              <Label>{t("auto.adresse")}</Label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
            <div>
              <Label>{t("auto.gnr_bnr")}</Label>
              <Input
                value={formData.gnr_bnr}
                onChange={(e) => handleChange("gnr_bnr", e.target.value)}
              />
            </div>
            <div>
              <Label>{t("auto.status_2")}</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">{t("auto.planlagt")}</SelectItem>
                  <SelectItem value="active">{t("auto.aktiv")}</SelectItem>
                  <SelectItem value="handover">{t("auto.overtakelse")}</SelectItem>
                  <SelectItem value="warranty">{t("auto.garanti")}</SelectItem>
                  <SelectItem value="completed">{t("auto.avsluttet")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("auto.entreprenoerform")}</Label>
              <Select
                value={formData.contractor_type}
                onValueChange={(v) => handleChange("contractor_type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("auto.velg")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">{t("auto.totalentreprenoer")}</SelectItem>
                  <SelectItem value="hoved">{t("auto.hovedentreprenoer")}</SelectItem>
                  <SelectItem value="under">{t("auto.underentreprenoer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Ks2ProjectMap 
          address={formData.address}
          gnrBnr={formData.gnr_bnr}
          projectName={formData.project_name}
        />

        {/* Client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("auto.byggherre")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("auto.navn_2")}</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => handleChange("client_name", e.target.value)}
              />
            </div>
            <div>
              <Label>{t("auto.org_nr")}</Label>
              <Input
                value={formData.client_org_number}
                onChange={(e) => handleChange("client_org_number", e.target.value)}
              />
            </div>
            <div>
              <Label>{t("auto.kontaktperson_2")}</Label>
              <Input
                value={formData.client_contact_person}
                onChange={(e) => handleChange("client_contact_person", e.target.value)}
              />
            </div>
            <div>
              <Label>{t("auto.telefon")}</Label>
              <Input
                value={formData.client_phone}
                onChange={(e) => handleChange("client_phone", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{t("auto.e_post_2")}</Label>
              <Input
                type="email"
                value={formData.client_email}
                onChange={(e) => handleChange("client_email", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("auto.organisasjon")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("auto.prosjektleder")}</Label>
              <Select value={formData.project_leader_id} onValueChange={handleSelectLeader}>
                <SelectTrigger>
                  <SelectValue placeholder={t("auto.velg")} />
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
            <div>
              <Label>{t("auto.sha_koordinator_kp")}</Label>
              <Input
                value={formData.sha_coordinator_kp}
                onChange={(e) => handleChange("sha_coordinator_kp", e.target.value)}
              />
            </div>
            <div>
              <Label>{t("auto.sha_koordinator_ku")}</Label>
              <Input
                value={formData.sha_coordinator_ku}
                onChange={(e) => handleChange("sha_coordinator_ku", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Samarbeidspartner / Partner logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("auto.samarbeidspartner_vises_paa_dagsrapport")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("auto.navn_paa_samarbeidspartner")}</Label>
              <Input
                value={formData.partner_name}
                onChange={(e) => handleChange("partner_name", e.target.value)}
                placeholder={t("auto.f_eks_byggherre_as")}
              />
            </div>
            <div>
              <Label>{t("auto.org_nr_samarbeidspartner")}</Label>
              <Input
                value={formData.partner_org_number}
                onChange={(e) => handleChange("partner_org_number", e.target.value)}
                placeholder={t("auto.f_eks_999_999_999")}
              />
            </div>
            <div>
              <Label>{t("auto.partner_logo")}</Label>
              <div className="flex items-center gap-3">
                {formData.partner_logo_url && (
                  <img src={formData.partner_logo_url} alt="Partner-logo" className="h-12 w-auto rounded border bg-white object-contain p-1" />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingLogo}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !projectId) return;
                    try {
                      setIsUploadingLogo(true);
                      const ext = file.name.split(".").pop() || "png";
                      const safeName = `partner-${projectId}-${Date.now()}.${ext}`;
                      const { error: upErr } = await supabase.storage
                        .from("company-logos")
                        .upload(safeName, file, { upsert: true });
                      if (upErr) throw upErr;
                      const { data: pub } = supabase.storage.from("company-logos").getPublicUrl(safeName);
                      handleChange("partner_logo_url", pub.publicUrl);
                      toast({ title: t("auto.logo_lastet_opp_husk_aa_lagre_prosjektet") });
                    } catch (err: any) {
                      toast({ title: t("auto.feil"), description: err.message || "Opplasting feilet", variant: "destructive" });
                    } finally {
                      setIsUploadingLogo(false);
                      e.target.value = "";
                    }
                  }}
                />
                {formData.partner_logo_url && (
                  <Button type="button" variant="outline" size="sm" onClick={() => handleChange("partner_logo_url", "")}>
                    {t("auto.fjern")}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("auto.png_eller_jpg_vises_ved_siden_av_bedrift")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dates & Contract */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("auto.tid_og_oekonomi")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("auto.planlagt_oppstart")}</Label>
              <Input
                type="date"
                value={formData.planned_start_date}
                onChange={(e) => handleChange("planned_start_date", e.target.value)}
              />
            </div>
            <div>
              <Label>{t("auto.planlagt_ferdig")}</Label>
              <Input
                type="date"
                value={formData.planned_end_date}
                onChange={(e) => handleChange("planned_end_date", e.target.value)}
              />
            </div>
            <div>
              <Label>Kontraktssum (kr)</Label>
              <Input
                type="number"
                value={formData.contract_sum}
                onChange={(e) => handleChange("contract_sum", e.target.value)}
              />
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
              rows={5}
              placeholder={t("auto.beskriv_prosjektet")}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
