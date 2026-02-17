import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardCheck,
  FolderOpen,
  Info,
  AlertTriangle,
  Library,
  Shield,
  FileText,
  ArrowLeft,
  Menu,
  Building2,
  LogOut,
  ChevronDown,
  ChevronRight,
  HardHat,
  FileCheck,
  FlaskConical,
  Clock,
  GanttChart,
  FileWarning,
  Wallet,
  Users,
  Briefcase,
  Settings,
  Home,
  Mail,
  Search,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Ks2ProjectSidebarProps {
  projectName: string;
  projectNumber: string;
  contractorType?: string | null;
}

// Top-level standalone items
const topMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "", guestAllowed: true },
];

// Grouped menu sections
const kvalitetssikringItems = [
  { id: "egenkontroller", label: "Egenkontroller", icon: ClipboardCheck, path: "/egenkontroller", guestAllowed: true },
  { id: "sjekklister", label: "Sjekklister", icon: ClipboardCheck, path: "/sjekklister", guestAllowed: true },
  { id: "avvik", label: "KS-avvik", icon: AlertTriangle, path: "/avvik", guestAllowed: true },
  { id: "uk", label: "Uavhengig kontroll", icon: Shield, path: "/uk", guestAllowed: true },
];

const hmsMenuItems = [
  { id: "hms-dashboard", label: "HMS-dashboard", icon: LayoutDashboard, path: "/hms", guestAllowed: true },
  { id: "hms-plan", label: "HMS-plan", icon: FileText, path: "/hms/hms-plan", guestAllowed: true },
  { id: "sha-plan", label: "SHA-plan", icon: FileCheck, path: "/hms/sha-plan", guestAllowed: true },
  { id: "sja", label: "SJA", icon: ClipboardCheck, path: "/hms/sja", guestAllowed: true },
  { id: "vernerunder", label: "Vernerunder & RUH", icon: HardHat, path: "/hms/vernerunder", guestAllowed: true },
  { id: "hms-avvik", label: "HMS-avvik", icon: AlertTriangle, path: "/hms/avvik", guestAllowed: true },
  { id: "stoffkartotek", label: "Stoffkartotek", icon: FlaskConical, path: "/hms/stoffkartotek", guestAllowed: true },
];

const byggesakItems = [
  { id: "byggesak-dashboard", label: "Byggesak-oversikt", icon: Home, path: "/byggesak", guestAllowed: false },
  { id: "byggesak-blanketter", label: "Blanketter", icon: FileText, path: "/byggesak/blanketter", guestAllowed: false },
  { id: "byggesak-epost", label: "E-post utsending", icon: Mail, path: "/byggesak/epost", guestAllowed: false },
];

const prosjektstyringItems = [
  { id: "prosjektinfo", label: "Prosjektinfo", icon: Info, path: "/prosjektinfo", guestAllowed: false },
  { id: "fremdriftsplan", label: "Fremdriftsplan", icon: GanttChart, path: "/fremdriftsplan", guestAllowed: false },
  { id: "timeregistrering", label: "Timeregistrering", icon: Clock, path: "/timeregistrering", guestAllowed: false },
  { id: "motereferater", label: "Møtereferater", icon: Users, path: "/motereferater", guestAllowed: false },
];

const okonomiFakturaItems = [
  { id: "okonomi", label: "Økonomi", icon: Wallet, path: "/okonomi", guestAllowed: false },
  { id: "endringsmeldinger", label: "Endringsmeldinger", icon: FileText, path: "/endringsmeldinger", guestAllowed: false },
  { id: "reklamasjoner", label: "Reklamasjoner", icon: FileWarning, path: "/reklamasjoner", guestAllowed: false },
];

const partnereItems = [
  { id: "underleverandorer", label: "Underleverandører", icon: Building2, path: "/underleverandorer", guestAllowed: false },
];

const dokumentasjonItems = [
  { id: "dokumentasjon", label: "Dokumentasjon & FDV", icon: FolderOpen, path: "/dokumentasjon", guestAllowed: true },
  { id: "rutiner", label: "Rutinebank", icon: FileText, path: "/rutiner", guestAllowed: false },
  { id: "malbibliotek", label: "Malbibliotek", icon: Library, path: "/maler", guestAllowed: true },
  { id: "rapport", label: "Prosjektrapport", icon: FileText, path: "/rapport", guestAllowed: true },
];

