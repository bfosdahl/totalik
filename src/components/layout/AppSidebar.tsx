import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  FileCheck,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
  ShieldCheck,
  X,
  Users,
  HardHat,
  ChevronDown,
  ChevronUp,
  Lock,
  MessageCircle,
  ListChecks,
  Clock,
  CalendarDays,
  Calendar,
  Briefcase,
  UserCircle,
  FileText,
  UserCheck,
  BarChart3,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";

// Standard navigation items - always visible
const standardNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Settings, label: "Innstillinger", path: "/settings" },
];

// IK/HMS module items - shown in collapsible section
const ikHmsItems = [
  { icon: ClipboardList, label: "Oppsett", path: "/setup" },
  { icon: Shield, label: "AI Oppsett", path: "/setup/ai" },
  { icon: AlertTriangle, label: "Risikovurdering", path: "/setup?step=2" },
  { icon: ListChecks, label: "Handlingsplan", path: "/setup?step=3" },
  { icon: AlertTriangle, label: "Avvik", path: "/deviations" },
  { icon: FileCheck, label: "HMS aktiviteter", path: "/audits" },
  { icon: BookOpen, label: "Handbok", path: "/handbook" },
  { icon: MessageCircle, label: "HMS Assistent", path: "/hms-chat" },
];

// Personaladministrasjon items - standard for all companies
const personaladministrasjonItems = {
  mineAnsatte: [
    { icon: Users, label: "Ansattoversikt", path: "/employees" },
    { icon: FileText, label: "Ansettelsesavtaler", path: "/hr/contracts" },
    { icon: HeartPulse, label: "Fravær", path: "/hr/absence" },
    { icon: UserCheck, label: "Medarbeidersamtaler", path: "/hr/meetings" },
    { icon: BarChart3, label: "Undersøkelser", path: "/hr/surveys" },
    { icon: CalendarDays, label: "Godkjenn ferie", path: "/time-off?view=admin" },
    { icon: Calendar, label: "Arbeidsplan", path: "/work-schedule" },
    { icon: Clock, label: "Godkjenn timer", path: "/time-registration?view=admin" },
  ],
  mittArbeidsforhold: [
    { icon: Clock, label: "Mine timer", path: "/time-registration" },
    { icon: CalendarDays, label: "Min ferie", path: "/time-off" },
    { icon: HeartPulse, label: "Mitt fravær", path: "/my/absence" },
    { icon: BarChart3, label: "Min respons", path: "/my/surveys" },
  ],
};

