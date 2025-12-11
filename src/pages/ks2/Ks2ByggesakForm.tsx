import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  Pen, 
  CheckCircle2,
  FileText,
  ExternalLink,
  Save,
  Send,
  Mail
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { useUpdateByggesakForm, ByggesakForm } from "@/hooks/useKsModule2Byggesak";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { toast } from "sonner";
import { EmailSendDialog } from "@/components/shared/EmailSendDialog";

// DIBK official PDF URLs
const DIBK_PDFS: Record<string, string> = {
  "5148": "https://dibk.no/globalassets/byggeregler/skjema/5148-samsvarserklaring.pdf",
  "5149": "https://dibk.no/globalassets/byggeregler/skjema/5149-kontrollerklaring.pdf",
  "5151": "https://dibk.no/globalassets/byggeregler/skjema/5151-soknad-om-igangsettingstillatelse.pdf",
  "5153": "https://dibk.no/globalassets/byggeregler/skjema/5153-tiltak-uten-ansvarsrett.pdf",
  "5154": "https://dibk.no/globalassets/byggeregler/skjema/5154-nabovarsel.pdf",
  "5155": "https://dibk.no/globalassets/byggeregler/skjema/5155-opplysninger-gitt-i-nabovarsel.pdf",
  "5156": "https://dibk.no/globalassets/byggeregler/skjema/5156-kvittering-for-nabovarsel.pdf",
  "5167": "https://dibk.no/globalassets/byggeregler/skjema/5167-soknad-om-ferdigattest.pdf",
  "5168": "https://dibk.no/globalassets/byggeregler/skjema/5168-soknad-om-endring-av-tillatelse.pdf",
  "5169": "https://dibk.no/globalassets/byggeregler/skjema/5169-soknad-om-midlertidig-brukstillatelse.pdf",
  "5174": "https://dibk.no/globalassets/byggeregler/skjema/5174-soknad-om-tillatelse-til-tiltak.pdf",
  "5175": "https://dibk.no/globalassets/byggeregler/skjema/5175-opplysninger-om-tiltakets-ytre-rammer.pdf",
  "5176": "https://dibk.no/globalassets/byggeregler/skjema/5176-boligspesifikasjon.pdf",
  "5181": "https://dibk.no/globalassets/byggeregler/skjema/5181-erklaering-om-ansvarsrett.pdf",
  "5183": "https://dibk.no/globalassets/byggeregler/skjema/5183-soknad-om-opphor-av-ansvarsrett.pdf",
  "5184": "https://dibk.no/globalassets/byggeregler/skjema/5184-soknad-om-personlig-ansvarsrett.pdf",
  "5185": "https://dibk.no/globalassets/byggeregler/skjema/5185-gjennomforingsplan.pdf",
  "5186": "https://dibk.no/globalassets/byggeregler/skjema/5186-endring-av-ansvarsforhold.pdf",
  "5187": "https://dibk.no/globalassets/byggeregler/skjema/5187-egenerklaering-om-ansvar-som-selvbygger.pdf",
  "5188": "https://dibk.no/globalassets/byggeregler/skjema/5188-melding-om-tiltak.pdf",
  "5191": "https://dibk.no/globalassets/byggeregler/skjema/5191-plan-for-uavhengig-kontroll.pdf",
  "5192": "https://dibk.no/globalassets/byggeregler/skjema/5192-apent-avvik-fra-uavhengig-kontroll.pdf",
};

