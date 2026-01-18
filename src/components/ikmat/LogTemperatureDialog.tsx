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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIkMatTemperature } from "@/hooks/useIkMatTemperature";
import { Thermometer, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
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
}

export function LogTemperatureDialog({
  open,
  onOpenChange,
  preSelectedEquipmentId,
}: LogTemperatureDialogProps) {
  const { equipment, logTemperature } = useIkMatTemperature();
  
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [temperature, setTemperature] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [correctiveAction, setCorrectiveAction] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && preSelectedEquipmentId) {
      setSelectedEquipmentId(preSelectedEquipmentId);
    }
  }, [open, preSelectedEquipmentId]);

  // Auto-add minus for freezer when equipment changes
  useEffect(() => {
    if (selectedEquipmentId && temperature === '') {
      const equip = equipment.find(e => e.id === selectedEquipmentId);
      if (equip?.equipment_type === 'freezer') {
        setTemperature('-');
      }
    }
  }, [selectedEquipmentId, equipment]);

  const selectedEquip = equipment.find(e => e.id === selectedEquipmentId);

  // Calculate traffic light status based on equipment type and temperature
  const guideline = useMemo(() => {
    if (!selectedEquip || !temperature) return null;
    const temp = parseFloat(temperature);
    if (isNaN(temp)) return null;
    return getTemperatureGuideline(selectedEquip.equipment_type, temp);
  }, [selectedEquip, temperature]);

  const showCorrectiveAction = guideline && guideline.status !== 'green';

  const handleSubmit = async () => {
    if (!selectedEquipmentId || !temperature) return;

    setIsSubmitting(true);
    try {
      await logTemperature.mutateAsync({
        equipment_id: selectedEquipmentId,
        temperature: parseFloat(temperature),
        notes: notes || undefined,
        corrective_action: correctiveAction || undefined,
      });
      
      // Reset form
      setSelectedEquipmentId(preSelectedEquipmentId || "");
      setTemperature("");
      setNotes("");
      setCorrectiveAction("");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Registrer temperatur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="equipment">Velg utstyr</Label>
            <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
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
                  // Allow negative numbers, digits, and decimal point
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedEquipmentId || !temperature || isSubmitting || (showCorrectiveAction && !correctiveAction)}
          >
            {isSubmitting ? "Lagrer..." : "Registrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
