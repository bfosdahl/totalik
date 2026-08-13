import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { CreateAbsence } from "@/hooks/useEmployeeAbsence";
import { t } from "@/i18n/t";

interface RegisterAbsenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (absence: CreateAbsence) => Promise<boolean>;
  forSelf?: boolean; // If true, only register for current user
}

const ABSENCE_TYPES = [
  { value: "egenmelding", label: t("auto.egenmelding") },
  { value: "sykmelding", label: t("auto.sykmelding") },
  { value: "permisjon", label: t("auto.permisjon") },
  { value: "ferie", label: t("auto.ferie") },
  { value: "annet", label: t("auto.annet_fravaer") },
];

export function RegisterAbsenceDialog({
  open,
  onOpenChange,
  onSubmit,
  forSelf = false,
}: RegisterAbsenceDialogProps) {
  const { profile } = useAuth();
  const { employees } = useEmployees();
  
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    forSelf && profile?.id ? profile.id : ""
  );
  const [absenceType, setAbsenceType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setSelectedEmployee(forSelf && profile?.id ? profile.id : "");
    setAbsenceType("");
    setStartDate(undefined);
    setEndDate(undefined);
    setReason("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !absenceType || !startDate || !endDate) {
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit({
      employee_id: selectedEmployee,
      absence_type: absenceType,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      reason: reason || undefined,
      notes: notes || undefined,
    });

    setIsSubmitting(false);
    if (success) {
      resetForm();
      onOpenChange(false);
    }
  };

  const isValid = selectedEmployee && absenceType && startDate && endDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("auto.registrer_fravaer")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee selection (only if not for self) */}
          {!forSelf && (
            <div className="space-y-2">
              <Label>{t("auto.ansatt")}</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder={t("auto.velg_ansatt")} />
                </SelectTrigger>
                <SelectContent>
                  {(employees || []).map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Absence type */}
          <div className="space-y-2">
            <Label>{t("auto.type_fravaer")}</Label>
            <Select value={absenceType} onValueChange={setAbsenceType}>
              <SelectTrigger>
                <SelectValue placeholder={t("auto.velg_type")} />
              </SelectTrigger>
              <SelectContent>
                {ABSENCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("auto.fra_dato")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "d. MMM yyyy", { locale: nb }) : "Velg dato"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={nb}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t("auto.til_dato")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "d. MMM yyyy", { locale: nb }) : "Velg dato"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    locale={nb}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>{t("auto.aarsak_valgfritt")}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("auto.kort_beskrivelse_av_aarsak")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notater (valgfritt)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("auto.eventuelle_tilleggsopplysninger")}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("auto.avbryt")}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Registrerer..." : "Registrer fravær"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
