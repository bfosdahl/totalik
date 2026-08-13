import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Save, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/i18n/t";

interface CompanyGoal {
  id: string;
  goal_text: string;
  is_predefined: boolean;
  sort_order: number;
}

const IkHmsMaal = () => {
  const { profile } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
  const [goals, setGoals] = useState<CompanyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch existing goals
  useEffect(() => {
    const fetchGoals = async () => {
      if (!profile?.company_id) return;

      try {
        let q = supabase
          .from("company_goals")
          .select("*")
          .eq("company_id", profile.company_id);
        q = filterDepartmentId
          ? q.eq("department_id", filterDepartmentId)
          : q.is("department_id", null);
        const { data, error } = await q.order("sort_order", { ascending: true });

        if (error) throw error;
        setGoals(data || []);
      } catch (error) {
        console.error("Error fetching goals:", error);
        toast.error(t("auto.kunne_ikke_laste_maalsettinger"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, [profile?.company_id, filterDepartmentId]);

  const handleUpdateGoal = (id: string, text: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, goal_text: text } : g));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!profile?.company_id) return;
    
    setIsSaving(true);
    try {
      // Update each goal
      for (const goal of goals) {
        const { error } = await supabase
          .from("company_goals")
          .update({ goal_text: goal.goal_text })
          .eq("id", goal.id);

        if (error) throw error;
      }

      toast.success(t("auto.maalsettinger_lagret"));
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving goals:", error);
      toast.error(t("auto.kunne_ikke_lagre_maalsettinger"));
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
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              {t("auto.maalsetting")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("auto.bedriftens_hms_maalsetting")}
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

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t("auto.maalsettingen_beskriver_bedriftens_overo")}
          </AlertDescription>
        </Alert>

        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("auto.ingen_maalsettinger_er_definert_ennaa")}</p>
              <p className="text-sm mt-2">
                {t("auto.gaa_til")} <a href="/setup" className="text-primary hover:underline">{t("auto.oppsett")}</a> {t("auto.for_aa_sette_opp_maalsettinger")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {goals.length > 1 ? `Mål ${index + 1}` : "Bedriftens målsetting"}
                  </CardTitle>
                  <CardDescription>
                    {t("auto.rediger_maalsettingen_under")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={goal.goal_text}
                    onChange={(e) => handleUpdateGoal(goal.id, e.target.value)}
                    placeholder={t("auto.beskriv_bedriftens_hms_maalsetting")}
                    rows={6}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Example text for reference */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("auto.eksempel_paa_hms_maalsetting")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>{t("auto.eksempel_1")}</strong> {t("auto.vaart_maal_er_aa_skape_en_trygg_og_helse")}
            </p>
            <p>
              <strong>{t("auto.eksempel_2")}</strong> Vi skal ha null arbeidsulykker og arbeidsrelatert sykefravær. 
              Alle ansatte skal ha nødvendig opplæring og utstyr for å utføre arbeidet sikkert.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default IkHmsMaal;
