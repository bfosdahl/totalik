import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { HmsSja, useHmsSja } from "@/hooks/useHmsSja";
import { useAuth } from "@/contexts/AuthContext";
import SignatureCanvas from "react-signature-canvas";

interface SjaRow {
  id: string;
  activity: string;
  risk: string;
  measure: string;
}

interface HmsSjaWizardProps {
  sja: HmsSja;
  onClose: () => void;
}

export function HmsSjaWizard({ sja, onClose }: HmsSjaWizardProps) {
  const { profile } = useAuth();
  const { updateSja, completeSja } = useHmsSja();
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSignature, setShowSignature] = useState(false);

  // Parse existing data into simplified rows
  const parseExistingRows = (): SjaRow[] => {
    if (sja.risks && sja.risks.length > 0) {
      return sja.risks.map((risk) => {
        const relatedMeasure = sja.measures?.find((m) => m.riskId === risk.id);
        return {
          id: risk.id,
          activity: (risk as any).activity || sja.work_description || "",
          risk: risk.description,
          measure: relatedMeasure?.description || "",
        };
      });
    }
    return [{ id: crypto.randomUUID(), activity: "", risk: "", measure: "" }];
  };

  const [rows, setRows] = useState<SjaRow[]>(parseExistingRows);
  const [participants, setParticipants] = useState(sja.participants || "");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCompleted = sja.status === "completed";

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), activity: "", risk: "", measure: "" },
    ]);
  };

  const updateRow = (id: string, field: keyof SjaRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Convert rows to database format
  const toDbFormat = useCallback(() => {
    const risks = rows
      .filter((r) => r.activity || r.risk || r.measure)
      .map((r) => ({
        id: r.id,
        description: r.risk,
        probability: 3,
        consequence: 3,
        activity: r.activity,
      }));

    const measures = rows
      .filter((r) => r.measure)
      .map((r) => ({
        id: crypto.randomUUID(),
        riskId: r.id,
        description: r.measure,
        responsible: "",
      }));

    return { risks, measures };
  }, [rows]);

  // Auto-save after 2 seconds of inactivity
  const triggerAutoSave = useCallback(() => {
    if (isCompleted) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(async () => {
      const { risks, measures } = toDbFormat();
      try {
        await updateSja.mutateAsync({
          id: sja.id,
          participants,
          risks: risks as any,
          measures: measures as any,
          work_description: rows.map((r) => r.activity).filter(Boolean).join("; "),
        });
      } catch {
        // Silent auto-save failure
      }
    }, 2000);
  }, [isCompleted, toDbFormat, sja.id, participants, rows, updateSja]);

  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [rows, participants]);

  const handleManualSave = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setIsSaving(true);
    const { risks, measures } = toDbFormat();
    try {
      await updateSja.mutateAsync({
        id: sja.id,
        participants,
        risks: risks as any,
        measures: measures as any,
        work_description: rows.map((r) => r.activity).filter(Boolean).join("; "),
        status: "active",
      });
      toast.success("SJA lagret");
    } catch {
      toast.error("Kunne ikke lagre");
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast.error("Signatur er påkrevd");
      return;
    }

    // Save first
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    const { risks, measures } = toDbFormat();
    try {
      await updateSja.mutateAsync({
        id: sja.id,
        participants,
        risks: risks as any,
        measures: measures as any,
        work_description: rows.map((r) => r.activity).filter(Boolean).join("; "),
      });
    } catch {
      toast.error("Kunne ikke lagre data");
      return;
    }

    const signature = sigCanvasRef.current.toDataURL();
    const completedByName =
      `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Ukjent";

    try {
      await completeSja.mutateAsync({
        id: sja.id,
        leaderSignature: signature,
        completedByName,
      });
      onClose();
    } catch {
      toast.error("Kunne ikke fullføre SJA");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{sja.sja_number}</Badge>
              {isCompleted && (
                <Badge className="bg-green-100 text-green-700">Fullført</Badge>
              )}
            </div>
            <h1 className="text-xl font-bold">{sja.title}</h1>
          </div>
        </div>
        {!isCompleted && (
          <Button onClick={handleManualSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Lagrer..." : "Lagre"}
          </Button>
        )}
      </div>

      {/* Simple table form */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Sikker Jobb Analyse</h2>

          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1fr_40px] gap-3 mb-3 px-1">
            <span className="text-base font-semibold text-foreground">
              Aktivitet (hva skal gjøres)
            </span>
            <span className="text-base font-semibold text-foreground">
              Identifisert risiko (hva kan gå galt)
            </span>
            <span className="text-base font-semibold text-foreground">
              Tiltak (hva gjør vi for å unngå det)
            </span>
            <span />
          </div>

          {/* Rows */}
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_40px] gap-3 p-3 border rounded-lg bg-muted/20"
              >
                <div>
                  <label className="text-sm font-semibold text-foreground sm:hidden mb-1 block">
                    Aktivitet
                  </label>
                  <Textarea
                    placeholder="Beskriv aktiviteten..."
                    value={row.activity}
                    onChange={(e) => updateRow(row.id, "activity", e.target.value)}
                    className="min-h-[120px] text-base leading-relaxed"
                    disabled={isCompleted}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground sm:hidden mb-1 block">
                    Risiko
                  </label>
                  <Textarea
                    placeholder="Hva kan gå galt?"
                    value={row.risk}
                    onChange={(e) => updateRow(row.id, "risk", e.target.value)}
                    className="min-h-[120px] text-base leading-relaxed"
                    disabled={isCompleted}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground sm:hidden mb-1 block">
                    Tiltak
                  </label>
                  <Textarea
                    placeholder="Risikoreduserende tiltak..."
                    value={row.measure}
                    onChange={(e) => updateRow(row.id, "measure", e.target.value)}
                    className="min-h-[120px] text-base leading-relaxed"
                    disabled={isCompleted}
                  />
                </div>
                <div className="flex items-start justify-end sm:justify-center pt-1">
                  {!isCompleted && rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeRow(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isCompleted && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={addRow}
            >
              <Plus className="h-4 w-4 mr-2" />
              Legg til rad
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <label className="text-sm font-medium block mb-2">
            Deltakere (hvem skal utføre arbeidet)
          </label>
          <Input
            placeholder="F.eks. Ola Nordmann, Kari Hansen"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            disabled={isCompleted}
          />
        </CardContent>
      </Card>

      {/* Signature section */}
      {isCompleted ? (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">SJA er fullført og signert</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Signert av {sja.completed_by_name} den{" "}
                {sja.completed_at &&
                  new Date(sja.completed_at).toLocaleDateString("nb-NO")}
              </p>
            </div>
            {sja.leader_signature && (
              <div className="mt-4">
                <label className="text-sm font-medium">Signatur</label>
                <img
                  src={sja.leader_signature}
                  alt="Signatur"
                  className="border rounded-lg max-h-32 bg-white mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 sm:p-6">
            {!showSignature ? (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => setShowSignature(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Fullfør og signer SJA
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                  Ved å signere bekrefter du at alle har forstått risikoene og
                  tiltakene som er beskrevet i denne SJA-en.
                </div>

                <div>
                  <label className="text-sm font-medium">Din signatur *</label>
                  <div className="border rounded-lg bg-white mt-1">
                    <SignatureCanvas
                      ref={sigCanvasRef}
                      canvasProps={{
                        className: "w-full h-40",
                        style: { width: "100%", height: "160px" },
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1"
                    onClick={() => sigCanvasRef.current?.clear()}
                  >
                    Tøm signatur
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowSignature(false)}
                  >
                    Avbryt
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleComplete}
                    disabled={completeSja.isPending}
                  >
                    {completeSja.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Fullfører...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Signer og fullfør
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
