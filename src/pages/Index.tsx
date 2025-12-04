import { motion } from "framer-motion";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  FileCheck,
  Calendar,
  ChevronRight
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ComplianceProgress } from "@/components/dashboard/ComplianceProgress";
import { RecentDeviations } from "@/components/dashboard/RecentDeviations";
import { ExpiryAlerts } from "@/components/dashboard/ExpiryAlerts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAudits } from "@/hooks/useAudits";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

const Index = () => {
  const { compliancePercent, openDeviations, completedActions, dueSoon, isLoading } = useDashboardStats();
  const { upcomingAudits, isLoading: isLoadingAudits } = useAudits();
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d. MMM", { locale: nb });
    } catch {
      return dateString;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Oversikt over din internkontroll og HMS-status
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title="Samsvarsstatus"
            value={isLoading ? "..." : `${compliancePercent}%`}
            description="Oppfyller krav"
            icon={Shield}
            variant="success"
            delay={0}
            onClick={() => navigate("/setup")}
          />
          <StatsCard
            title="Åpne avvik"
            value={isLoading ? "..." : openDeviations}
            description="Krever handling"
            icon={AlertTriangle}
            variant="warning"
            delay={0.1}
            onClick={() => navigate("/deviations")}
          />
          <StatsCard
            title="Fullførte tiltak"
            value={isLoading ? "..." : completedActions}
            description="Totalt"
            icon={CheckCircle2}
            variant="success"
            delay={0.2}
            onClick={() => navigate("/setup?step=3")}
          />
          <StatsCard
            title="Forfallende"
            value={isLoading ? "..." : dueSoon}
            description="Neste 7 dager"
            icon={Clock}
            variant="destructive"
            delay={0.3}
            onClick={() => navigate("/deviations")}
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <ComplianceProgress />
            <RecentDeviations />
          </div>

          {/* Right column */}
          <div className="space-y-4 md:space-y-6">
            <ExpiryAlerts />
            <QuickActions />
            
            {/* Upcoming reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-card"
            >
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-info/10">
                    <FileCheck className="w-4 h-4 md:w-5 md:h-5 text-info" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold">Kommende revisjoner</h3>
                </div>
                {upcomingAudits.length > 0 && (
                  <button 
                    onClick={() => navigate("/audits")}
                    className="text-xs text-primary hover:underline"
                  >
                    Se alle
                  </button>
                )}
              </div>
              
              {isLoadingAudits ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">Laster...</p>
                </div>
              ) : upcomingAudits.length === 0 ? (
                <div className="text-center py-4 md:py-6 text-muted-foreground">
                  <FileCheck className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs md:text-sm">Ingen revisjoner planlagt</p>
                  <button 
                    onClick={() => navigate("/audits")}
                    className="text-xs mt-2 text-primary hover:underline"
                  >
                    Opprett en revisjon
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingAudits.slice(0, 3).map((audit) => (
                    <div
                      key={audit.id}
                      onClick={() => navigate("/audits")}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        audit.status === "in-progress" ? "bg-warning/10" : "bg-muted"
                      )}>
                        <Calendar className={cn(
                          "w-4 h-4",
                          audit.status === "in-progress" ? "text-warning" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{audit.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(audit.scheduled_date)}
                          {audit.responsible_name && ` • ${audit.responsible_name}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
