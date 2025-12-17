import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Building2, 
  Users, 
  FileText, 
  ExternalLink,
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle2,
  Scale,
  Save,
  Plus,
  Trash2,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyLawsRegulations, type NewLawRegulation } from "@/hooks/useCompanyLawsRegulations";

interface BrregData {
  navn: string;
  organisasjonsnummer: string;
  naeringskode1?: {
    kode: string;
    beskrivelse: string;
  };
  antallAnsatte?: number;
  forretningsadresse?: {
    adresse: string[];
    postnummer: string;
    poststed: string;
  };
}

interface LovKrav {
  tittel: string;
  beskrivelse: string;
  lenke: string;
  kategori: string;
}

const generelleLover: LovKrav[] = [
  {
    tittel: "Arbeidsmiljøloven",
    beskrivelse: "Hovedloven for arbeidsmiljø, arbeidstid, stillingsvern og medvirkning",
    lenke: "https://lovdata.no/dokument/NL/lov/2005-06-17-62",
    kategori: "Arbeidsrett"
  },
  {
    tittel: "Internkontrollforskriften",
    beskrivelse: "Krav til systematisk HMS-arbeid i alle virksomheter",
    lenke: "https://lovdata.no/dokument/SF/forskrift/1996-12-06-1127",
    kategori: "HMS"
  },
  {
    tittel: "Forskrift om organisering, ledelse og medvirkning",
    beskrivelse: "Krav til organisering av arbeidet og arbeidstakers medvirkning",
    lenke: "https://lovdata.no/dokument/SF/forskrift/2011-12-06-1355",
    kategori: "Organisering"
  },
  {
    tittel: "Arbeidsplassforskriften",
    beskrivelse: "Krav til utforming og innretning av arbeidsplasser",
    lenke: "https://lovdata.no/dokument/SF/forskrift/2011-12-06-1356",
    kategori: "Arbeidsplass"
  },
  {
    tittel: "Forskrift om utførelse av arbeid",
    beskrivelse: "Krav til sikker utførelse av ulike typer arbeid",
    lenke: "https://lovdata.no/dokument/SF/forskrift/2011-12-06-1357",
    kategori: "Arbeid"
  },
  {
    tittel: "Forskrift om tiltaks- og grenseverdier",
    beskrivelse: "Grenseverdier for forurensninger i arbeidsatmosfæren",
    lenke: "https://lovdata.no/dokument/SF/forskrift/2011-12-06-1358",
    kategori: "Grenseverdier"
  },
  {
    tittel: "Lov om tilsyn med elektriske anlegg",
    beskrivelse: "Krav til elektriske installasjoner og tilsyn",
    lenke: "https://lovdata.no/dokument/NL/lov/1929-05-24-4",
    kategori: "Elektrisitet"
  },
  {
    tittel: "Brann- og eksplosjonsvernloven",
    beskrivelse: "Krav til forebygging av brann og eksplosjon",
    lenke: "https://lovdata.no/dokument/NL/lov/2002-06-14-20",
    kategori: "Brannvern"
  }
];

const ansattBaserteKrav = [
  { minAnsatte: 5, krav: "Verneombud", beskrivelse: "Virksomheter med 5 eller flere ansatte må ha verneombud. Bedrifter med færre enn 5 ansatte kan avtale skriftlig fritak." },
  { minAnsatte: 10, krav: "Skriftlig avtale om HMS", beskrivelse: "Krav om skriftlig avtale om hvordan HMS-arbeidet skal organiseres" },
  { minAnsatte: 10, krav: "AMU ved krav fra partene", beskrivelse: "Virksomheter med 10-29 ansatte skal ha AMU hvis én av partene krever det" },
  { minAnsatte: 20, krav: "Verneombud per avdeling", beskrivelse: "Virksomheter med flere avdelinger bør vurdere verneombud per avdeling" },
  { minAnsatte: 30, krav: "Arbeidsmiljøutvalg (AMU)", beskrivelse: "Virksomheter med minst 30 ansatte har plikt til å opprette arbeidsmiljøutvalg" },
];

