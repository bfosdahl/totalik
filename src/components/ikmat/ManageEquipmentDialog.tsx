import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useIkMatTemperature, type TemperatureEquipment } from "@/hooks/useIkMatTemperature";
import { EQUIPMENT_TYPE_DEFAULTS } from "@/lib/temperatureGuidelines";
import { Plus, Trash2, Settings, QrCode, Pencil } from "lucide-react";
import { toast } from "sonner";
import { EquipmentQRCodeDialog } from "./EquipmentQRCodeDialog";
import { t } from "@/i18n/t";

interface ManageEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageEquipmentDialog({
  open,
  onOpenChange,
}: ManageEquipmentDialogProps) {
  const { equipment, addEquipment, updateEquipment, deleteEquipment } = useIkMatTemperature();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<TemperatureEquipment | null>(null);
  const [qrEquipment, setQrEquipment] = useState<TemperatureEquipment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
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
      toast.error(t("auto.navn_er_paakrevd"));
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

  const handleStartEdit = (equip: TemperatureEquipment) => {
    setEditingEquipment(equip);
    setNewEquipment({
      name: equip.name,
      equipment_type: equip.equipment_type,
      location: equip.location || "",
      min_temp: equip.min_temp?.toString() || "",
      max_temp: equip.max_temp?.toString() || "",
      measurement_frequency: equip.measurement_frequency,
    });
    setShowAddForm(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEquipment || !newEquipment.name) {
      toast.error(t("auto.navn_er_paakrevd"));
      return;
    }

    await updateEquipment.mutateAsync({
      id: editingEquipment.id,
      name: newEquipment.name,
      equipment_type: newEquipment.equipment_type as TemperatureEquipment['equipment_type'],
      location: newEquipment.location || null,
      min_temp: newEquipment.min_temp ? parseFloat(newEquipment.min_temp) : null,
      max_temp: newEquipment.max_temp ? parseFloat(newEquipment.max_temp) : null,
      measurement_frequency: newEquipment.measurement_frequency,
    });

    cancelForm();
  };

  const cancelForm = () => {
    setEditingEquipment(null);
    setShowAddForm(false);
    setNewEquipment({
      name: "",
      equipment_type: "fridge",
      location: "",
      min_temp: "",
      max_temp: "",
      measurement_frequency: "daily",
    });
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteEquipment.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[700px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">{t("auto.administrer_utstyr")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Equipment list - Mobile card view */}
          {equipment.length > 0 && (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden space-y-2">
                {equipment.map((equip) => (
                  <div key={equip.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{equip.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {EQUIPMENT_TYPE_DEFAULTS[equip.equipment_type as keyof typeof EQUIPMENT_TYPE_DEFAULTS]?.label || equip.equipment_type}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(equip)}
                          title={t("auto.rediger")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setQrEquipment(equip)}
                          title={t("auto.qr_kode")}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(equip.id, equip.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {equip.location && <span>📍 {equip.location}</span>}
                      <span>🌡️ {equip.min_temp}°C – {equip.max_temp}°C</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("auto.navn_2")}</TableHead>
                      <TableHead>{t("auto.type")}</TableHead>
                      <TableHead>{t("auto.plassering")}</TableHead>
                      <TableHead>{t("auto.grenser")}</TableHead>
                      <TableHead>{t("auto.frekvens_2")}</TableHead>
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
                           equip.measurement_frequency === 'twice_daily' ? '2x daglig' :
                           equip.measurement_frequency === 'monthly' ? 'Månedlig' :
                           equip.measurement_frequency === 'on_demand' ? 'Ved behov' : 'Ukentlig'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs gap-1.5"
                              onClick={() => handleStartEdit(equip)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Rediger
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setQrEquipment(equip)}
                              title={t("auto.qr_kode")}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(equip.id, equip.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Add form */}
          {showAddForm ? (
            <div className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
              <h4 className="font-medium text-sm sm:text-base">
                {editingEquipment ? "Rediger utstyr" : "Legg til nytt utstyr"}
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">{t("auto.navn_3")}</Label>
                  <Input
                    placeholder={t("auto.f_eks_kjoeleskap_1")}
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                    className="h-9 sm:h-10"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">{t("auto.type")}</Label>
                  <Select value={newEquipment.equipment_type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fridge">{t("auto.kjoeleskap")}</SelectItem>
                      <SelectItem value="freezer">{t("auto.fryser")}</SelectItem>
                      <SelectItem value="hot_holding">{t("auto.varmholding")}</SelectItem>
                      <SelectItem value="heat_treatment">{t("auto.varmebehandling")}</SelectItem>
                      <SelectItem value="hot_display">{t("auto.varmebuffet")}</SelectItem>
                      <SelectItem value="cold_display">{t("auto.kjoeledisk")}</SelectItem>
                      <SelectItem value="dishwasher_home">Oppvaskmaskin (husholdning)</SelectItem>
                      <SelectItem value="dishwasher_pro">Oppvaskmaskin (profesjonell)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">{t("auto.plassering")}</Label>
                  <Input
                    placeholder={t("auto.f_eks_kjoekken")}
                    value={newEquipment.location}
                    onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                    className="h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">{t("auto.maalefrekvens")}</Label>
                  <Select 
                    value={newEquipment.measurement_frequency} 
                    onValueChange={(val) => setNewEquipment({ ...newEquipment, measurement_frequency: val })}
                  >
                    <SelectTrigger className="h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t("auto.daglig")}</SelectItem>
                      <SelectItem value="twice_daily">{t("auto.2x_daglig")}</SelectItem>
                      <SelectItem value="weekly">{t("auto.ukentlig")}</SelectItem>
                      <SelectItem value="monthly">{t("auto.maanedlig")}</SelectItem>
                      <SelectItem value="on_demand">{t("auto.ved_behov")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Min. temp (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newEquipment.min_temp}
                    onChange={(e) => setNewEquipment({ ...newEquipment, min_temp: e.target.value })}
                    className="h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Maks. temp (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newEquipment.max_temp}
                    onChange={(e) => setNewEquipment({ ...newEquipment, max_temp: e.target.value })}
                    className="h-9 sm:h-10"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  onClick={editingEquipment ? handleSaveEdit : handleAdd} 
                  disabled={addEquipment.isPending || updateEquipment.isPending}
                >
                  {editingEquipment
                    ? (updateEquipment.isPending ? "Lagrer..." : "Lagre endringer")
                    : (addEquipment.isPending ? "Legger til..." : "Legg til")}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelForm}>
                  {t("auto.avbryt")}
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

        {/* QR Code Dialog */}
        <EquipmentQRCodeDialog
          open={!!qrEquipment}
          onOpenChange={(open) => !open && setQrEquipment(null)}
          equipment={qrEquipment}
        />
      </DialogContent>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("auto.fjerne_utstyr")}</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil fjerne "{deleteTarget?.name}"? Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("auto.fjern")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
