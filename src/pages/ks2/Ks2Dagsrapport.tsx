import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { SmartDailyReportDeviations } from "@/components/ks2/SmartDailyReportDeviations";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Plus,
  FileText,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  Users,
  Wrench,
  Package,
  AlertTriangle,
  Shield,
  TrendingUp,
  Camera,
  Send,
  Mail,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Download,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TimeInput24 } from "@/components/ui/time-input-24";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useKsDailyReports, CreateDailyReport, DailyReport } from "@/hooks/useKsDailyReports";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmailSendDialog } from "@/components/shared/EmailSendDialog";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";
import { DailyReportPhotoUploader, DailyReportPhoto } from "@/components/ks2/DailyReportPhotoUploader";
import { generateDailyReportPdf, generateDailyReportPdfBase64, calculateWorkDuration } from "@/utils/ksDailyReportPdf";
import { DailyReportPhotoGallery } from "@/components/ks2/DailyReportPhotoGallery";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { t } from "@/i18n/t";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftRestoreBanner } from "@/components/shared/DraftRestoreBanner";
import { getLocalDateString } from "@/lib/dateUtils";

const weatherIcons: Record<string, React.ReactNode> = {
  sol: <Sun className="h-4 w-4 text-amber-500" />,
  overskyet: <Cloud className="h-4 w-4 text-gray-500" />,
  regn: <CloudRain className="h-4 w-4 text-blue-500" />,
  snø: <Snowflake className="h-4 w-4 text-cyan-500" />,
  vind: <Wind className="h-4 w-4 text-teal-500" />,
};

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  draft: { label: t("auto.utkast"), className: "bg-warning text-warning-foreground border-transparent hover:bg-warning", icon: <Clock className="h-3 w-3" /> },
  submitted: { label: t("auto.innsendt"), className: "bg-success text-success-foreground border-transparent hover:bg-success", icon: <CheckCircle2 className="h-3 w-3" /> },
};

const PHOTO_BUCKET = "daily-report-photos";

type ReportsApi = ReturnType<typeof useKsDailyReports>;
type DbPayload = Partial<CreateDailyReport> & { submitted_at?: string | null };

/** Tomme felt sendes som null, slik at tømte felt også lagres. */
function toDbPayload(data: CreateDailyReport): DbPayload {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) out[k] = v === undefined || v === "" ? null : v;
  return out as DbPayload;
}

function photoStoragePaths(list: DailyReportPhoto[]): string[] {
  return list.flatMap((p) => [p.path, p.thumb_path].filter(Boolean) as string[]);
}

function reportToInitial(r: DailyReport): CreateDailyReport {
  return {
    project_id: r.project_id,
    report_date: r.report_date,
    weather_conditions: r.weather_conditions || undefined,
    temperature_celsius: r.temperature_celsius ?? undefined,
    wind_conditions: r.wind_conditions || undefined,
    precipitation: r.precipitation || undefined,
    own_crew_count: r.own_crew_count,
    total_crew_count: r.total_crew_count,
    work_description: r.work_description || undefined,
    work_areas: r.work_areas || undefined,
    plan_tomorrow: r.plan_tomorrow || undefined,
    work_start_time: r.work_start_time || undefined,
    work_end_time: r.work_end_time || undefined,
    equipment_used: r.equipment_used || [],
    materials_received: r.materials_received || [],
    progress_description: r.progress_description || undefined,
    progress_percentage: r.progress_percentage ?? 0,
    on_schedule: r.on_schedule,
    delay_reason: r.delay_reason || undefined,
    quality_controls: r.quality_controls || [],
    hms_incidents: r.hms_incidents || [],
    hms_observations: r.hms_observations || undefined,
    safety_meeting_held: r.safety_meeting_held,
    subcontractor_attendance: r.subcontractor_attendance || [],
    deviations_today: r.deviations_today || [],
    photos: r.photos || [],
    notes: r.notes || undefined,
    status: r.status,
  };
}

/** "1 bilde" / "N bilder" (0 og 2+ = bilder). */
export function bilderLabel(n: number): string {
  return n === 1 ? "1 bilde" : `${n} bilder`;
}

