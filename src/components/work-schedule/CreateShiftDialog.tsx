import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useWorkSchedules } from "@/hooks/useWorkSchedules";
import { LOCATIONS, ROLES } from "./ShiftCalendar";
import { toast } from "sonner";

interface CreateShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultDate?: string;
  editShift?: {
    id: string;
    employee_id: string;
    employee_name: string;
    schedule_date: string;
    start_time: string;
    end_time: string;
    schedule_type: "planned" | "actual";
    location?: string | null;
    shift_role?: string | null;
    is_responsible?: boolean;
    notes?: string | null;
  };
}

export interface ShiftFormData {
  employee_id: string;
  employee_name: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  schedule_type: "planned" | "actual";
  location?: string;
  shift_role?: string;
  is_responsible: boolean;
  notes: string;
}

export function CreateShiftDialog({ open, onOpenChange, onSuccess, defaultDate, editShift }: CreateShiftDialogProps) {
  const { users } = useCompanyUsers();
  const { createSchedule, updateSchedule } = useWorkSchedules();
  
  const isEditMode = !!editShift;
  
  const [formData, setFormData] = useState<ShiftFormData>({
    employee_id: "",
    employee_name: "",
    schedule_date: defaultDate || "",
    start_time: "",
    end_time: "",
    schedule_type: "planned",
    location: undefined,
    shift_role: undefined,
    is_responsible: false,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editShift) {
      setFormData({
        employee_id: editShift.employee_id,
        employee_name: editShift.employee_name,
        schedule_date: editShift.schedule_date,
        start_time: editShift.start_time.substring(0, 5),
        end_time: editShift.end_time.substring(0, 5),
        schedule_type: editShift.schedule_type,
        location: editShift.location || undefined,
        shift_role: editShift.shift_role || undefined,
        is_responsible: editShift.is_responsible || false,
        notes: editShift.notes || "",
      });
    } else if (defaultDate) {
      setFormData(prev => ({ ...prev, schedule_date: defaultDate }));
    }
  }, [defaultDate, editShift]);

  const handleEmployeeChange = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setFormData({
        ...formData,
        employee_id: userId,
        employee_name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Ukjent",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const scheduleData = {
      employee_id: formData.employee_id,
      employee_name: formData.employee_name,
      schedule_date: formData.schedule_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      schedule_type: formData.schedule_type,
      location: formData.location,
      shift_role: formData.shift_role,
      is_responsible: formData.is_responsible,
      notes: formData.notes,
    };

    const result = isEditMode
      ? await updateSchedule(editShift!.id, scheduleData)
      : await createSchedule(scheduleData);
    
    if (result) {
      toast.success(isEditMode ? "Vakt oppdatert" : "Vakt opprettet");
      setFormData({
        employee_id: "",
        employee_name: "",
        schedule_date: "",
        start_time: "",
        end_time: "",
        schedule_type: "planned",
        location: undefined,
        shift_role: undefined,
        is_responsible: false,
        notes: "",
      });
      onOpenChange(false);
      onSuccess?.();
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{isEditMode ? "Endre vakt" : "Ny vakt"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Rediger vaktdetaljer" : "Opprett en ny vakt med sted og rolle"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto pr-4">
            <div className="space-y-4 py-4">
              {/* Employee */}
              <div className="space-y-2">
                <Label htmlFor="employee">Ansatt *</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={handleEmployeeChange}
                  required
                >
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

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="schedule_type">Type</Label>
                <Select
                  value={formData.schedule_type}
                  onValueChange={(value: "planned" | "actual") => 
                    setFormData({ ...formData, schedule_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planlagt</SelectItem>
                    <SelectItem value="actual">Faktisk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <Label htmlFor="schedule_date">Dato *</Label>
                <Input
                  id="schedule_date"
                  type="date"
                  required
                  value={formData.schedule_date}
                  onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Fra *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Til *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Sted/område</Label>
                <Select
                  value={formData.location || "__none__"}
                  onValueChange={(value) => 
                    setFormData({ ...formData, location: value === "__none__" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg sted" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Ingen valgt</SelectItem>
                    {Object.entries(LOCATIONS).map(([key, loc]) => (
                      <SelectItem key={key} value={key}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Rolle</Label>
                <Select
                  value={formData.shift_role || "__none__"}
                  onValueChange={(value) => 
                    setFormData({ ...formData, shift_role: value === "__none__" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg rolle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Ingen valgt</SelectItem>
                    {Object.entries(ROLES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Responsible */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_responsible"
                  checked={formData.is_responsible}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_responsible: checked as boolean })
                  }
                />
                <Label htmlFor="is_responsible" className="cursor-pointer">
                  Ansvarsvakt (har ansvar for driften denne vakten)
                </Label>
              </div>


              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notater</Label>
                <Textarea
                  id="notes"
                  placeholder="Skriv eventuelle notater..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Lagrer..." : "Lagre vakt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
