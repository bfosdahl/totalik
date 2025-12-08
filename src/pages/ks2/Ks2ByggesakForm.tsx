import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  Pen, 
  CheckCircle2,
  FileText,
  ExternalLink,
  Save
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { useUpdateByggesakForm, ByggesakForm } from "@/hooks/useKsModule2Byggesak";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// DIBK official PDF URLs
const DIBK_PDFS: Record<string, string> = {
  "5154": "https://dibk.no/globalassets/byggeregler/skjema/5154-nabovarsel.pdf",
  "5155": "https://dibk.no/globalassets/byggeregler/skjema/5155-opplysninger-gitt-i-nabovarsel.pdf",
  "5156": "https://dibk.no/globalassets/byggeregler/skjema/5156-kvittering-for-nabovarsel.pdf",
  "5151": "https://dibk.no/globalassets/byggeregler/skjema/5151-soknad-om-igangsettingstillatelse.pdf",
  "5174": "https://dibk.no/globalassets/byggeregler/skjema/5174-soknad-om-tillatelse-til-tiltak.pdf",
  "5181": "https://dibk.no/globalassets/byggeregler/skjema/5181-erklaering-om-ansvarsrett.pdf",
  "5185": "https://dibk.no/globalassets/byggeregler/skjema/5185-gjennomforingsplan.pdf",
  "5167": "https://dibk.no/globalassets/byggeregler/skjema/5167-soknad-om-ferdigattest.pdf",
  "5148": "https://dibk.no/globalassets/byggeregler/skjema/5148-samsvarserklaring.pdf",
  "5149": "https://dibk.no/globalassets/byggeregler/skjema/5149-kontrollerklaring.pdf",
};

// Form field configurations per form type
const FORM_FIELDS: Record<string, { key: string; label: string; type: string; span?: number }[]> = {
  "5181": [
    { key: "foretak_navn", label: "Foretakets navn", type: "text", span: 2 },
    { key: "foretak_org_nr", label: "Organisasjonsnummer", type: "text" },
    { key: "foretak_adresse", label: "Adresse", type: "text" },
    { key: "foretak_postnr", label: "Postnr", type: "text" },
    { key: "foretak_poststed", label: "Poststed", type: "text" },
    { key: "kontaktperson", label: "Kontaktperson", type: "text" },
    { key: "telefon", label: "Telefon", type: "text" },
    { key: "epost", label: "E-post", type: "email" },
    { key: "funksjon", label: "Funksjon (SØK/PRO/UTF)", type: "text" },
    { key: "tiltaksklasse", label: "Tiltaksklasse", type: "text" },
    { key: "beskrivelse", label: "Beskrivelse av ansvarsområde", type: "textarea", span: 2 },
  ],
  "5154": [
    { key: "tiltakshaver_navn", label: "Tiltakshavers navn", type: "text", span: 2 },
    { key: "eiendom_adresse", label: "Eiendommens adresse", type: "text", span: 2 },
    { key: "gnr", label: "Gnr", type: "text" },
    { key: "bnr", label: "Bnr", type: "text" },
    { key: "kommune", label: "Kommune", type: "text" },
    { key: "beskrivelse", label: "Kort beskrivelse av tiltaket", type: "textarea", span: 2 },
    { key: "frist_merknad", label: "Frist for merknader", type: "date" },
  ],
  default: [
    { key: "prosjekt_navn", label: "Prosjektnavn", type: "text", span: 2 },
    { key: "eiendom_adresse", label: "Adresse", type: "text", span: 2 },
    { key: "gnr", label: "Gnr", type: "text" },
    { key: "bnr", label: "Bnr", type: "text" },
    { key: "kommune", label: "Kommune", type: "text" },
    { key: "tiltakshaver", label: "Tiltakshaver/Byggherre", type: "text" },
    { key: "ansvarlig_foretak", label: "Ansvarlig foretak", type: "text" },
    { key: "kontaktperson", label: "Kontaktperson", type: "text" },
    { key: "merknad", label: "Merknader", type: "textarea", span: 2 },
  ],
};

