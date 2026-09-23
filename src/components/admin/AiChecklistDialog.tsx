import { useState, useEffect } from "react";
import { readEdgeFunctionError } from "@/utils/edgeFunctionError";
import { useNavigate } from "react-router-dom";
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
import { t } from "@/i18n/t";

const TRADES = [
  "Tømrer", "Murer", "Betongarbeider", "Rørlegger", "Elektriker",
  "Blikkenslager", "Maler", "Gulvlegger", "Ventilasjon", "Generelt",
];

const LANGUAGES = [
  { value: "auto", label: "Automatisk (samme språk som jeg skriver)" },
  { value: "norsk (bokmål)", label: "Norsk" },
  { value: "English", label: "Engelsk" },
  { value: "polski", label: "Polsk" },
  { value: "lietuvių", label: "Litauisk" },
  { value: "latviešu", label: "Latvisk" },
  { value: "svenska", label: "Svensk" },
  { value: "українська", label: "Ukrainsk" },
  { value: "română", label: "Rumensk" },
  { value: "Deutsch", label: "Tysk" },
];

interface AiChecklistDialogProps {
  trigger?: React.ReactNode;
  /** Called after a successful save so parent lists can refetch */
  onSaved?: () => void | Promise<void>;
}

export function AiChecklistDialog({ trigger, onSaved }: AiChecklistDialogProps) {
  const { isSystemAdmin } = useAuth();
  const navigate = useNavigate();
  const { createChecklistTemplate } = useAdminKsTemplates();
  const { createTemplate: createCompanyChecklistTemplate } = useCompanyKsChecklistTemplates();
  const [open, setOpen] = useState(false);
  const [tema, setTema] = useState("");
  const [kategori, setKategori] = useState("");
  const [isCustomKategori, setIsCustomKategori] = useState(false);
  const [trade, setTrade] = useState("");
  const [detaljer, setDetaljer] = useState("");
  const [rutineRef, setRutineRef] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!tema.trim()) {
      toast.error(t("auto.skriv_inn_et_tema_for_sjekklisten"));
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
      toast.success(t("auto.sjekkliste_generert"));
    } catch (err: any) {
      console.error("AI generation error:", err);
      toast.error(await readEdgeFunctionError(err, "Kunne ikke generere sjekkliste"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    // Prefer the kategori the user explicitly chose/typed in the form;
    // fall back to whatever the AI returned.
    const finalCategory = (kategori && kategori.trim())
      ? kategori.trim()
      : (result.category || "Generell egenkontroll");
    try {
      let savedId: string | undefined;
      if (isSystemAdmin) {
        const created = await createChecklistTemplate.mutateAsync({
          template_name: result.template_name,
          description: result.description,
          category: finalCategory,
          trade: result.trade,
          checkpoints: result.checkpoints || [],
          is_active: true,
        });
        savedId = (created as any)?.id;
      } else {
        const created = await createCompanyChecklistTemplate({
          template_name: result.template_name,
          description: result.description,
          category: finalCategory,
          trade: result.trade,
          checkpoints: result.checkpoints || [],
        });
        if (!created) throw new Error("Kunne ikke lagre i bedriftens malbibliotek");
        savedId = created.id;
      }
      console.log("[AiChecklistDialog] Saved template id:", savedId, "category:", finalCategory);
      toast.success(t("auto.sjekkliste_mal_lagret"), {
        description: isSystemAdmin
          ? "Finn den under Admin → Sjekklistemaler"
          : "Finn den under KS Bygg → Sjekklister (Mine maler)",
        duration: 8000,
        action: isSystemAdmin ? undefined : {
          label: t("auto.aapne"),
          onClick: () => navigate("/ks/ik-ks/sjekklister"),
        },
      });
      await onSaved?.();
      resetForm();
      setOpen(false);
    } catch (err: any) {
      console.error("[AiChecklistDialog] Save failed:", err);
      toast.error(err?.message || "Kunne ikke lagre mal");
    }
  };

  const resetForm = () => {
    setResult(null);
    setTema("");
    setKategori("");
    setIsCustomKategori(false);
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

  // Defensive: Radix sometimes leaves body styles locked after close. Reset them on unmount.
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";
      }
    };
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setTimeout(() => {
            document.body.style.pointerEvents = "";
            document.body.style.overflow = "";
          }, 100);
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => { if (isGenerating) e.preventDefault(); }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            {t("auto.ai_sjekkliste_generator")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6 pb-4">
            {/* Input Form */}
            {!result && (
              <div className="space-y-4">
                <div>
                  <Label>{t("auto.tema_tittel")}</Label>
                  <Input
                    placeholder={t("auto.f_eks_sjekkliste_for_montering_av_vindue")}
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("auto.kategori")}</Label>
                    {isCustomKategori ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder={t("auto.skriv_egen_kategori")}
                          value={kategori}
                          onChange={(e) => setKategori(e.target.value)}
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsCustomKategori(false);
                            setKategori("");
                          }}
                        >
                          {t("auto.avbryt")}
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={kategori}
                        onValueChange={(v) => {
                          if (v === "__custom__") {
                            setIsCustomKategori(true);
                            setKategori("");
                          } else {
                            setKategori(v);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("auto.velg_kategori")} />
                        </SelectTrigger>
                        <SelectContent>
                          {CHECKLIST_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                          <SelectItem value="__custom__" className="text-blue-600 font-medium">
                            {t("auto.egen_kategori")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <Label>{t("auto.fag_haandverk")}</Label>
                    <Select value={trade} onValueChange={setTrade}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("auto.velg_fag")} />
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
                  <Label>Språk på sjekklisten</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatisk: sjekklisten lages på samme språk som du skriver i.
                  </p>
                </div>

                <div>
                  <Label className="flex items-center gap-1">
                    {t("auto.tilknyttet_rutine")}
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </Label>
                  <Input
                    placeholder={t("auto.f_eks_rutine_for_kontroll_av_vinduer_og_")}
                    value={rutineRef}
                    onChange={(e) => setRutineRef(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("auto.skriv_inn_rutinen_denne_sjekklisten_skal")}
                  </p>
                </div>

                <div>
                  <Label>{t("auto.tilleggsdetaljer")}</Label>
                  <Textarea
                    placeholder={t("auto.beskriv_spesifikke_krav_standarder_eller")}
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
                    <Label className="text-xs text-muted-foreground">{t("auto.malnavn")}</Label>
                    <Input
                      value={result.template_name}
                      onChange={(e) => setResult((prev: any) => ({ ...prev, template_name: e.target.value }))}
                      className="font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t("auto.beskrivelse")}</Label>
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
                              placeholder={t("auto.hjelpetekst")}
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
                    <h4 className="text-sm font-semibold mb-1">{t("auto.relaterte_standarder")}</h4>
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
                    {t("auto.lagre_i_malbiblioteket")}
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
