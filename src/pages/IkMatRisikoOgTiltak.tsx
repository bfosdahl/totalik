import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent, IkMatRisk, IkMatHaccp, IkMatActionItem, calculateRiskLevel, getTrafficLight, getTrafficLightLabel, getTrafficLightDescription } from "@/hooks/useIkMatContent";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldAlert, Plus, Trash2, Save, Loader2, AlertTriangle, CirclePlus, Info, ClipboardList, Link2 } from "lucide-react";
import { toast } from "sonner";

// 5x5 Matrix options
const SCALE_OPTIONS = [
  { value: 1, label: '1 - Svært lav' },
  { value: 2, label: '2 - Lav' },
  { value: 3, label: '3 - Middels' },
  { value: 4, label: '4 - Høy' },
  { value: 5, label: '5 - Svært høy' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Ikke startet', variant: 'secondary' as const },
  { value: 'in_progress', label: 'Pågår', variant: 'default' as const },
  { value: 'completed', label: 'Fullført', variant: 'outline' as const },
];

const IkMatRisikoOgTiltak = () => {
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { content, isLoading, isSaving, saveContent, addActionForRisk } = useIkMatContent();
  
  // Risk state
  const [risks, setRisks] = useState<IkMatRisk[]>([]);
  const [haccp, setHaccp] = useState<IkMatHaccp[]>([]);
  
  // Action plan state
  const [actionPlan, setActionPlan] = useState<IkMatActionItem[]>([]);
  
  const [hasChanges, setHasChanges] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('risikovurdering');
  const [activeRiskSubTab, setActiveRiskSubTab] = useState('risks');

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, modulesLoading, navigate]);

  useEffect(() => {
    if (!isLoading) {
      setRisks(content.risks || []);
      setHaccp(content.haccp || []);
      setActionPlan(content.actionPlan || []);
    }
  }, [isLoading, content.risks, content.haccp, content.actionPlan]);

  // Risk handlers
  const handleAddRisk = () => {
    const newRisk: IkMatRisk = {
      id: `risk-${Date.now()}`,
      hazard: '',
      consequence: 3,
      probability: 3,
      riskLevel: 9,
      measures: '',
      isHaccp: false,
    };
    setRisks([...risks, newRisk]);
    setHasChanges(true);
  };

  const handleUpdateRisk = (id: string, field: keyof IkMatRisk, value: any) => {
    setRisks(risks.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'probability' || field === 'consequence') {
        updated.riskLevel = calculateRiskLevel(
          field === 'probability' ? value : r.probability,
          field === 'consequence' ? value : r.consequence
        );
      }
      return updated;
    }));
    setHasChanges(true);
  };

  const handleDeleteRisk = (id: string) => {
    setRisks(risks.filter(r => r.id !== id));
    setHasChanges(true);
  };

  const handleCreateActionForRisk = async (risk: IkMatRisk) => {
    const newAction: IkMatActionItem = {
      id: `action-${Date.now()}`,
      action: `Tiltak for: ${risk.hazard}`,
      responsible: '',
      deadline: '',
      status: 'pending',
      riskId: risk.id,
    };
    const updatedActionPlan = [...actionPlan, newAction];
    setActionPlan(updatedActionPlan);
    setHasChanges(true);
    setActiveMainTab('handlingsplan');
    toast.success('Tiltak opprettet - fyll ut detaljene i handlingsplanen');
  };

  // HACCP handlers
  const handleAddHaccp = () => {
    const newHaccp: IkMatHaccp = {
      id: `haccp-${Date.now()}`,
      step: '',
      hazard: '',
      criticalLimit: '',
      monitoring: '',
      correctiveAction: '',
      verification: '',
    };
    setHaccp([...haccp, newHaccp]);
    setHasChanges(true);
  };

  const handleUpdateHaccp = (id: string, field: keyof IkMatHaccp, value: string) => {
    setHaccp(haccp.map(h => h.id === id ? { ...h, [field]: value } : h));
    setHasChanges(true);
  };

  const handleDeleteHaccp = (id: string) => {
    setHaccp(haccp.filter(h => h.id !== id));
    setHasChanges(true);
  };

  // Action handlers
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
    await saveContent('risks', risks);
    await saveContent('haccp', haccp);
    await saveContent('actionPlan', actionPlan);
    setHasChanges(false);
  };

  const getTrafficLightStyles = (level: number) => {
    const light = getTrafficLight(level);
    switch (light) {
      case 'green':
        return 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400';
      case 'yellow':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400';
      case 'red':
        return 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400';
    }
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

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption ? (
      <Badge variant={statusOption.variant}>{statusOption.label}</Badge>
    ) : null;
  };

  const getLinkedRisk = (riskId?: string) => {
    if (!riskId) return null;
    return risks.find(r => r.id === riskId);
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

  // Counts
  const greenCount = risks.filter(r => getTrafficLight(r.riskLevel) === 'green').length;
  const yellowCount = risks.filter(r => getTrafficLight(r.riskLevel) === 'yellow').length;
  const redCount = risks.filter(r => getTrafficLight(r.riskLevel) === 'red').length;
  const haccpCount = risks.filter(r => r.isHaccp).length;
  
  const pendingCount = actionPlan.filter(a => a.status === 'pending').length;
  const inProgressCount = actionPlan.filter(a => a.status === 'in_progress').length;
  const completedCount = actionPlan.filter(a => a.status === 'completed').length;
  const linkedCount = actionPlan.filter(a => a.riskId).length;

  const risksNeedingAction = risks.filter(r => {
    const light = getTrafficLight(r.riskLevel);
    const hasAction = actionPlan.some(a => a.riskId === r.id);
    return (light === 'yellow' || light === 'red') && !hasAction;
  });

  return (
    <AppLayout>
      <div className="container max-w-5xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-primary" />
              Risiko & Tiltak
            </h1>
            <p className="text-muted-foreground mt-1">
              Risikovurdering, HACCP og handlingsplan for matsikkerhet
            </p>
          </div>
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

        {/* Main Tabs */}
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="risikovurdering" className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Risikovurdering & HACCP
            </TabsTrigger>
            <TabsTrigger value="handlingsplan" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Handlingsplan ({actionPlan.length})
            </TabsTrigger>
          </TabsList>

          {/* Risikovurdering Tab */}
          <TabsContent value="risikovurdering" className="space-y-6 mt-6">
            {/* Traffic Light Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-green-500" />
                    <div>
                      <div className="text-2xl font-bold">{greenCount}</div>
                      <p className="text-xs text-muted-foreground">Akseptabel (1-4)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-yellow-500" />
                    <div>
                      <div className="text-2xl font-bold">{yellowCount}</div>
                      <p className="text-xs text-muted-foreground">Tiltak nødvendig (5-9)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-red-500" />
                    <div>
                      <div className="text-2xl font-bold">{redCount}</div>
                      <p className="text-xs text-muted-foreground">Umiddelbar handling (10-25)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-destructive">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    <div>
                      <div className="text-2xl font-bold">{haccpCount}</div>
                      <p className="text-xs text-muted-foreground">HACCP/KKP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Sub-tabs */}
            <Tabs value={activeRiskSubTab} onValueChange={setActiveRiskSubTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="risks">
                  Risikovurdering ({risks.length})
                </TabsTrigger>
                <TabsTrigger value="haccp">
                  HACCP / KKP ({haccp.length})
                </TabsTrigger>
              </TabsList>

              {/* Risks Sub-Tab */}
              <TabsContent value="risks" className="space-y-4">
                <div className="flex justify-between items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <Info className="h-4 w-4 mr-1" />
                          Om trafikklys
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2 text-sm">
                          <p><span className="font-semibold text-green-600">Grønn (1-4):</span> Akseptabel risiko</p>
                          <p><span className="font-semibold text-yellow-600">Gul (5-9):</span> Tiltak må iverksettes</p>
                          <p><span className="font-semibold text-red-600">Rød (10-25):</span> Umiddelbar handling kreves</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button variant="outline" onClick={handleAddRisk}>
                    <Plus className="h-4 w-4 mr-2" />
                    Legg til risiko
                  </Button>
                </div>

                {risks.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Ingen risikoer er definert ennå. Klikk "Legg til risiko" for å komme i gang.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {risks.map((risk) => {
                      const trafficLight = getTrafficLight(risk.riskLevel);
                      return (
                        <Card key={risk.id} className={`border-l-4 ${
                          risk.isHaccp ? 'border-l-destructive' : 
                          trafficLight === 'green' ? 'border-l-green-500' :
                          trafficLight === 'yellow' ? 'border-l-yellow-500' : 'border-l-red-500'
                        }`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <div className={`h-4 w-4 rounded-full ${getTrafficLightCircle(risk.riskLevel)}`} />
                                  <Badge className={getTrafficLightStyles(risk.riskLevel)}>
                                    {risk.riskLevel} - {getTrafficLightLabel(trafficLight)}
                                  </Badge>
                                </div>
                                {risk.isHaccp && (
                                  <Badge variant="destructive">HACCP/KKP</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {(trafficLight === 'yellow' || trafficLight === 'red') && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleCreateActionForRisk(risk)}
                                          className="text-primary"
                                        >
                                          <CirclePlus className="h-4 w-4 mr-1" />
                                          Opprett tiltak
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Opprett tiltak i handlingsplanen
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteRisk(risk.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getTrafficLightDescription(trafficLight)}
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label>Fare/Risiko</Label>
                              <Input
                                value={risk.hazard}
                                onChange={(e) => handleUpdateRisk(risk.id, 'hazard', e.target.value)}
                                placeholder="Beskriv faren eller risikoen..."
                                className="mt-1"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <Label>Sannsynlighet (S)</Label>
                                <Select
                                  value={String(risk.probability)}
                                  onValueChange={(value) => handleUpdateRisk(risk.id, 'probability', Number(value))}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SCALE_OPTIONS.map(opt => (
                                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Konsekvens (K)</Label>
                                <Select
                                  value={String(risk.consequence)}
                                  onValueChange={(value) => handleUpdateRisk(risk.id, 'consequence', Number(value))}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SCALE_OPTIONS.map(opt => (
                                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Risikonivå (S × K)</Label>
                                <div className={`mt-1 h-10 px-3 flex items-center gap-2 rounded-md border text-sm font-medium ${getTrafficLightStyles(risk.riskLevel)}`}>
                                  <div className={`h-3 w-3 rounded-full ${getTrafficLightCircle(risk.riskLevel)}`} />
                                  {risk.probability} × {risk.consequence} = {risk.riskLevel}
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label>Tiltak / Forebyggende handling</Label>
                              <Textarea
                                value={risk.measures}
                                onChange={(e) => handleUpdateRisk(risk.id, 'measures', e.target.value)}
                                placeholder="Beskriv forebyggende tiltak og hvordan risikoen skal håndteres..."
                                rows={3}
                                className="mt-1 resize-none"
                              />
                            </div>
                            <div className="flex items-center space-x-2 pt-2 border-t">
                              <Switch
                                id={`haccp-${risk.id}`}
                                checked={risk.isHaccp}
                                onCheckedChange={(checked) => handleUpdateRisk(risk.id, 'isHaccp', checked)}
                              />
                              <Label htmlFor={`haccp-${risk.id}`} className="text-sm">
                                Marker som HACCP kritisk kontrollpunkt (KKP)
                              </Label>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* HACCP Sub-Tab */}
              <TabsContent value="haccp" className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleAddHaccp}>
                    <Plus className="h-4 w-4 mr-2" />
                    Legg til KKP
                  </Button>
                </div>

                <Alert className="bg-destructive/10 border-destructive/20">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-sm">
                    HACCP (Hazard Analysis Critical Control Points) er kritiske kontrollpunkter 
                    som må overvåkes for å sikre matsikkerheten. Risikoer markert som HACCP/KKP 
                    i risikovurderingen vises også her.
                  </AlertDescription>
                </Alert>

                {risks.filter(r => r.isHaccp).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Fra risikovurdering:</h3>
                    <div className="grid gap-2">
                      {risks.filter(r => r.isHaccp).map(risk => (
                        <Card key={risk.id} className="border-l-4 border-l-destructive bg-destructive/5">
                          <CardContent className="py-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{risk.hazard || 'Ikke navngitt'}</p>
                                <p className="text-sm text-muted-foreground">Risiko: {risk.riskLevel} ({getTrafficLightLabel(getTrafficLight(risk.riskLevel))})</p>
                              </div>
                              <Badge variant="destructive">HACCP</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {haccp.length === 0 && risks.filter(r => r.isHaccp).length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Ingen kritiske kontrollpunkter er definert ennå. Marker risikoer som HACCP/KKP 
                      i risikovurderingen, eller klikk "Legg til KKP" for å definere manuelle kontrollpunkter.
                    </AlertDescription>
                  </Alert>
                ) : haccp.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Manuelle KKP:</h3>
                    {haccp.map((item, index) => (
                      <Card key={item.id} className="border-l-4 border-l-destructive">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="destructive">KKP {index + 1}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteHaccp(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Prosesstrinn</Label>
                            <Input
                              value={item.step}
                              onChange={(e) => handleUpdateHaccp(item.id, 'step', e.target.value)}
                              placeholder="F.eks. Mottak av varer, Nedkjøling..."
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Fare</Label>
                            <Input
                              value={item.hazard}
                              onChange={(e) => handleUpdateHaccp(item.id, 'hazard', e.target.value)}
                              placeholder="Hvilken fare skal kontrolleres?"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Kritisk grense</Label>
                            <Input
                              value={item.criticalLimit}
                              onChange={(e) => handleUpdateHaccp(item.id, 'criticalLimit', e.target.value)}
                              placeholder="F.eks. Kjernetemperatur min 75°C"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Overvåking</Label>
                            <Textarea
                              value={item.monitoring}
                              onChange={(e) => handleUpdateHaccp(item.id, 'monitoring', e.target.value)}
                              placeholder="Hvordan overvåkes dette kontrollpunktet?"
                              rows={2}
                              className="mt-1 resize-none"
                            />
                          </div>
                          <div>
                            <Label>Korrigerende tiltak</Label>
                            <Textarea
                              value={item.correctiveAction}
                              onChange={(e) => handleUpdateHaccp(item.id, 'correctiveAction', e.target.value)}
                              placeholder="Hva gjøres ved avvik?"
                              rows={2}
                              className="mt-1 resize-none"
                            />
                          </div>
                          <div>
                            <Label>Verifisering</Label>
                            <Input
                              value={item.verification}
                              onChange={(e) => handleUpdateHaccp(item.id, 'verification', e.target.value)}
                              placeholder="Hvordan verifiseres kontrollen?"
                              className="mt-1"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Handlingsplan Tab */}
          <TabsContent value="handlingsplan" className="space-y-6 mt-6">
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

            {risksNeedingAction.length > 0 && (
              <Alert className="bg-yellow-500/10 border-yellow-500/30">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm">
                  <strong>{risksNeedingAction.length} risiko(er)</strong> i risikovurderingen krever tiltak men har ingen oppført i handlingsplanen.{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-yellow-700 underline"
                    onClick={() => setActiveMainTab('risikovurdering')}
                  >
                    Gå til risikovurdering for å opprette tiltak
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleAddAction}>
                <Plus className="h-4 w-4 mr-2" />
                Legg til tiltak
              </Button>
            </div>

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
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default IkMatRisikoOgTiltak;
