import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Calendar,
  User,
  MapPin,
  Trash2,
  Camera,
  X,
  Eye,
  FileDown,
  FileWarning,
  Shield,
  Loader2,
  FileText,
  Sparkles
} from "lucide-react";
import { jevAssist } from "@/lib/jevAssist";
import { useKsModule2Avvik, KsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { downloadKsModule2AvvikPdf, downloadKsModule2AvvikListPdf } from "@/utils/ksModule2AvvikPdf";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";
import { t } from "@/i18n/t";

const KS_CATEGORIES = [
  { value: "kvalitet", label: t("auto.kvalitetsavvik") },
  { value: "ks", label: t("auto.ks_avvik") },
  { value: "tegning", label: t("auto.tegningsavvik") },
  { value: "material", label: t("auto.materialavvik") },
  { value: "annet", label: t("auto.annet") },
];

const HMS_CATEGORIES = [
  { value: "Personlig verneutstyr", label: t("auto.personlig_verneutstyr") },
  { value: "Fallsikring", label: t("auto.fallsikring") },
  { value: "Orden og ryddighet", label: t("auto.orden_og_ryddighet") },
  { value: "Brannvern", label: t("auto.brannvern") },
  { value: "Elektrisk sikkerhet", label: t("auto.elektrisk_sikkerhet") },
  { value: "Kjemikalier og farlige stoffer", label: t("auto.kjemikalier_og_farlige_stoffer") },
  { value: "Maskin og utstyr", label: t("auto.maskin_og_utstyr") },
  { value: "Ergonomi", label: t("auto.ergonomi") },
  { value: "Støy og vibrasjoner", label: t("auto.stoey_og_vibrasjoner") },
  { value: "Annet HMS", label: t("auto.annet_hms") },
];

const HMS_CATEGORY_VALUES = HMS_CATEGORIES.map(c => c.value);

const SEVERITIES = [
  { value: "low", label: t("auto.lav"), color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "medium", label: t("auto.medium"), color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "high", label: t("auto.hoey"), color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "critical", label: t("auto.kritisk"), color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

const STATUSES = [
  { value: "open", label: t("auto.aapen"), icon: AlertTriangle, color: "text-yellow-600" },
  { value: "in_progress", label: t("auto.under_arbeid"), icon: Clock, color: "text-blue-600" },
  { value: "closed", label: t("auto.lukket"), icon: CheckCircle2, color: "text-green-600" },
];

export default function Ks2AvvikIntegrated() {
  const { projectId } = useParams();
  const { profile, company } = useAuth();
  const { avvikList, isLoading, createAvvik, updateAvvik, deleteAvvik, closeAvvik, isCreating, isUpdating } = useKsModule2Avvik(projectId || null);
  
  const [avvikType, setAvvikType] = useState<"ks" | "hms">("ks");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [selectedAvvik, setSelectedAvvik] = useState<KsModule2Avvik | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<{ path: string; previewUrl: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<KsModule2Project | null>(null);
  const [viewAvvikId, setViewAvvikId] = useState<string | null>(null);
  const viewAvvik = viewAvvikId ? avvikList.find((a) => a.id === viewAvvikId) ?? null : null;
  const setViewAvvik = (a: KsModule2Avvik | null) => setViewAvvikId(a?.id ?? null);
  const [viewPhotoUrls, setViewPhotoUrls] = useState<string[]>([]);
  const [closingAvvik, setClosingAvvik] = useState<KsModule2Avvik | null>(null);
  const [closeComment, setCloseComment] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      supabase
        .from("ks_module2_projects")
        .select("*")
        .eq("id", projectId)
        .single()
        .then(({ data }) => {
          if (data) setProject(data as KsModule2Project);
        });
    }
  }, [projectId]);

  // Resolve stored photo paths to signed URLs when opening the view dialog.
  // Legacy records may already contain a full URL — pass those through.
  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (!viewAvvik?.photo_paths || viewAvvik.photo_paths.length === 0) {
        setViewPhotoUrls([]);
        return;
      }
      const urls = await Promise.all(
        viewAvvik.photo_paths.map(async (p) => {
          if (/^https?:\/\//i.test(p)) return p;
          const { data, error } = await supabase.storage
            .from('ks-module2-avvik-photos')
            .createSignedUrl(p, 3600);
          if (error || !data) return '';
          return data.signedUrl;
        })
      );
      if (!cancelled) setViewPhotoUrls(urls.filter(Boolean));
    }
    resolve();
    return () => { cancelled = true; };
  }, [viewAvvikId, JSON.stringify(viewAvvik?.photo_paths ?? [])]);
  
  const [newAvvik, setNewAvvik] = useState({
    title: "",
    description: "",
    category: "kvalitet",
    severity: "medium",
    location: "",
    deadline: "",
    responsible_name: "",
    corrective_action: "",
    root_cause: "",
  });

  // Filter avvik based on type (KS or HMS)
  const ksAvvik = avvikList.filter(a => !HMS_CATEGORY_VALUES.includes(a.category));
  const hmsAvvik = avvikList.filter(a => HMS_CATEGORY_VALUES.includes(a.category));
  const currentAvvikList = avvikType === "ks" ? ksAvvik : hmsAvvik;

  const filteredAvvik = currentAvvikList.filter(avvik => {
    const matchesSearch = avvik.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      avvik.avvik_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || avvik.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openCount = currentAvvikList.filter(a => a.status === "open").length;
  const inProgressCount = currentAvvikList.filter(a => a.status === "in_progress").length;
  const closedCount = currentAvvikList.filter(a => a.status === "closed").length;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingPhotos(true);
    const uploaded: { path: string; previewUrl: string }[] = [];
    
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('ks-module2-avvik-photos')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('ks-module2-avvik-photos')
          .createSignedUrl(fileName, 3600);
          
        if (signedUrlError) throw signedUrlError;
        uploaded.push({ path: fileName, previewUrl: signedUrlData.signedUrl });
      }
      
      setPendingPhotos(prev => [...prev, ...uploaded]);
      toast.success(`${files.length} bilde(r) lastet opp`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Kunne ikke laste opp bilder');
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePendingPhoto = (index: number) => {
    setPendingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateAvvik = () => {
    if (!newAvvik.title || !projectId) return;
    
    createAvvik({
      project_id: projectId,
      title: newAvvik.title,
      description: newAvvik.description || null,
      category: newAvvik.category,
      severity: newAvvik.severity,
      status: "open",
      location: newAvvik.location || null,
      discovered_date: new Date().toISOString().split("T")[0],
      deadline: newAvvik.deadline || null,
      responsible_name: newAvvik.responsible_name || null,
      responsible_user_id: null,
      reported_by_name: profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile?.email || "Ukjent",
      root_cause: newAvvik.root_cause || null,
      corrective_action: newAvvik.corrective_action || null,
      preventive_action: null,
      photo_paths: pendingPhotos.length > 0 ? pendingPhotos.map(p => p.path) : null,
    }, {
      onSuccess: () => {
        setNewAvvik({ title: "", description: "", category: avvikType === "ks" ? "kvalitet" : "Personlig verneutstyr", severity: "medium", location: "", deadline: "", responsible_name: "", corrective_action: "", root_cause: "" });
        setPendingPhotos([]);
        setIsNewDialogOpen(false);
      }
    });
  };

  const handleCloseAvvik = (avvik: KsModule2Avvik) => {
    setClosingAvvik(avvik);
    setCloseComment("");
  };

  const handleConfirmClose = async () => {
    if (!closingAvvik) return;
    if (!closeComment.trim()) {
      toast.error(t("auto.skriv_en_kort_kommentar_om_hvordan_avvik"));
      return;
    }
    setIsClosing(true);
    try {
      const closedByName = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.email || "Ukjent";
      const existing = closingAvvik.corrective_action || "";
      const newAction = existing
        ? `${existing}\n\n🔒 Lukkekommentar (${closedByName}): ${closeComment.trim()}`
        : `🔒 Lukkekommentar (${closedByName}): ${closeComment.trim()}`;
      await new Promise<void>((resolve, reject) => {
        updateAvvik(
          { id: closingAvvik.id, corrective_action: newAction },
          { onSuccess: () => resolve(), onError: (e) => reject(e) } as any
        );
      });
      closeAvvik({ id: closingAvvik.id, closedByName });
      setClosingAvvik(null);
      setCloseComment("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsClosing(false);
    }
  };

  const handleDeleteAvvik = (id: string) => {
    if (confirm("Er du sikker på at du vil slette dette avviket?")) {
      deleteAvvik(id);
    }
  };


  const handleDownloadAvvikPdf = async (avvik: KsModule2Avvik) => {
    if (!project || !company) {
      toast.error(t("auto.kan_ikke_lage_pdf"), { description: t("auto.mangler_prosjekt_eller_bedriftsdata") });
      return;
    }
    setPdfLoadingId(avvik.id);
    const loadingToast = toast.loading(`Genererer PDF for ${avvik.avvik_number}…`, {
      description: (avvik.photo_paths?.length ?? 0) > 0
        ? `Henter ${avvik.photo_paths!.length} bilde(r) fra lager…`
        : "Bygger dokument…",
    });
    try {
      const { failedPhotos } = await downloadKsModule2AvvikPdf({
        avvik,
        project,
        company: {
          name: company.name,
          address: company.address,
          postal_code: company.postal_code,
          city: company.city,
          org_number: company.org_number,
          phone: company.phone,
          email: company.email,
        },
      });
      toast.dismiss(loadingToast);
      if (failedPhotos.length > 0) {
        const signCount = failedPhotos.filter(f => f.reason === "sign").length;
        const fetchCount = failedPhotos.filter(f => f.reason === "fetch" || f.reason === "decode").length;
        const parts: string[] = [];
        if (signCount) parts.push(`${signCount} bilde-signering feilet`);
        if (fetchCount) parts.push(`${fetchCount} bilde kunne ikke lastes`);
        toast.warning(t("auto.pdf_lastet_ned_med_advarsler"), {
          description: `${parts.join(" · ")}. Bildene mangler i PDF-en.`,
          action: { label: t("auto.proev_igjen"), onClick: () => handleDownloadAvvikPdf(avvik) },
          duration: 10000,
        });
      } else {
        toast.success(t("auto.pdf_lastet_ned"));
      }
    } catch (e: any) {
      console.error("PDF generation failed:", e);
      toast.dismiss(loadingToast);
      toast.error(t("auto.kunne_ikke_lage_pdf"), {
        description: e?.message || "Ukjent feil under generering.",
        action: { label: t("auto.proev_igjen"), onClick: () => handleDownloadAvvikPdf(avvik) },
        duration: 10000,
      });
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handleDownloadAllAvvikPdf = () => {
    if (!project || !company || currentAvvikList.length === 0) return;
    downloadKsModule2AvvikListPdf(
      currentAvvikList,
      project,
      {
        name: company.name,
        address: company.address,
        postal_code: company.postal_code,
        city: company.city,
        org_number: company.org_number,
        phone: company.phone,
        email: company.email,
      }
    );
    toast.success(t("auto.pdf_lastet_ned"));
  };

  const getSeverityBadge = (severity: string) => {
    const sev = SEVERITIES.find(s => s.value === severity);
    return <Badge className={sev?.color || ""}>{sev?.label || severity}</Badge>;
  };

  const getStatusInfo = (status: string) => {
    return STATUSES.find(s => s.value === status) || STATUSES[0];
  };

  const openNewDialog = () => {
    // Set default category based on current type
    setNewAvvik(prev => ({
      ...prev,
      category: avvikType === "ks" ? "kvalitet" : "Personlig verneutstyr"
    }));
    setIsNewDialogOpen(true);
  };

  const currentCategories = avvikType === "ks" ? KS_CATEGORIES : HMS_CATEGORIES;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("auto.avviksregister")}</h1>
          <p className="text-muted-foreground">
            {t("auto.registrer_og_foelg_opp_avvik_i_prosjekte")}
          </p>
        </div>
        <div className="flex gap-2">
          {currentAvvikList.length > 0 && (
            <Button variant="outline" onClick={handleDownloadAllAvvikPdf}>
              <FileDown className="h-4 w-4 mr-2" />
              Eksporter alle
            </Button>
          )}
          <Button onClick={openNewDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("auto.nytt_avvik")}
          </Button>
        </div>
      </div>

      {/* Type Tabs - KS vs HMS */}
      <Tabs value={avvikType} onValueChange={(v) => setAvvikType(v as "ks" | "hms")} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ks" className="gap-2">
            <FileWarning className="h-4 w-4" />
            KS-avvik ({ksAvvik.length})
          </TabsTrigger>
          <TabsTrigger value="hms" className="gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            HMS-avvik ({hmsAvvik.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ks" className="mt-0 space-y-6">
          <AvvikContent
            avvikList={filteredAvvik}
            openCount={openCount}
            inProgressCount={inProgressCount}
            closedCount={closedCount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            getSeverityBadge={getSeverityBadge}
            getStatusInfo={getStatusInfo}
            handleCloseAvvik={handleCloseAvvik}
            handleDeleteAvvik={handleDeleteAvvik}
            handleDownloadAvvikPdf={handleDownloadAvvikPdf}
            pdfLoadingId={pdfLoadingId}
            handleViewAvvik={setViewAvvik}
            project={project}
            company={company}
            accentColor="primary"
          />
        </TabsContent>

        <TabsContent value="hms" className="mt-0 space-y-6">
          <AvvikContent
            avvikList={filteredAvvik}
            openCount={openCount}
            inProgressCount={inProgressCount}
            closedCount={closedCount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            getSeverityBadge={getSeverityBadge}
            getStatusInfo={getStatusInfo}
            handleCloseAvvik={handleCloseAvvik}
            handleDeleteAvvik={handleDeleteAvvik}
            handleDownloadAvvikPdf={handleDownloadAvvikPdf}
            pdfLoadingId={pdfLoadingId}
            handleViewAvvik={setViewAvvik}
            project={project}
            company={company}
            accentColor="emerald"
          />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={(open) => {
        setIsNewDialogOpen(open);
        if (!open) {
          setPendingPhotos([]);
          setNewAvvik({ title: "", description: "", category: avvikType === "ks" ? "kvalitet" : "Personlig verneutstyr", severity: "medium", location: "", deadline: "", responsible_name: "", corrective_action: "", root_cause: "" });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {avvikType === "ks" ? (
                <><FileWarning className="h-5 w-5" /> Registrer nytt KS-avvik</>
              ) : (
                <><Shield className="h-5 w-5 text-emerald-500" /> Registrer nytt HMS-avvik</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("auto.tittel_2")}</Label>
              <Input
                value={newAvvik.title}
                onChange={(e) => setNewAvvik(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t("auto.kort_beskrivelse_av_avviket")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("auto.kategori")}</Label>
                <Select
                  value={newAvvik.category}
                  onValueChange={(v) => setNewAvvik(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("auto.alvorlighetsgrad_3")}</Label>
                <Select
                  value={newAvvik.severity}
                  onValueChange={(v) => setNewAvvik(prev => ({ ...prev, severity: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map(sev => (
                      <SelectItem key={sev.value} value={sev.value}>{sev.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("auto.beskrivelse")}</Label>
              <Textarea
                value={newAvvik.description}
                onChange={(e) => setNewAvvik(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t("auto.detaljert_beskrivelse_av_avviket")}
                rows={3}
              />
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" /> Smart forslag
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={runSmartSeverity}
                  disabled={smartLoading || (newAvvik.title + newAvvik.description).trim().length < 8}
                >
                  {smartLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  Foreslå alvorlighet
                </Button>
              </div>
              {smartHint && <p className="text-xs text-muted-foreground">{smartHint}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("auto.lokasjon")}</Label>
                <Input
                  value={newAvvik.location}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, location: e.target.value }))}
                  placeholder={t("auto.hvor_ble_det_oppdaget")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("auto.frist_2")}</Label>
                <Input
                  type="date"
                  value={newAvvik.deadline}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("auto.ansvarlig_2")}</Label>
              <Input
                value={newAvvik.responsible_name}
                onChange={(e) => setNewAvvik(prev => ({ ...prev, responsible_name: e.target.value }))}
                placeholder={t("auto.hvem_er_ansvarlig_for_aa_lukke_avviket")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("auto.aarsak")}</Label>
              <Textarea
                value={newAvvik.root_cause}
                onChange={(e) => setNewAvvik(prev => ({ ...prev, root_cause: e.target.value }))}
                placeholder={t("auto.hva_er_aarsaken_til_avviket")}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("auto.korrigerende_tiltak_2")}</Label>
              <Textarea
                value={newAvvik.corrective_action}
                onChange={(e) => setNewAvvik(prev => ({ ...prev, corrective_action: e.target.value }))}
                placeholder={t("auto.hvilke_tiltak_skal_gjennomfoeres")}
                rows={2}
              />
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-2">
              <Label>{t("auto.bilder")}</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <div className="flex flex-col items-center gap-2">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhotos}
                  >
                    {uploadingPhotos ? "Laster opp..." : "Last opp bilder"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t("auto.du_kan_laste_opp_flere_bilder_samtidig")}
                  </p>
                </div>
                
                {pendingPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {pendingPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.previewUrl}
                          alt={`Bilde ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removePendingPhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button 
              onClick={handleCreateAvvik} 
              disabled={isCreating || !newAvvik.title}
              className={avvikType === "hms" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {isCreating ? "Oppretter..." : "Opprett avvik"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={!!viewAvvik} onOpenChange={(o) => !o && setViewAvvik(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewAvvik?.avvik_number} — {viewAvvik?.title}</DialogTitle>
          </DialogHeader>
          {viewAvvik && (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex flex-wrap gap-2">
                {getSeverityBadge(viewAvvik.severity)}
                <Badge variant="outline">{viewAvvik.category}</Badge>
                <Badge>{getStatusInfo(viewAvvik.status).label}</Badge>
              </div>
              {viewAvvik.description && (
                <div><Label className="text-xs">{t("auto.beskrivelse")}</Label><p className="whitespace-pre-wrap">{viewAvvik.description}</p></div>
              )}
              {viewAvvik.location && (
                <div><Label className="text-xs">{t("auto.lokasjon")}</Label><p>{viewAvvik.location}</p></div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">{t("auto.oppdaget")}</Label><p>{format(new Date(viewAvvik.discovered_date), "dd.MM.yyyy")}</p></div>
                {viewAvvik.deadline && <div><Label className="text-xs">{t("auto.frist_2")}</Label><p>{format(new Date(viewAvvik.deadline), "dd.MM.yyyy")}</p></div>}
                <div><Label className="text-xs">{t("auto.rapportert_av_2")}</Label><p>{viewAvvik.reported_by_name}</p></div>
                {viewAvvik.responsible_name && <div><Label className="text-xs">{t("auto.ansvarlig_2")}</Label><p>{viewAvvik.responsible_name}</p></div>}
              </div>
              {viewAvvik.root_cause && (
                <div><Label className="text-xs">{t("auto.aarsak")}</Label><p className="whitespace-pre-wrap">{viewAvvik.root_cause}</p></div>
              )}
              {viewAvvik.corrective_action && (
                <div><Label className="text-xs">{t("auto.korrigerende_tiltak_kommentar")}</Label><p className="whitespace-pre-wrap">{viewAvvik.corrective_action}</p></div>
              )}
              {viewAvvik.closed_at && (
                <div><Label className="text-xs">{t("auto.lukket")}</Label><p>{format(new Date(viewAvvik.closed_at), "dd.MM.yyyy HH:mm")} av {viewAvvik.closed_by_name || "Ukjent"}</p></div>
              )}
              {viewAvvik.photo_paths && viewAvvik.photo_paths.length > 0 && (
                <div>
                  <Label className="text-xs">Bilder ({viewAvvik.photo_paths.length})</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {viewPhotoUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Bilde ${i + 1}`} className="w-full h-32 object-cover rounded-md border" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Close With Comment Dialog */}
      <Dialog open={!!closingAvvik} onOpenChange={(o) => !o && setClosingAvvik(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lukk avvik {closingAvvik?.avvik_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>{t("auto.hvordan_ble_avviket_loest")}</Label>
            <Textarea
              value={closeComment}
              onChange={(e) => setCloseComment(e.target.value)}
              rows={4}
              placeholder={t("auto.kort_beskrivelse_av_hvordan_avviket_ble_")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosingAvvik(null)} disabled={isClosing}>{t("auto.avbryt")}</Button>
            <Button onClick={handleConfirmClose} disabled={isClosing || !closeComment.trim()}>
              {isClosing ? "Lukker..." : "Lukk avvik"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted component for avvik list content
function AvvikContent({
  avvikList,
  openCount,
  inProgressCount,
  closedCount,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  getSeverityBadge,
  getStatusInfo,
  handleCloseAvvik,
  handleDeleteAvvik,
  handleDownloadAvvikPdf,
  pdfLoadingId,
  handleViewAvvik,
  project,
  company,
  accentColor,
}: {
  avvikList: KsModule2Avvik[];
  openCount: number;
  inProgressCount: number;
  closedCount: number;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  getSeverityBadge: (s: string) => JSX.Element;
  getStatusInfo: (s: string) => { value: string; label: string; icon: any; color: string };
  handleCloseAvvik: (a: KsModule2Avvik) => void;
  handleDeleteAvvik: (id: string) => void;
  handleDownloadAvvikPdf: (a: KsModule2Avvik) => void;
  pdfLoadingId: string | null;
  handleViewAvvik: (a: KsModule2Avvik) => void;
  project: KsModule2Project | null;
  company: any;
  accentColor: "primary" | "emerald";
}) {
  const bgColors = accentColor === "emerald" 
    ? { open: "bg-red-100", progress: "bg-amber-100", closed: "bg-emerald-100" }
    : { open: "bg-yellow-100", progress: "bg-blue-100", closed: "bg-green-100" };
  const iconColors = accentColor === "emerald"
    ? { open: "text-red-600", progress: "text-amber-600", closed: "text-emerald-600" }
    : { open: "text-yellow-600", progress: "text-blue-600", closed: "text-green-600" };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${bgColors.open}`}>
                <AlertTriangle className={`h-5 w-5 ${iconColors.open}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-sm text-muted-foreground">{t("auto.aapne")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${bgColors.progress}`}>
                <Clock className={`h-5 w-5 ${iconColors.progress}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-sm text-muted-foreground">{t("auto.under_arbeid")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${bgColors.closed}`}>
                <CheckCircle2 className={`h-5 w-5 ${iconColors.closed}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{closedCount}</p>
                <p className="text-sm text-muted-foreground">{t("auto.lukket")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("auto.soek_etter_avvik")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("auto.alle_statuser")}</SelectItem>
            <SelectItem value="open">{t("auto.aapne")}</SelectItem>
            <SelectItem value="in_progress">{t("auto.under_arbeid")}</SelectItem>
            <SelectItem value="closed">{t("auto.lukket")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Avvik List */}
      {avvikList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("auto.ingen_avvik_funnet")}</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== "all" 
                ? "Prøv å justere søket eller filteret"
                : "Registrer ditt første avvik ved å klikke på knappen over"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {avvikList.map((avvik) => {
            const statusInfo = getStatusInfo(avvik.status);
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={avvik.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-mono text-muted-foreground">{avvik.avvik_number}</span>
                        {getSeverityBadge(avvik.severity)}
                        <Badge variant="outline">{avvik.category}</Badge>
                      </div>
                      <CardTitle className="text-lg">{avvik.title}</CardTitle>
                      {avvik.location && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {avvik.location}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                      <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {avvik.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{avvik.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(avvik.discovered_date), "dd.MM.yyyy")}</span>
                    </div>
                    {avvik.responsible_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{avvik.responsible_name}</span>
                      </div>
                    )}
                    {avvik.deadline && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Frist: {format(new Date(avvik.deadline), "dd.MM.yyyy")}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewAvvik(avvik)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Vis
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadAvvikPdf(avvik)}
                      disabled={pdfLoadingId === avvik.id}
                      aria-busy={pdfLoadingId === avvik.id}
                    >
                      {pdfLoadingId === avvik.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4 mr-1" />
                      )}
                      {pdfLoadingId === avvik.id ? "Genererer…" : "PDF"}
                    </Button>
                    {avvik.status !== "closed" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCloseAvvik(avvik)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Lukk
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteAvvik(avvik.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t("auto.slett")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
