import { ReactNode, useState, useCallback } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MascotChatHelper } from "@/components/help/MascotChatHelper";
import { TermsAcceptanceDialog } from "@/components/terms/TermsAcceptanceDialog";
import { useTermsAcceptance } from "@/hooks/useTermsAcceptance";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { hasAcceptedTerms, isLoading: termsLoading, acceptTerms, isAccepting } = useTermsAcceptance(user?.id);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const showTermsDialog = user && !termsLoading && !hasAcceptedTerms;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
      <div className="lg:pl-[280px] transition-all duration-300">
        <AppHeader onMenuClick={handleToggleSidebar} />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
      
      {/* Global mascot helper */}
      <MascotChatHelper />

      {/* Terms acceptance dialog - shown on first login */}
      <TermsAcceptanceDialog
        open={!!showTermsDialog}
        onAccept={acceptTerms}
        isAccepting={isAccepting}
      />
    </div>
  );
}
