import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  ClipboardCheck, 
  AlertTriangle, 
  HardHat,
  FileText,
  Clock,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  icon: typeof Plus;
  path: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { 
    id: "timer", 
    label: "Registrer timer", 
    icon: Clock, 
    path: "/timer",
    color: "bg-primary text-primary-foreground"
  },
  { 
    id: "egenkontroll", 
    label: "Ny egenkontroll", 
    icon: ClipboardCheck, 
    path: "/egenkontroller?new=true",
    color: "bg-sky-500 text-white"
  },
  { 
    id: "avvik", 
    label: "Registrer avvik", 
    icon: AlertTriangle, 
    path: "/avvik?new=true",
    color: "bg-orange-500 text-white"
  },
  { 
    id: "sja", 
    label: "Ny SJA", 
    icon: FileText, 
    path: "/hms/sja?new=true",
    color: "bg-emerald-500 text-white"
  },
  { 
    id: "vernerunde", 
    label: "Ny vernerunde", 
    icon: HardHat, 
    path: "/hms/vernerunder?new=true",
    color: "bg-blue-500 text-white"
  },
];

export function Ks2FloatingActions() {
  const [isOpen, setIsOpen] = useState(false);
  const { projectId } = useParams();
  const navigate = useNavigate();
  const basePath = `/ks/project/${projectId}`;

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(`${basePath}${path}`);
  };

  return (
    <div className="lg:hidden fixed z-50" style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))', right: '1rem' }}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Action buttons */}
            <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 20, 
                    scale: 0.8,
                    transition: { delay: (quickActions.length - index) * 0.03 }
                  }}
                  onClick={() => handleAction(action.path)}
                  className="flex items-center gap-2 pl-3 pr-2 py-2 bg-card rounded-full shadow-lg border"
                >
                  <span className="text-sm font-medium whitespace-nowrap">
                    {action.label}
                  </span>
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center",
                    action.color
                  )}>
                    <action.icon className="h-4 w-4" />
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-colors",
          isOpen 
            ? "bg-muted text-muted-foreground" 
            : "bg-primary text-primary-foreground"
        )}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
}
