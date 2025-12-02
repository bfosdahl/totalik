import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { WizardData } from "../ProjectWizard";
import { KsProjectResponsibility } from "@/hooks/useKsProjects";

interface WizardStepOrganizationProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
}

const sokerFunksjoner = [
  { value: "SØK", label: "SØK – Ansvarlig søker TK1–3" },
];

const projektorendeFunksjoner = [
  { value: "PRO-ARK", label: "a. Arkitektur" },
  { value: "PRO-VEG", label: "b. Veg, utearealer og landskapsutforming" },
  { value: "PRO-BRA", label: "d. Brannkonsept" },
  { value: "PRO-GEO", label: "e. Geoteknikk" },
  { value: "PRO-KON", label: "f. Konstruksjonssikkerhet" },
  { value: "PRO-BYG", label: "g. Bygningsfysikk" },
  { value: "PRO-SAN", label: "h. Sanitærinstallasjoner" },
];

const utforendeFunksjoner = [
  { value: "UTF-TOM", label: "g. Tømrerarbeid og montering av trekonstruksjoner" },
  { value: "UTF-MUR", label: "h. Murarbeid" },
  { value: "UTF-TAK", label: "k. Taktekkingsarbeid" },
  { value: "UTF-SAN", label: "o. Sanitærinstallasjoner" },
  { value: "UTF-VAR", label: "p. Varme- og kuldeinstallasjoner" },
  { value: "UTF-VEN", label: "r. Ventilasjon- og klimainstallasjoner" },
];

const kontrollendeFunksjoner = [
  { value: "KTR-OVE", label: "KTR – Overordnet ansvar for kontroll" },
  { value: "KTR-VAT", label: "KTR – Våtrom" },
  { value: "KTR-LUF", label: "KTR – Lufttetthet" },
  { value: "KTR-BRA", label: "KTR – Brann" },
];

type RoleType = 'SØK' | 'PRO' | 'UTF' | 'KTR';

export function WizardStepOrganization({ data, updateData }: WizardStepOrganizationProps) {
  const [newTeamMember, setNewTeamMember] = useState({ employee_name: "", role: "" });
  const [newResponsibility, setNewResponsibility] = useState({
    role_type: "" as RoleType | "",
    funksjon: "",
    ansvarlig_navn: ""
  });

  const handleAddTeamMember = () => {
    if (!newTeamMember.employee_name || !newTeamMember.role) return;
    
    const updatedMembers = [...(data.team_members || []), newTeamMember];
    updateData({ team_members: updatedMembers });
    setNewTeamMember({ employee_name: "", role: "" });
  };

  const handleRemoveTeamMember = (index: number) => {
    const updatedMembers = data.team_members?.filter((_, i) => i !== index) || [];
    updateData({ team_members: updatedMembers });
  };

  const handleAddResponsibility = () => {
    if (!newResponsibility.role_type || !newResponsibility.funksjon || !newResponsibility.ansvarlig_navn) return;
    
    const updatedResp = [...(data.responsibilities || []), newResponsibility as Omit<KsProjectResponsibility, 'id' | 'project_id' | 'created_at' | 'updated_at'>];
    updateData({ responsibilities: updatedResp });
    setNewResponsibility({ role_type: "", funksjon: "", ansvarlig_navn: "" });
  };

  const handleRemoveResponsibility = (index: number) => {
    const updatedResp = data.responsibilities?.filter((_, i) => i !== index) || [];
    updateData({ responsibilities: updatedResp });
  };

  const getFunksjonerForRole = (roleType: string) => {
    switch (roleType) {
      case "SØK": return sokerFunksjoner;
      case "PRO": return projektorendeFunksjoner;
      case "UTF": return utforendeFunksjoner;
      case "KTR": return kontrollendeFunksjoner;
      default: return [];
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3">Ansvarlige i byggesak</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Legg til ansvarlige personer for ulike funksjoner i prosjektet
        </p>

        {/* Display added responsibilities */}
        {data.responsibilities && data.responsibilities.length > 0 && (
          <div className="space-y-2 mb-4">
            {data.responsibilities.map((resp, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 p-3 border rounded-md bg-muted/30">
                <div className="flex-1">
                  <Badge variant="outline" className="mr-2">{resp.role_type}</Badge>
                  <span className="text-sm">{resp.funksjon}</span>
                  <span className="text-xs text-muted-foreground ml-2">- {resp.ansvarlig_navn}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemoveResponsibility(idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new responsibility */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <div className="space-y-2">
            <Label>Rolle</Label>
            <Select
              value={newResponsibility.role_type}
              onValueChange={(value) => setNewResponsibility(prev => ({
                ...prev,
                role_type: value as RoleType,
                funksjon: ""
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg rolle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SØK">Søker</SelectItem>
                <SelectItem value="PRO">Prosjekterende</SelectItem>
                <SelectItem value="UTF">Utførende</SelectItem>
                <SelectItem value="KTR">Kontrollerende</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Funksjon</Label>
            <Select
              value={newResponsibility.funksjon}
              onValueChange={(value) => setNewResponsibility(prev => ({ ...prev, funksjon: value }))}
              disabled={!newResponsibility.role_type}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg funksjon" />
              </SelectTrigger>
              <SelectContent>
                {getFunksjonerForRole(newResponsibility.role_type).map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ansvarlig navn</Label>
            <Input
              value={newResponsibility.ansvarlig_navn}
              onChange={(e) => setNewResponsibility(prev => ({ ...prev, ansvarlig_navn: e.target.value }))}
              placeholder="Navn"
            />
          </div>

          <Button onClick={handleAddResponsibility} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Legg til
          </Button>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="font-semibold mb-3">Prosjektteam</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Legg til ansatte som skal delta i prosjektet
        </p>

        {/* Display added team members */}
        {data.team_members && data.team_members.length > 0 && (
          <div className="space-y-2 mb-4">
            {data.team_members.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 p-3 border rounded-md bg-muted/30">
                <div className="flex-1">
                  <span className="font-medium">{member.employee_name}</span>
                  <span className="text-sm text-muted-foreground ml-2">- {member.role}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemoveTeamMember(idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new team member */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
          <div className="space-y-2">
            <Label>Navn</Label>
            <Input
              value={newTeamMember.employee_name}
              onChange={(e) => setNewTeamMember(prev => ({ ...prev, employee_name: e.target.value }))}
              placeholder="Navn på ansatt"
            />
          </div>

          <div className="space-y-2">
            <Label>Rolle</Label>
            <Input
              value={newTeamMember.role}
              onChange={(e) => setNewTeamMember(prev => ({ ...prev, role: e.target.value }))}
              placeholder="F.eks. Tømrer, Prosjektleder"
            />
          </div>

          <Button onClick={handleAddTeamMember} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Legg til
          </Button>
        </div>
      </div>
    </div>
  );
}
