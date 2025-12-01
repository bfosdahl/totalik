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
import SetupSystemAdmin from "./pages/admin/SetupSystemAdmin";
import KsProjectsOverview from "./pages/ks/KsProjectsOverview";
import KsProjectDetail from "./pages/ks/KsProjectDetail";
import KsChecklistDetail from "./pages/ks/KsChecklistDetail";
import KsTemplates from "./pages/ks/KsTemplates";
import KsHmsPlanWizard from "./pages/ks/KsHmsPlanWizard";
import KsRoutines from "./pages/ks/KsRoutines";
import KsSja from "./pages/ks/KsSja";
import KsAvvik from "./pages/ks/KsAvvik";
import KsVernerunder from "./pages/ks/KsVernerunder";
import KsFarligeFohold from "./pages/ks/KsFarligeFohold";
import KsTiltakslogg from "./pages/ks/KsTiltakslogg";
import KsChecklistGenerator from "./pages/ks/KsChecklistGenerator";
import KsProjectReport from "./pages/ks/KsProjectReport";
import KsSubcontractorView from "./pages/ks/KsSubcontractorView";
import KsClientManagement from "./pages/ks/KsClientManagement";
import KsChecklists from "./pages/ks/KsChecklists";
import KsDocumentCenter from "./pages/ks/KsDocumentCenter";
import HmsChat from "./pages/HmsChat";
import MyCourseCard from "./pages/MyCourseCard";
import TimeRegistration from "./pages/TimeRegistration";
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
            <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/deviations" element={<ProtectedRoute><Deviations /></ProtectedRoute>} />
            <Route path="/audits" element={<ProtectedRoute><Audits /></ProtectedRoute>} />
            <Route path="/handbook" element={<ProtectedRoute><Handbook /></ProtectedRoute>} />
            <Route path="/hms-chat" element={<ProtectedRoute><HmsChat /></ProtectedRoute>} />
            <Route path="/my-courses" element={<ProtectedRoute><MyCourseCard /></ProtectedRoute>} />
            <Route path="/time-registration" element={<ProtectedRoute><TimeRegistration /></ProtectedRoute>} />
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
            <Route path="/ks/projects" element={<ProtectedRoute><KsProjectsOverview /></ProtectedRoute>} />
            <Route path="/ks/projects/:id" element={<ProtectedRoute><KsProjectDetail /></ProtectedRoute>} />
            <Route path="/ks/projects/:projectId/hms-plan" element={<ProtectedRoute><KsHmsPlanWizard /></ProtectedRoute>} />
            <Route path="/ks/projects/:projectId/documents" element={<ProtectedRoute><KsDocumentCenter /></ProtectedRoute>} />
            <Route path="/ks/checklists" element={<ProtectedRoute><KsChecklists /></ProtectedRoute>} />
            <Route path="/ks/checklists/:id" element={<ProtectedRoute><KsChecklistDetail /></ProtectedRoute>} />
            <Route path="/ks/routines" element={<ProtectedRoute><KsRoutines /></ProtectedRoute>} />
            <Route path="/ks/templates" element={<ProtectedRoute><KsTemplates /></ProtectedRoute>} />
            <Route path="/ks/sja" element={<ProtectedRoute><KsSja /></ProtectedRoute>} />
            <Route path="/ks/avvik" element={<ProtectedRoute><KsAvvik /></ProtectedRoute>} />
            <Route path="/ks/vernerunder" element={<ProtectedRoute><KsVernerunder /></ProtectedRoute>} />
            <Route path="/ks/farlige-forhold" element={<ProtectedRoute><KsFarligeFohold /></ProtectedRoute>} />
            <Route path="/ks/tiltakslogg" element={<ProtectedRoute><KsTiltakslogg /></ProtectedRoute>} />
            <Route path="/ks/checklist-generator" element={<ProtectedRoute><KsChecklistGenerator /></ProtectedRoute>} />
            <Route path="/ks/report" element={<ProtectedRoute><KsProjectReport /></ProtectedRoute>} />
            <Route path="/ks/client/:projectId" element={<ProtectedRoute><KsClientManagement /></ProtectedRoute>} />
            
            {/* Subcontractor view - limited access */}
            <Route path="/ks/subcontractor" element={<ProtectedRoute><KsSubcontractorView /></ProtectedRoute>} />
            
            {/* Admin routes - require system_admin role */}
            <Route path="/admin" element={<ProtectedRoute requireSystemAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/companies" element={<ProtectedRoute requireSystemAdmin><AdminCompanies /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireSystemAdmin><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/hms-requests" element={<ProtectedRoute requireSystemAdmin><AdminHmsRequests /></ProtectedRoute>} />
            <Route path="/admin/sg-register" element={<ProtectedRoute requireSystemAdmin><AdminSgRegister /></ProtectedRoute>} />
            
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
