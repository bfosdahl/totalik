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
import { cn } from "@/lib/utils";
import { nb } from "date-fns/locale";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";

export interface NewDeviation {
  title: string;
  description: string;
  category: "HMS" | "MAT" | "BYGG";
  priority: "low" | "medium" | "high" | "critical";
  assignee: string;
  dueDate: string;
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
  const { users, isLoading: usersLoading, getUserDisplayName } = useCompanyUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"HMS" | "MAT" | "BYGG">("HMS");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !dueDate) return;

    setIsSubmitting(true);
    
    try {
      const selectedUser = users.find(u => u.id === assigneeId);
      const assigneeName = selectedUser ? getUserDisplayName(selectedUser) : "Ikke tildelt";

      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        assignee: assigneeName,
        dueDate: format(dueDate, "yyyy-MM-dd"),
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("HMS");
      setPriority("medium");
      setAssigneeId("");
      setDueDate(undefined);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrer nytt avvik</DialogTitle>
          <DialogDescription>
            Fyll ut skjemaet for å registrere et nytt avvik eller hendelse.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              placeholder="Kort beskrivelse av avviket"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              placeholder="Detaljert beskrivelse av avviket, hva som skjedde, og eventuelle konsekvenser..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Ansvarlig</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder={usersLoading ? "Laster..." : "Velg ansvarlig"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Ikke tildelt</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {getUserDisplayName(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frist *</Label>
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
          </div>

          <DialogFooter>
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
