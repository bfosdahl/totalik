import { motion } from "framer-motion";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  FileCheck,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ComplianceProgress } from "@/components/dashboard/ComplianceProgress";
import { RecentDeviations } from "@/components/dashboard/RecentDeviations";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const Index = () => {
  const { compliancePercent, openDeviations, completedActions, dueSoon, isLoading } = useDashboardStats();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Oversikt over din internkontroll og HMS-status
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Samsvarsstatus"
            value={isLoading ? "..." : `${compliancePercent}%`}
            description="Oppfyller krav"
            icon={Shield}
            variant="success"
            delay={0}
          />
          <StatsCard
            title="Åpne avvik"
            value={isLoading ? "..." : openDeviations}
            description="Krever handling"
            icon={AlertTriangle}
            variant="warning"
            delay={0.1}
          />
          <StatsCard
            title="Fullførte tiltak"
            value={isLoading ? "..." : completedActions}
            description="Totalt"
            icon={CheckCircle2}
            variant="success"
            delay={0.2}
          />
          <StatsCard
            title="Forfallende"
            value={isLoading ? "..." : dueSoon}
            description="Neste 7 dager"
            icon={Clock}
            variant="destructive"
            delay={0.3}
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <ComplianceProgress />
            <RecentDeviations />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <QuickActions />
            
            {/* Upcoming reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="bg-card rounded-xl border border-border p-6 shadow-card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-info/10">
                  <FileCheck className="w-5 h-5 text-info" />
                </div>
                <h3 className="text-lg font-semibold">Kommende revisjoner</h3>
              </div>
              
              <div className="text-center py-6 text-muted-foreground">
                <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Ingen revisjoner planlagt</p>
                <p className="text-xs mt-1">Opprett en revisjon i Revisjoner-modulen</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
