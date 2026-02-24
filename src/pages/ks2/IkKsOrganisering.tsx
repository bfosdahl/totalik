import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  ChevronUp, 
  ChevronDown, 
  Building2, 
  Info,
  Network
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserSelect from "@/components/audits/UserSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrganizationRole {
  id: string;
  title: string;
  personName: string;
  description: string;
  sortOrder: number;
  reportsTo?: string; // ID of the role this one reports to
}

interface OrganizationData {
  roles: OrganizationRole[];
  description: string;
}

// Predefined role templates for KS/construction project management
const PREDEFINED_ROLES = [
  {
    title: "Daglig leder",
    description: "Daglig leder har det overordnede ansvaret for at kvalitetsstyringssystemet følges. Godkjenner prosjekter og sikrer at ressurser er tilgjengelig for kvalitetsarbeid."
  },
  {
    title: "Faglig leder",
    description: "Faglig leder har ansvar for at prosjekter gjennomføres i henhold til tekniske krav og standarder. Godkjenner tekniske løsninger og sikrer kompetanse i prosjektene."
  },
  {
    title: "Prosjektleder",
    description: "Prosjektleder har det operative ansvaret for prosjektgjennomføring. Koordinerer ressurser, følger opp fremdrift, kvalitet og HMS på prosjektnivå."
  },
  {
    title: "KS-ansvarlig",
    description: "KS-ansvarlig koordinerer kvalitetssikringsarbeidet og har ansvar for at sjekklister, kontroller og dokumentasjon gjennomføres og arkiveres korrekt."
  },
  {
    title: "HMS-ansvarlig prosjekt",
    description: "HMS-ansvarlig på prosjekt har ansvar for å følge opp SHA-plan, gjennomføre vernerunder og sikre at HMS-tiltak iverksettes."
  },
  {
    title: "Arbeidsleder",
    description: "Arbeidsleder har det daglige ansvaret for arbeidet på byggeplass. Følger opp at arbeid utføres i henhold til tegninger, beskrivelser og HMS-krav."
  },
  {
    title: "Fagarbeider",
    description: "Fagarbeider utfører arbeid i henhold til tegninger og beskrivelser. Melder fra om avvik og deltar i egenkontroll av utført arbeid."
  },
  {
    title: "Egendefinert rolle",
    description: ""
  }
];

