import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  FileDown, 
  Loader2,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  Zap,
  FlaskConical,
  Flame,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Pen,
  FilePlus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import SavedFormsList from "./SavedFormsList";
import { SignaturePad } from "@/components/ks2/SignaturePad";
import { useAuditFormResponses, type AuditFormResponse } from "@/hooks/useAuditFormResponses";

interface ChecklistSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: { id: string; label: string }[];
}

const checklistSections: ChecklistSection[] = [
  {
    id: "orden_renhold",
    title: "1. Orden og renhold",
    icon: <Sparkles className="w-5 h-5" />,
    items: [
      { id: "gangveier", label: "Gangveier og fluktveier er frie for hindringer" },
      { id: "generelt", label: "Lokaler er ryddige og godt vedlikeholdt" },
      { id: "avfall", label: "Avfall håndteres og sorteres på egnet sted" },
      { id: "sol", label: "Søl (væske, olje, kjemikalier) fjernes raskt" },
      { id: "lagring", label: "Lagring skjer på egnede plasser og i riktig høyde/stabling" },
    ],
  },
  {
    id: "fysiske_forhold",
    title: "2. Fysiske forhold / bygning",
    icon: <MapPin className="w-5 h-5" />,
    items: [
      { id: "belysning", label: "Belysning er tilstrekkelig og fungerer" },
      { id: "stoy", label: "Støynivå vurderes som akseptabelt" },
      { id: "inneklima", label: "Temperatur og luftkvalitet oppleves som tilfredsstillende" },
      { id: "gulv_trapp", label: "Gulv og trapper er hele og uten snublefare" },
      { id: "merking", label: "Skilt og merking (f.eks. nødutganger, påbudsskilt) er synlige og intakte" },
    ],
  },
  {
    id: "maskiner",
    title: "3. Maskiner, verktøy og utstyr",
    icon: <Zap className="w-5 h-5" />,
    items: [
      { id: "skjerming", label: "Maskiner har nødvendig vern og skjerming" },
      { id: "nodstopp", label: "Nødstopp fungerer og er lett tilgjengelig" },
      { id: "vedlikehold", label: "Maskiner og utstyr er vedlikeholdt og uten synlige skader" },
      { id: "instruks", label: "Skriftlige instruksjoner finnes og er tilgjengelige ved maskinene" },
      { id: "opplaring", label: "Brukere av maskiner har fått nødvendig opplæring" },
    ],
  },
  {
    id: "elektrisk",
    title: "4. Elektrisk sikkerhet",
    icon: <Zap className="w-5 h-5" />,
    items: [
      { id: "kabler", label: "Kabler og ledninger er uten skader og ikke til hinder" },
      { id: "stikk", label: "Stikkontakter, brytere og utstyr er hele og forsvarlig festet" },
      { id: "skjoteledninger", label: "Skjøteledninger brukes ikke som permanent løsning" },
      { id: "sikringsskap", label: "Tilgang til sikringsskap og hovedbryter er fri" },
    ],
  },
  {
    id: "kjemikalier",
    title: "5. Kjemikalier og farlige stoffer",
    icon: <FlaskConical className="w-5 h-5" />,
    items: [
      { id: "kartotek", label: "Kjemikalier er registrert og dokumentasjon (SDS) er tilgjengelig" },
      { id: "merket", label: "Beholdere og flasker er korrekt merket" },
      { id: "lagring", label: "Kjemikalier lagres forsvarlig og adskilt ved behov" },
      { id: "verneutstyr", label: "Riktig verneutstyr er tilgjengelig ved bruk av kjemikalier" },
    ],
  },
  {
    id: "brannvern",
    title: "6. Brannvern og beredskap",
    icon: <Flame className="w-5 h-5" />,
    items: [
      { id: "slokkeutstyr", label: "Slokkeutstyr er på plass, merket og lett tilgjengelig" },
      { id: "alarmer", label: "Brannalarmanlegg og detektorer er synlige og ikke tildekket" },
      { id: "fluktveier", label: "Fluktveier og nødutganger er ryddige og merkede" },
      { id: "plan", label: "Branninstruks / evakueringsplan er kjent for de ansatte" },
    ],
  },
  {
    id: "ergonomi",
    title: "7. Ergonomi og arbeidsstillinger",
    icon: <UserCheck className="w-5 h-5" />,
    items: [
      { id: "arbeidshoeyde", label: "Arbeidshøyde og utforming av arbeidsplassen er tilpasset" },
      { id: "tunge_loft", label: "Tunge løft er vurdert og hjelpemidler er tilgjengelige" },
      { id: "skjermarbeid", label: "Skjermarbeidsplasser er ergonomisk tilpasset (stol, bord, skjerm)" },
      { id: "variasjon", label: "Mulighet for variasjon i arbeidsstilling og pauser" },
    ],
  },
  {
    id: "psykososialt",
    title: "8. Psykososialt arbeidsmiljø",
    icon: <Users className="w-5 h-5" />,
    items: [
      { id: "samarbeid", label: "Samarbeid og kommunikasjon oppleves som god" },
      { id: "trivsel", label: "Trivsel og arbeidsmiljø er generelt godt" },
      { id: "tidsfrist", label: "Arbeidsmengde og tidsfrister er håndterbare" },
      { id: "rutiner_varsling", label: "Det finnes kjente rutiner for å varsle om kritikkverdige forhold" },
    ],
  },
  {
    id: "verneutstyr",
    title: "9. Verneutstyr (PPE)",
    icon: <ShieldCheck className="w-5 h-5" />,
    items: [
      { id: "tilgjengelig", label: "Påkrevd verneutstyr er tilgjengelig der det trengs" },
      { id: "bruk", label: "Verneutstyr brukes i tråd med krav og rutiner" },
      { id: "tilstand", label: "Verneutstyr er helt, rent og funksjonelt" },
    ],
  },
];

