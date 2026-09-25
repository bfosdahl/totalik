import { useState } from "react";
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Result {
  employeeId: string;
  name: string;
  warnings: string[];
  competence: { noul: number; missing: boolean } | null;
}

export function SmartShiftCheck(props: {
  employeeIds: string[];
  dates: string[];
  startTime: string;
  endTime: string;
  role?: string;
  location?: string;
  projectName?: string;
  notes?: string;
  excludeScheduleId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [checkedCompetence, setCheckedCompetence] = useState(false);
  const ready = props.employeeIds.length > 0 && props.dates.length > 0 && props.dates[0];

  const run = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("jev-assist", { body: { mode: "shift", ...props } });
      if (error || data?.error) {
        let msg = data?.error;
        try { msg = msg || (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
        toast.error(msg || "Kunne ikke sjekke vakten nå");
        return;
      }
      setResults(data.results || []);
      setCheckedCompetence(!!data.checkedCompetence);
    } finally {
      setLoading(false);
    }
  };

  const flagged = (results || []).filter((r) => r.warnings.length || r.competence?.missing);

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4 text-primary" /> Smart vaktsjekk
        </span>
        <Button type="button" size="sm" variant="outline" onClick={run} disabled={!ready || loading}>
          {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Sjekk vakten
        </Button>
      </div>
      {!results && (
        <p className="text-xs text-muted-foreground">
          Sjekker fravær, dobbeltbooking, 11 timers hvile og om kursene passer til rolle/prosjekt.
        </p>
      )}
      {results && flagged.length === 0 && (
        <p className="flex items-center gap-1 text-sm">
          <CheckCircle2 className="h-4 w-4 text-primary" /> Ingen konflikter funnet
          {!checkedCompetence && " (velg rolle eller prosjekt for å sjekke kompetanse)"}
        </p>
      )}
      {flagged.map((r) => (
        <div key={r.employeeId} className="rounded border border-destructive/30 bg-destructive/5 p-2 text-sm">
          <p className="font-medium flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-destructive" /> {r.name}
          </p>
          <ul className="ml-5 list-disc text-xs">
            {r.warnings.map((w) => <li key={w}>{w}</li>)}
            {r.competence?.missing && <li>Mangler trolig kurs/sertifikat for denne jobben – sjekk kompetanse</li>}
          </ul>
        </div>
      ))}
      {results && <p className="text-xs text-muted-foreground">Bare forslag – du kan lagre vakten likevel.</p>}
    </div>
  );
}
