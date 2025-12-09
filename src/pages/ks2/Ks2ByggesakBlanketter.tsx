import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Search, 
  ExternalLink,
  Download,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Building,
  Hammer,
  ClipboardCheck,
  Home,
} from "lucide-react";
import { useState } from "react";
import { 
  useProjectByggesak, 
  useByggesakForms, 
  useByggesakTemplates,
  useCreateByggesakForm 
} from "@/hooks/useKsModule2Byggesak";
import { useAuth } from "@/contexts/AuthContext";

// Complete list of all DIBK forms organized by building phase
const DIBK_FORMS = [
  // Phase 1: Før byggestart (Nabovarsel)
  { number: "5154", name: "Varsel til naboer", category: "nabovarsel", phase: "before", signer: "SØK", autofill: ["adresse", "gnr/bnr", "tiltaksbeskrivelse", "naboliste"] },
  { number: "5154n", name: "Varsel til naboer (nynorsk)", category: "nabovarsel", phase: "before", signer: "SØK", autofill: ["adresse", "gnr/bnr"] },
  { number: "5155", name: "Opplysninger gitt i nabovarsel", category: "nabovarsel", phase: "before", signer: "SØK", autofill: ["prosjektbeskrivelse"] },
  { number: "5155n", name: "Opplysninger gitt i nabovarsel (nynorsk)", category: "nabovarsel", phase: "before", signer: "SØK", autofill: ["prosjektbeskrivelse"] },
  { number: "5156", name: "Kvittering for nabovarsel", category: "nabovarsel", phase: "before", signer: "Nabo/SØK", autofill: ["dato", "mottaker"] },
  { number: "5156n", name: "Kvittering for nabovarsel (nynorsk)", category: "nabovarsel", phase: "before", signer: "Nabo/SØK", autofill: ["dato", "mottaker"] },
  { number: "5188", name: "Melding unntatt søknadsplikt", category: "nabovarsel", phase: "before", signer: "SØK", autofill: ["tiltaksbeskrivelse"] },
  { number: "5188n", name: "Melding unntatt søknadsplikt (nynorsk)", category: "nabovarsel", phase: "before", signer: "SØK", autofill: ["tiltaksbeskrivelse"] },
  
  // Phase 2: Søknad om tillatelse
  { number: "5151", name: "Søknad om dispensasjon", category: "soknad", phase: "application", signer: "SØK", autofill: ["prosjektinfo"] },
  { number: "5151n", name: "Søknad om dispensasjon (nynorsk)", category: "soknad", phase: "application", signer: "SØK", autofill: ["prosjektinfo"] },
  { number: "5153", name: "Tiltak uten ansvarsrett", category: "soknad", phase: "application", signer: "SØK", autofill: ["prosjektinfo"] },
  { number: "5153n", name: "Tiltak uten ansvarsrett (nynorsk)", category: "soknad", phase: "application", signer: "SØK", autofill: ["prosjektinfo"] },
  { number: "5174", name: "Søknad om tillatelse til tiltak", category: "soknad", phase: "application", signer: "SØK + Tiltakshaver", autofill: ["full prosjektinfo", "tegninger"] },
  { number: "5174n", name: "Søknad om tillatelse til tiltak (nynorsk)", category: "soknad", phase: "application", signer: "SØK + Tiltakshaver", autofill: ["full prosjektinfo", "tegninger"] },
  { number: "5175", name: "Opplysninger om ytre rammer", category: "soknad", phase: "application", signer: "SØK", autofill: ["tegninger", "adresse"] },
  { number: "5175n", name: "Opplysninger om ytre rammer (nynorsk)", category: "soknad", phase: "application", signer: "SØK", autofill: ["tegninger", "adresse"] },
  { number: "5176", name: "Boligspesifikasjon i matrikkel", category: "soknad", phase: "application", signer: "SØK", autofill: ["boligdetaljer"] },
  { number: "5176n", name: "Boligspesifikasjon i matrikkel (nynorsk)", category: "soknad", phase: "application", signer: "SØK", autofill: ["boligdetaljer"] },
  { number: "5177", name: "Arbeidstilsynets samtykke", category: "soknad", phase: "application", signer: "SØK", autofill: ["risikovurdering fra SJA"] },
  { number: "5177n", name: "Arbeidstilsynets samtykke (nynorsk)", category: "soknad", phase: "application", signer: "SØK", autofill: ["risikovurdering fra SJA"] },
  { number: "5178", name: "Avfallsplan (nybygg)", category: "soknad", phase: "application", signer: "UTF", autofill: ["prosjektavfall"] },
  { number: "5178n", name: "Avfallsplan nybygg (nynorsk)", category: "soknad", phase: "application", signer: "UTF", autofill: ["prosjektavfall"] },
  { number: "5179", name: "Avfallsplan (rehabilitering/riving)", category: "soknad", phase: "application", signer: "UTF", autofill: ["avfallsdetaljer"] },
  { number: "5179n", name: "Avfallsplan rehabilitering (nynorsk)", category: "soknad", phase: "application", signer: "UTF", autofill: ["avfallsdetaljer"] },
  { number: "5185", name: "Gjennomføringsplan", category: "plan", phase: "application", signer: "SØK + PRO + UTF", autofill: ["underleverandører", "fremdriftsplan"] },
  { number: "5185n", name: "Gjennomføringsplan (nynorsk)", category: "plan", phase: "application", signer: "SØK + PRO + UTF", autofill: ["underleverandører", "fremdriftsplan"] },
  
  // Phase 3: Ansvarsrett & Samsvar
  { number: "5148", name: "Samsvarserklæring TEK17", category: "ansvarsrett", phase: "responsibility", signer: "PRO/UTF", autofill: ["tekniske krav fra KS"] },
  { number: "5148-tek10", name: "Samsvarserklæring TEK10", category: "ansvarsrett", phase: "responsibility", signer: "PRO/UTF", autofill: ["tekniske krav"] },
  { number: "5181", name: "Erklæring om ansvarsrett UTF", category: "ansvarsrett", phase: "responsibility", signer: "UTF + Tiltakshaver", autofill: ["rolle fra prosjektinfo"] },
  { number: "5181n", name: "Erklæring om ansvarsrett UTF (nynorsk)", category: "ansvarsrett", phase: "responsibility", signer: "UTF + Tiltakshaver", autofill: ["rolle fra prosjektinfo"] },
  { number: "5183", name: "Opphør av ansvarsrett", category: "ansvarsrett", phase: "responsibility", signer: "UTF", autofill: ["prosjektendring"] },
  { number: "5183n", name: "Opphør av ansvarsrett (nynorsk)", category: "ansvarsrett", phase: "responsibility", signer: "UTF", autofill: ["prosjektendring"] },
  { number: "5184", name: "Personlig ansvarsrett (selvbygger)", category: "ansvarsrett", phase: "responsibility", signer: "Tiltakshaver", autofill: ["enkelt data"] },
  { number: "5184n", name: "Personlig ansvarsrett (nynorsk)", category: "ansvarsrett", phase: "responsibility", signer: "Tiltakshaver", autofill: ["enkelt data"] },
  { number: "5187", name: "Egenerklæring tiltakshaver", category: "ansvarsrett", phase: "responsibility", signer: "Tiltakshaver", autofill: ["enkelt data"] },
  { number: "5187n", name: "Egenerklæring tiltakshaver (nynorsk)", category: "ansvarsrett", phase: "responsibility", signer: "Tiltakshaver", autofill: ["enkelt data"] },
  { number: "5186", name: "Melding om endring av ansvarsrett", category: "ansvarsrett", phase: "responsibility", signer: "SØK", autofill: ["oppdatert rolle"] },
  { number: "5186n", name: "Melding om endring (nynorsk)", category: "ansvarsrett", phase: "responsibility", signer: "SØK", autofill: ["oppdatert rolle"] },
  
  // Phase 4: Sluttkontroll & Ferdigattest
  { number: "5167", name: "Søknad om ferdigattest", category: "ferdigattest", phase: "completion", signer: "SØK + Tiltakshaver", autofill: ["ferdig data"] },
  { number: "5167n", name: "Søknad om ferdigattest (nynorsk)", category: "ferdigattest", phase: "completion", signer: "SØK + Tiltakshaver", autofill: ["ferdig data"] },
  { number: "5168", name: "Endring av gitt tillatelse", category: "ferdigattest", phase: "completion", signer: "SØK", autofill: ["endringsbeskrivelse"] },
  { number: "5168n", name: "Endring av gitt tillatelse (nynorsk)", category: "ferdigattest", phase: "completion", signer: "SØK", autofill: ["endringsbeskrivelse"] },
  { number: "5169", name: "Søknad om midlertidig brukstillatelse", category: "ferdigattest", phase: "completion", signer: "SØK", autofill: ["midlertidig data"] },
  { number: "5169n", name: "Søknad om midlertidig brukstillatelse (nynorsk)", category: "ferdigattest", phase: "completion", signer: "SØK", autofill: ["midlertidig data"] },
  { number: "5191", name: "Plan for uavhengig kontroll", category: "kontroll", phase: "completion", signer: "SØK", autofill: ["kontrollplan"] },
  { number: "5191n", name: "Plan for uavhengig kontroll (nynorsk)", category: "kontroll", phase: "completion", signer: "SØK", autofill: ["kontrollplan"] },
  { number: "5192", name: "Åpent avvik ved uavhengig kontroll", category: "kontroll", phase: "completion", signer: "Kontrollerende", autofill: ["avviksdetaljer"] },
  { number: "5192n", name: "Åpent avvik ved UK (nynorsk)", category: "kontroll", phase: "completion", signer: "Kontrollerende", autofill: ["avviksdetaljer"] },
  { number: "5149", name: "Kontrollerklæring", category: "kontroll", phase: "completion", signer: "Kontrollerende", autofill: ["sluttrapport"] },
  { number: "5149n", name: "Kontrollerklæring (nynorsk)", category: "kontroll", phase: "completion", signer: "Kontrollerende", autofill: ["sluttrapport"] },
];

