import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useWorkSchedules } from "@/hooks/useWorkSchedules";
import { useShiftTasks, DEFAULT_SHIFT_TASKS } from "@/hooks/useShiftTasks";
import { LOCATIONS, ROLES } from "./ShiftCalendar";
import { X } from "lucide-react";
import { toast } from "sonner";

interface CreateShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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
  tasks: { name: string; type: string }[];
}

export function CreateShiftDialog({ open, onOpenChange, onSuccess }: CreateShiftDialogProps) {
  const { users } = useCompanyUsers();
  const { createSchedule } = useWorkSchedules();
  
  const [formData, setFormData] = useState<ShiftFormData>({
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
    tasks: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdScheduleId, setCreatedScheduleId] = useState<string | null>(null);

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

  const toggleTask = (task: { name: string; type: string }) => {
    const exists = formData.tasks.some(t => t.name === task.name);
    if (exists) {
      setFormData({
        ...formData,
        tasks: formData.tasks.filter(t => t.name !== task.name),
      });
    } else {
      setFormData({
        ...formData,
        tasks: [...formData.tasks, task],
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

    const result = await createSchedule(scheduleData);
    
    if (result) {
      toast.success("Vakt opprettet");
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
        tasks: [],
      });
      onOpenChange(false);
      onSuccess?.();
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ny vakt</DialogTitle>
            <DialogDescription>
              Opprett en ny vakt med sted, rolle og oppgaver
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
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

              {/* Tasks */}
              <div className="space-y-2">
                <Label>Oppgaver på vakten</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                  {DEFAULT_SHIFT_TASKS.map((task) => {
                    const isSelected = formData.tasks.some(t => t.name === task.name);
                    return (
                      <Badge
                        key={task.name}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleTask(task)}
                      >
                        {task.name}
                        {isSelected && <X className="w-3 h-3 ml-1" />}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Klikk for å velge oppgaver som skal utføres på vakten
                </p>
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
