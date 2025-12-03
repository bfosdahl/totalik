import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardCheck,
  ClipboardList,
  FolderOpen,
  Info,
  AlertTriangle,
  Library,
  Shield,
  FileText,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface Ks2ProjectSidebarProps {
  projectName: string;
  projectNumber: string;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "" },
  { id: "egenkontroller", label: "Egenkontroller", icon: ClipboardCheck, path: "/egenkontroller" },
  { id: "sjekklister", label: "Sjekklister", icon: ClipboardList, path: "/sjekklister" },
  { id: "dokumentasjon", label: "Dokumentasjon & FDV", icon: FolderOpen, path: "/dokumentasjon" },
  { id: "prosjektinfo", label: "Prosjektinfo", icon: Info, path: "/prosjektinfo" },
  { id: "avvik", label: "Avvik fra KS", icon: AlertTriangle, path: "/avvik" },
  { id: "uk", label: "Uavhengig kontroll", icon: Shield, path: "/uk" },
  { id: "malbibliotek", label: "Malbibliotek", icon: Library, path: "/maler" },
  { id: "rapport", label: "Prosjektrapport", icon: FileText, path: "/rapport" },
];

export function Ks2ProjectSidebar({ projectName, projectNumber }: Ks2ProjectSidebarProps) {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const basePath = `/ks2/project/${projectId}`;
  const currentPath = location.pathname.replace(basePath, "") || "";

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground mb-3 -ml-2"
          onClick={() => {
            navigate("/ks2");
            onNavigate?.();
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Alle prosjekter
        </Button>
        <div>
          <p className="text-xs text-sidebar-foreground/60 font-medium">{projectNumber}</p>
          <h2 className="font-semibold text-lg text-sidebar-foreground truncate">{projectName}</h2>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(`${basePath}${item.path}`);
                onNavigate?.();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50">KS Modul #2</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="bg-background">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] bg-sidebar text-sidebar-foreground">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-[260px] bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-40">
        <SidebarContent />
      </div>
    </>
  );
}
