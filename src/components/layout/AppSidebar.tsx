import { useState, useEffect, useMemo, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslate } from "@/hooks/useTranslate";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  FileCheck,
  BookOpen,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
  ShieldCheck,
  ClipboardCheck,
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
  ShieldAlert,
  Scale,
  FlaskConical,
  ShoppingCart,
  FolderOpen,
  Target,
  Wine,
  Thermometer,
  SprayCan,
  Wheat,
  Handshake,
  Search,
  Mail,
  Car,
  Printer,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { SubmitAnonymousMessageDialog } from "@/components/anonymous/SubmitAnonymousMessageDialog";
import { OrderModuleDialog } from "@/components/modules/OrderModuleDialog";
import { useModulePricing } from "@/hooks/useModulePricing";
import { useDepartmentContext } from "@/contexts/DepartmentContext";

// Standard navigation items - always visible
const standardNavItems = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/", color: "text-sky-500" },
  { icon: HelpCircle, labelKey: "nav.userGuide", path: "/brukerveiledning", color: "text-blue-500" },
  { icon: Settings, labelKey: "nav.settings", path: "/settings", color: "text-slate-400" },
];

// IK/HMS module items - shown in collapsible section
const ikHmsItems = [
  { icon: ClipboardList, labelKey: "nav.setup", path: "/setup", color: "text-emerald-500" },
  { icon: Target, labelKey: "nav.targetSetting", path: "/maalsetting", color: "text-yellow-500" },
  { icon: Building2, labelKey: "nav.organization", path: "/organisering", color: "text-sky-500" },
  { 
    icon: AlertTriangle, 
    labelKey: "nav.riskAnalysis", 
    path: "/risikoanalyse", 
    color: "text-orange-500",
    children: [
      { icon: ClipboardList, labelKey: "nav.riskAssessmentAndActionPlan", path: "/risikoanalyse", color: "text-orange-500" },
      { icon: CalendarDays, labelKey: "nav.followUp", path: "/risikoanalyse?tab=oppfolging", color: "text-teal-500" },
      { icon: FileCheck, labelKey: "nav.sja", path: "/risikoanalyse?tab=sja", color: "text-blue-500" },
    ]
  },
  { icon: ListChecks, labelKey: "nav.routines", path: "/rutiner", color: "text-teal-500" },
  { icon: FlaskConical, labelKey: "nav.chemicalRegistry", path: "/stoffkartotek", color: "text-purple-500" },
  { icon: Scale, labelKey: "nav.laws", path: "/lover-og-forskrifter", color: "text-indigo-500" },
  { icon: AlertTriangle, labelKey: "nav.deviations", path: "/deviations", color: "text-red-500" },
  { icon: FileCheck, labelKey: "nav.hmsActivities", path: "/audits", color: "text-blue-500" },
  { icon: BookOpen, labelKey: "nav.handbook", path: "/handbook", color: "text-cyan-500" },
  { icon: FolderOpen, labelKey: "nav.documentCenter", path: "/dokumentsenter", color: "text-amber-500" },
  { icon: MessageCircle, labelKey: "nav.hmsAssistant", path: "/hms-chat", color: "text-violet-500" },
];

// IK/MAT module items - shown in collapsible section
const ikMatItems = [
  { icon: BookOpen, labelKey: "nav.handbookIkMat", path: "/ik-mat/handbok", color: "text-cyan-500" },
  { icon: Target, labelKey: "nav.targetSetting", path: "/ik-mat/maal", color: "text-yellow-500" },
  { icon: Building2, labelKey: "nav.orgChart", path: "/ik-mat/organisasjon", color: "text-sky-500" },
  { icon: AlertTriangle, labelKey: "nav.riskAndMeasures", path: "/ik-mat/risiko-og-tiltak", color: "text-orange-500" },
  { icon: ListChecks, labelKey: "nav.routines", path: "/ik-mat/rutiner", color: "text-teal-500" },
  { icon: ClipboardCheck, labelKey: "nav.control", path: "/ik-mat/kontroll", color: "text-emerald-500" },
  { icon: AlertTriangle, labelKey: "nav.deviations", path: "/ik-mat/avvik", color: "text-red-500" },
  { icon: Wheat, labelKey: "nav.allergens", path: "/ik-mat/allergener", color: "text-amber-500" },
  { icon: Handshake, labelKey: "nav.fixedAgreements", path: "/ik-mat/faste-avtaler", color: "text-indigo-500" },
  { icon: FolderOpen, labelKey: "nav.documentCenter", path: "/ik-mat/dokumentsenter", color: "text-slate-500" },
];

