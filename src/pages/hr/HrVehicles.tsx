import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Car, Loader2 } from "lucide-react";
import { useCompanyVehicles, type CompanyVehicle, type VehicleInput } from "@/hooks/useCompanyVehicles";

const empty: VehicleInput = {
  license_plate: "",
  make: "",
  model: "",
  year: null,
  vehicle_type: "company",
  notes: "",
  is_active: true,
};

export default function HrVehicles() {
  const { vehicles, isLoading, create, update, remove } = useCompanyVehicles();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyVehicle | null>(null);
  const [form, setForm] = useState<VehicleInput>(empty);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (v: CompanyVehicle) => {
    setEditing(v);
    setForm({
      license_plate: v.license_plate,
      make: v.make,
      model: v.model,
      year: v.year,
      vehicle_type: v.vehicle_type,
      notes: v.notes,
      is_active: v.is_active,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.license_plate.trim()) return;
    if (editing) await update.mutateAsync({ id: editing.id, ...form });
    else await create.mutateAsync(form);
    setOpen(false);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Car className="h-7 w-7 text-primary" /> Bilpark
            </h1>
            <p className="text-muted-foreground mt-1">
              Registrer bedriftens biler så de kan velges direkte i kjøreboken
            </p>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Ny bil
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registrerte biler ({vehicles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Ingen biler registrert ennå. Klikk "Ny bil" for å legge til.
              </p>
            ) : (
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <div key={v.id} className="flex items-center justify-between border rounded-md p-3 hover:bg-accent/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="font-mono font-semibold bg-secondary px-2 py-1 rounded text-sm">
                        {v.license_plate}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {[v.make, v.model, v.year].filter(Boolean).join(" ") || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {v.vehicle_type === "company" ? "Firmabil" : v.vehicle_type === "private" ? "Privatbil" : v.vehicle_type}
                        </div>
                      </div>
                      {!v.is_active && <Badge variant="outline">Inaktiv</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Arkivere bil?")) remove.mutate(v.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Rediger bil" : "Ny bil"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Registreringsnummer *</Label>
              <Input value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value.toUpperCase() })} placeholder="AB12345" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Merke</Label>
                <Input value={form.make || ""} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="Toyota" />
              </div>
              <div>
                <Label>Modell</Label>
                <Input value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Hilux" />
              </div>
              <div>
                <Label>Årsmodell</Label>
                <Input type="number" value={form.year || ""} onChange={(e) => setForm({ ...form, year: e.target.value ? parseInt(e.target.value) : null })} placeholder="2023" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.vehicle_type || "company"} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Firmabil</SelectItem>
                    <SelectItem value="private">Privatbil</SelectItem>
                    <SelectItem value="leased">Leasingbil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notater</Label>
              <Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="F.eks. tildelt avdeling, drivstoff..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button onClick={handleSave} disabled={!form.license_plate.trim() || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Lagre endringer" : "Legg til"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
