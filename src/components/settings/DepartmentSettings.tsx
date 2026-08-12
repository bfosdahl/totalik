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
import { ArrowLeft, Building2, Edit, Loader2, MapPin, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useDepartments, Department } from "@/hooks/useDepartments";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useModulePricing } from "@/hooks/useModulePricing";
import { OrderModuleDialog } from "@/components/modules/OrderModuleDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { t } from "@/i18n/t";

interface DepartmentSettingsProps {
  onBack: () => void;
}

export function DepartmentSettings({ onBack }: DepartmentSettingsProps) {
  const { company, refreshCompany, isSystemAdmin } = useAuth();
  const { departments, isLoading, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { hasModule, refetch: refetchModules } = useCompanyModules();
  const { getPricing } = useModulePricing();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    postal_code: "",
    org_number: "",
    is_active: true,
  });

  const hasDepartmentsModule = hasModule("AVDELINGER");
  const hasDepartments = company?.has_departments ?? false;
  const pricing = getPricing("AVDELINGER");

  const toggleDepartmentsEnabled = async () => {
    if (!company?.id) return;
    
    // If trying to enable and module not active, show order dialog (unless system admin)
    if (!hasDepartments && !hasDepartmentsModule && !isSystemAdmin) {
      setShowOrderDialog(true);
      return;
    }
    
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
      toast.error(t("auto.kunne_ikke_endre_innstilling"));
    }
  };

  // Admin function to activate module without payment
  const activateModuleWithoutPayment = async () => {
    if (!company?.id || !isSystemAdmin) return;
    
    setIsSaving(true);
    try {
      // Check if module already exists
      const { data: existingModule } = await supabase
        .from("company_modules")
        .select("id")
        .eq("company_id", company.id)
        .eq("module_type", "AVDELINGER")
        .maybeSingle();

      if (existingModule) {
        // Update existing
        const { error: updateError } = await supabase
          .from("company_modules")
          .update({ is_active: true })
          .eq("id", existingModule.id);
        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from("company_modules")
          .insert({
            company_id: company.id,
            module_type: "AVDELINGER",
            is_active: true,
            settings: {},
          });
        if (insertError) throw insertError;
      }

      // Also enable departments on the company
      const { error: companyError } = await supabase
        .from("companies")
        .update({ has_departments: true })
        .eq("id", company.id);

      if (companyError) throw companyError;

      toast.success(t("auto.avdelingsmodul_aktivert"));
      await refetchModules();
      await refreshCompany?.();
    } catch (error) {
      console.error("Error activating module:", error);
      toast.error(t("auto.kunne_ikke_aktivere_modulen"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrderComplete = () => {
    refetchModules();
    refreshCompany?.();
    setShowOrderDialog(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: "",
      city: "",
      postal_code: "",
      org_number: "",
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
      org_number: dept.org_number || "",
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
      toast.error(t("auto.avdelingsnavn_er_paakrevd"));
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
      toast.error(t("auto.avdelingsnavn_er_paakrevd"));
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
          <h2 className="text-2xl font-bold text-foreground">{t("auto.avdelinger")}</h2>
          <p className="text-muted-foreground">{t("auto.administrer_avdelinger_for_din_bedrift")}</p>
        </div>
      </div>

      {/* Module Status / Order */}
      {!hasDepartmentsModule && !isSystemAdmin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Bestill Avdelingsmodul
            </CardTitle>
            <CardDescription>
              {t("auto.organiser_bedriften_i_avdelinger_med_egn")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("auto.avdelinger")}</p>
                <p className="text-sm text-muted-foreground">
                  {pricing?.price_monthly ? `${pricing.price_monthly} kr/mnd` : "Kontakt oss for pris"}
                </p>
              </div>
              <Button onClick={() => setShowOrderDialog(true)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Bestill
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin: Activate without payment */}
      {!hasDepartmentsModule && isSystemAdmin && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-500" />
              Admin: Aktiver Avdelingsmodul
            </CardTitle>
            <CardDescription>
              {t("auto.som_systemadministrator_kan_du_aktivere_")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("auto.avdelingsmodul_ikke_aktivert")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("auto.klikk_for_aa_aktivere_uten_betaling_elle")}
                </p>
              </div>
              <Button 
                onClick={activateModuleWithoutPayment}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aktiver gratis"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enable/Disable Toggle - only show if module is active */}
      {hasDepartmentsModule && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Avdelingsfunksjon
            </CardTitle>
            <CardDescription>
              {t("auto.aktiver_for_aa_organisere_bedriften_i_av")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("auto.bruk_avdelinger")}</p>
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
      )}

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
                  {t("auto.ingen_avdelinger_lagt_til_ennaa")}
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
                          <Badge variant="secondary">{t("auto.inaktiv")}</Badge>
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
                    {dept.org_number && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Org.nr: {dept.org_number}
                      </p>
                    )}
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
            <DialogTitle>{t("auto.opprett_ny_avdeling")}</DialogTitle>
            <DialogDescription>
              {t("auto.legg_til_en_ny_avdeling_i_bedriften")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t("auto.avdelingsnavn_2")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("auto.f_eks_oslo_kontoret")}
                />
              </div>
              <div>
                <Label htmlFor="org_number">{t("auto.org_nummer_2")}</Label>
                <Input
                  id="org_number"
                  value={formData.org_number}
                  onChange={(e) => setFormData({ ...formData, org_number: e.target.value })}
                  placeholder="123 456 789"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">{t("auto.beskrivelse")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("auto.kort_beskrivelse_av_avdelingen")}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">{t("auto.adresse")}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t("auto.gateadresse")}
                />
              </div>
              <div>
                <Label htmlFor="postal_code">{t("auto.postnummer")}</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="0000"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="city">{t("auto.poststed")}</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder={t("auto.by_sted")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t("auto.avbryt")}
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
            <DialogTitle>{t("auto.rediger_avdeling")}</DialogTitle>
            <DialogDescription>
              {t("auto.oppdater_informasjon_om_avdelingen")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">{t("auto.avdelingsnavn_2")}</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-org_number">{t("auto.org_nummer_2")}</Label>
                <Input
                  id="edit-org_number"
                  value={formData.org_number}
                  onChange={(e) => setFormData({ ...formData, org_number: e.target.value })}
                  placeholder="123 456 789"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">{t("auto.beskrivelse")}</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-address">{t("auto.adresse")}</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-postal_code">{t("auto.postnummer")}</Label>
                <Input
                  id="edit-postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-city">{t("auto.poststed")}</Label>
              <Input
                id="edit-city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>{t("auto.aktiv")}</Label>
                <p className="text-sm text-muted-foreground">{t("auto.deaktiver_for_aa_skjule_avdelingen")}</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t("auto.avbryt")}
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
            <AlertDialogTitle>{t("auto.slett_avdeling")}</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{selectedDepartment?.name}"? 
              Dette vil også fjerne alle brukertilknytninger til denne avdelingen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Slett"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Module Dialog */}
      <OrderModuleDialog
        open={showOrderDialog}
        onOpenChange={setShowOrderDialog}
        moduleType="AVDELINGER"
        pricing={pricing}
        onOrderComplete={handleOrderComplete}
      />
    </div>
  );
}
