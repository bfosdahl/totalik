import { useState, useRef } from "react";
import { readEdgeFunctionError } from "@/utils/edgeFunctionError";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  FileText, 
  Settings, 
  Edit, 
  Trash2, 
  Upload,
  CheckSquare,
  ArrowLeft,
  Download,
  Eye,
  File,
  FileSpreadsheet,
  Image,
  Sparkles,
  Loader2,
  Save,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useKsModule2Templates } from "@/hooks/useKsModule2Templates";
import { useKsModule2Settings } from "@/hooks/useKsModule2Settings";
import { useKsModule2DocumentTemplates } from "@/hooks/useKsModule2DocumentTemplates";
import { useAdminKsTemplates, CHECKLIST_CATEGORIES } from "@/hooks/useAdminKsTemplates";
import { useCompanyKsChecklistTemplates } from "@/hooks/useCompanyKsChecklistTemplates";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { t } from "@/i18n/t";

const CATEGORIES = [
  { value: "betong", label: t("auto.betong") },
  { value: "våtrom", label: t("auto.vaatrom") },
  { value: "tømrer", label: t("auto.toemrer") },
  { value: "tak", label: t("auto.tak") },
  { value: "grunn", label: t("auto.grunnarbeid") },
  { value: "brann", label: t("auto.brann") },
  { value: "elektro", label: t("auto.elektro") },
  { value: "rør", label: t("auto.roerlegger") },
  { value: "ventilasjon", label: t("auto.ventilasjon") },
  { value: "gulv", label: t("auto.gulv") },
  { value: "overflate", label: t("auto.overflate") },
  { value: "fasade", label: t("auto.fasade") },
  { value: "utomhus", label: t("auto.utomhus") },
  { value: "ferdigstillelse", label: t("auto.ferdigstillelse") },
  { value: "general", label: t("auto.generelt") },
];

const DOCUMENT_CATEGORIES = [
  { value: "sjekkliste", label: t("auto.sjekkliste_mal") },
  { value: "skjema", label: t("auto.skjema") },
  { value: "rutine", label: t("auto.rutine") },
  { value: "byggesak", label: t("auto.byggesak") },
  { value: "kontrakt", label: t("auto.kontrakt") },
  { value: "annet", label: t("auto.annet") },
];

