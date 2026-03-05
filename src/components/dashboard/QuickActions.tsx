import { motion } from "framer-motion";
import { 
  Plus, 
  FileText, 
  AlertTriangle, 
  ClipboardCheck,
  Download,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useTranslate } from "@/hooks/useTranslate";

interface QuickAction {
  icon: typeof Plus;
  labelKey: string;
  descriptionKey: string;
  variant: "primary" | "accent" | "secondary";
  path?: string;
}

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslate();

  const actions: QuickAction[] = [
    {
      icon: AlertTriangle,
      labelKey: "dashboard.registerDeviation",
      descriptionKey: "dashboard.logNewDeviation",
      variant: "primary",
      path: "/deviations",
    },
    {
      icon: ClipboardCheck,
      labelKey: "dashboard.startAudit",
      descriptionKey: "dashboard.internalReview",
      variant: "accent",
      path: "/audits",
    },
    {
      icon: FileText,
      labelKey: "dashboard.newRoutine",
      descriptionKey: "dashboard.addProcedure",
      variant: "secondary",
      path: "/setup?step=routines",
    },
    {
      icon: Download,
      labelKey: "dashboard.exportHandbook",
      descriptionKey: "dashboard.downloadPdf",
      variant: "secondary",
      path: "/handbook",
    },
  ];

  const variantStyles = {
    primary: "bg-gradient-primary text-primary-foreground hover:shadow-lg",
    accent: "bg-gradient-accent text-accent-foreground hover:shadow-lg",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  };

  const handleClick = (action: QuickAction) => {
    if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-card"
    >
      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">{t("dashboard.quickActions")}</h3>
      
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.labelKey}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.5 + index * 0.1 }}
            onClick={() => handleClick(action)}
            className={cn(
              "flex flex-col items-start p-3 md:p-4 rounded-xl transition-all duration-200 text-left cursor-pointer",
              variantStyles[action.variant]
            )}
          >
            <action.icon className="w-4 h-4 md:w-5 md:h-5 mb-1.5 md:mb-2" />
            <span className="font-medium text-xs md:text-sm">{t(action.labelKey)}</span>
            <span className="text-xs opacity-80 hidden sm:block">{t(action.descriptionKey)}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}