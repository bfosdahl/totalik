import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useStandardWorkSchedules } from "@/hooks/useStandardWorkSchedules";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LOCATIONS } from "./ShiftCalendar";
import { Trash2, Plus, Loader2, CalendarPlus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { nb } from "date-fns/locale";

interface StandardScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedWeek: Date;
  onSchedulesGenerated?: () => void;
}

const DAY_OPTIONS = [
  { index: 1, name: "Mandag", short: "Man" },
  { index: 2, name: "Tirsdag", short: "Tir" },
  { index: 3, name: "Onsdag", short: "Ons" },
  { index: 4, name: "Torsdag", short: "Tor" },
  { index: 5, name: "Fredag", short: "Fre" },
  { index: 6, name: "Lørdag", short: "Lør" },
  { index: 0, name: "Søndag", short: "Søn" },
];

const DAY_NAMES = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];

export function StandardScheduleDialog({ open, onOpenChange, selectedWeek, onSchedulesGenerated }: StandardScheduleDialogProps) {
  const { users } = useCompanyUsers();
  const { profile } = useAuth();
  const { schedules, createSchedule, deleteSchedule, generateWeekSchedules, generateMonthSchedules, isLoading } = useStandardWorkSchedules();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newSchedule, setNewSchedule] = useState({
    start_time: "08:00",
    end_time: "16:00",
    location: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMonth, setIsGeneratingMonth] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);

  // Month selector state
  const [targetMonth, setTargetMonth] = useState<Date>(new Date());

  // Quick plan state
  const [quickPlan, setQuickPlan] = useState({
    start_time: "09:00",
    end_time: "17:00",
    location: "",
    selectedDays: [1, 2, 3, 4, 5] as number[],
  });

  const employeeSchedules = selectedEmployee 
    ? schedules.filter(s => s.employee_id === selectedEmployee)
    : [];

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort((a, b) => {
            const orderA = a === 0 ? 7 : a;
            const orderB = b === 0 ? 7 : b;
            return orderA - orderB;
          })
    );
  };

  const toggleQuickDay = (dayIndex: number) => {
    setQuickPlan(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayIndex)
        ? prev.selectedDays.filter(d => d !== dayIndex)
        : [...prev.selectedDays, dayIndex].sort((a, b) => {
            const orderA = a === 0 ? 7 : a;
            const orderB = b === 0 ? 7 : b;
            return orderA - orderB;
          })
    }));
  };

  const handleAddSchedules = async () => {
    if (!selectedEmployee) {
      toast.error("Velg en ansatt først");
      return;
    }
    if (selectedDays.length === 0) {
      toast.error("Velg minst én dag");
      return;
    }

    setIsAdding(true);
    let created = 0;
    let skipped = 0;
    
    for (const dayIndex of selectedDays) {
      const exists = employeeSchedules.some(s => s.day_of_week === dayIndex);
      if (exists) { skipped++; continue; }
      const success = await createSchedule({
        employee_id: selectedEmployee,
        day_of_week: dayIndex,
        start_time: newSchedule.start_time,
        end_time: newSchedule.end_time,
        location: newSchedule.location || undefined,
      });
      if (success) created++;
    }
    
    if (created > 0) toast.success(`${created} dag${created > 1 ? 'er' : ''} lagt til`);
    if (skipped > 0) toast.info(`${skipped} dag${skipped > 1 ? 'er' : ''} hoppet over (finnes allerede)`);
    setIsAdding(false);
  };

  const handleGenerateWeek = async () => {
    setIsGenerating(true);
    await generateWeekSchedules(selectedWeek);
    onSchedulesGenerated?.();
    setIsGenerating(false);
  };

  const handleGenerateMonth = async () => {
    setIsGeneratingMonth(true);
    await generateMonthSchedules(targetMonth);
    onSchedulesGenerated?.();
    setIsGeneratingMonth(false);
  };

  const handleBulkAddMonth = async () => {
    if (!selectedEmployee) {
      toast.error("Velg en ansatt først");
      return;
    }
    if (quickPlan.selectedDays.length === 0) {
      toast.error("Velg minst én ukedag");
      return;
    }

    setIsBulkAdding(true);

    const selectedUser = users.find(u => u.id === selectedEmployee);
    const empName = `${selectedUser?.first_name || ""} ${selectedUser?.last_name || ""}`.trim() || selectedUser?.email || "Ukjent";

    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const daysToCreate = allDays.filter(day => quickPlan.selectedDays.includes(getDay(day)));

    // Build all rows to insert at once
    const rows = daysToCreate.map(day => ({
      company_id: profile?.company_id,
      employee_id: selectedEmployee,
      employee_name: empName,
      schedule_date: format(day, "yyyy-MM-dd"),
      start_time: quickPlan.start_time,
      end_time: quickPlan.end_time,
      schedule_type: "planned" as const,
      location: quickPlan.location || null,
      created_by_id: profile?.id,
      created_by_name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.email || "Ukjent",
    }));

    try {
      const { error, data } = await supabase
        .from("work_schedules")
        .upsert(rows, { onConflict: "company_id,employee_id,schedule_date,schedule_type", ignoreDuplicates: true })
        .select();

      if (error) throw error;

      const created = data?.length || 0;
      const skipped = rows.length - created;

      if (created > 0) toast.success(`${created} vakter opprettet for ${format(targetMonth, "MMMM yyyy", { locale: nb })}`);
      if (skipped > 0) toast.info(`${skipped} vakter hoppet over (finnes allerede)`);
    } catch (error) {
      console.error("Error bulk creating schedules:", error);
      // Fallback: insert one by one
      let created = 0;
      for (const row of rows) {
        const { error: insertError } = await supabase.from("work_schedules").insert(row);
        if (!insertError) created++;
      }
      if (created > 0) toast.success(`${created} vakter opprettet for ${format(targetMonth, "MMMM yyyy", { locale: nb })}`);
    }
    
    onSchedulesGenerated?.();
    setIsBulkAdding(false);
  };

  const selectedUser = users.find(u => u.id === selectedEmployee);
  const targetMonthName = format(targetMonth, "MMMM yyyy", { locale: nb });

  // Count how many days would be created
  const daysInMonth = (() => {
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return allDays.filter(day => quickPlan.selectedDays.includes(getDay(day))).length;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Faste arbeidstider & Planlegger</DialogTitle>
          <DialogDescription>
            Sett opp faste arbeidstider eller planlegg vakter for en hel måned
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee selector */}
          <div className="space-y-2">
            <Label>Velg ansatt</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Velg ansatt" />
              </SelectTrigger>
              <SelectContent>
                {(users || []).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month selector */}
          <div className="space-y-2">
            <Label>Velg måned</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTargetMonth(prev => subMonths(prev, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="flex-1 text-center font-medium capitalize">
                {targetMonthName}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTargetMonth(prev => addMonths(prev, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {selectedEmployee && (
            <>
              {/* Quick month planner */}
              <div className="space-y-3 p-3 border rounded-lg bg-primary/5 border-primary/20">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4" />
                  Planlegg hele {format(targetMonth, "MMMM", { locale: nb })} for {selectedUser?.first_name}
                </Label>
                
                {/* Day selection for quick plan */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Hvilke ukedager?</Label>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2"
                        onClick={() => setQuickPlan(p => ({ ...p, selectedDays: [1,2,3,4,5] }))}>
                        Man-Fre
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2"
                        onClick={() => setQuickPlan(p => ({ ...p, selectedDays: [1,2,3,4,5,6,0] }))}>
                        Alle
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((day) => (
                      <Badge
                        key={day.index}
                        variant={quickPlan.selectedDays.includes(day.index) ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleQuickDay(day.index)}
                      >
                        {day.short}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Time and location */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Fra</Label>
                    <Input type="time" value={quickPlan.start_time}
                      onChange={(e) => setQuickPlan(p => ({ ...p, start_time: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Til</Label>
                    <Input type="time" value={quickPlan.end_time}
                      onChange={(e) => setQuickPlan(p => ({ ...p, end_time: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sted</Label>
                    <Select
                      value={quickPlan.location || "__none__"}
                      onValueChange={(v) => setQuickPlan(p => ({ ...p, location: v === "__none__" ? "" : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Valgfritt" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-</SelectItem>
                        {Object.entries(LOCATIONS).map(([key, loc]) => (
                          <SelectItem key={key} value={key}>{loc.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleBulkAddMonth}
                  disabled={isBulkAdding || quickPlan.selectedDays.length === 0}
                  className="w-full"
                >
                  {isBulkAdding ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <CalendarPlus className="w-4 h-4 mr-1" />
                  )}
                  Opprett {daysInMonth} vakter for {format(targetMonth, "MMMM", { locale: nb })}
                </Button>
              </div>

              {/* Existing standard schedules */}
              <div className="space-y-2">
                <Label>Faste tider for {selectedUser?.first_name}</Label>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : employeeSchedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Ingen faste arbeidstider registrert
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {employeeSchedules
                      .sort((a, b) => {
                        const orderA = a.day_of_week === 0 ? 7 : a.day_of_week;
                        const orderB = b.day_of_week === 0 ? 7 : b.day_of_week;
                        return orderA - orderB;
                      })
                      .map((schedule) => (
                        <div key={schedule.id}
                          className="flex items-center gap-1 px-2 py-1 border rounded-md bg-muted/30 text-sm">
                          <span className="font-medium">{DAY_NAMES[schedule.day_of_week].substring(0, 3)}</span>
                          <span className="text-muted-foreground">
                            {schedule.start_time.substring(0, 5)}-{schedule.end_time.substring(0, 5)}
                          </span>
                          {schedule.location && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              {LOCATIONS[schedule.location]?.label || schedule.location}
                            </Badge>
                          )}
                          <Button variant="ghost" size="icon" className="h-5 w-5 ml-1"
                            onClick={() => deleteSchedule(schedule.id)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Add standard schedule */}
              <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                <Label className="text-sm font-medium">Legg til faste arbeidstider</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Velg dager</Label>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2"
                        onClick={() => setSelectedDays([1,2,3,4,5])}>Man-Fre</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2"
                        onClick={() => setSelectedDays([1,2,3,4,5,6,0])}>Alle</Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((day) => {
                      const isSelected = selectedDays.includes(day.index);
                      const alreadyExists = employeeSchedules.some(s => s.day_of_week === day.index);
                      return (
                        <Badge key={day.index}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${alreadyExists ? 'opacity-50' : ''}`}
                          onClick={() => !alreadyExists && toggleDay(day.index)}>
                          {day.short}{alreadyExists && " ✓"}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Fra</Label>
                    <Input type="time" value={newSchedule.start_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Til</Label>
                    <Input type="time" value={newSchedule.end_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sted</Label>
                    <Select
                      value={newSchedule.location || "__none__"}
                      onValueChange={(v) => setNewSchedule({ ...newSchedule, location: v === "__none__" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Valgfritt" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-</SelectItem>
                        {Object.entries(LOCATIONS).map(([key, loc]) => (
                          <SelectItem key={key} value={key}>{loc.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="button" size="sm" onClick={handleAddSchedules}
                  disabled={isAdding || selectedDays.length === 0} className="w-full">
                  {isAdding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                  Legg til {selectedDays.length > 0 ? `${selectedDays.length} dag${selectedDays.length > 1 ? 'er' : ''}` : 'dager'}
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="default" onClick={handleGenerateWeek}
              disabled={isGenerating || isGeneratingMonth || schedules.length === 0}
              className="w-full sm:w-auto">
              {isGenerating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CalendarPlus className="w-4 h-4 mr-1" />}
              Generer ukeplan
            </Button>
            <Button variant="secondary" onClick={handleGenerateMonth}
              disabled={isGenerating || isGeneratingMonth || schedules.length === 0}
              className="w-full sm:w-auto">
              {isGeneratingMonth ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Calendar className="w-4 h-4 mr-1" />}
              Generer {targetMonthName}
            </Button>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Lukk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
