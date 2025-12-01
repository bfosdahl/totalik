import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useKsProjects } from "@/hooks/useKsProjects";
import { useCompanyModules } from "@/hooks/useCompanyModules";

interface TimeEntry {
  id: string;
  user_id: string;
  entry_date: string;
  hours: number;
  project_name: string | null;
  project_id: string | null;
  description: string | null;
  status: "draft" | "submitted" | "approved" | "rejected";
}

interface WeeklyTimeViewProps {
  entries: TimeEntry[];
  onCreateEntry: (entry: {
    entry_date: string;
    hours: number;
    project_name?: string;
    project_id?: string;
    description?: string;
  }) => Promise<boolean>;
  onDeleteEntry: (id: string) => Promise<boolean>;
  userId: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/20 text-primary",
  approved: "bg-green-500/20 text-green-700 dark:text-green-400",
  rejected: "bg-destructive/20 text-destructive",
};

export function WeeklyTimeView({
  entries,
  onCreateEntry,
  onDeleteEntry,
  userId,
}: WeeklyTimeViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [editingDay, setEditingDay] = useState<Date | null>(null);
  const [hours, setHours] = useState("");
  const [projectId, setProjectId] = useState("");
  const [customProject, setCustomProject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { projects } = useKsProjects();
  const { modules } = useCompanyModules();
  const hasByggModule = modules.some(
    (m) => m.module_type === "IK_BYGG" && m.is_active
  );
  const activeProjects = projects.filter((p) => p.status !== "archived");

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  const userEntries = entries.filter((e) => e.user_id === userId);

  const getEntriesForDay = (day: Date) =>
    userEntries.filter((e) => isSameDay(new Date(e.entry_date), day));

  const getDayTotal = (day: Date) =>
    getEntriesForDay(day).reduce((sum, e) => sum + Number(e.hours), 0);

  const weekTotal = weekDays.reduce((sum, day) => sum + getDayTotal(day), 0);

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const openDayEditor = (day: Date) => {
    setEditingDay(day);
    setHours("");
    setProjectId("");
    setCustomProject("");
    setDescription("");
  };

  const handleSubmit = async () => {
    if (!editingDay || !hours) return;

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) return;

    setIsSubmitting(true);

    const selectedProject = activeProjects.find((p) => p.id === projectId);
    const projectName = selectedProject
      ? `${selectedProject.project_number} - ${selectedProject.name}`
      : customProject || undefined;

    const success = await onCreateEntry({
      entry_date: format(editingDay, "yyyy-MM-dd"),
      hours: hoursNum,
      project_id: projectId || undefined,
      project_name: projectName,
      description: description || undefined,
    });

    if (success) {
      setEditingDay(null);
    }
    setIsSubmitting(false);
  };

  const isToday = (day: Date) => isSameDay(day, new Date());

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
            I dag
          </Button>
        </div>
        <div className="text-center">
          <h3 className="font-semibold">
            Uke {format(currentWeekStart, "w", { locale: nb })},{" "}
            {format(currentWeekStart, "yyyy")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {format(currentWeekStart, "d. MMM", { locale: nb })} -{" "}
            {format(addDays(currentWeekStart, 6), "d. MMM", { locale: nb })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Totalt denne uken</p>
          <p className="text-2xl font-bold">{weekTotal.toFixed(1)} t</p>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayEntries = getEntriesForDay(day);
          const dayTotal = getDayTotal(day);
          const today = isToday(day);

          return (
            <Card
              key={day.toISOString()}
              className={cn(
                "min-h-[140px] transition-colors",
                today && "ring-2 ring-primary"
              )}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p
                      className={cn(
                        "text-xs font-medium uppercase",
                        today && "text-primary"
                      )}
                    >
                      {format(day, "EEE", { locale: nb })}
                    </p>
                    <p
                      className={cn(
                        "text-lg font-bold",
                        today && "text-primary"
                      )}
                    >
                      {format(day, "d")}
                    </p>
                  </div>
                  {dayTotal > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayTotal.toFixed(1)}t
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 mb-2 max-h-[60px] overflow-y-auto">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "text-xs p-1 rounded flex items-center justify-between group",
                        statusColors[entry.status]
                      )}
                    >
                      <span className="truncate flex-1">
                        {Number(entry.hours).toFixed(1)}t
                        {entry.project_name && (
                          <span className="text-muted-foreground ml-1 truncate">
                            - {entry.project_name.split(" - ")[0]}
                          </span>
                        )}
                      </span>
                      {(entry.status === "draft" ||
                        entry.status === "submitted" ||
                        entry.status === "rejected") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 opacity-0 group-hover:opacity-100"
                          onClick={() => onDeleteEntry(entry.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-6 text-xs"
                  onClick={() => openDayEditor(day)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Legg til
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add entry dialog */}
      <Dialog open={!!editingDay} onOpenChange={() => setEditingDay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Registrer timer -{" "}
              {editingDay && format(editingDay, "EEEE d. MMMM", { locale: nb })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Timer</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                placeholder="7.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>

            {hasByggModule && activeProjects.length > 0 ? (
              <div className="space-y-2">
                <Label>Prosjekt</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg prosjekt (valgfritt)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ingen prosjekt</SelectItem>
                    {activeProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_number} - {project.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Annet (fritekst)</SelectItem>
                  </SelectContent>
                </Select>
                {projectId === "custom" && (
                  <Input
                    placeholder="Skriv prosjektnavn"
                    value={customProject}
                    onChange={(e) => setCustomProject(e.target.value)}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Prosjekt (valgfritt)</Label>
                <Input
                  placeholder="F.eks. Kundeprosjekt A"
                  value={customProject}
                  onChange={(e) => setCustomProject(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Beskrivelse (valgfritt)</Label>
              <Textarea
                placeholder="Hva jobbet du med?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingDay(null)}
              >
                Avbryt
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting || !hours}
              >
                {isSubmitting ? "Lagrer..." : "Registrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