function DailyReportForm({
  initialReport,
  onClose,
  closeRef,
  createReport,
  updateReport,
  onSaved,
  pendingSaveRef,
}: {
  initialReport: DailyReport | null;
  onClose: () => void;
  closeRef: React.MutableRefObject<(() => void) | null>;
  createReport: ReportsApi["createReport"];
  updateReport: ReportsApi["updateReport"];
  onSaved?: (r: DailyReport) => void;
  pendingSaveRef?: React.MutableRefObject<Promise<void> | null>;
}) {
  const { projectId } = useParams();
  const initialData = initialReport ? reportToInitial(initialReport) : undefined;
  const [date, setDate] = useState<Date>(initialData?.report_date ? new Date(initialData.report_date) : new Date());
  const [weather, setWeather] = useState(initialData?.weather_conditions || "");
  const [temp, setTemp] = useState(initialData?.temperature_celsius?.toString() || "");
  const [windCond, setWindCond] = useState(initialData?.wind_conditions || "");
  const [precip, setPrecip] = useState(initialData?.precipitation || "");
  const [ownCrew, setOwnCrew] = useState(initialData?.own_crew_count?.toString() || "0");
  const [workDesc, setWorkDesc] = useState(initialData?.work_description || "");
  const [workAreas, setWorkAreas] = useState(initialData?.work_areas || "");
  const [planTomorrow, setPlanTomorrow] = useState(initialData?.plan_tomorrow || "");
  const [workStartTime, setWorkStartTime] = useState(initialData?.work_start_time || "");
  const [workEndTime, setWorkEndTime] = useState(initialData?.work_end_time || "");
  const [equipmentText, setEquipmentText] = useState(
    (initialData?.equipment_used || []).map((e: any) => e.name || e).join(", ")
  );
  const [materialsText, setMaterialsText] = useState(
    (initialData?.materials_received || []).map((m: any) => m.name || m).join(", ")
  );
  const [progressDesc, setProgressDesc] = useState(initialData?.progress_description || "");
  const [progressPct, setProgressPct] = useState(initialData?.progress_percentage || 0);
  const [onSchedule, setOnSchedule] = useState(initialData?.on_schedule ?? true);
  const [delayReason, setDelayReason] = useState(initialData?.delay_reason || "");
  const [hmsObs, setHmsObs] = useState(initialData?.hms_observations || "");
  const [safetyMeeting, setSafetyMeeting] = useState(initialData?.safety_meeting_held || false);
  const [qualityText, setQualityText] = useState(
    (initialData?.quality_controls || []).map((q: any) => q.description || q).join("\n")
  );
  const [hmsIncText, setHmsIncText] = useState(
    (initialData?.hms_incidents || []).map((h: any) => h.description || h).join("\n")
  );
  const [subAttText, setSubAttText] = useState(
    (initialData?.subcontractor_attendance || []).map((s: any) => `${s.name}: ${s.count} pers`).join("\n")
  );
  const [deviationsText, setDeviationsText] = useState(
    (initialData?.deviations_today || []).map((d: any) => d.description || d).join("\n")
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [photos, setPhotos] = useState<DailyReportPhoto[]>((initialData?.photos as any) || []);

  // Autolagring gjelder nye rapporter og utkast – ikke allerede innsendte.
  const isSubmittedEdit = initialReport?.status === "submitted";
  const autosave = !isSubmittedEdit;
  const [reportId, setReportId] = useState<string | null>(initialReport?.id ?? null);
  const reportIdRef = useRef<string | null>(initialReport?.id ?? null);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const sessionUploadedRef = useRef<Set<string>>(new Set());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const queuedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoSaveRef = useRef(false);
  const lastSavedSigRef = useRef<string | null>(null);

  // Universal utkast: tar vare på feltene hvis dialogen lukkes før lagring (kun nye rapporter)
  const isDirty = !!weather || !!temp || !!windCond || !!precip || ownCrew !== "0" ||
    !!workDesc || !!workAreas || !!planTomorrow || !!workStartTime || !!workEndTime || !!equipmentText ||
    !!materialsText || !!progressDesc || progressPct !== 0 || !onSchedule || !!delayReason ||
    !!hmsObs || safetyMeeting || !!qualityText || !!hmsIncText || !!subAttText || !!deviationsText || !!notes;
  const draftData = {
    date: format(date, "yyyy-MM-dd"), weather, temp, windCond, precip, ownCrew,
    workDesc, workAreas, planTomorrow, workStartTime, workEndTime, equipmentText, materialsText,
    progressDesc, progressPct, onSchedule, delayReason, hmsObs, safetyMeeting,
    qualityText, hmsIncText, subAttText, deviationsText, notes,
  };
  const { draft, clear: clearDraft, dismiss: dismissDraft } = useFormDraft(
    `ks-dagsrapport:${projectId}`,
    draftData,
    { enabled: !initialReport && !reportId && isDirty },
  );

  const restoreDraft = () => {
    if (!draft) return;
    const d = draft.data as typeof draftData;
    try { setDate(new Date(d.date)); } catch { setDate(new Date()); }
    setWeather(d.weather || "");
    setTemp(d.temp || "");
    setWindCond(d.windCond || "");
    setPrecip(d.precip || "");
    setOwnCrew(d.ownCrew ?? "0");
    setWorkDesc(d.workDesc || "");
    setWorkAreas(d.workAreas || "");
    setPlanTomorrow(d.planTomorrow || "");
    setWorkStartTime(d.workStartTime || "");
    setWorkEndTime(d.workEndTime || "");
    setEquipmentText(d.equipmentText || "");
    setMaterialsText(d.materialsText || "");
    setProgressDesc(d.progressDesc || "");
    setProgressPct(d.progressPct ?? 0);
    setOnSchedule(d.onSchedule ?? true);
    setDelayReason(d.delayReason || "");
    setHmsObs(d.hmsObs || "");
    setSafetyMeeting(!!d.safetyMeeting);
    setQualityText(d.qualityText || "");
    setHmsIncText(d.hmsIncText || "");
    setSubAttText(d.subAttText || "");
    setDeviationsText(d.deviationsText || "");
    setNotes(d.notes || "");
    dismissDraft();
  };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    weather: true,
    crew: true,
    work: true,
    equipment: false,
    progress: false,
    quality: false,
    hms: false,
    ue: false,
    deviations: false,
    photos: true,
    notes: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const buildData = (): CreateDailyReport => ({
    project_id: projectId || null,
    report_date: format(date, "yyyy-MM-dd"),
    weather_conditions: weather || undefined,
    temperature_celsius: temp ? Number(temp) : undefined,
    wind_conditions: windCond || undefined,
    precipitation: precip || undefined,
    own_crew_count: Number(ownCrew) || 0,
    total_crew_count: Number(ownCrew) || 0,
    work_description: workDesc || undefined,
    work_areas: workAreas || undefined,
    plan_tomorrow: planTomorrow || undefined,
    work_start_time: workStartTime || undefined,
    work_end_time: workEndTime || undefined,
    equipment_used: equipmentText ? equipmentText.split(",").map((e) => ({ name: e.trim() })) : [],
    materials_received: materialsText ? materialsText.split(",").map((m) => ({ name: m.trim() })) : [],
    progress_description: progressDesc || undefined,
    progress_percentage: progressPct,
    on_schedule: onSchedule,
    delay_reason: !onSchedule ? delayReason : undefined,
    quality_controls: qualityText
      ? qualityText.split("\n").filter(Boolean).map((q) => ({ description: q.trim() }))
      : [],
    hms_incidents: hmsIncText
      ? hmsIncText.split("\n").filter(Boolean).map((h) => ({ description: h.trim() }))
      : [],
    hms_observations: hmsObs || undefined,
    safety_meeting_held: safetyMeeting,
    subcontractor_attendance: subAttText
      ? subAttText.split("\n").filter(Boolean).map((line) => {
          const [name, rest] = line.split(":");
          return { name: name?.trim(), count: parseInt(rest) || 0 };
        })
      : [],
    deviations_today: deviationsText
      ? deviationsText.split("\n").filter(Boolean).map((d) => ({ description: d.trim() }))
      : [],
    notes: notes || undefined,
    photos: photos,
  });

  const buildRef = useRef(buildData);
  buildRef.current = buildData;
  const fieldSig = JSON.stringify(buildData());
  if (lastSavedSigRef.current === null) lastSavedSigRef.current = fieldSig;

  const clearTimers = () => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
    if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null; }
  };

  /** Lagrer til samme rad; oppretter kun én gang (kallene er seriekoblet). */
  const persist = async (payload: DbPayload, silent: boolean): Promise<DailyReport> => {
    const id = reportIdRef.current;
    if (id) {
      const r = await updateReport({ id, updates: payload, silent });
      onSaved?.(r);
      return r;
    }
    const r = await createReport({ ...payload, status: payload.status ?? "draft" } as CreateDailyReport, { silent });
    reportIdRef.current = r.id;
    setReportId(r.id);
    clearDraft();
    onSaved?.(r);
    return r;
  };

  // Autolagring: sender aldri status eller submitted_at, kun feltverdier.
  const runAutosave = (): Promise<void> => {
    if (!autosave) return chainRef.current;
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
    if (queuedRef.current) return chainRef.current;
    queuedRef.current = true;
    chainRef.current = chainRef.current.then(async () => {
      queuedRef.current = false;
      const data = buildRef.current();
      const sig = JSON.stringify(data);
      if (sig === lastSavedSigRef.current && reportIdRef.current) return;
      const { status: _s, ...fields } = toDbPayload(data);
      setSaveState("saving");
      try {
        await persist(fields, true);
        lastSavedSigRef.current = sig;
        setSaveState("saved");
        setSavedAt(new Date());
      } catch (e) {
        console.error("Autolagring av dagsrapport feilet", e);
        setSaveState("error");
        if (retryRef.current) clearTimeout(retryRef.current);
        retryRef.current = setTimeout(() => { retryRef.current = null; void runAutosave(); }, 5000);
      }
    });
    return chainRef.current;
  };

  const hasContent = isDirty || photos.length > 0;
  useEffect(() => {
    if (!autosave || fieldSig === lastSavedSigRef.current) return;
    if (!reportIdRef.current && !hasContent) return;
    if (photoSaveRef.current || !reportIdRef.current) {
      photoSaveRef.current = false;
      void runAutosave();
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { debounceRef.current = null; void runAutosave(); }, 2500);
  }, [fieldSig]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimers(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhotosChange = (next: DailyReportPhoto[]) => {
    for (const p of next) {
      if (!photos.some((o) => o.path === p.path)) sessionUploadedRef.current.add(p.path);
    }
    photoSaveRef.current = true;
    setPhotos(next);
  };

  const explicitSave = async (mode: "draft" | "submit" | "update") => {
    setBusy(true);
    clearTimers();
    try {
      await chainRef.current;
      const removed = new Set(removedPaths);
      const kept = photos.filter((p) => !removed.has(p.path));
      const removedPhotos = photos.filter((p) => removed.has(p.path));
      const { status: _s, ...fields } = toDbPayload({ ...buildData(), photos: kept });
      const payload: DbPayload = { ...fields };
      if (mode === "draft") payload.status = "draft";
      if (mode === "submit") {
        payload.status = "submitted";
        payload.submitted_at = initialReport?.submitted_at || new Date().toISOString();
      }
      await persist(payload, true);
      lastSavedSigRef.current = JSON.stringify({ ...buildData(), photos: kept });
      if (removedPhotos.length) {
        const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(photoStoragePaths(removedPhotos));
        if (error) console.warn("Kunne ikke slette fjernede bilder", error);
      }
      sessionUploadedRef.current.clear();
      clearDraft();
      toast.success(mode === "draft" ? "Utkast lagret" : mode === "submit" ? "Dagsrapport sendt inn" : "Dagsrapport oppdatert");
      onClose();
    } catch (e) {
      console.error("Lagring av dagsrapport feilet", e);
      toast.error("Kunne ikke lagre dagsrapporten");
    } finally {
      setBusy(false);
    }
  };

  // Lukking (Lukk, X, klikk utenfor, Escape): lagre ventende endringer straks.
  const handleClose = () => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
    if (autosave) {
      if (fieldSig !== lastSavedSigRef.current && (reportIdRef.current || hasContent)) void runAutosave();
      // Gi ventende lagring til forelderen, så «Ny dagsrapport» kan vente på den.
      if (pendingSaveRef) pendingSaveRef.current = chainRef.current;
    } else {
      const saved = new Set(((initialReport?.photos || []) as DailyReportPhoto[]).map((p) => p.path));
      const orphans = photos.filter((p) => sessionUploadedRef.current.has(p.path) && !saved.has(p.path));
      if (orphans.length) void supabase.storage.from(PHOTO_BUCKET).remove(photoStoragePaths(orphans));
    }
    onClose();
  };
  closeRef.current = handleClose;

  const SectionHeader = ({ id, label, icon }: { id: string; label: string; icon: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full py-2 px-1 text-sm font-semibold text-foreground hover:bg-muted/50 rounded-md transition-colors"
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      {expandedSections[id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {!initialReport && !reportId && draft && !isDirty && (
        <DraftRestoreBanner savedAt={draft.savedAt} onRestore={restoreDraft} onDiscard={clearDraft} />
      )}
      {/* Date */}
      <div>
        <Label>{t("auto.dato")}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "PPP", { locale: nb })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>

      {/* Weather Section */}
      <div>
        <SectionHeader id="weather" label={t("auto.vaerforhold")} icon={<Sun className="h-4 w-4 text-amber-500" />} />
        {expandedSections.weather && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label className="text-xs">{t("auto.vaer")}</Label>
              <Select value={weather} onValueChange={setWeather}>
                <SelectTrigger><SelectValue placeholder={t("auto.velg")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sol">{t("auto.sol")}</SelectItem>
                  <SelectItem value="overskyet">{t("auto.overskyet")}</SelectItem>
                  <SelectItem value="regn">{t("auto.regn")}</SelectItem>
                  <SelectItem value="snø">{t("auto.snoe")}</SelectItem>
                  <SelectItem value="vind">{t("auto.vind")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Temperatur (°C)</Label>
              <Input type="number" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="-5" />
            </div>
            <div>
              <Label className="text-xs">{t("auto.vind_2")}</Label>
              <Input value={windCond} onChange={(e) => setWindCond(e.target.value)} placeholder={t("auto.svak_liten_kuling")} />
            </div>
            <div>
              <Label className="text-xs">{t("auto.nedboer")}</Label>
              <Input value={precip} onChange={(e) => setPrecip(e.target.value)} placeholder={t("auto.ingen_lett_regn")} />
            </div>
          </div>
        )}
      </div>

      {/* Crew Section */}
      <div>
        <SectionHeader id="crew" label={t("auto.mannskap")} icon={<Users className="h-4 w-4 text-blue-500" />} />
        {expandedSections.crew && (
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">{t("auto.egne_ansatte_paa_plass")}</Label>
              <Input type="number" value={ownCrew} onChange={(e) => setOwnCrew(e.target.value)} min="0" />
            </div>
            <div>
              <Label className="text-xs">{t("auto.ue_oppmoete_en_per_linje_firma_antall")}</Label>
              <Textarea value={subAttText} onChange={(e) => setSubAttText(e.target.value)} placeholder="Rørlegger AS: 3&#10;Elektro AS: 2" rows={3} />
            </div>
          </div>
        )}
      </div>

      {/* Work Section */}
      <div>
        <SectionHeader id="work" label={t("auto.utfoert_arbeid")} icon={<Wrench className="h-4 w-4 text-orange-500" />} />
        {expandedSections.work && (
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">{t("auto.beskrivelse_av_utfoert_arbeid")}</Label>
              <Textarea value={workDesc} onChange={(e) => setWorkDesc(e.target.value)} placeholder={t("auto.beskrivelse_av_dagens_arbeid")} rows={4} />
            </div>
            <div>
              <Label className="text-xs">Plan for i morgen</Label>
              <Textarea value={planTomorrow} onChange={(e) => setPlanTomorrow(e.target.value)} placeholder="Hva er planen for den kommende dagen?" rows={3} />
            </div>
            <div>
              <Label className="text-xs">{t("auto.arbeidsomraader")}</Label>
              <Input value={workAreas} onChange={(e) => setWorkAreas(e.target.value)} placeholder={t("auto.1_etg_tak_fasade")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("auto.tid_fra")}</Label>
                <TimeInput24 value={workStartTime} onChange={(v) => setWorkStartTime(v)} placeholder="08:00" />
              </div>
              <div>
                <Label className="text-xs">{t("auto.tid_til")}</Label>
                <TimeInput24 value={workEndTime} onChange={(v) => setWorkEndTime(v)} placeholder="16:00" />
              </div>
            </div>
            {calculateWorkDuration(workStartTime, workEndTime) && (
              <p className="text-xs text-muted-foreground -mt-1">
                Total arbeidstid: {calculateWorkDuration(workStartTime, workEndTime)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Equipment & Materials */}
      <div>
        <SectionHeader id="equipment" label={t("auto.utstyr_materialer")} icon={<Package className="h-4 w-4 text-purple-500" />} />
        {expandedSections.equipment && (
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Utstyr i bruk (kommaseparert)</Label>
              <Input value={equipmentText} onChange={(e) => setEquipmentText(e.target.value)} placeholder={t("auto.gravemaskin_kran_stillas")} />
            </div>
            <div>
              <Label className="text-xs">Materialer mottatt (kommaseparert)</Label>
              <Input value={materialsText} onChange={(e) => setMaterialsText(e.target.value)} placeholder={t("auto.betong_5m_armeringsjern")} />
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      <div>
        <SectionHeader id="progress" label={t("auto.fremdrift")} icon={<TrendingUp className="h-4 w-4 text-green-500" />} />
        {expandedSections.progress && (
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">{t("auto.fremdriftsbeskrivelse")}</Label>
              <Textarea value={progressDesc} onChange={(e) => setProgressDesc(e.target.value)} placeholder={t("auto.ligger_foran_bak_plan")} rows={2} />
            </div>
            <div>
              <Label className="text-xs">Fremdrift (%): {progressPct}%</Label>
              <Slider value={[progressPct]} onValueChange={([v]) => setProgressPct(v)} max={100} step={5} className="mt-2" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={onSchedule} onCheckedChange={setOnSchedule} />
              <Label className="text-xs">{onSchedule ? "I rute" : "Forsinket"}</Label>
            </div>
            {!onSchedule && (
              <div>
                <Label className="text-xs">{t("auto.aarsak_til_forsinkelse")}</Label>
                <Input value={delayReason} onChange={(e) => setDelayReason(e.target.value)} placeholder={t("auto.vaerforhold_materielle")} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quality Controls */}
      <div>
        <SectionHeader id="quality" label={t("auto.kvalitetskontroller")} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
        {expandedSections.quality && (
          <div className="mt-2">
            <Label className="text-xs">{t("auto.utfoerte_kontroller_en_per_linje")}</Label>
            <Textarea value={qualityText} onChange={(e) => setQualityText(e.target.value)} placeholder="Betongprøve tatt&#10;Membransjekk våtrom" rows={3} />
          </div>
        )}
      </div>

      {/* HMS */}
      <div>
        <SectionHeader id="hms" label={t("auto.hms_sikkerhet")} icon={<Shield className="h-4 w-4 text-red-500" />} />
        {expandedSections.hms && (
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-3">
              <Switch checked={safetyMeeting} onCheckedChange={setSafetyMeeting} />
              <Label className="text-xs">{t("auto.sikkerhetsmoete_avholdt")}</Label>
            </div>
            <div>
              <Label className="text-xs">HMS-hendelser (en per linje)</Label>
              <Textarea value={hmsIncText} onChange={(e) => setHmsIncText(e.target.value)} placeholder={t("auto.nestenulykke_skade")} rows={2} />
            </div>
            <div>
              <Label className="text-xs">{t("auto.hms_observasjoner")}</Label>
              <Textarea value={hmsObs} onChange={(e) => setHmsObs(e.target.value)} placeholder={t("auto.manglende_verneutstyr_observert")} rows={2} />
            </div>
          </div>
        )}
      </div>

      {/* Deviations */}
      <div>
        <SectionHeader id="deviations" label={t("auto.avvik_registrert_i_dag")} icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} />
        {expandedSections.deviations && (
          <div className="mt-2">
            <Label className="text-xs">{t("auto.avvik_en_per_linje")}</Label>
            <Textarea value={deviationsText} onChange={(e) => setDeviationsText(e.target.value)} placeholder={t("auto.feil_i_armering_2_etg")} rows={3} />
          </div>
        )}
      </div>

      {/* Photos */}
      <div>
        <SectionHeader id="photos" label={t("auto.bilder_vedlegg")} icon={<Camera className="h-4 w-4 text-sky-500" />} />
        {expandedSections.photos && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-2">
              {t("auto.ta_bilde_eller_last_opp_filer_bilder_foe")}
            </p>
            <DailyReportPhotoUploader
              photos={photos}
              onChange={handlePhotosChange}
              removedPaths={removedPaths}
              onRemove={(p) => setRemovedPaths((prev) => (prev.includes(p.path) ? prev : [...prev, p.path]))}
              onUndoRemove={(p) => setRemovedPaths((prev) => prev.filter((x) => x !== p.path))}
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <SectionHeader id="notes" label={t("auto.andre_merknader")} icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
        {expandedSections.notes && (
          <div className="mt-2">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("auto.oevrige_kommentarer")} rows={3} />
          </div>
        )}
      </div>

      <SmartDailyReportDeviations
        projectId={projectId}
        texts={{
          arbeid: workDesc,
          fremdrift: [progressDesc, delayReason].filter(Boolean).join("\n"),
          hms: [hmsObs, hmsIncText, qualityText].filter(Boolean).join("\n"),
          merknader: notes,
          avvik: deviationsText,
        }}
        onAdd={(text) => {
          setDeviationsText((prev) => (prev ? `${prev}\n${text}` : text));
          setExpandedSections((prev) => ({ ...prev, deviations: true }));
        }}
      />

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-background border-t pt-3 pb-2 space-y-2">
        {autosave && saveState !== "idle" && (
          <p className={cn("text-xs", saveState === "error" ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
            {saveState === "saving"
              ? "Lagrer…"
              : saveState === "saved" && savedAt
                ? `Lagret ${format(savedAt, "HH:mm")}`
                : "Ikke lagret – prøver igjen"}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-auto min-w-0 px-3" disabled={busy}>
            {autosave ? "Lukk" : t("auto.avbryt")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => explicitSave(isSubmittedEdit ? "update" : "draft")}
            disabled={busy}
            className="flex-auto min-w-0 px-3"
          >
            <Clock className="h-4 w-4 mr-1 shrink-0" />
            {isSubmittedEdit ? "Lagre endringer" : t("auto.lagre_utkast")}
          </Button>
          {!isSubmittedEdit && (
            <Button onClick={() => explicitSave("submit")} disabled={busy} className="flex-auto min-w-0 px-3">
              <Send className="h-4 w-4 mr-1 shrink-0" />
              {t("auto.send_inn")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function generateReportEmailHtml(report: DailyReport): string {
  const reportDate = format(new Date(report.report_date), "EEEE d. MMMM yyyy", { locale: nb });
  const sections: string[] = [];

  sections.push(`
    <div style="border-bottom:2px solid #2563eb;padding-bottom:12px;margin-bottom:20px;">
      <h1 style="margin:0;font-size:20px;color:#1e293b;">Dagsrapport ${report.report_number}</h1>
      <p style="margin:4px 0 0;color:#64748b;font-size:14px;">${reportDate} — ${report.user_name}</p>
    </div>
  `);

  // Weather
  if (report.weather_conditions || report.temperature_celsius != null) {
    const parts = [
      report.weather_conditions,
      report.temperature_celsius != null ? `${report.temperature_celsius}°C` : null,
      report.wind_conditions,
      report.precipitation,
    ].filter(Boolean);
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">{t("auto.vaer")}</h3><p style="margin:0;font-size:14px;">${parts.join(" · ")}</p>`);
  }

  // Crew
  if (report.own_crew_count > 0) {
    let crewHtml = `<p style="margin:0;font-size:14px;">Eget mannskap: ${report.own_crew_count}</p>`;
    if (report.subcontractor_attendance?.length > 0) {
      crewHtml += report.subcontractor_attendance.map((s: any) => `<p style="margin:0;font-size:14px;">UE ${s.name}: ${s.count} pers</p>`).join("");
    }
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">{t("auto.mannskap")}</h3>${crewHtml}`);
  }

  // Work
  if (report.work_description) {
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">{t("auto.utfoert_arbeid")}</h3><p style="margin:0;font-size:14px;white-space:pre-wrap;">${report.work_description}</p>`);
    if (report.work_areas) sections.push(`<p style="margin:4px 0 0;font-size:13px;color:#64748b;">Områder: ${report.work_areas}</p>`);
  }

  // Plan for i morgen
  if (report.plan_tomorrow) {
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">Plan for i morgen</h3><p style="margin:0;font-size:14px;white-space:pre-wrap;">${report.plan_tomorrow}</p>`);
  }

  // Progress
  if (report.progress_description) {
    let progHtml = `<p style="margin:0;font-size:14px;">${report.progress_description}</p>`;
    if (report.progress_percentage != null) progHtml += `<p style="margin:4px 0 0;font-size:13px;">Fremdrift: ${report.progress_percentage}%</p>`;
    progHtml += `<p style="margin:4px 0 0;font-size:13px;font-weight:600;color:${report.on_schedule ? '#16a34a' : '#dc2626'};">${report.on_schedule ? 'I rute' : 'Forsinket'}</p>`;
    if (report.delay_reason) progHtml += `<p style="margin:2px 0 0;font-size:13px;color:#dc2626;">Årsak: ${report.delay_reason}</p>`;
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">{t("auto.fremdrift")}</h3>${progHtml}`);
  }

  // HMS
  if (report.hms_incidents?.length > 0 || report.hms_observations || report.safety_meeting_held) {
    let hmsHtml = "";
    if (report.safety_meeting_held) hmsHtml += `<p style="margin:0;font-size:14px;">{t("auto.sikkerhetsmoete_avholdt_2")}</p>`;
    if (report.hms_incidents?.length > 0) {
      hmsHtml += report.hms_incidents.map((h: any) => `<p style="margin:4px 0 0;font-size:14px;color:#dc2626;">⚠️ ${h.description || h}</p>`).join("");
    }
    if (report.hms_observations) hmsHtml += `<p style="margin:4px 0 0;font-size:14px;">${report.hms_observations}</p>`;
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">HMS</h3>${hmsHtml}`);
  }

  // Notes
  if (report.notes) {
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">{t("auto.merknader")}</h3><p style="margin:0;font-size:14px;white-space:pre-wrap;">${report.notes}</p>`);
  }

  return `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1e293b;">${sections.join("")}</div>`;
}

export default function Ks2Dagsrapport() {
  const { projectId } = useParams();
  const { reports, isLoading, createReport, updateReport, deleteReport, submitReport } = useKsDailyReports(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [formReport, setFormReport] = useState<DailyReport | null>(null);
  const [formNumber, setFormNumber] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const closeRef = useRef<(() => void) | null>(null);
  const pendingSaveRef = useRef<Promise<void> | null>(null);
  const lastSavedRef = useRef<DailyReport | null>(null);
  const [waitingSave, setWaitingSave] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [emailReport, setEmailReport] = useState<DailyReport | null>(null);
  const [emailAttachment, setEmailAttachment] = useState<{ filename: string; content: string; contentType: string } | null>(null);
  const [preparingEmail, setPreparingEmail] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { users } = useCompanyUsers();
  const { user, isCompanyAdmin, isSystemAdmin } = useAuth();
  const canDelete = isCompanyAdmin || isSystemAdmin;

  const today = getLocalDateString();
  const todaysDraft =
    reports.find(
      (r) => r.status === "draft" && r.report_date === today && r.user_id === user?.id && (!projectId || r.project_id === projectId),
    ) ?? null;

  const openForm = (r: DailyReport | null) => {
    setFormReport(r);
    setFormNumber(r?.report_number ?? null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };
  const isTodaysOwnDraft = (r: DailyReport | null): r is DailyReport =>
    !!r && r.status === "draft" && r.report_date === today && r.user_id === user?.id && (!projectId || r.project_id === projectId);
  // Venter på ventende autolagring fra forrige skjema før nytt skjema åpnes,
  // slik at det aldri opprettes to utkast for samme dag.
  const openNew = async () => {
    if (waitingSave) return;
    const pending = pendingSaveRef.current;
    if (pending) {
      setWaitingSave(true);
      try { await pending; } catch { /* autolagring håndterer egne feil */ } finally {
        if (pendingSaveRef.current === pending) pendingSaveRef.current = null;
        setWaitingSave(false);
      }
    }
    const last = lastSavedRef.current;
    openForm(todaysDraft ?? (isTodaysOwnDraft(last) ? last : null));
  };
  const closeForm = () => {
    closeRef.current = null;
    setFormOpen(false);
  };
  const formTitle =
    formReport?.status === "submitted"
      ? `Rediger dagsrapport ${formNumber ?? ""}`
      : formNumber
        ? `Dagsrapport ${formNumber} (utkast)`
        : t("auto.ny_dagsrapport");

  const handleDownloadPdf = async (report: DailyReport) => {
    setDownloadingId(report.id);
    const photoCount = report.photos?.length || 0;
    const toastId = photoCount > 5
      ? toast.loading(`Genererer PDF (0 / ${bilderLabel(photoCount)})…`)
      : toast.loading("Genererer PDF…");
    try {
      const effectiveProjectId = report.project_id || projectId || null;
      if (!report.project_id && projectId) {
        console.info(`[dagsrapport] project_id fallback: report ${report.id} mangler project_id, bruker URL projectId ${projectId}`);
      }
      const [{ data: projectData }, { data: companyData }] = await Promise.all([
        effectiveProjectId
          ? supabase.from("ks_module2_projects").select("project_name, project_number, address, gnr_bnr, client_name, partner_name, partner_org_number, partner_logo_url").eq("id", effectiveProjectId).maybeSingle()
          : Promise.resolve({ data: null } as any),
        supabase.from("companies").select("name, address, postal_code, city, org_number, phone, email, logo_url").eq("id", report.company_id).maybeSingle(),
      ]);
      await generateDailyReportPdf(report, projectData as any, companyData as any, (cur, tot) => {
        toast.loading(`Genererer PDF (${cur} / ${bilderLabel(tot)})…`, { id: toastId });
      });
      toast.success(t("auto.pdf_lastet_ned"), { id: toastId });
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error(t("auto.kunne_ikke_generere_pdf"), { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenEmail = async (report: DailyReport) => {
    setPreparingEmail(report.id);
    const photoCount = report.photos?.length || 0;
    const toastId = photoCount > 5
      ? toast.loading(`Forbereder e-post (0 / ${bilderLabel(photoCount)})…`)
      : toast.loading("Forbereder e-post…");
    try {
      const effectiveProjectId = report.project_id || projectId || null;
      if (!report.project_id && projectId) {
        console.info(`[dagsrapport] project_id fallback (e-post): report ${report.id} mangler project_id, bruker URL projectId ${projectId}`);
      }
      const [{ data: projectData }, { data: companyData }] = await Promise.all([
        effectiveProjectId
          ? supabase.from("ks_module2_projects").select("project_name, project_number, address, gnr_bnr, client_name, partner_name, partner_org_number, partner_logo_url").eq("id", effectiveProjectId).maybeSingle()
          : Promise.resolve({ data: null } as any),
        supabase.from("companies").select("name, address, postal_code, city, org_number, phone, email, logo_url").eq("id", report.company_id).maybeSingle(),
      ]);
      const { base64, fileName } = await generateDailyReportPdfBase64(report, projectData as any, companyData as any, (cur, tot) => {
        toast.loading(`Forbereder e-post (${cur} / ${bilderLabel(tot)})…`, { id: toastId });
      });
      setEmailAttachment({ filename: fileName, content: base64, contentType: "application/pdf" });
      setEmailReport(report);
      toast.success(t("auto.e_post_klar"), { id: toastId });
    } catch (err) {
      console.error("Failed to prepare PDF for email", err);
      toast.error(t("auto.kunne_ikke_forberede_vedlegg_sender_uten"), { id: toastId });
      // Still allow sending without attachment
      setEmailAttachment(null);
      setEmailReport(report);
    } finally {
      setPreparingEmail(null);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{t("auto.dagsrapporter")}</h2>
          <p className="text-sm text-muted-foreground">{t("auto.daglige_rapporter_for_arbeid_mannskap_va")}</p>
        </div>
        <Button onClick={openNew} disabled={waitingSave}>
          {waitingSave ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          {t("auto.ny_dagsrapport")}
        </Button>
      </div>

      {/* Ett skjema for ny rapport, utkast og redigering */}
      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
          if (!o) {
            if (closeRef.current) closeRef.current();
            else closeForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{formTitle}</DialogTitle>
          </DialogHeader>
          {formOpen && (
            <DailyReportForm
              key={formKey}
              initialReport={formReport}
              onClose={closeForm}
              closeRef={closeRef}
              createReport={createReport}
              updateReport={updateReport}
              pendingSaveRef={pendingSaveRef}
              onSaved={(r) => { lastSavedRef.current = r; setFormNumber(r.report_number); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {todaysDraft && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">Du har en påbegynt dagsrapport for i dag</p>
              <p className="text-sm text-muted-foreground whitespace-nowrap">{todaysDraft.report_number} · utkast</p>
            </div>
            <Button onClick={openNew} className="shrink-0" disabled={waitingSave}>
              {waitingSave ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
              Fortsett dagens rapport ({bilderLabel(todaysDraft.photos?.length || 0)})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reports list */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-1">{t("auto.ingen_dagsrapporter_ennaa")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("auto.opprett_din_foerste_dagsrapport_for_aa_k")}</p>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              {t("auto.opprett_dagsrapport")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isExpanded = expandedReport === report.id;
            const status = statusConfig[report.status] || statusConfig.draft;

            return (
              <Card key={report.id} className="overflow-hidden">
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
                            {report.report_number}
                          </span>
                          <Badge variant="outline" className={cn("gap-1 shrink-0", status.className)}>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(report.report_date), "EEEE d. MMMM yyyy", { locale: nb })}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 shrink-0 mt-0.5" />}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{report.user_name}</span>
                      {report.weather_conditions && (
                        <span className="flex items-center gap-1">
                          {weatherIcons[report.weather_conditions]}
                          {report.temperature_celsius != null && `${report.temperature_celsius}°C`}
                        </span>
                      )}
                      {report.own_crew_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {report.own_crew_count} egne
                        </span>
                      )}
                    </div>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-4">
                    {/* Work description */}
                    {report.work_description && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t("auto.utfoert_arbeid")}</h4>
                        <p className="text-sm whitespace-pre-wrap">{report.work_description}</p>
                        {report.work_areas && <p className="text-xs text-muted-foreground mt-1">Områder: {report.work_areas}</p>}
                        {(report.work_start_time || report.work_end_time) && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Tid: {report.work_start_time || "—"} – {report.work_end_time || "—"}
                            {calculateWorkDuration(report.work_start_time, report.work_end_time) && (
                              <span className="ml-1">({calculateWorkDuration(report.work_start_time, report.work_end_time)})</span>
                            )}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Weather details */}
                    {(report.wind_conditions || report.precipitation) && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t("auto.vaer_detaljer")}</h4>
                        <div className="flex gap-4 text-sm">
                          {report.wind_conditions && <span>Vind: {report.wind_conditions}</span>}
                          {report.precipitation && <span>Nedbør: {report.precipitation}</span>}
                        </div>
                      </div>
                    )}

                    {/* UE attendance */}
                    {report.subcontractor_attendance?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t("auto.ue_oppmoete")}</h4>
                        <div className="flex flex-wrap gap-2">
                          {report.subcontractor_attendance.map((s: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {s.name}: {s.count} pers
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Equipment */}
                    {report.equipment_used?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t("auto.utstyr")}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {report.equipment_used.map((e: any, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{e.name || e}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress */}
                    {report.progress_description && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t("auto.fremdrift")}</h4>
                        <p className="text-sm">{report.progress_description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {report.progress_percentage != null && (
                            <Badge variant="outline">{report.progress_percentage}%</Badge>
                          )}
                          <Badge variant={report.on_schedule ? "default" : "destructive"}>
                            {report.on_schedule ? "I rute" : "Forsinket"}
                          </Badge>
                        </div>
                        {report.delay_reason && (
                          <p className="text-xs text-destructive mt-1">Årsak: {report.delay_reason}</p>
                        )}
                      </div>
                    )}

                    {/* Plan for i morgen */}
                    {report.plan_tomorrow && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Plan for i morgen</h4>
                        <p className="text-sm whitespace-pre-wrap">{report.plan_tomorrow}</p>
                      </div>
                    )}

                    {/* Quality controls */}
                    {report.quality_controls?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t("auto.kvalitetskontroller")}</h4>
                        <ul className="text-sm space-y-1">
                          {report.quality_controls.map((q: any, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              {q.description || q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* HMS */}
                    {(report.hms_incidents?.length > 0 || report.hms_observations || report.safety_meeting_held) && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">HMS</h4>
                        {report.safety_meeting_held && (
                          <Badge variant="outline" className="mb-2 text-xs gap-1">
                            <Shield className="h-3 w-3" /> {t("auto.sikkerhetsmoete_avholdt")}
                          </Badge>
                        )}
                        {report.hms_incidents?.length > 0 && (
                          <ul className="text-sm space-y-1">
                            {report.hms_incidents.map((h: any, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-destructive">
                                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                {h.description || h}
                              </li>
                            ))}
                          </ul>
                        )}
                        {report.hms_observations && <p className="text-sm mt-1">{report.hms_observations}</p>}
                      </div>
                    )}

                    {/* Deviations */}
                    {report.deviations_today?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t("auto.avvik")}</h4>
                        <ul className="text-sm space-y-1">
                          {report.deviations_today.map((d: any, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-amber-600">
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              {d.description || d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Notes */}
                    {report.notes && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t("auto.merknader")}</h4>
                        <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
                      </div>
                    )}

                    {/* Photos */}
                    {report.photos?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                          Bilder ({report.photos.length})
                        </h4>
                        <DailyReportPhotoGallery photos={report.photos as any} />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {report.status === "draft" && (
                        <Button size="sm" variant="default" onClick={() => submitReport(report.id)}>
                          <Send className="h-3.5 w-3.5 mr-1" />
                          {t("auto.send_inn")}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openForm(report)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        {t("auto.rediger")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPdf(report)}
                        disabled={downloadingId === report.id}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        {downloadingId === report.id ? "Genererer..." : "Last ned PDF"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEmail(report)}
                        disabled={preparingEmail === report.id}
                      >
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        {preparingEmail === report.id ? "Klargjør PDF..." : "Send på e-post"}
                      </Button>
                      {canDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            {t("auto.slett")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("auto.slett_dagsrapport")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("auto.er_du_sikker_paa_at_du_vil_slette_denne__7")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteReport(report.id)}>{t("auto.slett")}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Email dialog */}
      {emailReport && (
        <EmailSendDialog
          open={!!emailReport}
          onOpenChange={(open) => {
            if (!open) {
              setEmailReport(null);
              setEmailAttachment(null);
            }
          }}
          documentType="daily-report"
          subject={`Dagsrapport ${emailReport.report_number} — ${format(new Date(emailReport.report_date), "d. MMMM yyyy", { locale: nb })}`}
          htmlContent={generateReportEmailHtml(emailReport)}
          users={users.map((u) => ({
            id: u.id,
            email: u.email || "",
            first_name: u.first_name || "",
            last_name: u.last_name || "",
          }))}
          attachments={emailAttachment ? [emailAttachment] : undefined}
        />
      )}
    </div>
  );
}
