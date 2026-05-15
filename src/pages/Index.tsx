import { motion } from "framer-motion";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Rocket,
  X,
  ShieldCheck
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ComplianceProgress } from "@/components/dashboard/ComplianceProgress";
import { RecentDeviations } from "@/components/dashboard/RecentDeviations";
import { ExpiryAlerts } from "@/components/dashboard/ExpiryAlerts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useNavigate } from "react-router-dom";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import HmsAarshjul from "@/components/audits/HmsAarshjul";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AnonymousMessageButton } from "@/components/anonymous/AnonymousMessageButton";
import { useTranslate } from "@/hooks/useTranslate";
import { PageSeo } from "@/components/seo/PageSeo";

const Index = () => {
  const { compliancePercent, openDeviations, completedActions, dueSoon, isLoading } = useDashboardStats();
  const { modules, isLoading: modulesLoading } = useCompanyModules();
  const navigate = useNavigate();
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const { t } = useTranslate();

  // Check if IK/HMS setup is completed
  const ikHmsModule = modules.find(m => m.module_type === 'IK_HMS');
  const isSetupCompleted = ikHmsModule?.settings && (ikHmsModule.settings as any).setupCompletedAt;
  const showWelcomeBanner = !modulesLoading && !isSetupCompleted && !dismissedBanner;

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Welcome banner for new users */}
        {showWelcomeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4 md:p-6 shadow-lg"
          >
            {/* Dismiss button */}
            <button
              onClick={() => setDismissedBanner(true)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-primary/10 transition-colors"
              aria-label={t("common.close")}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              {/* Icon */}
              <div className="flex-shrink-0 p-3 md:p-4 rounded-2xl bg-gradient-primary shadow-md">
                <Rocket className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-bold">{t("dashboard.welcome")}! 🎉</h2>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                    {t("common.new")}
                  </span>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  {t("dashboard.welcomeMessage") || "La oss hjelpe deg å sette opp HMS-systemet for bedriften din. Det tar bare 5-10 minutter, og du får et skreddersydd system tilpasset din bransje."}
                </p>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/setup/ai')}
                  className="w-full md:w-auto gap-2 shadow-md hover:shadow-lg transition-shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  {t("dashboard.startSetup") || "Start oppsett nå"}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setDismissedBanner(true)}
                  className="w-full md:w-auto"
                >
                  {t("dashboard.later") || "Senere"}
                </Button>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
          </motion.div>
        )}

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t("dashboard.overview")}
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            title={t("dashboard.complianceStatus") || "Samsvarsstatus"}
            value={isLoading ? "..." : `${compliancePercent}%`}
            description={t("dashboard.meetsRequirements") || "Oppfyller krav"}
            icon={Shield}
            variant="success"
            delay={0}
            onClick={() => navigate("/setup")}
          />
          <StatsCard
            title={t("dashboard.openDeviations")}
            value={isLoading ? "..." : openDeviations}
            description={t("dashboard.requiresAction") || "Krever handling"}
            icon={AlertTriangle}
            variant="warning"
            delay={0.1}
            onClick={() => navigate("/deviations")}
          />
          <StatsCard
            title={t("dashboard.completedActions") || "Fullførte tiltak"}
            value={isLoading ? "..." : completedActions}
            description={t("dashboard.total") || "Totalt"}
            icon={CheckCircle2}
            variant="success"
            delay={0.2}
            onClick={() => navigate("/setup?step=3")}
          />
          <StatsCard
            title={t("dashboard.expiring") || "Forfallende"}
            value={isLoading ? "..." : dueSoon}
            description={t("dashboard.next7Days") || "Neste 7 dager"}
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
            
            {/* Anonymous message card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-card"
            >
              <div className="flex items-center gap-2 md:gap-3 mb-3">
                <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
                  <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <h3 className="text-base md:text-lg font-semibold">{t("dashboard.anonymousReporting") || "Anonym varsling"}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t("dashboard.anonymousDescription") || "Send en anonym melding til ledelsen om bekymringer, uønskede hendelser eller forbedringsforslag."}
              </p>
              <AnonymousMessageButton className="w-full" />
            </motion.div>
            
            {/* HMS Årshjul */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <HmsAarshjul compact />
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