const ksByggItems = [
  { label: "Prosjekt", path: "/ks/projects" },
  { label: "Sjekklister", path: "/ks/checklists" },
  { label: "Rutiner", path: "/ks/routines" },
  { label: "Maler", path: "/ks/templates" },
  { label: "SJA", path: "/ks/sja" },
  { label: "Avvik", path: "/ks/avvik" },
  { label: "Vernerunder", path: "/ks/vernerunder" },
  { label: "Befaringer", path: "/ks/befaringer" },
  { label: "Farlige forhold", path: "/ks/farlige-fohold" },
  { label: "Tiltakslogg", path: "/ks/tiltakslogg" },
  { label: "Sjekkliste Generator", path: "/ks/checklist-generator" },
  { label: "Prosjektperm PDF", path: "/ks/report" },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [ksByggExpanded, setKsByggExpanded] = useState(false);
  const [ikMatExpanded, setIkMatExpanded] = useState(false);
  const [ikHmsExpanded, setIkHmsExpanded] = useState(true); // IK/HMS starts expanded by default
  const [personalExpanded, setPersonalExpanded] = useState(true); // Personaladministrasjon starts expanded
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, company, isSystemAdmin, isCompanyAdmin } = useAuth();
  const { hasModule } = useCompanyModules();
  
  // Check if KS Bygg module is active for this company
  const hasKsBygg = hasModule("IK_BYGG");

  // Get company name from context
  const companyName = company?.name || "Ingen bedrift";
  const orgNumber = company?.org_number || null;

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out",
          collapsed ? "w-20" : "w-[280px]",
          "lg:translate-x-0 lg:pointer-events-auto",
          isOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none lg:pointer-events-auto"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 px-5 h-16 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col"
                >
                  <span className="font-bold text-sidebar-foreground text-lg tracking-tight">
                    Total-IK
                  </span>
                  <span className="text-xs text-sidebar-foreground/60">
                    HMS, BYGG, MAT
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-sidebar-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Company selector */}
        <div className="px-3 py-4 border-b border-sidebar-border">
          <button className={cn(
            "flex items-center gap-3 w-full p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors",
            collapsed && "justify-center"
          )}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
              <Building2 className="w-4 h-4 text-sidebar-primary" />
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-start text-left min-w-0"
                >
                  <span className="text-sm font-medium text-sidebar-foreground truncate w-full">
                    {companyName}
                  </span>
                  <span className="text-xs text-sidebar-foreground/60">
                    {orgNumber ? `Org: ${orgNumber}` : "Ikke tilknyttet"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
          {/* Standard navigation items - always visible */}
          {standardNavItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  collapsed && "justify-center",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform",
                  !isActive && "group-hover:scale-110"
                )} />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}

          {/* IK/HMS collapsible section - always present as standard module */}
          <div>
            <button
              onClick={() => setIkHmsExpanded(!ikHmsExpanded)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
                collapsed && "justify-center",
                "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Shield className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform",
                "group-hover:scale-110"
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium text-sm flex-1 text-left"
                    >
                      IK/HMS
                    </motion.span>
                    {ikHmsExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </>
                )}
              </AnimatePresence>
            </button>
            
            {/* IK/HMS submenu */}
            <AnimatePresence>
              {ikHmsExpanded && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 space-y-1 mt-1">
                    {ikHmsItems.map((item) => {
                      // Handle query parameter matching for setup steps
                      const hasQueryParam = item.path.includes("?");
                      let isActive = false;
                      
                      if (hasQueryParam) {
                        const [basePath, queryString] = item.path.split("?");
                        const itemParams = new URLSearchParams(queryString);
                        const currentParams = new URLSearchParams(location.search);
                        isActive = location.pathname === basePath && 
                          itemParams.get("step") === currentParams.get("step");
                      } else {
                        isActive = location.pathname === item.path || 
                          (item.path !== "/" && item.path !== "/setup" && location.pathname.startsWith(item.path));
                      }
                      
                      // Force navigation for query parameter changes on same base path
                      const handleClick = (e: React.MouseEvent) => {
                        if (hasQueryParam) {
                          e.preventDefault();
                          navigate(item.path);
                        }
                      };
                      
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={handleClick}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                            isActive
                              ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          )}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Personaladministrasjon collapsible section - standard for all companies */}
          <div>
            <button
              onClick={() => setPersonalExpanded(!personalExpanded)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
                collapsed && "justify-center",
                "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Briefcase className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform",
                "group-hover:scale-110"
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium text-sm flex-1 text-left"
                    >
                      Personaladministrasjon
                    </motion.span>
                    {personalExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </>
                )}
              </AnimatePresence>
            </button>
            
            {/* Personaladministrasjon submenu */}
            <AnimatePresence>
              {personalExpanded && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 space-y-1 mt-1">
                    {/* Mine ansatte section - only for admins */}
                    {(isSystemAdmin || isCompanyAdmin) && (
                      <>
                        <div className="py-1.5 px-3">
                          <span className="text-xs font-medium text-sidebar-foreground/50 uppercase">
                            Mine ansatte
                          </span>
                        </div>
                        {personaladministrasjonItems.mineAnsatte.map((item) => {
                          const isActive = location.pathname === item.path.split('?')[0];
                          
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                                isActive
                                  ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                              )}
                            >
                              <item.icon className="w-4 h-4 flex-shrink-0" />
                              <span>{item.label}</span>
                            </NavLink>
                          );
                        })}
                      </>
                    )}
                    
                    {/* Mitt arbeidsforhold section - for all employees */}
                    <div className="py-1.5 px-3">
                      <span className="text-xs font-medium text-sidebar-foreground/50 uppercase">
                        Mitt arbeidsforhold
                      </span>
                    </div>
                    {personaladministrasjonItems.mittArbeidsforhold.map((item) => {
                      const isActive = location.pathname === item.path;
                      
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                            isActive
                              ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          )}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* IK/MAT collapsible section - similar to KS Bygg */}
          {hasModule("IK_MAT") && (
            <div>
              <button
                onClick={() => setIkMatExpanded(!ikMatExpanded)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
                  collapsed && "justify-center",
                  location.pathname.startsWith("/ik-mat")
                    ? "text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <ShieldCheck className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform",
                  !location.pathname.startsWith("/ik-mat") && "group-hover:scale-110"
                )} />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <>
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="font-medium text-sm flex-1 text-left"
                      >
                        IK/MAT
                      </motion.span>
                      {ikMatExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </>
                  )}
                </AnimatePresence>
              </button>
              
              {/* IK/MAT submenu */}
              <AnimatePresence>
                {ikMatExpanded && !collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-6 space-y-1 mt-1">
                      <NavLink
                        to="/ik-mat/handbok"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          location.pathname === "/ik-mat/handbok"
                            ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        Håndbok
                      </NavLink>
                      <NavLink
                        to="/ik-mat/oppsett"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          location.pathname === "/ik-mat/oppsett"
                            ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        Oppsett
                      </NavLink>
                      <NavLink
                        to="/ik-mat/haccp"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          location.pathname === "/ik-mat/haccp"
                            ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        HACCP / KKP
                      </NavLink>
                      <NavLink
                        to="/ik-mat/risikovurdering"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          location.pathname === "/ik-mat/risikovurdering"
                            ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        Risikovurdering
                      </NavLink>
                      <NavLink
                        to="/ik-mat/sjekklister"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          location.pathname === "/ik-mat/sjekklister"
                            ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        Sjekklister
                      </NavLink>
                      <NavLink
                        to="/ik-mat/renholdsplan"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          location.pathname === "/ik-mat/renholdsplan"
                            ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        Renholdsplan
                      </NavLink>
                      <NavLink
                        to="/ik-mat/allergener"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          location.pathname === "/ik-mat/allergener"
                            ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        Allergener
                      </NavLink>
                      <NavLink
                        to="/ik-mat/faste-avtaler"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          location.pathname === "/ik-mat/faste-avtaler"
                            ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        Faste avtaler
                      </NavLink>
                      <NavLink
                        to="/ik-mat/sporbarhet"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                          location.pathname === "/ik-mat/sporbarhet"
                            ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        Sporbarhet
                      </NavLink>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* KS Bygg collapsible section - visible but locked if module not active */}
          <div className={cn(!hasKsBygg && "opacity-60")}>
            <button
              onClick={() => hasKsBygg && setKsByggExpanded(!ksByggExpanded)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
                collapsed && "justify-center",
                !hasKsBygg && "cursor-not-allowed",
                hasKsBygg && location.pathname.startsWith("/ks")
                  ? "text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                !hasKsBygg && "hover:bg-transparent"
              )}
              title={!hasKsBygg ? "Denne modulen er ikke aktivert for din bedrift" : undefined}
            >
              <HardHat className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform",
                hasKsBygg && !location.pathname.startsWith("/ks") && "group-hover:scale-110"
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium text-sm flex-1 text-left"
                    >
                      KS Bygg
                    </motion.span>
                    {!hasKsBygg ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : ksByggExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </>
                )}
              </AnimatePresence>
            </button>
            
            {/* Locked module message */}
            {!hasKsBygg && !collapsed && (
              <div className="pl-6 pr-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Kontakt oss for å aktivere denne modulen
                </p>
              </div>
            )}
            
            {/* KS Bygg submenu - only when active */}
            <AnimatePresence>
              {hasKsBygg && ksByggExpanded && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 space-y-1 mt-1">
                    {ksByggItems.map((item) => {
                      const isActive = location.pathname === item.path ||
                        location.pathname.startsWith(item.path + "/");
                      
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                            isActive
                              ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          )}
                        >
                          {item.label}
                        </NavLink>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Admin link for system admins */}
          {isSystemAdmin && (
            <>
              <div className="pt-4 pb-2">
                {!collapsed && (
                  <span className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase">
                    Administrasjon
                  </span>
                )}
              </div>
              <NavLink
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  collapsed && "justify-center",
                  location.pathname.startsWith("/admin")
                    ? "bg-warning text-warning-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <ShieldCheck className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform",
                  !location.pathname.startsWith("/admin") && "group-hover:scale-110"
                )} />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium text-sm"
                    >
                      Admin Panel
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            </>
          )}
        </nav>

        {/* Collapse toggle - hidden on mobile */}
        <div className="p-3 border-t border-sidebar-border hidden lg:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "px-0"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Minimer</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