export default function Ks2ByggesakForm() {
  const { projectId, formId } = useParams<{ projectId: string; formId: string }>();
  const navigate = useNavigate();
  const { company, user, profile } = useAuth();
  const updateForm = useUpdateByggesakForm();
  const { projects } = useKsModule2Projects();
  const project = projects?.find(p => p.id === projectId);
  
  const { data: form, isLoading } = useQuery({
    queryKey: ["byggesak-form", formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ks_module2_byggesak_forms")
        .select("*")
        .eq("id", formId)
        .single();
      
      if (error) throw error;
      return data as ByggesakForm;
    },
    enabled: !!formId,
  });

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data from saved data or project info
  useState(() => {
    if (form?.form_data) {
      setFormData(form.form_data as Record<string, string>);
    } else if (project) {
      // Auto-fill from project
      setFormData({
        prosjekt_navn: project.project_name || "",
        eiendom_adresse: project.address || "",
        gnr: "",
        bnr: "",
        kommune: "",
        tiltakshaver: project.client_name || "",
        ansvarlig_foretak: company?.name || "",
        kontaktperson: profile ? `${profile.first_name} ${profile.last_name}` : "",
        foretak_navn: company?.name || "",
        foretak_org_nr: company?.org_number || "",
        foretak_adresse: company?.address || "",
        foretak_postnr: company?.postal_code || "",
        foretak_poststed: company?.city || "",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!form) {
    return <div>Blankett ikke funnet</div>;
  }

  const fields = FORM_FIELDS[form.form_number] || FORM_FIELDS.default;
  const dibkUrl = DIBK_PDFS[form.form_number];

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateForm.mutateAsync({
      id: form.id,
      form_data: formData,
      status: form.status === "not_started" ? "draft" : form.status,
    });
    setHasChanges(false);
  };

  const handleSign = async () => {
    await updateForm.mutateAsync({
      id: form.id,
      form_data: formData,
      status: "signed",
      signed_by_name: profile ? `${profile.first_name} ${profile.last_name}` : "Ukjent",
      signed_at: new Date().toISOString(),
    });
    toast.success("Blankett signert!");
    setHasChanges(false);
  };

  const handleUploadSigned = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${form.id}-signed.${fileExt}`;
    const filePath = `${company?.id}/${projectId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("byggesak-documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Kunne ikke laste opp fil");
      return;
    }

    await updateForm.mutateAsync({
      id: form.id,
      uploaded_file_path: filePath,
      status: "uploaded",
    });
    toast.success("Signert blankett lastet opp!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/ks/project/${projectId}/byggesak`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{form.form_number} {form.form_name}</h1>
            <p className="text-muted-foreground">{project?.project_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={form.status === "signed" ? "default" : "secondary"}>
            {form.status === "not_started" && "Ikke startet"}
            {form.status === "draft" && "Utkast"}
            {form.status === "signed" && "Signert"}
            {form.status === "sent" && "Sendt"}
            {form.status === "uploaded" && "Opplastet"}
          </Badge>
        </div>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            {dibkUrl && (
              <Button variant="outline" className="gap-2" asChild>
                <a href={dibkUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Last ned offisiell PDF (DIBK)
                </a>
              </Button>
            )}
            <Button variant="outline" className="gap-2" disabled>
              <Download className="h-4 w-4" />
              Generer utfylt PDF
            </Button>
            <label>
              <Button variant="outline" className="gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Last opp signert versjon
                </span>
              </Button>
              <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={handleUploadSigned} />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Fyll ut blankett</CardTitle>
          <CardDescription>
            Feltene autofylles fra prosjektinformasjon. Gjør endringer der det er nødvendig.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(field => (
              <div key={field.key} className={field.span === 2 ? "sm:col-span-2" : ""}>
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    value={formData[field.key] || ""}
                    onChange={e => handleFieldChange(field.key, e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type}
                    value={formData[field.key] || ""}
                    onChange={e => handleFieldChange(field.key, e.target.value)}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="outline" onClick={handleSave} disabled={!hasChanges || updateForm.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              Lagre utkast
            </Button>
            <Button onClick={handleSign} disabled={updateForm.isPending} className="gap-2">
              <Pen className="h-4 w-4" />
              Signer digitalt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Document */}
      {form.uploaded_file_path && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Opplastet signert dokument
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Last ned
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
