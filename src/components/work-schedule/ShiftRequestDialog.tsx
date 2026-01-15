import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useShiftRequests, ShiftRequestType } from "@/hooks/useShiftRequests";
import { WorkSchedule } from "@/hooks/useWorkSchedules";
import { LOCATIONS, ROLES } from "./ShiftCalendar";
import { useAuth } from "@/contexts/AuthContext";

interface ShiftRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: WorkSchedule | null;
  requestType: ShiftRequestType;
}

export function ShiftRequestDialog({ open, onOpenChange, shift, requestType }: ShiftRequestDialogProps) {
  const { profile } = useAuth();
  const { users } = useCompanyUsers();
  const { createRequest } = useShiftRequests();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [isOpenRequest, setIsOpenRequest] = useState(false);
  const [proposedDate, setProposedDate] = useState(shift?.schedule_date || "");
  const [proposedStartTime, setProposedStartTime] = useState(shift?.start_time?.substring(0, 5) || "08:00");
  const [proposedEndTime, setProposedEndTime] = useState(shift?.end_time?.substring(0, 5) || "16:00");
  const [proposedLocation, setProposedLocation] = useState(shift?.location || "");
  const [proposedRole, setProposedRole] = useState(shift?.shift_role || "");
  const [absenceReason, setAbsenceReason] = useState("");
  const [notes, setNotes] = useState("");

  const otherUsers = users.filter(u => u.id !== profile?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const targetUser = otherUsers.find(u => u.id === targetEmployeeId);

    const success = await createRequest({
      request_type: requestType,
      schedule_id: shift?.id,
      target_employee_id: targetEmployeeId || undefined,
      target_employee_name: targetUser ? `${targetUser.first_name || ""} ${targetUser.last_name || ""}`.trim() : undefined,
      is_open_request: isOpenRequest,
      proposed_date: proposedDate || undefined,
      proposed_start_time: proposedStartTime || undefined,
      proposed_end_time: proposedEndTime || undefined,
      proposed_location: proposedLocation || undefined,
      proposed_role: proposedRole || undefined,
      absence_reason: absenceReason || undefined,
      request_notes: notes || undefined,
    });

    if (success) {
      onOpenChange(false);
      // Reset form
      setTargetEmployeeId("");
      setIsOpenRequest(false);
      setAbsenceReason("");
      setNotes("");
    }

    setIsSubmitting(false);
  };

  const getTitle = () => {
    switch (requestType) {
      case "swap": return "Be om vaktbytte";
      case "availability": return "Legg ut vakt som ledig";
      case "time_change": return "Be om tidsendring";
      case "new_shift": return "Be om ny vakt";
      case "absence": return "Meld fravær";
    }
  };

  const getDescription = () => {
    switch (requestType) {
      case "swap": return "Send en bytteforespørsel til en kollega";
      case "availability": return "Legg ut vakten så andre kan ta den over";
      case "time_change": return "Foreslå endret tid for vakten";
      case "new_shift": return "Be om å jobbe en ekstra vakt";
      case "absence": return "Meld at du ikke kan jobbe denne vakten";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogDescription>{getDescription()}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Show current shift info */}
            {shift && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="font-medium">{format(new Date(shift.schedule_date), "EEEE d. MMMM", { locale: nb })}</div>
                <div className="text-muted-foreground">
                  {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                  {shift.location && ` • ${LOCATIONS[shift.location]?.label || shift.location}`}
                </div>
              </div>
            )}

            {/* Swap specific */}
            {requestType === "swap" && (
              <>
                <div className="flex items-center justify-between">
                  <Label>Åpen for alle</Label>
                  <Switch checked={isOpenRequest} onCheckedChange={setIsOpenRequest} />
                </div>
                {!isOpenRequest && (
                  <div className="space-y-2">
                    <Label>Bytt med</Label>
                    <Select value={targetEmployeeId} onValueChange={setTargetEmployeeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kollega" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {/* Availability */}
            {requestType === "availability" && (
              <p className="text-sm text-muted-foreground">
                Vakten blir lagt ut som ledig. Andre ansatte kan melde interesse, og leder godkjenner endelig.
              </p>
            )}

            {/* Time change */}
            {requestType === "time_change" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ny starttid</Label>
                  <Input
                    type="time"
                    value={proposedStartTime}
                    onChange={(e) => setProposedStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ny sluttid</Label>
                  <Input
                    type="time"
                    value={proposedEndTime}
                    onChange={(e) => setProposedEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* New shift */}
            {requestType === "new_shift" && (
              <>
                <div className="space-y-2">
                  <Label>Dato</Label>
                  <Input
                    type="date"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fra</Label>
                    <Input
                      type="time"
                      value={proposedStartTime}
                      onChange={(e) => setProposedStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Til</Label>
                    <Input
                      type="time"
                      value={proposedEndTime}
                      onChange={(e) => setProposedEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sted</Label>
                  <Select value={proposedLocation || "__none__"} onValueChange={(v) => setProposedLocation(v === "__none__" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg sted" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Ikke valgt</SelectItem>
                      {Object.entries(LOCATIONS).map(([key, loc]) => (
                        <SelectItem key={key} value={key}>{loc.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Absence */}
            {requestType === "absence" && (
              <div className="space-y-2">
                <Label>Grunn for fravær</Label>
                <Select value={absenceReason} onValueChange={setAbsenceReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg årsak" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sykdom</SelectItem>
                    <SelectItem value="child_sick">Sykt barn</SelectItem>
                    <SelectItem value="personal">Personlige årsaker</SelectItem>
                    <SelectItem value="appointment">Avtale (lege, tannlege etc.)</SelectItem>
                    <SelectItem value="other">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes for all */}
            <div className="space-y-2">
              <Label>Merknad (valgfritt)</Label>
              <Textarea
                placeholder="Legg til en beskjed..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sender..." : "Send forespørsel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
