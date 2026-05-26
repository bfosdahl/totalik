import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, Save, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RoutineTemplate, RoutineLibraryModule } from "@/hooks/useRoutineLibrary";
import { adoptRoutineTemplateToVisibleSystem } from "@/lib/adoptRoutineTemplate";

interface AiRoutineDialogProps {
  module: RoutineLibraryModule;
  /** Optional adopt callback. If provided, the generated routine is passed to it as a RoutineTemplate shape.
   *  Otherwise, defaults to inserting into customer_routine_instances. */
  onAdopt?: (template: RoutineTemplate) => Promise<void> | void;
}

const MODULE_LABELS: Record<RoutineLibraryModule, string> = {
  ik_hms: "HMS",
  ik_mat: "IK-MAT",
  ik_alkohol: "IK-ALKOHOL",
  ks_ik_bygg: "KS / Bygg",
};

export function AiRoutineDialog({ module, onAdopt }: AiRoutineDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tema, setTema] = useState("");
  const [bransje, setBransje] = useState("");
  const [nivaa, setNivaa] = useState<"kort" | "standard" | "detaljert">("standard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<any>(null);

  const reset = () => {
    setTema("");
    setBransje("");
    setNivaa("standard");
    setResult(null);
  };

  const handleGenerate = async () => {
    if (!tema.trim()) {
      toast.error("Skriv inn tema for rutinen");
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-routine-template", {
        body: { tema, bransje: bransje || undefined, nivaa },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.routine);
      toast.success("Rutine generert");
    } catch (err: any) {
      console.error("AI routine error:", err);
      toast.error(err.message || "Kunne ikke generere rutine");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);

    const template: RoutineTemplate = {
      id: `ai-${Date.now()}`,
      title: result.title || tema,
      description: result.description || null,
      module,
      subcategory: result.subcategory || null,
      frequency: result.frequency || null,
      purpose: result.purpose || null,
      steps: Array.isArray(result.steps) ? result.steps : [],
      legal_refs: Array.isArray(result.legal_refs) ? result.legal_refs : [],
      target_roles: Array.isArray(result.target_roles) ? result.target_roles : [],
      tags: Array.isArray(result.tags) ? result.tags : [],
      status: "published",
      version: 1,
      is_global_default: false,
      created_at: new Date().toISOString(),
      template_number: null,
    };

    try {
      if (onAdopt) {
        await onAdopt(template);
      } else {
        if (!profile?.company_id) throw new Error("Mangler bedrift");
        await adoptRoutineTemplateToVisibleSystem(template, profile.company_id);
        queryClient.invalidateQueries({ queryKey: ["customer-routine-instances"] });
        toast.success("AI-rutine lagret");
      }
      reset();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Kunne ikke lagre rutine");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50">
          <Sparkles className="h-4 w-4" />
          AI-hjelper
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Rutine-generator ({MODULE_LABELS[module]})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-3">
          {!result ? (
            <div className="space-y-4 pb-4">
              <div>
                <Label>Tema *</Label>
                <Input
                  placeholder="F.eks. Vernerunde på byggeplass"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                />
              </div>
              <div>
                <Label>Bransje / kontekst (valgfritt)</Label>
                <Input
                  placeholder="F.eks. Tømrer, restaurant, byggherre"
                  value={bransje}
                  onChange={(e) => setBransje(e.target.value)}
                />
              </div>
              <div>
                <Label>Detaljnivå</Label>
                <Select value={nivaa} onValueChange={(v: any) => setNivaa(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kort">Kort (3-5 punkter)</SelectItem>
                    <SelectItem value="standard">Standard (6-8 punkter)</SelectItem>
                    <SelectItem value="detaljert">Detaljert (10-15 punkter)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !tema.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Genererer...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Generer rutine</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-lg p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Tittel</Label>
                  <Input
                    value={result.title || ""}
                    onChange={(e) => setResult({ ...result, title: e.target.value })}
                    className="font-semibold"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Beskrivelse</Label>
                  <Textarea
                    value={result.description || ""}
                    onChange={(e) => setResult({ ...result, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Formål</Label>
                  <Textarea
                    value={result.purpose || ""}
                    onChange={(e) => setResult({ ...result, purpose: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {result.subcategory && <Badge variant="secondary">{result.subcategory}</Badge>}
                  {result.frequency && <Badge variant="outline">{result.frequency}</Badge>}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Sjekkliste ({Array.isArray(result.steps) ? result.steps.length : 0})
                </h4>
                <div className="space-y-2">
                  {(result.steps || []).map((step: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 border rounded-md p-2 bg-card">
                      <span className="text-xs text-muted-foreground font-mono mt-2">{idx + 1}</span>
                      <Input
                        value={typeof step === "string" ? step : (step.text || "")}
                        onChange={(e) => {
                          const newSteps = [...result.steps];
                          newSteps[idx] = typeof step === "string"
                            ? e.target.value
                            : { ...step, text: e.target.value };
                          setResult({ ...result, steps: newSteps });
                        }}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {result.legal_refs?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Lovreferanser</h4>
                  <div className="flex gap-1 flex-wrap">
                    {result.legal_refs.map((r: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Lagre rutine
                </Button>
                <Button variant="outline" onClick={() => setResult(null)}>
                  <RefreshCw className="h-4 w-4 mr-2" />Ny
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