export default function Ks2Admin() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { templates, isLoading: templatesLoading, createTemplate, updateTemplate, deleteTemplate } = useKsModule2Templates();
  const { settings, isLoading: settingsLoading, updateSettings } = useKsModule2Settings();
  const { documents, isLoading: documentsLoading, uploadDocument, deleteDocument, getDownloadUrl, isUploading } = useKsModule2DocumentTemplates();
  
  const { isSystemAdmin } = useAuth();
  const { createChecklistTemplate } = useAdminKsTemplates();
  const { createTemplate: createCompanyChecklistTemplate } = useCompanyKsChecklistTemplates();

  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({
    template_name: "",
    category: "general",
    description: "",
    checkpoints: [] as any[]
  });
  const [newCheckpoint, setNewCheckpoint] = useState({
    text: "",
    type: "yesno",
    required: true
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    title: "",
    category: "sjekkliste",
    description: ""
  });

  // AI Checklist Maker state
  const [aiTema, setAiTema] = useState("");
  const [aiKategori, setAiKategori] = useState("");
  const [aiTrade, setAiTrade] = useState("");
  const [aiDetaljer, setAiDetaljer] = useState("");
  const [aiRutineRef, setAiRutineRef] = useState("");
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const handleAiGenerate = async () => {
    if (!aiTema.trim()) {
      toast.error(t("auto.skriv_inn_et_tema_for_sjekklisten"));
      return;
    }
    setAiIsGenerating(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-checklist-template", {
        body: {
          tema: aiTema,
          kategori: aiKategori || undefined,
          trade: aiTrade || undefined,
          detaljer: aiDetaljer || undefined,
          rutine_referanse: aiRutineRef || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiResult(data.checklist);
      toast.success(t("auto.sjekkliste_generert"));
    } catch (err: any) {
      console.error("AI generation error:", err);
      toast.error(await readEdgeFunctionError(err, "Kunne ikke generere sjekkliste"));
    } finally {
      setAiIsGenerating(false);
    }
  };

  const handleSaveAiChecklist = async () => {
    if (!aiResult) return;
    try {
      if (isSystemAdmin) {
        // Systemadmin: lagre i globalt admin-bibliotek
        await createChecklistTemplate.mutateAsync({
          template_name: aiResult.template_name,
          description: aiResult.description,
          category: aiResult.category || "Generell egenkontroll",
          trade: aiResult.trade,
          checkpoints: aiResult.checkpoints || [],
          is_active: true,
        });
      } else {
        // Bedriftsbruker: lagre i bedriftens eget malbibliotek
        const created = await createCompanyChecklistTemplate({
          template_name: aiResult.template_name,
          description: aiResult.description,
          category: aiResult.category || "general",
          trade: aiResult.trade,
          checkpoints: aiResult.checkpoints || [],
        });
        if (!created) throw new Error("Kunne ikke lagre i bedriftens malbibliotek");
      }
      toast.success(t("auto.sjekkliste_mal_lagret_i_malbiblioteket"));
      setAiResult(null);
      setAiTema("");
      setAiKategori("");
      setAiTrade("");
      setAiDetaljer("");
      setAiRutineRef("");
    } catch (err: any) {
      toast.error(err?.message || "Kunne ikke lagre mal");
    }
  };

  const handleRemoveAiCheckpoint = (index: number) => {
    setAiResult((prev: any) => ({
      ...prev,
      checkpoints: prev.checkpoints.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleEditAiCheckpoint = (index: number, field: string, value: string) => {
    setAiResult((prev: any) => ({
      ...prev,
      checkpoints: prev.checkpoints.map((cp: any, i: number) =>
        i === index ? { ...cp, [field]: value } : cp
      ),
    }));
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.template_name) {
      toast.error(t("auto.mal_maa_ha_et_navn"));
      return;
    }
    
    await createTemplate({
      template_name: newTemplate.template_name,
      category: newTemplate.category,
      description: newTemplate.description,
      checkpoints: newTemplate.checkpoints
    });
    
    setNewTemplate({ template_name: "", category: "general", description: "", checkpoints: [] });
    setIsNewTemplateOpen(false);
  };

  const handleAddCheckpoint = () => {
    if (!newCheckpoint.text) return;
    
    const checkpoint = {
      id: String(newTemplate.checkpoints.length + 1),
      text: newCheckpoint.text,
      type: newCheckpoint.type,
      required: newCheckpoint.required
    };
    
    setNewTemplate(prev => ({
      ...prev,
      checkpoints: [...prev.checkpoints, checkpoint]
    }));
    setNewCheckpoint({ text: "", type: "yesno", required: true });
  };

  const handleDeleteCheckpoint = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne malen?")) {
      await deleteTemplate(id);
    }
  };

  const handleSaveSettings = async (field: string, value: any) => {
    await updateSettings({ [field]: value });
  };

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadData.title) {
      toast.error(t("auto.velg_fil_og_fyll_inn_tittel"));
      return;
    }
    
    uploadDocument({
      file: uploadFile,
      title: uploadData.title,
      category: uploadData.category,
      description: uploadData.description,
      isSystemTemplate: true
    }, {
      onSuccess: () => {
        setUploadFile(null);
        setUploadData({ title: "", category: "sjekkliste", description: "" });
        setIsUploadDocOpen(false);
      }
    });
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    const url = await getDownloadUrl(filePath);
    if (url) {
      window.open(url, "_blank");
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    if (confirm("Er du sikker på at du vil slette dette dokumentet?")) {
      deleteDocument(doc);
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (fileType?.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType?.includes("word") || fileType?.includes("document")) return <File className="h-8 w-8 text-blue-500" />;
    if (fileType?.includes("image")) return <Image className="h-8 w-8 text-green-500" />;
    if (fileType?.includes("spreadsheet") || fileType?.includes("excel")) return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    return <FileText className="h-8 w-8 text-muted-foreground" />;
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/ks")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t("auto.admin_ks_bygg")}</h1>
              <p className="text-muted-foreground">{t("auto.administrer_maler_dokumenter_og_innstill")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="ai-maker" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="ai-maker" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{t("auto.ai_maker")}</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t("auto.sjekkliste_maler")}</span>
              <span className="sm:hidden">{t("auto.maler")}</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t("auto.dokumentbank")}</span>
              <span className="sm:hidden">{t("auto.dok")}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t("auto.innstillinger")}</span>
              <span className="sm:hidden">{t("auto.innst")}</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Sjekkliste Maker Tab */}
          <TabsContent value="ai-maker" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("auto.ai_sjekkliste_maker")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("auto.generer_komplette_sjekklistemaler_med_ai")}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Input form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("auto.beskriv_sjekklisten")}</CardTitle>
                  <CardDescription>{t("auto.fyll_inn_tema_og_detaljer_saa_genererer_")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("auto.tema_tittel_2")}</Label>
                    <Input
                      value={aiTema}
                      onChange={(e) => setAiTema(e.target.value)}
                      placeholder={t("auto.f_eks_toemrerarbeid_yttervegger_betongst")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("auto.kategori")}</Label>
                      <Select value={aiKategori} onValueChange={setAiKategori}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("auto.velg_kategori_2")} />
                        </SelectTrigger>
                        <SelectContent>
                          {CHECKLIST_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("auto.fag_haandverk_2")}</Label>
                      <Select value={aiTrade} onValueChange={setAiTrade}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("auto.velg_fag_2")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tømrer">{t("auto.toemrer")}</SelectItem>
                          <SelectItem value="Murer">{t("auto.murer")}</SelectItem>
                          <SelectItem value="Betongarbeider">{t("auto.betongarbeider")}</SelectItem>
                          <SelectItem value="Rørlegger">{t("auto.roerlegger")}</SelectItem>
                          <SelectItem value="Elektriker">{t("auto.elektriker")}</SelectItem>
                          <SelectItem value="Blikkenslager">{t("auto.blikkenslager")}</SelectItem>
                          <SelectItem value="Maler">{t("auto.maler")}</SelectItem>
                          <SelectItem value="Flislegger">{t("auto.flislegger")}</SelectItem>
                          <SelectItem value="Taktekker">{t("auto.taktekker")}</SelectItem>
                          <SelectItem value="Generelt">{t("auto.generelt")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {t("auto.tilknyttet_rutine")}
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </Label>
                    <Input
                      value={aiRutineRef}
                      onChange={(e) => setAiRutineRef(e.target.value)}
                      placeholder={t("auto.f_eks_rutine_for_egenkontroll_toemrerarb")}
                    />
                    <p className="text-xs text-muted-foreground">{t("auto.skriv_inn_rutinen_denne_sjekklisten_hoer")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("auto.tilleggsdetaljer")}</Label>
                    <Textarea
                      value={aiDetaljer}
                      onChange={(e) => setAiDetaljer(e.target.value)}
                      placeholder={t("auto.spesielle_krav_standarder_materialer_ell")}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleAiGenerate}
                    disabled={aiIsGenerating || !aiTema.trim()}
                    className="w-full gap-2"
                  >
                    {aiIsGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Genererer sjekkliste...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generer med AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview / Result */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("auto.forhaandsvisning")}</CardTitle>
                  <CardDescription>
                    {aiResult ? "Rediger og lagre sjekklisten" : "Generert sjekkliste vises her"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!aiResult ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Fyll inn tema og trykk "Generer med AI"</p>
                      <p className="text-sm mt-1">{t("auto.sjekklisten_blir_klar_paa_noen_sekunder")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("auto.navn_2")}</Label>
                        <Input
                          value={aiResult.template_name}
                          onChange={(e) => setAiResult((p: any) => ({ ...p, template_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("auto.beskrivelse")}</Label>
                        <Textarea
                          value={aiResult.description}
                          onChange={(e) => setAiResult((p: any) => ({ ...p, description: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{aiResult.category}</Badge>
                        {aiResult.trade && <Badge variant="secondary">{aiResult.trade}</Badge>}
                      </div>

                      {aiResult.related_standards?.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">{t("auto.standarder")} </span>
                          {aiResult.related_standards.join(", ")}
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Sjekkpunkter ({aiResult.checkpoints?.length || 0})
                        </Label>
                        <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                          {aiResult.checkpoints?.map((cp: any, idx: number) => (
                            <div key={idx} className="p-3 group hover:bg-muted/50">
                              <div className="flex items-start gap-2">
                                <span className="text-xs text-muted-foreground font-mono mt-0.5">{idx + 1}.</span>
                                <div className="flex-1 min-w-0">
                                  <Input
                                    value={cp.checkpoint_text}
                                    onChange={(e) => handleEditAiCheckpoint(idx, "checkpoint_text", e.target.value)}
                                    className="text-sm border-0 p-0 h-auto shadow-none focus-visible:ring-0 bg-transparent"
                                  />
                                  {cp.help_text && (
                                    <Input
                                      value={cp.help_text}
                                      onChange={(e) => handleEditAiCheckpoint(idx, "help_text", e.target.value)}
                                      className="text-xs text-muted-foreground border-0 p-0 h-auto shadow-none focus-visible:ring-0 bg-transparent mt-1"
                                    />
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={() => handleRemoveAiCheckpoint(idx)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSaveAiChecklist} className="flex-1 gap-2">
                          <Save className="h-4 w-4" />
                          {t("auto.lagre_i_malbiblioteket")}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleAiGenerate}
                          disabled={aiIsGenerating}
                          className="gap-2"
                        >
                          <RefreshCw className={`h-4 w-4 ${aiIsGenerating ? 'animate-spin' : ''}`} />
                          {t("auto.generer_paa_nytt")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sjekkliste-maler Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{t("auto.sjekkliste_maler")}</h2>
                <p className="text-sm text-muted-foreground">
                  {templates.length} maler tilgjengelig
                </p>
              </div>
              <Dialog open={isNewTemplateOpen} onOpenChange={setIsNewTemplateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("auto.ny_mal")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("auto.opprett_ny_sjekkliste_mal")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("auto.malnavn_2")}</Label>
                        <Input 
                          value={newTemplate.template_name}
                          onChange={e => setNewTemplate(prev => ({ ...prev, template_name: e.target.value }))}
                          placeholder={t("auto.f_eks_betongstoep_kontroll")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("auto.kategori")}</Label>
                        <Select 
                          value={newTemplate.category}
                          onValueChange={v => setNewTemplate(prev => ({ ...prev, category: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{t("auto.beskrivelse")}</Label>
                      <Textarea 
                        value={newTemplate.description}
                        onChange={e => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={t("auto.kort_beskrivelse_av_malen")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Sjekkpunkter ({newTemplate.checkpoints.length})</Label>
                      <div className="border rounded-lg p-4 space-y-3">
                        {newTemplate.checkpoints.map((cp, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <span className="flex-1 text-sm">{cp.text}</span>
                            <Badge variant="outline">{cp.type}</Badge>
                            {cp.required && <Badge>{t("auto.paakrevd")}</Badge>}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteCheckpoint(idx)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        
                        <div className="flex gap-2 items-end pt-2 border-t">
                          <div className="flex-1">
                            <Input 
                              value={newCheckpoint.text}
                              onChange={e => setNewCheckpoint(prev => ({ ...prev, text: e.target.value }))}
                              placeholder={t("auto.nytt_sjekkpunkt")}
                            />
                          </div>
                          <Select 
                            value={newCheckpoint.type}
                            onValueChange={v => setNewCheckpoint(prev => ({ ...prev, type: v }))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yesno">{t("auto.ja_nei")}</SelectItem>
                              <SelectItem value="text">{t("auto.tekst")}</SelectItem>
                              <SelectItem value="number">{t("auto.tall")}</SelectItem>
                              <SelectItem value="photo">{t("auto.bilde")}</SelectItem>
                              <SelectItem value="signature">{t("auto.signatur")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={newCheckpoint.required}
                              onCheckedChange={v => setNewCheckpoint(prev => ({ ...prev, required: v }))}
                            />
                            <span className="text-xs">{t("auto.paakrevd")}</span>
                          </div>
                          <Button onClick={handleAddCheckpoint} size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsNewTemplateOpen(false)}>
                        {t("auto.avbryt")}
                      </Button>
                      <Button onClick={handleCreateTemplate}>
                        {t("auto.opprett_mal")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {templatesLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t("auto.laster_maler")}</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map(template => (
                  <Card key={template.id} className="relative">
                    {template.is_system_template && (
                      <Badge className="absolute top-2 right-2" variant="secondary">{t("auto.system")}</Badge>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{template.template_name}</CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="mr-2">
                          {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                        </Badge>
                        {(template.checkpoints as any[])?.length || 0} punkter
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {template.description || "Ingen beskrivelse"}
                      </p>
                      {!template.is_system_template && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Edit className="h-3 w-3" /> {t("auto.rediger")}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1 text-destructive"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-3 w-3" /> {t("auto.slett")}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Dokumentbank Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold">{t("auto.dokumentbank")}</h2>
                <p className="text-sm text-muted-foreground">
                  {documents.length} dokumenter tilgjengelig for nedlasting
                </p>
              </div>
              <Dialog open={isUploadDocOpen} onOpenChange={setIsUploadDocOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Upload className="h-4 w-4" />
                    Last opp dokument
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("auto.last_opp_nytt_dokument")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t("auto.fil_2")}</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        {uploadFile ? (
                          <div className="space-y-2">
                            <FileText className="h-10 w-10 mx-auto text-primary" />
                            <p className="font-medium">{uploadFile.name}</p>
                            <p className="text-sm text-muted-foreground">{formatFileSize(uploadFile.size, "Ukjent størrelse")}</p>
                            <Button variant="outline" size="sm" onClick={() => setUploadFile(null)}>
                              {t("auto.fjern")}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">{t("auto.klikk_for_aa_velge_fil")}</p>
                            <p className="text-xs text-muted-foreground">PDF, Word, bilder (maks 50MB)</p>
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setUploadFile(e.target.files[0]);
                                }
                              }}
                            />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                              {t("auto.velg_fil")}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("auto.tittel_2")}</Label>
                      <Input
                        value={uploadData.title}
                        onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder={t("auto.f_eks_betongstoep_sjekkliste")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("auto.kategori")}</Label>
                      <Select
                        value={uploadData.category}
                        onValueChange={(v) => setUploadData(prev => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("auto.beskrivelse")}</Label>
                      <Textarea
                        value={uploadData.description}
                        onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={t("auto.kort_beskrivelse_2")}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsUploadDocOpen(false)}>
                        {t("auto.avbryt")}
                      </Button>
                      <Button onClick={handleUploadDocument} disabled={isUploading}>
                        {isUploading ? "Laster opp..." : "Last opp"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {documentsLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t("auto.laster_dokumenter")}</div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("auto.ingen_dokumenter_lastet_opp_ennaa")}</p>
                  <p className="text-sm">{t("auto.last_opp_pdf_word_filer_som_kan_brukes_s")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.map(doc => (
                  <Card key={doc.id} className="relative">
                    <Badge className="absolute top-2 right-2" variant="outline">
                      {DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                    </Badge>
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        {getFileIcon(doc.file_type)}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{doc.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {doc.file_name} • {formatFileSize(doc.file_size, "Ukjent størrelse")}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 flex-1"
                          onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                        >
                          <Eye className="h-3 w-3" /> Vis
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 flex-1"
                          onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                        >
                          <Download className="h-3 w-3" /> Last ned
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteDocument(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Innstillinger Tab */}
          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-xl font-semibold">{t("auto.firma_innstillinger")}</h2>
            
            {settingsLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t("auto.laster_innstillinger")}</div>
            ) : (
              <div className="grid gap-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("auto.generelt")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Standard frist (dager)</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("auto.antall_dager_til_frist_naar_ny_sjekklist")}
                        </p>
                      </div>
                      <Input 
                        type="number"
                        className="w-24"
                        value={settings?.default_deadline_days || 7}
                        onChange={e => handleSaveSettings("default_deadline_days", parseInt(e.target.value))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("auto.varsler")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{t("auto.e_postvarsler")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("auto.send_automatiske_e_postvarsler_ved_frist")}
                        </p>
                      </div>
                      <Switch 
                        checked={settings?.email_notifications_enabled ?? true}
                        onCheckedChange={v => handleSaveSettings("email_notifications_enabled", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Tillat stempling utenfor prosjektområdet</Label>
                        <p className="text-sm text-muted-foreground">
                          Ansatte kan starte/stoppe arbeidstid utenfor geogjerdet, men må skrive en begrunnelse.
                          Slås dette av, blokkeres registrering utenfor området.
                        </p>
                      </div>
                      <Switch
                        checked={(settings as any)?.geofence_allow_outside ?? true}
                        onCheckedChange={v => handleSaveSettings("geofence_allow_outside" as any, v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{t("auto.ukentlig_ks_rapport")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("auto.send_ukentlig_statusrapport_til_prosjekt")}
                        </p>
                      </div>
                      <Switch 
                        checked={settings?.weekly_report_enabled ?? true}
                        onCheckedChange={v => handleSaveSettings("weekly_report_enabled", v)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("auto.branding")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t("auto.firma_logo")}</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("auto.vises_paa_alle_genererte_rapporter_og_pd")}
                      </p>
                      <Button variant="outline" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Last opp logo
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("auto.aksentfarge")}</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color"
                          className="w-16 h-10 p-1"
                          value={settings?.accent_color || "#5B6BFF"}
                          onChange={e => handleSaveSettings("accent_color", e.target.value)}
                        />
                        <Input 
                          value={settings?.accent_color || "#5B6BFF"}
                          onChange={e => handleSaveSettings("accent_color", e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
