import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Target, 
  Save, 
  Loader2, 
  Info, 
  Plus, 
  Trash2, 
  Edit2, 
  X,
  GripVertical,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompanyKsGoals, CompanyKsGoal } from "@/hooks/useCompanyKsGoals";
import { t } from "@/i18n/t";

interface KsSystemGoal {
  id: string;
  goal_text: string;
  goal_type: string;
  description: string | null;
  sort_order: number;
}

const DEFAULT_KS_GOALS = [
  {
    type: "ks_handbook",
    text: t("auto.sikre_at_alle_prosjekter_gjennomfoeres_i"),
    description: t("auto.ks_haandboken_skal_vaere_et_verktoey_for")
  },
  {
    type: "ks_handbook",
    text: t("auto.etablere_rutiner_for_systematisk_kvalite"),
    description: t("auto.bedriften_skal_ha_dokumenterte_rutiner_s")
  },
  {
    type: "ks_system",
    text: t("auto.kontinuerlig_forbedring_av_kvalitetssyst"),
    description: t("auto.ks_systemet_skal_evalueres_og_forbedres_")
  },
];

const DEFAULT_HMS_PROJECT_GOALS = [
  {
    type: "hms_project",
    text: t("auto.null_skader_paa_personer_og_materiell"),
    description: t("auto.alle_prosjekter_skal_gjennomfoeres_uten_")
  },
  {
    type: "hms_project",
    text: t("auto.sikre_trygge_arbeidsforhold_for_alle_paa"),
    description: t("auto.hms_plan_og_sha_plan_skal_vaere_etablert")
  },
  {
    type: "hms_project",
    text: t("auto.gjennomfoere_systematiske_vernerunder"),
    description: t("auto.vernerunder_skal_gjennomfoeres_regelmess")
  },
];

