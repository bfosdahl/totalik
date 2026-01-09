import { useState } from "react";
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

// Valid database category values
export type DeviationCategory = "quality" | "safety" | "environment" | "documentation" | "other" | "process" | "equipment" | "personnel";

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
      
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form id="deviation-form" onSubmit={handleSubmit} className="space-y-5">
      {/* Basic info section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">Navn på avvik *</Label>
          <Input
            id="title"
            placeholder="Kort beskrivelse av avviket"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">Kategori *</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as DeviationCategory)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Velg kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="safety">HMS / Sikkerhet</SelectItem>
              <SelectItem value="quality">Kvalitet</SelectItem>
              <SelectItem value="environment">Miljø</SelectItem>
              <SelectItem value="process">Prosess</SelectItem>
              <SelectItem value="equipment">Utstyr</SelectItem>
              <SelectItem value="personnel">Personell</SelectItem>
              <SelectItem value="documentation">Dokumentasjon</SelectItem>
              <SelectItem value="other">Annet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location and date discovered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="incidentLocation" className="text-sm font-medium">Sted oppdaget</Label>
          <Input
            id="incidentLocation"
            placeholder="Hvor ble avviket oppdaget?"
            value={incidentLocation}
            onChange={(e) => setIncidentLocation(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Dato oppdaget</Label>
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
        <Label htmlFor="discoveredBy" className="text-sm font-medium">Oppdaget av</Label>
        <UserSelect
          value={discoveredBy}
          onValueChange={setDiscoveredBy}
          placeholder="Velg ansatt eller skriv navn"
          className="h-11"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Beskrivelse</Label>
        <Textarea
          id="description"
          placeholder="Detaljert beskrivelse av avviket, hva som skjedde, og eventuelle konsekvenser..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Happened before and consequence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Skjedd tidligere?</Label>
          <RadioGroup 
            value={happenedBefore} 
            onValueChange={(v) => setHappenedBefore(v as typeof happenedBefore)}
            className="flex flex-row gap-4 md:flex-col md:gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unknown" id="unknown" className="h-5 w-5" />
              <Label htmlFor="unknown" className="font-normal cursor-pointer text-sm">Ukjent</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" className="h-5 w-5" />
              <Label htmlFor="yes" className="font-normal cursor-pointer text-sm">Ja</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" className="h-5 w-5" />
              <Label htmlFor="no" className="font-normal cursor-pointer text-sm">Nei</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="consequenceFor" className="text-sm font-medium">Konsekvens for</Label>
          <Select value={consequenceFor} onValueChange={setConsequenceFor}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Velg..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selskapet">Selskapet</SelectItem>
              <SelectItem value="ansatte">Ansatte</SelectItem>
              <SelectItem value="kunder">Kunder</SelectItem>
              <SelectItem value="miljø">Miljø</SelectItem>
              <SelectItem value="økonomi">Økonomi</SelectItem>
              <SelectItem value="omdømme">Omdømme</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estimated loss */}
      <div className="space-y-2">
        <Label htmlFor="estimatedLoss" className="text-sm font-medium">Estimert tap i kr</Label>
        <Input
          id="estimatedLoss"
          placeholder="F.eks. 10000"
          value={estimatedLoss}
          onChange={(e) => setEstimatedLoss(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shortTermImprovement" className="text-sm font-medium">Kortsiktig forbedring</Label>
          <Textarea
            id="shortTermImprovement"
            placeholder="Umiddelbare tiltak..."
            value={shortTermImprovement}
            onChange={(e) => setShortTermImprovement(e.target.value)}
            rows={3}
            className="min-h-[80px] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longTermImprovement" className="text-sm font-medium">Langsiktig forbedring</Label>
          <Textarea
            id="longTermImprovement"
            placeholder="Forebyggende tiltak..."
            value={longTermImprovement}
            onChange={(e) => setLongTermImprovement(e.target.value)}
            rows={3}
            className="min-h-[80px] resize-none"
          />
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="priority" className="text-sm font-medium">Prioritet *</Label>
        <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Velg prioritet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Lav</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">Høy</SelectItem>
            <SelectItem value="critical">Kritisk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deadline and responsible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tidsfrist for utbedring *</Label>
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
          <Label htmlFor="responsibleForClosing" className="text-sm font-medium">Ansvar for lukking</Label>
          <UserSelect
            value={users.find(u => u.id === responsibleForClosingId) ? getUserDisplayName(users.find(u => u.id === responsibleForClosingId)!) : ""}
            onValueChange={(displayName) => {
              const user = users.find(u => getUserDisplayName(u) === displayName);
              setResponsibleForClosingId(user?.id || "");
            }}
            placeholder="Velg ansvarlig eller skriv navn"
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
        Avbryt
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
            <DrawerTitle>Registrer nytt avvik</DrawerTitle>
            <DrawerDescription>
              Fyll ut skjemaet for å registrere et nytt avvik eller hendelse.
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
      <DialogContent className="sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Registrer nytt avvik</DialogTitle>
          <DialogDescription>
            Fyll ut skjemaet for å registrere et nytt avvik eller hendelse.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] px-6">
          <div className="pb-4">
            {formContent}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t gap-2">
          {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
