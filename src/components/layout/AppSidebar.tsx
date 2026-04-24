import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslate } from "@/hooks/useTranslate";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ClipboardList, AlertTriangle, FileCheck, BookOpen, Settings,
  HelpCircle, ChevronLeft, ChevronRight, Shield, Building2, ShieldCheck,
  ClipboardCheck, X, Users, HardHat, ChevronDown, ChevronUp, Lock,
  MessageCircle, ListChecks, Clock, CalendarDays, Calendar, Briefcase,
  UserCircle, FileText, UserCheck, BarChart3, HeartPulse, ShieldAlert, Scale,
  FlaskConical, ShoppingCart, FolderOpen, Target, Wine, Thermometer, SprayCan,
  Wheat, Handshake, Search, Mail, Car, Printer, Download, Award, IdCard, LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { SubmitAnonymousMessageDialog } from "@/components/anonymous/SubmitAnonymousMessageDialog";
import { OrderModuleDialog } from "@/components/modules/OrderModuleDialog";
import { useModulePricing } from "@/hooks/useModulePricing";
import { useDepartmentContext } from "@/contexts/DepartmentContext";

// ─── Types ──────────────────────────────────────────────────────────────────
interface NavItem {
  icon?: LucideIcon;
  labelKey?: string;
  label?: string;
  path: string;
  color?: string;
  isAction?: boolean;
  children?: NavItem[];
}

type SectionKey = 'ks' | 'ikMat' | 'ikAlkohol' | 'ikHms' | 'ikFdv' | 'personal' | 'gdpr' | 'apenhetsloven' | 'personalhandbok' | 'none';

// ─── Data ───────────────────────────────────────────────────────────────────
const standardNavItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/", color: "text-sky-500" },
  { icon: HelpCircle, labelKey: "nav.userGuide", path: "/brukerveiledning", color: "text-blue-500" },
  { icon: Settings, labelKey: "nav.settings", path: "/settings", color: "text-slate-400" },
];

