import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { IkMatSupplier } from "@/hooks/useIkMatSuppliers";
import { t } from "@/i18n/t";

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (supplier: Omit<IkMatSupplier, "id" | "company_id" | "created_at" | "updated_at">) => void;
  editingSupplier?: IkMatSupplier | null;
}

export function AddSupplierDialog({ open, onOpenChange, onSave, editingSupplier }: AddSupplierDialogProps) {
  const [formData, setFormData] = useState({
    supplier_name: "",
    contact_person: "",
    phone: "",
    email: "",
    service_type: "",
    contract_start_date: "",
    contract_end_date: "",
    notes: "",
  });

  useEffect(() => {
    if (editingSupplier) {
      setFormData({
        supplier_name: editingSupplier.supplier_name,
        contact_person: editingSupplier.contact_person || "",
        phone: editingSupplier.phone || "",
        email: editingSupplier.email || "",
        service_type: editingSupplier.service_type,
        contract_start_date: editingSupplier.contract_start_date || "",
        contract_end_date: editingSupplier.contract_end_date || "",
        notes: editingSupplier.notes || "",
      });
    } else {
      setFormData({
        supplier_name: "",
        contact_person: "",
        phone: "",
        email: "",
        service_type: "",
        contract_start_date: "",
        contract_end_date: "",
        notes: "",
      });
    }
  }, [editingSupplier, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert empty date strings to undefined to avoid database errors
    const dataToSave = {
      ...formData,
      contract_start_date: formData.contract_start_date || undefined,
      contract_end_date: formData.contract_end_date || undefined,
      contact_person: formData.contact_person || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      notes: formData.notes || undefined,
    };
    onSave(dataToSave as Omit<IkMatSupplier, "id" | "company_id" | "created_at" | "updated_at">);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingSupplier ? "Rediger leverandør" : "Legg til leverandør"}</DialogTitle>
          <DialogDescription>
            {t("auto.registrer_en_leverandoer_eller_serviceav")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">
                {t("auto.leverandoer")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                placeholder={t("auto.navn_paa_leverandoer")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_type">
                {t("auto.type_tjeneste")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service_type"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                placeholder={t("auto.f_eks_skadedyrkontroll_renhold")}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">{t("auto.kontaktperson_2")}</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder={t("auto.navn_paa_kontaktperson")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("auto.telefon")}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t("auto.telefonnummer")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("auto.e_post_2")}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t("auto.e_postadresse")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_start_date">{t("auto.avtale_start")}</Label>
              <Input
                id="contract_start_date"
                type="date"
                value={formData.contract_start_date}
                onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract_end_date">{t("auto.avtale_slutt")}</Label>
              <Input
                id="contract_end_date"
                type="date"
                value={formData.contract_end_date}
                onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("auto.notater")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t("auto.tilleggsinfo_frekvens_osv")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button type="submit">
              {editingSupplier ? "Oppdater" : "Legg til"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
