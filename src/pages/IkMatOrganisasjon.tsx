import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent } from "@/hooks/useIkMatContent";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Trash2, Save, Loader2, ChevronUp, ChevronDown, Info } from "lucide-react";
import UserSelect from "@/components/audits/UserSelect";

// Predefined restaurant/kitchen roles with descriptions
const PREDEFINED_ROLES = [
  {
    title: "Daglig leder",
    description: "Har det overordnede ansvaret for drift, økonomi og personale. Ansvar for HMS, IK-MAT og etterlevelse av regelverk. Kontakt med myndigheter (kommune, Mattilsynet, Arbeidstilsynet). Skal sikre at gjeldende lover og forskrifter etterleves."
  },
  {
    title: "Restaurantsjef",
    description: "Ansvarlig for den daglige driften av restauranten, herunder bemanning, service, rutiner og kundebehandling. Har personalansvar for servering og ansvar for kvalitet på service og kundeopplevelse."
  },
  {
    title: "Kjøkkensjef",
    description: "Har faglig og operativt ansvar for kjøkkenet, inkludert matproduksjon, hygiene, IK-MAT, opplæring og kvalitetssikring. Ansvar for meny, råvarer og internkontroll på kjøkken."
  },
  {
    title: "Kokk",
    description: "Utfører matproduksjon i henhold til gjeldende rutiner for hygiene, kvalitet og matsikkerhet. Ansvar for tilberedning av mat, følge rutiner for hygiene og matsikkerhet, samt renhold av arbeidsstasjon."
  },
  {
    title: "Hjelpekokk / Kjøkkenmedarbeider",
    description: "Bistår kjøkkenet med forberedelser, enklere matlaging og renhold i tråd med interne rutiner. Ansvar for kutting, klargjøring og enklere matproduksjon."
  },
  {
    title: "Oppvasker",
    description: "Ansvarlig for oppvask, renhold og orden i kjøkkenets bakrom. Håndterer avfallshåndtering og holder orden på kjøkken og bakrom."
  },
  {
    title: "Servitør",
    description: "Utfører servering og kundebehandling i tråd med virksomhetens rutiner og servicekrav. Ansvar for servering av mat og drikke, kundebehandling og enkel kassehåndtering."
  },
  {
    title: "Bartender",
    description: "Ansvarlig for servering av alkoholholdig og alkoholfri drikke i henhold til alkoholloven og interne rutiner. Har ansvar for alderskontroll og renhold av bar."
  },
  {
    title: "Runner",
    description: "Bistår serveringspersonalet med levering av mat, rydding og praktiske oppgaver. Leverer mat fra kjøkken til bord."
  },
  {
    title: "Gatekjøkkenmedarbeider",
    description: "Utfører matlaging, kundebehandling og renhold i tråd med rutiner for matsikkerhet og hygiene. Ansvar for enkel matproduksjon, kasse og kundeservice."
  },
  {
    title: "Skiftleder",
    description: "Har ansvar for drift og ansatte på eget skift, og påser at rutiner og krav følges. Ansvar for opplæring av ansatte."
  },
  {
    title: "Renholder",
    description: "Utfører renhold i henhold til fastsatte renholdsplaner og hygienekrav. Ansvar for renhold av kjøkken, toaletter og fellesarealer."
  },
  {
    title: "Lageransvarlig",
    description: "Ansvarlig for varemottak, lagring og kontroll av råvarer i henhold til rutiner for matsikkerhet. Ansvar for lagerkontroll, FIFO og datokontroll."
  }
];

interface OrganizationRole {
  id: string;
  title: string;
  personName: string;
  personId?: string;
  description: string;
  sortOrder: number;
}

interface IkMatOrganization {
  roles: OrganizationRole[];
}

