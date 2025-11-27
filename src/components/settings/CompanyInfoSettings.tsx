import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Save, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LogoUpload } from "@/components/setup/LogoUpload";

interface CompanyInfoSettingsProps {
  onBack: () => void;
}

export function CompanyInfoSettings({ onBack }: CompanyInfoSettingsProps) {
  const { company, refreshCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    org_number: "",
    address: "",
    postal_code: "",
    city: "",
    phone: "",
    email: "",
    logo_url: "",
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        org_number: company.org_number || "",
        address: company.address || "",
        postal_code: company.postal_code || "",
        city: company.city || "",
        phone: company.phone || "",
        email: company.email || "",
        logo_url: company.logo_url || "",
      });
    }
  }, [company]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (url: string) => {
    setFormData((prev) => ({ ...prev, logo_url: url }));
  };

  const handleSave = async () => {
    if (!company?.id) {
      toast.error("Ingen bedrift funnet");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Bedriftsnavn er påkrevd");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: formData.name.trim(),
          org_number: formData.org_number.trim() || null,
          address: formData.address.trim() || null,
          postal_code: formData.postal_code.trim() || null,
          city: formData.city.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          logo_url: formData.logo_url || null,
        })
        .eq("id", company.id);

      if (error) throw error;

      // Refresh company data in context
      await refreshCompany();
      
      toast.success("Bedriftsinformasjon oppdatert!");
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(error.message || "Kunne ikke oppdatere bedriftsinformasjon");
    } finally {
      setSaving(false);
    }
  };

  if (!company) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bedriftsinformasjon</h1>
            <p className="text-muted-foreground">
              Administrer bedriftsdetaljer og kontaktinfo
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border shadow-card p-6"
      >
        <div className="space-y-6">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Bedriftslogo</Label>
            <LogoUpload
              currentLogoUrl={formData.logo_url}
              onLogoChange={handleLogoChange}
              companyId={company.id}
            />
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Bedriftsnavn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Skriv inn bedriftsnavn"
            />
          </div>

          {/* Org Number */}
          <div className="space-y-2">
            <Label htmlFor="org_number">Organisasjonsnummer</Label>
            <Input
              id="org_number"
              value={formData.org_number}
              onChange={(e) => handleChange("org_number", e.target.value)}
              placeholder="123 456 789"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Gateadresse"
            />
          </div>

          {/* Postal Code & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postnummer</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleChange("postal_code", e.target.value)}
                placeholder="0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Sted</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="By/sted"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+47 12 34 56 78"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="post@bedrift.no"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lagre endringer
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}