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
import { Plus, Trash2, GripVertical, FileText, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
      setTemplates(data || []);
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
      toast({ title: "Feil", description: "Kunne ikke opprette mal", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from("hr_meeting_templates").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Mal slettet" });
      if (selectedTemplate?.id === id) setSelectedTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({ title: "Feil", description: "Kunne ikke slette mal", variant: "destructive" });
    }
  };

  const addQuestion = async () => {
    if (!selectedTemplate || !newQuestionText.trim()) return;
    try {
      const { error } = await supabase.from("hr_meeting_template_questions").insert({
        template_id: selectedTemplate.id,
        question_text: newQuestionText.trim(),
        question_type: newQuestionType,
        is_required: newQuestionRequired,
        sort_order: questions.length,
      });
      if (error) throw error;
      setNewQuestionText("");
      setNewQuestionType("text");
      setNewQuestionRequired(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Spørsmålsmaler</h2>
          <p className="text-sm text-muted-foreground">
            Opprett maler med spørsmål du vil bruke i medarbeidersamtaler
          </p>
        </div>
        <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Ny mal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Opprett spørsmålsmal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Navn på mal *</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="F.eks. Årlig medarbeidersamtale"
                />
              </div>
              <div className="space-y-2">
                <Label>Type samtale</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medarbeidersamtale">Medarbeidersamtale</SelectItem>
                    <SelectItem value="utviklingssamtale">Utviklingssamtale</SelectItem>
                    <SelectItem value="oppfølging">Oppfølgingssamtale</SelectItem>
                    <SelectItem value="prøvetid">Prøvetidssamtale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Avbryt</Button>
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
            <Card className="p-8 text-center text-muted-foreground">Laster...</Card>
          ) : templates.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Ingen maler ennå. Opprett din første mal.</p>
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
              <p className="text-muted-foreground">Velg en mal for å redigere spørsmål</p>
            </Card>
          ) : (
            <Card className="p-5 space-y-5">
              <div>
                <h3 className="font-semibold text-lg">{selectedTemplate.template_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {meetingTypeLabels[selectedTemplate.meeting_type]} · {questions.length} spørsmål
                </p>
              </div>

              {/* Question list */}
              <div className="space-y-2">
                {questionsLoading ? (
                  <p className="text-sm text-muted-foreground">Laster spørsmål...</p>
                ) : questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Ingen spørsmål ennå. Legg til nedenfor.</p>
                ) : (
                  questions.map((q, i) => (
                    <div
                      key={q.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-background"
                    >
                      <span className="text-sm text-muted-foreground font-mono mt-0.5">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{q.question_text}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {questionTypeLabels[q.question_type] || q.question_type}
                          </Badge>
                          {q.is_required && (
                            <Badge variant="secondary" className="text-xs">Påkrevd</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => deleteQuestion(q.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Add question form */}
              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-medium">Legg til spørsmål</Label>
                <Textarea
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Skriv et spørsmål..."
                  rows={2}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={newQuestionType} onValueChange={setNewQuestionType}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Fritekst</SelectItem>
                      <SelectItem value="rating">Vurdering (1-5)</SelectItem>
                      <SelectItem value="yes_no">Ja/Nei</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newQuestionRequired}
                      onCheckedChange={setNewQuestionRequired}
                      id="required-switch"
                    />
                    <Label htmlFor="required-switch" className="text-sm">Påkrevd</Label>
                  </div>
                  <Button
                    onClick={addQuestion}
                    disabled={!newQuestionText.trim()}
                    size="sm"
                    className="ml-auto gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Legg til
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
