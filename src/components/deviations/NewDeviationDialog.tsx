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
import { cn } from "@/lib/utils";
import { nb } from "date-fns/locale";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/contexts/AuthContext";

export interface NewDeviation {
  title: string;
  description: string;
  category: "HMS" | "MAT" | "BYGG";
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
  const { profile } = useAuth();
  const { users, isLoading: usersLoading, getUserDisplayName } = useCompanyUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"HMS" | "MAT" | "BYGG">("HMS");
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("HMS");
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
      });
      
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Registrer nytt avvik</DialogTitle>
          <DialogDescription>
            Fyll ut skjemaet for å registrere et nytt avvik eller hendelse.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] px-6">
          <form id="deviation-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
            {/* Basic info section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Navn på avvik *</Label>
                <Input
                  id="title"
                  placeholder="Kort beskrivelse av avviket"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HMS">HMS</SelectItem>
                    <SelectItem value="MAT">Matsikkerhet</SelectItem>
                    <SelectItem value="BYGG">Bygg og anlegg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location and date discovered */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="incidentLocation">Sted oppdaget</Label>
                <Input
                  id="incidentLocation"
                  placeholder="Hvor ble avviket oppdaget?"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Dato oppdaget</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !incidentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {incidentDate ? format(incidentDate, "PPP", { locale: nb }) : "Velg dato"}
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
              <Label htmlFor="discoveredBy">Oppdaget av</Label>
              <Input
                id="discoveredBy"
                placeholder="Navn på person som oppdaget avviket"
                value={discoveredBy}
                onChange={(e) => setDiscoveredBy(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                placeholder="Detaljert beskrivelse av avviket, hva som skjedde, og eventuelle konsekvenser..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Happened before and consequence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Skjedd tidligere?</Label>
                <RadioGroup 
                  value={happenedBefore} 
                  onValueChange={(v) => setHappenedBefore(v as typeof happenedBefore)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unknown" id="unknown" />
                    <Label htmlFor="unknown" className="font-normal cursor-pointer">Ukjent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label htmlFor="yes" className="font-normal cursor-pointer">Ja</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" />
                    <Label htmlFor="no" className="font-normal cursor-pointer">Nei</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consequenceFor">Konsekvens for</Label>
                <Select value={consequenceFor} onValueChange={setConsequenceFor}>
                  <SelectTrigger>
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
              <Label htmlFor="estimatedLoss">Estimert tap i kr</Label>
              <Input
                id="estimatedLoss"
                placeholder="F.eks. 10000"
                value={estimatedLoss}
                onChange={(e) => setEstimatedLoss(e.target.value)}
              />
            </div>

            {/* Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shortTermImprovement">Kortsiktig forbedring</Label>
                <Textarea
                  id="shortTermImprovement"
                  placeholder="Umiddelbare tiltak for å løse avviket..."
                  value={shortTermImprovement}
                  onChange={(e) => setShortTermImprovement(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longTermImprovement">Langsiktig forbedring</Label>
                <Textarea
                  id="longTermImprovement"
                  placeholder="Forebyggende tiltak for å hindre gjentakelse..."
                  value={longTermImprovement}
                  onChange={(e) => setLongTermImprovement(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Prioritet *</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tidsfrist for utbedring *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP", { locale: nb }) : "Velg dato"}
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
                <Label htmlFor="responsibleForClosing">Ansvar for lukking</Label>
                <Select value={responsibleForClosingId} onValueChange={setResponsibleForClosingId}>
                  <SelectTrigger>
                    <SelectValue placeholder={usersLoading ? "Laster..." : "Velg ansvarlig"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {getUserDisplayName(user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignee (hidden, same as responsible for closing for simplicity) */}
            <input type="hidden" value={responsibleForClosingId} />
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Avbryt
          </Button>
          <Button 
            type="submit"
            form="deviation-form"
            disabled={!title.trim() || !dueDate || isSubmitting}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
