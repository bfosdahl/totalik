import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, Zap, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type DeviationType = "hms" | "quality" | "environment" | "other";
type Severity = "low" | "medium" | "high" | "critical";
type Status = "open" | "in_progress" | "closed";

interface ActionRow {
  id: string;
  action: string;
  responsible: string;
  deadline: string;
}

interface FormData {
  companyName: string;
  reportDate: string;
  discoveredAt: string;
  reportedBy: string;
  location: string;
  deviationType: DeviationType;
  severity: Severity;
  status: Status;
  title: string;
  description: string;
  immediateAction: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  actions: ActionRow[];
  attachmentsNote: string;
  handlerName: string;
  closedDate: string;
}

const ElKontrollForm: React.FC = () => {
  const { company } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    companyName: company?.name || "",
    reportDate: new Date().toISOString().split("T")[0],
    discoveredAt: "",
    reportedBy: "",
    location: "",
    deviationType: "hms",
    severity: "medium",
    status: "open",
    title: "",
    description: "",
    immediateAction: "",
    rootCause: "",
    correctiveAction: "",
    preventiveAction: "",
    actions: [{ id: "1", action: "", responsible: "", deadline: "" }],
    attachmentsNote: "",
    handlerName: "",
    closedDate: "",
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addActionRow = () => {
    setFormData((prev) => ({
      ...prev,
      actions: [
        ...prev.actions,
        { id: Date.now().toString(), action: "", responsible: "", deadline: "" },
      ],
    }));
  };

  const removeActionRow = (id: string) => {
    if (formData.actions.length > 1) {
      setFormData((prev) => ({
        ...prev,
        actions: prev.actions.filter((a) => a.id !== id),
      }));
    }
  };

  const updateAction = (
    id: string,
    field: keyof Omit<ActionRow, "id">,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("El Kontroll form data:", formData);
    toast.success("Avviksrapport lagret");
  };

  const severityConfig = {
    low: { label: "Lav", color: "text-success" },
    medium: { label: "Middels", color: "text-warning" },
    high: { label: "Høy", color: "text-orange-500" },
    critical: { label: "Kritisk", color: "text-destructive" },
  };

  const statusConfig = {
    open: { label: "Åpen", color: "text-destructive" },
    in_progress: { label: "Under behandling", color: "text-warning" },
    closed: { label: "Lukket", color: "text-success" },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Grunninformasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Virksomhet</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportDate">Dato for rapportering</Label>
            <Input
              id="reportDate"
              type="date"
              value={formData.reportDate}
              onChange={(e) => updateField("reportDate", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discoveredAt">Tidspunkt avviket ble oppdaget</Label>
            <Input
              id="discoveredAt"
              type="datetime-local"
              value={formData.discoveredAt}
              onChange={(e) => updateField("discoveredAt", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportedBy">Rapportert av (navn / rolle)</Label>
            <Input
              id="reportedBy"
              value={formData.reportedBy}
              onChange={(e) => updateField("reportedBy", e.target.value)}
              placeholder="f.eks. Ola Nordmann, montør"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="location">Sted / avdeling</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="f.eks. Lageret, Byggeplass X"
            />
          </div>
        </CardContent>
      </Card>

      {/* Classification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Klassifisering av avvik
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Avvikstype</Label>
            <Select
              value={formData.deviationType}
              onValueChange={(value: DeviationType) =>
                updateField("deviationType", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hms">HMS / personskade / sikkerhet</SelectItem>
                <SelectItem value="quality">Kvalitet / leveranse</SelectItem>
                <SelectItem value="environment">Ytre miljø</SelectItem>
                <SelectItem value="other">Annet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Alvorlighetsgrad</Label>
            <Select
              value={formData.severity}
              onValueChange={(value: Severity) => updateField("severity", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Lav</SelectItem>
                <SelectItem value="medium">Middels</SelectItem>
                <SelectItem value="high">Høy</SelectItem>
                <SelectItem value="critical">Kritisk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Status) => updateField("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Åpen</SelectItem>
                <SelectItem value="in_progress">Under behandling</SelectItem>
                <SelectItem value="closed">Lukket</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Beskrivelse av avviket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel / kort beskrivelse</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="f.eks. Manglende rekkverk på stillas"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Detaljert beskrivelse</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Hva skjedde, hvordan ble det oppdaget, hvem var involvert?"
              rows={4}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Cause and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Årsak og tiltak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="immediateAction">
              Umiddelbare tiltak (hva ble gjort der og da)
            </Label>
            <Textarea
              id="immediateAction"
              value={formData.immediateAction}
              onChange={(e) => updateField("immediateAction", e.target.value)}
              placeholder="Hvilke strakstiltak ble iverksatt for å sikre personell/område?"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rootCause">Årsaksanalyse (rotårsak)</Label>
            <Textarea
              id="rootCause"
              value={formData.rootCause}
              onChange={(e) => updateField("rootCause", e.target.value)}
              placeholder="Hvorfor skjedde dette? Menneskelig feil, rutinesvikt, utstyr, opplæring osv."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="correctiveAction">
              Korrigerende tiltak (rette opp feilen)
            </Label>
            <Textarea
              id="correctiveAction"
              value={formData.correctiveAction}
              onChange={(e) => updateField("correctiveAction", e.target.value)}
              placeholder="Hva skal gjøres for å rette opp avviket konkret?"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preventiveAction">
              Forebyggende tiltak (unngå gjentakelse)
            </Label>
            <Textarea
              id="preventiveAction"
              value={formData.preventiveAction}
              onChange={(e) => updateField("preventiveAction", e.target.value)}
              placeholder="Hva kan endres i rutiner, opplæring, utstyr osv. for å hindre at dette skjer igjen?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Plan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Oppfølging / handlingsplan</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addActionRow}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Legg til
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 sm:px-3 text-sm font-medium text-muted-foreground">
                    Tiltak
                  </th>
                  <th className="text-left py-2 px-2 sm:px-3 text-sm font-medium text-muted-foreground w-36">
                    Ansvarlig
                  </th>
                  <th className="text-left py-2 px-2 sm:px-3 text-sm font-medium text-muted-foreground w-36">
                    Frist
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {formData.actions.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 px-2 sm:px-3">
                      <Input
                        value={row.action}
                        onChange={(e) =>
                          updateAction(row.id, "action", e.target.value)
                        }
                        placeholder="Beskriv tiltak..."
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 px-2 sm:px-3">
                      <Input
                        value={row.responsible}
                        onChange={(e) =>
                          updateAction(row.id, "responsible", e.target.value)
                        }
                        placeholder="Navn / rolle"
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 px-2 sm:px-3">
                      <Input
                        type="date"
                        value={row.deadline}
                        onChange={(e) =>
                          updateAction(row.id, "deadline", e.target.value)
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeActionRow(row.id)}
                        disabled={formData.actions.length === 1}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle>Vedlegg / dokumentasjon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="attachmentsNote">
              Vedleggsnotat (bilder, dokumenter, rapporter osv.)
            </Label>
            <Textarea
              id="attachmentsNote"
              value={formData.attachmentsNote}
              onChange={(e) => updateField("attachmentsNote", e.target.value)}
              placeholder="Beskriv hvilke vedlegg som hører til avviket"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Signature / Closing */}
      <Card>
        <CardHeader>
          <CardTitle>Signatur / lukking</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="handlerName">Ansvarlig for behandling (navn)</Label>
            <Input
              id="handlerName"
              value={formData.handlerName}
              onChange={(e) => updateField("handlerName", e.target.value)}
              placeholder="f.eks. HMS-ansvarlig"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="closedDate">Dato for lukking</Label>
            <Input
              id="closedDate"
              type="date"
              value={formData.closedDate}
              onChange={(e) => updateField("closedDate", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" className="gap-2">
          <Save className="w-4 h-4" />
          Lagre avviksrapport
        </Button>
      </div>
    </form>
  );
};

export default ElKontrollForm;
