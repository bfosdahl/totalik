import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  FileText,
  Download,
  ClipboardList,
  AlertTriangle,
  Shield,
  FolderOpen,
  Info,
  Loader2,
  HardHat,
  ShieldCheck,
  BookOpen,
  FlaskConical,
  GanttChart,
  Clock,
  Users,
  Wallet,
  FileWarning,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useKsModule2Checklists } from "@/hooks/useKsModule2Checklists";
import { useKsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { useKsModule2Uk } from "@/hooks/useKsModule2Uk";
import { useKsModule2Sja } from "@/hooks/useKsModule2Sja";
import { useKsModule2Vernerunder } from "@/hooks/useKsModule2Vernerunder";
import { useKsModule2Routines } from "@/hooks/useKsModule2Routines";
import { useKsModule2ShaPlan } from "@/hooks/useKsModule2ShaPlan";
import { useKsModule2Stoffkartotek } from "@/hooks/useKsModule2Stoffkartotek";
import { useKsModule2Milestones } from "@/hooks/useKsModule2Milestones";
import { useKsModule2Meetings } from "@/hooks/useKsModule2Meetings";
import { useKsModule2Finances } from "@/hooks/useKsModule2Finances";
import { useKsModule2ChangeOrders } from "@/hooks/useKsModule2ChangeOrders";
import { useKsModule2Claims } from "@/hooks/useKsModule2Claims";
import { useKsModule2Subcontractors } from "@/hooks/useKsModule2Subcontractors";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectReportPdf, ReportSections } from "@/utils/ksModule2ProjectReport";
import { toast } from "sonner";

interface ProjectData {
  id: string;
  project_name: string;
  project_number: string;
  address?: string;
  client_name?: string;
  gnr_bnr?: string;
  municipality?: string;
  start_date?: string;
  end_date?: string;
  status: string;
}

