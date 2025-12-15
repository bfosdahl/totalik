import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Building2, Edit, Loader2, MapPin, Plus, Trash2, Users } from "lucide-react";
import { useDepartments, Department } from "@/hooks/useDepartments";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface DepartmentSettingsProps {
  onBack: () => void;
}

export function DepartmentSettings({ onBack }: DepartmentSettingsProps) {
  const { company, refreshCompany } = useAuth();
  const { departments, isLoading, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    postal_code: "",
    is_active: true,
  });

  const hasDepartments = company?.has_departments ?? false;

  const toggleDepartmentsEnabled = async () => {
    if (!company?.id) return;
    
    try {
      const { error } = await supabase
        .from("companies")
        .update({ has_departments: !hasDepartments })
        .eq("id", company.id);

      if (error) throw error;
      toast.success(hasDepartments ? "Avdelinger deaktivert" : "Avdelinger aktivert");
      refreshCompany?.();
    } catch (error) {
      console.error("Error toggling departments:", error);
      toast.error("Kunne ikke endre innstilling");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: "",
      city: "",
      postal_code: "",
      is_active: true,
    });
  };

  const openEditDialog = (dept: Department) => {
    setSelectedDepartment(dept);
    setFormData({
      name: dept.name,
      description: dept.description || "",
      address: dept.address || "",
      city: dept.city || "",
      postal_code: dept.postal_code || "",
      is_active: dept.is_active,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (dept: Department) => {
    setSelectedDepartment(dept);
    setShowDeleteDialog(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Avdelingsnavn er påkrevd");
      return;
    }

    setIsSaving(true);
    const result = await createDepartment(formData);
    setIsSaving(false);

    if (result) {
      setShowCreateDialog(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!selectedDepartment || !formData.name.trim()) {
      toast.error("Avdelingsnavn er påkrevd");
      return;
    }

    setIsSaving(true);
    const result = await updateDepartment(selectedDepartment.id, formData);
    setIsSaving(false);

    if (result) {
      setShowEditDialog(false);
      setSelectedDepartment(null);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;

    setIsSaving(true);
    const result = await deleteDepartment(selectedDepartment.id);
    setIsSaving(false);

    if (result) {
      setShowDeleteDialog(false);
      setSelectedDepartment(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Avdelinger</h2>
          <p className="text-muted-foreground">Administrer avdelinger for din bedrift</p>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Avdelingsfunksjon
          </CardTitle>
          <CardDescription>
            Aktiver for å organisere bedriften i avdelinger med egne brukere og data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Bruk avdelinger</p>
              <p className="text-sm text-muted-foreground">
                {hasDepartments 
                  ? "Avdelinger er aktivert for denne bedriften" 
                  : "Avdelinger er deaktivert"}
              </p>
            </div>
            <Switch
              checked={hasDepartments}
              onCheckedChange={toggleDepartmentsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Department List */}
      {hasDepartments && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Avdelinger ({departments.length})</h3>
            <Button onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Ny avdeling
            </Button>
          </div>

          {departments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">
                  Ingen avdelinger lagt til ennå.
                  <br />
                  Klikk "Ny avdeling" for å opprette den første.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {departments.map((dept) => (
                <Card key={dept.id} className={!dept.is_active ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        {!dept.is_active && (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(dept)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDeleteDialog(dept)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dept.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {dept.description}
                      </p>
                    )}
                    {(dept.address || dept.city) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {[dept.address, dept.postal_code, dept.city]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opprett ny avdeling</DialogTitle>
            <DialogDescription>
              Legg til en ny avdeling i bedriften
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Avdelingsnavn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="F.eks. Oslo-kontoret"
              />
            </div>
            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kort beskrivelse av avdelingen"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Gateadresse"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Postnummer</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="0000"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="city">Poststed</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="By/sted"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Opprett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger avdeling</DialogTitle>
            <DialogDescription>
              Oppdater informasjon om avdelingen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Avdelingsnavn *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beskrivelse</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-address">Adresse</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-postal_code">Postnummer</Label>
                <Input
                  id="edit-postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-city">Poststed</Label>
              <Input
                id="edit-city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Aktiv</Label>
                <p className="text-sm text-muted-foreground">Deaktiver for å skjule avdelingen</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleUpdate} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett avdeling</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{selectedDepartment?.name}"? 
              Dette vil også fjerne alle brukertilknytninger til denne avdelingen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Slett"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
