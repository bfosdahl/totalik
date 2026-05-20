import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, Save, Trash2, RefreshCw, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminKsTemplates, CHECKLIST_CATEGORIES } from "@/hooks/useAdminKsTemplates";
import { useCompanyKsChecklistTemplates } from "@/hooks/useCompanyKsChecklistTemplates";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TRADES = [
  "Tømrer", "Murer", "Betongarbeider", "Rørlegger", "Elektriker",
  "Blikkenslager", "Maler", "Gulvlegger", "Ventilasjon", "Generelt",
];

interface AiChecklistDialogProps {
  trigger?: React.ReactNode;
}

export function AiChecklistDialog({ trigger }: AiChecklistDialogProps) {
  const { createChecklistTemplate } = useAdminKsTemplates();
  const [open, setOpen] = useState(false);
  const [tema, setTema] = useState("");
  const [kategori, setKategori] = useState("");
  const [trade, setTrade] = useState("");
  const [detaljer, setDetaljer] = useState("");
  const [rutineRef, setRutineRef] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!tema.trim()) {
      toast.error("Skriv inn et tema for sjekklisten");
      return;
    }
    setIsGenerating(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-checklist-template", {
        body: {
          tema,
          kategori: kategori || undefined,
          trade: trade || undefined,
          detaljer: detaljer || undefined,
          rutine_referanse: rutineRef || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.checklist);
      toast.success("Sjekkliste generert!");
    } catch (err: any) {
      console.error("AI generation error:", err);
      toast.error(err.message || "Kunne ikke generere sjekkliste");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await createChecklistTemplate.mutateAsync({
        template_name: result.template_name,
        description: result.description,
        category: result.category || "Generell egenkontroll",
        trade: result.trade,
        checkpoints: result.checkpoints || [],
        is_active: true,
      });
      toast.success("Sjekkliste-mal lagret i malbiblioteket!");
      resetForm();
      setOpen(false);
    } catch {
      toast.error("Kunne ikke lagre mal");
    }
  };

  const resetForm = () => {
    setResult(null);
    setTema("");
    setKategori("");
    setTrade("");
    setDetaljer("");
    setRutineRef("");
  };

  const handleRemoveCheckpoint = (index: number) => {
    setResult((prev: any) => ({
      ...prev,
      checkpoints: prev.checkpoints.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleEditCheckpoint = (index: number, field: string, value: string) => {
    setResult((prev: any) => ({
      ...prev,
      checkpoints: prev.checkpoints.map((cp: any, i: number) =>
        i === index ? { ...cp, [field]: value } : cp
      ),
    }));
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50">
      <Sparkles className="h-4 w-4" />
      Lag sjekkliste med AI
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Sjekkliste-generator
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6 pb-4">
            {/* Input Form */}
            {!result && (
              <div className="space-y-4">
                <div>
                  <Label>Tema / Tittel *</Label>
                  <Input
                    placeholder="F.eks. Sjekkliste for montering av vinduer"
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Kategori</Label>
                    <Select value={kategori} onValueChange={setKategori}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHECKLIST_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fag / Håndverk</Label>
                    <Select value={trade} onValueChange={setTrade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg fag" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRADES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-1">
                    Tilknyttet rutine
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </Label>
                  <Input
                    placeholder="F.eks. Rutine for kontroll av vinduer og dører"
                    value={rutineRef}
                    onChange={(e) => setRutineRef(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Skriv inn rutinen denne sjekklisten skal knyttes til
                  </p>
                </div>

                <div>
                  <Label>Tilleggsdetaljer</Label>
                  <Textarea
                    placeholder="Beskriv spesifikke krav, standarder eller fokusområder..."
                    value={detaljer}
                    onChange={(e) => setDetaljer(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !tema.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Genererer sjekkliste...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generer sjekkliste
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Result Preview */}
            {result && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Malnavn</Label>
                    <Input
                      value={result.template_name}
                      onChange={(e) => setResult((prev: any) => ({ ...prev, template_name: e.target.value }))}
                      className="font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Beskrivelse</Label>
                    <Textarea
                      value={result.description}
                      onChange={(e) => setResult((prev: any) => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {result.category && <Badge variant="secondary">{result.category}</Badge>}
                    {result.trade && <Badge variant="outline">{result.trade}</Badge>}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Sjekkpunkter ({result.checkpoints?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {result.checkpoints?.map((cp: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-3 bg-card">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-muted-foreground font-mono mt-1">{idx + 1}</span>
                          <div className="flex-1 space-y-1">
                            <Input
                              value={cp.checkpoint_text}
                              onChange={(e) => handleEditCheckpoint(idx, "checkpoint_text", e.target.value)}
                              className="text-sm font-medium"
                            />
                            <Input
                              value={cp.help_text || ""}
                              onChange={(e) => handleEditCheckpoint(idx, "help_text", e.target.value)}
                              placeholder="Hjelpetekst..."
                              className="text-xs text-muted-foreground"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleRemoveCheckpoint(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {result.related_standards?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Relaterte standarder</h4>
                    <div className="flex gap-1 flex-wrap">
                      {result.related_standards.map((std: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{std}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Lagre i malbiblioteket
                  </Button>
                  <Button variant="outline" onClick={() => setResult(null)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Ny
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
