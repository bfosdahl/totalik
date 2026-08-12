import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Save, ArrowLeft, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LogoUpload } from "@/components/setup/LogoUpload";
import { useNavigate } from "react-router-dom";
import { getModuleDefaultSettings } from "@/lib/moduleDefaults";
import { IndustriesMultiSelect } from "@/components/settings/IndustriesMultiSelect";
import { t } from "@/i18n/t";

interface CompanyInfoSettingsProps {
  onBack: () => void;
  createMode?: boolean;
}

export function CompanyInfoSettings({ onBack, createMode = false }: CompanyInfoSettingsProps) {
  const { company, profile, refreshCompany, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(createMode && !company);
  const [formData, setFormData] = useState({
    name: "",
    org_number: "",
    address: "",
    postal_code: "",
    city: "",
    phone: "",
    email: "",
    logo_url: "",
    industries: [] as string[],
  });

  // Refresh company data on mount to ensure we have the latest
  useEffect(() => {
    const loadFreshData = async () => {
      if (!isCreating) {
        setLoading(true);
        await refreshCompany();
        setLoading(false);
      }
    };
    loadFreshData();
  }, [isCreating]);

  // Update form when company data changes (only if not creating)
  useEffect(() => {
    if (company && !isCreating) {
      setFormData({
        name: company.name || "",
        org_number: company.org_number || "",
        address: company.address || "",
        postal_code: company.postal_code || "",
        city: company.city || "",
        phone: company.phone || "",
        email: company.email || "",
        logo_url: company.logo_url || "",
        industries: (company as any).industries || [],
      });
    }
  }, [company, isCreating]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (url: string) => {
    setFormData((prev) => ({ ...prev, logo_url: url }));
  };

  const handleCreateCompany = async () => {
    if (!profile?.user_id) {
      toast.error(t("auto.du_maa_vaere_logget_inn_for_aa_opprette_"));
      return;
    }

    if (!formData.name.trim()) {
      toast.error(t("auto.bedriftsnavn_er_paakrevd"));
      return;
    }

    setSaving(true);
    try {
      // Create the company
      const { data: newCompany, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: formData.name.trim(),
          org_number: formData.org_number.trim() || null,
          address: formData.address.trim() || null,
          postal_code: formData.postal_code.trim() || null,
          city: formData.city.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          logo_url: formData.logo_url || null,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Link the user to the company
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          company_id: newCompany.id,
          status: "active"
        })
        .eq("user_id", profile.user_id);

      if (profileError) throw profileError;

      // Add user as company_admin
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: profile.user_id,
          role: "company_admin"
        });

      if (roleError && !roleError.message.includes("duplicate")) {
        throw roleError;
      }

      // Create default IK_HMS module for the company
      const { error: moduleError } = await supabase
        .from("company_modules")
        .insert({
          company_id: newCompany.id,
          module_type: "IK_HMS",
          is_active: true,
          settings: getModuleDefaultSettings("IK_HMS"),
        });

      if (moduleError) {
        console.error("Error creating module:", moduleError);
      }

      // Refresh user data
      await refreshProfile();
      await refreshCompany();
      
      toast.success(t("auto.bedrift_opprettet_du_kan_naa_begynne_opp"));
      
      // Navigate to setup
      navigate("/setup");
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast.error(error.message || "Kunne ikke opprette bedrift");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!company?.id) {
      toast.error(t("auto.ingen_bedrift_funnet"));
      return;
    }

    if (!formData.name.trim()) {
      toast.error(t("auto.bedriftsnavn_er_paakrevd"));
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
          industries: formData.industries,
        } as any)
        .eq("id", company.id);

      if (error) throw error;

      // Refresh company data in context
      await refreshCompany();
      
      toast.success(t("auto.bedriftsinformasjon_oppdatert"));
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(error.message || "Kunne ikke oppdatere bedriftsinformasjon");
    } finally {
      setSaving(false);
    }
  };

  // Show create company form if user has no company
  if (isCreating || (!company && !loading)) {
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
              <h1 className="text-2xl font-bold tracking-tight">{t("auto.opprett_bedrift")}</h1>
              <p className="text-muted-foreground">
                {t("auto.fyll_inn_bedriftsinformasjon_for_aa_komm")}
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
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("auto.bedriftsnavn_2")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={t("auto.skriv_inn_bedriftsnavn")}
                autoFocus
              />
            </div>

            {/* Org Number */}
            <div className="space-y-2">
              <Label htmlFor="org_number">{t("auto.organisasjonsnummer")}</Label>
              <Input
                id="org_number"
                value={formData.org_number}
                onChange={(e) => handleChange("org_number", e.target.value)}
                placeholder="123 456 789"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">{t("auto.adresse")}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder={t("auto.gateadresse")}
              />
            </div>

            {/* Postal Code & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">{t("auto.postnummer")}</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange("postal_code", e.target.value)}
                  placeholder="0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t("auto.sted")}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder={t("auto.by_sted")}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t("auto.telefon")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+47 12 34 56 78"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auto.e_post_2")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="post@bedrift.no"
                />
              </div>
            </div>

            {/* Create Button */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={handleCreateCompany} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Oppretter...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Opprett bedrift
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
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
            <h1 className="text-2xl font-bold tracking-tight">{t("auto.bedriftsinformasjon")}</h1>
            <p className="text-muted-foreground">
              {t("auto.administrer_bedriftsdetaljer_og_kontakti")}
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
            <Label>{t("auto.bedriftslogo")}</Label>
            <LogoUpload
              currentLogoUrl={formData.logo_url}
              onLogoChange={handleLogoChange}
              companyId={company?.id || ""}
            />
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("auto.bedriftsnavn_2")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder={t("auto.skriv_inn_bedriftsnavn")}
            />
          </div>

          {/* Org Number */}
          <div className="space-y-2">
            <Label htmlFor="org_number">{t("auto.organisasjonsnummer")}</Label>
            <Input
              id="org_number"
              value={formData.org_number}
              onChange={(e) => handleChange("org_number", e.target.value)}
              placeholder="123 456 789"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">{t("auto.adresse")}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder={t("auto.gateadresse")}
            />
          </div>

          {/* Postal Code & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">{t("auto.postnummer")}</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleChange("postal_code", e.target.value)}
                placeholder="0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t("auto.sted")}</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder={t("auto.by_sted")}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("auto.telefon")}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+47 12 34 56 78"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auto.e_post_2")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="post@bedrift.no"
              />
            </div>
          </div>

          {/* Industries */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label>{t("auto.bransjer")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("auto.velg_bransjene_bedriften_jobber_innen_ma")}
            </p>
            <IndustriesMultiSelect
              value={formData.industries}
              onChange={(v) => setFormData((p) => ({ ...p, industries: v }))}
            />
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