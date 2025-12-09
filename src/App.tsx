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
import AdminKsPanel from "./pages/admin/AdminKsPanel";
import AdminByggesakTemplates from "./pages/admin/AdminByggesakTemplates";
import SetupSystemAdmin from "./pages/admin/SetupSystemAdmin";
import Ks2Dashboard from "./pages/ks2/Ks2Dashboard";
import Ks2ProjectDetail from "./pages/ks2/Ks2ProjectDetail";
import Ks2Admin from "./pages/ks2/Ks2Admin";
import Ks2Statistikk from "./pages/ks2/Ks2Statistikk";
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
import IkHmsStoffkartotek from "./pages/IkHmsStoffkartotek";
import IkHmsDokumentsenter from "./pages/IkHmsDokumentsenter";
import LoverOgForskrifter from "./pages/LoverOgForskrifter";
import AnonymousMessages from "./pages/AnonymousMessages";
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
              <Route path="/stemple" element={<TimeClock />} />
            
            {/* Protected app routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
            <Route path="/setup/ai" element={<ProtectedRoute><IkHmsOppsett /></ProtectedRoute>} />
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
          <Route path="/ik-mat/haccp" element={<ProtectedRoute><IkMatHaccp /></ProtectedRoute>} />
          <Route path="/ik-mat/risikovurdering" element={<ProtectedRoute><IkMatRisikovurdering /></ProtectedRoute>} />
          <Route path="/ik-mat/sjekklister" element={<ProtectedRoute><IkMatSjekklister /></ProtectedRoute>} />
          <Route path="/ik-mat/renholdsplan" element={<ProtectedRoute><IkMatRenholdsplan /></ProtectedRoute>} />
          <Route path="/ik-mat/allergener" element={<ProtectedRoute><IkMatAllergener /></ProtectedRoute>} />
          <Route path="/ik-mat/faste-avtaler" element={<ProtectedRoute><IkMatFasteAvtaler /></ProtectedRoute>} />
          <Route path="/ik-mat/sporbarhet" element={<ProtectedRoute><IkMatSporbarhet /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/anonymous-messages" element={<ProtectedRoute><AnonymousMessages /></ProtectedRoute>} />
            
            {/* KS Bygg routes */}
            <Route path="/ks" element={<ProtectedRoute><Ks2Dashboard /></ProtectedRoute>} />
            <Route path="/ks/statistikk" element={<ProtectedRoute><Ks2Statistikk /></ProtectedRoute>} />
            <Route path="/ks/project/:projectId/*" element={<ProtectedRoute><Ks2ProjectDetail /></ProtectedRoute>} />
            <Route path="/ks/admin" element={<ProtectedRoute><Ks2Admin /></ProtectedRoute>} />
            
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
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;