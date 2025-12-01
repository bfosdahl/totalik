import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarIcon, Clock, FolderOpen, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NewTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entry: {
    entry_date: string;
    hours: number;
    project_name?: string;
    description?: string;
  }) => Promise<boolean>;
}

export function NewTimeEntryDialog({
  open,
  onOpenChange,
  onSubmit,
}: NewTimeEntryDialogProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [hours, setHours] = useState("");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit({
      entry_date: format(date, "yyyy-MM-dd"),
      hours: hoursNum,
      project_name: projectName || undefined,
      description: description || undefined,
    });

    if (success) {
      setDate(new Date());
      setHours("");
      setProjectName("");
      setDescription("");
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrer timer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Dato</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: nb }) : "Velg dato"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  locale={nb}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Timer</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                placeholder="7.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Prosjekt (valgfritt)</Label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="project"
                placeholder="F.eks. Kundeprosjekt A"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="description"
                placeholder="Hva jobbet du med?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="pl-10 min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Lagrer..." : "Registrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
