import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Photo {
  path: string;
  name: string;
}

interface Props {
  photos: Photo[];
}

const BUCKET = "daily-report-photos";

export function DailyReportPhotoGallery({ photos }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const p of photos) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(p.path, 3600);
        if (data?.signedUrl) next[p.path] = data.signedUrl;
      }
      if (!cancelled) setUrls(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [photos]);

  if (!photos?.length) return null;

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.path}
            type="button"
            onClick={() => urls[photo.path] && setLightbox(urls[photo.path])}
            className="relative aspect-square rounded-md overflow-hidden border bg-muted hover:opacity-90 transition-opacity"
          >
            {urls[photo.path] ? (
              <img src={urls[photo.path]} alt={photo.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}
