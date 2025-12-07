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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { useCompanyModules } from "@/hooks/useCompanyModules";

interface NewTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entry: {
    entry_date: string;
    hours: number;
    project_name?: string;
    project_id?: string;
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [customProjectName, setCustomProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCustomProject, setUseCustomProject] = useState(false);

  const { projects, isLoading: isLoadingProjects } = useKsModule2Projects();
  const { hasModule } = useCompanyModules();
  const hasKsBygg = hasModule("IK_BYGG");

  // Filter active projects
  const activeProjects = projects.filter(
    (p) => p.status !== "completed" && p.status !== "handover"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      return;
    }

    // Get project name from selected project or custom input
    let projectName: string | undefined;
    let projectId: string | undefined;

    if (hasKsBygg && selectedProjectId && selectedProjectId !== "custom" && selectedProjectId !== "none") {
      const selectedProject = projects.find((p) => p.id === selectedProjectId);
      if (selectedProject) {
        projectName = `${selectedProject.project_number} - ${selectedProject.project_name}`;
        projectId = selectedProject.id;
      }
    } else if (useCustomProject && customProjectName) {
      projectName = customProjectName;
    }

    setIsSubmitting(true);
    const success = await onSubmit({
      entry_date: format(date, "yyyy-MM-dd"),
      hours: hoursNum,
      project_name: projectName,
      project_id: projectId,
      description: description || undefined,
    });

    if (success) {
      setDate(new Date());
      setHours("");
      setSelectedProjectId("");
      setCustomProjectName("");
      setDescription("");
      setUseCustomProject(false);
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    if (value === "custom") {
      setUseCustomProject(true);
    } else {
      setUseCustomProject(false);
      setCustomProjectName("");
    }
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
            {hasKsBygg && activeProjects.length > 0 ? (
              <>
                <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg prosjekt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ingen prosjekt</SelectItem>
                    {activeProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">
                          {project.project_number}
                        </span>
                        {project.project_name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Annet (fritekst)</SelectItem>
                  </SelectContent>
                </Select>
                {useCustomProject && (
                  <div className="relative mt-2">
                    <FolderOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Skriv inn prosjektnavn"
                      value={customProjectName}
                      onChange={(e) => setCustomProjectName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="relative">
                <FolderOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="project"
                  placeholder="F.eks. Kundeprosjekt A"
                  value={customProjectName}
                  onChange={(e) => setCustomProjectName(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
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
