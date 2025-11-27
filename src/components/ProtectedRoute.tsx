import { Navigate } from "react-router-dom";
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
  const { user, isLoading, isSystemAdmin, isCompanyAdmin } = useAuth();

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

  if (requireSystemAdmin && !isSystemAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireCompanyAdmin && !isCompanyAdmin && !isSystemAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
