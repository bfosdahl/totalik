import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Plus, Trash2, Save, Loader2, ChevronUp, ChevronDown, Building2, Info } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrganizationRole {
  id: string;
  title: string;
  personName: string;
  description: string;
  sortOrder: number;
}

interface OrganizationData {
  roles: OrganizationRole[];
  description: string;
}

const IkHmsOrganisering = () => {
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
          .from("company_organization")
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
            // If not JSON, treat as description text
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

  const handleAddRole = () => {
    const newRole: OrganizationRole = {
      id: `role-${Date.now()}`,
      title: "",
      personName: "",
      description: "",
      sortOrder: data.roles.length,
    };
    setData({ ...data, roles: [...data.roles, newRole] });
    setHasChanges(true);
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
        .from("company_organization")
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
              <Building2 className="h-8 w-8 text-primary" />
              Organisering
            </h1>
            <p className="text-muted-foreground mt-1">
              HMS-organisasjon med roller og ansvar
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddRole}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til rolle
            </Button>
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

        <Tabs defaultValue="chart" className="space-y-6">
          <TabsList>
            <TabsTrigger value="chart">Organisasjonskart</TabsTrigger>
            <TabsTrigger value="description">Beskrivelse</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Definer roller i organisasjonen med navn og ansvarsområder. 
                Rollene vises i hierarkisk rekkefølge fra øverst til nederst.
              </AlertDescription>
            </Alert>

            {data.roles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Ingen roller er definert ennå</p>
                  <p className="text-sm mt-2">
                    Klikk "Legg til rolle" for å bygge organisasjonskartet.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={handleAddRole}>
                    <Plus className="h-4 w-4 mr-2" />
                    Legg til første rolle
                  </Button>
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
                            <Input
                              value={role.title}
                              onChange={(e) => handleUpdateRole(role.id, "title", e.target.value)}
                              placeholder="Rolletittel (f.eks. Daglig leder)"
                              className="font-semibold"
                            />
                            <Input
                              value={role.personName}
                              onChange={(e) => handleUpdateRole(role.id, "personName", e.target.value)}
                              placeholder="Navn på person"
                            />
                          </div>
                        </div>
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
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="description" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Her kan du skrive en generell beskrivelse av hvordan HMS-arbeidet er organisert i bedriften.
                Denne teksten vises i HMS-håndboken.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Organisasjonsbeskrivelse</CardTitle>
                <CardDescription>
                  Beskriv bedriftens organisering av HMS-arbeidet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={data.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Beskriv hvordan bedriften er organisert med hensyn til HMS-arbeid. Hvem har ansvar for hva? Hvordan er rapporteringslinjene?"
                  rows={10}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Example text */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Eksempel på organisasjonsbeskrivelse</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Daglig leder</strong> har det overordnede ansvaret for HMS-arbeidet i bedriften, 
                  inkludert å sørge for at lover og forskrifter følges, og at nødvendige ressurser er tilgjengelige.
                </p>
                <p>
                  <strong>HMS-ansvarlig</strong> bistår daglig leder med det praktiske HMS-arbeidet, 
                  inkludert oppdatering av risikovurderinger, gjennomføring av vernerunder og oppfølging av avvik.
                </p>
                <p>
                  <strong>Verneombud</strong> er ansattes representant i HMS-saker og deltar i planlegging 
                  og gjennomføring av HMS-aktiviteter.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default IkHmsOrganisering;