export default function IkKsMaalsetting() {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<KsSystemGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({ goal_text: "", description: "", goal_type: "ks_handbook" });
  const [activeTab, setActiveTab] = useState("ks_handbook");
  
  // Kvalitetsmål (from company_ks_goals)
  const { 
    goals: kvalitetsGoals, 
    isLoading: isLoadingKvalitet, 
    isSaving: isSavingKvalitet, 
    createGoal: createKvalitetsGoal, 
    updateGoal: updateKvalitetsGoal, 
    deleteGoal: deleteKvalitetsGoal 
  } = useCompanyKsGoals();
  const [showNewKvalitetDialog, setShowNewKvalitetDialog] = useState(false);
  const [editingKvalitetId, setEditingKvalitetId] = useState<string | null>(null);
  const [newKvalitetGoal, setNewKvalitetGoal] = useState({ goal_text: "", description: "" });

  useEffect(() => {
    const fetchGoals = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from("company_ks_system_goals")
          .select("*")
          .eq("company_id", profile.company_id)
          .order("sort_order", { ascending: true });

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
  }, [profile?.company_id]);

  const handleCreate = async () => {
    if (!profile?.company_id || !newGoal.goal_text.trim()) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("company_ks_system_goals")
        .insert({
          company_id: profile.company_id,
          goal_text: newGoal.goal_text,
          goal_type: newGoal.goal_type,
          description: newGoal.description || null,
          sort_order: goals.filter(g => g.goal_type === newGoal.goal_type).length
        })
        .select()
        .single();

      if (error) throw error;
      
      setGoals([...goals, data]);
      setNewGoal({ goal_text: "", description: "", goal_type: "ks_handbook" });
      setShowNewDialog(false);
      toast.success(t("auto.maal_lagt_til"));
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error(t("auto.kunne_ikke_opprette_maal"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDefault = async (defaultGoal: { type: string; text: string; description: string }) => {
    if (!profile?.company_id) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("company_ks_system_goals")
        .insert({
          company_id: profile.company_id,
          goal_text: defaultGoal.text,
          goal_type: defaultGoal.type,
          description: defaultGoal.description,
          sort_order: goals.filter(g => g.goal_type === defaultGoal.type).length
        })
        .select()
        .single();

      if (error) throw error;
      
      setGoals([...goals, data]);
      toast.success(t("auto.maal_lagt_til"));
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error(t("auto.kunne_ikke_opprette_maal"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<KsSystemGoal>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_ks_system_goals")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
      setEditingId(null);
      toast.success(t("auto.maal_oppdatert"));
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error(t("auto.kunne_ikke_oppdatere_maal"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("company_ks_system_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setGoals(goals.filter(g => g.id !== id));
      toast.success(t("auto.maal_slettet"));
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error(t("auto.kunne_ikke_slette_maal"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingKvalitet) {
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              {t("auto.maalsetting_kvalitetsmaal")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("auto.maal_for_ks_haandbok_ks_system_hms_i_pro")}
            </p>
          </div>
          
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t("auto.nytt_maal")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("auto.legg_til_maalsetting")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">{t("auto.type")}</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md bg-background"
                    value={newGoal.goal_type}
                    onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value })}
                  >
                    <option value="ks_handbook">{t("auto.ks_haandbok_maal")}</option>
                    <option value="ks_system">{t("auto.ks_system_maal")}</option>
                    <option value="hms_project">{t("auto.hms_prosjektmaal")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("auto.maal")}</label>
                  <Input
                    value={newGoal.goal_text}
                    onChange={(e) => setNewGoal({ ...newGoal, goal_text: e.target.value })}
                    placeholder={t("auto.beskriv_maalsettingen")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("auto.beskrivelse_valgfritt")}</label>
                  <Textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder={t("auto.utdypende_beskrivelse")}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                    {t("auto.avbryt")}
                  </Button>
                  <Button onClick={handleCreate} disabled={isSaving || !newGoal.goal_text.trim()}>
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Legg til
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t("auto.maalsettinger_for_ks_haandboken_og_ks_sy")}
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ks_handbook">{t("auto.ks_haandbok_2")}</TabsTrigger>
            <TabsTrigger value="ks_system">{t("auto.ks_system")}</TabsTrigger>
            <TabsTrigger value="hms_project">{t("auto.hms_prosjekt")}</TabsTrigger>
            <TabsTrigger value="kvalitetsmal">{t("auto.kvalitetsmaal")}</TabsTrigger>
          </TabsList>

          {/* KS/HMS tabs */}
          {["ks_handbook", "ks_system", "hms_project"].map(tabKey => (
            <TabsContent key={tabKey} value={tabKey} className="space-y-4 mt-6">
              {goals.filter(g => g.goal_type === tabKey).length === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("auto.foreslaatte_maal")}</CardTitle>
                    <CardDescription>{t("auto.klikk_for_aa_legge_til_et_foreslaatt_maa_2")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(tabKey === "hms_project" ? DEFAULT_HMS_PROJECT_GOALS : DEFAULT_KS_GOALS.filter(g => g.type === tabKey)).map((goal, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-3"
                          onClick={() => handleAddDefault(goal)}
                          disabled={isSaving}
                        >
                          <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="line-clamp-2">{goal.text}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {goals.filter(g => g.goal_type === tabKey).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="font-medium text-lg mb-2">{t("auto.ingen_maal_definert_2")}</h3>
                    <p className="text-muted-foreground mb-4">
                      Legg til mål for {tabKey === "ks_handbook" ? "KS-håndboken" : tabKey === "ks_system" ? "KS-systemet" : "HMS i prosjekter"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {goals.filter(g => g.goal_type === tabKey).map((goal, index) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      index={index}
                      isEditing={editingId === goal.id}
                      onEdit={() => setEditingId(goal.id)}
                      onCancelEdit={() => setEditingId(null)}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      isSaving={isSaving}
                    />
                  ))}
                </div>
              )}

              {goals.filter(g => g.goal_type === tabKey).length > 0 && (
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>{goals.filter(g => g.goal_type === tabKey).length} mål definert</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}

          {/* Kvalitetsmål tab */}
          <TabsContent value="kvalitetsmal" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Dialog open={showNewKvalitetDialog} onOpenChange={setShowNewKvalitetDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("auto.nytt_kvalitetsmaal")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("auto.legg_til_kvalitetsmaal")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium">{t("auto.maal")}</label>
                      <Input
                        value={newKvalitetGoal.goal_text}
                        onChange={(e) => setNewKvalitetGoal({ ...newKvalitetGoal, goal_text: e.target.value })}
                        placeholder="Beskriv kvalitetsmålet..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("auto.beskrivelse_valgfritt")}</label>
                      <Textarea
                        value={newKvalitetGoal.description}
                        onChange={(e) => setNewKvalitetGoal({ ...newKvalitetGoal, description: e.target.value })}
                        placeholder={t("auto.utdypende_beskrivelse")}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNewKvalitetDialog(false)}>
                        {t("auto.avbryt")}
                      </Button>
                      <Button 
                        onClick={async () => {
                          if (!newKvalitetGoal.goal_text.trim()) return;
                          await createKvalitetsGoal(newKvalitetGoal.goal_text, newKvalitetGoal.description);
                          setNewKvalitetGoal({ goal_text: "", description: "" });
                          setShowNewKvalitetDialog(false);
                        }} 
                        disabled={isSavingKvalitet || !newKvalitetGoal.goal_text.trim()}
                      >
                        {isSavingKvalitet && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Legg til
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {kvalitetsGoals.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("auto.foreslaatte_kvalitetsmaal")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      t("auto.levere_alle_prosjekter_innenfor_avtalt_t"),
                      t("auto.oppnaa_null_kritiske_avvik_ved_sluttbefa"),
                      t("auto.sikre_at_alle_ansatte_har_noedvendig_kom_2"),
                      t("auto.gjennomfoere_systematisk_egenkontroll_pa"),
                      "Oppnå høy kundetilfredshet (>90%)",
                    ].map((goal, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => createKvalitetsGoal(goal)}
                        disabled={isSavingKvalitet}
                      >
                        <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="line-clamp-2">{goal}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {kvalitetsGoals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg mb-2">{t("auto.ingen_kvalitetsmaal_ennaa")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t("auto.legg_til_bedriftens_overordnede_kvalitet")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {kvalitetsGoals.map((goal, index) => (
                  <KvalitetGoalCard
                    key={goal.id}
                    goal={goal}
                    index={index}
                    isEditing={editingKvalitetId === goal.id}
                    onEdit={() => setEditingKvalitetId(goal.id)}
                    onCancelEdit={() => setEditingKvalitetId(null)}
                    onUpdate={updateKvalitetsGoal}
                    onDelete={deleteKvalitetsGoal}
                    isSaving={isSavingKvalitet}
                  />
                ))}
              </div>
            )}

            {kvalitetsGoals.length > 0 && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{kvalitetsGoals.length} kvalitetsmål definert</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function KvalitetGoalCard({
  goal,
  index,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  isSaving,
}: {
  goal: CompanyKsGoal;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, updates: Partial<CompanyKsGoal>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [editData, setEditData] = useState({
    goal_text: goal.goal_text,
    description: goal.description || "",
  });

  const handleSave = async () => {
    await onUpdate(goal.id, editData);
    onCancelEdit();
  };

  if (isEditing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("auto.maal")}</label>
              <Input value={editData.goal_text} onChange={(e) => setEditData({ ...editData, goal_text: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">{t("auto.beskrivelse")}</label>
              <Textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onCancelEdit}><X className="w-4 h-4 mr-1" />{t("auto.avbryt")}</Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}><Save className="w-4 h-4 mr-1" />{t("auto.lagre")}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GripVertical className="w-4 h-4 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{goal.goal_text}</p>
            {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Edit2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(goal.id)} disabled={isSaving}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalCard({
  goal,
  index,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  isSaving,
}: {
  goal: KsSystemGoal;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, updates: Partial<KsSystemGoal>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [editData, setEditData] = useState({
    goal_text: goal.goal_text,
    description: goal.description || "",
  });

  const handleSave = async () => {
    await onUpdate(goal.id, editData);
  };

  if (isEditing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("auto.maal")}</label>
              <Input
                value={editData.goal_text}
                onChange={(e) => setEditData({ ...editData, goal_text: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("auto.beskrivelse")}</label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onCancelEdit}>
                <X className="w-4 h-4 mr-1" />
                {t("auto.avbryt")}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-1" />
                {t("auto.lagre")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GripVertical className="w-4 h-4 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
              {index + 1}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{goal.goal_text}</p>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(goal.id)}
              disabled={isSaving}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
