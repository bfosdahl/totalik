import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, ArrowLeft, Moon, Sun, Monitor, Upload, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomizationSettingsProps {
  onBack: () => void;
}

export function CustomizationSettings({ onBack }: CustomizationSettingsProps) {
  const { theme, setTheme } = useTheme();
  const { company, refreshCompany } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !company?.id) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Kun bildefiler er tillatt");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Filen er for stor. Maksimal størrelse er 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${company.id}/logo.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath);

      // Update company record
      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: urlData.publicUrl })
        .eq("id", company.id);

      if (updateError) throw updateError;

      toast.success("Logo oppdatert!");
      refreshCompany?.();
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error(error.message || "Kunne ikke laste opp logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!company?.id || !company.logo_url) return;

    setRemoving(true);
    try {
      // Extract file path from URL
      const urlParts = company.logo_url.split("/");
      const filePath = `${company.id}/${urlParts[urlParts.length - 1]}`;

      // Remove from storage
      await supabase.storage.from("company-logos").remove([filePath]);

      // Update company record
      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: null })
        .eq("id", company.id);

      if (updateError) throw updateError;

      toast.success("Logo fjernet!");
      refreshCompany?.();
    } catch (error: any) {
      console.error("Error removing logo:", error);
      toast.error(error.message || "Kunne ikke fjerne logo");
    } finally {
      setRemoving(false);
    }
  };

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
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tilpasning</h1>
            <p className="text-muted-foreground">
              Logo, farger og utseende
            </p>
          </div>
        </div>
      </motion.div>

      {/* Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border shadow-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Bedriftslogo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Last opp bedriftens logo for bruk i håndbøker og dokumenter
        </p>

        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center overflow-hidden">
            {company?.logo_url ? (
              <img
                src={company.logo_url}
                alt="Bedriftslogo"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <span className="text-xs">Ingen logo</span>
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById("logo-upload")?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Laster opp...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Last opp logo
                  </>
                )}
              </Button>
              {company?.logo_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={removing}
                  onClick={handleRemoveLogo}
                  className="text-destructive hover:text-destructive"
                >
                  {removing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <p className="text-xs text-muted-foreground">
              Anbefalt størrelse: 512x512px. Maks 2MB. PNG eller JPG.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Theme Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border shadow-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Fargetema</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Velg utseende for applikasjonen
        </p>

        <RadioGroup
          value={theme}
          onValueChange={setTheme}
          className="grid grid-cols-3 gap-4"
        >
          <Label
            htmlFor="theme-light"
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              theme === "light"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <RadioGroupItem value="light" id="theme-light" className="sr-only" />
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Sun className="w-6 h-6 text-amber-600" />
            </div>
            <span className="font-medium">Lyst</span>
          </Label>

          <Label
            htmlFor="theme-dark"
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              theme === "dark"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
              <Moon className="w-6 h-6 text-slate-300" />
            </div>
            <span className="font-medium">Mørkt</span>
          </Label>

          <Label
            htmlFor="theme-system"
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              theme === "system"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <RadioGroupItem value="system" id="theme-system" className="sr-only" />
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-slate-800 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-primary" />
            </div>
            <span className="font-medium">System</span>
          </Label>
        </RadioGroup>
      </motion.div>

      {/* Accent Color Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border shadow-card p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Aksentfarge</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Velg hovedfargen som brukes i grensesnittet
        </p>

        <div className="flex flex-wrap gap-3">
          {[
            { name: "Blå", color: "bg-blue-500", value: "blue" },
            { name: "Grønn", color: "bg-emerald-500", value: "green" },
            { name: "Lilla", color: "bg-violet-500", value: "violet" },
            { name: "Oransje", color: "bg-orange-500", value: "orange" },
            { name: "Rosa", color: "bg-pink-500", value: "pink" },
            { name: "Rød", color: "bg-red-500", value: "red" },
          ].map((accent) => (
            <button
              key={accent.value}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                accent.value === "blue"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => toast.info("Aksentfarge-funksjon kommer snart")}
            >
              <div className={`w-5 h-5 rounded-full ${accent.color}`} />
              <span className="text-sm font-medium">{accent.name}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Aksentfarge-tilpasning kommer i en fremtidig oppdatering
        </p>
      </motion.div>
    </div>
  );
}
