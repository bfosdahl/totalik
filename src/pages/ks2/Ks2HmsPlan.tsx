import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Plus, 
  Save, 
  Target,
  Users,
  ShieldAlert,
  CheckCircle2,
  Pencil,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

interface HmsGoal {
  id: string;
  text: string;
  isPredefined: boolean;
}

interface HmsResponsible {
  role: string;
  name: string;
  responsibilities: string;
}

export default function Ks2HmsPlan() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState("goals");
  const [isSaving, setIsSaving] = useState(false);

  // HMS Goals
  const [goals, setGoals] = useState<HmsGoal[]>([
    { id: "1", text: "Null skader på personer", isPredefined: true },
    { id: "2", text: "Null skader på materiell", isPredefined: true },
    { id: "3", text: "Alle ansatte skal ha nødvendig opplæring og sertifisering", isPredefined: true },
    { id: "4", text: "Alle skal bruke påbudt verneutstyr", isPredefined: true },
  ]);
  const [newGoal, setNewGoal] = useState("");

  // HMS Responsibilities
  const [responsibilities, setResponsibilities] = useState<HmsResponsible[]>([
    { 
      role: "Prosjektleder", 
      name: "", 
      responsibilities: "Overordnet ansvar for HMS i prosjektet. Sikrer at HMS-plan følges og at ressurser er tilgjengelige." 
    },
    { 
      role: "HMS-ansvarlig", 
      name: "", 
      responsibilities: "Daglig oppfølging av HMS-arbeidet. Gjennomfører vernerunder og følger opp avvik." 
    },
    { 
      role: "Verneombud", 
      name: "", 
      responsibilities: "Ivaretar arbeidstakernes interesser i HMS-spørsmål. Deltar i vernerunder og HMS-møter." 
    },
    { 
      role: "Byggeleder", 
      name: "", 
      responsibilities: "Koordinerer arbeidet på byggeplass og sikrer at HMS-rutiner følges i det daglige." 
    },
  ]);

  // HMS Measures
  const [generalMeasures, setGeneralMeasures] = useState(`• Alle skal ha gjennomført HMS-opplæring før oppstart
• Verneutstyr (hjelm, vernesko, synlighetsklær) er påbudt på hele byggeplassen
• Daglig sikker jobb analyse (SJA) før risikofylt arbeid
• Ukentlige vernerunder med dokumentasjon
• Alle avvik skal rapporteres og følges opp
• Førstehjelpsutstyr tilgjengelig og merket
• Brannslukker på strategiske steder`);

  const progress = {
    goals: goals.length >= 3 ? 100 : (goals.length / 3) * 100,
    organization: responsibilities.filter(r => r.name).length >= 2 ? 100 : (responsibilities.filter(r => r.name).length / 2) * 100,
    measures: generalMeasures.length > 50 ? 100 : 0,
  };

  const totalProgress = Math.round((progress.goals + progress.organization + progress.measures) / 3);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals([...goals, { id: Date.now().toString(), text: newGoal, isPredefined: false }]);
    setNewGoal("");
    toast.success("Mål lagt til");
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    toast.success("Mål fjernet");
  };

  const updateResponsible = (index: number, name: string) => {
    const updated = [...responsibilities];
    updated[index].name = name;
    setResponsibilities(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save - in real implementation, save to database
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("HMS-plan lagret");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <FileText className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">HMS-plan</h2>
            <p className="text-muted-foreground">Helse, miljø og sikkerhet for prosjektet</p>
          </div>
        </div>
        <Button 
          className="bg-emerald-500 hover:bg-emerald-600"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Lagrer..." : "Lagre HMS-plan"}
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Fremdrift</CardTitle>
            <Badge className={totalProgress === 100 ? "bg-emerald-500" : "bg-amber-500"}>
              {totalProgress}% fullført
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={totalProgress} className="h-3 [&>div]:bg-emerald-500" />
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${progress.goals === 100 ? 'bg-emerald-500' : 'bg-muted'}`} />
              <span>Mål</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${progress.organization === 100 ? 'bg-emerald-500' : 'bg-muted'}`} />
              <span>Organisering</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${progress.measures === 100 ? 'bg-emerald-500' : 'bg-muted'}`} />
              <span>Tiltak</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Mål</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Organisering</span>
          </TabsTrigger>
          <TabsTrigger value="measures" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span className="hidden sm:inline">Tiltak</span>
          </TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                HMS-mål for prosjektet
              </CardTitle>
              <CardDescription>
                Definer konkrete mål for helse, miljø og sikkerhet i prosjektet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Goals */}
              <div className="space-y-2">
                {goals.map((goal) => (
                  <div 
                    key={goal.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span>{goal.text}</span>
                      {goal.isPredefined && (
                        <Badge variant="outline" className="text-xs">Standard</Badge>
                      )}
                    </div>
                    {!goal.isPredefined && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Goal */}
              <div className="flex gap-2">
                <Input
                  placeholder="Legg til nytt HMS-mål..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGoal()}
                />
                <Button onClick={addGoal} className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-500" />
                HMS-organisering
              </CardTitle>
              <CardDescription>
                Definer roller og ansvar for HMS i prosjektet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {responsibilities.map((resp, index) => (
                <div key={resp.role} className="p-4 rounded-lg border bg-card">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <Label className="font-semibold">{resp.role}</Label>
                      <p className="text-sm text-muted-foreground">{resp.responsibilities}</p>
                    </div>
                    <div className="sm:w-64">
                      <Label className="text-sm">Navn</Label>
                      <Input
                        placeholder="Velg person..."
                        value={resp.name}
                        onChange={(e) => updateResponsible(index, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Measures Tab */}
        <TabsContent value="measures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-emerald-500" />
                Generelle HMS-tiltak
              </CardTitle>
              <CardDescription>
                Beskriv generelle tiltak for å ivareta HMS i prosjektet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generalMeasures}
                onChange={(e) => setGeneralMeasures(e.target.value)}
                placeholder="Beskriv HMS-tiltak..."
                className="min-h-[300px]"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
