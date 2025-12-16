import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent, IkMatRisk, IkMatHaccp } from "@/hooks/useIkMatContent";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ShieldAlert, Plus, Trash2, Save, Loader2, AlertTriangle } from "lucide-react";

const PROBABILITY_OPTIONS = ['Lav', 'Middels', 'Høy'];
const CONSEQUENCE_OPTIONS = ['Lav', 'Middels', 'Høy', 'Kritisk'];
const RISK_LEVEL_OPTIONS = ['Lav', 'Middels', 'Høy', 'Kritisk'];

const IkMatRisikoOgHaccp = () => {
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { content, isLoading, isSaving, saveContent } = useIkMatContent();
  const [risks, setRisks] = useState<IkMatRisk[]>([]);
  const [haccp, setHaccp] = useState<IkMatHaccp[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('risks');

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, modulesLoading, navigate]);

  useEffect(() => {
    if (!isLoading) {
      setRisks(content.risks || []);
      setHaccp(content.haccp || []);
    }
  }, [isLoading, content.risks, content.haccp]);

  // Risk handlers
  const handleAddRisk = () => {
    const newRisk: IkMatRisk = {
      id: `risk-${Date.now()}`,
      hazard: '',
      consequence: 'Middels',
      probability: 'Middels',
      riskLevel: 'Middels',
      measures: '',
      isHaccp: false,
    };
    setRisks([...risks, newRisk]);
    setHasChanges(true);
  };

  const handleUpdateRisk = (id: string, field: keyof IkMatRisk, value: any) => {
    setRisks(risks.map(r => r.id === id ? { ...r, [field]: value } : r));
    setHasChanges(true);
  };

  const handleDeleteRisk = (id: string) => {
    setRisks(risks.filter(r => r.id !== id));
    setHasChanges(true);
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

  const handleSave = async () => {
    await saveContent('risks', risks);
    await saveContent('haccp', haccp);
    setHasChanges(false);
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'Kritisk': return 'destructive';
      case 'Høy': return 'destructive';
      case 'Middels': return 'default';
      default: return 'secondary';
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

  return (
    <AppLayout>
      <div className="container max-w-5xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-primary" />
              Risikovurdering & HACCP
            </h1>
            <p className="text-muted-foreground mt-1">
              Risikoanalyse og kritiske kontrollpunkter for matsikkerhet
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="risks">
              Risikovurdering ({risks.length})
            </TabsTrigger>
            <TabsTrigger value="haccp">
              HACCP / KKP ({haccp.length})
            </TabsTrigger>
          </TabsList>

          {/* Risks Tab */}
          <TabsContent value="risks" className="space-y-4">
            <div className="flex justify-end">
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
                {risks.map((risk) => (
                  <Card key={risk.id} className={risk.isHaccp ? 'border-l-4 border-l-destructive' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={getRiskBadgeVariant(risk.riskLevel)}>
                            {risk.riskLevel}
                          </Badge>
                          {risk.isHaccp && (
                            <Badge variant="destructive">HACCP/KKP</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRisk(risk.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Sannsynlighet</Label>
                          <Select
                            value={risk.probability}
                            onValueChange={(value) => handleUpdateRisk(risk.id, 'probability', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROBABILITY_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Konsekvens</Label>
                          <Select
                            value={risk.consequence}
                            onValueChange={(value) => handleUpdateRisk(risk.id, 'consequence', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONSEQUENCE_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Risikonivå</Label>
                          <Select
                            value={risk.riskLevel}
                            onValueChange={(value) => handleUpdateRisk(risk.id, 'riskLevel', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RISK_LEVEL_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Tiltak</Label>
                        <Textarea
                          value={risk.measures}
                          onChange={(e) => handleUpdateRisk(risk.id, 'measures', e.target.value)}
                          placeholder="Beskriv forebyggende tiltak..."
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
                ))}
              </div>
            )}
          </TabsContent>

          {/* HACCP Tab */}
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
                som må overvåkes for å sikre matsikkerheten.
              </AlertDescription>
            </Alert>

            {haccp.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ingen kritiske kontrollpunkter er definert ennå. Klikk "Legg til KKP" for å komme i gang.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {haccp.map((item, index) => (
                  <Card key={item.id} className="border-l-4 border-l-destructive">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="destructive">KKP {index + 1}</Badge>
                        </div>
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
      </div>
    </AppLayout>
  );
};

export default IkMatRisikoOgHaccp;
