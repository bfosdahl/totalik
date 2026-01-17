import { useState } from "react";
import { format, addDays, isSameDay, startOfWeek } from "date-fns";
import { nb } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2, QrCode, Calendar, CheckCircle, Clock } from "lucide-react";
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
import { StartStopTimer } from "./StartStopTimer";
import { OvertimeWarning } from "./OvertimeWarning";
import { CopyPreviousDayButton } from "./CopyPreviousDayButton";
import { WeeklySummaryChart } from "./WeeklySummaryChart";
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

interface DailyTimeViewProps {
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

const statusLabels: Record<string, string> = {
  draft: "Kladd",
  submitted: "Innsendt",
  approved: "Godkjent",
  rejected: "Avvist",
  pending_confirmation: "Venter bekreftelse",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/20 text-primary",
  approved: "bg-green-500/20 text-green-700 dark:text-green-400",
  rejected: "bg-destructive/20 text-destructive",
  pending_confirmation: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
};

export function DailyTimeView({
  entries,
  onCreateEntry,
  onDeleteEntry,
  userId,
}: DailyTimeViewProps) {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const userEntries = entries.filter((e) => e.user_id === userId);
  const dayEntries = userEntries.filter((e) => isSameDay(new Date(e.entry_date), currentDate));
  const dayTotal = dayEntries.reduce((sum, e) => sum + Number(e.hours), 0);

  // Calculate weekly hours for overtime warning
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weeklyHours = userEntries
    .filter((e) => {
      const entryDate = new Date(e.entry_date);
      const weekEnd = addDays(weekStart, 6);
      return entryDate >= weekStart && entryDate <= weekEnd;
    })
    .reduce((sum, e) => sum + Number(e.hours), 0);

  // Handle timer completion
  const handleTimerComplete = async (hours: number) => {
    const success = await onCreateEntry({
      entry_date: format(currentDate, "yyyy-MM-dd"),
      hours,
      description: `Automatisk registrert (${format(new Date(), "HH:mm")})`,
    });
    if (success) {
      toast.success(`${hours.toFixed(2)} timer registrert fra tidtaker`);
    }
  };

  // Get user's planned schedules for the current day
  const daySchedules = schedules.filter(s => 
    s.employee_id === profile?.id && 
    s.schedule_type === "planned" &&
    isSameDay(new Date(s.schedule_date), currentDate)
  );

  const isScheduleConfirmed = (schedule: WorkSchedule): boolean => {
    return entries.some(e => 
      e.user_id === userId &&
      e.entry_date === schedule.schedule_date &&
      e.source === "work_schedule"
    );
  };

  const calculateScheduleHours = (schedule: WorkSchedule): number => {
    const [startHour, startMin] = schedule.start_time.split(":").map(Number);
    const [endHour, endMin] = schedule.end_time.split(":").map(Number);
    return endHour - startHour + (endMin - startMin) / 60;
  };

  const handleConfirmSchedule = async (schedule: WorkSchedule) => {
    setConfirmingScheduleId(schedule.id);
    const success = await confirmScheduleEntry(`schedule_${schedule.id}`);
    if (success) {
      await refetchEntries();
    }
    setConfirmingScheduleId(null);
  };

  const goToPreviousDay = () => {
    setCurrentDate((prev) => addDays(prev, -1));
  };

  const goToNextDay = () => {
    setCurrentDate((prev) => addDays(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSubmit = async () => {
    if (!hours) return;

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
      entry_date: format(currentDate, "yyyy-MM-dd"),
      hours: hoursNum,
      project_id: selectedProject ? projectId : undefined,
      project_name: projectName,
      description: description || undefined,
    });

    if (success) {
      setDialogOpen(false);
      setHours("");
      setProjectId("");
      setCustomProject("");
      setDescription("");
    }
    setIsSubmitting(false);
  };

  const isToday = isSameDay(currentDate, new Date());

  return (
    <div className="space-y-4">
      {/* Start/Stop Timer */}
      <StartStopTimer 
        onComplete={handleTimerComplete}
        isDisabled={!isToday}
      />

      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant={isToday ? "default" : "ghost"} 
            size="sm" 
            onClick={goToToday} 
            className="h-9 px-3"
          >
            I dag
          </Button>
        </div>
        
        <CopyPreviousDayButton
          entries={entries}
          userId={userId}
          currentDate={currentDate}
          onCopy={onCreateEntry}
        />
      </div>

      {/* Current date display with day total */}
      <div className={cn(
        "flex items-center justify-between py-3 px-4 rounded-lg",
        isToday ? "bg-primary/10" : "bg-muted"
      )}>
        <div>
          <p className={cn(
            "text-xl font-bold",
            isToday && "text-primary"
          )}>
            {format(currentDate, "EEEE", { locale: nb })}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(currentDate, "d. MMMM yyyy", { locale: nb })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{dayTotal.toFixed(1)}t</p>
          <p className="text-xs text-muted-foreground">i dag</p>
        </div>
      </div>

      {/* Overtime Warning */}
      <OvertimeWarning
        weeklyHours={weeklyHours}
        weeklyLimit={40}
        dailyHours={dayTotal}
        dailyLimit={9}
      />

      {/* Planned schedules */}
      {daySchedules.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Planlagte vakter
          </p>
          {daySchedules.map((schedule) => {
            const confirmed = isScheduleConfirmed(schedule);
            const scheduleHours = calculateScheduleHours(schedule);
            
            return (
              <Card key={schedule.id} className={cn(
                "border-l-4",
                confirmed ? "border-l-green-500" : "border-l-blue-500"
              )}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-lg font-bold">{scheduleHours.toFixed(1)}t</p>
                      </div>
                      <div>
                        <p className="font-medium">
                          {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                        </p>
                        {schedule.location && (
                          <p className="text-xs text-muted-foreground">{schedule.location}</p>
                        )}
                        {schedule.shift_role && (
                          <p className="text-xs text-muted-foreground">{schedule.shift_role}</p>
                        )}
                      </div>
                    </div>
                    {confirmed ? (
                      <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Bekreftet
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmSchedule(schedule)}
                        disabled={confirmingScheduleId === schedule.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Bekreft
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Time entries */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Registrerte timer
          </p>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Legg til
          </Button>
        </div>

        {dayEntries.filter(e => e.source !== "work_schedule").length === 0 && daySchedules.filter(s => isScheduleConfirmed(s)).length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ingen timer registrert</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Registrer timer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {/* Show confirmed work schedules as entries */}
            {dayEntries.filter(e => e.source === "work_schedule").map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <p className="text-lg font-bold">{Number(entry.hours).toFixed(1)}t</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Bekreftet vakt</span>
                        </div>
                        {entry.clock_in && entry.clock_out && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.clock_in), "HH:mm")} - {format(new Date(entry.clock_out), "HH:mm")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={statusColors[entry.status]}>
                      {statusLabels[entry.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Show regular time entries */}
            {dayEntries.filter(e => e.source !== "work_schedule").map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <p className="text-lg font-bold">{Number(entry.hours).toFixed(1)}t</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {entry.source === "qr_clock" && (
                            <QrCode className="h-4 w-4 text-purple-500 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">
                            {entry.source === "qr_clock" 
                              ? "QR-stempling" 
                              : entry.project_name || "Manuell registrering"}
                          </span>
                        </div>
                        {entry.description && (
                          <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
                        )}
                        {entry.source === "qr_clock" && entry.clock_in && entry.clock_out && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.clock_in), "HH:mm")} - {format(new Date(entry.clock_out), "HH:mm")}
                            {entry.total_break_minutes ? ` (${entry.total_break_minutes} min pause)` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[entry.status]}>
                        {statusLabels[entry.status]}
                      </Badge>
                      {entry.source !== "qr_clock" && (entry.status === "draft" ||
                        entry.status === "submitted" ||
                        entry.status === "rejected") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onDeleteEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add entry dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Registrer timer - {format(currentDate, "EEEE d. MMMM", { locale: nb })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Timer *</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                placeholder="F.eks. 7.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>

            {hasByggModule && activeProjects.length > 0 && (
              <div className="space-y-2">
                <Label>Prosjekt (valgfritt)</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg prosjekt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ingen prosjekt</SelectItem>
                    {activeProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_number} - {project.project_name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Annet (skriv inn)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {projectId === "custom" && (
              <div className="space-y-2">
                <Label>Prosjektnavn</Label>
                <Input
                  placeholder="Skriv inn prosjektnavn"
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
                rows={2}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={!hours || isSubmitting}
            >
              {isSubmitting ? "Lagrer..." : "Registrer timer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weekly Summary Chart */}
      <WeeklySummaryChart
        entries={entries}
        userId={userId}
        weekStart={weekStart}
        dailyTarget={7.5}
      />
    </div>
  );
}
