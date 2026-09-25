import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { jevAssist } from "@/lib/jevAssist";

export interface JevFinding { ok: boolean; text: string }

interface Props {
  label: string;
  disabled?: boolean;
  hint?: string;
  /** Kjører sjekken og returnerer funn, eller null ved feil. */
  run: (call: typeof jevAssist) => Promise<JevFinding[] | null>;
}

/** Felles «smart sjekk»-boks. Lagrer ingenting. */
export function JevCheckPanel({ label, disabled, hint, run }: Props) {
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<JevFinding[] | null>(null);

  const go = async () => {
    setLoading(true); setFindings(null);
    try { setFindings(await run(jevAssist)); } finally { setLoading(false); }
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
      <Button type="button" variant="outline" onClick={go} disabled={loading || disabled} className="w-full sm:w-auto h-11 border-primary/50 bg-background text-primary font-semibold hover:bg-primary/10 hover:text-primary">
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
        {label}
      </Button>
      {disabled && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {findings && findings.length === 0 && (
        <p className="text-sm flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4" /> Ingen merknader.</p>
      )}
      {findings?.map((f, i) => (
        <p key={i} className="text-sm flex items-start gap-2">
          {f.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />}
          <span>{f.text}</span>
        </p>
      ))}
      <p className="text-[11px] text-muted-foreground">Forslag fra AI – du bestemmer selv.</p>
    </div>
  );
}
