import { Button } from "@/components/ui/button";

interface DraftRestoreBannerProps {
  savedAt: string;
  onRestore: () => void;
  onDiscard: () => void;
}

/** Felles banner for gjenoppretting av ulagret skjemautkast */
export function DraftRestoreBanner({ savedAt, onRestore, onDiscard }: DraftRestoreBannerProps) {
  return (
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm space-y-2">
      <p>Du har ulagrede svar fra {new Date(savedAt).toLocaleString("nb-NO", { hour12: false })}. Vil du fortsette der du slapp?</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onRestore}>Gjenopprett</Button>
        <Button size="sm" variant="ghost" onClick={onDiscard}>Forkast</Button>
      </div>
    </div>
  );
}
