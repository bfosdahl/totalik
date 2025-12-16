import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent, IkMatOrganization } from "@/hooks/useIkMatContent";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Plus, Trash2, Save, Loader2, ChevronUp, ChevronDown } from "lucide-react";

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
      setOrganization(content.organization);
    }
  }, [isLoading, content.organization]);

  const handleAddRole = () => {
    const newRole = {
      id: `role-${Date.now()}`,
      title: '',
      description: '',
      sortOrder: organization.roles.length,
    };
    setOrganization({
      ...organization,
      roles: [...organization.roles, newRole],
    });
    setHasChanges(true);
  };

  const handleUpdateRole = (id: string, field: 'title' | 'description', value: string) => {
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

        {organization.roles.length === 0 ? (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              Ingen roller er definert ennå. Klikk "Legg til rolle" for å bygge organisasjonskartet.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {organization.roles.map((role, index) => (
              <Card key={role.id} className="relative">
                <div className="absolute right-2 top-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveRole(role.id, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveRole(role.id, 'down')}
                    disabled={index === organization.roles.length - 1}
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
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {index + 1}
                    </div>
                    <Input
                      value={role.title}
                      onChange={(e) => handleUpdateRole(role.id, 'title', e.target.value)}
                      placeholder="Rolletittel (f.eks. Daglig leder)"
                      className="font-semibold text-lg border-none px-0 focus-visible:ring-0"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={role.description}
                    onChange={(e) => handleUpdateRole(role.id, 'description', e.target.value)}
                    placeholder="Beskriv ansvarsområder og oppgaver for denne rollen..."
                    rows={4}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            ))}
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
