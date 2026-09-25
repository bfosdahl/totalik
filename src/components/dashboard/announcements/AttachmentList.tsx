import { useEffect, useState } from "react";
import { FileText, Paperclip } from "lucide-react";
import { AnnouncementAttachment, getSignedUrls } from "@/hooks/useCompanyAnnouncements";

export function AttachmentList({ items }: { items: AnnouncementAttachment[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = items.map((i) => i.path).join("|");

  useEffect(() => {
    let alive = true;
    getSignedUrls(items.map((i) => i.path)).then((m) => alive && setUrls(m));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!items.length) return null;
  const images = items.filter((i) => i.type?.startsWith("image/"));
  const files = items.filter((i) => !i.type?.startsWith("image/"));

  return (
    <div className="mt-2 space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) =>
            urls[img.path] ? (
              <a key={img.path} href={urls[img.path]} target="_blank" rel="noreferrer">
                <img
                  src={urls[img.path]}
                  alt={img.name}
                  className="h-24 w-24 rounded-md border border-border object-cover"
                />
              </a>
            ) : (
              <div key={img.path} className="h-24 w-24 rounded-md bg-muted animate-pulse" />
            )
          )}
        </div>
      )}
      {files.map((f) => (
        <a
          key={f.path}
          href={urls[f.path]}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-sm hover:bg-muted"
        >
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{f.name}</span>
        </a>
      ))}
    </div>
  );
}

export function PendingFiles({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((f, i) => (
        <button
          key={`${f.name}-${i}`}
          type="button"
          onClick={() => onRemove(i)}
          className="flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-1 text-xs"
          title="Fjern"
        >
          <Paperclip className="h-3 w-3" />
          <span className="max-w-[140px] truncate">{f.name}</span>
          <span className="text-muted-foreground">×</span>
        </button>
      ))}
    </div>
  );
}