export default function Ks2Prosjektrapport() {
  const { projectId } = useParams();
  const { profile, company } = useAuth();
  const { checklists } = useKsModule2Checklists(projectId || null);
  const { avvikList } = useKsModule2Avvik(projectId || null);
  const { ukList } = useKsModule2Uk(projectId || null);
  const { sjaList } = useKsModule2Sja(projectId);
  const { vernerunder } = useKsModule2Vernerunder(projectId);
  const { routines } = useKsModule2Routines(projectId);
  const { shaPlan } = useKsModule2ShaPlan(projectId || "");
  const { stoffkartotekList } = useKsModule2Stoffkartotek(projectId || null);
  const { milestones } = useKsModule2Milestones(projectId);
  const { meetings } = useKsModule2Meetings(projectId || null);
  const { finances, invoices } = useKsModule2Finances(projectId);
  const { changeOrders } = useKsModule2ChangeOrders(projectId);
  const { claims } = useKsModule2Claims(projectId);
  const { subcontractors } = useKsModule2Subcontractors(projectId || null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  
  const [sections, setSections] = useState<ReportSections>({
    includeProjectInfo: true,
    includeChecklists: true,
    includeChecklistDetails: false,
    includeChecklistPhotos: false,
    includeAvvik: true,
    includeAvvikDetails: false,
    includeAvvikPhotos: false,
    includeUk: true,
    includeUkDetails: false,
    includeSja: true,
    includeSjaDetails: false,
    includeVernerunder: true,
    includeVernerundeDetails: false,
    includeRoutines: true,
    includeDocuments: true,
    // New sections
    includeShaPlan: true,
    includeStoffkartotek: true,
    includeMilestones: true,
    includeMeetings: true,
    includeFinances: true,
    includeChangeOrders: true,
    includeClaims: true,
    includeSubcontractors: true,
  });

  // Fetch project info
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      setIsLoadingProject(true);
      try {
        const { data, error } = await supabase
          .from("ks_module2_projects")
          .select("*")
          .eq("id", projectId)
          .single();
        
        if (error) throw error;
        setProject(data);
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error("Kunne ikke hente prosjektdata");
      } finally {
        setIsLoadingProject(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleGenerateReport = async () => {
    if (!project || !projectId) {
      toast.error("Prosjektdata mangler");
      return;
    }

    setIsGenerating(true);
    const hasPhotos = sections.includeChecklistPhotos || sections.includeAvvikPhotos;
    if (hasPhotos) {
      toast.info("Genererer rapport med bilder - dette kan ta litt tid...");
    }

    try {
      // Fetch documents marked for inclusion
      const { data: documents } = await supabase
        .from("ks_module2_project_documents" as any)
        .select("*")
        .eq("project_id", projectId)
        .eq("include_in_report", true);

      const generatedBy = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.email || "Ukjent";

      await generateProjectReportPdf({
        project: {
          project_name: project.project_name,
          project_number: project.project_number,
          address: project.address,
          client_name: project.client_name,
          gnr_bnr: project.gnr_bnr,
          municipality: project.municipality,
          start_date: project.start_date,
          end_date: project.end_date,
          status: project.status,
        },
        checklists: checklists.map(c => ({
          id: c.id,
          title: c.title,
          template_name: c.template_name || "Egendefinert",
          status: c.status,
          completed_at: c.completed_at,
          completed_by_name: c.responsible_user_name,
          checkpoints: c.status === "completed" && c.checklist_items?.length 
            ? c.checklist_items.map((item: any) => ({
                label: item.text || "Sjekkpunkt",
                response: item.value === true ? "OK" : item.value === false ? "Nei" : item.value?.toString() || "-",
                comment: item.comment,
                photos: item.photos || [],
              }))
            : undefined,
        })),
        avvik: avvikList.map(a => ({
          avvik_number: a.avvik_number,
          title: a.title,
          category: a.category,
          severity: a.severity,
          status: a.status,
          discovered_date: a.discovered_date,
          responsible_name: a.responsible_name,
          description: a.description,
          corrective_action: a.corrective_action,
          closed_date: a.closed_at,
          closed_by_name: (a as any).closed_by_name,
          photos: (a as any).photo_paths || [],
        })),
        ukControls: ukList.map(u => ({
          uk_number: u.uk_number,
          control_area: u.control_area,
          status: u.status,
          controller_company: u.controller_company,
          result: u.result,
          description: u.description,
          comments: u.comments,
        })),
        sjaList: sjaList.map(s => ({
          sja_number: s.sja_number,
          title: s.title,
          work_description: s.work_description,
          location: s.location,
          planned_date: s.planned_date,
          responsible_name: s.responsible_name,
          status: s.status,
          overall_risk_level: s.overall_risk_level,
          identified_risks: s.identified_risks,
          risk_reducing_measures: s.risk_reducing_measures,
          completed_at: s.completed_at,
          completed_by_name: s.completed_by_name,
        })),
        vernerunder: vernerunder.map(v => ({
          vernerunde_number: v.vernerunde_number,
          title: v.title,
          scheduled_date: v.scheduled_date,
          completed_date: v.completed_date,
          responsible_name: v.responsible_name,
          status: v.status,
          findings_count: v.findings?.length || 0,
          completed_by_name: v.completed_by_name,
          findings: v.findings?.map((f: any) => ({
            description: f.description || f.finding || "",
            severity: f.severity,
            status: f.status,
            responsible: f.responsible,
          })),
        })),
        routines: routines.map(r => ({
          routine_number: r.routine_number,
          name: r.name,
          description: r.description || undefined,
          category: r.category,
          responsible_role: r.responsible_role || undefined,
          is_document: r.is_document,
          approved_by: r.approved_by || undefined,
          approved_at: r.approved_at || undefined,
        })),
        documents: (documents || []).map((d: any) => ({
          document_name: d.document_name,
          category: d.category,
          uploaded_at: d.created_at,
        })),
        // New data
        shaPlan: shaPlan ? {
          plan_type: shaPlan.plan_type,
          status: shaPlan.status,
          project_name: shaPlan.project_name,
          client_name: shaPlan.client_name,
          sha_coordinator_kp: shaPlan.sha_coordinator_kp,
          sha_coordinator_ku: shaPlan.sha_coordinator_ku,
          planned_start_date: shaPlan.planned_start_date,
          planned_end_date: shaPlan.planned_end_date,
          risk_areas: shaPlan.risk_areas?.filter(r => r.checked) || [],
          entrepreneur_approved: shaPlan.entrepreneur_approved,
        } : undefined,
        stoffkartotek: stoffkartotekList.map(s => ({
          product_name: s.product_name,
          manufacturer: s.manufacturer,
          danger_classes: s.danger_classes,
          location: s.location,
          last_updated: s.last_updated,
        })),
        milestones: milestones.map(m => ({
          title: m.title,
          description: m.description,
          start_date: m.start_date,
          end_date: m.end_date,
          status: m.status,
          progress: m.progress,
          responsible_name: m.responsible_name,
        })),
        meetings: meetings.map(m => ({
          meeting_number: m.meeting_number,
          meeting_type: m.meeting_type,
          title: m.title,
          meeting_date: m.meeting_date,
          location: m.location,
          participants: m.participants,
          status: m.status,
        })),
        finances: finances ? {
          contract_sum: finances.contract_sum,
          budget_materials: finances.budget_materials,
          budget_labor: finances.budget_labor,
          budget_subcontractors: finances.budget_subcontractors,
          budget_other: finances.budget_other,
          actual_materials: finances.actual_materials,
          actual_labor: finances.actual_labor,
          actual_subcontractors: finances.actual_subcontractors,
          actual_other: finances.actual_other,
          invoiced_amount: finances.invoiced_amount,
          paid_amount: finances.paid_amount,
          change_orders_sum: finances.change_orders_sum,
        } : undefined,
        invoices: invoices.map(i => ({
          invoice_number: i.invoice_number,
          description: i.description,
          amount: i.amount,
          invoice_date: i.invoice_date,
          due_date: i.due_date,
          status: i.status,
        })),
        changeOrders: changeOrders.map(c => ({
          change_order_number: c.change_order_number,
          title: c.title,
          description: c.description,
          total_cost: c.total_cost,
          status: c.status,
          customer_approved: c.customer_approved,
          customer_approved_at: c.customer_approved_at,
        })),
        claims: claims.map(c => ({
          claim_number: c.claim_number,
          title: c.title,
          description: c.description,
          category: c.category,
          priority: c.priority,
          status: c.status,
          reported_date: c.reported_date,
          responsible_name: c.responsible_name,
          resolution: c.resolution,
          cost_estimate: c.cost_estimate,
          actual_cost: c.actual_cost,
        })),
        subcontractors: subcontractors.map(s => ({
          firm_name: s.firm_name,
          org_number: s.org_number,
          contact_person: s.contact_person,
          work_scope: s.work_scope,
          trade: s.trade,
          contract_value: s.contract_value,
          approval_status: s.approval_status,
          is_active: s.is_active,
        })),
        companyName: company?.name || "Ukjent bedrift",
        generatedBy,
      }, sections);

      toast.success("Prosjektrapport generert!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Kunne ikke generere rapport");
    } finally {
      setIsGenerating(false);
    }
  };

  const completedChecklists = checklists.filter(c => c.status === "completed").length;
  const closedAvvik = avvikList.filter(a => a.status === "closed").length;
  const approvedUk = ukList.filter(u => u.status === "approved").length;
  const completedSja = sjaList.filter(s => s.status === "completed").length;
  const completedVernerunder = vernerunder.filter(v => v.status === "completed").length;
  const completedMeetings = meetings.filter(m => m.status === "completed").length;
  const approvedChangeOrders = changeOrders.filter(c => c.status === "approved").length;
  const resolvedClaims = claims.filter(c => c.status === "resolved").length;
  const approvedSubcontractors = subcontractors.filter(s => s.approval_status === "approved").length;

  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Prosjektrapport / FDV-pakke</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Generer samlet prosjektdokumentasjon som PDF
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Section Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Velg innhold</CardTitle>
              <CardDescription>
                Velg hvilke seksjoner som skal inkluderes i rapporten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Project Info */}
              <SectionToggle
                icon={Info}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                label="Prosjektinformasjon"
                description="Grunnleggende prosjektdata og status"
                checked={sections.includeProjectInfo}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeProjectInfo: !!checked }))
                }
              />

              <Separator className="my-4" />
              <div className="text-sm font-medium text-muted-foreground mb-2">Kvalitetssikring</div>

              {/* Checklists */}
              <div className="space-y-2">
                <SectionToggle
                  icon={ClipboardList}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                  label="Sjekklister og egenkontroller"
                  description={`${completedChecklists} av ${checklists.length} fullført`}
                  checked={sections.includeChecklists}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeChecklists: !!checked }))
                  }
                />
                {sections.includeChecklists && (
                  <div className="ml-14 space-y-2">
                    <SubOption
                      label="Inkluder sjekkpunktdetaljer"
                      description="Viser alle sjekkpunkter med svar"
                      checked={sections.includeChecklistDetails}
                      onCheckedChange={(checked) => setSections(s => ({ ...s, includeChecklistDetails: checked }))}
                    />
                    <SubOption
                      label="Inkluder bilder"
                      description="Legger ved opplastede bilder fra sjekklister"
                      checked={sections.includeChecklistPhotos}
                      onCheckedChange={(checked) => setSections(s => ({ ...s, includeChecklistPhotos: checked }))}
                    />
                  </div>
                )}
              </div>

              {/* Avvik */}
              <div className="space-y-2">
                <SectionToggle
                  icon={AlertTriangle}
                  iconBgColor="bg-red-100"
                  iconColor="text-red-600"
                  label="Avvik (KS og HMS)"
                  description={`${closedAvvik} av ${avvikList.length} lukket`}
                  checked={sections.includeAvvik}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeAvvik: !!checked }))
                  }
                />
                {sections.includeAvvik && (
                  <div className="ml-14 space-y-2">
                    <SubOption
                      label="Inkluder beskrivelser og tiltak"
                      description="Viser full beskrivelse og korrigerende tiltak"
                      checked={sections.includeAvvikDetails}
                      onCheckedChange={(checked) => setSections(s => ({ ...s, includeAvvikDetails: checked }))}
                    />
                    <SubOption
                      label="Inkluder bilder"
                      description="Legger ved opplastede bilder fra avvik"
                      checked={sections.includeAvvikPhotos}
                      onCheckedChange={(checked) => setSections(s => ({ ...s, includeAvvikPhotos: checked }))}
                    />
                  </div>
                )}
              </div>

              {/* UK */}
              <div className="space-y-2">
                <SectionToggle
                  icon={Shield}
                  iconBgColor="bg-purple-100"
                  iconColor="text-purple-600"
                  label="Uavhengig kontroll"
                  description={`${approvedUk} av ${ukList.length} godkjent`}
                  checked={sections.includeUk}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeUk: !!checked }))
                  }
                />
                {sections.includeUk && (
                  <div className="ml-14">
                    <SubOption
                      label="Inkluder kommentarer og beskrivelser"
                      description="Viser detaljert kontrollinformasjon"
                      checked={sections.includeUkDetails}
                      onCheckedChange={(checked) => setSections(s => ({ ...s, includeUkDetails: checked }))}
                    />
                  </div>
                )}
              </div>

              <Separator className="my-4" />
              <div className="text-sm font-medium text-muted-foreground mb-2">HMS / SHA</div>

              {/* SHA Plan */}
              <SectionToggle
                icon={FileText}
                iconBgColor="bg-emerald-100"
                iconColor="text-emerald-600"
                label="SHA-plan"
                description={shaPlan ? `Status: ${shaPlan.status}` : "Ikke opprettet"}
                checked={sections.includeShaPlan}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeShaPlan: !!checked }))
                }
              />

              {/* SJA */}
              <div className="space-y-2">
                <SectionToggle
                  icon={HardHat}
                  iconBgColor="bg-amber-100"
                  iconColor="text-amber-600"
                  label="Sikker Jobb Analyse (SJA)"
                  description={`${completedSja} av ${sjaList.length} fullført`}
                  checked={sections.includeSja}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeSja: !!checked }))
                  }
                />
                {sections.includeSja && (
                  <div className="ml-14">
                    <SubOption
                      label="Inkluder risikoanalyse og tiltak"
                      description="Viser identifiserte risikoer og risikoreduserende tiltak"
                      checked={sections.includeSjaDetails}
                      onCheckedChange={(checked) => setSections(s => ({ ...s, includeSjaDetails: checked }))}
                    />
                  </div>
                )}
              </div>

              {/* Vernerunder */}
              <div className="space-y-2">
                <SectionToggle
                  icon={ShieldCheck}
                  iconBgColor="bg-violet-100"
                  iconColor="text-violet-600"
                  label="Vernerunder"
                  description={`${completedVernerunder} av ${vernerunder.length} fullført`}
                  checked={sections.includeVernerunder}
                  onCheckedChange={(checked) => 
                    setSections(s => ({ ...s, includeVernerunder: !!checked }))
                  }
                />
                {sections.includeVernerunder && (
                  <div className="ml-14">
                    <SubOption
                      label="Inkluder funn og observasjoner"
                      description="Viser alle registrerte funn fra vernerundene"
                      checked={sections.includeVernerundeDetails}
                      onCheckedChange={(checked) => setSections(s => ({ ...s, includeVernerundeDetails: checked }))}
                    />
                  </div>
                )}
              </div>

              {/* Stoffkartotek */}
              <SectionToggle
                icon={FlaskConical}
                iconBgColor="bg-orange-100"
                iconColor="text-orange-600"
                label="Stoffkartotek"
                description={`${stoffkartotekList.length} kjemikalier`}
                checked={sections.includeStoffkartotek}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeStoffkartotek: !!checked }))
                }
              />

              <Separator className="my-4" />
              <div className="text-sm font-medium text-muted-foreground mb-2">Prosjektstyring</div>

              {/* Milestones / Fremdriftsplan */}
              <SectionToggle
                icon={GanttChart}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                label="Fremdriftsplan / Milepæler"
                description={`${milestones.length} milepæler`}
                checked={sections.includeMilestones}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeMilestones: !!checked }))
                }
              />

              {/* Meetings */}
              <SectionToggle
                icon={Users}
                iconBgColor="bg-indigo-100"
                iconColor="text-indigo-600"
                label="Møtereferater"
                description={`${completedMeetings} av ${meetings.length} fullført`}
                checked={sections.includeMeetings}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeMeetings: !!checked }))
                }
              />

              <Separator className="my-4" />
              <div className="text-sm font-medium text-muted-foreground mb-2">Økonomi</div>

              {/* Finances */}
              <SectionToggle
                icon={Wallet}
                iconBgColor="bg-amber-100"
                iconColor="text-amber-600"
                label="Økonomioversikt"
                description={finances ? `Kontraktssum: ${finances.contract_sum?.toLocaleString('nb-NO')} kr` : "Ikke registrert"}
                checked={sections.includeFinances}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeFinances: !!checked }))
                }
              />

              {/* Change Orders */}
              <SectionToggle
                icon={FileText}
                iconBgColor="bg-cyan-100"
                iconColor="text-cyan-600"
                label="Endringsmeldinger"
                description={`${approvedChangeOrders} av ${changeOrders.length} godkjent`}
                checked={sections.includeChangeOrders}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeChangeOrders: !!checked }))
                }
              />

              {/* Claims */}
              <SectionToggle
                icon={FileWarning}
                iconBgColor="bg-rose-100"
                iconColor="text-rose-600"
                label="Reklamasjoner"
                description={`${resolvedClaims} av ${claims.length} lukket`}
                checked={sections.includeClaims}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeClaims: !!checked }))
                }
              />

              <Separator className="my-4" />
              <div className="text-sm font-medium text-muted-foreground mb-2">Partnere</div>

              {/* Subcontractors */}
              <SectionToggle
                icon={Building2}
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
                label="Underleverandører"
                description={`${approvedSubcontractors} av ${subcontractors.length} godkjent`}
                checked={sections.includeSubcontractors}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeSubcontractors: !!checked }))
                }
              />

              <Separator className="my-4" />
              <div className="text-sm font-medium text-muted-foreground mb-2">Dokumentasjon</div>

              {/* Routines */}
              <SectionToggle
                icon={BookOpen}
                iconBgColor="bg-teal-100"
                iconColor="text-teal-600"
                label="Rutiner"
                description={`${routines.length} rutiner`}
                checked={sections.includeRoutines}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeRoutines: !!checked }))
                }
              />

              {/* Documents */}
              <SectionToggle
                icon={FolderOpen}
                iconBgColor="bg-gray-100"
                iconColor="text-gray-600"
                label="Dokumentoversikt"
                description="Oversikt over prosjektdokumenter"
                checked={sections.includeDocuments}
                onCheckedChange={(checked) => 
                  setSections(s => ({ ...s, includeDocuments: !!checked }))
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary and Generate */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sammendrag</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <SummaryRow label="Sjekklister" count={checklists.length} />
                <SummaryRow label="Avvik" count={avvikList.length} />
                <SummaryRow label="UK-kontroller" count={ukList.length} />
                <SummaryRow label="SJA" count={sjaList.length} />
                <SummaryRow label="Vernerunder" count={vernerunder.length} />
                <SummaryRow label="Stoffkartotek" count={stoffkartotekList.length} />
                <SummaryRow label="Milepæler" count={milestones.length} />
                <SummaryRow label="Møtereferater" count={meetings.length} />
                <SummaryRow label="Endringsmeldinger" count={changeOrders.length} />
                <SummaryRow label="Reklamasjoner" count={claims.length} />
                <SummaryRow label="Underleverandører" count={subcontractors.length} />
                <SummaryRow label="Rutiner" count={routines.length} />
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                Rapporten vil inneholde alle valgte seksjoner med oppsummering og detaljer.
              </div>

              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={handleGenerateReport}
                disabled={isGenerating || !project}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Genererer...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Last ned rapport
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                FDV-dokumentasjon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                FDV-pakken genereres automatisk basert på dokumenter merket med "Inkluder i rapport" i Dokumentasjon-seksjonen.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper components
function SectionToggle({
  icon: Icon,
  iconBgColor,
  iconColor,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBgColor}`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
        </div>
        <div>
          <Label className="font-medium text-sm sm:text-base">{label}</Label>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function SubOption({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
      <div>
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function SummaryRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant="secondary">{count}</Badge>
    </div>
  );
}
