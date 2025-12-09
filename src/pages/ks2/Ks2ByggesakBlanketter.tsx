import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Download, 
  Upload,
  ExternalLink,
  Search,
  CheckCircle2,
  X,
  Filter,
  Eye,
  Trash2
} from "lucide-react";
import { 
  useProjectByggesak, 
  useByggesakForms,
  useUpdateByggesakForm
} from "@/hooks/useKsModule2Byggesak";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

// All DIBK forms with direct download links - simplified list
// Forms with localUrl have PDF stored locally, others link to DIBK
const DIBK_FORMS = [
  // Nabovarsel - standard skjemaer med lokale PDF-er
  { number: "5154", name: "Nabovarsel", category: "nabovarsel", localUrl: "/blanketter/5154-nabovarsel.pdf", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5155", name: "Opplysninger gitt i nabovarsel", category: "nabovarsel", localUrl: "/blanketter/5155-opplysninger-nabovarsel.pdf", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5156", name: "Kvittering for nabovarsel", category: "nabovarsel", localUrl: "/blanketter/5156-kvittering-nabovarsel.pdf", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5188", name: "Melding unntatt søknadsplikt", category: "nabovarsel", localUrl: "/blanketter/5188-melding-unntatt-soknadsplikt.pdf", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  
  // Nabovarsel for privatpersoner (mindre prosjekter: garasje, tilbygg, bod, bruksendring)
  { number: "NV-PRIVAT", name: "Nabovarsel for privatpersoner", category: "nabovarsel", localUrl: "/blanketter/nabovarsel-privatpersoner.pdf", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "KV-PERS", name: "Kvittering nabovarsel - Levert personlig", category: "nabovarsel", localUrl: "/blanketter/kvittering-nabovarsel-personlig.pdf", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "KV-EPOST", name: "Kvittering nabovarsel - E-post/SMS", category: "nabovarsel", localUrl: "/blanketter/kvittering-nabovarsel-epost-sms.pdf", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "KV-REK", name: "Kvittering nabovarsel - Rekommandert", category: "nabovarsel", localUrl: "/blanketter/kvittering-nabovarsel-rekommandert.pdf", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  
  // Søknader
  { number: "5151", name: "Søknad om igangsettingstillatelse", category: "soknad", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5153", name: "Søknad om tiltak uten ansvarsrett", category: "soknad", localUrl: "/blanketter/5153-tiltak-uten-ansvarsrett.pdf", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "SØK-PRIVAT", name: "Byggesøknad for privatpersoner (mindre prosjekter)", category: "soknad", localUrl: "/blanketter/byggesoknad-mindre-prosjekter.pdf", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "SØK-BRUK", name: "Søknad om bruksendring", category: "soknad", localUrl: "/blanketter/soknad-bruksendring.pdf", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5174", name: "Søknad om tillatelse til tiltak", category: "soknad", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5175", name: "Opplysninger om ytre rammer", category: "soknad", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5176", name: "Boligspesifikasjon i matrikkel", category: "soknad", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5177", name: "Samtykke fra Arbeidstilsynet", category: "soknad", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5178", name: "Avfallsplan (nybygg)", category: "soknad", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5179", name: "Avfallsplan (rehabilitering)", category: "soknad", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  
  // Planer
  { number: "5185", name: "Gjennomføringsplan", category: "plan", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5148", name: "Samsvarserklæring TEK17", category: "plan", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  
  // Ansvarsrett
  { number: "5181", name: "Erklæring om ansvarsrett", category: "ansvarsrett", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5183", name: "Opphør av ansvarsrett", category: "ansvarsrett", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5184", name: "Personlig ansvarsrett (selvbygger)", category: "ansvarsrett", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5186", name: "Melding om endring av ansvarsrett", category: "ansvarsrett", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5187", name: "Egenerklæring tiltakshaver", category: "ansvarsrett", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  
  // Kontroll
  { number: "5191", name: "Plan for uavhengig kontroll", category: "kontroll", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5192", name: "Åpent avvik ved uavhengig kontroll", category: "kontroll", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5149", name: "Kontrollerklæring", category: "kontroll", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  
  // Ferdigattest
  { number: "5167", name: "Søknad om ferdigattest", category: "ferdigattest", localUrl: "/blanketter/5167-ferdigattest.pdf", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5168", name: "Søknad om endring av tillatelse", category: "ferdigattest", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
  { number: "5169", name: "Søknad om midlertidig brukstillatelse", category: "ferdigattest", dibkUrl: "https://dibk.no/verktoy-og-veivisere/blanketter/" },
];

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  nabovarsel: { label: "Nabovarsel", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  soknad: { label: "Søknader", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  plan: { label: "Planer", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400" },
  ansvarsrett: { label: "Ansvarsrett", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  kontroll: { label: "Kontroll", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  ferdigattest: { label: "Ferdigattest", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
};

export default function Ks2ByggesakBlanketter() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: byggesak, isLoading: byggesakLoading } = useProjectByggesak(projectId || "");
  const { data: projectForms, isLoading: formsLoading } = useByggesakForms(byggesak?.id);
  const updateForm = useUpdateByggesakForm();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [uploadingFormNumber, setUploadingFormNumber] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string } | null>(null);

  const isLoading = byggesakLoading || formsLoading;

  // Get uploaded forms map
  const uploadedForms = new Map(
    (projectForms || []).map(f => [f.form_number, f])
  );

  // Filter forms
  const filteredForms = DIBK_FORMS.filter(form => {
    const matchesSearch = 
      form.number.toLowerCase().includes(search.toLowerCase()) ||
      form.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || form.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const formsByCategory = filteredForms.reduce((acc, form) => {
    if (!acc[form.category]) acc[form.category] = [];
    acc[form.category].push(form);
    return acc;
  }, {} as Record<string, typeof DIBK_FORMS>);

  const handleUpload = async (formNumber: string, formName: string, formCategory: string, file: File) => {
    if (!byggesak || !projectId) return;
    
    setUploadingFormNumber(formNumber);
    const existingForm = uploadedForms.get(formNumber);
    
    try {
      // Sanitize filename
      const sanitizedName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[æÆ]/g, "ae")
        .replace(/[øØ]/g, "o")
        .replace(/[åÅ]/g, "a")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");
      
      const filePath = `${byggesak.company_id}/${projectId}/${formNumber}_${Date.now()}_${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("byggesak-documents")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      if (existingForm) {
        // Update existing form
        await updateForm.mutateAsync({
          id: existingForm.id,
          uploaded_file_path: filePath,
          status: "uploaded",
        });
      } else {
        // Create new form entry
        const { error } = await supabase
          .from("ks_module2_byggesak_forms")
          .insert({
            byggesak_id: byggesak.id,
            project_id: projectId,
            company_id: byggesak.company_id,
            form_number: formNumber,
            form_name: formName,
            form_category: formCategory,
            status: "uploaded",
            uploaded_file_path: filePath,
            form_data: {},
          });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["byggesak-forms", byggesak.id] });
      }
      
      toast.success(`${formNumber} lastet opp!`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Kunne ikke laste opp fil");
    } finally {
      setUploadingFormNumber(null);
    }
  };

  const handleViewFile = async (filePath: string, formName: string) => {
    const { data } = supabase.storage
      .from("byggesak-documents")
      .getPublicUrl(filePath);
    
    if (data?.publicUrl) {
      setViewingFile({ url: data.publicUrl, name: formName });
    }
  };

  const handleDeleteFile = async (formId: string, filePath: string) => {
    try {
      await supabase.storage
        .from("byggesak-documents")
        .remove([filePath]);
      
      await updateForm.mutateAsync({
        id: formId,
        uploaded_file_path: null,
        status: "not_started",
      });
      
      toast.success("Fil slettet");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Kunne ikke slette fil");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!byggesak) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Byggesak ikke startet</h2>
        <p className="text-muted-foreground mb-4">Gå til Byggesak-oversikt for å starte</p>
        <Button asChild>
          <Link to={`/ks/project/${projectId}/byggesak`}>Gå til byggesak-oversikt</Link>
        </Button>
      </div>
    );
  }

  const uploadedCount = projectForms?.filter(f => f.uploaded_file_path).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blanketter</h1>
          <p className="text-muted-foreground">
            Last ned skjemaer fra DIBK, fyll ut manuelt, og last opp signerte versjoner
          </p>
        </div>
        <Badge variant="secondary" className="text-sm w-fit">
          {uploadedCount} opplastet
        </Badge>
      </div>

      {/* Simple instructions */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">1</div>
              <span className="text-sm">Last ned skjema fra DIBK</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">2</div>
              <span className="text-sm">Fyll ut og signer (papir eller digitalt)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">3</div>
              <span className="text-sm">Last opp ferdig signert dokument</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk på skjemanummer eller navn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Alle kategorier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick link to DIBK */}
      <Button variant="outline" size="sm" asChild className="w-fit">
        <a href="https://dibk.no/verktoy-og-veivisere/blanketter/" target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 mr-2" />
          Åpne DIBK blankettbibliotek
        </a>
      </Button>

      {/* Forms by category */}
      {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
        const categoryForms = formsByCategory[category];
        if (!categoryForms || categoryForms.length === 0) return null;

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge className={config.color}>{config.label}</Badge>
                <span className="text-sm text-muted-foreground">
                  ({categoryForms.length} skjemaer)
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoryForms.map(form => {
                  const projectForm = uploadedForms.get(form.number);
                  const hasUpload = projectForm?.uploaded_file_path;

                  return (
                    <div
                      key={form.number}
                      className={`relative p-4 rounded-lg border transition-colors ${
                        hasUpload 
                          ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {hasUpload && (
                        <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-green-600" />
                      )}
                      
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative">
                          <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                          {form.localUrl && (
                            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" title="PDF tilgjengelig" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{form.number}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {form.name}
                          </p>
                          {form.localUrl && (
                            <Badge variant="outline" className="text-[10px] mt-1 px-1 py-0">
                              PDF klar
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 flex-1"
                          asChild
                        >
                          <a 
                            href={form.localUrl || form.dibkUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            download={form.localUrl ? `${form.number}-${form.name}.pdf` : undefined}
                          >
                            <Download className="h-3 w-3" />
                            {form.localUrl ? "Last ned PDF" : "Åpne DIBK"}
                          </a>
                        </Button>
                        
                        {hasUpload ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 text-xs gap-1"
                              onClick={() => handleViewFile(projectForm.uploaded_file_path!, form.name)}
                            >
                              <Eye className="h-3 w-3" />
                              Se
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs gap-1 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteFile(projectForm.id, projectForm.uploaded_file_path!)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <label className="flex-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 text-xs gap-1 w-full cursor-pointer"
                              disabled={uploadingFormNumber === form.number}
                              asChild
                            >
                              <span>
                                <Upload className="h-3 w-3" />
                                {uploadingFormNumber === form.number ? "Laster..." : "Last opp"}
                              </span>
                            </Button>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUpload(form.number, form.name, form.category, file);
                                }
                                e.target.value = "";
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* View file dialog */}
      <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingFile?.name}</DialogTitle>
            <DialogDescription>Opplastet dokument</DialogDescription>
          </DialogHeader>
          {viewingFile && (
            <div className="flex-1 min-h-[60vh]">
              <iframe
                src={viewingFile.url}
                className="w-full h-[60vh] rounded border"
                title={viewingFile.name}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}