export default function IkKsOrganisering() {
  const { profile } = useAuth();
  const [data, setData] = useState<OrganizationData>({ roles: [], description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing organization data
  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.company_id) return;

      try {
        const { data: orgData, error } = await supabase
          .from("company_ks_organization")
          .select("*")
          .eq("company_id", profile.company_id)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        
        if (orgData?.custom_content) {
          try {
            const parsed = JSON.parse(orgData.custom_content);
            setData({
              roles: parsed.roles || [],
              description: parsed.description || "",
            });
          } catch {
            setData({ roles: [], description: orgData.custom_content });
          }
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
        toast.error("Kunne ikke laste organisasjonsdata");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [profile?.company_id]);

  const handleAddRole = (predefinedTitle?: string) => {
    const predefined = predefinedTitle 
      ? PREDEFINED_ROLES.find(r => r.title === predefinedTitle) 
      : null;
    
    const newRole: OrganizationRole = {
      id: `role-${Date.now()}`,
      title: predefined?.title || "",
      personName: "",
      description: predefined?.description || "",
      sortOrder: data.roles.length,
    };
    setData({ ...data, roles: [...data.roles, newRole] });
    setHasChanges(true);
  };

  const handleSelectPredefinedRole = (roleId: string, predefinedTitle: string) => {
    const predefined = PREDEFINED_ROLES.find(r => r.title === predefinedTitle);
    if (predefined) {
      setData({
        ...data,
        roles: data.roles.map(r => 
          r.id === roleId 
            ? { ...r, title: predefined.title, description: predefined.description } 
            : r
        ),
      });
      setHasChanges(true);
    }
  };

  const handleUpdateRole = (id: string, field: keyof OrganizationRole, value: string) => {
    setData({
      ...data,
      roles: data.roles.map(r => r.id === id ? { ...r, [field]: value } : r),
    });
    setHasChanges(true);
  };

  const handleDeleteRole = (id: string) => {
    setData({
      ...data,
      roles: data.roles.filter(r => r.id !== id),
    });
    setHasChanges(true);
  };

  const handleMoveRole = (id: string, direction: "up" | "down") => {
    const index = data.roles.findIndex(r => r.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === data.roles.length - 1)
    ) return;

    const newRoles = [...data.roles];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newRoles[index], newRoles[swapIndex]] = [newRoles[swapIndex], newRoles[index]];
    
    setData({ ...data, roles: newRoles });
    setHasChanges(true);
  };

  const handleDescriptionChange = (value: string) => {
    setData({ ...data, description: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!profile?.company_id) return;
    
    setIsSaving(true);
    try {
      const content = JSON.stringify(data);
      
      // Upsert organization data
      const { error } = await supabase
        .from("company_ks_organization")
        .upsert({
          company_id: profile.company_id,
          custom_content: content,
          is_custom: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "company_id",
        });

      if (error) throw error;

      toast.success("Organisering lagret");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving organization:", error);
      toast.error("Kunne ikke lagre organisering");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate automatic description from roles
  const generateDescriptionFromRoles = () => {
    if (data.roles.length === 0) return;
    
    const roleDescriptions = data.roles
      .filter(r => r.title && r.description)
      .map(r => `**${r.title}${r.personName ? ` (${r.personName})` : ''}:** ${r.description}`)
      .join('\n\n');
    
    setData({ ...data, description: roleDescriptions });
    setHasChanges(true);
    toast.success("Beskrivelse generert fra roller");
  };

  if (isLoading) {
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
      <div className="container max-w-5xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Network className="h-8 w-8 text-primary" />
              Organisasjonsplan
            </h1>
            <p className="text-muted-foreground mt-1">
              Organisering av KS-prosjektstyring med roller og ansvar
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

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Rollene som defineres her blir standard for nye prosjekter. 
            Du kan endre roller på prosjektnivå uten at det påvirker denne malen.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="chart" className="space-y-6">
          <TabsList>
            <TabsTrigger value="chart">Organisasjonskart</TabsTrigger>
            <TabsTrigger value="description">Beskrivelse</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-6">
            {/* Quick add predefined roles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Legg til rolle</CardTitle>
                <CardDescription>Velg en forhåndsdefinert rolle for KS-prosjektstyring</CardDescription>
              </CardHeader>
              <CardContent>
              <div className="flex flex-wrap gap-2">
                  {PREDEFINED_ROLES.map((role) => {
                    const isAlreadyAdded = data.roles.some(r => r.title === role.title);
                    const isSingleOnly = role.title === "Daglig leder";
                    return (
                      <Button
                        key={role.title}
                        variant={isAlreadyAdded && isSingleOnly ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleAddRole(role.title)}
                        disabled={isAlreadyAdded && isSingleOnly}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {role.title}
                        {isAlreadyAdded && isSingleOnly && " ✓"}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {data.roles.length === 0 ? (
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
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Organisasjonskart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center gap-2">
                      {data.roles.map((role, index) => (
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
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Rediger roller</h3>
                  {data.roles.map((role, index) => (
                    <Card key={role.id} className="relative">
                      <div className="absolute right-2 top-2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveRole(role.id, "up")}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveRole(role.id, "down")}
                          disabled={index === data.roles.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
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
                        {/* Custom title input if "Egendefinert rolle" is selected */}
                        {(!PREDEFINED_ROLES.some(p => p.title === role.title) || role.title === "Egendefinert rolle") && (
                          <div className="mt-3 pl-11">
                            <Input
                              value={role.title === "Egendefinert rolle" ? "" : role.title}
                              onChange={(e) => handleUpdateRole(role.id, "title", e.target.value)}
                              placeholder="Skriv inn rolletittel..."
                              className="max-w-sm"
                            />
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="pl-11">
                          <label className="text-sm font-medium text-muted-foreground">Ansvarsbeskrivelse</label>
                          <Textarea
                            value={role.description}
                            onChange={(e) => handleUpdateRole(role.id, "description", e.target.value)}
                            placeholder="Beskriv ansvarsområder og oppgaver..."
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="description" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Beskrivelse av organisering</CardTitle>
                    <CardDescription>
                      Fritekst-beskrivelse av KS-organiseringen for bruk i håndbøker og dokumenter
                    </CardDescription>
                  </div>
                  {data.roles.length > 0 && (
                    <Button variant="outline" size="sm" onClick={generateDescriptionFromRoles}>
                      Generer fra roller
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={data.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Beskriv hvordan bedriften organiserer kvalitetssikringsarbeidet i prosjekter..."
                  rows={12}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Støtter markdown-formattering (**fet**, *kursiv*, lister osv.)
                </p>
              </CardContent>
            </Card>

            {/* Example text */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Eksempel på organisasjonsbeskrivelse</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Daglig leder</strong> har det overordnede ansvaret for kvalitetssystemet og godkjenner 
                  alle prosjekter før oppstart.
                </p>
                <p>
                  <strong>Faglig leder</strong> sikrer at tekniske løsninger er i henhold til gjeldende krav og 
                  har ansvar for faglig veiledning i prosjektene.
                </p>
                <p>
                  <strong>Prosjektleder</strong> har det operative ansvaret for gjennomføring og koordinerer 
                  alle aktiviteter på prosjektnivå.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
