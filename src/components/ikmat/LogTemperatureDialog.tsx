import { useState, useEffect } from "react";
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
import { Thermometer, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const { equipment, logTemperature, EQUIPMENT_TYPE_DEFAULTS } = useIkMatTemperature();
  
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [temperature, setTemperature] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [correctiveAction, setCorrectiveAction] = useState<string>("");
  const [showCorrectiveAction, setShowCorrectiveAction] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && preSelectedEquipmentId) {
      setSelectedEquipmentId(preSelectedEquipmentId);
    }
  }, [open, preSelectedEquipmentId]);

  useEffect(() => {
    // Check if temperature is out of range
    if (selectedEquipmentId && temperature) {
      const equip = equipment.find(e => e.id === selectedEquipmentId);
      if (equip) {
        const temp = parseFloat(temperature);
        const isOutOfRange = 
          (equip.min_temp !== null && temp < equip.min_temp) ||
          (equip.max_temp !== null && temp > equip.max_temp);
        setShowCorrectiveAction(isOutOfRange);
      }
    } else {
      setShowCorrectiveAction(false);
    }
  }, [selectedEquipmentId, temperature, equipment]);

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
      setShowCorrectiveAction(false);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEquip = equipment.find(e => e.id === selectedEquipmentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
                <SelectValue placeholder="Velg kjøleskap/fryser..." />
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
            <Input
              id="temperature"
              type="number"
              step="0.1"
              placeholder="f.eks. 3.5"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="text-lg font-mono"
            />
          </div>

          {showCorrectiveAction && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Temperaturen er utenfor akseptable grenser! Beskriv korrigerende tiltak.
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
