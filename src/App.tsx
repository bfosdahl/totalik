import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { DepartmentProvider } from "@/contexts/DepartmentContext";
import { AccentColorProvider } from "@/components/AccentColorProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import Employees from "./pages/Employees";
import Deviations from "./pages/Deviations";
import Audits from "./pages/Audits";
import Handbook from "./pages/Handbook";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCompanies from "./pages/admin/AdminCompanies";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminHmsRequests from "./pages/admin/AdminHmsRequests";
import AdminSgRegister from "./pages/admin/AdminSgRegister";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminKsPanel from "./pages/admin/AdminKsPanel";
import AdminByggesakTemplates from "./pages/admin/AdminByggesakTemplates";
import SetupSystemAdmin from "./pages/admin/SetupSystemAdmin";
import Ks2Dashboard from "./pages/ks2/Ks2Dashboard";
import Ks2ProjectDetail from "./pages/ks2/Ks2ProjectDetail";
import Ks2Admin from "./pages/ks2/Ks2Admin";
import Ks2Statistikk from "./pages/ks2/Ks2Statistikk";
import Ks2Befaring from "./pages/ks2/Ks2Befaring";
import IkKsRutiner from "./pages/ks2/IkKsRutiner";
import IkKsMaal from "./pages/ks2/IkKsMaal";
import IkKsDokumenter from "./pages/ks2/IkKsDokumenter";
import IkKsSjekklister from "./pages/ks2/IkKsSjekklister";
import MineProsjekterDashboard from "./pages/mineprosjekter/MineProsjekterDashboard";
import SimpleProjectDetail from "./pages/mineprosjekter/SimpleProjectDetail";
import HmsChat from "./pages/HmsChat";
import MyCourseCard from "./pages/MyCourseCard";
import TimeRegistration from "./pages/TimeRegistration";
import TimeClock from "./pages/TimeClock";
import TimeOff from "./pages/TimeOff";
import WorkSchedule from "./pages/WorkSchedule";
import HrContracts from "./pages/hr/HrContracts";
import HrAbsence from "./pages/hr/HrAbsence";
import HrMeetings from "./pages/hr/HrMeetings";
import HrSurveys from "./pages/hr/HrSurveys";
import MyAbsence from "./pages/my/MyAbsence";
import MySurveys from "./pages/my/MySurveys";
import InstallApp from "./pages/InstallApp";
import InstallAvvikApp from "./pages/InstallAvvikApp";
import IkMatHandbok from "./pages/IkMatHandbok";
import IkMatOppsett from "./pages/IkMatOppsett";
import IkMatHaccp from "./pages/IkMatHaccp";
import IkMatRisikovurdering from "./pages/IkMatRisikovurdering";
import IkMatAllergener from "./pages/IkMatAllergener";
import IkMatFasteAvtaler from "./pages/IkMatFasteAvtaler";
import IkMatKontroll from "./pages/IkMatKontroll";
import IkMatMaal from "./pages/IkMatMaal";
import IkMatOrganisasjon from "./pages/IkMatOrganisasjon";
import IkMatRutiner from "./pages/IkMatRutiner";
import IkMatRisikoOgTiltak from "./pages/IkMatRisikoOgTiltak";
import IkMatDokumentsenter from "./pages/IkMatDokumentsenter";
import IkMatTemperaturlogg from "./pages/IkMatTemperaturlogg";
import IkAlkoholDashboard from "./pages/ikalkohol/IkAlkoholDashboard";
import IkAlkoholInternkontroll from "./pages/ikalkohol/IkAlkoholInternkontroll";
import IkAlkoholHendelser from "./pages/ikalkohol/IkAlkoholHendelser";
import IkAlkoholRutiner from "./pages/ikalkohol/IkAlkoholRutiner";
import IkAlkoholOrganisering from "./pages/ikalkohol/IkAlkoholOrganisering";
import IkAlkoholMaal from "./pages/ikalkohol/IkAlkoholMaal";
import IkAlkoholRisikoanalyse from "./pages/ikalkohol/IkAlkoholRisikoanalyse";
import IkAlkoholDokumentsenter from "./pages/ikalkohol/IkAlkoholDokumentsenter";
import IkHmsOppsett from "./pages/IkHmsOppsett";
import IkHmsMaal from "./pages/IkHmsMaal";
import IkHmsOrganisering from "./pages/IkHmsOrganisering";
import IkHmsStoffkartotek from "./pages/IkHmsStoffkartotek";
import IkHmsDokumentsenter from "./pages/IkHmsDokumentsenter";
import LoverOgForskrifter from "./pages/LoverOgForskrifter";
import AnonymousMessages from "./pages/AnonymousMessages";
import Risikoanalyse from "./pages/Risikoanalyse";
import IkHmsRutiner from "./pages/IkHmsRutiner";
import Brukerveiledning from "./pages/Brukerveiledning";
import NotFound from "./pages/NotFound";
import DepartmentGoals from "./pages/department/DepartmentGoals";
import DepartmentOrganization from "./pages/department/DepartmentOrganization";
import DepartmentRoutines from "./pages/department/DepartmentRoutines";
import DepartmentAiSetup from "./pages/department/DepartmentAiSetup";
import DepartmentDashboard from "./pages/DepartmentDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <DepartmentProvider>
          <AccentColorProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
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
                  <Route path="/my/absence" element={<ProtectedRoute><MyAbsence /></ProtectedRoute>} />
                  <Route path="/my/surveys" element={<ProtectedRoute><MySurveys /></ProtectedRoute>} />
                  
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
                  {/* IK Alkohol routes */}
                  <Route path="/ik-alkohol" element={<ProtectedRoute><IkAlkoholDashboard /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/internkontroll" element={<ProtectedRoute><IkAlkoholInternkontroll /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/hendelser" element={<ProtectedRoute><IkAlkoholHendelser /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/rutiner" element={<ProtectedRoute><IkAlkoholRutiner /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/organisering" element={<ProtectedRoute><IkAlkoholOrganisering /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/maal" element={<ProtectedRoute><IkAlkoholMaal /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/risikoanalyse" element={<ProtectedRoute><IkAlkoholRisikoanalyse /></ProtectedRoute>} />
                  <Route path="/ik-alkohol/dokumentsenter" element={<ProtectedRoute><IkAlkoholDokumentsenter /></ProtectedRoute>} />
                  
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/brukerveiledning" element={<ProtectedRoute><Brukerveiledning /></ProtectedRoute>} />
                  <Route path="/anonymous-messages" element={<ProtectedRoute><AnonymousMessages /></ProtectedRoute>} />
                  
                  {/* KS Bygg routes */}
                  <Route path="/ks" element={<ProtectedRoute><Ks2Dashboard /></ProtectedRoute>} />
                  <Route path="/ks/statistikk" element={<ProtectedRoute><Ks2Statistikk /></ProtectedRoute>} />
                  <Route path="/ks/project/:projectId/*" element={<ProtectedRoute><Ks2ProjectDetail /></ProtectedRoute>} />
                  <Route path="/ks/admin" element={<ProtectedRoute><Ks2Admin /></ProtectedRoute>} />
                  <Route path="/ks/befaring" element={<ProtectedRoute><Ks2Befaring /></ProtectedRoute>} />
                  
                  {/* IK/KS Grunnlag routes */}
                  <Route path="/ks/ik-ks/rutiner" element={<ProtectedRoute><IkKsRutiner /></ProtectedRoute>} />
                  <Route path="/ks/ik-ks/maal" element={<ProtectedRoute><IkKsMaal /></ProtectedRoute>} />
                  <Route path="/ks/ik-ks/dokumenter" element={<ProtectedRoute><IkKsDokumenter /></ProtectedRoute>} />
                  <Route path="/ks/ik-ks/sjekklister" element={<ProtectedRoute><IkKsSjekklister /></ProtectedRoute>} />
                  
                  {/* Småprosjekter routes */}
                  <Route path="/ks/smaaprosjekter" element={<ProtectedRoute><MineProsjekterDashboard /></ProtectedRoute>} />
                  <Route path="/ks/smaaprosjekter/:projectId" element={<ProtectedRoute><SimpleProjectDetail /></ProtectedRoute>} />
                  
                  {/* Admin routes - require system_admin role */}
                  <Route path="/admin" element={<ProtectedRoute requireSystemAdmin><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/companies" element={<ProtectedRoute requireSystemAdmin><AdminCompanies /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute requireSystemAdmin><AdminUsers /></ProtectedRoute>} />
                  <Route path="/admin/hms-requests" element={<ProtectedRoute requireSystemAdmin><AdminHmsRequests /></ProtectedRoute>} />
                  <Route path="/admin/sg-register" element={<ProtectedRoute requireSystemAdmin><AdminSgRegister /></ProtectedRoute>} />
                  <Route path="/admin/documents" element={<ProtectedRoute requireSystemAdmin><AdminDocuments /></ProtectedRoute>} />
                  <Route path="/admin/ks-panel" element={<ProtectedRoute requireSystemAdmin><AdminKsPanel /></ProtectedRoute>} />
                  <Route path="/admin/byggesak-templates" element={<ProtectedRoute requireSystemAdmin><AdminByggesakTemplates /></ProtectedRoute>} />
                  
                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AccentColorProvider>
        </DepartmentProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;