// Comprehensive form field configurations per form type
const FORM_FIELDS: Record<string, { 
  key: string; 
  label: string; 
  type: "text" | "textarea" | "date" | "email" | "select" | "checkbox" | "number"; 
  span?: number;
  options?: { value: string; label: string }[];
  section?: string;
  placeholder?: string;
}[]> = {
  // 5181 - Erklæring om ansvarsrett
  "5181": [
    { key: "section_foretak", label: "Foretakets opplysninger", type: "text", section: "heading" },
    { key: "foretak_navn", label: "Foretakets navn", type: "text", span: 2 },
    { key: "foretak_org_nr", label: "Organisasjonsnummer", type: "text" },
    { key: "foretak_adresse", label: "Adresse", type: "text" },
    { key: "foretak_postnr", label: "Postnr", type: "text" },
    { key: "foretak_poststed", label: "Poststed", type: "text" },
    { key: "kontaktperson", label: "Kontaktperson", type: "text" },
    { key: "telefon", label: "Telefon", type: "text" },
    { key: "epost", label: "E-post", type: "email" },
    { key: "section_ansvarsomrade", label: "Ansvarsområde", type: "text", section: "heading" },
    { key: "funksjon", label: "Funksjon", type: "select", options: [
      { value: "SOK", label: "SØK - Ansvarlig søker" },
      { value: "PRO", label: "PRO - Prosjekterende" },
      { value: "UTF", label: "UTF - Utførende" },
      { value: "KPR", label: "KPR - Kontrollerende for prosjektering" },
      { value: "KUT", label: "KUT - Kontrollerende for utførelse" },
    ]},
    { key: "tiltaksklasse", label: "Tiltaksklasse", type: "select", options: [
      { value: "1", label: "Tiltaksklasse 1" },
      { value: "2", label: "Tiltaksklasse 2" },
      { value: "3", label: "Tiltaksklasse 3" },
    ]},
    { key: "beskrivelse", label: "Beskrivelse av ansvarsområde", type: "textarea", span: 2, placeholder: "F.eks. Tømrerarbeid, grunnarbeid, sanitær..." },
    { key: "section_eiendom", label: "Eiendom og tiltak", type: "text", section: "heading" },
    { key: "eiendom_adresse", label: "Eiendommens adresse", type: "text", span: 2 },
    { key: "gnr", label: "Gnr", type: "text" },
    { key: "bnr", label: "Bnr", type: "text" },
    { key: "kommune", label: "Kommune", type: "text" },
    { key: "saksnummer", label: "Kommunens saksnummer", type: "text" },
  ],

  // 5154 - Nabovarsel
  "5154": [
    { key: "section_tiltakshaver", label: "Tiltakshaver", type: "text", section: "heading" },
    { key: "tiltakshaver_navn", label: "Tiltakshavers navn", type: "text", span: 2 },
    { key: "tiltakshaver_adresse", label: "Adresse", type: "text" },
    { key: "tiltakshaver_postnr", label: "Postnr", type: "text" },
    { key: "tiltakshaver_poststed", label: "Poststed", type: "text" },
    { key: "tiltakshaver_telefon", label: "Telefon", type: "text" },
    { key: "tiltakshaver_epost", label: "E-post", type: "email" },
    { key: "section_eiendom", label: "Eiendommen det varsles om", type: "text", section: "heading" },
    { key: "eiendom_adresse", label: "Eiendommens adresse", type: "text", span: 2 },
    { key: "gnr", label: "Gnr", type: "text" },
    { key: "bnr", label: "Bnr", type: "text" },
    { key: "fnr", label: "Festenr", type: "text" },
    { key: "snr", label: "Seksjonsnr", type: "text" },
    { key: "kommune", label: "Kommune", type: "text" },
    { key: "section_tiltak", label: "Beskrivelse av tiltaket", type: "text", section: "heading" },
    { key: "beskrivelse", label: "Kort beskrivelse av tiltaket", type: "textarea", span: 2, placeholder: "Beskriv hva som skal bygges/endres..." },
    { key: "dispensasjon", label: "Søkes det om dispensasjon?", type: "select", options: [
      { value: "nei", label: "Nei" },
      { value: "ja", label: "Ja" },
    ]},
    { key: "dispensasjon_beskrivelse", label: "Beskrivelse av dispensasjon", type: "textarea", span: 2 },
    { key: "section_frist", label: "Frist for merknader", type: "text", section: "heading" },
    { key: "frist_merknad", label: "Frist for merknader (minst 14 dager)", type: "date" },
    { key: "merknad_sendes_til", label: "Merknader sendes til", type: "text", span: 2, placeholder: "Navn og adresse til ansvarlig søker" },
  ],

  // 5174 - Søknad om tillatelse til tiltak
  "5174": [
    { key: "section_eiendom", label: "Eiendom og tiltakshaver", type: "text", section: "heading" },
    { key: "eiendom_adresse", label: "Eiendommens adresse", type: "text", span: 2 },
    { key: "gnr", label: "Gnr", type: "text" },
    { key: "bnr", label: "Bnr", type: "text" },
    { key: "fnr", label: "Festenr", type: "text" },
    { key: "snr", label: "Seksjonsnr", type: "text" },
    { key: "kommune", label: "Kommune", type: "text" },
    { key: "tiltakshaver_navn", label: "Tiltakshavers navn", type: "text", span: 2 },
    { key: "tiltakshaver_adresse", label: "Tiltakshavers adresse", type: "text" },
    { key: "tiltakshaver_postnr", label: "Postnr", type: "text" },
    { key: "tiltakshaver_poststed", label: "Poststed", type: "text" },
    { key: "section_tiltak", label: "Tiltakets art", type: "text", section: "heading" },
    { key: "tiltakstype", label: "Tiltakstype", type: "select", options: [
      { value: "nybygg", label: "Nybygg" },
      { value: "tilbygg", label: "Tilbygg" },
      { value: "pabygg", label: "Påbygg" },
      { value: "underbygg", label: "Underbygging" },
      { value: "hovedombygging", label: "Hovedombygging" },
      { value: "bruksendring", label: "Bruksendring" },
      { value: "riving", label: "Riving" },
      { value: "anlegg", label: "Anlegg" },
    ]},
    { key: "bygningstype", label: "Bygningstype", type: "select", options: [
      { value: "enebolig", label: "Enebolig" },
      { value: "tomannsbolig", label: "Tomannsbolig" },
      { value: "rekkehus", label: "Rekkehus" },
      { value: "leilighetsbygg", label: "Leilighetsbygg" },
      { value: "fritidsbolig", label: "Fritidsbolig" },
      { value: "garasje", label: "Garasje" },
      { value: "naeringsbygg", label: "Næringsbygg" },
      { value: "annet", label: "Annet" },
    ]},
    { key: "beskrivelse", label: "Beskrivelse av tiltaket", type: "textarea", span: 2 },
    { key: "bra", label: "Bruksareal (BRA) m²", type: "number" },
    { key: "bya", label: "Bebygd areal (BYA) m²", type: "number" },
    { key: "section_soker", label: "Ansvarlig søker", type: "text", section: "heading" },
    { key: "soker_foretak", label: "Foretakets navn", type: "text", span: 2 },
    { key: "soker_org_nr", label: "Organisasjonsnummer", type: "text" },
    { key: "soker_kontaktperson", label: "Kontaktperson", type: "text" },
    { key: "soker_telefon", label: "Telefon", type: "text" },
    { key: "soker_epost", label: "E-post", type: "email" },
  ],

  // 5167 - Søknad om ferdigattest
  "5167": [
    { key: "section_eiendom", label: "Eiendom", type: "text", section: "heading" },
    { key: "eiendom_adresse", label: "Eiendommens adresse", type: "text", span: 2 },
    { key: "gnr", label: "Gnr", type: "text" },
    { key: "bnr", label: "Bnr", type: "text" },
    { key: "kommune", label: "Kommune", type: "text" },
    { key: "saksnummer", label: "Kommunens saksnummer", type: "text" },
    { key: "section_tiltak", label: "Tiltak", type: "text", section: "heading" },
    { key: "beskrivelse", label: "Kort beskrivelse av tiltaket", type: "textarea", span: 2 },
    { key: "ferdigattest_gjelder", label: "Ferdigattesten gjelder", type: "select", options: [
      { value: "hele", label: "Hele tiltaket" },
      { value: "del", label: "Del av tiltaket" },
    ]},
    { key: "del_beskrivelse", label: "Hvilken del av tiltaket", type: "textarea", span: 2 },
    { key: "section_soker", label: "Ansvarlig søker", type: "text", section: "heading" },
    { key: "soker_foretak", label: "Foretakets navn", type: "text", span: 2 },
    { key: "soker_org_nr", label: "Organisasjonsnummer", type: "text" },
    { key: "soker_kontaktperson", label: "Kontaktperson", type: "text" },
    { key: "soker_telefon", label: "Telefon", type: "text" },
    { key: "soker_epost", label: "E-post", type: "email" },
    { key: "section_vedlegg", label: "Vedlegg", type: "text", section: "heading" },
    { key: "vedlegg_gjennomforingsplan", label: "Sluttrapport gjennomføringsplan vedlagt", type: "checkbox" },
    { key: "vedlegg_kontrollerklaring", label: "Kontrollerklæringer vedlagt", type: "checkbox" },
    { key: "vedlegg_samsvarserklaring", label: "Samsvarserklæringer vedlagt", type: "checkbox" },
  ],

  // 5185 - Gjennomføringsplan
  "5185": [
    { key: "section_eiendom", label: "Eiendom", type: "text", section: "heading" },
    { key: "eiendom_adresse", label: "Eiendommens adresse", type: "text", span: 2 },
    { key: "gnr", label: "Gnr", type: "text" },
    { key: "bnr", label: "Bnr", type: "text" },
    { key: "kommune", label: "Kommune", type: "text" },
    { key: "saksnummer", label: "Kommunens saksnummer", type: "text" },
    { key: "section_tiltak", label: "Tiltak", type: "text", section: "heading" },
    { key: "beskrivelse", label: "Kort beskrivelse av tiltaket", type: "textarea", span: 2 },
    { key: "tiltaksklasse", label: "Høyeste tiltaksklasse", type: "select", options: [
      { value: "1", label: "Tiltaksklasse 1" },
      { value: "2", label: "Tiltaksklasse 2" },
      { value: "3", label: "Tiltaksklasse 3" },
    ]},
    { key: "section_soker", label: "Ansvarlig søker", type: "text", section: "heading" },
    { key: "soker_foretak", label: "Foretakets navn", type: "text", span: 2 },
    { key: "soker_org_nr", label: "Organisasjonsnummer", type: "text" },
    { key: "soker_kontaktperson", label: "Kontaktperson", type: "text" },
    { key: "soker_telefon", label: "Telefon", type: "text" },
    { key: "soker_epost", label: "E-post", type: "email" },
  ],

  // 5148 - Samsvarserklæring
  "5148": [
    { key: "section_eiendom", label: "Eiendom", type: "text", section: "heading" },
    { key: "eiendom_adresse", label: "Eiendommens adresse", type: "text", span: 2 },
    { key: "gnr", label: "Gnr", type: "text" },
    { key: "bnr", label: "Bnr", type: "text" },
    { key: "kommune", label: "Kommune", type: "text" },
    { key: "saksnummer", label: "Kommunens saksnummer", type: "text" },
    { key: "section_foretak", label: "Ansvarlig foretak", type: "text", section: "heading" },
    { key: "foretak_navn", label: "Foretakets navn", type: "text", span: 2 },
    { key: "foretak_org_nr", label: "Organisasjonsnummer", type: "text" },
    { key: "funksjon", label: "Funksjon", type: "select", options: [
      { value: "PRO", label: "PRO - Prosjekterende" },
      { value: "UTF", label: "UTF - Utførende" },
    ]},
    { key: "tiltaksklasse", label: "Tiltaksklasse", type: "select", options: [
      { value: "1", label: "Tiltaksklasse 1" },
      { value: "2", label: "Tiltaksklasse 2" },
      { value: "3", label: "Tiltaksklasse 3" },
    ]},
    { key: "section_erklaering", label: "Erklæring", type: "text", section: "heading" },
    { key: "beskrivelse", label: "Beskrivelse av ansvarsområde", type: "textarea", span: 2 },
    { key: "avvik_fra_tillatelse", label: "Er det avvik fra gitt tillatelse?", type: "select", options: [
      { value: "nei", label: "Nei" },
      { value: "ja", label: "Ja" },
    ]},
    { key: "avvik_beskrivelse", label: "Beskrivelse av avvik", type: "textarea", span: 2 },
  ],

  // 5149 - Kontrollerklæring
  "5149": [
    { key: "section_eiendom", label: "Eiendom", type: "text", section: "heading" },
    { key: "eiendom_adresse", label: "Eiendommens adresse", type: "text", span: 2 },
    { key: "gnr", label: "Gnr", type: "text" },
    { key: "bnr", label: "Bnr", type: "text" },
    { key: "kommune", label: "Kommune", type: "text" },
    { key: "saksnummer", label: "Kommunens saksnummer", type: "text" },
    { key: "section_foretak", label: "Kontrollerende foretak", type: "text", section: "heading" },
    { key: "foretak_navn", label: "Foretakets navn", type: "text", span: 2 },
    { key: "foretak_org_nr", label: "Organisasjonsnummer", type: "text" },
    { key: "funksjon", label: "Kontrollfunksjon", type: "select", options: [
      { value: "KPR", label: "KPR - Kontrollerende for prosjektering" },
      { value: "KUT", label: "KUT - Kontrollerende for utførelse" },
    ]},
    { key: "tiltaksklasse", label: "Tiltaksklasse", type: "select", options: [
      { value: "1", label: "Tiltaksklasse 1" },
      { value: "2", label: "Tiltaksklasse 2" },
      { value: "3", label: "Tiltaksklasse 3" },
    ]},
    { key: "section_kontroll", label: "Kontrollresultat", type: "text", section: "heading" },
    { key: "beskrivelse", label: "Beskrivelse av kontrollområde", type: "textarea", span: 2 },
    { key: "kontroll_ok", label: "Kontrollen viser samsvar", type: "select", options: [
      { value: "ja", label: "Ja" },
      { value: "nei", label: "Nei, det er åpne avvik" },
    ]},
    { key: "avvik_beskrivelse", label: "Beskrivelse av åpne avvik", type: "textarea", span: 2 },
  ],

  // Default fallback for unknown forms
  default: [
    { key: "section_eiendom", label: "Eiendom", type: "text", section: "heading" },
    { key: "eiendom_adresse", label: "Adresse", type: "text", span: 2 },
    { key: "gnr", label: "Gnr", type: "text" },
    { key: "bnr", label: "Bnr", type: "text" },
    { key: "kommune", label: "Kommune", type: "text" },
    { key: "saksnummer", label: "Saksnummer", type: "text" },
    { key: "section_tiltakshaver", label: "Tiltakshaver", type: "text", section: "heading" },
    { key: "tiltakshaver", label: "Tiltakshaver/Byggherre", type: "text", span: 2 },
    { key: "section_foretak", label: "Ansvarlig foretak", type: "text", section: "heading" },
    { key: "ansvarlig_foretak", label: "Ansvarlig foretak", type: "text" },
    { key: "kontaktperson", label: "Kontaktperson", type: "text" },
    { key: "section_merknad", label: "Merknader", type: "text", section: "heading" },
    { key: "merknad", label: "Merknader", type: "textarea", span: 2 },
  ],
};