// Personaladministrasjon items - standard for all companies
const personaladministrasjonItems = {
  mineAnsatte: [
    { icon: Users, labelKey: "nav.employeeOverview", path: "/employees", color: "text-blue-500" },
    { icon: FileText, labelKey: "nav.employmentContracts", path: "/hr/contracts", color: "text-slate-500" },
    { icon: HeartPulse, labelKey: "nav.absence", path: "/hr/absence", color: "text-rose-500" },
    { icon: UserCheck, labelKey: "nav.performanceReviews", path: "/hr/meetings", color: "text-emerald-500" },
    { icon: BarChart3, labelKey: "nav.surveys", path: "/hr/surveys", color: "text-purple-500" },
    { icon: CalendarDays, labelKey: "nav.approveVacation", path: "/time-off?view=admin", color: "text-orange-500" },
    { icon: Calendar, labelKey: "nav.workSchedule", path: "/work-schedule", color: "text-cyan-500" },
    { icon: Clock, labelKey: "nav.approveHours", path: "/time-registration?view=admin", color: "text-indigo-500" },
    { icon: ShieldAlert, labelKey: "nav.anonymousMessages", path: "/anonymous-messages", color: "text-amber-500" },
  ],
  mittArbeidsforhold: [
    { icon: FileText, labelKey: "nav.myContract", path: "/my/contract", color: "text-slate-500" },
    { icon: Clock, labelKey: "nav.myHours", path: "/time-registration", color: "text-indigo-500" },
    { icon: CalendarDays, labelKey: "nav.myVacation", path: "/time-off", color: "text-orange-500" },
    { icon: HeartPulse, labelKey: "nav.myAbsence", path: "/my/absence", color: "text-rose-500" },
    { icon: BarChart3, labelKey: "nav.myResponses", path: "/my/surveys", color: "text-purple-500" },
    { icon: Mail, labelKey: "nav.messages", path: "/my/messages", color: "text-blue-500" },
    { icon: ShieldCheck, labelKey: "nav.sendAnonymousMessage", path: "/anonymous-message", isAction: true, color: "text-teal-500" },
    { icon: Car, labelKey: "nav.drivingLog", path: "/my/driving-log", color: "text-emerald-500" },
  ],
};

// Route detection helper
type SectionKey = 'ks' | 'ikMat' | 'ikAlkohol' | 'ikHms' | 'ikFdv' | 'personal' | 'gdpr' | 'apenhetsloven' | 'none';

