import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIkMatTemperature, TemperatureLog } from "@/hooks/useIkMatTemperature";
import { Thermometer, AlertTriangle, CheckCircle2, AlertCircle, Pencil, PartyPopper, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getTemperatureGuideline,
  TrafficLightStatus,
  getStatusBgClass,
  getStatusTextClass,
  EQUIPMENT_TYPE_DEFAULTS,
} from "@/lib/temperatureGuidelines";
import { cn } from "@/lib/utils";

interface LogTemperatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedEquipmentId?: string | null;
  editLog?: TemperatureLog | null;
  /** When true, after saving the dialog auto-advances to the next equipment that still needs a log today. */
  autoAdvance?: boolean;
}

export function LogTemperatureDialog({
  open,
  onOpenChange,
  preSelectedEquipmentId,
  editLog,
  autoAdvance = true,
}: LogTemperatureDialogProps) {
  const {
    equipment,
    logTemperature,
    updateTemperatureLog,
    getEquipmentNeedingLog,
  } = useIkMatTemperature();

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [temperature, setTemperature] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [correctiveAction, setCorrectiveAction] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const isEditMode = !!editLog;

  // Snapshot initial pending count when dialog opens (for progress display)
  const [initialPending, setInitialPending] = useState(0);

  useEffect(() => {
    if (open) {
      if (editLog) {
        setSelectedEquipmentId(editLog.equipment_id);
        setTemperature(String(editLog.temperature));
        setNotes(editLog.notes || "");
        setCorrectiveAction(editLog.corrective_action || "");
      } else if (preSelectedEquipmentId) {
        setSelectedEquipmentId(preSelectedEquipmentId);
      }
      setAllDone(false);
      setCompletedCount(0);
      setInitialPending(getEquipmentNeedingLog().length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preSelectedEquipmentId, editLog]);

  // Auto-add minus for freezer when equipment changes (only in create mode)
  useEffect(() => {
    if (!isEditMode && selectedEquipmentId && temperature === '') {
      const equip = equipment.find(e => e.id === selectedEquipmentId);
      if (equip?.equipment_type === 'freezer') {
        setTemperature('-');
      }
    }
  }, [selectedEquipmentId, equipment, isEditMode, temperature]);

  const selectedEquip = equipment.find(e => e.id === selectedEquipmentId);

  const guideline = useMemo(() => {
    if (!selectedEquip || !temperature) return null;
    const temp = parseFloat(temperature);
    if (isNaN(temp)) return null;
    return getTemperatureGuideline(selectedEquip.equipment_type, temp);
  }, [selectedEquip, temperature]);

  const showCorrectiveAction = guideline && guideline.status !== 'green';

  const resetForm = (nextEquipmentId?: string) => {
    setSelectedEquipmentId(nextEquipmentId || "");
    setTemperature("");
    setNotes("");
    setCorrectiveAction("");
  };

  const handleSubmit = async () => {
    if (!selectedEquipmentId || !temperature) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && editLog) {
        await updateTemperatureLog.mutateAsync({
          id: editLog.id,
          equipment_id: selectedEquipmentId,
          temperature: parseFloat(temperature),
          notes: notes || undefined,
          corrective_action: correctiveAction || undefined,
        });
        resetForm();
        onOpenChange(false);
        return;
      }

      await logTemperature.mutateAsync({
        equipment_id: selectedEquipmentId,
        temperature: parseFloat(temperature),
        notes: notes || undefined,
        corrective_action: correctiveAction || undefined,
      });

      const newCompleted = completedCount + 1;
      setCompletedCount(newCompleted);

      if (autoAdvance) {
        // Find the next equipment that still needs a log (excluding the one we just logged)
        const stillPending = getEquipmentNeedingLog().filter(
          (e) => e.id !== selectedEquipmentId
        );

        if (stillPending.length > 0) {
          // Move on to next equipment
          resetForm(stillPending[0].id);
        } else {
          // All done — show celebration screen
          setAllDone(true);
          resetForm();
        }
      } else {
        resetForm(preSelectedEquipmentId || "");
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm(preSelectedEquipmentId || "");
    setAllDone(false);
    setCompletedCount(0);
    onOpenChange(false);
  };

  const getStatusIcon = (status: TrafficLightStatus) => {
    switch (status) {
      case 'green':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'yellow':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'red':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  };

  // Celebration screen — all daily measurements done
  if (allDone) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="sr-only">Alle målinger fullført</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <PartyPopper className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Bra jobba! 🎉</h2>
              <p className="text-muted-foreground">
                Alle dagens temperaturmålinger er registrert.
              </p>
              <p className="text-sm text-muted-foreground">
                {completedCount} av {initialPending || completedCount} målinger fullført
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={handleClose}>
              Ferdig
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Progress info for header (only when not editing and we're in a flow)
  const showProgress = !isEditMode && autoAdvance && initialPending > 1;
  const progressPct = initialPending > 0 ? (completedCount / initialPending) * 100 : 0;
  const remainingAfterThis = Math.max(0, initialPending - completedCount - 1);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? <Pencil className="h-5 w-5" /> : <Thermometer className="h-5 w-5" />}
            {isEditMode ? "Rediger måling" : "Registrer temperatur"}
          </DialogTitle>
        </DialogHeader>

        {showProgress && (
          <div className="space-y-1.5 -mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Måling {completedCount + 1} av {initialPending}</span>
              <span>{remainingAfterThis} gjenstår etter denne</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="equipment">Velg utstyr</Label>
            <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId} disabled={isEditMode}>
              <SelectTrigger>
                <SelectValue placeholder="Velg utstyr..." />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((equip) => (
                  <SelectItem key={equip.id} value={equip.id}>
                    {equip.name} ({EQUIPMENT_TYPE_DEFAULTS[equip.equipment_type as keyof typeof EQUIPMENT_TYPE_DEFAULTS]?.label})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEquip && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              <p>
                <strong>Type:</strong>{" "}
                {EQUIPMENT_TYPE_DEFAULTS[selectedEquip.equipment_type as keyof typeof EQUIPMENT_TYPE_DEFAULTS]?.label}
              </p>
              <p>
                <strong>Akseptabel temperatur:</strong>{" "}
                {selectedEquip.min_temp}°C til {selectedEquip.max_temp}°C
              </p>
              {selectedEquip.location && (
                <p><strong>Plassering:</strong> {selectedEquip.location}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="temperature">Målt temperatur (°C)</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 text-lg font-bold h-12 w-12"
                onClick={() => {
                  if (temperature.startsWith('-')) {
                    setTemperature(temperature.slice(1));
                  } else {
                    setTemperature('-' + temperature);
                  }
                }}
              >
                ±
              </Button>
              <Input
                id="temperature"
                type="text"
                inputMode="decimal"
                pattern="-?[0-9]*\.?[0-9]*"
                placeholder="f.eks. -20 eller 3.5"
                value={temperature}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || value === '-' || /^-?\d*\.?\d*$/.test(value)) {
                    setTemperature(value);
                  }
                }}
                className="text-lg font-mono h-12"
              />
            </div>
          </div>

          {/* Traffic Light Indicator */}
          {guideline && (
            <div
              className={cn(
                "rounded-lg border p-4 space-y-2",
                getStatusBgClass(guideline.status)
              )}
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(guideline.status)}
                <span className={cn("font-semibold", getStatusTextClass(guideline.status))}>
                  {guideline.message}
                </span>
              </div>
              <p className={cn("text-sm", getStatusTextClass(guideline.status))}>
                <strong>Anbefalt tiltak:</strong> {guideline.action}
              </p>
            </div>
          )}

          {showCorrectiveAction && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Avvik registrert!</AlertTitle>
              <AlertDescription>
                Temperaturen er utenfor akseptable grenser. Du må beskrive korrigerende tiltak.
              </AlertDescription>
            </Alert>
          )}

          {showCorrectiveAction && (
            <div className="space-y-2">
              <Label htmlFor="corrective-action">Korrigerende tiltak *</Label>
              <Textarea
                id="corrective-action"
                placeholder="Beskriv hva som ble gjort for å rette avviket..."
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Merknad (valgfritt)</Label>
            <Textarea
              id="notes"
              placeholder="Eventuelle merknader..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedEquipmentId || !temperature || isSubmitting || (showCorrectiveAction && !correctiveAction)}
          >
            {isSubmitting ? (
              "Lagrer..."
            ) : isEditMode ? (
              "Oppdater"
            ) : showProgress && remainingAfterThis > 0 ? (
              <>
                Registrer & neste <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              "Registrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