export default function Ks2ByggesakForm() {
  const { projectId, formId } = useParams<{ projectId: string; formId: string }>();
  const navigate = useNavigate();
  const { company, profile } = useAuth();
  const updateForm = useUpdateByggesakForm();
  const { projects } = useKsModule2Projects();
  const project = projects?.find(p => p.id === projectId);
  const { users } = useCompanyUsers();
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

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

  // Initialize form data from saved data or project info
  useEffect(() => {
    if (form?.form_data && Object.keys(form.form_data).length > 0) {
      setFormData(form.form_data as Record<string, string>);
    } else if (project && company) {
      // Auto-fill from project and company info
      setFormData({
        prosjekt_navn: project.project_name || "",
        eiendom_adresse: project.address || "",
        gnr: "",
        bnr: "",
        kommune: "",
        tiltakshaver: project.client_name || "",
        tiltakshaver_navn: project.client_name || "",
        ansvarlig_foretak: company?.name || "",
        kontaktperson: profile ? `${profile.first_name} ${profile.last_name}` : "",
        foretak_navn: company?.name || "",
        foretak_org_nr: company?.org_number || "",
        foretak_adresse: company?.address || "",
        foretak_postnr: company?.postal_code || "",
        foretak_poststed: company?.city || "",
        soker_foretak: company?.name || "",
        soker_org_nr: company?.org_number || "",
        soker_kontaktperson: profile ? `${profile.first_name} ${profile.last_name}` : "",
        soker_epost: profile?.email || company?.email || "",
      });
    }
  }, [form, project, company, profile]);

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

  const handleFieldChange = (key: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: String(value) }));
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

  const handleMarkAsSent = async () => {
    await updateForm.mutateAsync({
      id: form.id,
      status: "sent",
      sent_at: new Date().toISOString(),
    });
    toast.success("Blankett markert som sendt!");
  };

  // Generate HTML content for email
  const generateEmailHtml = () => {
    const fieldLabels = fields.reduce((acc, f) => {
      acc[f.key] = f.label;
      return acc;
    }, {} as Record<string, string>);

    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">${form.form_number} ${form.form_name}</h2>
        <p style="color: #666;">Prosjekt: ${project?.project_name || "Ukjent prosjekt"}</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
    `;

    let currentSection = "";
    for (const field of fields) {
      if (field.section === "heading") {
        currentSection = field.label;
        html += `<h3 style="color: #333; margin-top: 20px; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px;">${field.label}</h3>`;
        continue;
      }
      
      const value = formData[field.key];
      if (value) {
        html += `
          <p style="margin: 8px 0;">
            <strong style="color: #666;">${field.label}:</strong><br />
            <span style="color: #1a1a1a;">${value}</span>
          </p>
        `;
      }
    }

    html += `
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">
          Sendt fra ${company?.name || "HMS System"}<br />
          Dato: ${new Date().toLocaleDateString("nb-NO")}
        </p>
      </div>
    `;

    return html;
  };

  const emailUsers = users?.map(u => ({
    id: u.id,
    email: u.email || "",
    first_name: u.first_name || "",
    last_name: u.last_name || "",
  })).filter(u => u.email) || [];

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
          <Badge variant={form.status === "signed" || form.status === "sent" ? "default" : "secondary"}>
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
                  Last ned offisiell PDF
                </a>
              </Button>
            )}
            <label>
              <Button variant="outline" className="gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Last opp signert versjon
                </span>
              </Button>
              <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={handleUploadSigned} />
            </label>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={() => setShowEmailDialog(true)}
              disabled={form.status === "not_started"}
            >
              <Mail className="h-4 w-4" />
              Send på e-post
            </Button>
            {form.status === "signed" && (
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleMarkAsSent}
              >
                <Send className="h-4 w-4" />
                Marker som sendt
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Fyll ut blankett</CardTitle>
          <CardDescription>
            Feltene autofylles fra prosjekt- og bedriftsinformasjon. Gjør endringer der det er nødvendig.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(field => {
              // Section headings
              if (field.section === "heading") {
                return (
                  <div key={field.key} className="sm:col-span-2 mt-4 first:mt-0">
                    <h3 className="text-lg font-semibold border-b pb-2">{field.label}</h3>
                  </div>
                );
              }

              const containerClass = field.span === 2 ? "sm:col-span-2" : "";

              // Checkbox fields
              if (field.type === "checkbox") {
                return (
                  <div key={field.key} className={`flex items-center gap-2 ${containerClass}`}>
                    <Checkbox
                      id={field.key}
                      checked={formData[field.key] === "true"}
                      onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
                    />
                    <Label htmlFor={field.key}>{field.label}</Label>
                  </div>
                );
              }

              // Select fields
              if (field.type === "select" && field.options) {
                return (
                  <div key={field.key} className={containerClass}>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Select
                      value={formData[field.key] || ""}
                      onValueChange={(value) => handleFieldChange(field.key, value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Velg..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              // Textarea fields
              if (field.type === "textarea") {
                return (
                  <div key={field.key} className={containerClass}>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Textarea
                      id={field.key}
                      value={formData[field.key] || ""}
                      onChange={e => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="mt-1"
                    />
                  </div>
                );
              }

              // Input fields (text, email, date, number)
              return (
                <div key={field.key} className={containerClass}>
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    value={formData[field.key] || ""}
                    onChange={e => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="mt-1"
                  />
                </div>
              );
            })}
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

      {/* Sent info */}
      {form.sent_at && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-5 w-5 text-purple-600" />
              Blankett sendt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sendt {new Date(form.sent_at).toLocaleDateString("nb-NO")} kl. {new Date(form.sent_at).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
              {form.sent_to && ` til ${form.sent_to}`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Email Dialog */}
      <EmailSendDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        documentType="handbook"
        subject={`${form.form_number} ${form.form_name} - ${project?.project_name || "Prosjekt"}`}
        htmlContent={generateEmailHtml()}
        users={emailUsers}
        companyName={company?.name}
      />
    </div>
  );
}