interface MenuGroup {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  items: typeof kvalitetssikringItems;
  color?: string;
}

/** Contractor types that typically manage subcontractors */
const CONTRACTOR_TYPES_WITH_SUBS = ["total", "hoved"];

function getMenuGroups(contractorType?: string | null): MenuGroup[] {
  const needsSubs = contractorType ? CONTRACTOR_TYPES_WITH_SUBS.includes(contractorType) : true;

  const groups: MenuGroup[] = [
    { id: "ks", label: "Kvalitetssikring", icon: ClipboardCheck, items: kvalitetssikringItems, color: "text-primary" },
    { id: "hms", label: "HMS / SHA", icon: Shield, items: hmsMenuItems, color: "text-emerald-500" },
    { id: "byggesak", label: "Byggesak & Blanketter", icon: Home, items: byggesakItems, color: "text-orange-500" },
    { id: "prosjekt", label: "Prosjektstyring", icon: Briefcase, items: prosjektstyringItems, color: "text-blue-500" },
    { id: "okonomi", label: "Økonomi", icon: Wallet, items: okonomiFakturaItems, color: "text-amber-500" },
    ...(needsSubs ? [{ id: "partnere", label: "Partnere", icon: Building2, items: partnereItems, color: "text-purple-500" }] : []),
    { id: "dokumenter", label: "Dokumentasjon", icon: FolderOpen, items: dokumentasjonItems, color: "text-cyan-500" },
  ];

  return groups;
}

export function Ks2ProjectSidebar({ projectName, projectNumber, contractorType }: Ks2ProjectSidebarProps) {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isGuestUser, guestProjects, signOut, profile } = useAuth();

  const basePath = `/ks/project/${projectId}`;
  const currentPath = location.pathname.replace(basePath, "") || "";

  // Determine which groups should be open based on current path
  const getActiveGroupId = (): string | null => {
    for (const group of menuGroups) {
      if (group.items.some(item => currentPath === item.path || currentPath.startsWith(item.path + "/"))) {
        return group.id;
      }
    }
    return null;
  };

  const activeGroupId = getActiveGroupId();
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (activeGroupId) initial.add(activeGroupId);
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Filter menu items based on guest access
  const filterByGuest = <T extends { guestAllowed: boolean }>(items: T[]) => 
    isGuestUser ? items.filter(item => item.guestAllowed) : items;

  // Get guest role info
  const currentGuestProject = guestProjects.find(p => p.project_id === projectId);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + key combinations
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            navigate(`${basePath}/egenkontroller`);
            break;
          case "2":
            e.preventDefault();
            navigate(`${basePath}/avvik`);
            break;
          case "3":
            e.preventDefault();
            navigate(`${basePath}/hms/sja`);
            break;
          case "d":
            e.preventDefault();
            navigate(basePath);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, basePath]);

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
              navigate("/ks");
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
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Top-level items (Dashboard) */}
        <TooltipProvider delayDuration={400}>
          {filterByGuest(topMenuItems).map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      navigate(`${basePath}${item.path}`);
                      onNavigate?.();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-60">
                      ⌘D
                    </kbd>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden lg:block">
                  <p>Snarvei: ⌘D</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {/* Grouped Menu Sections */}
        {menuGroups.map((group) => {
          const filteredItems = filterByGuest(group.items);
          if (filteredItems.length === 0) return null;

          const isGroupOpen = openGroups.has(group.id);
          const hasActiveItem = filteredItems.some(item => 
            currentPath === item.path || currentPath.startsWith(item.path + "/")
          );
          const Icon = group.icon;

          return (
            <Collapsible key={group.id} open={isGroupOpen} onOpenChange={() => toggleGroup(group.id)}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    hasActiveItem
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", group.color)} />
                  <span className="flex-1 text-left">{group.label}</span>
                  {isGroupOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-0.5 mt-1">
                {filteredItems.map((item) => {
                  const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
                  const ItemIcon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(`${basePath}${item.path}`);
                        onNavigate?.();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/90 text-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <ItemIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
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
        <p className="text-xs text-sidebar-foreground/50">KS Bygg</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button - positioned to not overlap with content */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="bg-background shadow-md h-10 w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[85vw] max-w-[300px] bg-sidebar text-sidebar-foreground">
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
