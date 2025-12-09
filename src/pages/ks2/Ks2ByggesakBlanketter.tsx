import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { useState } from "react";
import { 
  useProjectByggesak, 
  useByggesakForms, 
  useByggesakTemplates,
  useCreateByggesakForm 
} from "@/hooks/useKsModule2Byggesak";
import { useAuth } from "@/contexts/AuthContext";

// Complete list of all DIBK forms
const DIBK_FORMS = [
  { number: "5154", name: "Nabovarsel", category: "nabovarsel" },
  { number: "5154n", name: "Nabovarsel (nynorsk)", category: "nabovarsel" },
  { number: "5155", name: "Opplysninger gitt i nabovarsel", category: "nabovarsel" },
  { number: "5155n", name: "Opplysninger gitt i nabovarsel (nynorsk)", category: "nabovarsel" },
  { number: "5156", name: "Kvittering for nabovarsel", category: "nabovarsel" },
  { number: "5156n", name: "Kvittering for nabovarsel (nynorsk)", category: "nabovarsel" },
  { number: "5188", name: "Gjenpart av nabovarsel", category: "nabovarsel" },
  { number: "5188n", name: "Gjenpart av nabovarsel (nynorsk)", category: "nabovarsel" },
  { number: "5151", name: "Søknad om dispensasjon", category: "soknad" },
  { number: "5151n", name: "Søknad om dispensasjon (nynorsk)", category: "soknad" },
  { number: "5153", name: "Søknad om deling/rekvisisjon", category: "soknad" },
  { number: "5153n", name: "Søknad om deling/rekvisisjon (nynorsk)", category: "soknad" },
  { number: "5174", name: "Søknad om tillatelse til tiltak", category: "soknad" },
  { number: "5174n", name: "Søknad om tillatelse til tiltak (nynorsk)", category: "soknad" },
  { number: "5175", name: "Søknad om tillatelse til tiltak uten ansvarsrett", category: "soknad" },
  { number: "5175n", name: "Søknad om tillatelse til tiltak uten ansvarsrett (nynorsk)", category: "soknad" },
  { number: "5176", name: "Søknad om ferdigattest", category: "ferdigattest" },
  { number: "5176n", name: "Søknad om ferdigattest (nynorsk)", category: "ferdigattest" },
  { number: "5177", name: "Søknad om midlertidig brukstillatelse", category: "ferdigattest" },
  { number: "5177n", name: "Søknad om midlertidig brukstillatelse (nynorsk)", category: "ferdigattest" },
  { number: "5178", name: "Erklæring om ansvarsrett", category: "ansvarsrett" },
  { number: "5178n", name: "Erklæring om ansvarsrett (nynorsk)", category: "ansvarsrett" },
  { number: "5179", name: "Gjennomføringsplan", category: "plan" },
  { number: "5179n", name: "Gjennomføringsplan (nynorsk)", category: "plan" },
  { number: "5185", name: "Gjennomføringsplan", category: "plan" },
  { number: "5185n", name: "Gjennomføringsplan (nynorsk)", category: "plan" },
  { number: "5148", name: "Boligspesifikasjon TEK17", category: "kontroll" },
  { number: "5181", name: "Samsvarserklæring UTF", category: "ansvarsrett" },
  { number: "5181n", name: "Samsvarserklæring UTF (nynorsk)", category: "ansvarsrett" },
  { number: "5183", name: "Samsvarserklæring PRO", category: "ansvarsrett" },
  { number: "5183n", name: "Samsvarserklæring PRO (nynorsk)", category: "ansvarsrett" },
  { number: "5184", name: "Samsvarserklæring SØK", category: "ansvarsrett" },
  { number: "5184n", name: "Samsvarserklæring SØK (nynorsk)", category: "ansvarsrett" },
  { number: "5187", name: "Kontrollerklæring UTF", category: "kontroll" },
  { number: "5187n", name: "Kontrollerklæring UTF (nynorsk)", category: "kontroll" },
  { number: "5186", name: "Kontrollerklæring PRO", category: "kontroll" },
  { number: "5186n", name: "Kontrollerklæring PRO (nynorsk)", category: "kontroll" },
  { number: "5167", name: "Ferdigattest", category: "ferdigattest" },
  { number: "5167n", name: "Ferdigattest (nynorsk)", category: "ferdigattest" },
  { number: "5168", name: "Midlertidig brukstillatelse", category: "ferdigattest" },
  { number: "5168n", name: "Midlertidig brukstillatelse (nynorsk)", category: "ferdigattest" },
  { number: "5169", name: "Igangsettingstillatelse", category: "soknad" },
  { number: "5169n", name: "Igangsettingstillatelse (nynorsk)", category: "soknad" },
  { number: "5191", name: "Avviksmelding", category: "melding" },
  { number: "5191n", name: "Avviksmelding (nynorsk)", category: "melding" },
  { number: "5192", name: "Endringsmelding", category: "melding" },
  { number: "5192n", name: "Endringsmelding (nynorsk)", category: "melding" },
  { number: "5149", name: "Situasjonsplan", category: "annet" },
  { number: "5149n", name: "Situasjonsplan (nynorsk)", category: "annet" },
];

const CATEGORY_LABELS: Record<string, string> = {
  nabovarsel: "Nabovarsel",
  soknad: "Søknader",
  ansvarsrett: "Ansvarsrett & Samsvar",
  plan: "Planer",
  kontroll: "Kontroll",
  ferdigattest: "Ferdigattest & Brukstillatelse",
  melding: "Meldinger",
  annet: "Annet",
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
  const { data: byggesak, isLoading: byggesakLoading } = useProjectByggesak(projectId || "");
  const { data: forms, isLoading: formsLoading } = useByggesakForms(byggesak?.id);
  const createForm = useCreateByggesakForm();

  const isLoading = byggesakLoading || formsLoading;

  // Filter forms based on search
  const filteredForms = DIBK_FORMS.filter(f => 
    f.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const formsByCategory = filteredForms.reduce((acc, form) => {
    if (!acc[form.category]) acc[form.category] = [];
    acc[form.category].push(form);
    return acc;
  }, {} as Record<string, typeof DIBK_FORMS>);

  // Get existing form status
  const getFormStatus = (formNumber: string) => {
    const existing = forms?.find(f => f.form_number === formNumber);
    return existing;
  };

  const handleAddForm = async (formNumber: string, formName: string, category: string) => {
    if (!byggesak?.id || !company?.id) return;

    await createForm.mutateAsync({
      byggesak_id: byggesak.id,
      project_id: projectId || "",
      company_id: company.id,
      form_number: formNumber,
      form_name: formName,
      form_category: category,
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
          <h1 className="text-2xl font-bold">Alle blanketter</h1>
          <p className="text-muted-foreground">Komplett oversikt over DIBK blanketter</p>
        </div>
        <Button variant="outline" asChild>
          <a href="https://dibk.no/verktoy-og-veivisere/blanketter/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            DIBK blanketter
          </a>
        </Button>
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

      {/* Forms by Category */}
      <div className="space-y-6">
        {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
          const categoryForms = formsByCategory[category] || [];
          if (categoryForms.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryForms.map(form => {
                    const existingForm = getFormStatus(form.number);
                    const statusConfig = existingForm ? STATUS_CONFIG[existingForm.status] : null;

                    return (
                      <div
                        key={form.number}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {form.number}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {form.name}
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
                            onClick={() => handleAddForm(form.number, form.name, category)}
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
          );
        })}
      </div>

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
        </CardContent>
      </Card>
    </div>
  );
}
