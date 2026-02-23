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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { nb } from "date-fns/locale";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import UserSelect from "@/components/audits/UserSelect";
import { DeviationFileUpload, PendingFile } from "./DeviationFileUpload";

// IK-MAT specific categories - completely separate from HMS
export const ikMatCategories = [
  "temperature",      // Temperaturavvik
  "cleaning",         // Renhold ikke utført
  "pests",           // Skadedyr
  "allergen",        // Allergenhåndtering
  "storage",         // Feil lagring
  "expiry",          // Utgått holdbarhet
  "hygiene",         // Personlig hygiene
  "contamination",   // Krysskontaminering
  "receiving",       // Varemottak
  "other_food",      // Annet matsikkerhet
] as const;

export type IkMatCategory = typeof ikMatCategories[number];

export const ikMatCategoryConfig: Record<IkMatCategory, { label: string; color: string }> = {
  temperature: { label: "Temperaturavvik", color: "bg-red-500/10 text-red-600" },
  cleaning: { label: "Renhold ikke utført", color: "bg-yellow-500/10 text-yellow-600" },
  pests: { label: "Skadedyr", color: "bg-orange-500/10 text-orange-600" },
  allergen: { label: "Allergenhåndtering", color: "bg-purple-500/10 text-purple-600" },
  storage: { label: "Feil lagring", color: "bg-blue-500/10 text-blue-600" },
  expiry: { label: "Utgått holdbarhet", color: "bg-amber-500/10 text-amber-600" },
  hygiene: { label: "Personlig hygiene", color: "bg-pink-500/10 text-pink-600" },
  contamination: { label: "Krysskontaminering", color: "bg-rose-500/10 text-rose-600" },
  receiving: { label: "Varemottak", color: "bg-teal-500/10 text-teal-600" },
  other_food: { label: "Annet", color: "bg-muted text-muted-foreground" },
};

export interface NewIkMatDeviation {
  title: string;
  description: string;
  category: IkMatCategory;
  priority: "low" | "medium" | "high" | "critical";
  assignee: string;
  assigneeId?: string;
  dueDate: string;
  incidentLocation?: string;
  incidentDate?: string;
  discoveredBy?: string;
  immediateAction?: string;
  correctiveAction?: string;
  pendingFiles?: File[];
}

interface IkMatDeviationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (deviation: NewIkMatDeviation) => void;
}

export function IkMatDeviationDialog({ 
  open, 
  onOpenChange, 
  onSubmit 
}: IkMatDeviationDialogProps) {
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const { users, isLoading: usersLoading, getUserDisplayName } = useCompanyUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IkMatCategory>("temperature");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  
  // Extended fields
  const [incidentLocation, setIncidentLocation] = useState("");
  const [incidentDate, setIncidentDate] = useState<Date | undefined>(new Date());
  const [discoveredBy, setDiscoveredBy] = useState(() => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile?.email || "";
  });
  const [immediateAction, setImmediateAction] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("temperature");
    setPriority("medium");
    setAssigneeId("");
    setDueDate(undefined);
    setIncidentLocation("");
    setIncidentDate(new Date());
    setDiscoveredBy(profile?.first_name && profile?.last_name 
      ? `${profile.first_name} ${profile.last_name}` 
      : profile?.email || "");
    setImmediateAction("");
    setCorrectiveAction("");
    setPendingFiles([]);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const assignee = users.find(u => u.id === assigneeId);
      const assigneeName = assignee ? getUserDisplayName(assignee) : "";
      
      const deviation: NewIkMatDeviation = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        assignee: assigneeName,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        incidentLocation: incidentLocation.trim() || undefined,
        incidentDate: incidentDate ? format(incidentDate, "yyyy-MM-dd") : undefined,
        discoveredBy: discoveredBy.trim() || undefined,
        immediateAction: immediateAction.trim() || undefined,
        correctiveAction: correctiveAction.trim() || undefined,
        pendingFiles: pendingFiles.map(pf => pf.file),
      };
      
      await onSubmit(deviation);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className="space-y-4 py-2">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">Tittel *</Label>
        <Input
          id="title"
          placeholder="Kort beskrivelse av avviket"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Category and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">Type avvik *</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as IkMatCategory)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Velg type" />
            </SelectTrigger>
            <SelectContent>
              {ikMatCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {ikMatCategoryConfig[cat].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
      </div>

      {/* Location and date discovered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="incidentLocation" className="text-sm font-medium">Sted oppdaget</Label>
          <Input
            id="incidentLocation"
            placeholder="F.eks. kjøkken, lager, mottak"
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
                <CalendarIcon className="mr-2 h-4 w-4" />
                {incidentDate ? format(incidentDate, "d. MMMM yyyy", { locale: nb }) : "Velg dato"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={incidentDate}
                onSelect={setIncidentDate}
                locale={nb}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Discovered by */}
      <div className="space-y-2">
        <Label htmlFor="discoveredBy" className="text-sm font-medium">Oppdaget av</Label>
        <Input
          id="discoveredBy"
          placeholder="Navn på person som oppdaget avviket"
          value={discoveredBy}
          onChange={(e) => setDiscoveredBy(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Beskrivelse</Label>
        <Textarea
          id="description"
          placeholder="Detaljert beskrivelse av hva som skjedde..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="min-h-[80px] resize-none"
        />
      </div>

      <Separator className="my-4" />

      {/* Immediate action */}
      <div className="space-y-2">
        <Label htmlFor="immediateAction" className="text-sm font-medium">Umiddelbar handling</Label>
        <Textarea
          id="immediateAction"
          placeholder="Hva ble gjort umiddelbart for å rette opp?"
          value={immediateAction}
          onChange={(e) => setImmediateAction(e.target.value)}
          rows={2}
          className="min-h-[60px] resize-none"
        />
      </div>

      {/* Corrective action */}
      <div className="space-y-2">
        <Label htmlFor="correctiveAction" className="text-sm font-medium">Korrigerende tiltak</Label>
        <Textarea
          id="correctiveAction"
          placeholder="Hvilke tiltak vil forhindre at dette skjer igjen?"
          value={correctiveAction}
          onChange={(e) => setCorrectiveAction(e.target.value)}
          rows={2}
          className="min-h-[60px] resize-none"
        />
      </div>

      <Separator className="my-4" />

      {/* Assignee and due date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Ansvarlig for oppfølging</Label>
          <UserSelect
            value={assigneeId}
            onValueChange={setAssigneeId}
            placeholder={usersLoading ? "Laster..." : "Velg ansvarlig"}
            disabled={usersLoading}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Frist for lukking</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-11 justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "d. MMMM yyyy", { locale: nb }) : "Velg frist"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                locale={nb}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* File upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Vedlegg</Label>
        <DeviationFileUpload
          files={pendingFiles}
          onFilesChange={setPendingFiles}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Nytt IK-MAT avvik</DrawerTitle>
            <DrawerDescription>
              Registrer avvik relatert til matsikkerhet
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {formContent}
          </ScrollArea>
          <DrawerFooter className="pt-2">
            <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrerer...
                </>
              ) : (
                "Registrer avvik"
              )}
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Avbryt
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Nytt IK-MAT avvik</DialogTitle>
          <DialogDescription>
            Registrer avvik relatert til matsikkerhet
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0 pr-4 -mr-4 overflow-y-auto">
          {formContent}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrerer...
              </>
            ) : (
              "Registrer avvik"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
