import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  sort_order: number;
  is_required: boolean;
}

interface ConductMeetingDialogProps {
  meetingId: string;
  meetingName: string;
  templateId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}

export function ConductMeetingDialog({
  meetingId,
  meetingName,
  templateId,
  open,
  onOpenChange,
  onCompleted,
}: ConductMeetingDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState("");

  useEffect(() => {
    if (open && templateId) {
      setLoading(true);
      supabase
        .from("hr_meeting_template_questions")
        .select("*")
        .eq("template_id", templateId)
        .order("sort_order", { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            setQuestions(data);
            const init: Record<string, any> = {};
            data.forEach((q) => {
              if (q.question_type === "rating") init[q.id] = 0;
              else if (q.question_type === "multiple_choice") {
                // Check if options have more than 3 items (likely multi-select like checkboxes)
                const opts = parseOptions(q.options);
                init[q.id] = opts.length > 3 ? [] : "";
              } else init[q.id] = "";
            });
            setAnswers(init);
          }
          setLoading(false);
        });
    } else if (open) {
      setQuestions([]);
      setAnswers({});
    }
  }, [open, templateId]);

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

  const setAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleCheckbox = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      if (current.includes(option)) {
        return { ...prev, [questionId]: current.filter((o: string) => o !== option) };
      }
      return { ...prev, [questionId]: [...current, option] };
    });
  };

  const handleSubmit = async () => {
    if (!profile) return;

    // Check required questions
    const actualQuestions = questions.filter((q) => q.question_type !== "section_header");
    for (const q of actualQuestions) {
      if (q.is_required) {
        const a = answers[q.id];
        if (!a || (typeof a === "string" && !a.trim()) || (q.question_type === "rating" && a === 0) || (Array.isArray(a) && a.length === 0)) {
          toast({ title: "Manglende svar", description: `Spørsmål "${q.question_text}" er påkrevd`, variant: "destructive" });
          return;
        }
      }
    }

    try {
      setSaving(true);

      if (actualQuestions.length > 0) {
        const responses = actualQuestions.map((q) => ({
          meeting_id: meetingId,
          question_id: q.id,
          answer_text: q.question_type === "text" ? (answers[q.id] || null) : null,
          answer_rating: q.question_type === "rating" ? (answers[q.id] || null) : null,
          answer_json:
            q.question_type === "yes_no"
              ? { value: answers[q.id] }
              : q.question_type === "multiple_choice"
              ? { selected: Array.isArray(answers[q.id]) ? answers[q.id] : [answers[q.id]] }
              : null,
        }));

        const { error: respError } = await supabase.from("hr_meeting_responses").insert(responses);
        if (respError) throw respError;
      }

      const { error: updateError } = await supabase
        .from("hr_meetings")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by_id: profile.id,
          notes: meetingNotes || null,
        })
        .eq("id", meetingId);
      if (updateError) throw updateError;

      toast({ title: "Samtale gjennomført", description: "Svar og notater er lagret" });
      onOpenChange(false);
      onCompleted();
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast({ title: "Feil", description: "Kunne ikke lagre samtalen", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const renderQuestion = (q: Question, index: number) => {
    if (q.question_type === "section_header") {
      return (
        <div key={q.id} className="pt-4 first:pt-0">
          <h3 className="text-base font-semibold border-b pb-2 text-foreground">{q.question_text}</h3>
        </div>
      );
    }

    // Calculate display number (skip section headers)
    const questionNumber = questions
      .slice(0, questions.indexOf(q))
      .filter((x) => x.question_type !== "section_header").length + 1;

    switch (q.question_type) {
      case "multiple_choice": {
        const opts = parseOptions(q.options);
        // If options > 3, render as checkboxes (multi-select)
        if (opts.length > 3) {
          return (
            <div className="space-y-2" key={q.id}>
              <Label className="flex items-start gap-2">
                <span>{q.question_text} {q.is_required && <span className="text-destructive">*</span>}</span>
              </Label>
              <div className="space-y-2 pl-2">
                {opts.map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <Checkbox
                      checked={Array.isArray(answers[q.id]) && answers[q.id].includes(opt)}
                      onCheckedChange={() => toggleCheckbox(q.id, opt)}
                      id={`${q.id}-${opt}`}
                    />
                    <Label htmlFor={`${q.id}-${opt}`} className="text-sm font-normal cursor-pointer">
                      {opt}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        // Otherwise render as radio (single select)
        return (
          <div className="space-y-2" key={q.id}>
            <Label className="flex items-start gap-2">
              <span>{q.question_text} {q.is_required && <span className="text-destructive">*</span>}</span>
            </Label>
            <RadioGroup
              value={typeof answers[q.id] === "string" ? answers[q.id] : ""}
              onValueChange={(v) => setAnswer(q.id, v)}
              className="space-y-1 pl-2"
            >
              {opts.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                  <Label htmlFor={`${q.id}-${opt}`} className="text-sm font-normal cursor-pointer">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      }

      case "rating":
        return (
          <div className="space-y-2" key={q.id}>
            <Label className="flex items-start gap-2">
              <span>{q.question_text} {q.is_required && <span className="text-destructive">*</span>}</span>
            </Label>
            <div className="flex gap-1 pl-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAnswer(q.id, n)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-7 h-7 transition-colors",
                      n <= (answers[q.id] || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
              {answers[q.id] > 0 && (
                <span className="text-sm text-muted-foreground ml-2 self-center">
                  {answers[q.id]}/5
                </span>
              )}
            </div>
          </div>
        );

      case "yes_no":
        return (
          <div className="space-y-2" key={q.id}>
            <Label className="flex items-start gap-2">
              <span>{q.question_text} {q.is_required && <span className="text-destructive">*</span>}</span>
            </Label>
            <RadioGroup
              value={answers[q.id] || ""}
              onValueChange={(v) => setAnswer(q.id, v)}
              className="flex gap-4 pl-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="ja" id={`${q.id}-ja`} />
                <Label htmlFor={`${q.id}-ja`}>Ja</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="nei" id={`${q.id}-nei`} />
                <Label htmlFor={`${q.id}-nei`}>Nei</Label>
              </div>
            </RadioGroup>
          </div>
        );

      default: // text
        return (
          <div className="space-y-2" key={q.id}>
            <Label className="flex items-start gap-2">
              <span>{q.question_text} {q.is_required && <span className="text-destructive">*</span>}</span>
            </Label>
            <Textarea
              value={answers[q.id] || ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="Skriv svar..."
              rows={3}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Gjennomfør samtale
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Samtale med {meetingName}</p>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {loading ? (
            <p className="text-muted-foreground text-sm">Laster spørsmål...</p>
          ) : questions.length === 0 ? (
            <div className="text-sm text-muted-foreground italic border rounded-lg p-4 bg-muted/30">
              Ingen spørsmålsmal er knyttet til denne samtalen. Du kan likevel registrere notater og markere som gjennomført.
            </div>
          ) : (
            <div className="space-y-5">
              {questions.map((q, i) => renderQuestion(q, i))}
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            <Label>Oppsummering / notater</Label>
            <Textarea
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              placeholder="Legg til oppsummering eller notater fra samtalen..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {saving ? "Lagrer..." : "Fullfør samtale"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
