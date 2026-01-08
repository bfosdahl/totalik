import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, 
  Save, 
  Loader2, 
  Info, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Users 
} from "lucide-react";
import { toast } from "sonner";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { Department } from "@/hooks/useDepartments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserSelect from "@/components/audits/UserSelect";

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

const PREDEFINED_ROLES = [
  { title: "Avdelingsleder", description: "Avdelingsleder har det overordnede ansvaret for at gjeldende lover, forskrifter og interne retningslinjer etterleves i avdelingen." },
  { title: "HMS-ansvarlig", description: "HMS-ansvarlig koordinerer det daglige HMS-arbeidet i avdelingen." },
  { title: "Arbeidsleder", description: "Arbeidsleder har ansvar for å iverksette og følge opp nødvendige tiltak innen sine ansvarsområder." },
  { title: "Verneombud", description: "Verneombudet fungerer som arbeidstakernes valgte representant i spørsmål knyttet til arbeidsmiljø og sikkerhet." },
  { title: "Øvrige ansatte", description: "Alle ansatte har en plikt til å informere nærmeste leder om forhold som kan påvirke HMS." },
  { title: "Egendefinert rolle", description: "" }
];

const DepartmentOrganization = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { setSelectedDepartment } = useDepartmentContext();
  const [department, setDepartment] = useState<Department | null>(null);
  const [data, setData] = useState<OrganizationData>({ roles: [], description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!departmentId) return;

      try {
        const { data: deptData, error: deptError } = await supabase
          .from("company_departments")
          .select("*")
          .eq("id", departmentId)
          .single();

        if (deptError) throw deptError;
        setDepartment(deptData as Department);
        setSelectedDepartment(deptData as Department);

        const { data: moduleData, error: moduleError } = await supabase
          .from("company_modules")
          .select("settings")
          .eq("company_id", deptData.company_id)
          .eq("module_type", "IK_HMS")
          .single();

        if (moduleError && moduleError.code !== "PGRST116") throw moduleError;

        if (moduleData?.settings) {
          const settings = moduleData.settings as Record<string, any>;
          const deptOrg = settings.departmentData?.[departmentId]?.organization;
          if (deptOrg) {
            setData(deptOrg);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Kunne ikke laste data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [departmentId, setSelectedDepartment]);

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

  const handleUpdateRole = (id: string, field: keyof OrganizationRole, value: string) => {
    setData({
      ...data,
      roles: data.roles.map(r => r.id === id ? { ...r, [field]: value } : r),
    });
    setHasChanges(true);
  };

  const handleDeleteRole = (id: string) => {
    setData({ ...data, roles: data.roles.filter(r => r.id !== id) });
    setHasChanges(true);
  };

  const handleMoveRole = (id: string, direction: "up" | "down") => {
    const index = data.roles.findIndex(r => r.id === id);
    if ((direction === "up" && index === 0) || (direction === "down" && index === data.roles.length - 1)) return;

    const newRoles = [...data.roles];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newRoles[index], newRoles[swapIndex]] = [newRoles[swapIndex], newRoles[index]];
    setData({ ...data, roles: newRoles });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!department) return;
    
    setIsSaving(true);
    try {
      const { data: moduleData, error: fetchError } = await supabase
        .from("company_modules")
        .select("id, settings")
        .eq("company_id", department.company_id)
        .eq("module_type", "IK_HMS")
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = (moduleData?.settings || {}) as Record<string, any>;
      const departmentData = currentSettings.departmentData || {};

      departmentData[departmentId!] = {
        ...(departmentData[departmentId!] || {}),
        organization: data,
        organizationUpdatedAt: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("company_modules")
        .update({
          settings: { ...currentSettings, departmentData },
          updated_at: new Date().toISOString(),
        })
        .eq("id", moduleData.id);

      if (updateError) throw updateError;

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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/avdeling/${departmentId}`)}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til {department?.name}
        </Button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              Organisering
            </h1>
            <p className="text-muted-foreground mt-1">
              HMS-organisasjon for {department?.name}
            </p>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Lagre
          </Button>
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
                Definer rollene i avdelingen med ansvar og kontaktpersoner.
              </AlertDescription>
            </Alert>

            {/* Quick add roles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Legg til rolle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_ROLES.map((role) => (
                    <Button
                      key={role.title}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddRole(role.title)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {role.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {data.roles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen roller er definert ennå.</p>
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
                          {index > 0 && <div className="w-0.5 h-4 bg-border" />}
                          <div className="px-6 py-3 bg-background border rounded-lg shadow-sm text-center min-w-[200px]">
                            <div className="font-semibold text-sm">{role.title || "Uten tittel"}</div>
                            {role.personName && <div className="text-xs text-muted-foreground mt-1">{role.personName}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Role editing */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Rediger roller</h3>
                  {data.roles.map((role, index) => (
                    <Card key={role.id} className="relative">
                      <div className="absolute right-2 top-2 flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleMoveRole(role.id, "up")} disabled={index === 0}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleMoveRole(role.id, "down")} disabled={index === data.roles.length - 1}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role.id)}>
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
                              placeholder="Rolletittel"
                            />
                            <UserSelect
                              value={role.personName}
                              onValueChange={(value) => handleUpdateRole(role.id, "personName", value)}
                              placeholder="Velg ansatt"
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={role.description}
                          onChange={(e) => handleUpdateRole(role.id, "description", e.target.value)}
                          placeholder="Beskriv ansvarsområder..."
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
            <Card>
              <CardHeader>
                <CardTitle>Organisasjonsbeskrivelse</CardTitle>
                <CardDescription>Generell beskrivelse av HMS-organiseringen i avdelingen</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={data.description}
                  onChange={(e) => { setData({ ...data, description: e.target.value }); setHasChanges(true); }}
                  placeholder="Beskriv hvordan HMS-arbeidet er organisert i avdelingen..."
                  rows={10}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default DepartmentOrganization;
