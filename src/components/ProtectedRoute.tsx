import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

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
  const { user, isLoading, isSystemAdmin, isCompanyAdmin, isGuestUser, guestProjects } = useAuth();
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

  // Guest user restrictions - only allow KS2 project routes
  if (isGuestUser && guestProjects.length > 0) {
    const currentPath = location.pathname;
    const allowedProjectIds = guestProjects.map(p => p.project_id);
    
    // Check if current route is an allowed KS2 project route
    const isAllowedRoute = allowedProjectIds.some(projectId => 
      currentPath.startsWith(`/ks2/project/${projectId}`)
    );
    
    // If not on allowed route, redirect to first project
    if (!isAllowedRoute) {
      const firstProject = guestProjects[0];
      return <Navigate to={`/ks2/project/${firstProject.project_id}`} replace />;
    }
  }

  if (requireSystemAdmin && !isSystemAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireCompanyAdmin && !isCompanyAdmin && !isSystemAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
