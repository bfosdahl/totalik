import { useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Shield, 
  AlertTriangle, 
  Clock,
  Users,
  Menu,
  X,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const mainNavItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Hjem",
    icon: <Home className="h-5 w-5" />,
    path: "/",
  },
  {
    id: "projects",
    label: "Prosjekt",
    icon: <Briefcase className="h-5 w-5" />,
    path: "/prosjekt-hub",
  },
  {
    id: "deviations",
    label: "Avvik",
    icon: <AlertTriangle className="h-5 w-5" />,
    path: "/deviations",
  },
  {
    id: "time",
    label: "Timer",
    icon: <Clock className="h-5 w-5" />,
    path: "/time-registration",
  },
];

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showMore, setShowMore] = useState(false);

  // Don't render on desktop
  if (!isMobile) return null;

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const moreItems = [
    { label: "Ansatte", icon: <Users className="h-5 w-5" />, path: "/employees" },
    { label: "Rutiner", icon: <Shield className="h-5 w-5" />, path: "/rutiner" },
    { label: "Innstillinger", icon: <Menu className="h-5 w-5" />, path: "/settings" },
  ];

  return (
    <>
      {/* Bottom Navigation */}
      <nav className={cn("mobile-bottom-nav", className)}>
        <div className="flex items-center justify-around px-2 py-1">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "mobile-bottom-nav-item",
                isActive(item.path) && "active"
              )}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowMore(true)}
            className="mobile-bottom-nav-item"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">Mer</span>
          </button>
        </div>
      </nav>

      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl border-t border-border"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="sheet-handle" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Flere valg</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMore(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {moreItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setShowMore(false);
                      }}
                      className="icon-action-lg"
                    >
                      {item.icon}
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
