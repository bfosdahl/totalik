import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2, QrCode, Calendar, CheckCircle } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useWorkSchedules, WorkSchedule } from "@/hooks/useWorkSchedules";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TimeEntry {
  id: string;
  user_id: string;
  entry_date: string;
  hours: number;
  project_name: string | null;
  project_id: string | null;
  description: string | null;
  status: "draft" | "submitted" | "approved" | "rejected" | "pending_confirmation";
  source?: "manual" | "qr_clock" | "work_schedule";
  clock_in?: string | null;
  clock_out?: string | null;
  total_break_minutes?: number | null;
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
  pending_confirmation: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
};

export function WeeklyTimeView({
  entries,
  onCreateEntry,
  onDeleteEntry,
  userId,
}: WeeklyTimeViewProps) {
  const { profile } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [editingDay, setEditingDay] = useState<Date | null>(null);
  const [hours, setHours] = useState("");
  const [projectId, setProjectId] = useState("");
  const [customProject, setCustomProject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingScheduleId, setConfirmingScheduleId] = useState<string | null>(null);

  const { projects } = useKsModule2Projects();
  const { modules } = useCompanyModules();
  const { schedules } = useWorkSchedules();
  const { confirmScheduleEntry, refetch: refetchEntries } = useTimeEntries();
  
  const hasByggModule = modules.some(
    (m) => m.module_type === "IK_BYGG" && m.is_active
  );
  const activeProjects = projects.filter((p) => p.status !== "completed" && p.status !== "handover");

  // Get user's planned schedules for the current week
  // Note: work_schedules uses profile.id as employee_id, not user_id
  const getSchedulesForDay = (day: Date): WorkSchedule[] => {
    if (!profile?.id) return [];
    return schedules.filter(s => 
      s.employee_id === profile.id && 
      s.schedule_type === "planned" &&
      isSameDay(new Date(s.schedule_date), day)
    );
  };

  // Check if a schedule is already confirmed (has a matching time entry)
  const isScheduleConfirmed = (schedule: WorkSchedule): boolean => {
    return entries.some(e => 
      e.user_id === userId &&
      e.entry_date === schedule.schedule_date &&
      e.source === "work_schedule"
    );
  };

  // Calculate hours from schedule
  const calculateScheduleHours = (schedule: WorkSchedule): number => {
    const [startHour, startMin] = schedule.start_time.split(":").map(Number);
    const [endHour, endMin] = schedule.end_time.split(":").map(Number);
    return endHour - startHour + (endMin - startMin) / 60;
  };

  // Confirm a schedule as time entry
  const handleConfirmSchedule = async (schedule: WorkSchedule) => {
    setConfirmingScheduleId(schedule.id);
    
    // Use the prefixed ID format that confirmScheduleEntry expects
    const success = await confirmScheduleEntry(`schedule_${schedule.id}`);

    if (success) {
      await refetchEntries();
    }
    
    setConfirmingScheduleId(null);
  };

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

    const selectedProject = projectId && projectId !== "none" && projectId !== "custom" 
      ? activeProjects.find((p) => p.id === projectId)
      : null;
    const projectName = selectedProject
      ? `${selectedProject.project_number} - ${selectedProject.project_name}`
      : customProject || undefined;

    const success = await onCreateEntry({
      entry_date: format(editingDay, "yyyy-MM-dd"),
      hours: hoursNum,
      project_id: selectedProject ? projectId : undefined,
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
    <div className="space-y-3 sm:space-y-4">
      {/* Week navigation - Compact on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        {/* Navigation row */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToCurrentWeek} className="h-8 px-2 sm:px-3">
              I dag
            </Button>
          </div>
          
          {/* Week info - inline on mobile */}
          <div className="text-right sm:hidden">
            <span className="text-sm font-semibold">
              Uke {format(currentWeekStart, "w", { locale: nb })}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              ({weekTotal.toFixed(1)}t)
            </span>
          </div>
        </div>
        
        {/* Desktop week info */}
        <div className="hidden sm:block text-center">
          <h3 className="font-semibold">
            Uke {format(currentWeekStart, "w", { locale: nb })},{" "}
            {format(currentWeekStart, "yyyy")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {format(currentWeekStart, "d. MMM", { locale: nb })} -{" "}
            {format(addDays(currentWeekStart, 6), "d. MMM", { locale: nb })}
          </p>
        </div>
        
        {/* Desktop total */}
        <div className="hidden sm:block text-right">
          <p className="text-sm text-muted-foreground">Totalt denne uken</p>
          <p className="text-2xl font-bold">{weekTotal.toFixed(1)} t</p>
        </div>
        
        {/* Mobile date range */}
        <p className="text-xs text-muted-foreground text-center sm:hidden">
          {format(currentWeekStart, "d. MMM", { locale: nb })} - {format(addDays(currentWeekStart, 6), "d. MMM", { locale: nb })}
        </p>
      </div>

      {/* Week grid - Horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 sm:grid sm:grid-cols-7 sm:gap-2 sm:overflow-visible sm:mx-0 sm:px-0 scrollbar-hide">
        {weekDays.map((day) => {
          const dayEntries = getEntriesForDay(day);
          const daySchedules = getSchedulesForDay(day);
          const dayTotal = getDayTotal(day);
          const today = isToday(day);

          return (
            <Card
              key={day.toISOString()}
              className={cn(
                "min-w-[100px] sm:min-w-0 shrink-0 sm:shrink min-h-[120px] sm:min-h-[140px] transition-colors",
                today && "ring-2 ring-primary"
              )}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <div>
                    <p
                      className={cn(
                        "text-[10px] sm:text-xs font-medium uppercase",
                        today && "text-primary"
                      )}
                    >
                      {format(day, "EEE", { locale: nb })}
                    </p>
                    <p
                      className={cn(
                        "text-base sm:text-lg font-bold",
                        today && "text-primary"
                      )}
                    >
                      {format(day, "d")}
                    </p>
                  </div>
                  {dayTotal > 0 && (
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2">
                      {dayTotal.toFixed(1)}t
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 mb-1 sm:mb-2 max-h-[60px] sm:max-h-[100px] overflow-y-auto">
                  {/* Show planned schedules first */}
                  {daySchedules.map((schedule) => {
                    const confirmed = isScheduleConfirmed(schedule);
                    const scheduleHours = calculateScheduleHours(schedule);
                    
                    return (
                      <Tooltip key={`schedule-${schedule.id}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "text-[10px] sm:text-xs p-1 sm:p-1.5 rounded flex items-center justify-between group",
                              confirmed 
                                ? "bg-green-500/20 text-green-700 dark:text-green-400" 
                                : "bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-dashed border-blue-400"
                            )}
                          >
                            <span className="truncate flex-1 flex items-center gap-0.5 sm:gap-1">
                              <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                              {scheduleHours.toFixed(1)}t
                              <span className="text-muted-foreground ml-0.5 sm:ml-1 truncate text-[8px] sm:text-[10px] hidden sm:inline">
                                {schedule.start_time.substring(0, 5)}-{schedule.end_time.substring(0, 5)}
                              </span>
                            </span>
                            {!confirmed && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5 sm:ml-1"
                                onClick={() => handleConfirmSchedule(schedule)}
                                disabled={confirmingScheduleId === schedule.id}
                              >
                                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                              </Button>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div>
                            <p className="font-medium">
                              {confirmed ? "✓ Bekreftet vakt" : "Planlagt vakt - klikk ✓ for å bekrefte"}
                            </p>
                            <p className="text-xs">
                              {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                              {schedule.location && ` • ${schedule.location}`}
                              {schedule.shift_role && ` • ${schedule.shift_role}`}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  
                  {/* Show regular time entries */}
                  {dayEntries.filter(e => e.source !== "work_schedule").map((entry) => (
                    <Tooltip key={entry.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "text-[10px] sm:text-xs p-1 rounded flex items-center justify-between group",
                            statusColors[entry.status]
                          )}
                        >
                          <span className="truncate flex-1 flex items-center gap-0.5 sm:gap-1">
                            {entry.source === "qr_clock" && (
                              <QrCode className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                            )}
                            {Number(entry.hours).toFixed(1)}t
                            {entry.project_name && (
                              <span className="text-muted-foreground ml-0.5 sm:ml-1 truncate hidden sm:inline">
                                - {entry.project_name.split(" - ")[0]}
                              </span>
                            )}
                          </span>
                          {entry.source !== "qr_clock" && (entry.status === "draft" ||
                            entry.status === "submitted" ||
                            entry.status === "rejected") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100"
                              onClick={() => onDeleteEntry(entry.id)}
                            >
                              <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {entry.source === "qr_clock" ? (
                          <div>
                            <p className="font-medium">QR-stempling</p>
                            {entry.clock_in && entry.clock_out && (
                              <p className="text-xs">
                                {format(new Date(entry.clock_in), "HH:mm")} - {format(new Date(entry.clock_out), "HH:mm")}
                                {entry.total_break_minutes ? ` (${entry.total_break_minutes} min pause)` : ""}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p>{entry.description || entry.project_name || "Manuell registrering"}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-5 sm:h-6 text-[10px] sm:text-xs p-0"
                  onClick={() => openDayEditor(day)}
                >
                  <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">Legg til</span>
                  <span className="sm:hidden">+</span>
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
                    <SelectItem value="none">Ingen prosjekt</SelectItem>
                    {activeProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_number} - {project.project_name}
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
