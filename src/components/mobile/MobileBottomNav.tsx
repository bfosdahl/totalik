import { useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  ClipboardCheck, 
  AlertTriangle, 
  FolderOpen,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface MobileBottomNavProps {
  projectId: string;
  onMenuClick?: () => void;
}

export function MobileBottomNav({ projectId, onMenuClick }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Don't render on desktop
  if (!isMobile) return null;

  const basePath = `/ks/project/${projectId}`;

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Oversikt",
      icon: <Home className="h-5 w-5" />,
      path: basePath,
    },
    {
      id: "checklists",
      label: "Sjekklister",
      icon: <ClipboardCheck className="h-5 w-5" />,
      path: `${basePath}/egenkontroller`,
    },
    {
      id: "deviations",
      label: "Avvik",
      icon: <AlertTriangle className="h-5 w-5" />,
      path: `${basePath}/avvik`,
    },
    {
      id: "documents",
      label: "Dokumenter",
      icon: <FolderOpen className="h-5 w-5" />,
      path: `${basePath}/dokumentasjon`,
    },
  ];

  const isActive = (path: string) => {
    if (path === basePath) {
      return location.pathname === basePath;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="mobile-action-bar flex items-center justify-around">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate(item.path)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors",
            isActive(item.path)
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.icon}
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
      
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span className="text-xs font-medium">Meny</span>
        </button>
      )}
    </nav>
  );
}