const LoverOgForskrifterCalculator = () => {
  const { company } = useAuth();
  const { savedLaws, isLoading: isLoadingSaved, saveLaws, addLaw, deleteLaw, isSaving, isAdding } = useCompanyLawsRegulations();
  
  const [orgnr, setOrgnr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bedriftData, setBedriftData] = useState<BrregData | null>(null);
  const [antallAnsatte, setAntallAnsatte] = useState<number>(0);
  const [rapportGenerert, setRapportGenerert] = useState(false);
  const [autoFetched, setAutoFetched] = useState(false);
  
  // Add law dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newLaw, setNewLaw] = useState<NewLawRegulation>({
    law_name: "",
    description: "",
    link: "",
    category: "Annet"
  });

  // Auto-fill org.nr from company profile and fetch data
  useEffect(() => {
    if (company?.org_number && !autoFetched) {
      const cleanOrgNr = company.org_number.replace(/\s/g, '');
      if (cleanOrgNr.match(/^\d{9}$/)) {
        setOrgnr(cleanOrgNr);
        setAutoFetched(true);
        fetchBedriftsinfo(cleanOrgNr);
      }
    }
  }, [company?.org_number, autoFetched]);

  const fetchBedriftsinfo = async (orgNumber: string) => {
    setLoading(true);
    setError("");
    setBedriftData(null);
    setRapportGenerert(false);

    try {
      const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${orgNumber}`);
      if (!response.ok) {
        throw new Error("Kunne ikke finne bedriften");
      }
      const data: BrregData = await response.json();
      setBedriftData(data);
      setAntallAnsatte(data.antallAnsatte || 0);
    } catch {
      setError("Kunne ikke hente data. Sjekk organisasjonsnummeret og prøv igjen.");
    } finally {
      setLoading(false);
    }
  };

  const hentBedriftsinfo = async () => {
    if (!orgnr.match(/^\d{9}$/)) {
      setError("Vennligst skriv inn et gyldig organisasjonsnummer (9 siffer)");
      return;
    }
    await fetchBedriftsinfo(orgnr);
  };

  const genererRapport = () => {
    setRapportGenerert(true);
  };

  const handleSaveAllLaws = () => {
    // Save general laws
    const generalLawsToSave: NewLawRegulation[] = generelleLover.map(lov => ({
      law_name: lov.tittel,
      description: lov.beskrivelse,
      link: lov.lenke,
      category: lov.kategori,
      is_employee_based: false,
      is_manually_added: false
    }));

    // Save employee-based requirements
    const employeeKravToSave: NewLawRegulation[] = gjeldeneAnsattkrav.map(krav => ({
      law_name: krav.krav,
      description: krav.beskrivelse,
      category: "Ansattbasert krav",
      is_employee_based: true,
      employee_threshold: krav.minAnsatte,
      is_manually_added: false
    }));

    saveLaws([...generalLawsToSave, ...employeeKravToSave]);
  };

  const handleAddManualLaw = () => {
    if (!newLaw.law_name.trim()) return;
    addLaw(newLaw);
    setNewLaw({ law_name: "", description: "", link: "", category: "Annet" });
    setAddDialogOpen(false);
  };

  const sendRapportEpost = () => {
    if (!bedriftData) return;

    const subject = encodeURIComponent(`HMS-rapport for ${bedriftData.navn}`);
    const body = encodeURIComponent(
      `Hei,\n\nHer er oversikt over gjeldende lover og forskrifter for ${bedriftData.navn}:\n\n` +
      `Organisasjonsnummer: ${bedriftData.organisasjonsnummer}\n` +
      `Næringskode: ${bedriftData.naeringskode1?.kode || 'Ikke oppgitt'} - ${bedriftData.naeringskode1?.beskrivelse || ''}\n` +
      `Antall ansatte: ${antallAnsatte}\n\n` +
      `Generelle krav:\n` +
      generelleLover.map(lov => `- ${lov.tittel}: ${lov.lenke}`).join('\n') +
      `\n\nAnsattbaserte krav:\n` +
      ansattBaserteKrav
        .filter(k => antallAnsatte >= k.minAnsatte)
        .map(k => `- ${k.krav}: ${k.beskrivelse}`)
        .join('\n') +
      `\n\nVennlig hilsen,\nHMS-systemet`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const gjeldeneAnsattkrav = ansattBaserteKrav.filter(k => antallAnsatte >= k.minAnsatte);

  // Check if laws are already saved
  const hasAlreadySavedLaws = savedLaws.filter(l => !l.is_manually_added).length > 0;

  return (
    <div className="space-y-6">
      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-5 shadow-card"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Scale className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1">Lover og forskrifter</h2>
            <p className="text-muted-foreground text-sm">
              Bruk denne kalkulatoren til å få oversikt over HMS-krav som gjelder for din virksomhet
              basert på bransje og antall ansatte. Dette er et krav i henhold til Internkontrollforskriften.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Lagrede lover */}
      {savedLaws.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Lagrede lover og forskrifter
              </CardTitle>
              <CardDescription>
                Disse lovene er lagret og inkluderes i håndboken
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {savedLaws.map((law) => (
                  <div 
                    key={law.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{law.law_name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {law.category || "Generelt"}
                        </Badge>
                        {law.is_manually_added && (
                          <Badge variant="outline" className="text-xs">Manuelt lagt til</Badge>
                        )}
                        {law.is_employee_based && (
                          <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                            Fra {law.employee_threshold}+ ansatte
                          </Badge>
                        )}
                      </div>
                      {law.description && (
                        <p className="text-sm text-muted-foreground">{law.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {law.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={law.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLaw(law.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Legg til manuelt
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Legg til lov eller forskrift</DialogTitle>
                      <DialogDescription>
                        Legg til en egendefinert lov eller forskrift som gjelder for din virksomhet
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Navn på lov/forskrift *</Label>
                        <Input
                          value={newLaw.law_name}
                          onChange={(e) => setNewLaw({ ...newLaw, law_name: e.target.value })}
                          placeholder="F.eks. Forskrift om maskiner"
                        />
                      </div>
                      <div>
                        <Label>Beskrivelse</Label>
                        <Textarea
                          value={newLaw.description || ""}
                          onChange={(e) => setNewLaw({ ...newLaw, description: e.target.value })}
                          placeholder="Kort beskrivelse av hva loven/forskriften omhandler"
                        />
                      </div>
                      <div>
                        <Label>Lenke til Lovdata</Label>
                        <Input
                          value={newLaw.link || ""}
                          onChange={(e) => setNewLaw({ ...newLaw, link: e.target.value })}
                          placeholder="https://lovdata.no/..."
                        />
                      </div>
                      <div>
                        <Label>Kategori</Label>
                        <Input
                          value={newLaw.category || ""}
                          onChange={(e) => setNewLaw({ ...newLaw, category: e.target.value })}
                          placeholder="F.eks. Maskinsikkerhet"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        Avbryt
                      </Button>
                      <Button onClick={handleAddManualLaw} disabled={!newLaw.law_name.trim() || isAdding}>
                        {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Legg til
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Søkefelt */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hent bedriftsinformasjon</CardTitle>
            <CardDescription>
              Skriv inn organisasjonsnummer for å hente bedriftsinformasjon fra Brønnøysundregistrene
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="orgnr" className="sr-only">Organisasjonsnummer</Label>
                <Input
                  id="orgnr"
                  placeholder="Skriv inn organisasjonsnummer (9 siffer)"
                  value={orgnr}
                  onChange={(e) => setOrgnr(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  maxLength={9}
                />
              </div>
              <Button onClick={hentBedriftsinfo} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Hent info
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bedriftsinformasjon */}
      {bedriftData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Bedriftsinformasjon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Bedriftsnavn</Label>
                  <p className="font-medium">{bedriftData.navn}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Organisasjonsnummer</Label>
                  <p className="font-medium font-mono">{bedriftData.organisasjonsnummer}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Næringskode</Label>
                  <p className="font-medium">
                    {bedriftData.naeringskode1?.kode || 'Ikke oppgitt'}
                    {bedriftData.naeringskode1?.beskrivelse && (
                      <span className="text-muted-foreground text-sm ml-2">
                        ({bedriftData.naeringskode1.beskrivelse})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Antall ansatte</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={antallAnsatte}
                      onChange={(e) => setAntallAnsatte(parseInt(e.target.value) || 0)}
                      className="w-24"
                      min={0}
                    />
                    <span className="text-muted-foreground text-sm">ansatte</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={genererRapport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generer lovkravrapport
                </Button>
                {rapportGenerert && (
                  <>
                    <Button variant="outline" onClick={sendRapportEpost}>
                      <Mail className="w-4 h-4 mr-2" />
                      Send på e-post
                    </Button>
                    {!hasAlreadySavedLaws && (
                      <Button variant="secondary" onClick={handleSaveAllLaws} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Lagre til håndbok
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Rapport */}
      {rapportGenerert && bedriftData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Ansattbaserte krav */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Krav basert på antall ansatte ({antallAnsatte})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gjeldeneAnsattkrav.length > 0 ? (
                <div className="space-y-3">
                  {gjeldeneAnsattkrav.map((krav, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20"
                    >
                      <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">{krav.krav}</p>
                        <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          Fra {krav.minAnsatte}+ ansatte
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Ingen spesielle krav basert på antall ansatte for virksomheter med færre enn 5 ansatte.
                </p>
              )}

              {/* Kommende krav */}
              {ansattBaserteKrav.filter(k => antallAnsatte < k.minAnsatte).length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Krav som trer i kraft ved flere ansatte:
                  </p>
                  <div className="space-y-2">
                    {ansattBaserteKrav
                      .filter(k => antallAnsatte < k.minAnsatte)
                      .map((krav, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                          <span>{krav.krav} (fra {krav.minAnsatte}+ ansatte)</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generelle lover og forskrifter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Gjeldende lover og forskrifter
              </CardTitle>
              <CardDescription>
                Disse lovene og forskriftene gjelder for alle virksomheter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generelleLover.map((lov, index) => (
                  <div 
                    key={index}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{lov.tittel}</p>
                        <Badge variant="secondary" className="text-xs">
                          {lov.kategori}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{lov.beskrivelse}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="shrink-0"
                    >
                      <a href={lov.lenke} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick add button when no saved laws */}
      {savedLaws.length === 0 && !rapportGenerert && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-dashed">
            <CardContent className="py-6">
              <div className="text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Ingen lover er lagret ennå. Søk opp din bedrift ovenfor for å generere rapport og lagre, 
                  eller legg til manuelt.
                </p>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Legg til manuelt
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Legg til lov eller forskrift</DialogTitle>
                      <DialogDescription>
                        Legg til en egendefinert lov eller forskrift som gjelder for din virksomhet
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Navn på lov/forskrift *</Label>
                        <Input
                          value={newLaw.law_name}
                          onChange={(e) => setNewLaw({ ...newLaw, law_name: e.target.value })}
                          placeholder="F.eks. Forskrift om maskiner"
                        />
                      </div>
                      <div>
                        <Label>Beskrivelse</Label>
                        <Textarea
                          value={newLaw.description || ""}
                          onChange={(e) => setNewLaw({ ...newLaw, description: e.target.value })}
                          placeholder="Kort beskrivelse av hva loven/forskriften omhandler"
                        />
                      </div>
                      <div>
                        <Label>Lenke til Lovdata</Label>
                        <Input
                          value={newLaw.link || ""}
                          onChange={(e) => setNewLaw({ ...newLaw, link: e.target.value })}
                          placeholder="https://lovdata.no/..."
                        />
                      </div>
                      <div>
                        <Label>Kategori</Label>
                        <Input
                          value={newLaw.category || ""}
                          onChange={(e) => setNewLaw({ ...newLaw, category: e.target.value })}
                          placeholder="F.eks. Maskinsikkerhet"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        Avbryt
                      </Button>
                      <Button onClick={handleAddManualLaw} disabled={!newLaw.law_name.trim() || isAdding}>
                        {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Legg til
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default LoverOgForskrifterCalculator;
