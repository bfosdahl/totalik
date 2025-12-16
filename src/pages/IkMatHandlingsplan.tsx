import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent, IkMatActionItem, getTrafficLight, getTrafficLightLabel } from "@/hooks/useIkMatContent";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, Trash2, Save, Loader2, ArrowLeft, Link2, AlertTriangle } from "lucide-react";

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

  // Get linked risk for an action
  const getLinkedRisk = (riskId?: string) => {
    if (!riskId) return null;
    return content.risks.find(r => r.id === riskId);
  };

  const getTrafficLightCircle = (level: number) => {
    const light = getTrafficLight(level);
    switch (light) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
    }
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

  // Count actions linked to risks
  const linkedCount = actionPlan.filter(a => a.riskId).length;
  const pendingCount = actionPlan.filter(a => a.status === 'pending').length;
  const inProgressCount = actionPlan.filter(a => a.status === 'in_progress').length;
  const completedCount = actionPlan.filter(a => a.status === 'completed').length;

  // Get risks that require action (yellow/red) but have no linked action
  const risksNeedingAction = content.risks.filter(r => {
    const light = getTrafficLight(r.riskLevel);
    const hasAction = actionPlan.some(a => a.riskId === r.id);
    return (light === 'yellow' || light === 'red') && !hasAction;
  });

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              Handlingsplan
            </h1>
            <p className="text-muted-foreground mt-1">
              Tiltak og oppfølging basert på risikovurdering
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate('/ik-mat/risikovurdering')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Til risikovurdering
            </Button>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-muted-foreground">
                {pendingCount}
              </div>
              <p className="text-sm text-muted-foreground">Ikke startet</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-primary">
                {inProgressCount}
              </div>
              <p className="text-sm text-muted-foreground">Pågår</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-green-600">
                {completedCount}
              </div>
              <p className="text-sm text-muted-foreground">Fullført</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">{linkedCount}</div>
              </div>
              <p className="text-sm text-muted-foreground">Koblet til risiko</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert for risks needing action */}
        {risksNeedingAction.length > 0 && (
          <Alert className="bg-yellow-500/10 border-yellow-500/30">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm">
              <strong>{risksNeedingAction.length} risiko(er)</strong> i risikovurderingen krever tiltak men har ingen oppført i handlingsplanen.{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto text-yellow-700 underline"
                onClick={() => navigate('/ik-mat/risikovurdering')}
              >
                Gå til risikovurdering for å opprette tiltak
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {actionPlan.length === 0 ? (
          <Alert>
            <ClipboardList className="h-4 w-4" />
            <AlertDescription>
              Ingen tiltak er definert ennå. Tiltak opprettes automatisk fra risikovurderingen 
              når risikoen krever handling (gul/rød), eller du kan legge til manuelt.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {actionPlan.map((action) => {
              const linkedRisk = getLinkedRisk(action.riskId);
              return (
                <Card key={action.id} className={linkedRisk ? 'border-l-4 border-l-primary' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        {getStatusBadge(action.status)}
                        {linkedRisk && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Link2 className="h-3 w-3" />
                            <div className={`h-3 w-3 rounded-full ${getTrafficLightCircle(linkedRisk.riskLevel)}`} />
                            <span>Risiko: {linkedRisk.riskLevel}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAction(action.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    {/* Show linked risk info */}
                    {linkedRisk && (
                      <div className="mt-2 p-2 rounded-md bg-muted/50 text-sm">
                        <span className="font-medium">Knyttet til:</span> {linkedRisk.hazard || 'Ikke navngitt risiko'}
                        <span className="ml-2 text-muted-foreground">
                          ({getTrafficLightLabel(getTrafficLight(linkedRisk.riskLevel))})
                        </span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Tiltak</Label>
                      <Textarea
                        value={action.action}
                        onChange={(e) => handleUpdateAction(action.id, 'action', e.target.value)}
                        placeholder="Beskriv tiltaket som skal gjennomføres..."
                        rows={2}
                        className="mt-1 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    {/* Notes field */}
                    <div>
                      <Label>Notater / Oppfølging</Label>
                      <Textarea
                        value={action.notes || ''}
                        onChange={(e) => handleUpdateAction(action.id, 'notes', e.target.value)}
                        placeholder="Eventuelle notater eller oppfølgingspunkter..."
                        rows={2}
                        className="mt-1 resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default IkMatHandlingsplan;
