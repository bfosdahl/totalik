import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Photo {
  path: string;
  name: string;
  thumb_path?: string;
}

interface Props {
  photos: Photo[];
}

const BUCKET = "daily-report-photos";

export function DailyReportPhotoGallery({ photos }: Props) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [loadingLightbox, setLoadingLightbox] = useState(false);

  // Last kun thumbnails for grid (24t cache)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const p of photos) {
        if (thumbs[p.path]) continue;
        const key = p.thumb_path || p.path;
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(key, 60 * 60 * 24);
        if (data?.signedUrl) next[p.path] = data.signedUrl;
      }
      if (!cancelled && Object.keys(next).length) setThumbs((prev) => ({ ...prev, ...next }));
    })();
    return () => { cancelled = true; };
  }, [photos]); // eslint-disable-line react-hooks/exhaustive-deps

  const openFull = async (photo: Photo) => {
    setLoadingLightbox(true);
    try {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(photo.path, 60 * 60);
      if (data?.signedUrl) setLightbox(data.signedUrl);
    } finally {
      setLoadingLightbox(false);
    }
  };

  if (!photos?.length) return null;

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.path}
            type="button"
            onClick={() => openFull(photo)}
            className="relative aspect-square rounded-md overflow-hidden border bg-muted hover:opacity-90 transition-opacity"
          >
            {thumbs[photo.path] ? (
              <img src={thumbs[photo.path]} alt={photo.name} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>
      {(lightbox || loadingLightbox) && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {lightbox ? (
            <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-white">Laster…</div>
          )}
        </div>
      )}
    </>
  );
}
