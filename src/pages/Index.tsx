import { motion } from "framer-motion";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  FileCheck,
  TrendingUp
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ComplianceProgress } from "@/components/dashboard/ComplianceProgress";
import { RecentDeviations } from "@/components/dashboard/RecentDeviations";
import { QuickActions } from "@/components/dashboard/QuickActions";

const Index = () => {
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
            value="78%"
            description="Oppfyller krav"
            icon={Shield}
            variant="success"
            trend={{ value: 5, isPositive: true }}
            delay={0}
          />
          <StatsCard
            title="Åpne avvik"
            value={12}
            description="Krever handling"
            icon={AlertTriangle}
            variant="warning"
            delay={0.1}
          />
          <StatsCard
            title="Fullførte tiltak"
            value={47}
            description="Denne måneden"
            icon={CheckCircle2}
            variant="success"
            trend={{ value: 12, isPositive: true }}
            delay={0.2}
          />
          <StatsCard
            title="Forfallende"
            value={3}
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
              
              <div className="space-y-3">
                {[
                  { name: "HMS-gjennomgang", date: "20. jan 2024", type: "Årlig" },
                  { name: "Brannrutiner", date: "25. jan 2024", type: "Kvartalsvis" },
                  { name: "Førstehjelpsutstyr", date: "1. feb 2024", type: "Månedlig" },
                ].map((review, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.type}</p>
                    </div>
                    <span className="text-xs font-medium text-primary">
                      {review.date}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
