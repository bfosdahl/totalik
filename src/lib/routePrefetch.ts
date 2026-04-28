/**
 * Route prefetching utility — preloads route chunks on hover/focus
 * so navigation feels instant. Low-risk: only triggers dynamic import()
 * which the browser caches; no side-effects on app state.
 */

type Importer = () => Promise<unknown>;

// Map exact paths to their lazy importer. Wildcards via prefix matching below.
// Keep in sync with App.tsx route definitions for the most-used pages.
const exactRoutes: Record<string, Importer> = {
  // Core
  "/setup": () => import("@/pages/Setup"),
  "/setup/ai": () => import("@/pages/IkHmsOppsett"),
  "/setup/import-handbook": () => import("@/pages/IkHmsImportHandbook"),
  "/maalsetting": () => import("@/pages/IkHmsMaal"),
  "/organisering": () => import("@/pages/IkHmsOrganisering"),
  "/risikoanalyse": () => import("@/pages/Risikoanalyse"),
  "/rutiner": () => import("@/pages/IkHmsRutiner"),
  "/employees": () => import("@/pages/Employees"),
  "/deviations": () => import("@/pages/Deviations"),
  "/audits": () => import("@/pages/Audits"),
  "/handbook": () => import("@/pages/Handbook"),
  "/stoffkartotek": () => import("@/pages/IkHmsStoffkartotek"),
  "/lover-og-forskrifter": () => import("@/pages/LoverOgForskrifter"),
  "/dokumentsenter": () => import("@/pages/IkHmsDokumentsenter"),
  "/hms-chat": () => import("@/pages/HmsChat"),
  "/my-courses": () => import("@/pages/MyCourseCard"),
  "/time-registration": () => import("@/pages/TimeRegistration"),
  "/time-off": () => import("@/pages/TimeOff"),
  "/work-schedule": () => import("@/pages/WorkSchedule"),
  "/anonymous-messages": () => import("@/pages/AnonymousMessages"),
  "/brukerveiledning": () => import("@/pages/Brukerveiledning"),
  "/settings": () => import("@/pages/Settings"),

  // IK Mat
  "/ik-mat": () => import("@/pages/IkMatHandbok"),
  "/ik-mat/handbok": () => import("@/pages/IkMatHandbok"),
  "/ik-mat/oppsett": () => import("@/pages/IkMatOppsett"),
  "/ik-mat/haccp": () => import("@/pages/IkMatHaccp"),
  "/ik-mat/risikovurdering": () => import("@/pages/IkMatRisikovurdering"),
  "/ik-mat/risiko-og-tiltak": () => import("@/pages/IkMatRisikoOgTiltak"),
  "/ik-mat/allergener": () => import("@/pages/IkMatAllergener"),
  "/ik-mat/kjokkenplan": () => import("@/pages/IkMatKjokkenplan"),
  "/ik-mat/faste-avtaler": () => import("@/pages/IkMatFasteAvtaler"),
  "/ik-mat/kontroll": () => import("@/pages/IkMatKontroll"),
  "/ik-mat/maal": () => import("@/pages/IkMatMaal"),
  "/ik-mat/organisasjon": () => import("@/pages/IkMatOrganisasjon"),
  "/ik-mat/rutiner": () => import("@/pages/IkMatRutiner"),
  "/ik-mat/dokumentsenter": () => import("@/pages/IkMatDokumentsenter"),
  "/ik-mat/avvik": () => import("@/pages/IkMatAvvik"),
  "/ik-mat/temperaturlogg": () => import("@/pages/IkMatTemperaturlogg"),

  // IK Alkohol
  "/ik-alkohol": () => import("@/pages/ikalkohol/IkAlkoholDashboard"),
  "/ik-alkohol/internkontroll": () => import("@/pages/ikalkohol/IkAlkoholInternkontroll"),
  "/ik-alkohol/hendelser": () => import("@/pages/ikalkohol/IkAlkoholHendelser"),
  "/ik-alkohol/rutiner": () => import("@/pages/ikalkohol/IkAlkoholRutiner"),
  "/ik-alkohol/organisering": () => import("@/pages/ikalkohol/IkAlkoholOrganisering"),
  "/ik-alkohol/maal": () => import("@/pages/ikalkohol/IkAlkoholMaal"),
  "/ik-alkohol/risikoanalyse": () => import("@/pages/ikalkohol/IkAlkoholRisikoanalyse"),
  "/ik-alkohol/dokumentsenter": () => import("@/pages/ikalkohol/IkAlkoholDokumentsenter"),
  "/ik-alkohol/kontroll": () => import("@/pages/ikalkohol/IkAlkoholKontroll"),
  "/ik-alkohol/handbok": () => import("@/pages/ikalkohol/IkAlkoholHandbok"),
  "/ik-alkohol/lovverk": () => import("@/pages/ikalkohol/IkAlkoholLovverk"),

  // KS Bygg
  "/ks-bygg": () => import("@/pages/ks2/Ks2Dashboard"),
  "/ks-bygg/statistikk": () => import("@/pages/ks2/Ks2Statistikk"),
  "/ks-bygg/befaring": () => import("@/pages/ks2/Ks2Befaring"),
  "/ks-bygg/kalkyler": () => import("@/pages/ks2/KsKalkyler"),
  "/ks-bygg/rutiner": () => import("@/pages/ks2/IkKsRutiner"),
  "/ks-bygg/maal": () => import("@/pages/ks2/IkKsMaal"),
  "/ks-bygg/dokumenter": () => import("@/pages/ks2/IkKsDokumenter"),
  "/ks-bygg/sjekklister": () => import("@/pages/ks2/IkKsSjekklister"),
  "/ks-bygg/utfylte-sjekklister": () => import("@/pages/ks2/KsUtfylteSjekklister"),
  "/ks-bygg/maalsetting": () => import("@/pages/ks2/IkKsMaalsetting"),
  "/ks-bygg/organisering": () => import("@/pages/ks2/IkKsOrganisering"),
  "/ks-bygg/egenerklaering": () => import("@/pages/ks2/IkKsEgenerklaering"),
  "/ks-bygg/handbok": () => import("@/pages/ks2/IkKsHandbok"),
  "/ks-bygg/oppsett": () => import("@/pages/ks2/KsOppsett"),

  // Mine prosjekter
  "/mine-prosjekter": () => import("@/pages/mineprosjekter/MineProsjekterDashboard"),

  // FDV
  "/fdv": () => import("@/pages/fdv/FdvDashboard"),
  "/fdv/buildings": () => import("@/pages/fdv/FdvBuildings"),
  "/fdv/controls": () => import("@/pages/fdv/FdvControls"),
  "/fdv/risks": () => import("@/pages/fdv/FdvRisks"),
  "/fdv/regulations": () => import("@/pages/fdv/FdvRegulations"),
  "/fdv/floor-plans": () => import("@/pages/fdv/FdvFloorPlans"),

  // HR
  "/hr/contracts": () => import("@/pages/hr/HrContracts"),
  "/hr/absence": () => import("@/pages/hr/HrAbsence"),
  "/hr/meetings": () => import("@/pages/hr/HrMeetings"),
  "/hr/surveys": () => import("@/pages/hr/HrSurveys"),
  "/hr/my-contract": () => import("@/pages/hr/MyContract"),

  // My pages
  "/my/absence": () => import("@/pages/my/MyAbsence"),
  "/my/surveys": () => import("@/pages/my/MySurveys"),
  "/my/messages": () => import("@/pages/my/MyMessages"),
  "/my/driving-log": () => import("@/pages/my/MyDrivingLog"),
  "/my/employee-card": () => import("@/pages/my/MyEmployeeCard"),

  // Personalhandbok
  "/personalhandbok": () => import("@/pages/personalhandbok/PersonalhandbokPage"),

  // Admin
  "/admin": () => import("@/pages/admin/AdminDashboard"),
  "/admin/companies": () => import("@/pages/admin/AdminCompanies"),
  "/admin/users": () => import("@/pages/admin/AdminUsers"),
  "/admin/hms-requests": () => import("@/pages/admin/AdminHmsRequests"),
  "/admin/sg-register": () => import("@/pages/admin/AdminSgRegister"),
  "/admin/documents": () => import("@/pages/admin/AdminDocuments"),
  "/admin/ks-panel": () => import("@/pages/admin/AdminKsPanel"),
  "/admin/byggesak-templates": () => import("@/pages/admin/AdminByggesakTemplates"),
  "/admin/customer-import": () => import("@/pages/admin/AdminCustomerImport"),
  "/admin/stoffkartotek": () => import("@/pages/admin/AdminStoffkartotek"),
  "/admin/routine-maker": () => import("@/pages/admin/AdminRoutineMaker"),
  "/admin/email-log": () => import("@/pages/admin/AdminEmailLog"),
  "/admin/monitoring": () => import("@/pages/admin/AdminMonitoring"),
  "/admin/sellers": () => import("@/pages/admin/AdminSellers"),
  "/admin/trash-bin": () => import("@/pages/admin/AdminTrashBin"),
};

