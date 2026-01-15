import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useStandardWorkSchedules } from "@/hooks/useStandardWorkSchedules";
import { LOCATIONS } from "./ShiftCalendar";
import { Trash2, Plus, Loader2, CalendarPlus } from "lucide-react";
import { toast } from "sonner";

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
  const { schedules, createSchedule, deleteSchedule, generateWeekSchedules, isLoading } = useStandardWorkSchedules();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default: Mon-Fri
  const [newSchedule, setNewSchedule] = useState({
    start_time: "08:00",
    end_time: "16:00",
    location: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const employeeSchedules = selectedEmployee 
    ? schedules.filter(s => s.employee_id === selectedEmployee)
    : [];

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort((a, b) => {
            // Sort by weekday order (Mon=1 first, Sun=0 last)
            const orderA = a === 0 ? 7 : a;
            const orderB = b === 0 ? 7 : b;
            return orderA - orderB;
          })
    );
  };

  const selectWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  const selectAllDays = () => {
    setSelectedDays([1, 2, 3, 4, 5, 6, 0]);
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
      // Check if this day already exists
      const exists = employeeSchedules.some(s => s.day_of_week === dayIndex);
      if (exists) {
        skipped++;
        continue;
      }
      
      const success = await createSchedule({
        employee_id: selectedEmployee,
        day_of_week: dayIndex,
        start_time: newSchedule.start_time,
        end_time: newSchedule.end_time,
        location: newSchedule.location || undefined,
      });
      
      if (success) {
        created++;
      }
    }
    
    if (created > 0) {
      toast.success(`${created} dag${created > 1 ? 'er' : ''} lagt til`);
    }
    if (skipped > 0) {
      toast.info(`${skipped} dag${skipped > 1 ? 'er' : ''} hoppet over (finnes allerede)`);
    }
    
    setIsAdding(false);
  };

  const handleGenerateWeek = async () => {
    setIsGenerating(true);
    await generateWeekSchedules(selectedWeek);
    onSchedulesGenerated?.();
    setIsGenerating(false);
  };

  const selectedUser = users.find(u => u.id === selectedEmployee);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Faste arbeidstider</DialogTitle>
          <DialogDescription>
            Sett opp faste arbeidstider for ansatte som kan genereres automatisk til vaktplanen
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

          {selectedEmployee && (
            <>
              {/* Existing schedules for this employee */}
              <div className="space-y-2">
                <Label>Eksisterende faste tider for {selectedUser?.first_name}</Label>
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
                        <div
                          key={schedule.id}
                          className="flex items-center gap-1 px-2 py-1 border rounded-md bg-muted/30 text-sm"
                        >
                          <span className="font-medium">{DAY_NAMES[schedule.day_of_week].substring(0, 3)}</span>
                          <span className="text-muted-foreground">
                            {schedule.start_time.substring(0, 5)}-{schedule.end_time.substring(0, 5)}
                          </span>
                          {schedule.location && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              {LOCATIONS[schedule.location]?.label || schedule.location}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-1"
                            onClick={() => deleteSchedule(schedule.id)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Add new schedule */}
              <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                <Label className="text-sm font-medium">Legg til faste arbeidstider</Label>
                
                {/* Day selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Velg dager</Label>
                    <div className="flex gap-1">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs px-2"
                        onClick={selectWeekdays}
                      >
                        Man-Fre
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs px-2"
                        onClick={selectAllDays}
                      >
                        Alle
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((day) => {
                      const isSelected = selectedDays.includes(day.index);
                      const alreadyExists = employeeSchedules.some(s => s.day_of_week === day.index);
                      return (
                        <Badge
                          key={day.index}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${alreadyExists ? 'opacity-50' : ''}`}
                          onClick={() => !alreadyExists && toggleDay(day.index)}
                        >
                          {day.short}
                          {alreadyExists && " ✓"}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Time and location */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Fra</Label>
                    <Input
                      type="time"
                      value={newSchedule.start_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Til</Label>
                    <Input
                      type="time"
                      value={newSchedule.end_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sted</Label>
                    <Select
                      value={newSchedule.location || "__none__"}
                      onValueChange={(v) => setNewSchedule({ ...newSchedule, location: v === "__none__" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Valgfritt" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-</SelectItem>
                        {Object.entries(LOCATIONS).map(([key, loc]) => (
                          <SelectItem key={key} value={key}>
                            {loc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddSchedules}
                  disabled={isAdding || selectedDays.length === 0}
                  className="w-full"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-1" />
                  )}
                  Legg til {selectedDays.length > 0 ? `${selectedDays.length} dag${selectedDays.length > 1 ? 'er' : ''}` : 'dager'}
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="default" 
            onClick={handleGenerateWeek}
            disabled={isGenerating || schedules.length === 0}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <CalendarPlus className="w-4 h-4 mr-1" />
            )}
            Generer ukeplan
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
