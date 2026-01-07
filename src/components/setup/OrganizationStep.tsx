import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { Check, Info, Plus, Building2, ChevronUp, ChevronDown, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserSelect from "@/components/audits/UserSelect";

export interface OrganizationStepRef {
  save: () => Promise<void>;
  hasData: () => boolean;
}

interface OrganizationRole {
  id: string;
  title: string;
  personName: string;
  description: string;
  sortOrder: number;
}

export interface OrganizationData {
  roles: OrganizationRole[];
  description: string;
}

// Legacy interface for backwards compatibility
interface LegacyOrganizationData {
  template_id: string | null;
  custom_content: string;
  is_custom: boolean;
}

// Predefined role templates with standard HMS responsibilities
const PREDEFINED_ROLES = [
  {
    title: "Daglig leder",
    description: "Daglig leder har det overordnede ansvaret for at gjeldende lover, forskrifter og interne retningslinjer etterleves. Daglig leder skal sørge for at HMS-arbeidet er en integrert del av virksomhetens drift."
  },
  {
    title: "HMS-ansvarlig",
    description: "HMS-ansvarlig koordinerer det daglige HMS-arbeidet og har ansvar for å følge opp at rutiner og tiltak gjennomføres i henhold til HMS-systemet."
  },
  {
    title: "Arbeidsleder",
    description: "Arbeidsleder har ansvar for å iverksette og følge opp nødvendige tiltak innen sine ansvarsområder, og rapporterer fortløpende til daglig leder."
  },
  {
    title: "Verneombud",
    description: "Verneombudet fungerer som arbeidstakernes valgte representant i spørsmål knyttet til arbeidsmiljø og sikkerhet. Verneombudet skal påse at arbeidsgiver følger arbeidsmiljølovens bestemmelser."
  },
  {
    title: "Øvrige ansatte",
    description: "Alle ansatte har en plikt til å informere nærmeste leder om forhold som kan påvirke helse, miljø eller sikkerhet, dersom dette ikke kan løses direkte. Ansatte skal følge virksomhetens HMS-rutiner og bidra aktivt til et trygt arbeidsmiljø."
  }
];

interface OrganizationStepProps {
  existingData?: OrganizationData | LegacyOrganizationData;
  onSave: (data: OrganizationData | LegacyOrganizationData) => Promise<void>;
  isSaving: boolean;
}

export const OrganizationStep = forwardRef<OrganizationStepRef, OrganizationStepProps>(
  function OrganizationStep({ existingData, onSave, isSaving }, ref) {
    const [roles, setRoles] = useState<OrganizationRole[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize from existing data
    useEffect(() => {
      if (existingData) {
        // Handle new format with roles array
        if ('roles' in existingData && Array.isArray(existingData.roles)) {
          setRoles(existingData.roles);
        }
        // Handle legacy format - try to parse JSON from custom_content
        else if ('custom_content' in existingData && existingData.custom_content) {
          try {
            const parsed = JSON.parse(existingData.custom_content);
            if (parsed.roles && Array.isArray(parsed.roles)) {
              setRoles(parsed.roles);
            }
          } catch {
            // If not parseable, start fresh
            setRoles([]);
          }
        }
      }
    }, [existingData]);

    const handleAddRole = (predefinedTitle?: string) => {
      const predefined = predefinedTitle 
        ? PREDEFINED_ROLES.find(r => r.title === predefinedTitle) 
        : null;
      
      const newRole: OrganizationRole = {
        id: `role-${Date.now()}`,
        title: predefined?.title || "",
        personName: "",
        description: predefined?.description || "",
        sortOrder: roles.length,
      };
      setRoles([...roles, newRole]);
      setHasChanges(true);
    };

    const handleSelectPredefinedRole = (roleId: string, predefinedTitle: string) => {
      const predefined = PREDEFINED_ROLES.find(r => r.title === predefinedTitle);
      if (predefined) {
        setRoles(roles.map(r => 
          r.id === roleId 
            ? { ...r, title: predefined.title, description: predefined.description } 
            : r
        ));
        setHasChanges(true);
      }
    };

    const handleUpdateRole = (id: string, field: keyof OrganizationRole, value: string) => {
      setRoles(roles.map(r => r.id === id ? { ...r, [field]: value } : r));
      setHasChanges(true);
    };

    const handleDeleteRole = (id: string) => {
      setRoles(roles.filter(r => r.id !== id));
      setHasChanges(true);
    };

    const handleMoveRole = (id: string, direction: "up" | "down") => {
      const index = roles.findIndex(r => r.id === id);
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === roles.length - 1)
      ) return;

      const newRoles = [...roles];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newRoles[index], newRoles[swapIndex]] = [newRoles[swapIndex], newRoles[index]];
      
      setRoles(newRoles);
      setHasChanges(true);
    };

    const handleSave = async () => {
      // Save in new format (same as IkHmsOrganisering)
      const data: OrganizationData = {
        roles: roles,
        description: generateDescriptionFromRoles(),
      };
      await onSave(data);
      setHasChanges(false);
    };

    // Generate automatic description from roles
    const generateDescriptionFromRoles = (): string => {
      if (roles.length === 0) return "";
      
      return roles
        .filter(r => r.title && r.description)
        .map(r => `**${r.title}${r.personName ? ` (${r.personName})` : ''}:** ${r.description}`)
        .join('\n\n');
    };

    const hasSelection = roles.length > 0;

    // Expose save method to parent via ref
    useImperativeHandle(ref, () => ({
      save: handleSave,
      hasData: () => hasSelection,
    }));

    return (
      <div className="space-y-6">
        {/* Info box */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-info/5 border border-info/20">
          <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-info mb-1">Dokumenter virksomhetens organisering</p>
            <p className="text-muted-foreground">
              Velg forhåndsdefinerte roller med standardbeskrivelser, eller lag egne. 
              Rollene vises i hierarkisk rekkefølge fra øverst til nederst.
            </p>
          </div>
        </div>

        {/* Quick add predefined roles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Legg til rolle</CardTitle>
            <CardDescription>Velg en forhåndsdefinert rolle eller lag en egendefinert</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_ROLES.map((role) => {
                const isAlreadyAdded = roles.some(r => r.title === role.title);
                return (
                  <Button
                    key={role.title}
                    variant={isAlreadyAdded ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleAddRole(role.title)}
                    disabled={isAlreadyAdded}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {role.title}
                    {isAlreadyAdded && " ✓"}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddRole()}
              >
                <Plus className="h-3 w-3 mr-1" />
                Egendefinert rolle
              </Button>
            </div>
          </CardContent>
        </Card>

        {roles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Ingen roller er definert ennå</p>
              <p className="text-sm mt-2">
                Velg forhåndsdefinerte roller ovenfor for å bygge organisasjonskartet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Visual org chart */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Organisasjonskart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-2">
                  {roles.map((role, index) => (
                    <div key={role.id} className="flex flex-col items-center">
                      {index > 0 && (
                        <div className="w-0.5 h-4 bg-border" />
                      )}
                      <div className="px-6 py-3 bg-background border rounded-lg shadow-sm text-center min-w-[200px]">
                        <div className="font-semibold text-sm">{role.title || "Uten tittel"}</div>
                        {role.personName && (
                          <div className="text-xs text-muted-foreground mt-1">{role.personName}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Role editing cards */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Rediger roller</h3>
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="relative">
                    <div className="absolute right-2 top-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveRole(role.id, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveRole(role.id, "down")}
                        disabled={index === roles.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3 pr-24">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                          <Select
                            value={PREDEFINED_ROLES.some(p => p.title === role.title) ? role.title : "custom"}
                            onValueChange={(value) => {
                              if (value === "custom") {
                                handleUpdateRole(role.id, "title", "");
                              } else {
                                handleSelectPredefinedRole(role.id, value);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg rolletype" />
                            </SelectTrigger>
                            <SelectContent>
                              {PREDEFINED_ROLES.map((predefined) => (
                                <SelectItem key={predefined.title} value={predefined.title}>
                                  {predefined.title}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">Egendefinert tittel</SelectItem>
                            </SelectContent>
                          </Select>
                          <UserSelect
                            value={role.personName}
                            onValueChange={(value) => handleUpdateRole(role.id, "personName", value)}
                            placeholder="Velg ansatt"
                          />
                        </div>
                      </div>
                      {/* Custom title input if custom is selected */}
                      {!PREDEFINED_ROLES.some(p => p.title === role.title) && (
                        <div className="mt-3 pl-11">
                          <Input
                            value={role.title}
                            onChange={(e) => handleUpdateRole(role.id, "title", e.target.value)}
                            placeholder="Skriv inn egendefinert rolletittel"
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={role.description}
                        onChange={(e) => handleUpdateRole(role.id, "description", e.target.value)}
                        placeholder="Beskriv ansvarsområder og oppgaver for denne rollen..."
                        rows={3}
                        className="resize-none"
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Summary and save */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasSelection ? `${roles.length} rolle(r) definert` : "Velg roller for å bygge organisasjonskartet"}
          </div>
          <Button onClick={handleSave} disabled={isSaving || !hasSelection}>
            {isSaving ? "Lagrer..." : "Lagre organisering"}
          </Button>
        </div>
      </div>
    );
  }
);
