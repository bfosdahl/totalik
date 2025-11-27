import { motion } from "framer-motion";
import { 
  BookOpen, 
  Download, 
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const handbookSections = [
  {
    id: "goals",
    title: "1. Mål for internkontroll",
    status: "complete",
    lastUpdated: "2024-01-15",
    pages: 2,
  },
  {
    id: "organization",
    title: "2. Organisering og ansvar",
    status: "complete",
    lastUpdated: "2024-01-14",
    pages: 4,
  },
  {
    id: "risk",
    title: "3. Risikovurderinger",
    status: "incomplete",
    lastUpdated: "2024-01-12",
    pages: 8,
  },
  {
    id: "actions",
    title: "4. Handlingsplan",
    status: "incomplete",
    lastUpdated: null,
    pages: 0,
  },
  {
    id: "routines",
    title: "5. Rutiner og prosedyrer",
    status: "incomplete",
    lastUpdated: null,
    pages: 0,
  },
  {
    id: "deviations",
    title: "6. Avviksbehandling",
    status: "incomplete",
    lastUpdated: null,
    pages: 0,
  },
  {
    id: "audits",
    title: "7. Revisjoner og evaluering",
    status: "incomplete",
    lastUpdated: null,
    pages: 0,
  },
];

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
  const completeSections = handbookSections.filter((s) => s.status === "complete").length;
  const totalPages = handbookSections.reduce((acc, s) => acc + s.pages, 0);

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
            <Button variant="outline" className="gap-2">
              <Eye className="w-4 h-4" />
              Forhåndsvis
            </Button>
            <Button className="gap-2">
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
              <h2 className="text-xl font-bold mb-1">Demo Bedrift AS - IK Handbok</h2>
              <p className="text-primary-foreground/80 mb-4">
                Sist oppdatert: 15. januar 2024
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-3xl font-bold">{completeSections}/{handbookSections.length}</p>
                  <p className="text-sm text-primary-foreground/70">Seksjoner fullført</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{totalPages}</p>
                  <p className="text-sm text-primary-foreground/70">Sider totalt</p>
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
                const statusInfo = statusConfig[section.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-lg", statusInfo.bg)}>
                        <FileText className={cn("w-5 h-5", statusInfo.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {section.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {section.lastUpdated ? (
                            <>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Oppdatert {section.lastUpdated}
                              </span>
                              <span>•</span>
                              <span>{section.pages} sider</span>
                            </>
                          ) : (
                            <span>Ikke påbegynt</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn("w-5 h-5", statusInfo.color)} />
                        <Badge className={cn(statusInfo.bg, statusInfo.color)}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
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
              { label: "Komplett handbok", format: "PDF", icon: BookOpen },
              { label: "Kun risikovurderinger", format: "PDF", icon: AlertTriangle },
              { label: "Handlingsplan", format: "Excel", icon: FileText },
            ].map((option, index) => (
              <button
                key={index}
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
