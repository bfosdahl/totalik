import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { Plus, Trash2, User, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KsHmsOrganizationStepProps {
  organization: any;
  onSave: (content: any) => Promise<void>;
}

interface RoleAssignment {
  id: string;
  role: string;
  subRole?: string;
  name: string;
  isEmployee: boolean;
}

const roleDefinitions = [
  {
    role: "Prosjektleder",
    description: "Overordnet ansvar for prosjektet, HMS-koordinering, økonomistyring",
    allowMultiple: false
  },
  {
    role: "Byggeleder",
    description: "Daglig drift på byggeplass, kvalitetssikring, fremdriftsoppfølging",
    allowMultiple: false
  },
  {
    role: "HMS-ansvarlig",
    description: "HMS-oppfølging, risikovurderinger, SJA, rapportering av avvik",
    allowMultiple: false
  },
  {
    role: "Verneombud",
    description: "Ivareta arbeidstakernes interesser i HMS-spørsmål",
    allowMultiple: false
  },
  {
    role: "Formenn/Lagledere",
    description: "Ansvar for daglig ledelse av arbeidsgrupper på byggeplass",
    allowMultiple: true,
    subRoles: ["Tømrerleder", "Betongarbeider", "Grunnarbeider", "Takarbeider", "Annet"]
  },
  {
    role: "Underleverandører",
    description: "Eksterne firma med ansvar for spesialiserte arbeidsoppgaver",
    allowMultiple: true,
    subRoles: ["Elektro", "VVS", "Malermester", "Rørlegger", "Ventilasjon", "Annet"]
  }
];

export function KsHmsOrganizationStep({ organization, onSave }: KsHmsOrganizationStepProps) {
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedSubRole, setSelectedSubRole] = useState<string>("");
  const [customSubRole, setCustomSubRole] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [useCustomName, setUseCustomName] = useState(false);
  
  const { employees } = useEmployees();

  useEffect(() => {
    if (organization?.assignments) {
      setAssignments(organization.assignments);
    }
  }, [organization]);

  const currentRoleDef = roleDefinitions.find(r => r.role === selectedRole);

  const handleAddAssignment = () => {
    if (!selectedRole) return;
    
    const name = useCustomName ? customName : selectedEmployee;
    if (!name) return;

    const subRole = selectedSubRole === "Annet" ? customSubRole : selectedSubRole;

    const newAssignment: RoleAssignment = {
      id: crypto.randomUUID(),
      role: selectedRole,
      subRole: subRole || undefined,
      name,
      isEmployee: !useCustomName
    };

    setAssignments(prev => [...prev, newAssignment]);
    
    // Reset form
    setSelectedEmployee("");
    setCustomName("");
    setSelectedSubRole("");
    setCustomSubRole("");
    if (!currentRoleDef?.allowMultiple) {
      setSelectedRole("");
    }
  };

  const handleRemoveAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = async () => {
    await onSave({ assignments });
  };

  const getAssignmentsForRole = (role: string) => {
    return assignments.filter(a => a.role === role);
  };

  const isRoleAssigned = (role: string) => {
    const def = roleDefinitions.find(r => r.role === role);
    if (def?.allowMultiple) return false;
    return assignments.some(a => a.role === role);
  };

  return (
    <div className="space-y-6">
      {/* Role Definitions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prosjektorganisering og roller</CardTitle>
          <CardDescription>
            Oversikt over roller og ansvarsområder i prosjektet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {roleDefinitions.map((roleDef) => (
            <div key={roleDef.role} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    {roleDef.role === "Underleverandører" ? (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    {roleDef.role}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ansvar: {roleDef.description}
                  </p>
                </div>
              </div>
              
              {/* Assigned people for this role */}
              {getAssignmentsForRole(roleDef.role).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {getAssignmentsForRole(roleDef.role).map((assignment) => (
                    <Badge 
                      key={assignment.id} 
                      variant="secondary"
                      className="flex items-center gap-2 py-1.5 px-3"
                    >
                      {assignment.subRole && (
                        <span className="text-muted-foreground">{assignment.subRole}:</span>
                      )}
                      <span>{assignment.name}</span>
                      {assignment.isEmployee && (
                        <User className="h-3 w-3 text-primary" />
                      )}
                      <button
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legg til ansvarlig</CardTitle>
          <CardDescription>
            Velg en rolle og tildel en ansatt fra systemet eller skriv inn navn manuelt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Velg rolle</Label>
              <Select value={selectedRole} onValueChange={(value) => {
                setSelectedRole(value);
                setSelectedSubRole("");
                setCustomSubRole("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg rolle..." />
                </SelectTrigger>
                <SelectContent>
                  {roleDefinitions.map((roleDef) => (
                    <SelectItem 
                      key={roleDef.role} 
                      value={roleDef.role}
                      disabled={isRoleAssigned(roleDef.role)}
                    >
                      {roleDef.role}
                      {isRoleAssigned(roleDef.role) && " (tildelt)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentRoleDef?.subRoles && (
              <div className="space-y-2">
                <Label>Spesifiser type</Label>
                <Select value={selectedSubRole} onValueChange={setSelectedSubRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {currentRoleDef.subRoles.map((subRole) => (
                      <SelectItem key={subRole} value={subRole}>
                        {subRole}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSubRole === "Annet" && (
                  <Input
                    placeholder="Skriv inn type..."
                    value={customSubRole}
                    onChange={(e) => setCustomSubRole(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex gap-4">
              <Button
                type="button"
                variant={!useCustomName ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCustomName(false)}
              >
                Velg fra ansatte
              </Button>
              <Button
                type="button"
                variant={useCustomName ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCustomName(true)}
              >
                Skriv inn manuelt
              </Button>
            </div>

            {!useCustomName ? (
              <div className="space-y-2">
                <Label>Velg ansatt</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg ansatt..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp) => {
                      const displayName = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.email || "";
                      return (
                        <SelectItem key={emp.id} value={displayName}>
                          {displayName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>
                  {selectedRole === "Underleverandører" ? "Firmanavn" : "Navn"}
                </Label>
                <Input
                  placeholder={selectedRole === "Underleverandører" ? "Skriv inn firmanavn..." : "Skriv inn navn..."}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleAddAssignment}
            disabled={!selectedRole || (!selectedEmployee && !customName) || (currentRoleDef?.subRoles && !selectedSubRole)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Legg til
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        Lagre organisering og gå videre
      </Button>
    </div>
  );
}
