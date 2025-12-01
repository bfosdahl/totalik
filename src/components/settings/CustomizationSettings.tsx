import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, ArrowLeft, Moon, Sun, Monitor, Upload, Loader2, Trash2, Check, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AccentColorKey, accentColors, getColorValues, isCustomColor } from "@/hooks/useAccentColor";
import { useFavoriteColors } from "@/hooks/useFavoriteColors";

interface CustomizationSettingsProps {
  onBack: () => void;
}

const accentColorOptions: { name: string; value: AccentColorKey; tailwindClass: string }[] = [
  { name: "Blå", value: "blue", tailwindClass: "bg-blue-500" },
  { name: "Grønn", value: "green", tailwindClass: "bg-emerald-500" },
  { name: "Lilla", value: "violet", tailwindClass: "bg-violet-500" },
  { name: "Oransje", value: "orange", tailwindClass: "bg-orange-500" },
  { name: "Rosa", value: "pink", tailwindClass: "bg-pink-500" },
  { name: "Rød", value: "red", tailwindClass: "bg-red-500" },
  { name: "Teal", value: "teal", tailwindClass: "bg-teal-500" },
  { name: "Amber", value: "amber", tailwindClass: "bg-amber-500" },
  { name: "Indigo", value: "indigo", tailwindClass: "bg-indigo-500" },
  { name: "Cyan", value: "cyan", tailwindClass: "bg-cyan-500" },
  { name: "Rose", value: "rose", tailwindClass: "bg-rose-500" },
  { name: "Slate", value: "slate", tailwindClass: "bg-slate-500" },
];

