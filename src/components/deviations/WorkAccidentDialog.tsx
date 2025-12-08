import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ExternalLink, Loader2, HeartPulse } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface WorkAccidentData {
  title: string;
  description: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  severity: string;
  involvedPersons: string;
  consequences: string;
  immediateActions: string;
  notifyArbeidstilsynet: boolean;
  notifyInsurance: boolean;
}

interface WorkAccidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WorkAccidentData) => Promise<void>;
}

const SEVERITY_OPTIONS = [
  { value: "minor", label: "Mindre skade (førstehjelpsnivå)" },
  { value: "moderate", label: "Moderat skade (legehjelp nødvendig)" },
  { value: "serious", label: "Alvorlig skade (sykehusinnleggelse)" },
  { value: "fatal", label: "Dødsfall" },
];

export function WorkAccidentDialog({ open, onOpenChange, onSubmit }: WorkAccidentDialogProps) {
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [incidentTime, setIncidentTime] = useState("");
  const [incidentLocation, setIncidentLocation] = useState("");
  const [severity, setSeverity] = useState("");
  const [involvedPersons, setInvolvedPersons] = useState("");
  const [consequences, setConsequences] = useState("");
  const [immediateActions, setImmediateActions] = useState("");
  const [notifyArbeidstilsynet, setNotifyArbeidstilsynet] = useState(false);
  const [notifyInsurance, setNotifyInsurance] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIncidentDate(new Date().toISOString().split("T")[0]);
    setIncidentTime("");
    setIncidentLocation("");
    setSeverity("");
    setInvolvedPersons("");
    setConsequences("");
    setImmediateActions("");
    setNotifyArbeidstilsynet(false);
    setNotifyInsurance(false);
  };

  const handleSubmit = async () => {
    if (!title || !description || !severity) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        incidentDate,
        incidentTime,
        incidentLocation,
        severity,
        involvedPersons,
        consequences,
        immediateActions,
        notifyArbeidstilsynet,
        notifyInsurance,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = title && description && severity;

  const formContent = (
    <div className="space-y-6">
      {/* Warning about official reporting */}
      <Alert className="border-warning bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-sm">
          <strong>Viktig:</strong> Alvorlige arbeidsulykker skal meldes til Arbeidstilsynet innen 24 timer.
          <a
            href="https://dat.apps.altinn.no/dat/ulykkesvarsel/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-primary hover:underline inline-flex items-center gap-1"
          >
            Meld til Arbeidstilsynet via Altinn
            <ExternalLink className="h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      {/* Basic info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Tittel på ulykken *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Kort beskrivelse av ulykken"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Beskrivelse av hendelsen *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beskriv hva som skjedde, hvordan det skjedde, og omstendighetene rundt hendelsen"
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="incidentDate">Dato for ulykken</Label>
            <Input
              id="incidentDate"
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="incidentTime">Tidspunkt</Label>
            <Input
              id="incidentTime"
              type="time"
              value={incidentTime}
              onChange={(e) => setIncidentTime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Sted for ulykken</Label>
          <Input
            id="location"
            value={incidentLocation}
            onChange={(e) => setIncidentLocation(e.target.value)}
            placeholder="F.eks. byggeplass, kontor, lager"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="severity">Alvorlighetsgrad *</Label>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Velg alvorlighetsgrad" />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* People involved */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="involvedPersons">Involverte personer</Label>
          <Textarea
            id="involvedPersons"
            value={involvedPersons}
            onChange={(e) => setInvolvedPersons(e.target.value)}
            placeholder="Navn og rolle på personer som var involvert"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="consequences">Konsekvenser/skader</Label>
          <Textarea
            id="consequences"
            value={consequences}
            onChange={(e) => setConsequences(e.target.value)}
            placeholder="Beskriv skader på personer eller utstyr"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="immediateActions">Umiddelbare tiltak utført</Label>
          <Textarea
            id="immediateActions"
            value={immediateActions}
            onChange={(e) => setImmediateActions(e.target.value)}
            placeholder="Beskriv hvilke tiltak som ble iverksatt umiddelbart"
            className="mt-1"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium text-sm">Varsling</h4>
        
        <div className="flex items-start space-x-3">
          <Checkbox
            id="notifyArbeidstilsynet"
            checked={notifyArbeidstilsynet}
            onCheckedChange={(checked) => setNotifyArbeidstilsynet(checked === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="notifyArbeidstilsynet" className="cursor-pointer">
              Skal meldes til Arbeidstilsynet
            </Label>
            <p className="text-xs text-muted-foreground">
              Alvorlige skader og dødsfall skal meldes innen 24 timer
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="notifyInsurance"
            checked={notifyInsurance}
            onCheckedChange={(checked) => setNotifyInsurance(checked === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="notifyInsurance" className="cursor-pointer">
              Skal meldes til forsikringsselskap
            </Label>
            <p className="text-xs text-muted-foreground">
              Husk å melde skaden til yrkesskadeforsikringen
            </p>
          </div>
        </div>
      </div>

      {/* Link to official reporting */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-3">
          <HeartPulse className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Offisiell rapportering til Arbeidstilsynet</p>
            <p className="text-xs text-muted-foreground">
              Etter å ha registrert ulykken her, må alvorlige ulykker også meldes direkte til Arbeidstilsynet via Altinn.
            </p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2"
            >
              <a
                href="https://dat.apps.altinn.no/dat/ulykkesvarsel/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Gå til Altinn-skjema
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const footerButtons = (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
        Avbryt
      </Button>
      <Button onClick={handleSubmit} disabled={!isValid || isSubmitting} className="gap-2">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Registrerer...
          </>
        ) : (
          "Registrer arbeidsulykke"
        )}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-destructive" />
              Meld arbeidsulykke
            </DrawerTitle>
            <DrawerDescription>
              Registrer arbeidsulykke eller skade på arbeidsplass
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 overflow-y-auto max-h-[60vh]">
            {formContent}
          </ScrollArea>
          <DrawerFooter className="flex-row justify-end gap-2">
            {footerButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-destructive" />
            Meld arbeidsulykke
          </DialogTitle>
          <DialogDescription>
            Registrer arbeidsulykke eller skade på arbeidsplass
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {formContent}
        </ScrollArea>
        <DialogFooter>
          {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