// Prefix-baserte routes (dynamiske parametre)
const prefixRoutes: Array<[RegExp, Importer]> = [
  [/^\/avdeling\/[^/]+\/maal$/, () => import("@/pages/department/DepartmentGoals")],
  [/^\/avdeling\/[^/]+\/organisering$/, () => import("@/pages/department/DepartmentOrganization")],
  [/^\/avdeling\/[^/]+\/rutiner$/, () => import("@/pages/department/DepartmentRoutines")],
  [/^\/avdeling\/[^/]+\/oppsett\/ai$/, () => import("@/pages/department/DepartmentAiSetup")],
  [/^\/avdeling\/[^/]+$/, () => import("@/pages/DepartmentDashboard")],
  [/^\/ks-bygg\/prosjekt\/[^/]+/, () => import("@/pages/ks2/Ks2ProjectDetail")],
  [/^\/mine-prosjekter\/[^/]+/, () => import("@/pages/mineprosjekter/SimpleProjectDetail")],
];

// Cache: only run each importer once
const triggered = new Set<string>();

function resolveImporter(path: string): Importer | null {
  // Strip query string
  const clean = path.split("?")[0];
  if (exactRoutes[clean]) return exactRoutes[clean];
  for (const [re, importer] of prefixRoutes) {
    if (re.test(clean)) return importer;
  }
  return null;
}

/**
 * Trigger prefetch for a given route path. Safe to call repeatedly —
 * each importer runs at most once per session.
 */
export function prefetchRoute(path: string): void {
  if (!path || triggered.has(path)) return;
  const importer = resolveImporter(path);
  if (!importer) return;
  triggered.add(path);
  // Fire and forget; ignore failures (e.g. offline) — navigation will retry.
  importer().catch(() => {
    triggered.delete(path);
  });
}

/**
 * Returns event handlers to attach to a link/button so its destination
 * is preloaded on hover/focus/touchstart.
 */
export function getPrefetchHandlers(path: string) {
  const handler = () => prefetchRoute(path);
  return {
    onMouseEnter: handler,
    onFocus: handler,
    onTouchStart: handler,
  };
}
