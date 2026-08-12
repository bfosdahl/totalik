import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { NewSimpleProjectInput } from "@/hooks/useSimpleProjects";
import { t } from "@/i18n/t";

interface NewSimpleProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewSimpleProjectInput) => Promise<void>;
  isSaving: boolean;
}

const getEmptyFormData = (): NewSimpleProjectInput => ({
  project_name: "",
  project_number: "",
  address: "",
  gnr_bnr: "",
  client_name: "",
  client_org_number: "",
  client_contact_person: "",
  client_phone: "",
  client_email: "",
  contractor_type: undefined,
  project_leader_id: "",
  project_leader_name: "",
  planned_start_date: "",
  planned_end_date: "",
  contract_sum: undefined,
  description: "",
});

export function NewSimpleProjectDialog({ open, onOpenChange, onSubmit, isSaving }: NewSimpleProjectDialogProps) {
  const { users } = useCompanyUsers();
  const [formData, setFormData] = useState<NewSimpleProjectInput>(getEmptyFormData());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_name.trim()) return;

    await onSubmit(formData);
    setFormData(getEmptyFormData());
  };

  const handleProjectLeaderChange = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    setFormData((prev) => ({
      ...prev,
      project_leader_id: userId,
      project_leader_name: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "",
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{t("auto.nytt_enkeltprosjekt")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-4 pb-4">
              {/* Project name */}
              <div className="space-y-2">
                <Label htmlFor="project_name">{t("auto.prosjektnavn_2")}</Label>
                <Input
                  id="project_name"
                  value={formData.project_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, project_name: e.target.value }))}
                  placeholder={t("auto.f_eks_oppussing_hos_hansen")}
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">{t("auto.adresse")}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder={t("auto.gateadresse")}
                />
              </div>

              {/* Client name */}
              <div className="space-y-2">
                <Label htmlFor="client_name">{t("auto.kunde_byggherre")}</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
                  placeholder={t("auto.kundens_navn")}
                />
              </div>

              {/* Client contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="client_phone">{t("auto.telefon")}</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_phone: e.target.value }))}
                    placeholder="+47..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">{t("auto.e_post_2")}</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_email: e.target.value }))}
                    placeholder="e-post@eksempel.no"
                  />
                </div>
              </div>

              {/* Project leader */}
              <div className="space-y-2">
                <Label>{t("auto.ansvarlig_2")}</Label>
                <Select
                  value={formData.project_leader_id || ""}
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

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="planned_start_date">{t("auto.oppstart")}</Label>
                  <Input
                    id="planned_start_date"
                    type="date"
                    value={formData.planned_start_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, planned_start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planned_end_date">{t("auto.ferdig")}</Label>
                  <Input
                    id="planned_end_date"
                    type="date"
                    value={formData.planned_end_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, planned_end_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Contract sum */}
              <div className="space-y-2">
                <Label htmlFor="contract_sum">Kontraktssum (kr)</Label>
                <Input
                  id="contract_sum"
                  type="number"
                  value={formData.contract_sum || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contract_sum: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  placeholder="0"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t("auto.beskrivelse")}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t("auto.kort_beskrivelse_av_arbeidet")}
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button type="submit" disabled={isSaving || !formData.project_name.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oppretter...
                </>
              ) : (
                "Opprett prosjekt"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
