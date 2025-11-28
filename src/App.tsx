import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import SetupSystemAdmin from "./pages/admin/SetupSystemAdmin";
import KsProjects from "./pages/ks/KsProjects";
import KsProjectDetail from "./pages/ks/KsProjectDetail";
import KsChecklistDetail from "./pages/ks/KsChecklistDetail";
import KsTemplates from "./pages/ks/KsTemplates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/setup-admin" element={<SetupSystemAdmin />} />
            
            {/* Protected app routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/deviations" element={<ProtectedRoute><Deviations /></ProtectedRoute>} />
            <Route path="/audits" element={<ProtectedRoute><Audits /></ProtectedRoute>} />
            <Route path="/handbook" element={<ProtectedRoute><Handbook /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            {/* KS Bygg routes */}
            <Route path="/ks/projects" element={<ProtectedRoute><KsProjects /></ProtectedRoute>} />
            <Route path="/ks/projects/:id" element={<ProtectedRoute><KsProjectDetail /></ProtectedRoute>} />
            <Route path="/ks/checklists/:id" element={<ProtectedRoute><KsChecklistDetail /></ProtectedRoute>} />
            <Route path="/ks/templates" element={<ProtectedRoute><KsTemplates /></ProtectedRoute>} />
            
            {/* Admin routes - require system_admin role */}
            <Route path="/admin" element={<ProtectedRoute requireSystemAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/companies" element={<ProtectedRoute requireSystemAdmin><AdminCompanies /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireSystemAdmin><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/hms-requests" element={<ProtectedRoute requireSystemAdmin><AdminHmsRequests /></ProtectedRoute>} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
