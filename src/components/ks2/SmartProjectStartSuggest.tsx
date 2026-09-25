import { useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { jevAssist } from "@/lib/jevAssist";
import { ProjectType } from "@/hooks/useKsModule2Projects";

type Suggestion = {
  projectType: ProjectType;
  typeConfidence: number | null;
  template: { id: string; name: string; confidence: number | null } | null;
};

const TYPE_NAMES: Record<string, string> = {
  standard: "Standard prosjekt",
  small: "Lite prosjekt",
  mini: "Mini prosjekt",
};

/** Bruker limer inn en beskrivelse av jobben og får forslag til prosjekttype og mal. */
export function SmartProjectStartSuggest({
  templates, onApply,
}: {
  templates: { id: string; name: string; description?: string }[];
  onApply: (projectType: ProjectType, templateId?: string) => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Suggestion | null>(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    const d = await jevAssist<Suggestion>({
      mode: "project_start",
      description: text,
      templates: templates.filter((x) => x.id !== "blank"),
    });
    if (d) setResult(d);
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 mb-6">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4 text-primary" /> Usikker på hvilken type? Beskriv jobben
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="F.eks: Vi skal bygge et tilbygg på 40 m² til en enebolig, med grunnarbeid og tak."
        className="min-h-[70px] bg-background"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={run} disabled={text.trim().length < 10 || loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Foreslå oppsett
        </Button>
        {result && (
          <>
            <span className="text-sm">
              Forslag: <strong>{TYPE_NAMES[result.projectType] || result.projectType}</strong>
              {result.template ? <> med malen <strong>{result.template.name}</strong></> : null}
            </span>
            <Button
              type="button" size="sm"
              onClick={() => onApply(result.projectType, result.template?.id)}
            >
              <Check className="h-4 w-4 mr-1" /> Bruk forslaget
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
