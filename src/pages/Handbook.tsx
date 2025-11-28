import { useState } from "react";
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
  Loader2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSetupWizard } from "@/hooks/useSetupWizard";
import { useDeviations } from "@/hooks/useDeviations";
import { useAudits } from "@/hooks/useAudits";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

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
};

const Handbook = () => {
  const navigate = useNavigate();
  const { 
    isLoading, 
    companyInfo, 
    goals, 
    organization, 
    riskAssessment, 
    actionPlan, 
    routines,
    progress 
  } = useSetupWizard();
  const { deviations, isLoading: isLoadingDeviations } = useDeviations();
  const { audits, isLoading: isLoadingAudits } = useAudits();
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Calculate deviation status - complete if no open or in-progress deviations
  const openDeviationsCount = deviations.filter(d => d.status === "open" || d.status === "in-progress").length;
  const deviationStatus = openDeviationsCount === 0 && deviations.length > 0 ? "complete" : "incomplete";

  // Calculate audit status - complete if at least one audit is completed
  const completedAuditsCount = audits.filter(a => a.status === "completed").length;
  const pendingAuditsCount = audits.filter(a => a.status === "scheduled" || a.status === "in-progress").length;
  const auditStatus = completedAuditsCount > 0 && pendingAuditsCount === 0 ? "complete" : "incomplete";

  // Calculate section status based on actual data
  const handbookSections = [
    {
      id: "goals",
      title: "1. Mål for internkontroll",
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
    {
      id: "organization",
      title: "2. Organisering og ansvar",
      status: organization?.custom_content ? "complete" : "incomplete",
      stepIndex: 1,
      icon: Users,
      content: organization?.custom_content ? (
        <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
          {organization.custom_content.substring(0, 500)}
          {organization.custom_content.length > 500 && "..."}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Organisering er ikke definert ennå.</p>
      ),
      summary: organization?.custom_content ? "Definert" : "Ikke definert",
    },
    {
      id: "risk",
      title: "3. Risikovurderinger",
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
    {
      id: "actions",
      title: "4. Handlingsplan",
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
    {
      id: "routines",
      title: "5. Rutiner og prosedyrer",
      status: (routines?.routines?.length ?? 0) > 0 ? "complete" : "incomplete",
      stepIndex: 4,
      icon: FileCheck,
      content: (routines?.routines?.length ?? 0) > 0 ? (
        <div className="space-y-2">
          {routines?.routines.slice(0, 5).map((routine) => (
            <div key={routine.id} className="flex items-center gap-2 text-sm">
              <span className="font-mono text-xs text-muted-foreground">{routine.routine_number}</span>
              <span className="text-muted-foreground truncate">{routine.routine_name}</span>
            </div>
          ))}
          {(routines?.routines?.length ?? 0) > 5 && (
            <p className="text-xs text-muted-foreground">+ {(routines?.routines?.length ?? 0) - 5} flere rutiner</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ingen rutiner er lagt til ennå.</p>
      ),
      summary: `${routines?.routines?.length ?? 0} rutiner`,
    },
    {
      id: "deviations",
      title: "6. Avviksbehandling",
      status: deviationStatus,
      stepIndex: -1, // Not part of wizard
      icon: AlertCircle,
      content: (
        <p className="text-sm text-muted-foreground">
          {openDeviationsCount > 0 
            ? `${openDeviationsCount} åpne avvik som må behandles.`
            : deviations.length > 0 
              ? `Alle ${deviations.length} avvik er lukket.`
              : "Ingen avvik er registrert. Gå til Avvik-modulen for å registrere avvik."
          }
        </p>
      ),
      summary: openDeviationsCount > 0 ? `${openDeviationsCount} åpne avvik` : deviations.length > 0 ? "Alle avvik lukket" : "Ingen avvik",
      linkTo: "/deviations",
    },
    {
      id: "audits",
      title: "7. Revisjoner og evaluering",
      status: auditStatus,
      stepIndex: -1, // Not part of wizard
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
  ];

  const completeSections = handbookSections.filter((s) => s.status === "complete").length;
  const lastUpdated = new Date();

  const handleSectionClick = (section: typeof handbookSections[0]) => {
    if (section.linkTo) {
      navigate(section.linkTo);
    } else if (section.stepIndex >= 0) {
      // Toggle expand/collapse for wizard sections
      setExpandedSection(expandedSection === section.id ? null : section.id);
    }
  };

  const handleEditSection = (section: typeof handbookSections[0], e: React.MouseEvent) => {
    e.stopPropagation();
    if (section.stepIndex >= 0) {
      navigate(`/setup?step=${section.stepIndex}&from=handbook&section=${encodeURIComponent(section.title)}`);
    } else if (section.linkTo) {
      navigate(section.linkTo);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/setup?step=5&from=handbook&section=Handbok")}>
              <Eye className="w-4 h-4" />
              Forhåndsvis
            </Button>
            <Button className="gap-2" onClick={() => navigate("/setup?step=5&from=handbook&section=Handbok")}>
              <Download className="w-4 h-4" />
              Last ned PDF
            </Button>
          </div>
        </motion.div>

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
              <div className="grid grid-cols-3 gap-6">
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
                              {section.content}
                              <div className="mt-4 pt-3 border-t border-border">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => handleEditSection(section, e)}
                                >
                                  Rediger i oppsettsveiviseren
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
    </AppLayout>
  );
};

export default Handbook;
