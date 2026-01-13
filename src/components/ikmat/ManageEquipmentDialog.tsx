import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIkMatTemperature } from "@/hooks/useIkMatTemperature";
import { Plus, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";

interface ManageEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageEquipmentDialog({
  open,
  onOpenChange,
}: ManageEquipmentDialogProps) {
  const { equipment, addEquipment, deleteEquipment, EQUIPMENT_TYPE_DEFAULTS } = useIkMatTemperature();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: "",
    equipment_type: "fridge",
    location: "",
    min_temp: "",
    max_temp: "",
    measurement_frequency: "daily",
  });

  const handleTypeChange = (type: string) => {
    const defaults = EQUIPMENT_TYPE_DEFAULTS[type as keyof typeof EQUIPMENT_TYPE_DEFAULTS];
    setNewEquipment({
      ...newEquipment,
      equipment_type: type,
      min_temp: defaults?.min?.toString() || "",
      max_temp: defaults?.max?.toString() || "",
    });
  };

  const handleAdd = async () => {
    if (!newEquipment.name) {
      toast.error("Navn er påkrevd");
      return;
    }

    await addEquipment.mutateAsync({
      name: newEquipment.name,
      equipment_type: newEquipment.equipment_type,
      location: newEquipment.location || undefined,
      min_temp: newEquipment.min_temp ? parseFloat(newEquipment.min_temp) : undefined,
      max_temp: newEquipment.max_temp ? parseFloat(newEquipment.max_temp) : undefined,
      measurement_frequency: newEquipment.measurement_frequency,
    });

    setNewEquipment({
      name: "",
      equipment_type: "fridge",
      location: "",
      min_temp: "",
      max_temp: "",
      measurement_frequency: "daily",
    });
    setShowAddForm(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Er du sikker på at du vil fjerne "${name}"?`)) {
      await deleteEquipment.mutateAsync(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Administrer utstyr for temperaturlogging
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Equipment list */}
          {equipment.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Plassering</TableHead>
                  <TableHead>Grenser</TableHead>
                  <TableHead>Frekvens</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((equip) => (
                  <TableRow key={equip.id}>
                    <TableCell className="font-medium">{equip.name}</TableCell>
                    <TableCell>
                      {EQUIPMENT_TYPE_DEFAULTS[equip.equipment_type as keyof typeof EQUIPMENT_TYPE_DEFAULTS]?.label || equip.equipment_type}
                    </TableCell>
                    <TableCell>{equip.location || "-"}</TableCell>
                    <TableCell>
                      {equip.min_temp}°C - {equip.max_temp}°C
                    </TableCell>
                    <TableCell>
                      {equip.measurement_frequency === 'daily' ? 'Daglig' :
                       equip.measurement_frequency === 'twice_daily' ? '2x daglig' : 'Ukentlig'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(equip.id, equip.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Add form */}
          {showAddForm ? (
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Legg til nytt utstyr</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Navn *</Label>
                  <Input
                    placeholder="f.eks. Kjøleskap 1"
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newEquipment.equipment_type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fridge">Kjøleskap</SelectItem>
                      <SelectItem value="freezer">Fryser</SelectItem>
                      <SelectItem value="hot_display">Varmebuffet</SelectItem>
                      <SelectItem value="cold_display">Kjøledisk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Plassering</Label>
                  <Input
                    placeholder="f.eks. Kjøkken"
                    value={newEquipment.location}
                    onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Målefrekvens</Label>
                  <Select 
                    value={newEquipment.measurement_frequency} 
                    onValueChange={(val) => setNewEquipment({ ...newEquipment, measurement_frequency: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daglig</SelectItem>
                      <SelectItem value="twice_daily">2 ganger daglig</SelectItem>
                      <SelectItem value="weekly">Ukentlig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Min. temp (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newEquipment.min_temp}
                    onChange={(e) => setNewEquipment({ ...newEquipment, min_temp: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Maks. temp (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newEquipment.max_temp}
                    onChange={(e) => setNewEquipment({ ...newEquipment, max_temp: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={addEquipment.isPending}>
                  {addEquipment.isPending ? "Legger til..." : "Legg til"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Avbryt
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowAddForm(true)} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Legg til utstyr
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
