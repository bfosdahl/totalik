import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Download, 
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Target,
  Users,
  Shield,
  ClipboardList,
  FileCheck,
  AlertCircle,
  Search,
  Loader2,
  Zap,
  Building2,
  Settings,
  Minus,
  Image,
  Paperclip,
  Mail,
  Scale,
  ExternalLink,
  PenTool,
  UserCheck
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSetupWizard } from "@/hooks/useSetupWizard";
import { useDeviations } from "@/hooks/useDeviations";
import { useAudits } from "@/hooks/useAudits";
import { useAuditFormResponses, formTypeLabels, type FormType } from "@/hooks/useAuditFormResponses";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useCompanyLawsRegulations } from "@/hooks/useCompanyLawsRegulations";
import { useHmsDeclarations } from "@/hooks/useHmsDeclarations";
import { useVerneombudAgreement } from "@/hooks/useVerneombudAgreement";
import { useEmployees } from "@/hooks/useEmployees";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { EmailSendDialog } from "@/components/shared/EmailSendDialog";
import { HmsSelfDeclarationDialog } from "@/components/setup/HmsSelfDeclarationDialog";
import { VerneombudExemptionDialog } from "@/components/setup/VerneombudExemptionDialog";
import {
  sanitizeHandbookData,
  sanitizeRisks,
  sanitizeActions,
  sanitizeRoutines,
  sanitizeLaws,
  safeString,
  safeTruncate,
  getRiskLevelText,
  getRiskLevelColor,
  formatDateForPdf,
  loadImageAsBase64,
} from "@/utils/handbookPdfSanitizer";

const statusConfig = {
  complete: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    label: "Komplett",
  },
  incomplete: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    label: "Ufullstendig",
  },
  ongoing: {
    icon: Minus,
    color: "text-muted-foreground",
    bg: "bg-muted",
    label: "Løpende",
  },
};

interface DeviationAttachment {
  id: string;
  deviation_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
}

