import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import PendingApproval from "@/pages/PendingApproval";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSystemAdmin?: boolean;
  requireCompanyAdmin?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireSystemAdmin = false,
  requireCompanyAdmin = false 
}: ProtectedRouteProps) {
  const { 
    user, 
    isLoading, 
    isSystemAdmin, 
    isCompanyAdmin, 
    isGuestUser, 
    guestProjects, 
    roles, 
    profile,
    guestCheckComplete,
    isPendingApproval,
    isSuspended
  } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user is pending approval (but allow system admins and company admins)
  if (isPendingApproval && !isSystemAdmin && !isCompanyAdmin) {
    return <PendingApproval />;
  }

  // Check if user is suspended
  if (isSuspended) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-hero">
        <div className="bg-card rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Konto suspendert</h1>
          <p className="text-muted-foreground mb-4">
            Din brukerkonto er suspendert. Ta kontakt med administrator for mer informasjon.
          </p>
          <button
            onClick={() => window.location.href = "/auth"}
            className="text-primary hover:underline text-sm"
          >
            Tilbake til innlogging
          </button>
        </div>
      </div>
    );
  }

  // Guest user restrictions - only allow KS project routes
  if (isGuestUser && guestProjects.length > 0) {
    const currentPath = location.pathname;
    const allowedProjectIds = guestProjects.map(p => p.project_id);
    
    // Check if current route is an allowed KS project route
    const isAllowedRoute = allowedProjectIds.some(projectId => 
      currentPath.startsWith(`/ks/project/${projectId}`)
    );
    
    // If not on allowed route, redirect to first project dashboard
    if (!isAllowedRoute) {
      const firstProject = guestProjects[0];
      return <Navigate to={`/ks/project/${firstProject.project_id}`} replace />;
    }
  }

  // If user has no roles and no company, wait for guest check to complete
  if (roles.length === 0 && !profile?.company_id && !guestCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireSystemAdmin && !isSystemAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireCompanyAdmin && !isCompanyAdmin && !isSystemAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
