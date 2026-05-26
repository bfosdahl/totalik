import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  ShieldAlert,
  Sparkles,
  Target,
  Upload,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  applyIkMatHandbookImport,
  IkMatImportResult,
  ParsedIkMatHandbookData,
} from "@/lib/applyIkMatHandbookImport";

interface IkMatHandbookImportUploaderProps {
  companyId: string;
  onImportComplete?: (result: IkMatImportResult) => void;
  className?: string;
}

type ImportStep = "upload" | "parsing" | "preview" | "importing" | "done";

export function IkMatHandbookImportUploader({
  companyId,
  onImportComplete,
  className,
}: IkMatHandbookImportUploaderProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [parsedData, setParsedData] = useState<
    ParsedIkMatHandbookData | null
  >(null);
  const [importResult, setImportResult] = useState<IkMatImportResult | null>(
    null,
  );
  const [error, setError] = useState<string>("");

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Filen er for stor. Maks 20MB.");
        return;
      }

      setFileName(file.name);
      setStep("parsing");
      setError("");

      try {
        const base64 = await fileToBase64(file);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Du må være logget inn");

        const response = await supabase.functions.invoke(
          "parse-ik-mat-handbook",
          { body: { fileBase64: base64, fileName: file.name } },
        );

        if (response.error) {
          throw new Error(response.error.message || "Feil ved parsing");
        }

        const result = response.data;
        if (!result?.success || !result?.data) {
          throw new Error(result?.error || "Ingen data returnert fra AI");
        }

        setParsedData(result.data);
        setStep("preview");
      } catch (err) {
        console.error("IK/MAT handbook parse error:", err);
        setError(err instanceof Error ? err.message : "Ukjent feil");
        setStep("upload");
        toast.error("Kunne ikke analysere håndboken. Prøv igjen.");
      }
    },
    [],
  );

  const handleImport = useCallback(async () => {
    if (!parsedData) return;
    setStep("importing");
    try {
      const result = await applyIkMatHandbookImport(companyId, parsedData);
      setImportResult(result);
      setStep("done");
      if (result.success) {
        toast.success("IK/MAT-håndboken ble importert!");
        onImportComplete?.(result);
      } else {
        toast.error(result.error || "Feil ved import");
      }
    } catch (err) {
      console.error("Import error:", err);
      setError(err instanceof Error ? err.message : "Ukjent feil");
      setStep("preview");
      toast.error("Feil ved import. Prøv igjen.");
    }
  }, [parsedData, companyId, onImportComplete]);

  const handleReset = () => {
    setStep("upload");
    setFileName("");
    setParsedData(null);
    setImportResult(null);
    setError("");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Importer fra eksisterende IK/MAT-håndbok
        </CardTitle>
        <CardDescription>
          Last opp en gammel IK-Mat-perm eller HACCP-dokumentasjon, så
          trekker AI ut virksomhetsinfo, organisering, HACCP, rutiner,
          renholdsplan og historiske avvik automatisk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "upload" && (
          <UploadStep onFileSelect={handleFileUpload} error={error} />
        )}
        {step === "parsing" && <ParsingStep fileName={fileName} />}
        {step === "preview" && parsedData && (
          <PreviewStep
            data={parsedData}
            onConfirm={handleImport}
            onCancel={handleReset}
          />
        )}
        {step === "importing" && <ImportingStep />}
        {step === "done" && importResult && (
          <DoneStep result={importResult} onReset={handleReset} />
        )}
      </CardContent>
    </Card>
  );
}

function UploadStep(
  { onFileSelect, error }: {
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error: string;
  },
) {
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/25">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="mb-1 text-sm font-medium">
            Klikk for å laste opp IK/MAT-håndbok
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, Word (.docx) eller bilder (JPG, PNG) — maks 20MB
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp"
          onChange={onFileSelect}
        />
      </label>
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium">Hva blir importert?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Utensils className="h-3 w-3" /> Virksomhetsinfo
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> Organisering
          </span>
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" /> Mål
          </span>
          <span className="flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" /> HACCP & risiko
          </span>
          <span className="flex items-center gap-1">
            <ClipboardList className="h-3 w-3" /> Rutiner & renhold
          </span>
          <span className="flex items-center gap-1">
            <AlertOctagon className="h-3 w-3" /> Historiske avvik
          </span>
        </div>
      </div>
    </div>
  );
}

