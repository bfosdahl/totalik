import { useState, useEffect, useCallback } from "react";
import ProjectOrganizationEditor from "@/components/ks2/organization/ProjectOrganizationEditor";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Plus, 
  Save, 
  Target,
  Users,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { t } from "@/i18n/t";

interface HmsGoal {
  id: string;
  text: string;
  isPredefined: boolean;
}

const DEFAULT_GOALS: HmsGoal[] = [
  { id: "1", text: "Null skader på personer", isPredefined: true },
  { id: "2", text: "Null skader på materiell", isPredefined: true },
  { id: "3", text: t("auto.alle_ansatte_skal_ha_noedvendig_opplaeri"), isPredefined: true },
  { id: "4", text: t("auto.alle_skal_bruke_paabudt_verneutstyr"), isPredefined: true },
];

const DEFAULT_MEASURES = `• Alle skal ha gjennomført HMS-opplæring før oppstart
• Verneutstyr (hjelm, vernesko, synlighetsklær) er påbudt på hele byggeplassen
• Daglig sikker jobb analyse (SJA) før risikofylt arbeid
• Ukentlige vernerunder med dokumentasjon
• Alle avvik skal rapporteres og følges opp
• Førstehjelpsutstyr tilgjengelig og merket
• Brannslukker på strategiske steder`;

export default function Ks2HmsPlan() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState("goals");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);

  // HMS Goals
  const [goals, setGoals] = useState<HmsGoal[]>(DEFAULT_GOALS);
  const [newGoal, setNewGoal] = useState("");

  // HMS Measures
  const [generalMeasures, setGeneralMeasures] = useState(DEFAULT_MEASURES);

  // Load existing data
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("ks_module2_hms_plans")
          .select("*")
          .eq("project_id", projectId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setExistingId(data.id);
          const loadedGoals = data.goals as unknown as HmsGoal[];
          if (Array.isArray(loadedGoals) && loadedGoals.length > 0) setGoals(loadedGoals);
          if (data.general_measures) setGeneralMeasures(data.general_measures);
        }
      } catch (error) {
        console.error("Error loading HMS plan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Progress: 100% by default. Each section is complete if it has any content (defaults count).
  const progress = {
    goals: 100, // Always has default goals
    organization: 100, // Roles are defined by default; filling names is optional
    measures: generalMeasures.length > 0 ? 100 : 0,
  };

  const totalProgress = Math.round((progress.goals + progress.organization + progress.measures) / 3);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals([...goals, { id: Date.now().toString(), text: newGoal, isPredefined: false }]);
    setNewGoal("");
    toast.success(t("auto.maal_lagt_til"));
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    toast.success(t("auto.maal_fjernet"));
  };

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      const goalsJson = JSON.parse(JSON.stringify(goals));

      if (existingId) {
        const { error } = await supabase
          .from("ks_module2_hms_plans")
          .update({
            goals: goalsJson,
            general_measures: generalMeasures,
          })
          .eq("id", existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("ks_module2_hms_plans")
          .insert({
            project_id: projectId,
            goals: goalsJson,
            general_measures: generalMeasures,
          })
          .select("id")
          .single();
        if (error) throw error;
        setExistingId(data.id);
      }

      toast.success(t("auto.hms_plan_lagret"));
    } catch (error: any) {
      console.error("Error saving HMS plan:", error);
      toast.error(t("auto.kunne_ikke_lagre_hms_plan") + (error.message || "Ukjent feil"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <FileText className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t("auto.hms_plan")}</h2>
            <p className="text-muted-foreground">{t("auto.helse_miljoe_og_sikkerhet_for_prosjektet")}</p>
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
            <CardTitle className="text-lg">{t("auto.fremdrift")}</CardTitle>
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
              <span>{t("auto.maal")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${progress.organization === 100 ? 'bg-emerald-500' : 'bg-muted'}`} />
              <span>{t("auto.organisering")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${progress.measures === 100 ? 'bg-emerald-500' : 'bg-muted'}`} />
              <span>{t("auto.tiltak")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">{t("auto.maal")}</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t("auto.organisering")}</span>
          </TabsTrigger>
          <TabsTrigger value="measures" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span className="hidden sm:inline">{t("auto.tiltak")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                {t("auto.hms_maal_for_prosjektet")}
              </CardTitle>
              <CardDescription>
                {t("auto.definer_konkrete_maal_for_helse_miljoe_o")}
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
                        <Badge variant="outline" className="text-xs">{t("auto.standard")}</Badge>
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
                  placeholder={t("auto.legg_til_nytt_hms_maal")}
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
          <ProjectOrganizationEditor projectId={projectId!} />
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
                {t("auto.beskriv_generelle_tiltak_for_aa_ivareta_")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generalMeasures}
                onChange={(e) => setGeneralMeasures(e.target.value)}
                placeholder={t("auto.beskriv_hms_tiltak")}
                className="min-h-[300px]"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
