import { useState, useEffect } from "react";
import { useLastUsed } from "@/hooks/useLastUsed";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { nb } from "date-fns/locale";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import UserSelect from "@/components/audits/UserSelect";
import { DeviationFileUpload, PendingFile } from "./DeviationFileUpload";
import { SmartDeviationSuggest } from "./SmartDeviationSuggest";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftRestoreBanner } from "@/components/shared/DraftRestoreBanner";

// Use shared type
import type { DeviationCategory } from "@/hooks/useDeviations";
import { t } from "@/i18n/t";

export interface NewDeviation {
  title: string;
  description: string;
  category: DeviationCategory;
  priority: "low" | "medium" | "high" | "critical";
  assignee: string;
  assigneeId?: string;
  dueDate: string;
  // Extended fields
  incidentLocation?: string;
  incidentDate?: string;
  discoveredBy?: string;
  happenedBefore?: "yes" | "no" | "unknown";
  consequenceFor?: string;
  estimatedLoss?: string;
  shortTermImprovement?: string;
  longTermImprovement?: string;
  responsibleForClosing?: string;
  // Files to upload after creation
  pendingFiles?: File[];
}

interface NewDeviationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (deviation: NewDeviation) => void;
}

export function NewDeviationDialog({ 
  open, 
  onOpenChange, 
  onSubmit 
}: NewDeviationDialogProps) {
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const { users, isLoading: usersLoading, getUserDisplayName } = useCompanyUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DeviationCategory>("safety");
  const { lastUsed, remember: rememberDeviationChoices } = useLastUsed("avvik", {
    category: "",
    responsibleForClosingId: "",
  });
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  
  // Extended fields
  const [incidentLocation, setIncidentLocation] = useState("");
  const [incidentDate, setIncidentDate] = useState<Date | undefined>(new Date());
  const [discoveredBy, setDiscoveredBy] = useState(() => {
    if (profile) {
      return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || "";
    }
    return "";
  });
  const [happenedBefore, setHappenedBefore] = useState<"yes" | "no" | "unknown">("unknown");
  const [consequenceFor, setConsequenceFor] = useState("");
  const [estimatedLoss, setEstimatedLoss] = useState("");
  const [shortTermImprovement, setShortTermImprovement] = useState("");
  const [longTermImprovement, setLongTermImprovement] = useState("");
  const [responsibleForClosingId, setResponsibleForClosingId] = useState<string>("");
  
  // Pending files for upload
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  // Universal utkast: tar vare på feltene hvis dialogen lukkes før lagring
  const isDirty = !!title.trim() || !!description.trim() || !!incidentLocation.trim() ||
    !!estimatedLoss.trim() || !!shortTermImprovement.trim() || !!longTermImprovement.trim() ||
    !!consequenceFor || category !== "safety" || priority !== "medium" ||
    happenedBefore !== "unknown" || !!responsibleForClosingId || !!assigneeId;
  const draftData = {
    title, description, category, priority, assigneeId,
    dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : "",
    incidentLocation,
    incidentDate: incidentDate ? format(incidentDate, "yyyy-MM-dd") : "",
    discoveredBy, happenedBefore, consequenceFor, estimatedLoss,
    shortTermImprovement, longTermImprovement, responsibleForClosingId,
  };
  const { draft, clear: clearDraft, dismiss: dismissDraft } = useFormDraft(
    "avvik:ny",
    draftData,
    { enabled: isDirty },
  );

  const restoreDraft = () => {
    if (!draft) return;
    const d = draft.data as typeof draftData;
    setTitle(d.title || "");
    setDescription(d.description || "");
    setCategory((d.category as DeviationCategory) || "safety");
    setPriority(d.priority || "medium");
    setAssigneeId(d.assigneeId || "");
    setDueDate(d.dueDate ? new Date(d.dueDate) : undefined);
    setIncidentLocation(d.incidentLocation || "");
    setIncidentDate(d.incidentDate ? new Date(d.incidentDate) : new Date());
    setDiscoveredBy(d.discoveredBy || "");
    setHappenedBefore(d.happenedBefore || "unknown");
    setConsequenceFor(d.consequenceFor || "");
    setEstimatedLoss(d.estimatedLoss || "");
    setShortTermImprovement(d.shortTermImprovement || "");
    setLongTermImprovement(d.longTermImprovement || "");
    setResponsibleForClosingId(d.responsibleForClosingId || "");
    dismissDraft();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("safety");
    setPriority("medium");
    setAssigneeId("");
    setDueDate(undefined);
    setIncidentLocation("");
    setIncidentDate(new Date());
    setDiscoveredBy(profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || "" : "");
    setHappenedBefore("unknown");
    setConsequenceFor("");
    setEstimatedLoss("");
    setShortTermImprovement("");
    setLongTermImprovement("");
    setResponsibleForClosingId("");
    // Clean up file previews
    pendingFiles.forEach(pf => {
      if (pf.preview) URL.revokeObjectURL(pf.preview);
    });
    setPendingFiles([]);
  };

  // Forhåndsvelg sist brukte kategori og ansvarlig når dialogen åpnes
  useEffect(() => {
    if (!open) return;
    if (lastUsed.category) setCategory(lastUsed.category as DeviationCategory);
    if (lastUsed.responsibleForClosingId && users.some((u) => u.id === lastUsed.responsibleForClosingId)) {
      setResponsibleForClosingId(lastUsed.responsibleForClosingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lastUsed.category, lastUsed.responsibleForClosingId, users.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !dueDate) return;

    setIsSubmitting(true);
    
    try {
      const selectedUser = users.find(u => u.id === assigneeId);
      const assigneeName = selectedUser ? getUserDisplayName(selectedUser) : "Ikke tildelt";
      
      const responsibleUser = users.find(u => u.id === responsibleForClosingId);
      const responsibleName = responsibleUser ? getUserDisplayName(responsibleUser) : "";

      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        assignee: assigneeName,
        assigneeId: assigneeId || undefined,
        dueDate: format(dueDate, "yyyy-MM-dd"),
        incidentLocation: incidentLocation.trim() || undefined,
        incidentDate: incidentDate ? format(incidentDate, "yyyy-MM-dd") : undefined,
        discoveredBy: discoveredBy.trim() || undefined,
        happenedBefore,
        consequenceFor: consequenceFor.trim() || undefined,
        estimatedLoss: estimatedLoss.trim() || undefined,
        shortTermImprovement: shortTermImprovement.trim() || undefined,
        longTermImprovement: longTermImprovement.trim() || undefined,
        responsibleForClosing: responsibleName || undefined,
        pendingFiles: pendingFiles.map(pf => pf.file),
      });
      
      rememberDeviationChoices({ category, responsibleForClosingId });
      resetForm();
      clearDraft();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form id="deviation-form" onSubmit={handleSubmit} className="space-y-5">
      {draft && !isDirty && (
        <DraftRestoreBanner savedAt={draft.savedAt} onRestore={restoreDraft} onDiscard={clearDraft} />
      )}

      {/* Basic info section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">{t("auto.navn_paa_avvik")}</Label>
          <Input
            id="title"
            placeholder={t("auto.kort_beskrivelse_av_avviket")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">{t("auto.kategori_2")}</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as DeviationCategory)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder={t("auto.velg_kategori")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="safety">{t("auto.hms_sikkerhet")}</SelectItem>
              <SelectItem value="quality">{t("auto.kvalitet")}</SelectItem>
              <SelectItem value="environment">{t("auto.miljoe")}</SelectItem>
              <SelectItem value="process">{t("auto.prosess")}</SelectItem>
              <SelectItem value="equipment">{t("auto.utstyr")}</SelectItem>
              <SelectItem value="personnel">{t("auto.personell")}</SelectItem>
              <SelectItem value="documentation">{t("auto.dokumentasjon")}</SelectItem>
              <SelectItem value="other">{t("auto.annet")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location and date discovered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="incidentLocation" className="text-sm font-medium">{t("auto.sted_oppdaget")}</Label>
          <Input
            id="incidentLocation"
            placeholder={t("auto.hvor_ble_avviket_oppdaget")}
            value={incidentLocation}
            onChange={(e) => setIncidentLocation(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("auto.dato_oppdaget")}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-11 justify-start text-left font-normal",
                  !incidentDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {incidentDate ? format(incidentDate, "PPP", { locale: nb }) : "Velg dato"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={incidentDate}
                onSelect={setIncidentDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Discovered by */}
      <div className="space-y-2">
        <Label htmlFor="discoveredBy" className="text-sm font-medium">{t("auto.oppdaget_av")}</Label>
        <UserSelect
          value={discoveredBy}
          onValueChange={setDiscoveredBy}
          placeholder={t("auto.velg_ansatt_eller_skriv_navn")}
          className="h-11"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">{t("auto.beskrivelse")}</Label>
        <Textarea
          id="description"
          placeholder={t("auto.detaljert_beskrivelse_av_avviket_hva_som")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="min-h-[80px] resize-none"
        />
      </div>

      <SmartDeviationSuggest
        title={title}
        description={description}
        location={incidentLocation}
        onApply={(s) => {
          if (s.category) setCategory(s.category as DeviationCategory);
          if (s.priority) setPriority(s.priority);
          if (s.responsibleId) setResponsibleForClosingId(s.responsibleId);
        }}
      />

      {/* Happened before and consequence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t("auto.skjedd_tidligere")}</Label>
          <RadioGroup 
            value={happenedBefore} 
            onValueChange={(v) => setHappenedBefore(v as typeof happenedBefore)}
            className="flex flex-row gap-4 md:flex-col md:gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unknown" id="unknown" className="h-5 w-5" />
              <Label htmlFor="unknown" className="font-normal cursor-pointer text-sm">{t("auto.ukjent")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" className="h-5 w-5" />
              <Label htmlFor="yes" className="font-normal cursor-pointer text-sm">{t("auto.ja")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" className="h-5 w-5" />
              <Label htmlFor="no" className="font-normal cursor-pointer text-sm">{t("auto.nei")}</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="consequenceFor" className="text-sm font-medium">{t("auto.konsekvens_for")}</Label>
          <Select value={consequenceFor} onValueChange={setConsequenceFor}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder={t("auto.velg")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selskapet">{t("auto.selskapet")}</SelectItem>
              <SelectItem value="ansatte">{t("auto.ansatte")}</SelectItem>
              <SelectItem value="kunder">{t("auto.kunder")}</SelectItem>
              <SelectItem value="miljø">{t("auto.miljoe")}</SelectItem>
              <SelectItem value="økonomi">{t("auto.oekonomi")}</SelectItem>
              <SelectItem value="omdømme">{t("auto.omdoemme")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estimated loss */}
      <div className="space-y-2">
        <Label htmlFor="estimatedLoss" className="text-sm font-medium">{t("auto.estimert_tap_i_kr")}</Label>
        <Input
          id="estimatedLoss"
          placeholder={t("auto.f_eks_10000")}
          value={estimatedLoss}
          onChange={(e) => setEstimatedLoss(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shortTermImprovement" className="text-sm font-medium">{t("auto.kortsiktig_forbedring")}</Label>
          <Textarea
            id="shortTermImprovement"
            placeholder={t("auto.umiddelbare_tiltak_2")}
            value={shortTermImprovement}
            onChange={(e) => setShortTermImprovement(e.target.value)}
            rows={3}
            className="min-h-[80px] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longTermImprovement" className="text-sm font-medium">{t("auto.langsiktig_forbedring")}</Label>
          <Textarea
            id="longTermImprovement"
            placeholder={t("auto.forebyggende_tiltak_2")}
            value={longTermImprovement}
            onChange={(e) => setLongTermImprovement(e.target.value)}
            rows={3}
            className="min-h-[80px] resize-none"
          />
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="priority" className="text-sm font-medium">{t("auto.prioritet_2")}</Label>
        <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder={t("auto.velg_prioritet")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">{t("auto.lav")}</SelectItem>
            <SelectItem value="medium">{t("auto.medium")}</SelectItem>
            <SelectItem value="high">{t("auto.hoey")}</SelectItem>
            <SelectItem value="critical">{t("auto.kritisk")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deadline and responsible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("auto.tidsfrist_for_utbedring")}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-11 justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {dueDate ? format(dueDate, "PPP", { locale: nb }) : "Velg dato"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
                className="p-3 pointer-events-auto"
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsibleForClosing" className="text-sm font-medium">{t("auto.ansvar_for_lukking")}</Label>
          <UserSelect
            value={users.find(u => u.id === responsibleForClosingId) ? getUserDisplayName(users.find(u => u.id === responsibleForClosingId)!) : ""}
            onValueChange={(displayName) => {
              const user = users.find(u => getUserDisplayName(u) === displayName);
              setResponsibleForClosingId(user?.id || "");
            }}
            placeholder={t("auto.velg_ansvarlig_eller_skriv_navn")}
            className="h-11"
          />
        </div>
      </div>

      <Separator className="my-2" />

      {/* File upload */}
      <DeviationFileUpload
        files={pendingFiles}
        onFilesChange={setPendingFiles}
        disabled={isSubmitting}
      />

      {/* Assignee (hidden, same as responsible for closing for simplicity) */}
      <input type="hidden" value={responsibleForClosingId} />
    </form>
  );

  const footerButtons = (
    <>
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => onOpenChange(false)}
        disabled={isSubmitting}
        className="flex-1 md:flex-none h-11"
      >
        {t("auto.avbryt")}
      </Button>
      <Button 
        type="submit"
        form="deviation-form"
        disabled={!title.trim() || !dueDate || isSubmitting}
        className="flex-1 md:flex-none h-11"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Lagrer...
          </>
        ) : (
          "Registrer avvik"
        )}
      </Button>
    </>
  );

  // Use Drawer on mobile, Dialog on tablet/desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="text-left px-4 pb-2">
            <DrawerTitle>{t("auto.registrer_nytt_avvik")}</DrawerTitle>
            <DrawerDescription>
              {t("auto.fyll_ut_skjemaet_for_aa_registrere_et_ny")}
            </DrawerDescription>
          </DrawerHeader>
          
          <ScrollArea className="flex-1 px-4 overflow-auto" style={{ maxHeight: 'calc(95vh - 180px)' }}>
            {formContent}
          </ScrollArea>
          
          <DrawerFooter className="flex-row gap-2 px-4 pt-4 border-t">
            {footerButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle>{t("auto.registrer_nytt_avvik")}</DialogTitle>
          <DialogDescription>
            {t("auto.fyll_ut_skjemaet_for_aa_registrere_et_ny")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="pb-4">
            {formContent}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t gap-2 flex-shrink-0 bg-background">
          {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