function ParsingStep({ fileName }: { fileName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center">
        <p className="font-medium">Analyserer IK/MAT-håndboken...</p>
        <p className="text-sm text-muted-foreground mt-1">
          <FileText className="h-3 w-3 inline mr-1" />
          {fileName}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          AI-en leser dokumentet og trekker ut all matsikkerhets-info. Kan ta
          opptil 30 sekunder.
        </p>
      </div>
    </div>
  );
}

function PreviewStep(
  { data, onConfirm, onCancel }: {
    data: ParsedIkMatHandbookData;
    onConfirm: () => void;
    onCancel: () => void;
  },
) {
  const sections = [
    {
      icon: Utensils,
      label: "Virksomhetsinfo",
      count: data.companyInfo ? 1 : 0,
      items: data.companyInfo
        ? [
          data.companyInfo.firmanavn,
          data.companyInfo.virksomhetstype,
          data.companyInfo.beskrivelse,
        ].filter(Boolean) as string[]
        : [],
    },
    {
      icon: Users,
      label: "Organisering / roller",
      count: data.organization?.roles?.length || 0,
      items: data.organization?.roles?.map((r) =>
        `${r.title}${r.name ? ": " + r.name : ""}`
      ),
    },
    {
      icon: Target,
      label: "Mål",
      count: data.goals?.length || 0,
      items: data.goals,
    },
    {
      icon: ShieldAlert,
      label: "Risiko / farekilder",
      count: data.risks?.length || 0,
      items: data.risks?.map((r) => r.hazard),
    },
    {
      icon: Sparkles,
      label: "HACCP-punkter",
      count: data.haccp?.length || 0,
      items: data.haccp?.map((h) => `${h.step}: ${h.hazard}`),
    },
    {
      icon: ClipboardList,
      label: "Rutiner",
      count: data.routines?.length || 0,
      items: data.routines?.map((r) => r.name),
    },
    {
      icon: ClipboardList,
      label: "Renholdsplan",
      count: data.cleaningPlan?.length || 0,
      items: data.cleaningPlan?.map((c) =>
        `${c.area} (${c.frequency || "?"})`
      ),
    },
    {
      icon: AlertOctagon,
      label: "Historiske avvik",
      count: data.deviations?.length || 0,
      items: data.deviations?.map((d) => `${d.dato || "?"}: ${d.tittel}`),
    },
  ];

  const totalItems = sections.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">
            Funnet {totalItems} elementer i håndboken
          </p>
          {data.companyInfo?.firmanavn && (
            <p className="text-xs text-muted-foreground">
              {data.companyInfo.firmanavn}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[400px] pr-3">
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.label} className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <section.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{section.label}</span>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {section.count}
                </Badge>
              </div>
              {section.items && section.items.length > 0 && (
                <ul className="space-y-1">
                  {(section.items as string[]).slice(0, 5).map((item, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground pl-6 truncate"
                    >
                      • {item}
                    </li>
                  ))}
                  {section.items.length > 5 && (
                    <li className="text-xs text-muted-foreground pl-6 italic">
                      ...og {section.items.length - 5} til
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Avbryt
        </Button>
        <Button onClick={onConfirm} className="flex-1">
          <ArrowRight className="h-4 w-4 mr-2" />
          Importer alt ({totalItems} elementer)
        </Button>
      </div>
    </div>
  );
}

function ImportingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center">
        <p className="font-medium">Importerer data...</p>
        <p className="text-xs text-muted-foreground mt-2">
          Virksomhetsinfo, HACCP, rutiner, renholdsplan og avvik overføres nå.
        </p>
      </div>
    </div>
  );
}

function DoneStep(
  { result, onReset }: { result: IkMatImportResult; onReset: () => void },
) {
  const { summary } = result;
  return (
    <div className="space-y-4">
      <Alert className="border-success bg-success/10">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <AlertDescription className="text-success">
          IK/MAT-håndboken ble importert! Du kan justere videre i AI-veiviseren
          nedenfor.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Mål", count: summary.goals, icon: Target },
          { label: "Risiko", count: summary.risks, icon: ShieldAlert },
          { label: "HACCP", count: summary.haccp, icon: Sparkles },
          { label: "Rutiner", count: summary.routines, icon: ClipboardList },
          {
            label: "Renhold",
            count: summary.cleaningPlan,
            icon: ClipboardList,
          },
          { label: "Avvik", count: summary.deviations, icon: AlertOctagon },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-muted/50 rounded-lg p-3 text-center"
          >
            <item.icon className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{item.count}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={onReset} className="w-full">
        Last opp en ny håndbok
      </Button>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
