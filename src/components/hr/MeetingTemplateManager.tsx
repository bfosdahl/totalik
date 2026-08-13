import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, FileText, Pencil, Heading } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/i18n/t";

interface Template {
  id: string;
  template_name: string;
  meeting_type: string;
  is_active: boolean;
  created_at: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  sort_order: number;
  is_required: boolean;
}

const meetingTypeLabels: Record<string, string> = {
  medarbeidersamtale: "Medarbeidersamtale",
  utviklingssamtale: "Utviklingssamtale",
  oppfølging: "Oppfølging",
  prøvetid: "Prøvetid",
};

const questionTypeLabels: Record<string, string> = {
  text: "Fritekst",
  rating: "Vurdering (1-5)",
  yes_no: "Ja/Nei",
  multiple_choice: "Flervalg",
  section_header: "Seksjonstittel",
};

export function MeetingTemplateManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // New template dialog
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("medarbeidersamtale");
  const [saving, setSaving] = useState(false);

  // New question
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("text");
  const [newQuestionRequired, setNewQuestionRequired] = useState(false);
  const [newQuestionOptions, setNewQuestionOptions] = useState("");

  const fetchTemplates = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("hr_meeting_templates")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // If no templates exist, seed default templates for this company
      if (!data || data.length === 0) {
        await supabase.rpc("seed_hr_meeting_templates_for_company", {
          p_company_id: profile.company_id,
        });
        // Re-fetch after seeding
        const { data: seededData, error: seededError } = await supabase
          .from("hr_meeting_templates")
          .select("*")
          .eq("company_id", profile.company_id)
          .order("created_at", { ascending: false });
        if (seededError) throw seededError;
        setTemplates(seededData || []);
      } else {
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const fetchQuestions = useCallback(async (templateId: string) => {
    try {
      setQuestionsLoading(true);
      const { data, error } = await supabase
        .from("hr_meeting_template_questions")
        .select("*")
        .eq("template_id", templateId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      fetchQuestions(selectedTemplate.id);
    } else {
      setQuestions([]);
    }
  }, [selectedTemplate, fetchQuestions]);

  const createTemplate = async () => {
    if (!profile?.company_id || !newName.trim()) return;
    try {
      setSaving(true);
      const { error } = await supabase.from("hr_meeting_templates").insert({
        company_id: profile.company_id,
        template_name: newName.trim(),
        meeting_type: newType,
        created_by: profile.id,
      });
      if (error) throw error;
      toast({ title: "Mal opprettet" });
      setNewDialogOpen(false);
      setNewName("");
      setNewType("medarbeidersamtale");
      fetchTemplates();
    } catch (error) {
      console.error("Error creating template:", error);
      toast({ title: t("auto.feil"), description: t("auto.kunne_ikke_opprette_mal"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from("hr_meeting_templates").delete().eq("id", id);
      if (error) throw error;
      toast({ title: t("auto.mal_slettet") });
      if (selectedTemplate?.id === id) setSelectedTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({ title: t("auto.feil"), description: t("auto.kunne_ikke_slette_mal"), variant: "destructive" });
    }
  };

  const addQuestion = async () => {
    if (!selectedTemplate || !newQuestionText.trim()) return;
    try {
      const insertData: any = {
        template_id: selectedTemplate.id,
        question_text: newQuestionText.trim(),
        question_type: newQuestionType,
        is_required: newQuestionType === "section_header" ? false : newQuestionRequired,
        sort_order: questions.length,
      };

      if (newQuestionType === "multiple_choice" && newQuestionOptions.trim()) {
        const opts = newQuestionOptions.split("\n").map((o) => o.trim()).filter(Boolean);
        insertData.options = JSON.stringify(opts);
      }

      const { error } = await supabase.from("hr_meeting_template_questions").insert(insertData);
      if (error) throw error;
      setNewQuestionText("");
      setNewQuestionType("text");
      setNewQuestionRequired(false);
      setNewQuestionOptions("");
      fetchQuestions(selectedTemplate.id);
    } catch (error) {
      console.error("Error adding question:", error);
      toast({ title: "Feil", description: "Kunne ikke legge til spørsmål", variant: "destructive" });
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!selectedTemplate) return;
    try {
      const { error } = await supabase.from("hr_meeting_template_questions").delete().eq("id", id);
      if (error) throw error;
      fetchQuestions(selectedTemplate.id);
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const parseOptions = (options: any): string[] => {
    if (!options) return [];
    if (Array.isArray(options)) return options;
    try {
      const parsed = typeof options === "string" ? JSON.parse(options) : options;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const renderQuestionItem = (q: Question, i: number) => {
    if (q.question_type === "section_header") {
      return (
        <div
          key={q.id}
          className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-l-primary bg-primary/5"
        >
          <Heading className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm font-semibold text-foreground flex-1">{q.question_text}</p>
          <Button size="icon" variant="ghost" className="shrink-0" onClick={() => deleteQuestion(q.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      );
    }

    const opts = parseOptions(q.options);

    return (
      <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg border bg-background">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{q.question_text}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {questionTypeLabels[q.question_type] || q.question_type}
            </Badge>
            {q.is_required && <Badge variant="secondary" className="text-xs">{t("auto.paakrevd")}</Badge>}
            {opts.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Alternativer: {opts.join(", ")}
              </span>
            )}
          </div>
        </div>
        <Button size="icon" variant="ghost" className="shrink-0" onClick={() => deleteQuestion(q.id)}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("auto.spoersmaalsmaler")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("auto.opprett_maler_med_spoersmaal_du_vil_bruk")}
          </p>
        </div>
        <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t("auto.ny_mal")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("auto.opprett_spoersmaalsmal")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("auto.navn_paa_mal")}</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t("auto.f_eks_aarlig_medarbeidersamtale")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("auto.type_samtale")}</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medarbeidersamtale">{t("auto.medarbeidersamtale")}</SelectItem>
                    <SelectItem value="utviklingssamtale">{t("auto.utviklingssamtale")}</SelectItem>
                    <SelectItem value="oppfølging">{t("auto.oppfoelgingssamtale")}</SelectItem>
                    <SelectItem value="prøvetid">{t("auto.proevetidssamtale")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewDialogOpen(false)}>{t("auto.avbryt")}</Button>
                <Button onClick={createTemplate} disabled={saving || !newName.trim()}>
                  {saving ? "Oppretter..." : "Opprett"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Template list */}
        <div className="space-y-2">
          {loading ? (
            <Card className="p-8 text-center text-muted-foreground">{t("auto.laster")}</Card>
          ) : templates.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t("auto.ingen_maler_ennaa_opprett_din_foerste_ma")}</p>
            </Card>
          ) : (
            templates.map((t) => (
              <Card
                key={t.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                  selectedTemplate?.id === t.id ? "ring-2 ring-primary bg-accent/30" : ""
                }`}
                onClick={() => setSelectedTemplate(t)}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.template_name}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {meetingTypeLabels[t.meeting_type] || t.meeting_type}
                    </Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTemplate(t.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Questions editor */}
        <div>
          {!selectedTemplate ? (
            <Card className="p-12 text-center">
              <Pencil className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t("auto.velg_en_mal_for_aa_redigere_spoersmaal")}</p>
            </Card>
          ) : (
            <Card className="p-5 space-y-5">
              <div>
                <h3 className="font-semibold text-lg">{selectedTemplate.template_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {meetingTypeLabels[selectedTemplate.meeting_type]} · {questions.filter((q) => q.question_type !== "section_header").length} spørsmål
                </p>
              </div>

              {/* Question list */}
              <div className="space-y-2">
                {questionsLoading ? (
                  <p className="text-sm text-muted-foreground">{t("auto.laster_spoersmaal")}</p>
                ) : questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">{t("auto.ingen_spoersmaal_ennaa_legg_til_nedenfor")}</p>
                ) : (
                  questions.map((q, i) => renderQuestionItem(q, i))
                )}
              </div>

              {/* Add question form */}
              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-medium">{t("auto.legg_til_spoersmaal")}</Label>
                <Textarea
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder={newQuestionType === "section_header" ? "Skriv seksjonstittel..." : "Skriv et spørsmål..."}
                  rows={2}
                />

                {newQuestionType === "multiple_choice" && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Alternativer (ett per linje)</Label>
                    <Textarea
                      value={newQuestionOptions}
                      onChange={(e) => setNewQuestionOptions(e.target.value)}
                      placeholder={"Svært godt\nGodt\nGreit\nMindre bra"}
                      rows={4}
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Select value={newQuestionType} onValueChange={(v) => {
                    setNewQuestionType(v);
                    if (v === "section_header") setNewQuestionRequired(false);
                  }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="section_header">{t("auto.seksjonstittel")}</SelectItem>
                      <SelectItem value="text">{t("auto.fritekst")}</SelectItem>
                      <SelectItem value="rating">Vurdering (1-5)</SelectItem>
                      <SelectItem value="yes_no">{t("auto.ja_nei")}</SelectItem>
                      <SelectItem value="multiple_choice">{t("auto.flervalg")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {newQuestionType !== "section_header" && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newQuestionRequired}
                        onCheckedChange={setNewQuestionRequired}
                        id="required-switch"
                      />
                      <Label htmlFor="required-switch" className="text-sm">{t("auto.paakrevd")}</Label>
                    </div>
                  )}
                  <Button
                    onClick={addQuestion}
                    disabled={!newQuestionText.trim() || (newQuestionType === "multiple_choice" && !newQuestionOptions.trim())}
                    size="sm"
                    className="ml-auto gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    {t("auto.legg_til")}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
