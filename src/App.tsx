import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
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
import SetupSystemAdmin from "./pages/admin/SetupSystemAdmin";
import KsProjectsOverview from "./pages/ks/KsProjectsOverview";
import KsProjectDetail from "./pages/ks/KsProjectDetail";
import KsChecklistDetail from "./pages/ks/KsChecklistDetail";

import KsHmsPlanWizard from "./pages/ks/KsHmsPlanWizard";
import KsRoutines from "./pages/ks/KsRoutines";
import KsSja from "./pages/ks/KsSja";
import KsAvvik from "./pages/ks/KsAvvik";
import KsVernerunder from "./pages/ks/KsVernerunder";
import KsFarligeFohold from "./pages/ks/KsFarligeFohold";
import KsTiltakslogg from "./pages/ks/KsTiltakslogg";

import KsProjectReport from "./pages/ks/KsProjectReport";
import KsSubcontractorOverview from "./pages/ks/KsSubcontractorOverview";
import KsSubcontractorView from "./pages/ks/KsSubcontractorView";
import KsClientManagement from "./pages/ks/KsClientManagement";
import KsSubcontractorManagement from "./pages/ks/KsSubcontractorManagement";
import KsChecklists from "./pages/ks/KsChecklists";
import KsDocumentCenter from "./pages/ks/KsDocumentCenter";
import KsInspeksjoner from "./pages/ks/KsInspeksjoner";
import KsInspeksjonDetail from "./pages/ks/KsInspeksjonDetail";
import KsInspeksjonMalGenerator from "./pages/ks/KsInspeksjonMalGenerator";
import KsDashboard from "./pages/ks/KsDashboard";
import KsEgenkontroller from "./pages/ks/KsEgenkontroller";
import KsUavhengigKontroll from "./pages/ks/KsUavhengigKontroll";
import KsRapporterFdv from "./pages/ks/KsRapporterFdv";
import KsMalbibliotek from "./pages/ks/KsMalbibliotek";
import KsDokumentsenter from "./pages/ks/KsDokumentsenter";
import HmsChat from "./pages/HmsChat";
import MyCourseCard from "./pages/MyCourseCard";
import TimeRegistration from "./pages/TimeRegistration";
import TimeOff from "./pages/TimeOff";
import WorkSchedule from "./pages/WorkSchedule";
import HrContracts from "./pages/hr/HrContracts";
import HrAbsence from "./pages/hr/HrAbsence";
import HrMeetings from "./pages/hr/HrMeetings";
import HrSurveys from "./pages/hr/HrSurveys";
import MyAbsence from "./pages/my/MyAbsence";
import MySurveys from "./pages/my/MySurveys";
import InstallApp from "./pages/InstallApp";
import IkMatHandbok from "./pages/IkMatHandbok";
import IkMatOppsett from "./pages/IkMatOppsett";
import IkMatHaccp from "./pages/IkMatHaccp";
import IkMatRisikovurdering from "./pages/IkMatRisikovurdering";
import IkMatSjekklister from "./pages/IkMatSjekklister";
import IkMatRenholdsplan from "./pages/IkMatRenholdsplan";
import IkMatAllergener from "./pages/IkMatAllergener";
import IkMatFasteAvtaler from "./pages/IkMatFasteAvtaler";
import IkMatSporbarhet from "./pages/IkMatSporbarhet";
import IkHmsOppsett from "./pages/IkHmsOppsett";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
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
            
            {/* Protected app routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
            <Route path="/setup/ai" element={<ProtectedRoute><IkHmsOppsett /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/deviations" element={<ProtectedRoute><Deviations /></ProtectedRoute>} />
            <Route path="/audits" element={<ProtectedRoute><Audits /></ProtectedRoute>} />
            <Route path="/handbook" element={<ProtectedRoute><Handbook /></ProtectedRoute>} />
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
          <Route path="/ik-mat/haccp" element={<ProtectedRoute><IkMatHaccp /></ProtectedRoute>} />
          <Route path="/ik-mat/risikovurdering" element={<ProtectedRoute><IkMatRisikovurdering /></ProtectedRoute>} />
          <Route path="/ik-mat/sjekklister" element={<ProtectedRoute><IkMatSjekklister /></ProtectedRoute>} />
          <Route path="/ik-mat/renholdsplan" element={<ProtectedRoute><IkMatRenholdsplan /></ProtectedRoute>} />
          <Route path="/ik-mat/allergener" element={<ProtectedRoute><IkMatAllergener /></ProtectedRoute>} />
          <Route path="/ik-mat/faste-avtaler" element={<ProtectedRoute><IkMatFasteAvtaler /></ProtectedRoute>} />
          <Route path="/ik-mat/sporbarhet" element={<ProtectedRoute><IkMatSporbarhet /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            {/* KS Bygg routes */}
            <Route path="/ks" element={<ProtectedRoute><KsDashboard /></ProtectedRoute>} />
            <Route path="/ks/dashboard" element={<ProtectedRoute><KsDashboard /></ProtectedRoute>} />
            <Route path="/ks/egenkontroller" element={<ProtectedRoute><KsEgenkontroller /></ProtectedRoute>} />
            <Route path="/ks/uavhengig-kontroll" element={<ProtectedRoute><KsUavhengigKontroll /></ProtectedRoute>} />
            <Route path="/ks/rapporter" element={<ProtectedRoute><KsRapporterFdv /></ProtectedRoute>} />
            <Route path="/ks/malbibliotek" element={<ProtectedRoute><KsMalbibliotek /></ProtectedRoute>} />
            <Route path="/ks/dokumentsenter" element={<ProtectedRoute><KsDokumentsenter /></ProtectedRoute>} />
            <Route path="/ks/projects" element={<ProtectedRoute><KsProjectsOverview /></ProtectedRoute>} />
            <Route path="/ks/projects/:id" element={<ProtectedRoute><KsProjectDetail /></ProtectedRoute>} />
            <Route path="/ks/projects/:projectId/hms-plan" element={<ProtectedRoute><KsHmsPlanWizard /></ProtectedRoute>} />
            <Route path="/ks/projects/:projectId/documents" element={<ProtectedRoute><KsDocumentCenter /></ProtectedRoute>} />
            <Route path="/ks/checklists" element={<ProtectedRoute><KsChecklists /></ProtectedRoute>} />
            <Route path="/ks/checklists/:id" element={<ProtectedRoute><KsChecklistDetail /></ProtectedRoute>} />
            <Route path="/ks/routines" element={<ProtectedRoute><KsRoutines /></ProtectedRoute>} />
            <Route path="/ks/sja" element={<ProtectedRoute><KsSja /></ProtectedRoute>} />
            <Route path="/ks/avvik" element={<ProtectedRoute><KsAvvik /></ProtectedRoute>} />
          <Route path="/ks/inspeksjoner" element={<ProtectedRoute><KsInspeksjoner /></ProtectedRoute>} />
          <Route path="/ks/inspeksjon/:id" element={<ProtectedRoute><KsInspeksjonDetail /></ProtectedRoute>} />
          <Route path="/ks/inspeksjon-maler" element={<ProtectedRoute><KsInspeksjonMalGenerator /></ProtectedRoute>} />
            <Route path="/ks/farlige-forhold" element={<ProtectedRoute><KsFarligeFohold /></ProtectedRoute>} />
            <Route path="/ks/tiltakslogg" element={<ProtectedRoute><KsTiltakslogg /></ProtectedRoute>} />
            <Route path="/ks/vernerunder" element={<ProtectedRoute><KsVernerunder /></ProtectedRoute>} />
            <Route path="/ks/report" element={<ProtectedRoute><KsProjectReport /></ProtectedRoute>} />
            <Route path="/ks/client/:projectId" element={<ProtectedRoute><KsClientManagement /></ProtectedRoute>} />
            <Route path="/ks/projects/:id/ue" element={<ProtectedRoute><KsSubcontractorManagement /></ProtectedRoute>} />
            
            {/* Subcontractor overview for company */}
            <Route path="/ks/underleverandorer" element={<ProtectedRoute><KsSubcontractorOverview /></ProtectedRoute>} />
            
            {/* Subcontractor view - limited access portal for UE themselves */}
            <Route path="/ks/subcontractor" element={<ProtectedRoute><KsSubcontractorView /></ProtectedRoute>} />
            
            {/* Admin routes - require system_admin role */}
            <Route path="/admin" element={<ProtectedRoute requireSystemAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/companies" element={<ProtectedRoute requireSystemAdmin><AdminCompanies /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireSystemAdmin><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/hms-requests" element={<ProtectedRoute requireSystemAdmin><AdminHmsRequests /></ProtectedRoute>} />
            <Route path="/admin/sg-register" element={<ProtectedRoute requireSystemAdmin><AdminSgRegister /></ProtectedRoute>} />
            <Route path="/admin/documents" element={<ProtectedRoute requireSystemAdmin><AdminDocuments /></ProtectedRoute>} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </AccentColorProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
