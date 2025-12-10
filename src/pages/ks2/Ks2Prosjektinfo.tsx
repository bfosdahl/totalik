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
  });

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
        })
        .eq("id", projectId);

      if (error) throw error;
      toast({ title: "Prosjekt oppdatert" });
    } catch (error) {
      console.error("Error saving:", error);
      toast({ title: "Feil", description: "Kunne ikke lagre", variant: "destructive" });
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
      toast({ title: "Prosjekt slettet" });
      navigate("/ks");
    } catch (error) {
      console.error("Error deleting:", error);
      toast({ title: "Feil", description: "Kunne ikke slette", variant: "destructive" });
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
          <h1 className="text-2xl font-bold">Prosjektinfo</h1>
          <p className="text-muted-foreground">Rediger prosjektdetaljer</p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Slett
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Slett prosjekt?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dette vil permanent slette prosjektet og all tilhørende data.
                  Denne handlingen kan ikke angres.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                  Slett prosjekt
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
            <CardTitle className="text-lg">Grunnleggende info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Prosjektnavn *</Label>
              <Input
                value={formData.project_name}
                onChange={(e) => handleChange("project_name", e.target.value)}
              />
            </div>
            <div>
              <Label>Prosjektnummer</Label>
              <Input value={formData.project_number} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
            <div>
              <Label>Gnr/Bnr</Label>
              <Input
                value={formData.gnr_bnr}
                onChange={(e) => handleChange("gnr_bnr", e.target.value)}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planlagt</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="handover">Overtakelse</SelectItem>
                  <SelectItem value="warranty">Garanti</SelectItem>
                  <SelectItem value="completed">Avsluttet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Entreprenørform</Label>
              <Select
                value={formData.contractor_type}
                onValueChange={(v) => handleChange("contractor_type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Totalentreprenør</SelectItem>
                  <SelectItem value="hoved">Hovedentreprenør</SelectItem>
                  <SelectItem value="under">Underentreprenør</SelectItem>
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
            <CardTitle className="text-lg">Byggherre</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Navn</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => handleChange("client_name", e.target.value)}
              />
            </div>
            <div>
              <Label>Org.nr</Label>
              <Input
                value={formData.client_org_number}
                onChange={(e) => handleChange("client_org_number", e.target.value)}
              />
            </div>
            <div>
              <Label>Kontaktperson</Label>
              <Input
                value={formData.client_contact_person}
                onChange={(e) => handleChange("client_contact_person", e.target.value)}
              />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input
                value={formData.client_phone}
                onChange={(e) => handleChange("client_phone", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>E-post</Label>
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
            <CardTitle className="text-lg">Organisasjon</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Prosjektleder</Label>
              <Select value={formData.project_leader_id} onValueChange={handleSelectLeader}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg..." />
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
              <Label>SHA-koordinator KP</Label>
              <Input
                value={formData.sha_coordinator_kp}
                onChange={(e) => handleChange("sha_coordinator_kp", e.target.value)}
              />
            </div>
            <div>
              <Label>SHA-koordinator KU</Label>
              <Input
                value={formData.sha_coordinator_ku}
                onChange={(e) => handleChange("sha_coordinator_ku", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates & Contract */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tid og økonomi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Planlagt oppstart</Label>
              <Input
                type="date"
                value={formData.planned_start_date}
                onChange={(e) => handleChange("planned_start_date", e.target.value)}
              />
            </div>
            <div>
              <Label>Planlagt ferdig</Label>
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
            <CardTitle className="text-lg">Beskrivelse</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={5}
              placeholder="Beskriv prosjektet..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
