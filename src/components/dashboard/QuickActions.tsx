import { motion } from "framer-motion";
import { 
  Plus, 
  FileText, 
  AlertTriangle, 
  ClipboardCheck,
  Download,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  icon: typeof Plus;
  label: string;
  description: string;
  variant: "primary" | "accent" | "secondary";
  path?: string;
  action?: string;
}

export function QuickActions() {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      icon: AlertTriangle,
      label: "Registrer avvik",
      description: "Logg nytt avvik",
      variant: "primary",
      path: "/deviations",
    },
    {
      icon: ClipboardCheck,
      label: "Start revisjon",
      description: "Intern gjennomgang",
      variant: "accent",
      path: "/audits",
    },
    {
      icon: FileText,
      label: "Ny rutine",
      description: "Legg til prosedyre",
      variant: "secondary",
      path: "/setup?step=routines",
    },
    {
      icon: Download,
      label: "Eksporter handbok",
      description: "Last ned PDF",
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
      className="bg-card rounded-xl border border-border p-6 shadow-card"
    >
      <h3 className="text-lg font-semibold mb-4">Hurtighandlinger</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.5 + index * 0.1 }}
            onClick={() => handleClick(action)}
            className={cn(
              "flex flex-col items-start p-4 rounded-xl transition-all duration-200 text-left cursor-pointer",
              variantStyles[action.variant]
            )}
          >
            <action.icon className="w-5 h-5 mb-2" />
            <span className="font-medium text-sm">{action.label}</span>
            <span className="text-xs opacity-80">{action.description}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
