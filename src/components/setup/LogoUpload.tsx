import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LogoUploadProps {
  currentLogoUrl: string | null;
  companyId: string | null;
  onLogoChange: (url: string | null) => void;
}

export function LogoUpload({ currentLogoUrl, companyId, onLogoChange }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vennligst velg en bildefil");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Bildet må være mindre enn 2MB");
      return;
    }

    if (!companyId) {
      toast.error("Bedrifts-ID mangler");
      return;
    }

    setIsUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${companyId}/logo.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      // Add cache-busting parameter
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Update company record
      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: publicUrl })
        .eq("id", companyId);

      if (updateError) throw updateError;

      setPreviewUrl(urlWithCacheBust);
      onLogoChange(publicUrl);
      toast.success("Logo lastet opp!");
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error("Kunne ikke laste opp logo. Prøv igjen.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!companyId || !currentLogoUrl) return;

    setIsUploading(true);

    try {
      // Extract file path from URL
      const urlParts = currentLogoUrl.split("/company-logos/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split("?")[0];
        await supabase.storage.from("company-logos").remove([filePath]);
      }

      // Update company record
      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: null })
        .eq("id", companyId);

      if (updateError) throw updateError;

      setPreviewUrl(null);
      onLogoChange(null);
      toast.success("Logo fjernet");
    } catch (error) {
      console.error("Logo removal error:", error);
      toast.error("Kunne ikke fjerne logo. Prøv igjen.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Bedriftslogo"
                className="w-full h-full object-contain"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="logo-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {previewUrl ? "Bytt logo" : "Last opp logo"}
              </Button>
              
              {previewUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={isUploading}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4 mr-1" />
                  Fjern
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPG eller SVG. Maks 2MB. Vises på forsiden av håndboken.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