const IkMatOrganisasjon = () => {
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { content, isLoading, isSaving, saveContent } = useIkMatContent();
  const [organization, setOrganization] = useState<IkMatOrganization>({ roles: [] });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, modulesLoading, navigate]);

  useEffect(() => {
    if (!isLoading && content.organization) {
      // Handle legacy format without personName
      const roles = (content.organization.roles || []).map(role => ({
        ...role,
        personName: (role as any).personName || '',
        personId: (role as any).personId || undefined,
      }));
      setOrganization({ roles });
    }
  }, [isLoading, content.organization]);

  const handleAddRole = (predefinedTitle?: string) => {
    const predefined = predefinedTitle
      ? PREDEFINED_ROLES.find(r => r.title === predefinedTitle)
      : null;

    const newRole: OrganizationRole = {
      id: `role-${Date.now()}`,
      title: predefined?.title || '',
      personName: '',
      description: predefined?.description || '',
      sortOrder: organization.roles.length,
    };
    setOrganization({
      ...organization,
      roles: [...organization.roles, newRole],
    });
    setHasChanges(true);
  };

  const handleSelectPredefinedRole = (roleId: string, predefinedTitle: string) => {
    const predefined = PREDEFINED_ROLES.find(r => r.title === predefinedTitle);
    if (predefined) {
      setOrganization({
        ...organization,
        roles: organization.roles.map(r =>
          r.id === roleId
            ? { ...r, title: predefined.title, description: predefined.description }
            : r
        ),
      });
      setHasChanges(true);
    }
  };

  const handleUpdateRole = (id: string, field: keyof OrganizationRole, value: string) => {
    setOrganization({
      ...organization,
      roles: organization.roles.map(r =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    });
    setHasChanges(true);
  };

  const handleDeleteRole = (id: string) => {
    setOrganization({
      ...organization,
      roles: organization.roles.filter(r => r.id !== id),
    });
    setHasChanges(true);
  };

  const handleMoveRole = (id: string, direction: 'up' | 'down') => {
    const index = organization.roles.findIndex(r => r.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === organization.roles.length - 1)
    ) return;

    const newRoles = [...organization.roles];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newRoles[index], newRoles[swapIndex]] = [newRoles[swapIndex], newRoles[index]];

    setOrganization({ ...organization, roles: newRoles });
    setHasChanges(true);
  };

  const handleSave = async () => {
    await saveContent('organization', organization);
    setHasChanges(false);
  };

  if (modulesLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Organisasjonskart
            </h1>
            <p className="text-muted-foreground mt-1">
              IK-MAT organisasjonsstruktur med roller og ansvar
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lagre
            </Button>
          </div>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-info/5 border border-info/20">
          <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-info mb-1">Dokumenter virksomhetens organisering</p>
            <p className="text-muted-foreground">
              Velg forhåndsdefinerte roller med standardbeskrivelser for restaurant og kjøkken,
              eller lag egne. Du kan velge ansatte fra listen eller skrive inn navn manuelt.
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
              {PREDEFINED_ROLES.slice(0, 6).map((role) => {
                const isAlreadyAdded = organization.roles.some(r => r.title === role.title);
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
              <Select
                onValueChange={(val) => {
                  if (val === "custom") {
                    handleAddRole();
                  } else {
                    handleAddRole(val);
                  }
                }}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Flere roller..." />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_ROLES.slice(6).map((role) => {
                    const isAlreadyAdded = organization.roles.some(r => r.title === role.title);
                    return (
                      <SelectItem
                        key={role.title}
                        value={role.title}
                        disabled={isAlreadyAdded}
                      >
                        {role.title} {isAlreadyAdded && "✓"}
                      </SelectItem>
                    );
                  })}
                  <SelectItem value="custom" className="text-primary font-medium">
                    + Egendefinert rolle
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {organization.roles.length === 0 ? (
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
                  {organization.roles.map((role, index) => (
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
              {organization.roles.map((role, index) => (
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
                        onClick={() => handleMoveRole(role.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveRole(role.id, 'down')}
                        disabled={index === organization.roles.length - 1}
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

        {/* Visual hierarchy hint */}
        {organization.roles.length > 1 && (
          <div className="flex justify-center">
            <div className="text-sm text-muted-foreground text-center p-4 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 mx-auto mb-2" />
              Rollene vises i hierarkisk rekkefølge fra øverst til nederst.
              <br />
              Bruk pilene for å endre rekkefølgen.
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default IkMatOrganisasjon;
