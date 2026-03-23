import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { DepartmentProvider } from "@/contexts/DepartmentContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AccentColorProvider } from "@/components/AccentColorProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Static imports — critical path (auth + dashboard)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy imports — all other pages
const Setup = lazy(() => import("./pages/Setup"));
const Employees = lazy(() => import("./pages/Employees"));
const Deviations = lazy(() => import("./pages/Deviations"));
const Audits = lazy(() => import("./pages/Audits"));
const Handbook = lazy(() => import("./pages/Handbook"));
const Settings = lazy(() => import("./pages/Settings"));
const HmsChat = lazy(() => import("./pages/HmsChat"));
const MyCourseCard = lazy(() => import("./pages/MyCourseCard"));
const TimeRegistration = lazy(() => import("./pages/TimeRegistration"));
const TimeClock = lazy(() => import("./pages/TimeClock"));
const TimeOff = lazy(() => import("./pages/TimeOff"));
const WorkSchedule = lazy(() => import("./pages/WorkSchedule"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const InstallAvvikApp = lazy(() => import("./pages/InstallAvvikApp"));
const AnonymousMessages = lazy(() => import("./pages/AnonymousMessages"));
const Risikoanalyse = lazy(() => import("./pages/Risikoanalyse"));
const Brukerveiledning = lazy(() => import("./pages/Brukerveiledning"));
const LoverOgForskrifter = lazy(() => import("./pages/LoverOgForskrifter"));
const DepartmentDashboard = lazy(() => import("./pages/DepartmentDashboard"));

// IK HMS
const IkHmsOppsett = lazy(() => import("./pages/IkHmsOppsett"));
const IkHmsMaal = lazy(() => import("./pages/IkHmsMaal"));
const IkHmsOrganisering = lazy(() => import("./pages/IkHmsOrganisering"));
const IkHmsStoffkartotek = lazy(() => import("./pages/IkHmsStoffkartotek"));
const IkHmsDokumentsenter = lazy(() => import("./pages/IkHmsDokumentsenter"));
const IkHmsRutiner = lazy(() => import("./pages/IkHmsRutiner"));

// Department
const DepartmentGoals = lazy(() => import("./pages/department/DepartmentGoals"));
const DepartmentOrganization = lazy(() => import("./pages/department/DepartmentOrganization"));
const DepartmentRoutines = lazy(() => import("./pages/department/DepartmentRoutines"));
const DepartmentAiSetup = lazy(() => import("./pages/department/DepartmentAiSetup"));

// IK Mat
const IkMatHandbok = lazy(() => import("./pages/IkMatHandbok"));
const IkMatOppsett = lazy(() => import("./pages/IkMatOppsett"));
const IkMatHaccp = lazy(() => import("./pages/IkMatHaccp"));
const IkMatRisikovurdering = lazy(() => import("./pages/IkMatRisikovurdering"));
const IkMatAllergener = lazy(() => import("./pages/IkMatAllergener"));
const IkMatFasteAvtaler = lazy(() => import("./pages/IkMatFasteAvtaler"));
const IkMatKontroll = lazy(() => import("./pages/IkMatKontroll"));
const IkMatMaal = lazy(() => import("./pages/IkMatMaal"));
const IkMatOrganisasjon = lazy(() => import("./pages/IkMatOrganisasjon"));
const IkMatRutiner = lazy(() => import("./pages/IkMatRutiner"));
const IkMatRisikoOgTiltak = lazy(() => import("./pages/IkMatRisikoOgTiltak"));
const IkMatDokumentsenter = lazy(() => import("./pages/IkMatDokumentsenter"));
const IkMatAvvik = lazy(() => import("./pages/IkMatAvvik"));
const IkMatTemperaturlogg = lazy(() => import("./pages/IkMatTemperaturlogg"));

// IK Alkohol
const IkAlkoholDashboard = lazy(() => import("./pages/ikalkohol/IkAlkoholDashboard"));
const IkAlkoholInternkontroll = lazy(() => import("./pages/ikalkohol/IkAlkoholInternkontroll"));
const IkAlkoholHendelser = lazy(() => import("./pages/ikalkohol/IkAlkoholHendelser"));
const IkAlkoholRutiner = lazy(() => import("./pages/ikalkohol/IkAlkoholRutiner"));
const IkAlkoholOrganisering = lazy(() => import("./pages/ikalkohol/IkAlkoholOrganisering"));
const IkAlkoholMaal = lazy(() => import("./pages/ikalkohol/IkAlkoholMaal"));
const IkAlkoholRisikoanalyse = lazy(() => import("./pages/ikalkohol/IkAlkoholRisikoanalyse"));
const IkAlkoholDokumentsenter = lazy(() => import("./pages/ikalkohol/IkAlkoholDokumentsenter"));
const IkAlkoholKontroll = lazy(() => import("./pages/ikalkohol/IkAlkoholKontroll"));
const IkAlkoholHandbok = lazy(() => import("./pages/ikalkohol/IkAlkoholHandbok"));
const IkAlkoholLovverk = lazy(() => import("./pages/ikalkohol/IkAlkoholLovverk"));

// KS Bygg
const Ks2Dashboard = lazy(() => import("./pages/ks2/Ks2Dashboard"));
const Ks2ProjectDetail = lazy(() => import("./pages/ks2/Ks2ProjectDetail"));
const Ks2Admin = lazy(() => import("./pages/ks2/Ks2Admin"));
const Ks2Statistikk = lazy(() => import("./pages/ks2/Ks2Statistikk"));
const Ks2Befaring = lazy(() => import("./pages/ks2/Ks2Befaring"));
const KsKalkyler = lazy(() => import("./pages/ks2/KsKalkyler"));
const IkKsRutiner = lazy(() => import("./pages/ks2/IkKsRutiner"));
const IkKsMaal = lazy(() => import("./pages/ks2/IkKsMaal"));
const IkKsDokumenter = lazy(() => import("./pages/ks2/IkKsDokumenter"));
const IkKsSjekklister = lazy(() => import("./pages/ks2/IkKsSjekklister"));
const IkKsMaalsetting = lazy(() => import("./pages/ks2/IkKsMaalsetting"));
const IkKsOrganisering = lazy(() => import("./pages/ks2/IkKsOrganisering"));
const IkKsEgenerklaering = lazy(() => import("./pages/ks2/IkKsEgenerklaering"));
const IkKsHandbok = lazy(() => import("./pages/ks2/IkKsHandbok"));

// Mine prosjekter
const MineProsjekterDashboard = lazy(() => import("./pages/mineprosjekter/MineProsjekterDashboard"));
const SimpleProjectDetail = lazy(() => import("./pages/mineprosjekter/SimpleProjectDetail"));

// FDV
const FdvDashboard = lazy(() => import("./pages/fdv/FdvDashboard"));
const FdvBuildings = lazy(() => import("./pages/fdv/FdvBuildings"));
const FdvControls = lazy(() => import("./pages/fdv/FdvControls"));
const FdvRisks = lazy(() => import("./pages/fdv/FdvRisks"));
const FdvRegulations = lazy(() => import("./pages/fdv/FdvRegulations"));
const FdvFloorPlans = lazy(() => import("./pages/fdv/FdvFloorPlans"));

// HR
const HrContracts = lazy(() => import("./pages/hr/HrContracts"));
const HrAbsence = lazy(() => import("./pages/hr/HrAbsence"));
const HrMeetings = lazy(() => import("./pages/hr/HrMeetings"));
const HrSurveys = lazy(() => import("./pages/hr/HrSurveys"));
const MyContract = lazy(() => import("./pages/hr/MyContract"));

// My pages
const MyAbsence = lazy(() => import("./pages/my/MyAbsence"));
const MySurveys = lazy(() => import("./pages/my/MySurveys"));
const MyMessages = lazy(() => import("./pages/my/MyMessages"));
const MyDrivingLog = lazy(() => import("./pages/my/MyDrivingLog"));
const MyEmployeeCard = lazy(() => import("./pages/my/MyEmployeeCard"));

// Personalhandbok
const PersonalhandbokPage = lazy(() => import("./pages/personalhandbok/PersonalhandbokPage"));

// Admin
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCompanies = lazy(() => import("./pages/admin/AdminCompanies"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminHmsRequests = lazy(() => import("./pages/admin/AdminHmsRequests"));
const AdminSgRegister = lazy(() => import("./pages/admin/AdminSgRegister"));
const AdminDocuments = lazy(() => import("./pages/admin/AdminDocuments"));
const AdminKsPanel = lazy(() => import("./pages/admin/AdminKsPanel"));
const AdminByggesakTemplates = lazy(() => import("./pages/admin/AdminByggesakTemplates"));
const AdminCustomerImport = lazy(() => import("./pages/admin/AdminCustomerImport"));
const AdminStoffkartotek = lazy(() => import("./pages/admin/AdminStoffkartotek"));
const AdminRoutineMaker = lazy(() => import("./pages/admin/AdminRoutineMaker"));
const AdminEmailLog = lazy(() => import("./pages/admin/AdminEmailLog"));
const AdminMonitoring = lazy(() => import("./pages/admin/AdminMonitoring"));
const SetupSystemAdmin = lazy(() => import("./pages/admin/SetupSystemAdmin"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <LanguageProvider>
            <DepartmentProvider>
              <AccentColorProvider>
                <TooltipProvider>
                  <Toaster />
                <Sonner />
                <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/setup-admin" element={<SetupSystemAdmin />} />
                  <Route path="/install" element={<InstallApp />} />
                  <Route path="/install/avvik" element={<InstallAvvikApp />} />
                  <Route path="/stemple" element={<TimeClock />} />
                
                  {/* Protected app routes */}
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/avdeling/:departmentId" element={<ProtectedRoute><DepartmentDashboard /></ProtectedRoute>} />
                  <Route path="/avdeling/:departmentId/maal" element={<ProtectedRoute><DepartmentGoals /></ProtectedRoute>} />
                  <Route path="/avdeling/:departmentId/organisering" element={<ProtectedRoute><DepartmentOrganization /></ProtectedRoute>} />
                  <Route path="/avdeling/:departmentId/rutiner" element={<ProtectedRoute><DepartmentRoutines /></ProtectedRoute>} />
                  <Route path="/avdeling/:departmentId/oppsett/ai" element={<ProtectedRoute><DepartmentAiSetup /></ProtectedRoute>} />
                  <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
                  <Route path="/setup/ai" element={<ProtectedRoute><IkHmsOppsett /></ProtectedRoute>} />
                  <Route path="/maalsetting" element={<ProtectedRoute><IkHmsMaal /></ProtectedRoute>} />
                  <Route path="/organisering" element={<ProtectedRoute><IkHmsOrganisering /></ProtectedRoute>} />
                  <Route path="/risikoanalyse" element={<ProtectedRoute><Risikoanalyse /></ProtectedRoute>} />
                  <Route path="/rutiner" element={<ProtectedRoute><IkHmsRutiner /></ProtectedRoute>} />
                  <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
                  <Route path="/deviations" element={<ProtectedRoute><Deviations /></ProtectedRoute>} />
                  <Route path="/audits" element={<ProtectedRoute><Audits /></ProtectedRoute>} />
                  <Route path="/handbook" element={<ProtectedRoute><Handbook /></ProtectedRoute>} />
                  <Route path="/stoffkartotek" element={<ProtectedRoute><IkHmsStoffkartotek /></ProtectedRoute>} />
                  <Route path="/lover-og-forskrifter" element={<ProtectedRoute><LoverOgForskrifter /></ProtectedRoute>} />
                  <Route path="/dokumentsenter" element={<ProtectedRoute><IkHmsDokumentsenter /></ProtectedRoute>} />
                  <Route path="/hms-chat" element={<ProtectedRoute><HmsChat /></ProtectedRoute>} />
                  <Route path="/my-courses" element={<ProtectedRoute><MyCourseCard /></ProtectedRoute>} />
                  <Route path="/time-registration" element={<ProtectedRoute><TimeRegistration /></ProtectedRoute>} />
                  <Route path="/time-off" element={<ProtectedRoute><TimeOff /></ProtectedRoute>} />
                  <Route path="/work-schedule" element={<ProtectedRoute><WorkSchedule /></ProtectedRoute>} />
                  
                  {/* HR/Personaladministrasjon routes - for admins */}
                  <Route path="/hr/contracts" element={<ProtectedRoute><HrContracts /></ProtectedRoute>} />
                  <Route path="/hr/absence" element={<ProtectedRoute><HrAbsence /></ProtectedRoute>} />
                  <Route path="/hr/meetings" element={<ProtectedRoute><HrMeetings /></ProtectedRoute>} />
                  <Route path="/hr/surveys" element={<ProtectedRoute><HrSurveys /></ProtectedRoute>} />
                  
                  {/* My pages - for employees */}
                  <Route path="/my/contract" element={<ProtectedRoute><MyContract /></ProtectedRoute>} />
                  <Route path="/my/absence" element={<ProtectedRoute><MyAbsence /></ProtectedRoute>} />
                  <Route path="/my/surveys" element={<ProtectedRoute><MySurveys /></ProtectedRoute>} />
                  <Route path="/my/messages" element={<ProtectedRoute><MyMessages /></ProtectedRoute>} />
                  <Route path="/my/driving-log" element={<ProtectedRoute><MyDrivingLog /></ProtectedRoute>} />
                  <Route path="/my/employee-card" element={<ProtectedRoute><MyEmployeeCard /></ProtectedRoute>} />
                  
                  <Route path="/ik-mat/handbok" element={<ProtectedRoute><IkMatHandbok /></ProtectedRoute>} />
                  <Route path="/ik-mat/oppsett" element={<ProtectedRoute><IkMatOppsett /></ProtectedRoute>} />
                  <Route path="/ik-mat/maal" element={<ProtectedRoute><IkMatMaal /></ProtectedRoute>} />
                  <Route path="/ik-mat/organisasjon" element={<ProtectedRoute><IkMatOrganisasjon /></ProtectedRoute>} />
                  <Route path="/ik-mat/risiko-og-tiltak" element={<ProtectedRoute><IkMatRisikoOgTiltak /></ProtectedRoute>} />
                  <Route path="/ik-mat/risikovurdering" element={<Navigate to="/ik-mat/risiko-og-tiltak" replace />} />
                  <Route path="/ik-mat/handlingsplan" element={<Navigate to="/ik-mat/risiko-og-tiltak" replace />} />
                  <Route path="/ik-mat/rutiner" element={<ProtectedRoute><IkMatRutiner /></ProtectedRoute>} />
                  <Route path="/ik-mat/haccp" element={<ProtectedRoute><IkMatHaccp /></ProtectedRoute>} />
                  <Route path="/ik-mat/kontroll" element={<ProtectedRoute><IkMatKontroll /></ProtectedRoute>} />
                  <Route path="/ik-mat/sjekklister" element={<Navigate to="/ik-mat/kontroll?tab=sjekklister" replace />} />
                  <Route path="/ik-mat/renholdsplan" element={<Navigate to="/ik-mat/kontroll?tab=renholdsplan" replace />} />
                  <Route path="/ik-mat/temperaturlogg" element={<Navigate to="/ik-mat/kontroll?tab=temperatur" replace />} />
                  <Route path="/ik-mat/sporbarhet" element={<Navigate to="/ik-mat/kontroll?tab=sporbarhet" replace />} />
                  <Route path="/ik-mat/allergener" element={<ProtectedRoute><IkMatAllergener /></ProtectedRoute>} />
                  <Route path="/ik-mat/faste-avtaler" element={<ProtectedRoute><IkMatFasteAvtaler /></ProtectedRoute>} />
                  <Route path="/ik-mat/dokumentsenter" element={<ProtectedRoute><IkMatDokumentsenter /></ProtectedRoute>} />
                  <Route path="/ik-mat/avvik" element={<ProtectedRoute><IkMatAvvik /></ProtectedRoute>} />
                  <Route path="/ik-mat/bestill-plakater" element={<Navigate to="/ik-mat/dokumentsenter" replace />} />
                  {/* IK Alkohol routes */}
                  <Route path="/ik-alkohol" element={<ProtectedRoute><IkAlkoholDashboard /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/internkontroll" element={<ProtectedRoute><IkAlkoholInternkontroll /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/hendelser" element={<ProtectedRoute><IkAlkoholHendelser /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/rutiner" element={<ProtectedRoute><IkAlkoholRutiner /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/organisering" element={<ProtectedRoute><IkAlkoholOrganisering /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/maal" element={<ProtectedRoute><IkAlkoholMaal /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/risikoanalyse" element={<ProtectedRoute><IkAlkoholRisikoanalyse /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/dokumentsenter" element={<ProtectedRoute><IkAlkoholDokumentsenter /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/kontroll" element={<ProtectedRoute><IkAlkoholKontroll /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/handbok" element={<ProtectedRoute><IkAlkoholHandbok /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/lovverk" element={<ProtectedRoute><IkAlkoholLovverk /></ProtectedRoute>} />
                  
                  {/* IK/FDV routes */}
                  <Route path="/fdv" element={<ProtectedRoute><FdvDashboard /></ProtectedRoute>} />
                  <Route path="/fdv/bygg" element={<ProtectedRoute><FdvBuildings /></ProtectedRoute>} />
                  <Route path="/fdv/kontroller" element={<ProtectedRoute><FdvControls /></ProtectedRoute>} />
                  <Route path="/fdv/risiko" element={<ProtectedRoute><FdvRisks /></ProtectedRoute>} />
                  <Route path="/fdv/regelverk" element={<ProtectedRoute><FdvRegulations /></ProtectedRoute>} />
                  <Route path="/fdv/etasjeplaner" element={<ProtectedRoute><FdvFloorPlans /></ProtectedRoute>} />
                  
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/brukerveiledning" element={<ProtectedRoute><Brukerveiledning /></ProtectedRoute>} />
                  <Route path="/anonymous-messages" element={<ProtectedRoute><AnonymousMessages /></ProtectedRoute>} />
                  
                  {/* KS Bygg routes */}
                  <Route path="/ks" element={<ProtectedRoute><Ks2Dashboard /></ProtectedRoute>} />
                  <Route path="/ks/statistikk" element={<ProtectedRoute><Ks2Statistikk /></ProtectedRoute>} />
                  <Route path="/ks/project/:projectId/*" element={<ProtectedRoute><Ks2ProjectDetail /></ProtectedRoute>} />
                  <Route path="/ks/admin" element={<ProtectedRoute><Ks2Admin /></ProtectedRoute>} />
                  <Route path="/ks/befaring" element={<ProtectedRoute><Ks2Befaring /></ProtectedRoute>} />
                  <Route path="/ks/kalkyler" element={<ProtectedRoute><KsKalkyler /></ProtectedRoute>} />
                  
                  {/* IK/KS Grunnlag routes */}
                  <Route path="/ks/ik-ks/maalsetting" element={<ProtectedRoute><IkKsMaalsetting /></ProtectedRoute>} />
                  <Route path="/ks/ik-ks/organisering" element={<ProtectedRoute><IkKsOrganisering /></ProtectedRoute>} />
                  <Route path="/ks/ik-ks/rutiner" element={<ProtectedRoute><IkKsRutiner /></ProtectedRoute>} />
                  <Route path="/ks/ik-ks/maal" element={<Navigate to="/ks/ik-ks/maalsetting" replace />} />
                  <Route path="/ks/ik-ks/dokumenter" element={<ProtectedRoute><IkKsDokumenter /></ProtectedRoute>} />
                  <Route path="/ks/ik-ks/sjekklister" element={<ProtectedRoute><IkKsSjekklister /></ProtectedRoute>} />
                  <Route path="/ks/ik-ks/egenerklaering" element={<ProtectedRoute><IkKsEgenerklaering /></ProtectedRoute>} />
                  <Route path="/ks/ik-ks/handbok" element={<ProtectedRoute><IkKsHandbok /></ProtectedRoute>} />
                  
                  {/* Småprosjekter routes */}
                  <Route path="/ks/smaaprosjekter" element={<ProtectedRoute><MineProsjekterDashboard /></ProtectedRoute>} />
                  <Route path="/ks/smaaprosjekter/:projectId" element={<ProtectedRoute><SimpleProjectDetail /></ProtectedRoute>} />
                  
                  {/* Personalhåndbok routes */}
                  <Route path="/personalhandbok" element={<ProtectedRoute><PersonalhandbokPage /></ProtectedRoute>} />
                  
                  {/* Admin routes - require system_admin role */}
                  <Route path="/admin" element={<ProtectedRoute requireSystemAdmin><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/companies" element={<ProtectedRoute requireSystemAdmin><AdminCompanies /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute requireSystemAdmin><AdminUsers /></ProtectedRoute>} />
                  <Route path="/admin/hms-requests" element={<ProtectedRoute requireSystemAdmin><AdminHmsRequests /></ProtectedRoute>} />
                  <Route path="/admin/sg-register" element={<ProtectedRoute requireSystemAdmin><AdminSgRegister /></ProtectedRoute>} />
                  <Route path="/admin/documents" element={<ProtectedRoute requireSystemAdmin><AdminDocuments /></ProtectedRoute>} />
                  <Route path="/admin/ks-panel" element={<ProtectedRoute requireSystemAdmin><AdminKsPanel /></ProtectedRoute>} />
                  <Route path="/admin/byggesak-templates" element={<ProtectedRoute requireSystemAdmin><AdminByggesakTemplates /></ProtectedRoute>} />
                  <Route path="/admin/customer-import" element={<ProtectedRoute requireSystemAdmin><AdminCustomerImport /></ProtectedRoute>} />
                  <Route path="/admin/stoffkartotek" element={<ProtectedRoute requireSystemAdmin><AdminStoffkartotek /></ProtectedRoute>} />
                  <Route path="/admin/routine-maker" element={<ProtectedRoute requireSystemAdmin><AdminRoutineMaker /></ProtectedRoute>} />
                  <Route path="/admin/email-log" element={<ProtectedRoute requireSystemAdmin><AdminEmailLog /></ProtectedRoute>} />
                  
                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
                  </BrowserRouter>
                </TooltipProvider>
              </AccentColorProvider>
            </DepartmentProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
