import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CompanyUser } from "@/hooks/useCompanyUsers";
import { StandardWorkSchedule, useStandardWorkSchedules } from "@/hooks/useStandardWorkSchedules";
import { LOCATIONS, ROLES } from "./ShiftCalendar";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StandardScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: CompanyUser[];
}

const DAY_NAMES = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];

export function StandardScheduleDialog({ open, onOpenChange, users }: StandardScheduleDialogProps) {
  const { schedules, createSchedule, deleteSchedule, isLoading } = useStandardWorkSchedules();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 1,
    start_time: "08:00",
    end_time: "16:00",
    location: "",
    shift_role: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const employeeSchedules = selectedEmployee 
    ? schedules.filter(s => s.employee_id === selectedEmployee)
    : [];

  const handleAddSchedule = async () => {
    if (!selectedEmployee) {
      toast.error("Velg en ansatt først");
      return;
    }

    setIsAdding(true);
    await createSchedule({
      employee_id: selectedEmployee,
      day_of_week: newSchedule.day_of_week,
      start_time: newSchedule.start_time,
      end_time: newSchedule.end_time,
      location: newSchedule.location || undefined,
      shift_role: newSchedule.shift_role || undefined,
    });
    setIsAdding(false);
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
                {users.map((user) => (
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
                  <div className="space-y-2">
                    {employeeSchedules
                      .sort((a, b) => a.day_of_week - b.day_of_week)
                      .map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-2 border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{DAY_NAMES[schedule.day_of_week]}</Badge>
                            <span className="text-sm">
                              {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                            </span>
                            {schedule.location && (
                              <Badge variant="secondary" className="text-xs">
                                {LOCATIONS[schedule.location]?.label || schedule.location}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteSchedule(schedule.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Add new schedule */}
              <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                <Label className="text-sm font-medium">Legg til ny fast tid</Label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Dag</Label>
                    <Select
                      value={String(newSchedule.day_of_week)}
                      onValueChange={(v) => setNewSchedule({ ...newSchedule, day_of_week: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_NAMES.map((day, index) => (
                          <SelectItem key={index} value={String(index)}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Sted</Label>
                    <Select
                      value={newSchedule.location}
                      onValueChange={(v) => setNewSchedule({ ...newSchedule, location: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Valgfritt" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ingen</SelectItem>
                        {Object.entries(LOCATIONS).map(([key, loc]) => (
                          <SelectItem key={key} value={key}>
                            {loc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddSchedule}
                  disabled={isAdding}
                  className="w-full"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-1" />
                  )}
                  Legg til
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
