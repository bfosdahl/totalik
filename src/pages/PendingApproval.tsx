import { motion } from "framer-motion";
import { Clock, Mail, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

export default function PendingApproval() {
  const { user, signOut, refreshProfile, profile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setIsRefreshing(false);
    
    if (profile?.status === "active") {
      window.location.reload();
    } else {
      toast.info("Kontoen venter fortsatt på godkjenning");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="bg-card rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
            <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Venter på godkjenning</h1>
          
          <p className="text-muted-foreground mb-6">
            Din brukerkonto er opprettet, men må godkjennes av en administrator før du får tilgang til systemet.
          </p>

          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="text-left">
                <p className="text-muted-foreground">Logget inn som</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleRefresh} 
              className="w-full" 
              variant="default"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Sjekker status..." : "Sjekk status på nytt"}
            </Button>
            
            <Button 
              onClick={signOut} 
              className="w-full" 
              variant="outline"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logg ut
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground">
              Du vil få tilgang til systemet så snart en administrator godkjenner kontoen din.
              Ta kontakt med din leder hvis du trenger hjelp.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