const Handbook = () => {
  const navigate = useNavigate();
  const { profile, isLoading: authLoading } = useAuth();
  const { 
    isLoading, 
    companyInfo, 
    goals, 
    organization, 
    riskAssessment, 
    actionPlan, 
    routines,
    progress,
    companyId
  } = useSetupWizard();
  const { deviations, isLoading: isLoadingDeviations } = useDeviations();
  const { audits, isLoading: isLoadingAudits } = useAudits();
  const { completedForms, isLoading: isLoadingForms, getLatestByFormType } = useAuditFormResponses();
  const { users: companyUsers } = useCompanyUsers();
  const { savedLaws } = useCompanyLawsRegulations();
  const { selfDeclaration, verneombudExemption, hasSelfDeclaration, hasVerneombudExemption } = useHmsDeclarations();
  const { verneombudAgreement, hasVerneombudAgreement } = useVerneombudAgreement();
  const { employees } = useEmployees();
  
  // For verneombud: Companies with 5+ employees MUST have a verneombud, they cannot use exemption agreement
  // Exemption agreement is ONLY for companies with fewer than 5 employees
  // Use company.employee_count from setup if available, otherwise fall back to profiles count
  const employeeCount = companyInfo?.employee_count ?? employees?.length ?? 0;
  const requiresVerneombud = employeeCount >= 5;
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [includeDeviations, setIncludeDeviations] = useState(false);
  const [deviationAttachments, setDeviationAttachments] = useState<DeviationAttachment[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showHmsDeclaration, setShowHmsDeclaration] = useState(false);
  const [showVerneombudExemption, setShowVerneombudExemption] = useState(false);
  
  // Optional sections for PDF export (6-11)
  const [includeDeviationsInPdf, setIncludeDeviationsInPdf] = useState(false);
  const [includeAuditsInPdf, setIncludeAuditsInPdf] = useState(false);
  const [includeAnnualHmsInPdf, setIncludeAnnualHmsInPdf] = useState(false);
  const [includeElkontrollInPdf, setIncludeElkontrollInPdf] = useState(false);
  const [includeFysiskeForholdInPdf, setIncludeFysiskeForholdInPdf] = useState(false);
  const [includeDagligDriftInPdf, setIncludeDagligDriftInPdf] = useState(false);

  // Fetch deviation attachments
  useEffect(() => {
    const fetchAttachments = async () => {
      if (!profile?.company_id || deviations.length === 0) return;
      
      const deviationIds = deviations.map(d => d.id);
      const { data, error } = await supabase
        .from("deviation_attachments")
        .select("id, deviation_id, file_name, file_path, file_type")
        .in("deviation_id", deviationIds);
      
      if (!error && data) {
        setDeviationAttachments(data);
        
        // Get signed URLs for images
        const urls: Record<string, string> = {};
        for (const att of data) {
          if (att.file_type?.startsWith("image/")) {
            const { data: signedData } = await supabase.storage
              .from("deviation-attachments")
              .createSignedUrl(att.file_path, 3600);
            if (signedData?.signedUrl) {
              urls[att.id] = signedData.signedUrl;
            }
          }
        }
        setAttachmentUrls(urls);
      }
    };
    
    fetchAttachments();
  }, [profile?.company_id, deviations]);

  // Count attachments per deviation
  const getDeviationAttachmentCount = (deviationId: string) => {
    return deviationAttachments.filter(a => a.deviation_id === deviationId).length;
  };

  // Get image attachments for a deviation
  const getDeviationImages = (deviationId: string) => {
    return deviationAttachments.filter(a => 
      a.deviation_id === deviationId && a.file_type?.startsWith("image/")
    );
  };

  // Avvik and other ongoing sections use "ongoing" status instead of complete/incomplete
  const openDeviationsCount = deviations.filter(d => d.status === "open" || d.status === "in-progress").length;

  // Audits - these are also ongoing activities
  const completedAuditsCount = audits.filter(a => a.status === "completed").length;
  const pendingAuditsCount = audits.filter(a => a.status === "scheduled" || a.status === "in-progress").length;

  // Form type icons
  const formTypeIcons: Record<FormType, typeof FileCheck> = {
    annual_hms: ClipboardList,
    elkontroll: Zap,
    fysiske_forhold: Building2,
    daglig_drift: Settings,
    vernerunde: Shield,
  };

  // Laws are now fetched from database via useCompanyLawsRegulations hook


  // Base section number offset:
  // 1) Egenerklæring om HMS
  // 2) Avtale om fritak fra verneombud
  // Then: goals starts at 3.
  const sectionOffset = 2;

  // Generate sections for completed audit forms - status based on completion
  // These come after: Egenerklæring(1), [Verneombud(2)], Mål, Org, Risk, Actions, Routines, Laws, Deviations, Audits = offset+9
  const auditFormSections = (["annual_hms", "elkontroll", "fysiske_forhold", "daglig_drift"] as FormType[])
    .map((formType, index) => {
      const latestForm = getLatestByFormType(formType);
      const Icon = formTypeIcons[formType];
      
      // Render form data content properly
      const renderFormContent = () => {
        if (!latestForm) {
          return (
            <p className="text-sm text-muted-foreground">
              Ingen {formTypeLabels[formType].toLowerCase()} er gjennomført ennå. Gå til Revisjoner for å fylle ut skjemaet.
            </p>
          );
        }

        const formData = latestForm.form_data as Record<string, unknown>;
        
        return (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">
                  Sist fullført: {latestForm.completed_at ? format(new Date(latestForm.completed_at), "d. MMMM yyyy", { locale: nb }) : "Ukjent"}
                </p>
                {latestForm.auditor_name && <p className="text-muted-foreground">Revisor: {latestForm.auditor_name}</p>}
                {latestForm.participants && <p className="text-muted-foreground">Deltakere: {latestForm.participants}</p>}
              </div>
              {(formData.auditorSignature || formData.managerSignature) && (
                <div className="text-muted-foreground">
                  {formData.auditorSignature && <p>Revisor signert: {String(formData.auditorSignature)}</p>}
                  {formData.managerSignature && <p>Leder signert: {String(formData.managerSignature)}</p>}
                </div>
              )}
            </div>
            
            {/* Render checklist answers if available */}
            {formData.checklistAnswers && typeof formData.checklistAnswers === 'object' && (
              <div className="space-y-3 pt-3 border-t border-border">
                <p className="font-medium text-foreground">Resultater fra kartlegging:</p>
                {Object.entries(formData.checklistAnswers as Record<string, Record<string, { answer?: string; comment?: string }>>).map(([sectionKey, questions]) => {
                  if (!questions || typeof questions !== 'object' || Object.keys(questions).length === 0) return null;
                  
                  // Get section label from sectionQuestions if available
                  const sectionLabels: Record<string, string> = {
                    // Daglig drift
                    informasjon: "Informasjon og kommunikasjon",
                    samarbeid: "Samarbeid og beslutninger",
                    produktivitet: "Produktivitet",
                    arbeidsavtaler: "Arbeidsavtaler",
                    arbeidstid: "Arbeidstid",
                    hms: "HMS-arbeid",
                    kompetanse: "Kompetanse",
                    registrering: "Registrering og oppfølging",
                    vernetjeneste: "Vernetjeneste",
                    forsikringer: "Forsikringer",
                    // Fysiske arbeidsforhold
                    arbeidslokaler: "Arbeidslokaler",
                    elektrisk: "Elektriske anlegg",
                    inneklima: "Inneklima",
                    romningsveier: "Rømningsveier",
                    brannsikkerhet: "Brannsikkerhet",
                    brannfarlig: "Brann- og eksplosjonsfarlige varer",
                    varehandtering: "Varehåndtering",
                    orden: "Orden og renhold",
                    avfall: "Avfallshåndtering",
                    dataskjerm: "Dataskjermarbeid",
                    asbest: "Asbestarbeid",
                    eksterne: "Eksterne arbeidsforhold",
                    ergonomi: "Ergonomi",
                    verneutstyr: "Verneutstyr",
                    stoy: "Støy",
                    arbeidsutstyr: "Arbeidsutstyr",
                    hoyden: "Høydearbeid",
                    kjemisk: "Kjemiske stoffer",
                    forstehjelp: "Førstehjelp",
                    sikring: "Lastsikring",
                    lasting: "Lasting/lossing",
                    graving: "Gravearbeider",
                    sprengning: "Sprengning",
                    adr: "ADR-transport",
                    adr_uhell: "ADR-uhell",
                    ergonomi_kjoretoy: "Ergonomi kjøretøy",
                    hviletid: "Kjøre- og hviletid",
                    annet: "Annet",
                  };
                  
                  const yesCount = Object.values(questions).filter(q => q?.answer === 'yes').length;
                  const noCount = Object.values(questions).filter(q => q?.answer === 'no').length;
                  const total = Object.keys(questions).length;
                  
                  if (total === 0) return null;
                  
                  return (
                    <div key={sectionKey} className="bg-background/50 rounded-lg p-3 border border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{sectionLabels[sectionKey] || sectionKey}</span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-success">{yesCount} ja</span>
                          {noCount > 0 && <span className="text-warning">{noCount} nei</span>}
                          <span className="text-muted-foreground">({total} spørsmål)</span>
                        </div>
                      </div>
                      {/* Show questions with "no" answers or comments */}
                      {Object.entries(questions).map(([qKey, qData]) => {
                        if (qData?.answer === 'no' || (qData?.comment && qData.comment.trim())) {
                          // Try to find the question text from sectionQuestions
                          const sectionQuestions = formData.sectionQuestions as Record<string, Array<{ id: string; question: string }>> | undefined;
                          const questionList = sectionQuestions?.[sectionKey];
                          const questionObj = questionList?.find(q => q.id === qKey);
                          const questionText = questionObj?.question || qKey;
                          
                          return (
                            <div key={qKey} className="mt-2 text-xs text-muted-foreground border-l-2 border-warning/50 pl-2">
                              <p className="font-medium">{questionText}</p>
                              <p>Svar: <span className={qData.answer === 'no' ? 'text-warning' : 'text-success'}>{qData.answer === 'yes' ? 'Ja' : 'Nei'}</span></p>
                              {qData.comment && <p>Kommentar: {qData.comment}</p>}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  );
                })}
              </div>
            )}
            
            {formData.otherComments && (
              <div className="pt-3 border-t border-border">
                <p className="font-medium text-foreground">Andre kommentarer:</p>
                <p className="text-muted-foreground">{String(formData.otherComments)}</p>
              </div>
            )}
          </div>
        );
      };

      return {
        id: `audit_form_${formType}`,
        title: `${sectionOffset + 9 + index}. ${formTypeLabels[formType]}`,
        status: latestForm ? ("complete" as const) : ("incomplete" as const),
        stepIndex: -1,
        icon: Icon,
        content: renderFormContent(),
        summary: latestForm 
          ? `Fullført ${latestForm.completed_at ? format(new Date(latestForm.completed_at), "d. MMM yyyy", { locale: nb }) : ""}`
          : "Ikke utført",
        linkTo: "/audits",
      };
    });

  
  // Calculate section status based on actual data
  const handbookSections = [
    // 1. Egenerklæring om HMS
    {
      id: "self-declaration",
      title: "1. Egenerklæring om HMS",
      status: hasSelfDeclaration ? "complete" as const : "incomplete" as const,
      stepIndex: -1,
      icon: PenTool,
      content: hasSelfDeclaration && selfDeclaration ? (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            Virksomheten bekrefter at det arbeides systematisk med HMS i henhold til Internkontrollforskriften.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="font-medium text-xs text-muted-foreground">Daglig leder</p>
              <p className="text-foreground">{selfDeclaration.manager_name}</p>
              {selfDeclaration.manager_signed_at && (
                <p className="text-xs">Signert: {format(new Date(selfDeclaration.manager_signed_at), "d. MMM yyyy", { locale: nb })}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-medium text-xs text-muted-foreground">Representant for ansatte</p>
              <p className="text-foreground">{selfDeclaration.employee_rep_name}</p>
              {selfDeclaration.employee_rep_signed_at && (
                <p className="text-xs">Signert: {format(new Date(selfDeclaration.employee_rep_signed_at), "d. MMM yyyy", { locale: nb })}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Egenerklæring om HMS er ikke signert. Gå til Oppsett for å signere.
        </p>
      ),
      summary: hasSelfDeclaration ? "Signert og gyldig" : "Ikke signert",
      linkTo: "/setup",
    },
    // 2. Verneombud section - different display based on employee count
    // Companies with 5+ employees MUST have verneombud (elected), exemption only for <5 employees
    ...(requiresVerneombud ? [
      {
        id: "verneombud-selected",
        title: "2. Valg av verneombud",
        status: (() => {
          const verneombudRole = organization?.roles?.find(r => 
            r.title?.toLowerCase().includes("verneombud")
          );
          return verneombudRole?.personName ? "complete" as const : "incomplete" as const;
        })(),
        stepIndex: -1,
        icon: UserCheck,
        content: (() => {
          const verneombudRole = organization?.roles?.find(r => 
            r.title?.toLowerCase().includes("verneombud")
          );
          if (verneombudRole?.personName) {
            // Calculate election date and expiry (2 years from election)
            const electionDate = verneombudRole.electionDate ? new Date(verneombudRole.electionDate) : null;
            const expiryDate = electionDate ? new Date(electionDate.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)) : null;
            
            return (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Valgt verneombud iht. arbeidsmiljøloven § 6-1.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="space-y-1">
                    <p className="font-medium text-xs text-muted-foreground">Verneombud</p>
                    <p className="text-foreground">{verneombudRole.personName}</p>
                  </div>
                  {verneombudRole.electedBy && (
                    <div className="space-y-1">
                      <p className="font-medium text-xs text-muted-foreground">Valgt av</p>
                      <p className="text-foreground">{verneombudRole.electedBy}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {employeeCount} ansatte
                    </Badge>
                    {electionDate && (
                      <span className="text-xs">
                        Valgt: {format(electionDate, "d. MMM yyyy", { locale: nb })}
                      </span>
                    )}
                    {expiryDate && (
                      <span className="text-xs text-muted-foreground">
                        • Valgperiode utløper: {format(expiryDate, "d. MMM yyyy", { locale: nb })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Valgperioden er 2 år fra valgdato.
                  </p>
                </div>
              </div>
            );
          }
          return (
            <p className="text-sm text-muted-foreground">
              Virksomheter med 5 eller flere ansatte skal ha verneombud. Gå til Organisering for å registrere valgt verneombud.
            </p>
          );
        })(),
        summary: (() => {
          const verneombudRole = organization?.roles?.find(r => 
            r.title?.toLowerCase().includes("verneombud")
          );
          return verneombudRole?.personName 
            ? `${verneombudRole.personName} valgt` 
            : "Ikke registrert";
        })(),
        linkTo: "/audits",
      }
    ] : [
      // Companies with less than 5 employees can have exemption agreement
      {
        id: "verneombud-exemption",
        title: "2. Avtale om fritak fra verneombud",
        status: hasVerneombudExemption ? ("complete" as const) : ("incomplete" as const),
        stepIndex: -1,
        icon: UserCheck,
        content: hasVerneombudExemption && verneombudExemption ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              Avtale om fritak fra kravet om verneombud iht. arbeidsmiljøloven § 6-1.
            </p>
            <p className="text-xs text-muted-foreground">
              Gjelder kun for virksomheter med færre enn 5 ansatte.
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {verneombudExemption.total_employees || 0} ansatte
                </Badge>
                {verneombudExemption.agreement_date && (
                  <span className="text-xs">
                    Inngått: {format(new Date(verneombudExemption.agreement_date), "d. MMM yyyy", { locale: nb })}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-medium text-xs text-muted-foreground">Arbeidsgiver</p>
                <p className="text-foreground">{verneombudExemption.employer_name}</p>
              </div>
              {verneombudExemption.employee_signatures && verneombudExemption.employee_signatures.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-xs text-muted-foreground">Ansatte som har signert</p>
                  <p className="text-foreground">
                    {verneombudExemption.employee_signatures.map((e) => e.name).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Avtale om fritak fra verneombud er ikke signert. Gå til Oppsett for å signere. Dette gjelder kun for virksomheter med færre enn 5 ansatte.
          </p>
        ),
        summary: hasVerneombudExemption
          ? `Signert av ${verneombudExemption?.employee_signatures?.length || 0} ansatte`
          : "Ikke signert",
        linkTo: "/setup",
      }
    ]),
    // Goals
    {
      id: "goals",
      title: `${sectionOffset + 1}. Mål for internkontroll`,
      status: goals.length > 0 ? "complete" : "incomplete",
      stepIndex: 0,
      icon: Target,
      content: goals.length > 0 ? (
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          {goals.map((goal) => (
            <li key={goal.id}>{goal.goal_text}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Ingen mål er definert ennå.</p>
      ),
      summary: `${goals.length} mål definert`,
    },
    // Organization
    {
      id: "organization",
      title: `${sectionOffset + 2}. Organisering og ansvar`,
      status: ((organization?.roles?.length ?? 0) > 0 || (organization?.description && organization.description.trim().length > 0)) ? "complete" : "incomplete",
      stepIndex: 1,
      icon: Users,
      content: ((organization?.roles?.length ?? 0) > 0 || (organization?.description && organization.description.trim().length > 0)) ? (
        <div className="text-sm text-muted-foreground space-y-1 max-h-48 overflow-y-auto">
          {(organization?.roles?.length ?? 0) > 0 ? (
            <>
              {organization?.roles?.slice(0, 5).map((role, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-medium">{role.title}</span>
                  {role.personName && <span className="text-xs">({role.personName})</span>}
                </div>
              ))}
              {(organization?.roles?.length ?? 0) > 5 && (
                <p className="text-xs">+ {(organization?.roles?.length ?? 0) - 5} flere roller</p>
              )}
            </>
          ) : organization?.description ? (
            <div className="whitespace-pre-wrap">{organization.description.slice(0, 500)}{organization.description.length > 500 ? "..." : ""}</div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Organisering er ikke definert ennå.</p>
      ),
      summary: (organization?.roles?.length ?? 0) > 0 
        ? `${organization?.roles?.length} roller definert` 
        : (organization?.description && organization.description.trim().length > 0)
          ? "Organisering definert"
          : "Ikke definert",
    },
    // Risk assessment
    {
      id: "risk",
      title: `${sectionOffset + 3}. Risikovurderinger`,
      status: (riskAssessment?.risks?.length ?? 0) > 0 ? "complete" : "incomplete",
      stepIndex: 2,
      icon: Shield,
      content: (riskAssessment?.risks?.length ?? 0) > 0 ? (
        <div className="space-y-2">
          {riskAssessment?.risks.slice(0, 5).map((risk) => (
            <div key={risk.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate flex-1">{risk.description}</span>
              <Badge variant="outline" className={cn(
                "ml-2",
                risk.consequence * risk.probability >= 15 ? "border-destructive text-destructive" :
                risk.consequence * risk.probability >= 8 ? "border-warning text-warning" :
                "border-success text-success"
              )}>
                Risiko: {risk.consequence * risk.probability}
              </Badge>
            </div>
          ))}
          {(riskAssessment?.risks?.length ?? 0) > 5 && (
            <p className="text-xs text-muted-foreground">+ {(riskAssessment?.risks?.length ?? 0) - 5} flere risikoer</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ingen risikovurderinger er utført ennå.</p>
      ),
      summary: `${riskAssessment?.risks?.length ?? 0} risikoer identifisert`,
    },
    // Action plan (position 6)
    {
      id: "actions",
      title: `${sectionOffset + 4}. Handlingsplan`,
      status: (actionPlan?.actions?.length ?? 0) > 0 ? "complete" : "incomplete",
      stepIndex: 3,
      icon: ClipboardList,
      content: (actionPlan?.actions?.length ?? 0) > 0 ? (
        <div className="space-y-2">
          {actionPlan?.actions.slice(0, 5).map((action) => (
            <div key={action.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate flex-1">{action.action_description}</span>
              <Badge variant="outline" className={cn(
                "ml-2",
                action.status === "fullført" ? "border-success text-success" :
                action.status === "pågår" ? "border-warning text-warning" :
                "border-muted-foreground text-muted-foreground"
              )}>
                {action.status === "fullført" ? "Fullført" : action.status === "pågår" ? "Pågår" : "Ikke startet"}
              </Badge>
            </div>
          ))}
          {(actionPlan?.actions?.length ?? 0) > 5 && (
            <p className="text-xs text-muted-foreground">+ {(actionPlan?.actions?.length ?? 0) - 5} flere tiltak</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ingen handlingsplan er opprettet ennå.</p>
      ),
      summary: `${actionPlan?.actions?.length ?? 0} tiltak`,
    },
    // Laws (position 7 - after Handlingsplan)
    {
      id: "laws",
      title: `${sectionOffset + 5}. Lover og forskrifter`,
      status: savedLaws.length > 0 ? "complete" as const : "incomplete" as const,
      stepIndex: -1,
      icon: Scale,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-3">
            {savedLaws.length > 0 
              ? "Oversikt over lover og forskrifter som gjelder for virksomheten."
              : "Ingen lover er lagret. Gå til Lover og forskrifter for å søke opp og lagre gjeldende krav."
            }
          </p>
          {savedLaws.length > 0 && (
            <div className="space-y-2">
              {savedLaws.slice(0, 4).map((law) => (
                <div key={law.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{law.category || "Generelt"}</Badge>
                    <span className="text-muted-foreground">{law.law_name}</span>
                  </div>
                  {law.link && (
                    <a 
                      href={law.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
              {savedLaws.length > 4 && (
                <p className="text-xs text-muted-foreground">+ {savedLaws.length - 4} flere lover og forskrifter</p>
              )}
            </div>
          )}
        </div>
      ),
      summary: savedLaws.length > 0 ? `${savedLaws.length} lover og forskrifter` : "Ingen lagret",
      linkTo: "/lover-og-forskrifter",
    },
    // Routines (position 8)
    {
      id: "routines",
      title: `${sectionOffset + 6}. Rutiner og prosedyrer`,
      status: (routines?.routines?.length ?? 0) > 0 ? "complete" : "incomplete",
      stepIndex: 4,
      icon: FileCheck,
      content: (routines?.routines?.length ?? 0) > 0 ? (
        <div className="space-y-4">
          {routines?.routines.map((routine, index) => (
            <div key={routine.id} className="bg-background/50 rounded-lg p-4 border border-border/50">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">{sectionOffset + 6}.{index + 1}</span>
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{routine.routine_number}:</span>
                      <span className="font-medium">{routine.routine_name}</span>
                      {routine.category && (
                        <Badge variant="secondary" className="text-xs">{routine.category}</Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Purpose */}
                  {routine.purpose && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Formål:</p>
                      <p className="text-sm text-muted-foreground">{routine.purpose}</p>
                    </div>
                  )}
                  
                  {/* Responsibility */}
                  {routine.responsibility && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Ansvar:</p>
                      <p className="text-sm text-muted-foreground">{routine.responsibility}</p>
                    </div>
                  )}
                  
                  {/* Procedure */}
                  {routine.procedure && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Fremgangsmåte:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{routine.procedure}</p>
                    </div>
                  )}
                  
                  {/* Examples */}
                  {routine.examples && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Eksempler:</p>
                      <p className="text-sm text-muted-foreground">{routine.examples}</p>
                    </div>
                  )}
                  
                  {/* Remember */}
                  {routine.remember && (
                    <div className="bg-warning/10 border border-warning/20 rounded p-2">
                      <p className="text-xs font-medium text-warning mb-1">Husk:</p>
                      <p className="text-sm text-muted-foreground">{routine.remember}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ingen rutiner er lagt til ennå.</p>
      ),
      summary: `${routines?.routines?.length ?? 0} rutiner`,
    },
    // Deviations
    {
      id: "deviations",
      title: `${sectionOffset + 7}. Avviksbehandling`,
      status: "ongoing" as const, // Deviations are ongoing - new ones are added over time
      stepIndex: -1,
      icon: AlertCircle,
      isOptional: true, // Mark as optional for handbook export
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {openDeviationsCount > 0 
              ? `${openDeviationsCount} åpne avvik, ${deviations.length - openDeviationsCount} lukkede.`
              : deviations.length > 0 
                ? `Alle ${deviations.length} avvik er lukket.`
                : "Ingen avvik er registrert."
            }
          </p>
          {includeDeviations && deviations.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              {deviations.slice(0, 5).map((deviation) => {
                const images = getDeviationImages(deviation.id);
                return (
                  <div key={deviation.id} className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground truncate flex-1">{deviation.title}</span>
                      <div className="flex items-center gap-2">
                        {getDeviationAttachmentCount(deviation.id) > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Paperclip className="w-3 h-3" />
                            {getDeviationAttachmentCount(deviation.id)}
                          </span>
                        )}
                        <Badge variant="outline" className={cn(
                          deviation.status === "closed" ? "border-success text-success" :
                          deviation.status === "in-progress" ? "border-info text-info" :
                          "border-muted-foreground text-muted-foreground"
                        )}>
                          {deviation.status === "closed" ? "Lukket" : deviation.status === "in-progress" ? "Pågår" : "Åpen"}
                        </Badge>
                      </div>
                    </div>
                    {images.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {images.slice(0, 3).map((img) => (
                          <div key={img.id} className="relative">
                            {attachmentUrls[img.id] ? (
                              <img 
                                src={attachmentUrls[img.id]} 
                                alt={img.file_name}
                                className="w-16 h-16 object-cover rounded border border-border"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded border border-border flex items-center justify-center">
                                <Image className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ))}
                        {images.length > 3 && (
                          <div className="w-16 h-16 bg-muted rounded border border-border flex items-center justify-center text-xs text-muted-foreground">
                            +{images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {deviations.length > 5 && (
                <p className="text-xs text-muted-foreground">+ {deviations.length - 5} flere avvik</p>
              )}
            </div>
          )}
        </div>
      ),
      summary: `${deviations.length} avvik totalt`,
      linkTo: "/deviations",
    },
    // Audits
    {
      id: "audits",
      title: `${sectionOffset + 8}. Revisjoner og evaluering`,
      status: "ongoing" as const, // Audits are ongoing - new ones are scheduled over time
      stepIndex: -1,
      icon: Search,
      content: (
        <p className="text-sm text-muted-foreground">
          {pendingAuditsCount > 0 
            ? `${pendingAuditsCount} planlagte/pågående revisjoner som må gjennomføres.`
            : completedAuditsCount > 0 
              ? `${completedAuditsCount} revisjoner er gjennomført.`
              : "Ingen revisjoner er planlagt. Gå til Revisjoner for å opprette revisjoner."
          }
        </p>
      ),
      summary: pendingAuditsCount > 0 ? `${pendingAuditsCount} ventende revisjoner` : completedAuditsCount > 0 ? `${completedAuditsCount} gjennomført` : "Ingen revisjoner",
      linkTo: "/audits",
    },
    // Add dynamic audit form sections
    ...auditFormSections,
  ];

  const completeSections = handbookSections.filter((s) => s.status === "complete").length;
  const lastUpdated = new Date();

  // PDF Generation - now uses sanitized data from handbookPdfSanitizer

  const handleDownloadPdf = useCallback(async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      // Load logo
      let logoBase64: string | null = null;
      if (companyInfo?.logo_url) {
        logoBase64 = await loadImageAsBase64(companyInfo.logo_url);
      }

      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      const addSectionHeader = (title: string) => {
        checkPageBreak(20);
        doc.setFillColor(59, 130, 246);
        doc.rect(margin, yPos, contentWidth, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin + 5, yPos + 7);
        doc.setTextColor(0, 0, 0);
        yPos += 15;
      };

      // Table of contents (rendered after content is generated so page numbers are correct)
      type TocEntry = { title: string; page: number };
      const tocEntries: TocEntry[] = [];
      let tocPageNumber = 0;

      const addTocEntry = (title: string) => {
        tocEntries.push({ title, page: doc.getNumberOfPages() });
      };

      const renderToc = () => {
        if (!tocPageNumber) return;

        doc.setPage(tocPageNumber);

        // Clear content area (keep heading)
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, margin + 15, contentWidth, pageHeight - (margin + 15) - margin, "F");

        let tocY = margin + 20;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");

        tocEntries.forEach((item) => {
          if (tocY > pageHeight - margin - 10) return;
          doc.text(item.title, margin, tocY);
          doc.text(String(item.page), pageWidth - margin, tocY, { align: "right" });

          // Make the whole row clickable
          doc.link(margin, tocY - 5, contentWidth, 7, { pageNumber: item.page });

          tocY += 8;
        });
      };

      // COVER PAGE
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 80, "F");

      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", pageWidth / 2 - 15, 85, 30, 30);
        } catch (e) {
          console.warn("Could not add logo to PDF:", e);
        }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("INTERNKONTROLL", pageWidth / 2, 35, { align: "center" });
      doc.setFontSize(20);
      doc.text("HMS-HÅNDBOK", pageWidth / 2, 50, { align: "center" });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      const companyName = companyInfo?.name || "Bedriftsnavn";
      const nameY = logoBase64 ? 130 : 110;
      doc.text(companyName, pageWidth / 2, nameY, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      let detailsY = logoBase64 ? 145 : 125;
      if (companyInfo?.org_number) {
        doc.text(`Org.nr: ${companyInfo.org_number}`, pageWidth / 2, detailsY, { align: "center" });
        detailsY += 7;
      }
      if (companyInfo?.address) {
        doc.text(companyInfo.address, pageWidth / 2, detailsY, { align: "center" });
        detailsY += 7;
      }
      if (companyInfo?.postal_code && companyInfo?.city) {
        doc.text(`${companyInfo.postal_code} ${companyInfo.city}`, pageWidth / 2, detailsY, { align: "center" });
      }

      doc.setFontSize(12);
      doc.text(`Dato: ${formatDateForPdf(new Date())}`, pageWidth / 2, pageHeight - 40, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Utarbeidet i henhold til forskrift om systematisk helse-, miljø- og sikkerhetsarbeid", pageWidth / 2, pageHeight - 25, { align: "center" });

      // TABLE OF CONTENTS (filled in at the end so page numbers and links are correct)
      doc.addPage();
      tocPageNumber = doc.getNumberOfPages();
      yPos = margin;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Innholdsfortegnelse", margin, yPos);
      yPos += 15;
      // (entries are rendered later by renderToc())

      // Track section number dynamically
      let sectionNumber = 0;

      // SECTION: HMS EGENERKLÆRING
      if (hasSelfDeclaration && selfDeclaration) {
        doc.addPage();
        sectionNumber++;
        addTocEntry(`${sectionNumber}. Egenerklæring om HMS`);
        yPos = margin;
        addSectionHeader(`${sectionNumber}. Egenerklæring om HMS`);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Virksomheten erklærer at det er etablert systematisk HMS-arbeid.", margin, yPos);
        yPos += 12;
        
        // Company info
        doc.setFont("helvetica", "bold");
        doc.text("Bedrift:", margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(selfDeclaration.company_name || companyName, margin + 25, yPos);
        yPos += 7;
        
        if (selfDeclaration.company_address) {
          doc.setFont("helvetica", "bold");
          doc.text("Adresse:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(selfDeclaration.company_address, margin + 25, yPos);
          yPos += 7;
        }
        
        if (selfDeclaration.postal_code && selfDeclaration.city) {
          doc.text(`${selfDeclaration.postal_code} ${selfDeclaration.city}`, margin + 25, yPos);
          yPos += 7;
        }
        
        yPos += 10;
        
        // Manager signature
        if (selfDeclaration.manager_name || selfDeclaration.manager_signature) {
          checkPageBreak(50);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(margin, yPos, contentWidth, 40, 2, 2, "F");
          
          doc.setFont("helvetica", "bold");
          doc.text("Daglig leder:", margin + 5, yPos + 8);
          doc.setFont("helvetica", "normal");
          if (selfDeclaration.manager_name) {
            doc.text(selfDeclaration.manager_name, margin + 35, yPos + 8);
          }
          
          if (selfDeclaration.manager_signature) {
            try {
              doc.addImage(selfDeclaration.manager_signature, "PNG", margin + 5, yPos + 12, 50, 20);
            } catch (e) {
              console.warn("Could not add manager signature:", e);
            }
          }
          
          if (selfDeclaration.manager_signed_at) {
            doc.setFontSize(9);
            doc.text(`Signert: ${formatDateForPdf(new Date(selfDeclaration.manager_signed_at))}`, margin + 5, yPos + 36);
            doc.setFontSize(11);
          }
          
          yPos += 45;
        }
        
        // Employee representative signature
        if (selfDeclaration.employee_rep_name || selfDeclaration.employee_rep_signature) {
          checkPageBreak(50);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(margin, yPos, contentWidth, 40, 2, 2, "F");
          
          doc.setFont("helvetica", "bold");
          doc.text("Ansattrepresentant:", margin + 5, yPos + 8);
          doc.setFont("helvetica", "normal");
          if (selfDeclaration.employee_rep_name) {
            doc.text(selfDeclaration.employee_rep_name, margin + 50, yPos + 8);
          }
          
          if (selfDeclaration.employee_rep_signature) {
            try {
              doc.addImage(selfDeclaration.employee_rep_signature, "PNG", margin + 5, yPos + 12, 50, 20);
            } catch (e) {
              console.warn("Could not add employee rep signature:", e);
            }
          }
          
          if (selfDeclaration.employee_rep_signed_at) {
            doc.setFontSize(9);
            doc.text(`Signert: ${formatDateForPdf(new Date(selfDeclaration.employee_rep_signed_at))}`, margin + 5, yPos + 36);
            doc.setFontSize(11);
          }
          
          yPos += 45;
        }
      }

      // SECTION: VERNEOMBUD FRITAK
      if (hasVerneombudExemption && verneombudExemption && !requiresVerneombud) {
        doc.addPage();
        sectionNumber++;
        addTocEntry(`${sectionNumber}. Avtale om fritak fra verneombud`);
        yPos = margin;
        addSectionHeader(`${sectionNumber}. Avtale om fritak fra verneombud`);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Virksomheten har inngått avtale om fritak fra kravet om verneombud.", margin, yPos);
        yPos += 12;
        
        // Agreement info
        if (verneombudExemption.total_employees) {
          doc.setFont("helvetica", "bold");
          doc.text("Antall ansatte:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(String(verneombudExemption.total_employees), margin + 40, yPos);
          yPos += 7;
        }
        
        if (verneombudExemption.agreement_date) {
          doc.setFont("helvetica", "bold");
          doc.text("Avtaledato:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(formatDateForPdf(new Date(verneombudExemption.agreement_date)), margin + 40, yPos);
          yPos += 7;
        }
        
        if (verneombudExemption.valid_until) {
          doc.setFont("helvetica", "bold");
          doc.text("Gyldig til:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(formatDateForPdf(new Date(verneombudExemption.valid_until)), margin + 40, yPos);
          yPos += 7;
        }
        
        yPos += 10;
        
        // Employer signature
        if (verneombudExemption.employer_name || verneombudExemption.employer_signature) {
          checkPageBreak(50);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(margin, yPos, contentWidth, 40, 2, 2, "F");
          
          doc.setFont("helvetica", "bold");
          doc.text("Arbeidsgiver:", margin + 5, yPos + 8);
          doc.setFont("helvetica", "normal");
          if (verneombudExemption.employer_name) {
            doc.text(verneombudExemption.employer_name, margin + 35, yPos + 8);
          }
          
          if (verneombudExemption.employer_signature) {
            try {
              doc.addImage(verneombudExemption.employer_signature, "PNG", margin + 5, yPos + 12, 50, 20);
            } catch (e) {
              console.warn("Could not add employer signature:", e);
            }
          }
          
          if (verneombudExemption.employer_signed_at) {
            doc.setFontSize(9);
            doc.text(`Signert: ${formatDateForPdf(new Date(verneombudExemption.employer_signed_at))}`, margin + 5, yPos + 36);
            doc.setFontSize(11);
          }
          
          yPos += 45;
        }
        
        // Employee signatures
        if (verneombudExemption.employee_signatures && verneombudExemption.employee_signatures.length > 0) {
          checkPageBreak(20);
          doc.setFont("helvetica", "bold");
          doc.text("Ansatte som har signert avtalen:", margin, yPos);
          yPos += 10;
          
          verneombudExemption.employee_signatures.forEach((emp, index) => {
            checkPageBreak(45);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(margin, yPos, contentWidth / 2 - 5, 35, 2, 2, "F");
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`${index + 1}. ${emp.name}`, margin + 5, yPos + 8);
            
            if (emp.signature) {
              try {
                doc.addImage(emp.signature, "PNG", margin + 5, yPos + 12, 40, 18);
              } catch (e) {
                console.warn("Could not add employee signature:", e);
              }
            }
            
            if (emp.signed_at) {
              doc.setFontSize(8);
              doc.text(`Signert: ${formatDateForPdf(new Date(emp.signed_at))}`, margin + 5, yPos + 32);
            }
            
            doc.setFontSize(11);
            yPos += 40;
          });
        }
      }

      // SECTION: VALG AV VERNEOMBUD (for companies with 5+ employees)
      if (hasVerneombudAgreement && verneombudAgreement && requiresVerneombud) {
        doc.addPage();
        sectionNumber++;
        addTocEntry(`${sectionNumber}. Valg av verneombud`);
        yPos = margin;
        addSectionHeader(`${sectionNumber}. Valg av verneombud`);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Virksomheten har valgt verneombud i henhold til arbeidsmiljøloven.", margin, yPos);
        yPos += 12;
        
        // Verneombud info
        doc.setFont("helvetica", "bold");
        doc.text("Verneombud:", margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(verneombudAgreement.verneombud_name, margin + 35, yPos);
        yPos += 7;
        
        if (verneombudAgreement.verneombud_email) {
          doc.setFont("helvetica", "bold");
          doc.text("E-post:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(verneombudAgreement.verneombud_email, margin + 35, yPos);
          yPos += 7;
        }
        
        if (verneombudAgreement.verneombud_phone) {
          doc.setFont("helvetica", "bold");
          doc.text("Telefon:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(verneombudAgreement.verneombud_phone, margin + 35, yPos);
          yPos += 7;
        }
        
        if (verneombudAgreement.election_method) {
          doc.setFont("helvetica", "bold");
          doc.text("Valgmetode:", margin, yPos);
          doc.setFont("helvetica", "normal");
          const methodText = verneombudAgreement.election_method === "election" ? "Valg blant ansatte" :
                            verneombudAgreement.election_method === "appointment" ? "Utpekt av arbeidsgiver" :
                            verneombudAgreement.election_method === "volunteer" ? "Frivillig" : 
                            verneombudAgreement.election_method;
          doc.text(methodText, margin + 35, yPos);
          yPos += 7;
        }
        
        if (verneombudAgreement.term_start) {
          doc.setFont("helvetica", "bold");
          doc.text("Periode fra:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(formatDateForPdf(new Date(verneombudAgreement.term_start)), margin + 35, yPos);
          yPos += 7;
        }
        
        if (verneombudAgreement.term_end) {
          doc.setFont("helvetica", "bold");
          doc.text("Periode til:", margin, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(formatDateForPdf(new Date(verneombudAgreement.term_end)), margin + 35, yPos);
          yPos += 7;
        }
        
        if (verneombudAgreement.training_completed) {
          yPos += 5;
          doc.setFillColor(220, 252, 231);
          doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, "F");
          doc.setFont("helvetica", "bold");
          doc.setTextColor(22, 101, 52);
          doc.text("✓ Verneombudet har gjennomført påkrevd opplæring (40 timer)", margin + 5, yPos + 8);
          doc.setTextColor(0, 0, 0);
          yPos += 17;
          
          if (verneombudAgreement.training_date) {
            doc.setFont("helvetica", "normal");
            doc.text(`Opplæring gjennomført: ${formatDateForPdf(new Date(verneombudAgreement.training_date))}`, margin, yPos);
            yPos += 10;
          }
        }
        
        yPos += 5;
        
        // Verneombud signature
        if (verneombudAgreement.verneombud_signature) {
          checkPageBreak(50);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(margin, yPos, contentWidth, 40, 2, 2, "F");
          
          doc.setFont("helvetica", "bold");
          doc.text("Verneombudets signatur:", margin + 5, yPos + 8);
          
          try {
            doc.addImage(verneombudAgreement.verneombud_signature, "PNG", margin + 5, yPos + 12, 50, 20);
          } catch (e) {
            console.warn("Could not add verneombud signature:", e);
          }
          
          if (verneombudAgreement.verneombud_signed_at) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`Signert: ${formatDateForPdf(new Date(verneombudAgreement.verneombud_signed_at))}`, margin + 5, yPos + 36);
            doc.setFontSize(11);
          }
          
          yPos += 45;
        }
        
        // Employer signature
        if (verneombudAgreement.employer_name || verneombudAgreement.employer_signature) {
          checkPageBreak(50);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(margin, yPos, contentWidth, 40, 2, 2, "F");
          
          doc.setFont("helvetica", "bold");
          doc.text("Arbeidsgiver:", margin + 5, yPos + 8);
          doc.setFont("helvetica", "normal");
          if (verneombudAgreement.employer_name) {
            doc.text(verneombudAgreement.employer_name, margin + 35, yPos + 8);
          }
          
          if (verneombudAgreement.employer_signature) {
            try {
              doc.addImage(verneombudAgreement.employer_signature, "PNG", margin + 5, yPos + 12, 50, 20);
            } catch (e) {
              console.warn("Could not add employer signature:", e);
            }
          }
          
          if (verneombudAgreement.employer_signed_at) {
            doc.setFontSize(9);
            doc.text(`Signert: ${formatDateForPdf(new Date(verneombudAgreement.employer_signed_at))}`, margin + 5, yPos + 36);
            doc.setFontSize(11);
          }
          
          yPos += 45;
        }
        
        if (verneombudAgreement.notes) {
          checkPageBreak(30);
          doc.setFont("helvetica", "bold");
          doc.text("Merknader:", margin, yPos);
          yPos += 7;
          doc.setFont("helvetica", "normal");
          const noteLines = doc.splitTextToSize(verneombudAgreement.notes, contentWidth);
          doc.text(noteLines, margin, yPos);
          yPos += noteLines.length * 5 + 5;
        }
      }

      // SECTION: GOALS
      doc.addPage();
      sectionNumber++;
      addTocEntry(`${sectionNumber}. Mål for internkontroll`);
      yPos = margin;
      addSectionHeader(`${sectionNumber}. Mål for internkontroll`);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Bedriften har fastsatt følgende mål for sitt systematiske HMS-arbeid:", margin, yPos);
      yPos += 10;
      if (goals.length > 0) {
        goals.forEach((goal, index) => {
          checkPageBreak(15);
          doc.setFillColor(240, 249, 255);
          const lines = doc.splitTextToSize(goal.goal_text, contentWidth - 15);
          const boxHeight = lines.length * 6 + 6;
          doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, "F");
          doc.setFontSize(11);
          doc.text(`${index + 1}.`, margin + 5, yPos + 6);
          doc.text(lines, margin + 12, yPos + 6);
          yPos += boxHeight + 5;
        });
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Ingen mål er definert.", margin, yPos);
        doc.setTextColor(0, 0, 0);
      }

      // SECTION 2: ORGANIZATION
      doc.addPage();
      sectionNumber++;
      addTocEntry(`${sectionNumber}. Organisering og ansvar`);
      yPos = margin;
      addSectionHeader(`${sectionNumber}. Organisering og ansvar`);
      
      // organization is now in new format with roles array directly
      const orgData = organization;

      if (orgData && orgData.roles && orgData.roles.length > 0) {
        // Draw visual org chart
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Organisasjonskart", margin, yPos);
        yPos += 10;
        
        const boxWidth = 80;
        const boxHeight = 20;
        const centerX = pageWidth / 2;
        
        orgData.roles.forEach((role, index) => {
          checkPageBreak(35);
          
          // Draw connecting line from previous box
          if (index > 0) {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(centerX, yPos - 5, centerX, yPos);
          }
          
          // Draw box
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(59, 130, 246);
          doc.setLineWidth(0.5);
          doc.roundedRect(centerX - boxWidth/2, yPos, boxWidth, boxHeight, 2, 2, "FD");
          
          // Role title
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          const titleText = role.title || "Uten tittel";
          doc.text(titleText, centerX, yPos + 8, { align: "center" });
          
          // Person name
          if (role.personName) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text(role.personName, centerX, yPos + 14, { align: "center" });
          }
          
          doc.setTextColor(0, 0, 0);
          yPos += boxHeight + 10;
        });
        
        yPos += 10;
        
        // Draw role descriptions
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Roller og ansvar", margin, yPos);
        yPos += 8;
        
        orgData.roles.forEach((role) => {
          if (role.title && role.description) {
            checkPageBreak(25);
            
            // Role title with person name
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            let roleHeader = role.title;
            if (role.personName) {
              roleHeader += ` (${role.personName})`;
            }
            doc.text(roleHeader, margin, yPos);
            yPos += 6;
            
            // Description
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const descLines = doc.splitTextToSize(role.description, contentWidth - 5);
            descLines.forEach((line: string) => {
              checkPageBreak(6);
              doc.text(line, margin + 5, yPos);
              yPos += 5;
            });
            yPos += 5;
          }
        });
        
        // Add general description if exists
        if (orgData.description && orgData.description.trim()) {
          checkPageBreak(20);
          yPos += 5;
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text("Generell beskrivelse", margin, yPos);
          yPos += 8;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const descLines = doc.splitTextToSize(orgData.description, contentWidth);
          descLines.forEach((line: string) => {
            checkPageBreak(6);
            doc.text(line, margin, yPos);
            yPos += 5;
          });
        }
      } else if (orgData?.description) {
        // Just description without roles
        const orgLines = doc.splitTextToSize(orgData.description, contentWidth);
        orgLines.forEach((line: string) => {
          checkPageBreak(8);
          doc.setFontSize(11);
          doc.text(line, margin, yPos);
          yPos += 6;
        });
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Organisasjonsstruktur er ikke definert.", margin, yPos);
        doc.setTextColor(0, 0, 0);
      }

      // SECTION 3: RISK ASSESSMENT
      doc.addPage();
      sectionNumber++;
      addTocEntry(`${sectionNumber}. Risikovurdering`);
      yPos = margin;
      addSectionHeader(`${sectionNumber}. Risikovurdering`);
      doc.setFontSize(11);
      doc.text("Risiko = Sannsynlighet × Konsekvens (Arbeidstilsynets metodikk)", margin, yPos);
      yPos += 10;
      // Use sanitized risk data to prevent undefined errors
      const sanitizedRisks = sanitizeRisks(riskAssessment);
      if (sanitizedRisks.length > 0) {
        const riskTableData = sanitizedRisks.map((risk) => [
          risk.description.substring(0, 80) + (risk.description.length > 80 ? "..." : ""),
          String(risk.probability),
          String(risk.consequence),
          String(risk.riskValue),
          risk.riskLevel,
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [["Beskrivelse", "S", "K", "R", "Nivå"]],
          body: riskTableData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246], fontSize: 9, fontStyle: "bold" },
          bodyStyles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 15, halign: "center" },
            2: { cellWidth: 15, halign: "center" },
            3: { cellWidth: 15, halign: "center" },
            4: { cellWidth: 25, halign: "center" },
          },
          margin: { left: margin, right: margin },
          didDrawCell: (data) => {
            if (data.section === "body" && data.column.index === 4) {
              const riskValue = Number(riskTableData[data.row.index][3]) || 0;
              const color = getRiskLevelColor(riskValue);
              doc.setTextColor(color[0], color[1], color[2]);
            }
          },
          willDrawCell: () => {
            doc.setTextColor(0, 0, 0);
          },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Ingen risikovurderinger utført.", margin, yPos);
        doc.setTextColor(0, 0, 0);
      }

      // SECTION 4: ACTION PLAN
      doc.addPage();
      sectionNumber++;
      addTocEntry(`${sectionNumber}. Handlingsplan`);
      yPos = margin;
      addSectionHeader(`${sectionNumber}. Handlingsplan`);
      // Use sanitized action data to prevent undefined errors
      const sanitizedActions = sanitizeActions(actionPlan);
      if (sanitizedActions.length > 0) {
        const actionTableData = sanitizedActions.map((action) => [
          action.action_description.substring(0, 60) + (action.action_description.length > 60 ? "..." : ""),
          action.responsible,
          action.deadline,
          action.statusLabel,
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [["Tiltak", "Ansvarlig", "Frist", "Status"]],
          body: actionTableData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246], fontSize: 9, fontStyle: "bold" },
          bodyStyles: { fontSize: 9 },
          margin: { left: margin, right: margin },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Ingen tiltak registrert.", margin, yPos);
        doc.setTextColor(0, 0, 0);
      }

      // SECTION 5: ROUTINES
      doc.addPage();
      sectionNumber++;
      const routinesSectionNum = sectionNumber;
      addTocEntry(`${sectionNumber}. Rutiner og prosedyrer`);
      yPos = margin;
      addSectionHeader(`${sectionNumber}. Rutiner og prosedyrer`);

      // Use sanitized routines data to prevent undefined errors
      const sanitizedRoutinesList = sanitizeRoutines(routines);

      const renderLabeledBlock = (label: string, value: string) => {
        const clean = (value || "").trim();
        if (!clean) return;

        // Label
        checkPageBreak(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`${label}:`, margin + 6, yPos);
        yPos += 4.5;

        // Text
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(clean, contentWidth - 12);

        // Render line-by-line to ensure page breaks work reliably
        const lineHeight = 4.2;
        for (const line of lines) {
          checkPageBreak(lineHeight + 2);
          doc.text(String(line), margin + 6, yPos);
          yPos += lineHeight;
        }

        yPos += 3; // spacing after block
      };

      if (sanitizedRoutinesList.length > 0) {
        sanitizedRoutinesList.forEach((routine, index) => {
          // Routine header card
          checkPageBreak(22);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.text(
            `${routinesSectionNum}.${index + 1} ${routine.routine_number}: ${routine.routine_name}`,
            margin + 5,
            yPos + 9
          );
          yPos += 18;

          // Full routine content
          renderLabeledBlock("Formål", routine.purpose || "Ikke spesifisert");
          renderLabeledBlock("Ansvar", routine.responsibility);
          renderLabeledBlock("Fremgangsmåte", routine.procedure);
          renderLabeledBlock("Eksempler", routine.examples);
          renderLabeledBlock("Husk", routine.remember);

          yPos += 4; // spacing between routines
        });
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text("Ingen rutiner registrert.", margin, yPos);
        doc.setTextColor(0, 0, 0);
      }

      // SECTION 6: LAWS AND REGULATIONS
      doc.addPage();
      sectionNumber++;
      addTocEntry(`${sectionNumber}. Lover og forskrifter`);
      yPos = margin;
      addSectionHeader(`${sectionNumber}. Lover og forskrifter`);
      doc.setFontSize(11);
      doc.text("Oversikt over lover og forskrifter som gjelder for virksomheten:", margin, yPos);
      yPos += 10;
      
      const lawsTableData = savedLaws.map((law) => [
        law.law_name,
        law.category || "Generelt",
        law.description || "",
      ]);
      
      if (lawsTableData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Lov/forskrift", "Kategori", "Beskrivelse"]],
          body: lawsTableData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246], fontSize: 9, fontStyle: "bold" },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 30 },
            2: { cellWidth: 90 },
          },
          margin: { left: margin, right: margin },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.text("Ingen lover og forskrifter er lagret ennå.", margin, yPos);
        yPos += 10;
      }

      // OPTIONAL SECTION: DEVIATIONS
      if (includeDeviationsInPdf && deviations.length > 0) {
        doc.addPage();
        sectionNumber++;
        addTocEntry(`${sectionNumber}. Avviksbehandling`);
        yPos = margin;
        addSectionHeader(`${sectionNumber}. Avviksbehandling`);
        doc.setFontSize(11);
        doc.text(`Totalt ${deviations.length} avvik registrert. ${openDeviationsCount} åpne, ${deviations.length - openDeviationsCount} lukkede.`, margin, yPos);
        yPos += 10;
        
        const deviationTableData = deviations.map((d) => [
          d.deviation_number || "-",
          (d.title || "").substring(0, 40) + ((d.title?.length || 0) > 40 ? "..." : ""),
          d.category || "-",
          d.status === "closed" ? "Lukket" : d.status === "in-progress" ? "Pågår" : "Åpen",
          d.created_at ? format(new Date(d.created_at), "dd.MM.yy") : "-",
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [["Nr", "Tittel", "Kategori", "Status", "Dato"]],
          body: deviationTableData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246], fontSize: 9, fontStyle: "bold" },
          bodyStyles: { fontSize: 8 },
          margin: { left: margin, right: margin },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // OPTIONAL SECTION: AUDITS
      if (includeAuditsInPdf && audits.length > 0) {
        doc.addPage();
        sectionNumber++;
        addTocEntry(`${sectionNumber}. Revisjoner og evaluering`);
        yPos = margin;
        addSectionHeader(`${sectionNumber}. Revisjoner og evaluering`);
        doc.setFontSize(11);
        doc.text(`${completedAuditsCount} gjennomførte revisjoner, ${pendingAuditsCount} planlagte/pågående.`, margin, yPos);
        yPos += 10;
        
        const auditTableData = audits.map((a) => [
          a.audit_number || "-",
          (a.title || "").substring(0, 40),
          a.type || "-",
          a.status === "completed" ? "Gjennomført" : a.status === "in-progress" ? "Pågår" : "Planlagt",
          a.scheduled_date ? format(new Date(a.scheduled_date), "dd.MM.yy") : "-",
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [["Nr", "Tittel", "Type", "Status", "Dato"]],
          body: auditTableData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246], fontSize: 9, fontStyle: "bold" },
          bodyStyles: { fontSize: 8 },
          margin: { left: margin, right: margin },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // OPTIONAL: AUDIT FORM SECTIONS
      const auditFormOptions = [
        { include: includeAnnualHmsInPdf, formType: "annual_hms" as FormType, label: "Årlig HMS-revisjon" },
        { include: includeElkontrollInPdf, formType: "elkontroll" as FormType, label: "El-Kontroll" },
        { include: includeFysiskeForholdInPdf, formType: "fysiske_forhold" as FormType, label: "Fysiske arbeidsforhold" },
        { include: includeDagligDriftInPdf, formType: "daglig_drift" as FormType, label: "Daglig drift" },
      ];

      for (const option of auditFormOptions) {
        if (option.include) {
          const latestForm = getLatestByFormType(option.formType);
          if (latestForm) {
            doc.addPage();
            sectionNumber++;
            const sectionTitle = `${sectionNumber}. ${option.label}`;
            addTocEntry(sectionTitle);
            yPos = margin;
            addSectionHeader(sectionTitle);
            doc.setFontSize(11);
            doc.text(`Sist gjennomført: ${latestForm.completed_at ? format(new Date(latestForm.completed_at), "d. MMMM yyyy", { locale: nb }) : "Ukjent"}`, margin, yPos);
            yPos += 7;
            if (latestForm.auditor_name) {
              doc.text(`Revisor: ${latestForm.auditor_name}`, margin, yPos);
              yPos += 7;
            }
            if (latestForm.participants) {
              doc.text(`Deltakere: ${latestForm.participants}`, margin, yPos);
              yPos += 7;
            }
            yPos += 5;
            
            // Parse and render form data properly
            if (latestForm.form_data && typeof latestForm.form_data === "object") {
              const formData = latestForm.form_data as Record<string, unknown>;
              const sectionQuestions = formData.sectionQuestions as Record<string, Array<{ id: string; question: string }>> | undefined;
              const checklistAnswers = formData.checklistAnswers as Record<string, Record<string, { answer?: string; comment?: string }>> | undefined;
              
              // Comprehensive section title mapping for all audit forms
              const sectionTitles: Record<string, string> = {
                // El-kontroll sections
                sikringsskap: "1. Sikringsskap / Fordelingstavle",
                fastInstallasjon: "2. Fast installasjon / kabler",
                elektriskUtstyr: "3. Elektrisk utstyr / stikk / skjøteledninger",
                dokumentasjon: "4. Dokumentasjon og ansvar",
                // Daglig drift sections
                informasjon: "1. Informasjon og kommunikasjon",
                samarbeid: "2. Samarbeid og beslutninger",
                produktivitet: "3. Produktivitet og effektivitet",
                arbeidsavtaler: "4. Arbeidsavtaler og arbeidsreglement",
                arbeidstid: "5. Arbeidstidsbestemmelser",
                hms: "6. HMS-arbeid",
                kompetanse: "7. Kompetanse og opplæring",
                registrering: "8. Registrering og oppfølging",
                vernetjeneste: "9. Vernetjeneste",
                forsikringer: "10. Forsikringer",
                // Fysiske arbeidsforhold sections
                arbeidslokaler: "1. Arbeidslokaler",
                elektrisk: "2. Elektriske anlegg og utstyr",
                inneklima: "3. Inneklima - lokaler",
                romningsveier: "4. Rømningsveier / Nødutganger",
                brannsikkerhet: "5. Brannsikkerhet - lokaler",
                brannfarlig: "6. Oppbevaring av brann- og eksplosjonsfarlige varer",
                varehandtering: "7. Varehåndtering / lager",
                orden: "8. Orden og renhold",
                avfall: "9. Avfallshåndtering",
                dataskjerm: "10. Arbeid foran dataskjermen",
                asbest: "11. Arbeid med asbestholdig materiale",
                eksterne: "12. Eksterne arbeidsforhold",
                ergonomi: "13. Ergonomi – belastninger",
                verneutstyr: "14. Bruk av personlig verneutstyr",
                stoy: "15. Støyeksponering",
                arbeidsutstyr: "16. Bruk av arbeidsutstyr og maskiner",
                hoyden: "17. Arbeid i høyden",
                kjemisk: "18. Kjemiske stoffer og gasser",
                forstehjelp: "19. Førstehjelp og brannsikkerhet",
                sikring: "20. Sikring av last",
                lasting: "21. Lasting og lossing",
                graving: "22. Gravearbeider",
                sprengning: "23. Sprengningsarbeider",
                adr: "24. ADR-transport",
                adr_uhell: "25. Uhell ved ADR-transport",
                ergonomi_kjoretoy: "26. Ergonomi i kjøretøy",
                hviletid: "27. Kjøre- og hviletid",
                annet: "Andre forhold",
              };

              if (sectionQuestions && checklistAnswers) {
                const sectionOrder = Object.keys(sectionQuestions).filter(
                  key => sectionQuestions[key] && sectionQuestions[key].length > 0
                );

                sectionOrder.forEach((sectionId) => {
                  const questions = sectionQuestions[sectionId];
                  const answers = checklistAnswers[sectionId] || {};
                  
                  if (!questions || questions.length === 0) return;

                  // Section header
                  checkPageBreak(30);
                  doc.setFillColor(240, 249, 255);
                  doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, "F");
                  doc.setFontSize(10);
                  doc.setFont("helvetica", "bold");
                  doc.setTextColor(59, 130, 246);
                  doc.text(sectionTitles[sectionId] || sectionId, margin + 3, yPos + 5.5);
                  doc.setTextColor(0, 0, 0);
                  yPos += 12;

                  // Build table data for this section
                  const tableData: string[][] = [];
                  questions.forEach((q) => {
                    const answer = answers[q.id];
                    let answerText = "-";
                    if (answer?.answer === "yes") answerText = "Ja";
                    else if (answer?.answer === "no") answerText = "Nei";
                    else if (answer?.answer === "na") answerText = "N/A";
                    else if (answer?.answer) answerText = answer.answer;

                    const row = [
                      q.question.length > 70 ? q.question.substring(0, 67) + "..." : q.question,
                      answerText,
                      answer?.comment || ""
                    ];
                    tableData.push(row);
                  });

                  // Draw table
                  autoTable(doc, {
                    startY: yPos,
                    head: [["Sjekkpunkt", "Svar", "Kommentar"]],
                    body: tableData,
                    theme: "striped",
                    headStyles: { 
                      fillColor: [59, 130, 246],
                      fontSize: 8,
                      fontStyle: "bold"
                    },
                    bodyStyles: { fontSize: 8 },
                    columnStyles: {
                      0: { cellWidth: 95 },
                      1: { cellWidth: 20, halign: "center" },
                      2: { cellWidth: 50 }
                    },
                    margin: { left: margin, right: margin },
                    didParseCell: (data) => {
                      // Color code answers
                      if (data.section === "body" && data.column.index === 1) {
                        const answer = data.cell.raw as string;
                        if (answer === "Ja") {
                          data.cell.styles.textColor = [34, 197, 94];
                          data.cell.styles.fontStyle = "bold";
                        } else if (answer === "Nei") {
                          data.cell.styles.textColor = [239, 68, 68];
                          data.cell.styles.fontStyle = "bold";
                        }
                      }
                    }
                  });

                  yPos = (doc as any).lastAutoTable.finalY + 10;
                });

                // Summary statistics
                checkPageBreak(40);
                yPos += 5;
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text("Oppsummering:", margin, yPos);
                yPos += 8;

                let totalYes = 0, totalNo = 0, totalNa = 0;
                Object.values(checklistAnswers).forEach((sectionAnswers) => {
                  Object.values(sectionAnswers).forEach((answer) => {
                    if (answer.answer === "yes") totalYes++;
                    else if (answer.answer === "no") totalNo++;
                    else if (answer.answer === "na") totalNa++;
                  });
                });

                const completionPercent = (totalYes + totalNo) > 0 ? Math.round((totalYes / (totalYes + totalNo)) * 100) : 0;

                doc.setFont("helvetica", "normal");
                doc.setFillColor(34, 197, 94);
                doc.rect(margin, yPos - 3, 4, 4, "F");
                doc.text(`Ja: ${totalYes}`, margin + 7, yPos);
                
                doc.setFillColor(239, 68, 68);
                doc.rect(margin + 35, yPos - 3, 4, 4, "F");
                doc.text(`Nei: ${totalNo}`, margin + 42, yPos);
                
                doc.setFillColor(150, 150, 150);
                doc.rect(margin + 70, yPos - 3, 4, 4, "F");
                doc.text(`N/A: ${totalNa}`, margin + 77, yPos);
                
                doc.text(`Oppfyllelse: ${completionPercent}%`, margin + 110, yPos);
                yPos += 10;
              }

              // Signatures
              if (formData.auditorSignature || formData.managerSignature) {
                checkPageBreak(25);
                yPos += 5;
                doc.setFont("helvetica", "bold");
                doc.text("Signaturer:", margin, yPos);
                yPos += 6;
                doc.setFont("helvetica", "normal");
                if (formData.auditorSignature) {
                  doc.text(`Revisjonsleder: ${formData.auditorSignature}`, margin + 5, yPos);
                  yPos += 5;
                }
                if (formData.managerSignature) {
                  doc.text(`Daglig leder: ${formData.managerSignature}`, margin + 5, yPos);
                  yPos += 5;
                }
              }

              // Other comments
              if (formData.otherComments && typeof formData.otherComments === 'string' && formData.otherComments.trim()) {
                checkPageBreak(20);
                yPos += 5;
                doc.setFont("helvetica", "bold");
                doc.text("Andre kommentarer:", margin, yPos);
                yPos += 6;
                doc.setFont("helvetica", "normal");
                const commentLines = doc.splitTextToSize(formData.otherComments, contentWidth);
                commentLines.forEach((line: string) => {
                  checkPageBreak(5);
                  doc.text(line, margin, yPos);
                  yPos += 5;
                });
              }
            }
          } else {
            doc.addPage();
            sectionNumber++;
            const sectionTitle = `${sectionNumber}. ${option.label}`;
            addTocEntry(sectionTitle);
            yPos = margin;
            addSectionHeader(sectionTitle);
            doc.setTextColor(150, 150, 150);
            doc.text("Ikke gjennomført ennå.", margin, yPos);
            doc.setTextColor(0, 0, 0);
          }
        }
      }

      // Render table of contents with correct page numbers and links
      renderToc();

      // Save PDF
      const fileName = `IK-Handbok_${companyName.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);
      toast.success("PDF lastet ned!");
      setShowExportOptions(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Kunne ikke generere PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [goals, organization, riskAssessment, actionPlan, routines, companyInfo, deviations, audits, openDeviationsCount, completedAuditsCount, pendingAuditsCount, includeDeviationsInPdf, includeAuditsInPdf, includeAnnualHmsInPdf, includeElkontrollInPdf, includeFysiskeForholdInPdf, includeDagligDriftInPdf, getLatestByFormType]);

  const handleSectionClick = (section: typeof handbookSections[0]) => {
    // All sections can be expanded/collapsed
    setExpandedSection(expandedSection === section.id ? null : section.id);
  };

  const handleEditSection = (section: typeof handbookSections[0], e: React.MouseEvent) => {
    e.stopPropagation();

    // Open signature dialogs directly instead of sending users to the manual setup wizard
    if (section.id === "self-declaration") {
      setShowHmsDeclaration(true);
      return;
    }
    if (section.id === "verneombud-exemption") {
      setShowVerneombudExemption(true);
      return;
    }

    if (section.stepIndex >= 0) {
      navigate(`/setup?step=${section.stepIndex}&from=handbook&section=${encodeURIComponent(section.title)}`);
    } else if (section.linkTo) {
      navigate(section.linkTo);
    }
  };

  // Wait for auth and data to fully load
  if (authLoading || isLoading || isLoadingForms) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // If no company, show message
  if (!companyId) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-2xl bg-warning/10 mb-4">
            <Building2 className="w-8 h-8 text-warning" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Ingen bedrift tilknyttet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Du må være tilknyttet en bedrift for å se håndboken.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            Gå til dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">IK-Handbok</h1>
            <p className="text-muted-foreground">
              Din bedrifts internkontrolldokumentasjon
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2" onClick={() => setEmailDialogOpen(true)}>
              <Mail className="w-4 h-4" />
              Send på e-post
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/setup?step=5&from=handbook&section=Handbok")}>
              <Eye className="w-4 h-4" />
              Forhåndsvis
            </Button>
            <Button className="gap-2" onClick={() => setShowExportOptions(true)}>
              <Download className="w-4 h-4" />
              Last ned PDF
            </Button>
          </div>
        </motion.div>

        {/* PDF Export Options Dialog */}
        <AnimatePresence>
          {showExportOptions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowExportOptions(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card rounded-xl border border-border shadow-lg max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-2">Eksporter HMS-håndbok</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Seksjon 1-5 inkluderes alltid. Velg hvilke tilleggsseksjoner du vil ha med:
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <Label htmlFor="include-deviations" className="text-sm cursor-pointer">
                      6. Avviksbehandling ({deviations.length} avvik)
                    </Label>
                    <Switch
                      id="include-deviations"
                      checked={includeDeviationsInPdf}
                      onCheckedChange={setIncludeDeviationsInPdf}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <Label htmlFor="include-audits" className="text-sm cursor-pointer">
                      7. Revisjoner og evaluering ({audits.length} revisjoner)
                    </Label>
                    <Switch
                      id="include-audits"
                      checked={includeAuditsInPdf}
                      onCheckedChange={setIncludeAuditsInPdf}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <Label htmlFor="include-annual-hms" className="text-sm cursor-pointer">
                      8. Årlig HMS-revisjon
                    </Label>
                    <Switch
                      id="include-annual-hms"
                      checked={includeAnnualHmsInPdf}
                      onCheckedChange={setIncludeAnnualHmsInPdf}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <Label htmlFor="include-elkontroll" className="text-sm cursor-pointer">
                      9. El-Kontroll
                    </Label>
                    <Switch
                      id="include-elkontroll"
                      checked={includeElkontrollInPdf}
                      onCheckedChange={setIncludeElkontrollInPdf}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <Label htmlFor="include-fysiske" className="text-sm cursor-pointer">
                      10. Fysiske arbeidsforhold
                    </Label>
                    <Switch
                      id="include-fysiske"
                      checked={includeFysiskeForholdInPdf}
                      onCheckedChange={setIncludeFysiskeForholdInPdf}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <Label htmlFor="include-daglig" className="text-sm cursor-pointer">
                      11. Daglig drift
                    </Label>
                    <Switch
                      id="include-daglig"
                      checked={includeDagligDriftInPdf}
                      onCheckedChange={setIncludeDagligDriftInPdf}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowExportOptions(false)}
                  >
                    Avbryt
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isGeneratingPdf ? "Genererer..." : "Last ned"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overview card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-hero text-primary-foreground rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary-foreground/10">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">
                {companyInfo?.name || "Bedrift"} - IK Handbok
              </h2>
              <p className="text-primary-foreground/80 mb-4">
                Sist oppdatert: {format(lastUpdated, "d. MMMM yyyy", { locale: nb })}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <p className="text-3xl font-bold">{completeSections}/{handbookSections.length}</p>
                  <p className="text-sm text-primary-foreground/70">Seksjoner fullført</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{goals.length + (riskAssessment?.risks?.length ?? 0) + (actionPlan?.actions?.length ?? 0) + (routines?.routines?.length ?? 0) + deviations.length}</p>
                  <p className="text-sm text-primary-foreground/70">Elementer totalt</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{Math.round((completeSections / handbookSections.length) * 100)}%</p>
                  <p className="text-sm text-primary-foreground/70">Komplett</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sections list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold">Innhold</h2>
          
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="divide-y divide-border">
              {handbookSections.map((section, index) => {
                const statusInfo = statusConfig[section.status as keyof typeof statusConfig];
                const StatusIcon = statusInfo.icon;
                const SectionIcon = section.icon;
                const isExpanded = expandedSection === section.id;

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                  >
                    <div
                      className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer group"
                      onClick={() => handleSectionClick(section)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", statusInfo.bg)}>
                          <SectionIcon className={cn("w-5 h-5", statusInfo.color)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium group-hover:text-primary transition-colors">
                            {section.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{section.summary}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusIcon className={cn("w-5 h-5", statusInfo.color)} />
                          <Badge className={cn(statusInfo.bg, statusInfo.color, "hidden sm:inline-flex")}>
                            {statusInfo.label}
                          </Badge>
                          {section.stepIndex >= 0 ? (
                            isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            )
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0">
                            <div className="bg-secondary/30 rounded-lg p-4">
                              {/* Toggle for optional deviation section */}
                              {section.id === "deviations" && (
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      id="include-deviations"
                                      checked={includeDeviations}
                                      onCheckedChange={setIncludeDeviations}
                                    />
                                    <Label htmlFor="include-deviations" className="text-sm cursor-pointer">
                                      Inkluder avvik i håndboken
                                    </Label>
                                  </div>
                                  <span className="text-xs text-muted-foreground">Valgfritt</span>
                                </div>
                              )}
                              {section.content}
                              <div className="mt-4 pt-3 border-t border-border">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => handleEditSection(section, e)}
                                >
                                  {section.linkTo ? "Gå til" : "Rediger i oppsettsveiviseren"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Export options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border p-6 shadow-card"
        >
          <h3 className="font-semibold mb-4">Eksportvalg</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Komplett handbok", format: "PDF", icon: BookOpen, action: () => navigate("/setup?step=5&from=handbook&section=Komplett handbok") },
              { label: "Kun risikovurderinger", format: "PDF", icon: AlertTriangle, action: () => navigate("/setup?step=2&from=handbook&section=Risikovurderinger") },
              { label: "Handlingsplan", format: "PDF", icon: FileText, action: () => navigate("/setup?step=3&from=handbook&section=Handlingsplan") },
            ].map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all text-left"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <option.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.format}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {companyId && companyInfo?.name && (
        <>
          <HmsSelfDeclarationDialog
            open={showHmsDeclaration}
            onOpenChange={setShowHmsDeclaration}
            companyId={companyId}
            companyName={companyInfo.name}
            companyAddress={companyInfo.address || undefined}
            postalCode={companyInfo.postal_code || undefined}
            city={companyInfo.city || undefined}
            onComplete={() => setShowHmsDeclaration(false)}
          />

          <VerneombudExemptionDialog
            open={showVerneombudExemption}
            onOpenChange={setShowVerneombudExemption}
            companyId={companyId}
            companyName={companyInfo.name}
            companyAddress={companyInfo.address || undefined}
            orgNumber={companyInfo.org_number || undefined}
            totalEmployees={employeeCount}
            onComplete={() => setShowVerneombudExemption(false)}
          />
        </>
      )}

      <EmailSendDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        documentType="handbook"
        subject={`IK-Handbok - ${companyInfo?.name || "Bedrift"}`}
        htmlContent={generateHandbookEmailHtml()}
        users={companyUsers.map(u => ({
          id: u.id,
          email: u.email || "",
          first_name: u.first_name || "",
          last_name: u.last_name || ""
        })).filter(u => u.email)}
        companyName={companyInfo?.name}
      />
    </AppLayout>
  );

  function generateHandbookEmailHtml() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>IK-Handbok - ${companyInfo?.name || "Bedrift"}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="margin: 0 0 10px 0; color: #333;">${companyInfo?.name || "Bedrift"} - IK-Handbok</h1>
          <p style="margin: 0; color: #666;">
            Sist oppdatert: ${format(new Date(), "d. MMMM yyyy", { locale: nb })}
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">1. Mål for internkontroll</h2>
          ${goals.length > 0 
            ? `<ul>${goals.map(g => `<li>${g.goal_text}</li>`).join("")}</ul>` 
            : "<p>Ingen mål definert.</p>"
          }
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">2. Organisering og ansvar</h2>
          <p style="white-space: pre-wrap;">${(organization?.roles?.length ?? 0) > 0 
            ? organization?.roles?.map(r => `${r.title}${r.personName ? ` (${r.personName})` : ''}`).join(', ')
            : (organization?.description?.substring(0, 500) || "Ikke definert")}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">3. Risikovurderinger</h2>
          <p>${(riskAssessment?.risks?.length ?? 0)} risikoer identifisert</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">4. Handlingsplan</h2>
          <p>${(actionPlan?.actions?.length ?? 0)} tiltak registrert</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">5. Rutiner og prosedyrer</h2>
          ${(routines?.routines?.length ?? 0) > 0 
            ? `<ul>${routines?.routines.slice(0, 10).map(r => `<li>${r.routine_number}: ${r.routine_name}</li>`).join("")}</ul>` 
            : "<p>Ingen rutiner registrert.</p>"
          }
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">6. Avviksbehandling</h2>
          <p>${deviations.length} avvik totalt, ${openDeviationsCount} åpne</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">7. Revisjoner og evaluering</h2>
          <p>${completedAuditsCount} revisjoner gjennomført</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>Denne oppsummeringen ble sendt fra HMS-systemet. For komplett handbok, last ned PDF.</p>
        </div>
      </body>
      </html>
    `;
  }
};

export default Handbook;
