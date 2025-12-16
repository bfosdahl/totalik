import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent, IkMatActionItem } from "@/hooks/useIkMatContent";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, Trash2, Save, Loader2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Ikke startet', variant: 'secondary' as const },
  { value: 'in_progress', label: 'Pågår', variant: 'default' as const },
  { value: 'completed', label: 'Fullført', variant: 'outline' as const },
];

const IkMatHandlingsplan = () => {
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { content, isLoading, isSaving, saveContent } = useIkMatContent();
  const [actionPlan, setActionPlan] = useState<IkMatActionItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, modulesLoading, navigate]);

  useEffect(() => {
    if (!isLoading && content.actionPlan) {
      setActionPlan(content.actionPlan);
    }
  }, [isLoading, content.actionPlan]);

  const handleAddAction = () => {
    const newAction: IkMatActionItem = {
      id: `action-${Date.now()}`,
      action: '',
      responsible: '',
      deadline: '',
      status: 'pending',
    };
    setActionPlan([...actionPlan, newAction]);
    setHasChanges(true);
  };

  const handleUpdateAction = (id: string, field: keyof IkMatActionItem, value: string) => {
    setActionPlan(actionPlan.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
    setHasChanges(true);
  };

  const handleDeleteAction = (id: string) => {
    setActionPlan(actionPlan.filter(a => a.id !== id));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await saveContent('actionPlan', actionPlan);
    setHasChanges(false);
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption ? (
      <Badge variant={statusOption.variant}>{statusOption.label}</Badge>
    ) : null;
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
              <ClipboardList className="h-8 w-8 text-primary" />
              Handlingsplan
            </h1>
            <p className="text-muted-foreground mt-1">
              Tiltak og oppfølging for matsikkerhet
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddAction}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til tiltak
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

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-muted-foreground">
                {actionPlan.filter(a => a.status === 'pending').length}
              </div>
              <p className="text-sm text-muted-foreground">Ikke startet</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {actionPlan.filter(a => a.status === 'in_progress').length}
              </div>
              <p className="text-sm text-muted-foreground">Pågår</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {actionPlan.filter(a => a.status === 'completed').length}
              </div>
              <p className="text-sm text-muted-foreground">Fullført</p>
            </CardContent>
          </Card>
        </div>

        {actionPlan.length === 0 ? (
          <Alert>
            <ClipboardList className="h-4 w-4" />
            <AlertDescription>
              Ingen tiltak er definert ennå. Klikk "Legg til tiltak" for å komme i gang.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {actionPlan.map((action) => (
              <Card key={action.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(action.status)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAction(action.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tiltak</Label>
                    <Input
                      value={action.action}
                      onChange={(e) => handleUpdateAction(action.id, 'action', e.target.value)}
                      placeholder="Beskriv tiltaket..."
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Ansvarlig</Label>
                      <Input
                        value={action.responsible}
                        onChange={(e) => handleUpdateAction(action.id, 'responsible', e.target.value)}
                        placeholder="Hvem er ansvarlig?"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Frist</Label>
                      <Input
                        type="date"
                        value={action.deadline}
                        onChange={(e) => handleUpdateAction(action.id, 'deadline', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={action.status}
                        onValueChange={(value) => handleUpdateAction(action.id, 'status', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default IkMatHandlingsplan;
