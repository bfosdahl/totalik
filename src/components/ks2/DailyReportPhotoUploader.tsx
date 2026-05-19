import { useRef, useState } from "react";
import { Camera, Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DailyReportPhoto {
  path: string;
  name: string;
  uploaded_at: string;
}

interface Props {
  photos: DailyReportPhoto[];
  onChange: (photos: DailyReportPhoto[]) => void;
}

const BUCKET = "daily-report-photos";

function sanitize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[æÆ]/g, "ae")
    .replace(/[øØ]/g, "o")
    .replace(/[åÅ]/g, "a")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function DailyReportPhotoUploader({ photos, onChange }: Props) {
  const { profile } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const loadPreview = async (photo: DailyReportPhoto) => {
    if (previews[photo.path]) return;
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(photo.path, 3600);
    if (data?.signedUrl) {
      setPreviews((prev) => ({ ...prev, [photo.path]: data.signedUrl }));
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !profile?.company_id) return;
    setUploading(true);
    const uploaded: DailyReportPhoto[] = [];
    try {
      for (const file of Array.from(files)) {
        const safeName = sanitize(file.name);
        const path = `${profile.company_id}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (error) throw error;
        uploaded.push({ path, name: file.name, uploaded_at: new Date().toISOString() });
      }
      const next = [...photos, ...uploaded];
      onChange(next);
      // preload previews
      uploaded.forEach(loadPreview);
      toast.success(`${uploaded.length} bilde${uploaded.length > 1 ? "r" : ""} lastet opp`);
    } catch (err: any) {
      console.error("Photo upload error:", err);
      toast.error("Kunne ikke laste opp bilde");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
      if (cameraInput.current) cameraInput.current.value = "";
    }
  };

  const removePhoto = async (photo: DailyReportPhoto) => {
    try {
      await supabase.storage.from(BUCKET).remove([photo.path]);
    } catch (e) {
      console.warn("Storage remove failed:", e);
    }
    onChange(photos.filter((p) => p.path !== photo.path));
  };

  // Trigger preview load for all photos on mount/change
  photos.forEach((p) => {
    if (!previews[p.path]) loadPreview(p);
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => cameraInput.current?.click()}
          disabled={uploading}
        >
          <Camera className="h-4 w-4 mr-1" /> Ta bilde
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
          Last opp
        </Button>
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div key={photo.path} className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
              {previews[photo.path] ? (
                <img src={previews[photo.path]} alt={photo.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removePhoto(photo)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Fjern bilde"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
