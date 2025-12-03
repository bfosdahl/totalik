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
  BookOpen,
  ArrowLeft,
  Menu,
  X,
  Building2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

interface Ks2ProjectSidebarProps {
  projectName: string;
  projectNumber: string;
}

const allMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "", guestAllowed: true },
  { id: "egenkontroller", label: "Egenkontroller", icon: ClipboardCheck, path: "/egenkontroller", guestAllowed: true },
  { id: "sjekklister", label: "Sjekklister", icon: ClipboardList, path: "/sjekklister", guestAllowed: true },
  { id: "rutiner", label: "Rutinebank", icon: BookOpen, path: "/rutiner", guestAllowed: false },
  { id: "dokumentasjon", label: "Dokumentasjon & FDV", icon: FolderOpen, path: "/dokumentasjon", guestAllowed: true },
  { id: "prosjektinfo", label: "Prosjektinfo", icon: Info, path: "/prosjektinfo", guestAllowed: false },
  { id: "underleverandorer", label: "Underleverandører", icon: Building2, path: "/underleverandorer", guestAllowed: false },
  { id: "avvik", label: "Avvik fra KS", icon: AlertTriangle, path: "/avvik", guestAllowed: true },
  { id: "uk", label: "Uavhengig kontroll", icon: Shield, path: "/uk", guestAllowed: true },
  { id: "malbibliotek", label: "Malbibliotek", icon: Library, path: "/maler", guestAllowed: true },
  { id: "rapport", label: "Prosjektrapport", icon: FileText, path: "/rapport", guestAllowed: true },
];

export function Ks2ProjectSidebar({ projectName, projectNumber }: Ks2ProjectSidebarProps) {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isGuestUser, guestProjects, signOut, profile } = useAuth();

  const basePath = `/ks2/project/${projectId}`;
  const currentPath = location.pathname.replace(basePath, "") || "";

  // Filter menu items based on guest access
  const menuItems = isGuestUser 
    ? allMenuItems.filter(item => item.guestAllowed)
    : allMenuItems;

  // Get guest role info
  const currentGuestProject = guestProjects.find(p => p.project_id === projectId);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        {!isGuestUser && (
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
        )}
        {isGuestUser && currentGuestProject && (
          <div className="mb-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary font-medium">Gjestetilgang</p>
            <p className="text-xs text-sidebar-foreground/70">{currentGuestProject.role_in_project}</p>
          </div>
        )}
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
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {isGuestUser && (
          <div className="text-xs text-sidebar-foreground/70 mb-2">
            <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
            <p>{profile?.email}</p>
          </div>
        )}
        {isGuestUser && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logg ut
          </Button>
        )}
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
