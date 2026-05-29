import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  ClipboardCheck, Plus, Search, Calendar, User, MapPin, FileText, Download, Eye,
  Trash2, Loader2, AlertTriangle, ArrowLeft, Save, Shield, CheckCircle2, Edit
} from "lucide-react";
import { useKsModule2Sja, CreateSjaInput, KsModule2Sja } from "@/hooks/useKsModule2Sja";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// === Detail/Edit View ===
function Ks2SjaDetail({ sja, onClose }: { sja: KsModule2Sja; onClose: () => void }) {
  const { projectId } = useParams();
  const { profile } = useAuth();
  const { updateSja, completeSja } = useKsModule2Sja(projectId);
  const sigRef = useRef<SignatureCanvas>(null);

  const [step, setStep] = useState(1);
  const [workDescription, setWorkDescription] = useState(sja.work_description || "");
  const [participants, setParticipants] = useState<string>(sja.participants?.join(", ") || "");
  const [risks, setRisks] = useState(sja.identified_risks || []);
  const [measures, setMeasures] = useState(sja.risk_reducing_measures || []);
  const [notes, setNotes] = useState(sja.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newRisk, setNewRisk] = useState({ description: "", consequence: "Moderat", probability: "Mulig" });
  const isCompleted = sja.status === "completed";

  const autoSave = useCallback(async (updatedRisks?: typeof risks, updatedMeasures?: typeof measures) => {
    if (isCompleted) return;
    const risksToSave = updatedRisks ?? risks;
    const measuresToSave = updatedMeasures ?? measures;
    try {
      await updateSja.mutateAsync({
        id: sja.id,
        work_description: workDescription,
        participants: participants.split(",").map(p => p.trim()).filter(Boolean),
        identified_risks: risksToSave,
        risk_reducing_measures: measuresToSave,
        notes,
        status: sja.status === "draft" ? "active" : sja.status,
      });
    } catch {
      // silent - manual save still available
    }
  }, [sja.id, sja.status, workDescription, participants, risks, measures, notes, isCompleted, updateSja]);

  const debouncedAutoSave = useCallback((...args: Parameters<typeof autoSave>) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => autoSave(...args), 2000);
  }, [autoSave]);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  const addRisk = () => {
    if (!newRisk.description) return;
    const updated = [...risks, { ...newRisk }];
    setRisks(updated);
    setNewRisk({ description: "", consequence: "Moderat", probability: "Mulig" });
    debouncedAutoSave(updated, measures);
  };

  const removeRisk = (index: number) => {
    const updatedRisks = risks.filter((_, i) => i !== index);
    const updatedMeasures = measures.filter(m => m.risk !== risks[index]?.description);
    setRisks(updatedRisks);
    setMeasures(updatedMeasures);
    debouncedAutoSave(updatedRisks, updatedMeasures);
  };

  const addMeasure = (riskDesc: string) => {
    const updated = [...measures, { risk: riskDesc, measure: "", responsible: "" }];
    setMeasures(updated);
    debouncedAutoSave(risks, updated);
  };

  const updateMeasure = (index: number, updates: Partial<typeof measures[0]>) => {
    const updated = measures.map((m, i) => i === index ? { ...m, ...updates } : m);
    setMeasures(updated);
    debouncedAutoSave(risks, updated);
  };

  const removeMeasure = (index: number) => {
    const updated = measures.filter((_, i) => i !== index);
    setMeasures(updated);
    debouncedAutoSave(risks, updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSja.mutateAsync({
        id: sja.id,
        work_description: workDescription,
        participants: participants.split(",").map(p => p.trim()).filter(Boolean),
        identified_risks: risks,
        risk_reducing_measures: measures,
        notes,
        status: "active",
      });
    } catch {
      toast.error("Kunne ikke lagre");
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Signatur er påkrevd");
      return;
    }
    try {
      await completeSja.mutateAsync({
        id: sja.id,
        signature_data: sigRef.current.toDataURL(),
      });
      onClose();
    } catch {
      toast.error("Kunne ikke fullføre SJA");
    }
  };
  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const writeParagraph = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {}) => {
      const { size = 10, bold = false, color = [40, 40, 40], gap = 4 } = opts;
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, contentWidth);
      ensureSpace(lines.length * (size * 0.45) + gap);
      doc.text(lines, margin, y);
      y += lines.length * (size * 0.45) + gap;
    };

    // === Header bar ===
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 26, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SIKKER JOBB ANALYSE (SJA)", margin, 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(sja.sja_number, pageWidth - margin, 12, { align: "right" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(sja.title || "", margin, 21);
    y = 34;

    // === Metadata table ===
    const metaRows: [string, string][] = [
      ["Prosjekt", sja.title || "-"],
      ["Lokasjon", sja.location || "-"],
      ["Ansvarlig", sja.responsible_name || "-"],
      ["Planlagt dato", sja.planned_date ? format(new Date(sja.planned_date), "d. MMMM yyyy", { locale: nb }) : "-"],
      ["Deltakere", (sja.participants && sja.participants.length > 0) ? sja.participants.join(", ") : "-"],
      ["Status", sja.status === "completed" ? "Fullført" : sja.status === "active" ? "Aktiv" : "Utkast"],
    ];
    autoTable(doc, {
      startY: y,
      body: metaRows,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5, textColor: [40, 40, 40] },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [240, 244, 248], cellWidth: 40 },
        1: { cellWidth: contentWidth - 40 },
      },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // === Arbeidsbeskrivelse ===
    if (workDescription && workDescription.trim()) {
      writeParagraph("Arbeidsbeskrivelse", { size: 13, bold: true, color: [30, 58, 95], gap: 3 });
      doc.setDrawColor(30, 58, 95);
      doc.setLineWidth(0.4);
      doc.line(margin, y - 1, margin + 30, y - 1);
      y += 2;
      writeParagraph(workDescription, { size: 10, gap: 6 });
    }

    // === Risiko og tiltak ===
    writeParagraph("Risiko og tiltak", { size: 13, bold: true, color: [30, 58, 95], gap: 3 });
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.4);
    doc.line(margin, y - 1, margin + 30, y - 1);
    y += 3;

    if (risks.length === 0) {
      writeParagraph("Ingen risikoer registrert.", { size: 10, color: [120, 120, 120], gap: 6 });
    }

    risks.forEach((r, i) => {
      const relatedMeasures = measures.filter(m => m.risk === r.description);

      ensureSpace(20);
      // Risk title
      writeParagraph(`${i + 1}. ${r.description?.split(/[.!?]/)[0]?.slice(0, 80) || "Risiko"}`, {
        size: 11, bold: true, color: [30, 58, 95], gap: 2,
      });

      // Severity badges line
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(110, 110, 110);
      doc.text(`Sannsynlighet: ${r.probability}   |   Konsekvens: ${r.consequence}`, margin, y);
      y += 5;

      // Risiko body
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      ensureSpace(6);
      doc.text("Risiko:", margin, y);
      y += 5;
      writeParagraph(r.description || "-", { size: 10, gap: 4 });

      // Tiltak
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      ensureSpace(6);
      doc.text("Tiltak:", margin, y);
      y += 5;

      if (relatedMeasures.length === 0) {
        writeParagraph("Ingen tiltak registrert.", { size: 10, color: [120, 120, 120], gap: 4 });
      } else {
        relatedMeasures.forEach((m) => {
          const bulletText = m.measure || "-";
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(40, 40, 40);
          const lines = doc.splitTextToSize(bulletText, contentWidth - 6);
          ensureSpace(lines.length * 5 + 2);
          doc.text("•", margin, y);
          doc.text(lines, margin + 5, y);
          y += lines.length * 5;
          if (m.responsible) {
            doc.setFontSize(8);
            doc.setTextColor(110, 110, 110);
            doc.text(`Ansvarlig: ${m.responsible}`, margin + 5, y + 1);
            y += 4;
          }
          y += 2;
        });
      }

      // Divider between risks
      y += 3;
      doc.setDrawColor(220, 226, 232);
      doc.setLineWidth(0.2);
      ensureSpace(2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    });

    // === Notes ===
    if (notes && notes.trim()) {
      y += 2;
      writeParagraph("Merknader", { size: 13, bold: true, color: [30, 58, 95], gap: 3 });
      doc.setDrawColor(30, 58, 95);
      doc.setLineWidth(0.4);
      doc.line(margin, y - 1, margin + 30, y - 1);
      y += 2;
      writeParagraph(notes, { size: 10, gap: 6 });
    }

    // === Signature ===
    if (sja.status === "completed" && sja.signature_data) {
      ensureSpace(45);
      y += 4;
      writeParagraph("Signatur", { size: 13, bold: true, color: [30, 58, 95], gap: 3 });
      doc.setDrawColor(30, 58, 95);
      doc.setLineWidth(0.4);
      doc.line(margin, y - 1, margin + 30, y - 1);
      y += 3;
      try {
        doc.addImage(sja.signature_data, "PNG", margin, y, 60, 25);
      } catch { /* skip */ }
      y += 28;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(
        `Signert av ${sja.completed_by_name || "-"} den ${sja.completed_at ? format(new Date(sja.completed_at), "d. MMMM yyyy", { locale: nb }) : "-"}`,
        margin, y,
      );
    }

    // === Footer with page numbers ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.setFont("helvetica", "normal");
      doc.text(`${sja.sja_number} – ${sja.title}`, margin, pageHeight - 8);
      doc.text(`Side ${i} av ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
    }

    doc.save(`SJA_${sja.sja_number}.pdf`);
    toast.success("PDF lastet ned");
  };


  const steps = [
    { n: 1, title: "Arbeidsbeskrivelse", icon: FileText },
    { n: 2, title: "Risikoer", icon: AlertTriangle },
    { n: 3, title: "Tiltak", icon: Shield },
    { n: 4, title: "Signering", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{sja.sja_number}</Badge>
              {isCompleted && <Badge className="bg-success/20 text-success">Fullført</Badge>}
            </div>
            <h1 className="text-xl font-bold truncate">{sja.title}</h1>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          {!isCompleted && (
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Lagrer..." : "Lagre"}
            </Button>
          )}
        </div>
      </div>

      {/* Steps - horizontal scroll on mobile */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.n;
          const isDone = step > s.n;
          return (
            <div key={s.n} className="flex items-center shrink-0">
              <button
                onClick={() => setStep(s.n)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isDone && "bg-success/20 text-success",
                  !isActive && !isDone && "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium whitespace-nowrap">{s.title}</span>
              </button>
              {idx < steps.length - 1 && (
                <div className={cn("w-8 h-0.5 mx-1", isDone ? "bg-success" : "bg-muted")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" /> Arbeidsbeskrivelse
              </h2>
              <div>
                <Label>Beskrivelse av arbeidet *</Label>
                <Textarea
                  placeholder="Beskriv arbeidet som skal utføres i detalj..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  className="min-h-[120px]"
                  disabled={isCompleted}
                />
              </div>
              <div>
                <Label>Deltakere (kommaseparert)</Label>
                <Input
                  placeholder="Ola Nordmann, Kari Hansen"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  disabled={isCompleted}
                />
              </div>
              <div>
                <Label>Merknader</Label>
                <Textarea
                  placeholder="Eventuelle merknader..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isCompleted}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)}>Neste: Risikoer</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" /> Identifiser risikoer
              </h2>

              {!isCompleted && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <Label>Beskriv risiko/fare *</Label>
                      <Textarea
                        placeholder="Hva kan gå galt?"
                        value={newRisk.description}
                        onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                        className="min-h-[60px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Sannsynlighet</Label>
                        <Select value={newRisk.probability} onValueChange={(v) => setNewRisk({ ...newRisk, probability: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Svært lite sannsynlig">Svært lite sannsynlig</SelectItem>
                            <SelectItem value="Lite sannsynlig">Lite sannsynlig</SelectItem>
                            <SelectItem value="Mulig">Mulig</SelectItem>
                            <SelectItem value="Sannsynlig">Sannsynlig</SelectItem>
                            <SelectItem value="Svært sannsynlig">Svært sannsynlig</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Konsekvens</Label>
                        <Select value={newRisk.consequence} onValueChange={(v) => setNewRisk({ ...newRisk, consequence: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ubetydelig">Ubetydelig</SelectItem>
                            <SelectItem value="Liten">Liten</SelectItem>
                            <SelectItem value="Moderat">Moderat</SelectItem>
                            <SelectItem value="Alvorlig">Alvorlig</SelectItem>
                            <SelectItem value="Svært alvorlig">Svært alvorlig</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={addRisk} disabled={!newRisk.description}>
                      <Plus className="h-4 w-4 mr-2" /> Legg til risiko
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {risks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Ingen risikoer identifisert ennå</p>
                  </div>
                ) : (
                  risks.map((risk, idx) => (
                    <div key={idx} className="border rounded-lg p-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{risk.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sannsynlighet: {risk.probability} | Konsekvens: {risk.consequence}
                        </p>
                      </div>
                      {!isCompleted && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeRisk(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Tilbake</Button>
                <Button onClick={() => setStep(3)} disabled={risks.length === 0}>Neste: Tiltak</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-success" /> Risikoreduserende tiltak
              </h2>

              {risks.map((risk, rIdx) => {
                const riskMeasures = measures.filter(m => m.risk === risk.description);
                return (
                  <Card key={rIdx}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{risk.description}</CardTitle>
                        {!isCompleted && (
                          <Button size="sm" variant="outline" onClick={() => addMeasure(risk.description)}>
                            <Plus className="h-4 w-4 mr-1" /> Tiltak
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {riskMeasures.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Ingen tiltak definert</p>
                      ) : (
                        <div className="space-y-2">
                          {riskMeasures.map((m) => {
                            const mIdx = measures.indexOf(m);
                            return (
                              <div key={mIdx} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
                                <Textarea
                                  placeholder="Beskriv tiltak..."
                                  value={m.measure}
                                  onChange={(e) => updateMeasure(mIdx, { measure: e.target.value })}
                                  className="flex-1 min-h-[80px]"
                                  rows={3}
                                  disabled={isCompleted}
                                />
                                <div className="flex gap-2 sm:flex-col sm:w-40">
                                  <Input
                                    placeholder="Ansvarlig"
                                    value={m.responsible}
                                    onChange={(e) => updateMeasure(mIdx, { responsible: e.target.value })}
                                    className="flex-1 sm:w-full"
                                    disabled={isCompleted}
                                  />
                                  {!isCompleted && (
                                    <Button variant="ghost" size="sm" className="text-destructive self-start" onClick={() => removeMeasure(mIdx)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>Tilbake</Button>
                <Button onClick={() => setStep(4)}>Neste: Signering</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" /> Signering og godkjenning
              </h2>

              {isCompleted ? (
                <div className="space-y-4">
                  <div className="p-4 bg-success/10 rounded-lg border border-success/30">
                    <div className="flex items-center gap-2 text-success mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">SJA er fullført og signert</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Signert av {sja.completed_by_name} den{" "}
                      {sja.completed_at && format(new Date(sja.completed_at), "d. MMMM yyyy", { locale: nb })}
                    </p>
                  </div>
                  {sja.signature_data && (
                    <div>
                      <Label>Signatur</Label>
                      <img src={sja.signature_data} alt="Signatur" className="border rounded-lg max-h-32 bg-white mt-1" />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="p-4 bg-info/10 rounded-lg border border-info/30 text-sm space-y-1">
                    <p><strong>Risikoer:</strong> {risks.length} identifisert</p>
                    <p><strong>Tiltak:</strong> {measures.length} definert</p>
                    <p>Ved å signere bekrefter du at alle har forstått risikoene og tiltakene.</p>
                  </div>

                  <div>
                    <Label>Din signatur *</Label>
                    <div className="border rounded-lg bg-white mt-1">
                      <SignatureCanvas
                        ref={sigRef}
                        canvasProps={{ className: "w-full h-40", style: { width: "100%", height: "160px" } }}
                      />
                    </div>
                    <Button variant="ghost" size="sm" className="mt-1" onClick={() => sigRef.current?.clear()}>
                      Tøm signatur
                    </Button>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(3)}>Tilbake</Button>
                    <Button
                      onClick={handleComplete}
                      disabled={completeSja.isPending}
                      className="bg-success hover:bg-success/90"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {completeSja.isPending ? "Fullfører..." : "Fullfør og signer SJA"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// === Main List View ===
export default function Ks2Sja() {
  const { projectId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedSja, setSelectedSja] = useState<KsModule2Sja | null>(null);
  const [formData, setFormData] = useState<Partial<CreateSjaInput>>({
    title: "",
    work_description: "",
    location: "",
    planned_date: format(new Date(), "yyyy-MM-dd"),
    responsible_name: "",
    overall_risk_level: "medium",
  });

  const { sjaList, isLoading, createSja, deleteSja } = useKsModule2Sja(projectId);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "high": return <Badge variant="destructive">Høy risiko</Badge>;
      case "medium": return <Badge className="bg-warning text-warning-foreground">Middels risiko</Badge>;
      case "low": return <Badge className="bg-success text-success-foreground">Lav risiko</Badge>;
      default: return <Badge variant="secondary">Ikke vurdert</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-success text-success-foreground">Fullført</Badge>;
      case "active": return <Badge>Aktiv</Badge>;
      case "draft": return <Badge variant="secondary">Utkast</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredRecords = sjaList.filter(
    (sja) =>
      sja.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sja.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sja.sja_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!projectId || !formData.title || !formData.responsible_name || !formData.planned_date) return;

    const result = await createSja.mutateAsync({
      project_id: projectId,
      title: formData.title,
      work_description: formData.work_description,
      location: formData.location,
      planned_date: formData.planned_date,
      responsible_name: formData.responsible_name,
      overall_risk_level: formData.overall_risk_level,
    });

    setShowNewDialog(false);
    setFormData({
      title: "", work_description: "", location: "",
      planned_date: format(new Date(), "yyyy-MM-dd"),
      responsible_name: "", overall_risk_level: "medium",
    });

    // Open the detail view immediately so user can add risks
    if (result) {
      setSelectedSja(result as unknown as KsModule2Sja);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne SJA-en?")) {
      await deleteSja.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-success" />
      </div>
    );
  }

  // Show detail view
  if (selectedSja) {
    return <Ks2SjaDetail sja={selectedSja} onClose={() => setSelectedSja(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <ClipboardCheck className="h-6 w-6 text-success" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">SJA - Sikker Jobb Analyse</h2>
            <p className="text-muted-foreground">Risikovurdering før arbeid starter</p>
          </div>
        </div>
        <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ny SJA
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Søk etter SJA..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {/* List */}
      {filteredRecords.length > 0 ? (
        <div className="space-y-4">
          {filteredRecords.map((sja) => (
            <Card
              key={sja.id}
              className="hover:border-success/50 transition-colors cursor-pointer"
              onClick={() => setSelectedSja(sja)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{sja.title}</CardTitle>
                      <span className="text-sm text-muted-foreground">({sja.sja_number})</span>
                    </div>
                    {sja.location && (
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" /> {sja.location}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {getStatusBadge(sja.status)}
                    {getRiskBadge(sja.overall_risk_level)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sja.work_description && (
                  <p className="text-sm text-muted-foreground mb-3">{sja.work_description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(sja.planned_date), "d. MMMM yyyy", { locale: nb })}
                  </span>
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Ansvarlig: {sja.responsible_name}
                  </span>
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {sja.identified_risks.length} risikoer
                  </span>
                </div>
                <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={() => setSelectedSja(sja)}>
                    {sja.status === "completed" ? <Eye className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                    {sja.status === "completed" ? "Vis" : "Rediger"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(sja.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen SJA funnet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? "Ingen treff på søket ditt" : "Opprett din første SJA for dette prosjektet"}
            </p>
            <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => setShowNewDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Ny SJA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New SJA Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Ny Sikker Jobb Analyse
            </DialogTitle>
            <DialogDescription>Opprett en ny SJA for å vurdere risiko før arbeid starter</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tittel / Arbeidsoppgave *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="F.eks. Arbeid i høyden - Tak"
              />
            </div>
            <div className="space-y-2">
              <Label>Beskrivelse av arbeidet</Label>
              <Textarea
                value={formData.work_description}
                onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                placeholder="Beskriv arbeidet som skal utføres..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lokasjon</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="F.eks. Tak, 3. etasje"
                />
              </div>
              <div className="space-y-2">
                <Label>Planlagt dato *</Label>
                <Input
                  type="date"
                  value={formData.planned_date}
                  onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ansvarlig *</Label>
              <Input
                value={formData.responsible_name}
                onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
                placeholder="Navn på ansvarlig person"
              />
            </div>
            <div className="space-y-2">
              <Label>Risikonivå</Label>
              <Select value={formData.overall_risk_level} onValueChange={(v) => setFormData({ ...formData, overall_risk_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Lav risiko</SelectItem>
                  <SelectItem value="medium">Middels risiko</SelectItem>
                  <SelectItem value="high">Høy risiko</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Avbryt</Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleCreate}
              disabled={!formData.title || !formData.responsible_name || !formData.planned_date || createSja.isPending}
            >
              {createSja.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Oppretter...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Opprett SJA</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
