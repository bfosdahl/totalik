import { useState, useRef } from "react";
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

  const [newRisk, setNewRisk] = useState({ description: "", consequence: "Moderat", probability: "Mulig" });

  const isCompleted = sja.status === "completed";

  const addRisk = () => {
    if (!newRisk.description) return;
    setRisks([...risks, { ...newRisk }]);
    setNewRisk({ description: "", consequence: "Moderat", probability: "Mulig" });
  };

  const removeRisk = (index: number) => {
    setRisks(risks.filter((_, i) => i !== index));
    setMeasures(measures.filter(m => m.risk !== risks[index]?.description));
  };

  const addMeasure = (riskDesc: string) => {
    setMeasures([...measures, { risk: riskDesc, measure: "", responsible: "" }]);
  };

  const updateMeasure = (index: number, updates: Partial<typeof measures[0]>) => {
    setMeasures(measures.map((m, i) => i === index ? { ...m, ...updates } : m));
  };

  const removeMeasure = (index: number) => {
    setMeasures(measures.filter((_, i) => i !== index));
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
    const margin = 20;
    let y = margin;

    doc.setFontSize(18);
    doc.text("Sikker Jobb Analyse (SJA)", margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`${sja.sja_number} | ${sja.title}`, margin, y);
    y += 8;
    doc.text(`Dato: ${format(new Date(sja.planned_date), "d. MMMM yyyy", { locale: nb })}`, margin, y);
    y += 6;
    doc.text(`Ansvarlig: ${sja.responsible_name}`, margin, y);
    y += 6;
    if (sja.location) { doc.text(`Lokasjon: ${sja.location}`, margin, y); y += 6; }
    y += 4;

    doc.setFontSize(12);
    doc.text("Arbeidsbeskrivelse", margin, y); y += 6;
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(workDescription || "-", 170);
    doc.text(descLines, margin, y); y += descLines.length * 5 + 6;

    doc.setFontSize(12);
    doc.text("Identifiserte risikoer", margin, y); y += 6;
    doc.setFontSize(10);
    risks.forEach((r, i) => {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.text(`${i + 1}. ${r.description} (S: ${r.probability}, K: ${r.consequence})`, margin, y);
      y += 6;
    });
    if (risks.length === 0) { doc.text("Ingen risikoer registrert", margin, y); y += 6; }
    y += 4;

    doc.setFontSize(12);
    doc.text("Risikoreduserende tiltak", margin, y); y += 6;
    doc.setFontSize(10);
    measures.forEach((m, i) => {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.text(`${i + 1}. ${m.measure || "-"} (Ansvarlig: ${m.responsible || "-"})`, margin, y);
      y += 5;
      doc.text(`   Risiko: ${m.risk}`, margin, y);
      y += 6;
    });
    if (measures.length === 0) { doc.text("Ingen tiltak registrert", margin, y); y += 6; }

    if (sja.status === "completed" && sja.signature_data) {
      y += 8;
      doc.setFontSize(12);
      doc.text("Signatur", margin, y); y += 4;
      try { doc.addImage(sja.signature_data, "PNG", margin, y, 60, 25); } catch { /* skip */ }
      y += 30;
      doc.setFontSize(9);
      doc.text(`Signert av ${sja.completed_by_name || "-"} den ${sja.completed_at ? format(new Date(sja.completed_at), "d. MMM yyyy", { locale: nb }) : "-"}`, margin, y);
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
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Identifiser risikoer
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
                              <div key={mIdx} className="flex items-center gap-2">
                                <Input
                                  placeholder="Beskriv tiltak..."
                                  value={m.measure}
                                  onChange={(e) => updateMeasure(mIdx, { measure: e.target.value })}
                                  className="flex-1"
                                  disabled={isCompleted}
                                />
                                <Input
                                  placeholder="Ansvarlig"
                                  value={m.responsible}
                                  onChange={(e) => updateMeasure(mIdx, { responsible: e.target.value })}
                                  className="w-36"
                                  disabled={isCompleted}
                                />
                                {!isCompleted && (
                                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeMeasure(mIdx)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
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
              className="hover:border-emerald-500/50 transition-colors cursor-pointer"
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
            <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => setShowNewDialog(true)}>
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
              <AlertTriangle className="h-5 w-5 text-amber-500" />
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
              className="bg-emerald-500 hover:bg-emerald-600"
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