export function CustomizationSettings({ onBack }: CustomizationSettingsProps) {
  const { theme, setTheme } = useTheme();
  const { company, refreshCompany } = useAuth();
  const { favorites, addFavorite, removeFavorite } = useFavoriteColors();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [savingColor, setSavingColor] = useState(false);
  const [favoriteName, setFavoriteName] = useState("");
  const [showFavoriteInput, setShowFavoriteInput] = useState(false);
  
  const savedColor = company?.accent_color || "blue";
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [customHex, setCustomHex] = useState(() => {
    return isCustomColor(savedColor) ? savedColor : "#3b82f6";
  });

  const isPreviewMode = previewColor !== null && previewColor !== savedColor;
  const displayedColor = previewColor ?? savedColor;

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !company?.id) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Kun bildefiler er tillatt");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Filen er for stor. Maksimal størrelse er 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${company.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath);

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
      const urlParts = company.logo_url.split("/");
      const filePath = `${company.id}/${urlParts[urlParts.length - 1]}`;

      await supabase.storage.from("company-logos").remove([filePath]);

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

  const applyColorToUI = (color: string) => {
    const colors = getColorValues(color);
    const root = document.documentElement;
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);
  };

  const previewColorHandler = (color: string) => {
    setPreviewColor(color);
    applyColorToUI(color);
  };

  const cancelPreview = () => {
    setPreviewColor(null);
    applyColorToUI(savedColor);
    if (!isCustomColor(savedColor)) {
      setCustomHex("#3b82f6");
    } else {
      setCustomHex(savedColor);
    }
  };

  const saveColor = async () => {
    if (!company?.id || !previewColor) return;

    setSavingColor(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ accent_color: previewColor })
        .eq("id", company.id);

      if (error) throw error;

      setPreviewColor(null);
      toast.success("Aksentfarge lagret!");
      refreshCompany?.();
    } catch (error: any) {
      console.error("Error updating accent color:", error);
      toast.error(error.message || "Kunne ikke oppdatere aksentfarge");
    } finally {
      setSavingColor(false);
    }
  };

  const handleCustomHexChange = (hex: string) => {
    setCustomHex(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      previewColorHandler(hex);
    }
  };

  const handleSaveFavorite = async () => {
    const colorToSave = displayedColor;
    const name = favoriteName.trim().slice(0, 50) || undefined;
    const success = await addFavorite(colorToSave, name);
    if (success) {
      setFavoriteName("");
      setShowFavoriteInput(false);
    }
  };

  const getColorDisplay = (color: string) => {
    if (isCustomColor(color)) {
      return color;
    }
    const preset = accentColorOptions.find(o => o.value === color);
    return preset?.name || color;
  };

  const getColorStyle = (color: string): React.CSSProperties => {
    if (isCustomColor(color)) {
      return { backgroundColor: color };
    }
    const colors = getColorValues(color);
    return { backgroundColor: `hsl(${colors.primary})` };
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

        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              theme === "light"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Sun className="w-6 h-6 text-amber-600" />
            </div>
            <span className="font-medium">Lyst</span>
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              theme === "dark"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
              <Moon className="w-6 h-6 text-slate-300" />
            </div>
            <span className="font-medium">Mørkt</span>
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              theme === "system"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-slate-800 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-primary" />
            </div>
            <span className="font-medium">System</span>
          </button>
        </div>
      </motion.div>

      {/* Accent Color Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Aksentfarge</h3>
            <p className="text-sm text-muted-foreground">
              Velg hovedfargen som brukes i grensesnittet
            </p>
          </div>
          {isPreviewMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Forhåndsvisning</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {accentColorOptions.map((accent) => {
            const isSelected = displayedColor === accent.value;
            const isSaved = savedColor === accent.value;
            return (
              <button
                key={accent.value}
                disabled={savingColor}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => previewColorHandler(accent.value)}
              >
                <div className={`w-5 h-5 rounded-full ${accent.tailwindClass} flex items-center justify-center`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-medium">{accent.name}</span>
                {isSaved && !isSelected && (
                  <span className="text-xs text-muted-foreground">(lagret)</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom HEX Color */}
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium mb-3">Egendefinert farge</h4>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg border border-border flex-shrink-0"
              style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : "#3b82f6" }}
            />
            <Input
              type="text"
              value={customHex}
              onChange={(e) => handleCustomHexChange(e.target.value)}
              placeholder="#3b82f6"
              className="w-32 font-mono"
              maxLength={7}
            />
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : "#3b82f6"}
              onChange={(e) => handleCustomHexChange(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0 p-0"
            />
          </div>
          {isCustomColor(savedColor) && !isPreviewMode && (
            <p className="text-xs text-muted-foreground mt-2">
              Aktiv egendefinert farge: {savedColor}
            </p>
          )}
        </div>

        {/* Preview Actions */}
        {isPreviewMode && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-border"
          >
            <Button
              onClick={saveColor}
              disabled={savingColor}
            >
              {savingColor ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lagrer...
                </>
              ) : (
                "Lagre farge"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={cancelPreview}
              disabled={savingColor}
            >
              Avbryt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFavoriteInput(true)}
              className="text-amber-600 hover:text-amber-700"
            >
              <Star className="w-4 h-4 mr-1" />
              Lagre som favoritt
            </Button>
          </motion.div>
        )}

        {/* Save as Favorite Input */}
        {showFavoriteInput && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mt-4 pt-4 border-t border-border"
          >
            <div 
              className="w-8 h-8 rounded-lg border border-border flex-shrink-0"
              style={getColorStyle(displayedColor)}
            />
            <Input
              type="text"
              value={favoriteName}
              onChange={(e) => setFavoriteName(e.target.value)}
              placeholder="Navn på fargen (valgfritt)"
              className="flex-1 max-w-xs"
              maxLength={50}
            />
            <Button size="sm" onClick={handleSaveFavorite}>
              <Plus className="w-4 h-4 mr-1" />
              Lagre
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                setShowFavoriteInput(false);
                setFavoriteName("");
              }}
            >
              Avbryt
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Favorite Colors Section */}
      {favorites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border shadow-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold">Favorittfarger</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Dine lagrede farger for rask tilgang
          </p>

          <div className="flex flex-wrap gap-3">
            {favorites.filter(fav => fav && fav.color).map((fav) => {
              const isSelected = displayedColor === fav.color;
              return (
                <div
                  key={fav.id}
                  className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => previewColorHandler(fav.color)}
                >
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={getColorStyle(fav.color)}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium">
                    {fav.name || getColorDisplay(fav.color)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(fav.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 rounded hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
