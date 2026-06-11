import { useRef, useState, useEffect } from "react";
import { Camera, Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { compressImageFile, compressDataUrl } from "@/utils/imageCompression";

export interface DailyReportPhoto {
  path: string;
  name: string;
  uploaded_at: string;
  thumb_path?: string;
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

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(meta)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function DailyReportPhotoUploader({ photos, onChange }: Props) {
  const { profile } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "compressing" | "uploading">("idle");
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [previews, setPreviews] = useState<Record<string, string>>({});

  // Last preview kun for synlige bilder (thumb_path foretrukket)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = photos.filter((p) => !previews[p.path]);
      if (missing.length === 0) return;
      const next: Record<string, string> = {};
      for (const p of missing) {
        const key = p.thumb_path || p.path;
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(key, 60 * 60 * 24);
        if (data?.signedUrl) next[p.path] = data.signedUrl;
      }
      if (!cancelled && Object.keys(next).length) {
        setPreviews((prev) => ({ ...prev, ...next }));
      }
    })();
    return () => { cancelled = true; };
  }, [photos]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !profile?.company_id) return;
    setUploading(true);
    const total = files.length;
    setProgress({ done: 0, total });
    const uploaded: DailyReportPhoto[] = [];
    try {
      for (const rawFile of Array.from(files)) {
        // Komprimer original
        setPhase("compressing");
        const file = await compressImageFile(rawFile, { maxDim: 2000, quality: 0.85 });
        const safeName = sanitize(file.name);
        const baseId = crypto.randomUUID();
        const path = `${profile.company_id}/${baseId}-${safeName}`;
        const thumbPath = `${profile.company_id}/${baseId}-thumb-${safeName}`;

        // Generer thumb (400px JPEG)
        let thumbBlob: Blob | null = null;
        try {
          const dataUrl = await fileToDataUrl(file);
          const { dataUrl: thumbUrl } = await compressDataUrl(dataUrl, 400, 0.7);
          thumbBlob = dataUrlToBlob(thumbUrl);
        } catch (e) {
          console.warn("Thumb generation failed", e);
        }

        // Last opp original og thumb i parallell
        const uploads: Promise<any>[] = [
          supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false }),
        ];
        if (thumbBlob) {
          uploads.push(supabase.storage.from(BUCKET).upload(thumbPath, thumbBlob, { contentType: "image/jpeg", upsert: false }));
        }
        const results = await Promise.all(uploads);
        if (results[0].error) throw results[0].error;
        const thumbOk = thumbBlob && results[1] && !results[1].error;

        uploaded.push({
          path,
          name: rawFile.name,
          uploaded_at: new Date().toISOString(),
          thumb_path: thumbOk ? thumbPath : undefined,
        });
      }
      const next = [...photos, ...uploaded];
      onChange(next);
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
    const toRemove = [photo.path];
    if (photo.thumb_path) toRemove.push(photo.thumb_path);
    try {
      await supabase.storage.from(BUCKET).remove(toRemove);
    } catch (e) {
      console.warn("Storage remove failed:", e);
    }
    onChange(photos.filter((p) => p.path !== photo.path));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => cameraInput.current?.click()} disabled={uploading}>
          <Camera className="h-4 w-4 mr-1" /> Ta bilde
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
          Last opp
        </Button>
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div key={photo.path} className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
              {previews[photo.path] ? (
                <img src={previews[photo.path]} alt={photo.name} loading="lazy" className="w-full h-full object-cover" />
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
