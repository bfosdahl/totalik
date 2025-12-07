import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Plus, 
  ClipboardCheck, 
  AlertTriangle, 
  Camera, 
  FileText,
  X,
  Shield,
  HardHat
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  path?: string;
  onClick?: () => void;
}

interface MobileQuickActionsProps {
  actions?: QuickAction[];
  projectId?: string;
}

export function MobileQuickActions({ actions, projectId }: MobileQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Don't render on desktop
  if (!isMobile) return null;

  // Default actions for KS2 projects
  const defaultActions: QuickAction[] = projectId ? [
    {
      id: "checklist",
      label: "Ny sjekkliste",
      icon: <ClipboardCheck className="h-6 w-6" />,
      color: "bg-primary text-primary-foreground",
      path: `/ks2/prosjekter/${projectId}/egenkontroller`,
    },
    {
      id: "deviation",
      label: "Registrer avvik",
      icon: <AlertTriangle className="h-6 w-6" />,
      color: "bg-destructive text-destructive-foreground",
      path: `/ks2/prosjekter/${projectId}/avvik`,
    },
    {
      id: "vernerunde",
      label: "Ny vernerunde",
      icon: <Shield className="h-6 w-6" />,
      color: "bg-green-600 text-white",
      path: `/ks2/prosjekter/${projectId}/hms/vernerunder`,
    },
    {
      id: "sja",
      label: "Ny SJA",
      icon: <HardHat className="h-6 w-6" />,
      color: "bg-amber-600 text-white",
      path: `/ks2/prosjekter/${projectId}/hms/sja`,
    },
  ] : [];

  const actionList = actions || defaultActions;

  const handleAction = (action: QuickAction) => {
    setIsOpen(false);
    if (action.onClick) {
      action.onClick();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  // Don't show if no project context
  if (!projectId && !actions) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action menu */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col-reverse gap-3 animate-scale-in">
          {actionList.map((action, index) => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg",
                "transition-all duration-200 active:scale-95",
                action.color
              )}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {action.icon}
              <span className="font-medium text-sm whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fab-button",
          isOpen 
            ? "bg-muted text-foreground rotate-45" 
            : "bg-primary text-primary-foreground"
        )}
        aria-label={isOpen ? "Lukk hurtigmeny" : "Åpne hurtigmeny"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </button>
    </>
  );
}
