import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useWorkSchedules, WorkSchedule } from "@/hooks/useWorkSchedules";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useAuth } from "@/contexts/AuthContext";

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

      {/* Week grid - Improved layout */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day) => {
          const dayEntries = getEntriesForDay(day);
          const daySchedules = getSchedulesForDay(day);
          const dayTotal = getDayTotal(day);
          const today = isToday(day);
          const hasEntries = dayEntries.length > 0 || daySchedules.length > 0;

          return (
            <Card
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] sm:min-h-[140px] transition-colors cursor-pointer hover:bg-accent/50",
                today && "ring-2 ring-primary",
                hasEntries && "bg-muted/30"
              )}
              onClick={() => openDayEditor(day)}
            >
              <CardContent className="p-1.5 sm:p-2 h-full flex flex-col">
                {/* Day header */}
                <div className="text-center mb-1">
                  <p
                    className={cn(
                      "text-[9px] sm:text-xs font-medium uppercase",
                      today && "text-primary"
                    )}
                  >
                    {format(day, "EEEEE", { locale: nb })}
                  </p>
                  <p
                    className={cn(
                      "text-sm sm:text-lg font-bold leading-none",
                      today && "text-primary"
                    )}
                  >
                    {format(day, "d")}
                  </p>
                </div>

                {/* Hours badge */}
                {dayTotal > 0 && (
                  <div className="flex justify-center mb-1">
                    <Badge variant="secondary" className="text-[9px] sm:text-xs px-1 py-0">
                      {dayTotal.toFixed(1)}t
                    </Badge>
                  </div>
                )}

                {/* Entry indicators */}
                <div className="flex-1 flex flex-col items-center justify-center gap-0.5 overflow-hidden">
                  {/* Show schedule indicators */}
                  {daySchedules.slice(0, 2).map((schedule) => {
                    const confirmed = isScheduleConfirmed(schedule);
                    return (
                      <div
                        key={`schedule-${schedule.id}`}
                        className={cn(
                          "w-full h-1.5 sm:h-2 rounded-full",
                          confirmed ? "bg-green-500" : "bg-blue-400"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!confirmed) handleConfirmSchedule(schedule);
                        }}
                      />
                    );
                  })}
                  
                  {/* Show entry indicators */}
                  {dayEntries.filter(e => e.source !== "work_schedule").slice(0, 2).map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "w-full h-1.5 sm:h-2 rounded-full",
                        entry.status === "approved" ? "bg-green-500" :
                        entry.status === "submitted" ? "bg-primary" :
                        entry.status === "rejected" ? "bg-destructive" :
                        entry.source === "qr_clock" ? "bg-purple-500" :
                        "bg-muted-foreground"
                      )}
                    />
                  ))}
                  
                  {/* Show +N if more entries */}
                  {(daySchedules.length + dayEntries.length) > 2 && (
                    <span className="text-[8px] text-muted-foreground">
                      +{daySchedules.length + dayEntries.length - 2}
                    </span>
                  )}
                </div>

                {/* Add button - only visible on larger screens */}
                <div className="hidden sm:block mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-5 text-[10px] p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDayEditor(day);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
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
