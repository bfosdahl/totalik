import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
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

const weatherIcons: Record<string, React.ReactNode> = {
  sol: <Sun className="h-4 w-4 text-amber-500" />,
  overskyet: <Cloud className="h-4 w-4 text-gray-500" />,
  regn: <CloudRain className="h-4 w-4 text-blue-500" />,
  snø: <Snowflake className="h-4 w-4 text-cyan-500" />,
  vind: <Wind className="h-4 w-4 text-teal-500" />,
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: React.ReactNode }> = {
  draft: { label: "Utkast", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  submitted: { label: "Innsendt", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
};

function DailyReportForm({
  onSubmit,
  onClose,
  isSubmitting,
  initialData,
}: {
  onSubmit: (data: CreateDailyReport, asDraft: boolean) => void;
  onClose: () => void;
  isSubmitting: boolean;
  initialData?: CreateDailyReport;
}) {
  const { projectId } = useParams();
  const [date, setDate] = useState<Date>(initialData?.report_date ? new Date(initialData.report_date) : new Date());
  const [weather, setWeather] = useState(initialData?.weather_conditions || "");
  const [temp, setTemp] = useState(initialData?.temperature_celsius?.toString() || "");
  const [windCond, setWindCond] = useState(initialData?.wind_conditions || "");
  const [precip, setPrecip] = useState(initialData?.precipitation || "");
  const [ownCrew, setOwnCrew] = useState(initialData?.own_crew_count?.toString() || "0");
  const [workDesc, setWorkDesc] = useState(initialData?.work_description || "");
  const [workAreas, setWorkAreas] = useState(initialData?.work_areas || "");
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
      {/* Date */}
      <div>
        <Label>Dato</Label>
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
        <SectionHeader id="weather" label="Værforhold" icon={<Sun className="h-4 w-4 text-amber-500" />} />
        {expandedSections.weather && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label className="text-xs">Vær</Label>
              <Select value={weather} onValueChange={setWeather}>
                <SelectTrigger><SelectValue placeholder="Velg..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sol">☀️ Sol</SelectItem>
                  <SelectItem value="overskyet">☁️ Overskyet</SelectItem>
                  <SelectItem value="regn">🌧️ Regn</SelectItem>
                  <SelectItem value="snø">❄️ Snø</SelectItem>
                  <SelectItem value="vind">💨 Vind</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Temperatur (°C)</Label>
              <Input type="number" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="-5" />
            </div>
            <div>
              <Label className="text-xs">Vind</Label>
              <Input value={windCond} onChange={(e) => setWindCond(e.target.value)} placeholder="Svak, liten kuling..." />
            </div>
            <div>
              <Label className="text-xs">Nedbør</Label>
              <Input value={precip} onChange={(e) => setPrecip(e.target.value)} placeholder="Ingen, lett regn..." />
            </div>
          </div>
        )}
      </div>

      {/* Crew Section */}
      <div>
        <SectionHeader id="crew" label="Mannskap" icon={<Users className="h-4 w-4 text-blue-500" />} />
        {expandedSections.crew && (
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Egne ansatte på plass</Label>
              <Input type="number" value={ownCrew} onChange={(e) => setOwnCrew(e.target.value)} min="0" />
            </div>
            <div>
              <Label className="text-xs">UE-oppmøte (en per linje: Firma: antall)</Label>
              <Textarea value={subAttText} onChange={(e) => setSubAttText(e.target.value)} placeholder="Rørlegger AS: 3&#10;Elektro AS: 2" rows={3} />
            </div>
          </div>
        )}
      </div>

      {/* Work Section */}
      <div>
        <SectionHeader id="work" label="Utført arbeid" icon={<Wrench className="h-4 w-4 text-orange-500" />} />
        {expandedSections.work && (
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Beskrivelse av utført arbeid</Label>
              <Textarea value={workDesc} onChange={(e) => setWorkDesc(e.target.value)} placeholder="Beskrivelse av dagens arbeid..." rows={4} />
            </div>
            <div>
              <Label className="text-xs">Arbeidsområder</Label>
              <Input value={workAreas} onChange={(e) => setWorkAreas(e.target.value)} placeholder="1. etg, tak, fasade..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tid fra</Label>
                <Input type="time" value={workStartTime} onChange={(e) => setWorkStartTime(e.target.value)} placeholder="08:00" />
              </div>
              <div>
                <Label className="text-xs">Tid til</Label>
                <Input type="time" value={workEndTime} onChange={(e) => setWorkEndTime(e.target.value)} placeholder="16:00" />
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
        <SectionHeader id="equipment" label="Utstyr & Materialer" icon={<Package className="h-4 w-4 text-purple-500" />} />
        {expandedSections.equipment && (
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Utstyr i bruk (kommaseparert)</Label>
              <Input value={equipmentText} onChange={(e) => setEquipmentText(e.target.value)} placeholder="Gravemaskin, kran, stillas..." />
            </div>
            <div>
              <Label className="text-xs">Materialer mottatt (kommaseparert)</Label>
              <Input value={materialsText} onChange={(e) => setMaterialsText(e.target.value)} placeholder="Betong 5m³, armeringsjern..." />
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      <div>
        <SectionHeader id="progress" label="Fremdrift" icon={<TrendingUp className="h-4 w-4 text-green-500" />} />
        {expandedSections.progress && (
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Fremdriftsbeskrivelse</Label>
              <Textarea value={progressDesc} onChange={(e) => setProgressDesc(e.target.value)} placeholder="Ligger foran/bak plan..." rows={2} />
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
                <Label className="text-xs">Årsak til forsinkelse</Label>
                <Input value={delayReason} onChange={(e) => setDelayReason(e.target.value)} placeholder="Værforhold, materielle..." />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quality Controls */}
      <div>
        <SectionHeader id="quality" label="Kvalitetskontroller" icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
        {expandedSections.quality && (
          <div className="mt-2">
            <Label className="text-xs">Utførte kontroller (en per linje)</Label>
            <Textarea value={qualityText} onChange={(e) => setQualityText(e.target.value)} placeholder="Betongprøve tatt&#10;Membransjekk våtrom" rows={3} />
          </div>
        )}
      </div>

      {/* HMS */}
      <div>
        <SectionHeader id="hms" label="HMS / Sikkerhet" icon={<Shield className="h-4 w-4 text-red-500" />} />
        {expandedSections.hms && (
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-3">
              <Switch checked={safetyMeeting} onCheckedChange={setSafetyMeeting} />
              <Label className="text-xs">Sikkerhetsmøte avholdt</Label>
            </div>
            <div>
              <Label className="text-xs">HMS-hendelser (en per linje)</Label>
              <Textarea value={hmsIncText} onChange={(e) => setHmsIncText(e.target.value)} placeholder="Nestenulykke, skade..." rows={2} />
            </div>
            <div>
              <Label className="text-xs">HMS-observasjoner</Label>
              <Textarea value={hmsObs} onChange={(e) => setHmsObs(e.target.value)} placeholder="Manglende verneutstyr observert..." rows={2} />
            </div>
          </div>
        )}
      </div>

      {/* Deviations */}
      <div>
        <SectionHeader id="deviations" label="Avvik registrert i dag" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} />
        {expandedSections.deviations && (
          <div className="mt-2">
            <Label className="text-xs">Avvik (en per linje)</Label>
            <Textarea value={deviationsText} onChange={(e) => setDeviationsText(e.target.value)} placeholder="Feil i armering 2. etg..." rows={3} />
          </div>
        )}
      </div>

      {/* Photos */}
      <div>
        <SectionHeader id="photos" label="Bilder / vedlegg" icon={<Camera className="h-4 w-4 text-sky-500" />} />
        {expandedSections.photos && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Ta bilde eller last opp filer. Bilder følger med på PDF og e-post.
            </p>
            <DailyReportPhotoUploader photos={photos} onChange={setPhotos} />
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <SectionHeader id="notes" label="Andre merknader" icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
        {expandedSections.notes && (
          <div className="mt-2">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Øvrige kommentarer..." rows={3} />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-background pb-2">
        <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
          Avbryt
        </Button>
        <Button variant="secondary" onClick={() => onSubmit(buildData(), true)} disabled={isSubmitting} className="flex-1">
          <Clock className="h-4 w-4 mr-1" />
          Lagre utkast
        </Button>
        <Button onClick={() => onSubmit(buildData(), false)} disabled={isSubmitting} className="flex-1">
          <Send className="h-4 w-4 mr-1" />
          Send inn
        </Button>
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
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">Vær</h3><p style="margin:0;font-size:14px;">${parts.join(" · ")}</p>`);
  }

  // Crew
  if (report.own_crew_count > 0) {
    let crewHtml = `<p style="margin:0;font-size:14px;">Eget mannskap: ${report.own_crew_count}</p>`;
    if (report.subcontractor_attendance?.length > 0) {
      crewHtml += report.subcontractor_attendance.map((s: any) => `<p style="margin:0;font-size:14px;">UE ${s.name}: ${s.count} pers</p>`).join("");
    }
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">Mannskap</h3>${crewHtml}`);
  }

  // Work
  if (report.work_description) {
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">Utført arbeid</h3><p style="margin:0;font-size:14px;white-space:pre-wrap;">${report.work_description}</p>`);
    if (report.work_areas) sections.push(`<p style="margin:4px 0 0;font-size:13px;color:#64748b;">Områder: ${report.work_areas}</p>`);
  }

  // Progress
  if (report.progress_description) {
    let progHtml = `<p style="margin:0;font-size:14px;">${report.progress_description}</p>`;
    if (report.progress_percentage != null) progHtml += `<p style="margin:4px 0 0;font-size:13px;">Fremdrift: ${report.progress_percentage}%</p>`;
    progHtml += `<p style="margin:4px 0 0;font-size:13px;font-weight:600;color:${report.on_schedule ? '#16a34a' : '#dc2626'};">${report.on_schedule ? 'I rute' : 'Forsinket'}</p>`;
    if (report.delay_reason) progHtml += `<p style="margin:2px 0 0;font-size:13px;color:#dc2626;">Årsak: ${report.delay_reason}</p>`;
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">Fremdrift</h3>${progHtml}`);
  }

  // HMS
  if (report.hms_incidents?.length > 0 || report.hms_observations || report.safety_meeting_held) {
    let hmsHtml = "";
    if (report.safety_meeting_held) hmsHtml += `<p style="margin:0;font-size:14px;">✅ Sikkerhetsmøte avholdt</p>`;
    if (report.hms_incidents?.length > 0) {
      hmsHtml += report.hms_incidents.map((h: any) => `<p style="margin:4px 0 0;font-size:14px;color:#dc2626;">⚠️ ${h.description || h}</p>`).join("");
    }
    if (report.hms_observations) hmsHtml += `<p style="margin:4px 0 0;font-size:14px;">${report.hms_observations}</p>`;
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">HMS</h3>${hmsHtml}`);
  }

  // Notes
  if (report.notes) {
    sections.push(`<h3 style="margin:16px 0 4px;font-size:14px;color:#475569;">Merknader</h3><p style="margin:0;font-size:14px;white-space:pre-wrap;">${report.notes}</p>`);
  }

  return `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1e293b;">${sections.join("")}</div>`;
}

export default function Ks2Dagsrapport() {
  const { projectId } = useParams();
  const { reports, isLoading, createReport, deleteReport, submitReport, isCreating } = useKsDailyReports(projectId);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [emailReport, setEmailReport] = useState<DailyReport | null>(null);
  const [emailAttachment, setEmailAttachment] = useState<{ filename: string; content: string; contentType: string } | null>(null);
  const [preparingEmail, setPreparingEmail] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { users } = useCompanyUsers();
  const { profile } = useAuth();

  const handleDownloadPdf = async (report: DailyReport) => {
    setDownloadingId(report.id);
    try {
      const effectiveProjectId = report.project_id || projectId || null;
      const [{ data: projectData }, { data: companyData }] = await Promise.all([
        effectiveProjectId
          ? supabase.from("ks_module2_projects").select("project_name, project_number, address, gnr_bnr, saksnr, client_name, partner_name, partner_org_number, partner_logo_url").eq("id", effectiveProjectId).maybeSingle()
          : Promise.resolve({ data: null } as any),
        supabase.from("companies").select("name, address, postal_code, city, org_number, phone, email, logo_url").eq("id", report.company_id).maybeSingle(),
      ]);
      await generateDailyReportPdf(report, projectData as any, companyData as any);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenEmail = async (report: DailyReport) => {
    setPreparingEmail(report.id);
    try {
      const effectiveProjectId = report.project_id || projectId || null;
      const [{ data: projectData }, { data: companyData }] = await Promise.all([
        effectiveProjectId
          ? supabase.from("ks_module2_projects").select("project_name, project_number, address, gnr_bnr, saksnr, client_name, partner_name, partner_org_number, partner_logo_url").eq("id", effectiveProjectId).maybeSingle()
          : Promise.resolve({ data: null } as any),
        supabase.from("companies").select("name, address, postal_code, city, org_number, phone, email, logo_url").eq("id", report.company_id).maybeSingle(),
      ]);
      const { base64, fileName } = await generateDailyReportPdfBase64(report, projectData as any, companyData as any);
      setEmailAttachment({ filename: fileName, content: base64, contentType: "application/pdf" });
      setEmailReport(report);
    } catch (err) {
      console.error("Failed to prepare PDF for email", err);
      // Still allow sending without attachment
      setEmailAttachment(null);
      setEmailReport(report);
    } finally {
      setPreparingEmail(null);
    }
  };


  const handleSubmit = async (data: CreateDailyReport, asDraft: boolean) => {
    await createReport({
      ...data,
      status: asDraft ? "draft" : "submitted",
    } as any);
    setIsFormOpen(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Dagsrapporter</h2>
          <p className="text-sm text-muted-foreground">Daglige rapporter for arbeid, mannskap, vær og fremdrift</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny dagsrapport
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Ny dagsrapport</DialogTitle>
            </DialogHeader>
            <DailyReportForm onSubmit={handleSubmit} onClose={() => setIsFormOpen(false)} isSubmitting={isCreating} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports list */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-1">Ingen dagsrapporter ennå</h3>
            <p className="text-sm text-muted-foreground mb-4">Opprett din første dagsrapport for å komme i gang</p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Opprett dagsrapport
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
                          {report.report_number}
                        </div>
                        <Badge variant={status.variant} className="gap-1">
                          {status.icon}
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(report.report_date), "EEEE d. MMMM yyyy", { locale: nb })}
                        </span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
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
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Utført arbeid</h4>
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
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Vær detaljer</h4>
                        <div className="flex gap-4 text-sm">
                          {report.wind_conditions && <span>Vind: {report.wind_conditions}</span>}
                          {report.precipitation && <span>Nedbør: {report.precipitation}</span>}
                        </div>
                      </div>
                    )}

                    {/* UE attendance */}
                    {report.subcontractor_attendance?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">UE-oppmøte</h4>
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
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Utstyr</h4>
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
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Fremdrift</h4>
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

                    {/* Quality controls */}
                    {report.quality_controls?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Kvalitetskontroller</h4>
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
                            <Shield className="h-3 w-3" /> Sikkerhetsmøte avholdt
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
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Avvik</h4>
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
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Merknader</h4>
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
                          Send inn
                        </Button>
                      )}
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Slett
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Slett dagsrapport?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Er du sikker på at du vil slette denne dagsrapporten? Handlingen kan ikke angres.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteReport(report.id)}>Slett</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