const ikHmsItems: NavItem[] = [
  { icon: ClipboardList, labelKey: "nav.setup", path: "/setup", color: "text-emerald-500" },
  { icon: Target, labelKey: "nav.targetSetting", path: "/maalsetting", color: "text-yellow-500" },
  { icon: Building2, labelKey: "nav.organization", path: "/organisering", color: "text-sky-500" },
  {
    icon: AlertTriangle, labelKey: "nav.riskAnalysis", path: "/risikoanalyse", color: "text-orange-500",
    children: [
      { icon: ClipboardList, labelKey: "nav.riskAssessmentAndActionPlan", path: "/risikoanalyse", color: "text-orange-500" },
      { icon: CalendarDays, labelKey: "nav.followUp", path: "/risikoanalyse?tab=oppfolging", color: "text-teal-500" },
      { icon: FileCheck, labelKey: "nav.sja", path: "/risikoanalyse?tab=sja", color: "text-blue-500" },
    ],
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

const ikMatItems: NavItem[] = [
  { icon: BookOpen, labelKey: "nav.handbookIkMat", path: "/ik-mat/handbok", color: "text-cyan-500" },
  { icon: Target, labelKey: "nav.targetSetting", path: "/ik-mat/maal", color: "text-yellow-500" },
  { icon: Building2, labelKey: "nav.orgChart", path: "/ik-mat/organisasjon", color: "text-sky-500" },
  { icon: AlertTriangle, labelKey: "nav.riskAndMeasures", path: "/ik-mat/risiko-og-tiltak", color: "text-orange-500" },
  { icon: ListChecks, labelKey: "nav.routines", path: "/ik-mat/rutiner", color: "text-teal-500" },
  { icon: ClipboardCheck, labelKey: "nav.control", path: "/ik-mat/kontroll", color: "text-emerald-500" },
  { icon: AlertTriangle, labelKey: "nav.deviations", path: "/ik-mat/avvik", color: "text-red-500" },
  { icon: Wheat, labelKey: "nav.allergens", path: "/ik-mat/allergener", color: "text-amber-500" },
  { icon: LayoutGrid, labelKey: "nav.kitchenLayout", path: "/ik-mat/kjokkenplan", color: "text-cyan-500" },
  { icon: Handshake, labelKey: "nav.fixedAgreements", path: "/ik-mat/faste-avtaler", color: "text-indigo-500" },
  { icon: FolderOpen, labelKey: "nav.documentCenter", path: "/ik-mat/dokumentsenter", color: "text-slate-500" },
];

const ikAlkoholItems: NavItem[] = [
  { labelKey: "nav.dashboard", path: "/ik-alkohol" },
  { labelKey: "nav.routines", path: "/ik-alkohol/rutiner" },
  { labelKey: "nav.organization", path: "/ik-alkohol/organisering" },
  { labelKey: "nav.targetSetting", path: "/ik-alkohol/maal" },
  { labelKey: "nav.riskAnalysis", path: "/ik-alkohol/risikoanalyse" },
  { label: "Internkontroll", path: "/ik-alkohol/internkontroll" },
  { labelKey: "nav.control", path: "/ik-alkohol/kontroll" },
  { label: "Hendelser", path: "/ik-alkohol/hendelser" },
  { label: "Lovverk", path: "/ik-alkohol/lovverk" },
  { labelKey: "nav.documentCenter", path: "/ik-alkohol/dokumentsenter" },
  { labelKey: "nav.handbook", path: "/ik-alkohol/handbok" },
];

const ikKsGrunnlagItems: NavItem[] = [
  { label: "Målsetting & Kvalitetsmål", path: "/ks/ik-ks/maalsetting" },
  { label: "Organisasjonsplan", path: "/ks/ik-ks/organisering" },
  { label: "Rutiner", path: "/ks/ik-ks/rutiner" },
  { label: "Dokumentsenter", path: "/ks/ik-ks/dokumenter" },
  { label: "Sjekklistemaler", path: "/ks/ik-ks/sjekklister" },
  { label: "Egenerklæring", path: "/ks/ik-ks/egenerklaering" },
  { label: "KS Håndbok", path: "/ks/ik-ks/handbok" },
];

const ksByggItems: NavItem[] = [
  { label: "Mine prosjekter", path: "/ks" },
  { label: "Oppsett-hjelper", path: "/ks/oppsett" },
  { label: "Utfylte sjekklister", path: "/ks/utfylte-sjekklister" },
  { label: "Befaring", path: "/ks/befaring" },
  { label: "Kalkyler", path: "/ks/kalkyler" },
];

const fdvItems: NavItem[] = [
  { labelKey: "nav.dashboard", path: "/fdv" },
  { label: "Bygg & Eiendommer", path: "/fdv/bygg" },
  { label: "Kontroller", path: "/fdv/kontroller" },
  { label: "Risikovurdering", path: "/fdv/risiko" },
  { label: "Regelverk", path: "/fdv/regelverk" },
  { label: "Etasjeplaner", path: "/fdv/etasjeplaner" },
];

const gdprItems: NavItem[] = [
  { label: "Oversikt", path: "/gdpr/oversikt" },
  { label: "Dokumentasjon", path: "/gdpr/dokumentasjon" },
  { label: "Sjekkliste", path: "/gdpr/sjekkliste" },
];

const apenhetItems: NavItem[] = [
  { label: "Oversikt", path: "/apenhetsloven/oversikt" },
  { label: "Aktsomhetsvurdering", path: "/apenhetsloven/aktsomhetsvurdering" },
  { label: "Innsyn forespørsler", path: "/apenhetsloven/innsyn" },
  { label: "Årlig redegjørelse", path: "/apenhetsloven/redegjoerelse" },
];

const personalhandbokItems: NavItem[] = [
  { label: "Personalhåndbok", path: "/personalhandbok" },
];

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
  ] as NavItem[],
  mittArbeidsforhold: [
    { icon: FileText, labelKey: "nav.myContract", path: "/my/contract", color: "text-slate-500" },
    { icon: Clock, labelKey: "nav.myHours", path: "/time-registration", color: "text-indigo-500" },
    { icon: CalendarDays, labelKey: "nav.myVacation", path: "/time-off", color: "text-orange-500" },
    { icon: HeartPulse, labelKey: "nav.myAbsence", path: "/my/absence", color: "text-rose-500" },
    { icon: BarChart3, labelKey: "nav.myResponses", path: "/my/surveys", color: "text-purple-500" },
    { icon: Mail, labelKey: "nav.messages", path: "/my/messages", color: "text-blue-500" },
    { icon: ShieldCheck, labelKey: "nav.sendAnonymousMessage", path: "/anonymous-message", isAction: true, color: "text-teal-500" },
    { icon: Car, labelKey: "nav.drivingLog", path: "/my/driving-log", color: "text-emerald-500" },
    { icon: IdCard, labelKey: "nav.myEmployeeCard", path: "/my/employee-card", color: "text-amber-500" },
  ] as NavItem[],
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const detectActiveSection = (pathname: string): SectionKey => {
  if (pathname.startsWith('/ks')) return 'ks';
  if (pathname.startsWith('/fdv')) return 'ikFdv';
  if (pathname.startsWith('/ik-alkohol')) return 'ikAlkohol';
  if (pathname.startsWith('/ik-mat')) return 'ikMat';
  if (pathname.startsWith('/gdpr')) return 'gdpr';
  if (pathname.startsWith('/apenhetsloven')) return 'apenhetsloven';
  if (pathname.startsWith('/personalhandbok')) return 'personalhandbok';
  const personalPaths = ['/employees', '/hr/', '/time-registration', '/time-off', '/work-schedule', '/my/'];
  if (personalPaths.some(p => pathname === p || pathname.startsWith(p))) return 'personal';
  const hmsPaths = ['/setup', '/deviations', '/audits', '/handbook', '/hms-chat', '/stoffkartotek', '/lover-og-forskrifter', '/dokumentsenter', '/risikoanalyse', '/rutiner', '/maalsetting', '/organisering'];
  if (hmsPaths.some(p => pathname === p || pathname.startsWith(p))) return 'ikHms';
  return 'none';
};

const isItemActive = (itemPath: string, locationPathname: string, locationSearch: string): boolean => {
  const hasQuery = itemPath.includes("?");
  if (hasQuery) {
    const [basePath, queryString] = itemPath.split("?");
    const itemParams = new URLSearchParams(queryString);
    const currentParams = new URLSearchParams(locationSearch);
    // Check both "step" and "tab" params
    const stepMatch = itemParams.get("step") === currentParams.get("step");
    const tabMatch = itemParams.get("tab") === currentParams.get("tab");
    return locationPathname === basePath && (stepMatch || tabMatch);
  }
  return locationPathname === itemPath || (itemPath !== "/" && itemPath !== "/setup" && locationPathname.startsWith(itemPath));
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

// ─── Reusable Sub-Components ────────────────────────────────────────────────

/** Renders a single submenu NavLink item */
const SubNavItem = memo(function SubNavItem({
  item, isActive, onClick, t, size = "normal",
}: {
  item: NavItem; isActive: boolean; onClick?: (e: React.MouseEvent) => void;
  t: (key: string) => string; size?: "normal" | "small";
}) {
  const Icon = item.icon;
  const label = item.label || (item.labelKey ? t(item.labelKey) : "");
  const py = size === "small" ? "py-1.5" : "py-2";
  const textSize = size === "small" ? "text-xs" : "text-sm";
  const iconSize = size === "small" ? "w-3 h-3" : "w-4 h-4";
  const activeClass = size === "small" ? "bg-sidebar-primary/60" : "bg-sidebar-primary/80";

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={cn(
        `flex items-center gap-3 px-3 ${py} rounded-lg transition-all duration-200 ${textSize}`,
        isActive
          ? `${activeClass} text-sidebar-primary-foreground`
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      {Icon && <Icon className={cn(`${iconSize} flex-shrink-0`, !isActive && item.color)} />}
      <span>{label}</span>
    </NavLink>
  );
});

/** Renders a list of nav items with active state detection */
const NavItemList = memo(function NavItemList({
  items, locationPathname, locationSearch, navigate, t, size = "normal",
}: {
  items: NavItem[]; locationPathname: string; locationSearch: string;
  navigate: (path: string) => void; t: (key: string) => string;
  size?: "normal" | "small";
}) {
  return (
    <>
      {items.map((item) => {
        const active = isItemActive(item.path, locationPathname, locationSearch);
        const hasQuery = item.path.includes("?");
        const handleClick = hasQuery ? (e: React.MouseEvent) => { e.preventDefault(); navigate(item.path); } : undefined;
        return (
          <SubNavItem key={item.path} item={item} isActive={active} onClick={handleClick} t={t} size={size} />
        );
      })}
    </>
  );
});

/** Renders the locked module "order" panel */
const LockedModulePanel = memo(function LockedModulePanel({
  moduleType, canOrder, onOrder, collapsed, selectedLockedModule,
}: {
  moduleType: string; canOrder: boolean; onOrder: (type: string) => void;
  collapsed: boolean; selectedLockedModule: string | null;
}) {
  if (collapsed || selectedLockedModule !== moduleType) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="pl-6 pr-3 py-2 space-y-2">
          {canOrder ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOrder(moduleType)}
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
    </AnimatePresence>
  );
});

/** Renders a collapsible section header button */
const SectionHeaderButton = memo(function SectionHeaderButton({
  icon: Icon, label, color, dotColor, isExpanded, isLocked, collapsed, onClick,
}: {
  icon: LucideIcon; label: string; color: string; dotColor?: string;
  isExpanded: boolean; isLocked: boolean; collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group w-full",
        collapsed && "justify-center",
        "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
      title={isLocked ? "Klikk for å bestille denne modulen" : undefined}
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform", color, !isLocked && "group-hover:scale-110")} />
      <AnimatePresence mode="wait">
        {!collapsed && (
          <>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-medium text-sm flex-1 text-left flex items-center gap-2"
            >
              {dotColor && <span className={cn("w-2 h-2 rounded-full", dotColor)} />}
              {label}
            </motion.span>
            {isLocked ? (
              <Lock className="w-4 h-4 text-muted-foreground" />
            ) : isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </>
        )}
      </AnimatePresence>
    </button>
  );
});

/** Expandable submenu wrapper with animation */
const ExpandableSubmenu = memo(function ExpandableSubmenu({
  isVisible, children,
}: {
  isVisible: boolean; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="pl-6 space-y-1 mt-1">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/** Generic collapsible module section (locked or active) */
const ModuleSection = memo(function ModuleSection({
  sectionKey, moduleType, icon, label, color, dotColor,
  hasModule, isExpanded, collapsed, onToggle, onLockedClick,
  selectedLockedModule, canOrderModules, onOrder, children,
}: {
  sectionKey: SectionKey; moduleType: string;
  icon: LucideIcon; label: string; color: string; dotColor?: string;
  hasModule: boolean; isExpanded: boolean; collapsed: boolean;
  onToggle: (key: SectionKey) => void;
  onLockedClick: (type: string) => void;
  selectedLockedModule: string | null; canOrderModules: boolean;
  onOrder: (type: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(!hasModule && "opacity-60")}>
      <SectionHeaderButton
        icon={icon}
        label={label}
        color={color}
        dotColor={dotColor}
        isExpanded={isExpanded}
        isLocked={!hasModule}
        collapsed={collapsed}
        onClick={() => hasModule ? onToggle(sectionKey) : onLockedClick(moduleType)}
      />
      {!hasModule && (
        <LockedModulePanel
          moduleType={moduleType}
          canOrder={canOrderModules}
          onOrder={onOrder}
          collapsed={collapsed}
          selectedLockedModule={selectedLockedModule}
        />
      )}
      <ExpandableSubmenu isVisible={hasModule && isExpanded && !collapsed}>
        {children}
      </ExpandableSubmenu>
    </div>
  );
});

// ─── Main Component ─────────────────────────────────────────────────────────
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
  const isMobile = useIsMobile();

  const activeSection = useMemo(() => detectActiveSection(location.pathname), [location.pathname]);

  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(() => {
    const initial = new Set<SectionKey>();
    initial.add(activeSection !== 'none' ? activeSection : 'ikHms');
    return initial;
  });

  const [ikKsExpanded, setIkKsExpanded] = useState(() => location.pathname.startsWith('/ks/ik-ks'));
  const [showAnonymousDialog, setShowAnonymousDialog] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderModuleType, setOrderModuleType] = useState<string | null>(null);
  const [selectedLockedModule, setSelectedLockedModule] = useState<string | null>(null);

  const canOrderModules = isCompanyAdmin;
  const { getPricing } = useModulePricing();

  const hasKsBygg = hasModule("IK_BYGG");
  const hasIkMat = hasModule("IK_MAT");
  const hasIkAlkohol = hasModule("IK_ALKOHOL");
  const hasIkFdv = hasModule("IK_FDV");
  const hasGdpr = hasModule("GDPR");
  const hasApenhetsloven = hasModule("APENHETSLOVEN");
  const hasPersonalhandbok = hasModule("PERSONALHANDBOK");

  // Update expanded section when route changes
  useEffect(() => {
    if (activeSection !== 'none') {
      setExpandedSections(new Set([activeSection]));
    }
    if (location.pathname.startsWith('/ks/ik-ks')) {
      setIkKsExpanded(true);
    }
  }, [activeSection, location.pathname]);

  // Close sidebar on route change — ONLY on mobile
  useEffect(() => {
    if (isMobile) {
      onClose();
    }
  }, [location.pathname, isMobile, onClose]);

  const toggleSection = useCallback((section: SectionKey) => {
    setExpandedSections(prev => {
      const next = new Set<SectionKey>();
      if (!prev.has(section)) next.add(section);
      return next;
    });
  }, []);

  const handleLockedModuleClick = useCallback((moduleType: string) => {
    setSelectedLockedModule(prev => prev === moduleType ? null : moduleType);
  }, []);

  const handleOrderModule = useCallback((moduleType: string) => {
    setOrderModuleType(moduleType);
    setOrderDialogOpen(true);
    setSelectedLockedModule(null);
  }, []);

  const handleOrderComplete = useCallback(() => {
    window.location.reload();
  }, []);

  const companyName = company?.name || t("common.noCompany");
  const orgNumber = company?.org_number || null;
  const { pathname, search } = location;

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
        <div className="flex items-center justify-between px-5 pt-3 pb-1 border-b border-sidebar-border">
          <div className="flex items-center justify-center flex-1">
            <img
              src="/total-ik-logo-light.png"
              alt="Total-IK"
              className={cn(
                "transition-all duration-200 object-contain",
                collapsed ? "h-10" : "h-28"
              )}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden text-sidebar-foreground">
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
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-start text-left min-w-0"
                >
                  <span className="text-sm font-medium text-sidebar-foreground truncate w-full">{companyName}</span>
                  <span className="text-xs text-sidebar-foreground/60">
                    {orgNumber ? `Org: ${orgNumber}` : t("common.notLinked")}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 pb-24 space-y-1 overflow-y-auto min-h-0" style={{ paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 4rem))' }}>

          {/* Standard nav items */}
          {standardNavItems.map((item) => {
            const Icon = item.icon!;
            const active = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  collapsed && "justify-center",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform", !active && "group-hover:scale-110", !active && item.color)} />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="font-medium text-sm">
                      {item.labelKey ? t(item.labelKey) : item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}

          {/* ── IK/HMS ── */}
          <div>
            <SectionHeaderButton
              icon={Shield}
              label="IK/HMS"
              color="text-green-500"
              dotColor="bg-green-500"
              isExpanded={expandedSections.has('ikHms')}
              isLocked={false}
              collapsed={collapsed}
              onClick={() => toggleSection('ikHms')}
            />
            <ExpandableSubmenu isVisible={expandedSections.has('ikHms') && !collapsed}>
              {ikHmsItems.map((item) => {
                const active = isItemActive(item.path, pathname, search);
                const hasQuery = item.path.includes("?");
                const handleClick = hasQuery ? (e: React.MouseEvent) => { e.preventDefault(); navigate(item.path); } : undefined;

                if (item.children) {
                  return (
                    <div key={item.path}>
                      <SubNavItem item={item} isActive={active} onClick={handleClick} t={t} />
                      {pathname.startsWith("/risikoanalyse") && (
                        <div className="pl-4 space-y-1 mt-1">
                          <NavItemList items={item.children} locationPathname={pathname} locationSearch={search} navigate={navigate} t={t} size="small" />
                        </div>
                      )}
                    </div>
                  );
                }

                return <SubNavItem key={item.path} item={item} isActive={active} onClick={handleClick} t={t} />;
              })}
            </ExpandableSubmenu>
          </div>

          {/* ── Personal ── */}
          <div>
            <SectionHeaderButton
              icon={Briefcase}
              label={t("nav.personalAdmin")}
              color="text-amber-500"
              dotColor="bg-amber-500"
              isExpanded={expandedSections.has('personal')}
              isLocked={false}
              collapsed={collapsed}
              onClick={() => toggleSection('personal')}
            />
            <ExpandableSubmenu isVisible={expandedSections.has('personal') && !collapsed}>
              {(isSystemAdmin || isCompanyAdmin) && (
                <>
                  <div className="py-1.5 px-3">
                    <span className="text-xs font-medium text-sidebar-foreground/50 uppercase">{t("nav.myEmployees")}</span>
                  </div>
                  <NavItemList items={personaladministrasjonItems.mineAnsatte} locationPathname={pathname} locationSearch={search} navigate={navigate} t={t} />
                </>
              )}
              <div className="py-1.5 px-3">
                <span className="text-xs font-medium text-sidebar-foreground/50 uppercase">{t("nav.myEmployment")}</span>
              </div>
              {personaladministrasjonItems.mittArbeidsforhold.map((item) => {
                if (item.isAction) {
                  const Icon = item.icon!;
                  return (
                    <button
                      key={item.path}
                      onClick={() => setShowAnonymousDialog(true)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm w-full text-left text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    >
                      <Icon className={cn("w-4 h-4 flex-shrink-0", item.color)} />
                      <span>{item.labelKey ? t(item.labelKey) : item.label}</span>
                    </button>
                  );
                }
                const active = pathname === item.path;
                return <SubNavItem key={item.path} item={item} isActive={active} t={t} />;
              })}
            </ExpandableSubmenu>
          </div>

          {/* ── IK/MAT ── */}
          <ModuleSection
            sectionKey="ikMat" moduleType="IK_MAT" icon={ShieldCheck} label="IK/MAT"
            color="text-red-500" dotColor="bg-red-500" hasModule={hasIkMat}
            isExpanded={expandedSections.has('ikMat')} collapsed={collapsed}
            onToggle={toggleSection} onLockedClick={handleLockedModuleClick}
            selectedLockedModule={selectedLockedModule} canOrderModules={canOrderModules}
            onOrder={handleOrderModule}
          >
            <NavItemList items={ikMatItems} locationPathname={pathname} locationSearch={search} navigate={navigate} t={t} />
          </ModuleSection>

          {/* ── IK/Alkohol ── */}
          <ModuleSection
            sectionKey="ikAlkohol" moduleType="IK_ALKOHOL" icon={Wine} label="IK/Alkohol"
            color="text-amber-500" dotColor="bg-amber-500" hasModule={hasIkAlkohol}
            isExpanded={expandedSections.has('ikAlkohol')} collapsed={collapsed}
            onToggle={toggleSection} onLockedClick={handleLockedModuleClick}
            selectedLockedModule={selectedLockedModule} canOrderModules={canOrderModules}
            onOrder={handleOrderModule}
          >
            <NavItemList items={ikAlkoholItems} locationPathname={pathname} locationSearch={search} navigate={navigate} t={t} />
          </ModuleSection>

          {/* ── KS Bygg ── */}
          <ModuleSection
            sectionKey="ks" moduleType="IK_BYGG" icon={HardHat} label="KS Bygg"
            color="text-purple-500" dotColor="bg-purple-500" hasModule={hasKsBygg}
            isExpanded={expandedSections.has('ks')} collapsed={collapsed}
            onToggle={toggleSection} onLockedClick={handleLockedModuleClick}
            selectedLockedModule={selectedLockedModule} canOrderModules={canOrderModules}
            onOrder={handleOrderModule}
          >
            {/* IK/KS Grunnlag sub-section */}
            <button
              onClick={() => setIkKsExpanded(!ikKsExpanded)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                pathname.startsWith("/ks/ik-ks")
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                IK/KS Grunnlag
              </span>
              {ikKsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {ikKsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-4 space-y-1">
                    <NavItemList items={ikKsGrunnlagItems} locationPathname={pathname} locationSearch={search} navigate={navigate} t={t} size="small" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <NavItemList items={ksByggItems} locationPathname={pathname} locationSearch={search} navigate={navigate} t={t} />
          </ModuleSection>

          {/* ── IK/FDV ── */}
          <ModuleSection
            sectionKey="ikFdv" moduleType="IK_FDV" icon={Building2} label="IK/FDV"
            color="text-teal-500" dotColor="bg-teal-500" hasModule={hasIkFdv}
            isExpanded={expandedSections.has('ikFdv')} collapsed={collapsed}
            onToggle={toggleSection} onLockedClick={handleLockedModuleClick}
            selectedLockedModule={selectedLockedModule} canOrderModules={canOrderModules}
            onOrder={handleOrderModule}
          >
            <NavItemList items={fdvItems} locationPathname={pathname} locationSearch={search} navigate={navigate} t={t} />
          </ModuleSection>

          {/* GDPR og Åpenhetsloven – skjult inntil modulene er ferdig utviklet */}

          {/* ── Personalhåndbok ── */}
          <ModuleSection
            sectionKey="personalhandbok" moduleType="PERSONALHANDBOK" icon={BookOpen} label="Personalhåndbok"
            color="text-rose-500" dotColor="bg-rose-500" hasModule={hasPersonalhandbok}
            isExpanded={expandedSections.has('personalhandbok')} collapsed={collapsed}
            onToggle={toggleSection} onLockedClick={handleLockedModuleClick}
            selectedLockedModule={selectedLockedModule} canOrderModules={canOrderModules}
            onOrder={handleOrderModule}
          >
            <NavItemList items={personalhandbokItems} locationPathname={pathname} locationSearch={search} navigate={navigate} t={t} />
          </ModuleSection>

          {/* Admin link */}
          {isSystemAdmin && (
            <>
              <div className="pt-4 pb-2">
                {!collapsed && (
                  <span className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase">Administrasjon</span>
                )}
              </div>
              <NavLink
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  collapsed && "justify-center",
                  pathname.startsWith("/admin")
                    ? "bg-warning text-warning-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <ShieldCheck className={cn("w-5 h-5 flex-shrink-0 transition-transform", !pathname.startsWith("/admin") && "group-hover:scale-110")} />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="font-medium text-sm">
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
              {!collapsed && <span className="text-sm">{t("auth.downloadApp")}</span>}
            </Button>
          </NavLink>
        </div>

        {/* Collapse toggle - desktop only */}
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
                <span>{t("nav.minimize")}</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Dialogs */}
      <SubmitAnonymousMessageDialog open={showAnonymousDialog} onOpenChange={setShowAnonymousDialog} />
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