const PHASE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  before: { label: "1. Før byggestart", icon: <AlertCircle className="h-4 w-4" />, color: "text-orange-500" },
  application: { label: "2. Søknad om tillatelse", icon: <Building className="h-4 w-4" />, color: "text-blue-500" },
  responsibility: { label: "3. Ansvarsrett & Samsvar", icon: <Hammer className="h-4 w-4" />, color: "text-emerald-500" },
  completion: { label: "4. Sluttkontroll & Ferdig", icon: <Home className="h-4 w-4" />, color: "text-primary" },
};

const CATEGORY_LABELS: Record<string, string> = {
  nabovarsel: "Nabovarsel",
  soknad: "Søknader",
  plan: "Planer",
  ansvarsrett: "Ansvarsrett & Samsvar",
  kontroll: "Kontroll",
  ferdigattest: "Ferdigattest & Brukstillatelse",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  not_started: { label: "Ikke startet", color: "bg-muted text-muted-foreground", icon: <Clock className="h-3 w-3" /> },
  draft: { label: "Utkast", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: <FileText className="h-3 w-3" /> },
  signed: { label: "Signert", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 className="h-3 w-3" /> },
  sent: { label: "Sendt", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: <Send className="h-3 w-3" /> },
};

export default function Ks2ByggesakBlanketter() {
  const { projectId } = useParams<{ projectId: string }>();
  const { company } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const { data: byggesak, isLoading: byggesakLoading } = useProjectByggesak(projectId || "");
  const { data: forms, isLoading: formsLoading } = useByggesakForms(byggesak?.id);
  const { data: adminTemplates } = useByggesakTemplates();
  const createForm = useCreateByggesakForm();

  const isLoading = byggesakLoading || formsLoading;

  // Filter forms based on search and phase
  const filteredForms = DIBK_FORMS.filter(f => {
    const matchesSearch = 
      f.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPhase = !selectedPhase || f.phase === selectedPhase;
    return matchesSearch && matchesPhase;
  });

  // Group by phase, then by category
  const formsByPhase = filteredForms.reduce((acc, form) => {
    if (!acc[form.phase]) acc[form.phase] = {};
    if (!acc[form.phase][form.category]) acc[form.phase][form.category] = [];
    acc[form.phase][form.category].push(form);
    return acc;
  }, {} as Record<string, Record<string, typeof DIBK_FORMS>>);

  // Get existing form status
  const getFormStatus = (formNumber: string) => {
    return forms?.find(f => f.form_number === formNumber);
  };

  // Check if admin has a template for this form
  const hasAdminTemplate = (formNumber: string) => {
    return adminTemplates?.find(t => t.form_number === formNumber);
  };

  const handleAddForm = async (form: typeof DIBK_FORMS[0]) => {
    if (!byggesak?.id || !company?.id) return;

    const adminTemplate = hasAdminTemplate(form.number);
    
    await createForm.mutateAsync({
      byggesak_id: byggesak.id,
      project_id: projectId || "",
      company_id: company.id,
      template_id: adminTemplate?.id,
      form_number: form.number,
      form_name: form.name,
      form_category: form.category,
      status: "not_started",
      form_data: {},
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!byggesak) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Start byggesaken først via Byggesak-oversikt</p>
        <Button asChild className="mt-4">
          <Link to={`/ks/project/${projectId}/byggesak`}>Gå til byggesak-oversikt</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Alle DIBK blanketter</h1>
          <p className="text-muted-foreground">
            Komplett oversikt over {DIBK_FORMS.length} blanketter organisert etter byggefase
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="https://dibk.no/verktoy-og-veivisere/blanketter/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            DIBK blanketter
          </a>
        </Button>
      </div>

      {/* Phase Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedPhase === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPhase(null)}
        >
          Alle faser
        </Button>
        {Object.entries(PHASE_CONFIG).map(([phase, config]) => (
          <Button
            key={phase}
            variant={selectedPhase === phase ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPhase(phase)}
            className="gap-2"
          >
            <span className={config.color}>{config.icon}</span>
            {config.label}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter blankett..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Forms by Phase */}
      <div className="space-y-8">
        {Object.entries(PHASE_CONFIG).map(([phase, phaseConfig]) => {
          const phaseCategories = formsByPhase[phase] || {};
          if (Object.keys(phaseCategories).length === 0) return null;

          return (
            <div key={phase} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={phaseConfig.color}>{phaseConfig.icon}</span>
                <h2 className="text-xl font-semibold">{phaseConfig.label}</h2>
              </div>

              {Object.entries(phaseCategories).map(([category, categoryForms]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{CATEGORY_LABELS[category] || category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryForms.map(form => {
                        const existingForm = getFormStatus(form.number);
                        const statusConfig = existingForm ? STATUS_CONFIG[existingForm.status] : null;
                        const template = hasAdminTemplate(form.number);

                        return (
                          <div
                            key={form.number}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="relative">
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                {template && (
                                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {form.number}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {form.name}
                                </p>
                                <p className="text-xs text-muted-foreground/70">
                                  Signer: {form.signer}
                                </p>
                              </div>
                            </div>
                            {existingForm ? (
                              <Link to={`/ks/project/${projectId}/byggesak/form/${existingForm.id}`}>
                                <Badge className={statusConfig?.color || ""}>
                                  {statusConfig?.label}
                                </Badge>
                              </Link>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAddForm(form)}
                                disabled={createForm.isPending}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })}
      </div>

      {/* Integration Info */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-orange-500" />
            Automatisk kobling
          </CardTitle>
          <CardDescription>
            Systemet kobler data automatisk mellom moduler
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>SJA → 5177:</strong> Risikovurdering fra SJA overføres til Arbeidstilsynets samtykke</p>
          <p>• <strong>Avvik → 5192:</strong> Registrerte avvik overføres til Åpent avvik ved UK</p>
          <p>• <strong>Prosjektinfo → Alle:</strong> Adresse, gnr/bnr, byggherre og roller fylles ut automatisk</p>
          <p>• <strong>Underleverandører → 5185:</strong> Registrerte UE overføres til gjennomføringsplan</p>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nyttige lenker</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="https://dibk.no/verktoy-og-veivisere/blanketter/" target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              DIBK Blanketter
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="https://www.altinn.no/skjemaoversikt/direktoratet-for-byggkvalitet/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Altinn skjemaer
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="https://www.byggesoknad.no/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Byggesøknaden.no
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="https://ebyggesok.no/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              eByggesøk
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