const getDefaultFormData = () => ({
  dato: format(new Date(), "yyyy-MM-dd"),
  avdeling: "",
  deltakere: "",
  checklist: {} as Record<string, boolean>,
  avvik: "",
  tiltak: "",
  ansvarligOppfolging: "",
  fristTiltak: "",
  signVerneombud: "",
  signLeder: "",
});

const VernerundeForm = () => {
  const { profile } = useAuth();
  const { 
    responses, 
    saveFormResponse, 
    deleteFormResponse, 
    isSaving,
    refetch 
  } = useAuditFormResponses();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  
  // Filter responses for vernerunde only
  const vernerundeResponses = responses.filter(r => r.form_type === "vernerunde");
  
  // Form state
  const [formData, setFormData] = useState(getDefaultFormData);

  const handleCheckboxChange = (sectionId: string, itemId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [`${sectionId}_${itemId}`]: checked,
      },
    }));
  };

  const handleSignatureSave = (field: "signVerneombud" | "signLeder", signature: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: signature,
    }));
  };

  const handleSave = async () => {
    const result = await saveFormResponse(
      "vernerunde",
      formData,
      {
        participants: formData.deltakere,
      },
      "draft",
      selectedFormId || undefined
    );
    if (result) {
      setSelectedFormId(result.id);
    }
  };

  const handleComplete = async () => {
    const result = await saveFormResponse(
      "vernerunde",
      formData,
      {
        participants: formData.deltakere,
      },
      "completed",
      selectedFormId || undefined
    );
    if (result) {
      // Reset form after completion
      setSelectedFormId(null);
      setFormData(getDefaultFormData());
    }
  };

  const handleLoadForm = (response: AuditFormResponse) => {
    setSelectedFormId(response.id);
    const data = response.form_data as any;
    setFormData({
      dato: data.dato || format(new Date(), "yyyy-MM-dd"),
      avdeling: data.avdeling || "",
      deltakere: data.deltakere || "",
      checklist: data.checklist || {},
      avvik: data.avvik || "",
      tiltak: data.tiltak || "",
      ansvarligOppfolging: data.ansvarligOppfolging || "",
      fristTiltak: data.fristTiltak || "",
      signVerneombud: data.signVerneombud || "",
      signLeder: data.signLeder || "",
    });
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    await deleteFormResponse(id);
    if (selectedFormId === id) {
      setSelectedFormId(null);
      setFormData(getDefaultFormData());
    }
    setIsDeleting(false);
  };

  const handleCreateNew = () => {
    setSelectedFormId(null);
    setFormData(getDefaultFormData());
  };

  const completedCount = Object.values(formData.checklist).filter(Boolean).length;
  const totalCount = checklistSections.reduce((acc, section) => acc + section.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Saved Forms List */}
      <SavedFormsList
        responses={vernerundeResponses}
        onDelete={handleDelete}
        onSelect={handleLoadForm}
        onCreateNew={handleCreateNew}
        isDeleting={isDeleting}
        title="Lagrede vernerunder"
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>
                    {selectedFormId ? "Rediger vernerunde" : "Ny vernerunde – Sjekkliste"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Systematisk gjennomgang av arbeidsmiljøet
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                {completedCount} / {totalCount} punkter
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Generell informasjon */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Generell informasjon
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Dato for vernerunde</Label>
                  <Input
                    type="date"
                    value={formData.dato}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dato: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Avdeling / område</Label>
                  <Input
                    placeholder="F.eks. Lager, Kontor, Verksted"
                    value={formData.avdeling}
                    onChange={(e) => setFormData((prev) => ({ ...prev, avdeling: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Deltakere (navn / roller)</Label>
                <Textarea
                  placeholder="F.eks. Ola Nordmann (Verneombud), Kari Hansen (Leder)"
                  value={formData.deltakere}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deltakere: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            {/* Checklist Sections */}
            {checklistSections.map((section) => (
              <div key={section.id} className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-foreground">
                  {section.icon}
                  {section.title}
                </h3>
                <div className="space-y-2 pl-7">
                  {section.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <Checkbox
                        id={`${section.id}_${item.id}`}
                        checked={formData.checklist[`${section.id}_${item.id}`] || false}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(section.id, item.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`${section.id}_${item.id}`}
                        className="text-sm font-normal leading-relaxed cursor-pointer"
                      >
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Separator />

            {/* Avvik og tiltak */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                10. Avvik, forbedringsforslag og tiltak
              </h3>
              <div>
                <Label>Observerte avvik / farer / uønskede forhold</Label>
                <Textarea
                  placeholder="Beskriv eventuelle avvik som ble observert..."
                  rows={4}
                  value={formData.avvik}
                  onChange={(e) => setFormData((prev) => ({ ...prev, avvik: e.target.value }))}
                />
              </div>
              <div>
                <Label>Forslag til tiltak / forbedringer</Label>
                <Textarea
                  placeholder="Beskriv forslag til tiltak..."
                  rows={4}
                  value={formData.tiltak}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tiltak: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Ansvarlig for oppfølging</Label>
                  <Input
                    placeholder="Navn / rolle"
                    value={formData.ansvarligOppfolging}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, ansvarligOppfolging: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Frist for gjennomføring av tiltak</Label>
                  <Input
                    type="date"
                    value={formData.fristTiltak}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fristTiltak: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Signaturer */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Pen className="w-5 h-5" />
                11. Signatur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="mb-2 block">Verneombud / representant</Label>
                  <SignaturePad
                    onSave={(sig) => handleSignatureSave("signVerneombud", sig)}
                    existingSignature={formData.signVerneombud}
                    label="Verneombud"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Leder / ansvarlig</Label>
                  <SignaturePad
                    onSave={(sig) => handleSignatureSave("signLeder", sig)}
                    existingSignature={formData.signLeder}
                    label="Leder"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 justify-end">
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Lagre utkast
              </Button>
              <Button onClick={handleComplete} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                Fullfør vernerunde
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VernerundeForm;
