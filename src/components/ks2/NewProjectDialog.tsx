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
import { NewKsModule2ProjectInput } from "@/hooks/useKsModule2Projects";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewKsModule2ProjectInput) => Promise<void>;
  isSaving: boolean;
}

export function NewProjectDialog({ open, onOpenChange, onSubmit, isSaving }: NewProjectDialogProps) {
  const { users } = useCompanyUsers();
  const [formData, setFormData] = useState<NewKsModule2ProjectInput>({
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
    sha_coordinator_kp: "",
    sha_coordinator_ku: "",
    planned_start_date: "",
    planned_end_date: "",
    contract_sum: undefined,
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_name.trim()) return;

    await onSubmit(formData);
    setFormData({
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
      sha_coordinator_kp: "",
      sha_coordinator_ku: "",
      planned_start_date: "",
      planned_end_date: "",
      contract_sum: undefined,
      description: "",
    });
    onOpenChange(false);
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
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Opprett nytt prosjekt</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Grunnleggende informasjon
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_name">Prosjektnavn *</Label>
                  <Input
                    id="project_name"
                    value={formData.project_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, project_name: e.target.value }))}
                    placeholder="F.eks. Nybygg Majorstuveien 12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_number">Prosjektnummer</Label>
                  <Input
                    id="project_number"
                    value={formData.project_number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, project_number: e.target.value }))}
                    placeholder="Auto-genereres hvis tom"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Gateadresse"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gnr_bnr">Gårds-/bruksnummer</Label>
                  <Input
                    id="gnr_bnr"
                    value={formData.gnr_bnr}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gnr_bnr: e.target.value }))}
                    placeholder="F.eks. 123/45"
                  />
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Byggherre
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Navn</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
                    placeholder="Byggherrens navn"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_org_number">Org.nr</Label>
                  <Input
                    id="client_org_number"
                    value={formData.client_org_number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_org_number: e.target.value }))}
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_contact_person">Kontaktperson</Label>
                  <Input
                    id="client_contact_person"
                    value={formData.client_contact_person}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_contact_person: e.target.value }))}
                    placeholder="Navn"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_phone">Telefon</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_phone: e.target.value }))}
                    placeholder="+47..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">E-post</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, client_email: e.target.value }))}
                    placeholder="e-post@eksempel.no"
                  />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Prosjektdetaljer
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entreprenørform</Label>
                  <Select
                    value={formData.contractor_type || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        contractor_type: value as "total" | "hoved" | "under",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">Totalentreprenør</SelectItem>
                      <SelectItem value="hoved">Hovedentreprenør</SelectItem>
                      <SelectItem value="under">Underentreprenør</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prosjektleder</Label>
                  <Select
                    value={formData.project_leader_id || ""}
                    onValueChange={handleProjectLeaderChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg prosjektleder" />
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sha_coordinator_kp">SHA-koordinator KP</Label>
                  <Input
                    id="sha_coordinator_kp"
                    value={formData.sha_coordinator_kp}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sha_coordinator_kp: e.target.value }))}
                    placeholder="Navn på KP-koordinator"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sha_coordinator_ku">SHA-koordinator KU</Label>
                  <Input
                    id="sha_coordinator_ku"
                    value={formData.sha_coordinator_ku}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sha_coordinator_ku: e.target.value }))}
                    placeholder="Navn på KU-koordinator"
                  />
                </div>
              </div>
            </div>

            {/* Dates and Contract */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Datoer og økonomi
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planned_start_date">Planlagt oppstart</Label>
                  <Input
                    id="planned_start_date"
                    type="date"
                    value={formData.planned_start_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, planned_start_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="planned_end_date">Planlagt ferdig</Label>
                  <Input
                    id="planned_end_date"
                    type="date"
                    value={formData.planned_end_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, planned_end_date: e.target.value }))}
                  />
                </div>

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
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Hva skal gjøres?</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Beskriv oppdraget og hva som skal utføres..."
                rows={4}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