const detectActiveSection = (pathname: string): SectionKey => {
  if (pathname.startsWith('/ks')) return 'ks';
  if (pathname.startsWith('/fdv')) return 'ikFdv';
  if (pathname.startsWith('/ik-alkohol')) return 'ikAlkohol';
  if (pathname.startsWith('/ik-mat')) return 'ikMat';
  if (pathname.startsWith('/gdpr')) return 'gdpr';
  if (pathname.startsWith('/apenhetsloven')) return 'apenhetsloven';
  
  const personalPaths = ['/employees', '/hr/', '/time-registration', '/time-off', '/work-schedule', '/my/'];
  if (personalPaths.some(p => pathname === p || pathname.startsWith(p))) return 'personal';
  
  const hmsPaths = ['/setup', '/deviations', '/audits', '/handbook', '/hms-chat', '/stoffkartotek', '/lover-og-forskrifter', '/dokumentsenter', '/risikoanalyse', '/rutiner', '/maalsetting', '/organisering'];
  if (hmsPaths.some(p => pathname === p || pathname.startsWith(p))) return 'ikHms';
  
  return 'none';
};

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslate();
  const { profile, company, isSystemAdmin, isCompanyAdmin } = useAuth();
  const { hasModule } = useCompanyModules();
  
  // Memoized active section detection
  const activeSection = useMemo(() => detectActiveSection(location.pathname), [location.pathname]);
  
  // Expanded states - controlled by active section
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(() => {
    const initial = new Set<SectionKey>();
    if (activeSection !== 'none') initial.add(activeSection);
    else initial.add('ikHms'); // Default to IK/HMS if on dashboard
    return initial;
  });
  
  // IK/KS submenu expanded state (independent of main section toggle)
  const [ikKsExpanded, setIkKsExpanded] = useState(() => {
    return location.pathname.startsWith('/ks/ik-ks');
  });
  
  // Update expanded section when route changes
  useEffect(() => {
    if (activeSection !== 'none') {
      setExpandedSections(new Set([activeSection]));
    }
    // Auto-expand IK/KS if navigating to an IK/KS route
    if (location.pathname.startsWith('/ks/ik-ks')) {
      setIkKsExpanded(true);
    }
  }, [activeSection, location.pathname]);
  
  // Toggle section helper
  const toggleSection = useCallback((section: SectionKey) => {
    setExpandedSections(prev => {
      const next = new Set<SectionKey>();
      if (!prev.has(section)) next.add(section);
      return next;
    });
  }, []);
  
  // Check if KS Bygg module is active for this company
  const hasKsBygg = hasModule("IK_BYGG");
  const hasIkMat = hasModule("IK_MAT");
  const hasIkAlkohol = hasModule("IK_ALKOHOL");
  const hasIkFdv = hasModule("IK_FDV");
  const hasGdpr = hasModule("GDPR");
  const hasApenhetsloven = hasModule("APENHETSLOVEN");
  
  // Module pricing for ordering
  const { getPricing, isLoading: pricingLoading } = useModulePricing();
  
  // State for anonymous message dialog
  const [showAnonymousDialog, setShowAnonymousDialog] = useState(false);
  
  // State for order module dialog
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderModuleType, setOrderModuleType] = useState<string | null>(null);
  
  // State for showing order option for a specific locked module
  const [selectedLockedModule, setSelectedLockedModule] = useState<string | null>(null);
  
  // Check if user can order modules (company_admin or hms_responsible)
  const canOrderModules = isCompanyAdmin;
  
  const handleLockedModuleClick = (moduleType: string) => {
    setSelectedLockedModule(prev => prev === moduleType ? null : moduleType);
  };
  
  const handleOrderModule = (moduleType: string) => {
    setOrderModuleType(moduleType);
    setOrderDialogOpen(true);
    setSelectedLockedModule(null);
  };
  
  const handleOrderComplete = () => {
    // Refresh modules after order
    window.location.reload();
  };

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
            <img 
              src="/total-ik-logo.png" 
              alt="Total-IK" 
              className={cn(
                "transition-all duration-200",
                collapsed ? "h-8" : "h-10"
              )}
            />
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
          <button 
            onClick={() => navigate("/settings?tab=company")}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors",
              collapsed && "justify-center"
            )}
          >
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
        <nav className="flex-1 px-3 py-4 pb-24 space-y-1 overflow-y-auto min-h-0" style={{ paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 4rem))' }}>
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
                  !isActive && "group-hover:scale-110",
                  !isActive && item.color
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
              onClick={() => toggleSection('ikHms')}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
                collapsed && "justify-center",
                "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Shield className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform text-green-500",
                "group-hover:scale-110"
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium text-sm flex-1 text-left flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      IK/HMS
                    </motion.span>
                    {expandedSections.has('ikHms') ? (
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
              {expandedSections.has('ikHms') && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 space-y-1 mt-1">
                    {ikHmsItems.map((item) => {
                      // Check if item has children
                      const hasChildren = 'children' in item && item.children;
                      
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
                      
                      if (hasChildren) {
                        return (
                          <div key={item.path}>
                            <NavLink
                              to={item.path}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                                isActive
                                  ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                              )}
                            >
                              <item.icon className={cn("w-4 h-4 flex-shrink-0", !isActive && item.color)} />
                              <span>{item.label}</span>
                            </NavLink>
                            {/* Sub-items */}
                            {location.pathname.startsWith("/risikoanalyse") && (
                              <div className="pl-4 space-y-1 mt-1">
                                {(item.children as typeof ikHmsItems).map((child) => {
                                  const childHasQuery = child.path.includes("?");
                                  let childIsActive = false;
                                  
                                  if (childHasQuery) {
                                    const [basePath, queryString] = child.path.split("?");
                                    const itemParams = new URLSearchParams(queryString);
                                    const currentParams = new URLSearchParams(location.search);
                                    childIsActive = location.pathname === basePath && 
                                      itemParams.get("tab") === currentParams.get("tab");
                                  } else {
                                    childIsActive = location.pathname === child.path && !location.search;
                                  }
                                  
                                  return (
                                    <NavLink
                                      key={child.path}
                                      to={child.path}
                                      onClick={(e) => {
                                        if (childHasQuery) {
                                          e.preventDefault();
                                          navigate(child.path);
                                        }
                                      }}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs",
                                        childIsActive
                                          ? "bg-sidebar-primary/60 text-sidebar-primary-foreground"
                                          : "text-sidebar-foreground/50 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                                      )}
                                    >
                                      <child.icon className={cn("w-3 h-3 flex-shrink-0", !childIsActive && child.color)} />
                                      <span>{child.label}</span>
                                    </NavLink>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
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
                          <item.icon className={cn("w-4 h-4 flex-shrink-0", !isActive && item.color)} />
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
              onClick={() => toggleSection('personal')}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
                collapsed && "justify-center",
                "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Briefcase className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform text-amber-500",
                "group-hover:scale-110"
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium text-sm flex-1 text-left flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Personaladministrasjon
                    </motion.span>
                    {expandedSections.has('personal') ? (
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
              {expandedSections.has('personal') && !collapsed && (
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
                              <item.icon className={cn("w-4 h-4 flex-shrink-0", !isActive && item.color)} />
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
                      
                      // Skip action items - they'll be rendered as dialogs
                      if ((item as any).isAction) {
                        return (
                          <button
                            key={item.path}
                            onClick={() => setShowAnonymousDialog(true)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm w-full text-left",
                              "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            )}
                          >
                            <item.icon className={cn("w-4 h-4 flex-shrink-0", item.color)} />
                            <span>{item.label}</span>
                          </button>
                        );
                      }
                      
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
                          <item.icon className={cn("w-4 h-4 flex-shrink-0", !isActive && item.color)} />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* IK/MAT collapsible section - visible but locked if module not active */}
          <div className={cn(!hasIkMat && "opacity-60")}>
            <button
              onClick={() => hasIkMat ? toggleSection('ikMat') : handleLockedModuleClick('IK_MAT')}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
                collapsed && "justify-center",
                hasIkMat && location.pathname.startsWith("/ik-mat")
                  ? "text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={!hasIkMat ? "Klikk for å bestille denne modulen" : undefined}
            >
              <ShieldCheck className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform text-red-500",
                hasIkMat && !location.pathname.startsWith("/ik-mat") && "group-hover:scale-110"
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium text-sm flex-1 text-left flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      IK/MAT
                    </motion.span>
                    {!hasIkMat ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : expandedSections.has('ikMat') ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </>
                )}
              </AnimatePresence>
            </button>
            
            {/* Locked module message with order button - only shown when clicked */}
            <AnimatePresence>
              {!hasIkMat && !collapsed && selectedLockedModule === 'IK_MAT' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 pr-3 py-2 space-y-2">
                    {canOrderModules ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOrderModule("IK_MAT")}
                        className="w-full justify-start text-xs h-auto py-1.5 text-primary hover:text-primary"
                      >
                        <ShoppingCart className="w-3 h-3 mr-2" />
                        Bestill modul
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Kontakt bedriftsadmin for å aktivere
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
              
            {/* IK/MAT submenu */}
            <AnimatePresence>
              {hasIkMat && expandedSections.has('ikMat') && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 space-y-1 mt-1">
                    {ikMatItems.map((item) => {
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
                          <item.icon className={cn("w-4 h-4 flex-shrink-0", !isActive && item.color)} />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* IK Alkohol collapsible section - visible but locked if module not active */}
          <div className={cn(!hasIkAlkohol && "opacity-60")}>
            <button
              onClick={() => hasIkAlkohol ? toggleSection('ikAlkohol') : handleLockedModuleClick('IK_ALKOHOL')}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
                collapsed && "justify-center",
                hasIkAlkohol && location.pathname.startsWith("/ik-alkohol")
                  ? "text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={!hasIkAlkohol ? "Klikk for å bestille denne modulen" : undefined}
            >
              <Wine className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform text-amber-500",
                hasIkAlkohol && !location.pathname.startsWith("/ik-alkohol") && "group-hover:scale-110"
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium text-sm flex-1 text-left flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      IK/Alkohol
                    </motion.span>
                    {!hasIkAlkohol ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : expandedSections.has('ikAlkohol') ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </>
                )}
              </AnimatePresence>
            </button>
            
            {/* Locked module message with order button - only shown when clicked */}
            <AnimatePresence>
              {!hasIkAlkohol && !collapsed && selectedLockedModule === 'IK_ALKOHOL' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 pr-3 py-2 space-y-2">
                    {canOrderModules ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOrderModule("IK_ALKOHOL")}
                        className="w-full justify-start text-xs h-auto py-1.5 text-primary hover:text-primary"
                      >
                        <ShoppingCart className="w-3 h-3 mr-2" />
                        Bestill modul
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Kontakt bedriftsadmin for å aktivere
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
              
            {/* IK Alkohol submenu */}
            <AnimatePresence>
              {hasIkAlkohol && expandedSections.has('ikAlkohol') && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 space-y-1 mt-1">
                    <NavLink
                      to="/ik-alkohol"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/ik-alkohol"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Dashboard
                    </NavLink>
                    <NavLink
                      to="/ik-alkohol/rutiner"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/ik-alkohol/rutiner"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Rutiner
                    </NavLink>
                    <NavLink
                      to="/ik-alkohol/organisering"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/ik-alkohol/organisering"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Organisering
                    </NavLink>
                    <NavLink
                      to="/ik-alkohol/maal"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/ik-alkohol/maal"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Målsetting
                    </NavLink>
                    <NavLink
                      to="/ik-alkohol/risikoanalyse"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/ik-alkohol/risikoanalyse"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Risikoanalyse
                    </NavLink>
                    <NavLink
                      to="/ik-alkohol/internkontroll"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/ik-alkohol/internkontroll"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Internkontroll
                    </NavLink>
                    <NavLink
                      to="/ik-alkohol/kontroll"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/ik-alkohol/kontroll"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Kontroll
                    </NavLink>
                    <NavLink
                      to="/ik-alkohol/hendelser"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/ik-alkohol/hendelser"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Hendelser
                    </NavLink>
                    <NavLink
                      to="/ik-alkohol/lovverk"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/ik-alkohol/lovverk"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Lovverk
                    </NavLink>
                    <NavLink
                      to="/ik-alkohol/dokumentsenter"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/ik-alkohol/dokumentsenter"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Dokumentsenter
                    </NavLink>
                    <NavLink
                      to="/ik-alkohol/handbok"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/ik-alkohol/handbok"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Håndbok
                    </NavLink>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* KS Bygg collapsible section - visible but locked if module not active */}
          <div className={cn(!hasKsBygg && "opacity-60")}>
            <button
              onClick={() => hasKsBygg ? toggleSection('ks') : handleLockedModuleClick('IK_BYGG')}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
                collapsed && "justify-center",
                hasKsBygg && location.pathname.startsWith("/ks")
                  ? "text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={!hasKsBygg ? "Klikk for å bestille denne modulen" : undefined}
            >
              <HardHat className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform text-purple-500",
                hasKsBygg && !location.pathname.startsWith("/ks") && "group-hover:scale-110"
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium text-sm flex-1 text-left flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      KS Bygg
                    </motion.span>
                    {!hasKsBygg ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : expandedSections.has('ks') ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </>
                )}
              </AnimatePresence>
            </button>
            
            {/* Locked module message with order button - only shown when clicked */}
            <AnimatePresence>
              {!hasKsBygg && !collapsed && selectedLockedModule === 'IK_BYGG' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 pr-3 py-2 space-y-2">
                    {canOrderModules ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOrderModule("IK_BYGG")}
                        className="w-full justify-start text-xs h-auto py-1.5 text-primary hover:text-primary"
                      >
                        <ShoppingCart className="w-3 h-3 mr-2" />
                        Bestill modul
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Kontakt bedriftsadmin for å aktivere
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* KS Bygg submenu - only when active */}
            <AnimatePresence>
              {hasKsBygg && expandedSections.has('ks') && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 space-y-1 mt-1">
                    {/* IK/KS Grunnlag - Collapsible submenu */}
                    <button
                      onClick={() => setIkKsExpanded(!ikKsExpanded)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname.startsWith("/ks/ik-ks")
                          ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        IK/KS Grunnlag
                      </span>
                      {ikKsExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* IK/KS submenu items */}
                    <AnimatePresence>
                      {ikKsExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 space-y-1">
                            <NavLink
                              to="/ks/ik-ks/maalsetting"
                              className={cn(
                                "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm",
                                location.pathname === "/ks/ik-ks/maalsetting"
                                  ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                              )}
                            >
                              Målsetting & Kvalitetsmål
                            </NavLink>
                            <NavLink
                              to="/ks/ik-ks/organisering"
                              className={cn(
                                "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm",
                                location.pathname === "/ks/ik-ks/organisering"
                                  ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                              )}
                            >
                              Organisasjonsplan
                            </NavLink>
                            <NavLink
                              to="/ks/ik-ks/rutiner"
                              className={cn(
                                "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm",
                                location.pathname === "/ks/ik-ks/rutiner"
                                  ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                              )}
                            >
                              Rutiner
                            </NavLink>
                            <NavLink
                              to="/ks/ik-ks/dokumenter"
                              className={cn(
                                "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm",
                                location.pathname === "/ks/ik-ks/dokumenter"
                                  ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                              )}
                            >
                              Dokumentsenter
                            </NavLink>
                            <NavLink
                              to="/ks/ik-ks/sjekklister"
                              className={cn(
                                "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm",
                                location.pathname === "/ks/ik-ks/sjekklister"
                                  ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                              )}
                            >
                              Sjekklistemaler
                            </NavLink>
                            <NavLink
                              to="/ks/ik-ks/egenerklaering"
                              className={cn(
                                "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm",
                                location.pathname === "/ks/ik-ks/egenerklaering"
                                  ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                              )}
                            >
                              Egenerklæring
                            </NavLink>
                            <NavLink
                              to="/ks/ik-ks/handbok"
                              className={cn(
                                "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm",
                                location.pathname === "/ks/ik-ks/handbok"
                                  ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                              )}
                            >
                              KS Håndbok
                            </NavLink>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Prosjekter - always visible */}
                    <NavLink
                      to="/ks"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/ks"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Mine prosjekter
                    </NavLink>
                    <NavLink
                      to="/ks/smaaprosjekter"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname.startsWith("/ks/smaaprosjekter")
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Småprosjekter
                    </NavLink>
                    <NavLink
                      to="/ks/befaring"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname.startsWith("/ks/befaring")
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Befaring
                    </NavLink>
                    <NavLink
                      to="/ks/kalkyler"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname.startsWith("/ks/kalkyler")
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Kalkyler
                    </NavLink>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* IK/FDV collapsible section - visible but locked if module not active */}
          <div className={cn(!hasIkFdv && "opacity-60")}>
            <button
              onClick={() => hasIkFdv ? toggleSection('ikFdv') : handleLockedModuleClick('IK_FDV')}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
                collapsed && "justify-center",
                hasIkFdv && location.pathname.startsWith("/fdv")
                  ? "text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={!hasIkFdv ? "Klikk for å bestille denne modulen" : undefined}
            >
              <Building2 className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform text-teal-500",
                hasIkFdv && !location.pathname.startsWith("/fdv") && "group-hover:scale-110"
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <>
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium text-sm flex-1 text-left flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      IK/FDV
                    </motion.span>
                    {!hasIkFdv ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : expandedSections.has('ikFdv') ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </>
                )}
              </AnimatePresence>
            </button>
            
            {/* Locked module message with order button - only shown when clicked */}
            <AnimatePresence>
              {!hasIkFdv && !collapsed && selectedLockedModule === 'IK_FDV' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 pr-3 py-2 space-y-2">
                    {canOrderModules ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOrderModule("IK_FDV")}
                        className="w-full justify-start text-xs h-auto py-1.5 text-primary hover:text-primary"
                      >
                        <ShoppingCart className="w-3 h-3 mr-2" />
                        Bestill modul
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Kontakt bedriftsadmin for å aktivere
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* IK/FDV submenu - only when active */}
            <AnimatePresence>
              {hasIkFdv && expandedSections.has('ikFdv') && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 space-y-1 mt-1">
                    <NavLink
                      to="/fdv"
                      end
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/fdv"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Dashboard
                    </NavLink>
                    <NavLink
                      to="/fdv/bygg"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname.startsWith("/fdv/bygg")
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Byggoversikt
                    </NavLink>
                    <NavLink
                      to="/fdv/ansvar"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname.startsWith("/fdv/ansvar")
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Ansvar og roller
                    </NavLink>
                    <NavLink
                      to="/fdv/risiko"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname.startsWith("/fdv/risiko")
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Risikoanalyse
                    </NavLink>
                    <NavLink
                      to="/fdv/kontroller"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname.startsWith("/fdv/kontroller")
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Kontroller
                    </NavLink>
                    <NavLink
                      to="/fdv/avvik"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname.startsWith("/fdv/avvik")
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Avvik
                    </NavLink>
                    <NavLink
                      to="/fdv/etasjeplaner"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname.startsWith("/fdv/etasjeplaner")
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Etasjeplaner
                    </NavLink>
                    <NavLink
                      to="/fdv/dokumenter"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname.startsWith("/fdv/dokumenter")
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Dokumenter
                    </NavLink>
                    <NavLink
                      to="/fdv/forskrifter"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname.startsWith("/fdv/forskrifter")
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Forskrifter
                    </NavLink>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* GDPR collapsible section - visible but locked if module not active */}
          <div className={cn(!hasGdpr && "opacity-60")}>
            <button
              onClick={() => hasGdpr ? toggleSection('gdpr') : handleLockedModuleClick('GDPR')}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
                collapsed && "justify-center",
                hasGdpr && location.pathname.startsWith("/gdpr")
                  ? "text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={!hasGdpr ? "Klikk for å bestille denne modulen" : undefined}
            >
              <ShieldAlert className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform",
                hasGdpr && !location.pathname.startsWith("/gdpr") && "group-hover:scale-110"
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
                      GDPR
                    </motion.span>
                    {!hasGdpr ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : expandedSections.has('gdpr') ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </>
                )}
              </AnimatePresence>
            </button>
            
            {/* Locked module message with order button - only shown when clicked */}
            <AnimatePresence>
              {!hasGdpr && !collapsed && selectedLockedModule === 'GDPR' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 pr-3 py-2 space-y-2">
                    {canOrderModules ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOrderModule("GDPR")}
                        className="w-full justify-start text-xs h-auto py-1.5 text-primary hover:text-primary"
                      >
                        <ShoppingCart className="w-3 h-3 mr-2" />
                        Bestill modul
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Kontakt bedriftsadmin for å aktivere
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {hasGdpr && expandedSections.has('gdpr') && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 space-y-1 mt-1">
                    <NavLink
                      to="/gdpr/oversikt"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/gdpr/oversikt"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Oversikt
                    </NavLink>
                    <NavLink
                      to="/gdpr/dokumentasjon"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/gdpr/dokumentasjon"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Dokumentasjon
                    </NavLink>
                    <NavLink
                      to="/gdpr/sjekkliste"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/gdpr/sjekkliste"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Sjekkliste
                    </NavLink>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Åpenhetsloven collapsible section - visible but locked if module not active */}
          <div className={cn(!hasApenhetsloven && "opacity-60")}>
            <button
              onClick={() => hasApenhetsloven ? toggleSection('apenhetsloven') : handleLockedModuleClick('APENHETSLOVEN')}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
                collapsed && "justify-center",
                hasApenhetsloven && location.pathname.startsWith("/apenhetsloven")
                  ? "text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={!hasApenhetsloven ? "Klikk for å bestille denne modulen" : undefined}
            >
              <Scale className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform",
                hasApenhetsloven && !location.pathname.startsWith("/apenhetsloven") && "group-hover:scale-110"
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
                      Åpenhetsloven
                    </motion.span>
                    {!hasApenhetsloven ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : expandedSections.has('apenhetsloven') ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </>
                )}
              </AnimatePresence>
            </button>
            
            {/* Locked module message with order button - only shown when clicked */}
            <AnimatePresence>
              {!hasApenhetsloven && !collapsed && selectedLockedModule === 'APENHETSLOVEN' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 pr-3 py-2 space-y-2">
                    {canOrderModules ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOrderModule("APENHETSLOVEN")}
                        className="w-full justify-start text-xs h-auto py-1.5 text-primary hover:text-primary"
                      >
                        <ShoppingCart className="w-3 h-3 mr-2" />
                        Bestill modul
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Kontakt bedriftsadmin for å aktivere
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {hasApenhetsloven && expandedSections.has('apenhetsloven') && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 space-y-1 mt-1">
                    <NavLink
                      to="/apenhetsloven/oversikt"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/apenhetsloven/oversikt"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Oversikt
                    </NavLink>
                    <NavLink
                      to="/apenhetsloven/aktsomhetsvurdering"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/apenhetsloven/aktsomhetsvurdering"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Aktsomhetsvurdering
                    </NavLink>
                    <NavLink
                      to="/apenhetsloven/innsyn"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/apenhetsloven/innsyn"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Innsyn forespørsler
                    </NavLink>
                    <NavLink
                      to="/apenhetsloven/redegjoerelse"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                        location.pathname === "/apenhetsloven/redegjoerelse"
                          ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      Årlig redegjørelse
                    </NavLink>
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

        {/* Download app button */}
        <div className="p-3 border-t border-sidebar-border">
          <NavLink to="/install">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent",
                collapsed && "px-0"
              )}
            >
              <Download className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-sm">Last ned app</span>}
            </Button>
          </NavLink>
        </div>

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
      
      {/* Anonymous message dialog */}
      <SubmitAnonymousMessageDialog 
        open={showAnonymousDialog} 
        onOpenChange={setShowAnonymousDialog} 
      />
      
      {/* Order module dialog */}
      <OrderModuleDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        moduleType={orderModuleType || ""}
        pricing={orderModuleType ? getPricing(orderModuleType) : null}
        onOrderComplete={handleOrderComplete}
      />
    </>
  );
}
