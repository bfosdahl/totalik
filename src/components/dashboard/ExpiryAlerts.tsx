import { motion } from "framer-motion";
import { AlertTriangle, CreditCard, GraduationCap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ExpiryData {
  expiredCourses: number;
  expiredHmsCards: number;
  expiringCoursesSoon: number;
  expiringHmsCardsSoon: number;
}

export function ExpiryAlerts() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["expiry-alerts", profile?.company_id],
    queryFn: async (): Promise<ExpiryData> => {
      if (!profile?.company_id) {
        return { expiredCourses: 0, expiredHmsCards: 0, expiringCoursesSoon: 0, expiringHmsCardsSoon: 0 };
      }

      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const thirtyDaysDate = thirtyDaysFromNow.toISOString().split('T')[0];

      // Fetch expired courses
      const { count: expiredCoursesCount } = await supabase
        .from("employee_courses")
        .select("*", { count: "exact", head: true })
        .eq("company_id", profile.company_id)
        .lt("expiry_date", today)
        .not("expiry_date", "is", null);

      // Fetch courses expiring within 30 days
      const { count: expiringCoursesCount } = await supabase
        .from("employee_courses")
        .select("*", { count: "exact", head: true })
        .eq("company_id", profile.company_id)
        .gte("expiry_date", today)
        .lte("expiry_date", thirtyDaysDate);

      // Fetch expired HMS cards
      const { count: expiredHmsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .eq("hms_card_required", true)
        .lt("hms_card_expiry_date", today)
        .not("hms_card_expiry_date", "is", null);

      // Fetch HMS cards expiring within 30 days
      const { count: expiringHmsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .eq("hms_card_required", true)
        .gte("hms_card_expiry_date", today)
        .lte("hms_card_expiry_date", thirtyDaysDate);

      return {
        expiredCourses: expiredCoursesCount || 0,
        expiredHmsCards: expiredHmsCount || 0,
        expiringCoursesSoon: expiringCoursesCount || 0,
        expiringHmsCardsSoon: expiringHmsCount || 0,
      };
    },
    enabled: !!profile?.company_id,
  });

  const hasExpired = (data?.expiredCourses || 0) > 0 || (data?.expiredHmsCards || 0) > 0;
  const hasExpiringSoon = (data?.expiringCoursesSoon || 0) > 0 || (data?.expiringHmsCardsSoon || 0) > 0;

  if (isLoading || (!hasExpired && !hasExpiringSoon)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-card"
    >
      <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
        <div className="p-1.5 md:p-2 rounded-lg bg-warning/10">
          <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-warning" />
        </div>
        <h3 className="text-base md:text-lg font-semibold">Kompetansevarsler</h3>
      </div>

      <div className="space-y-3">
        {/* Expired items */}
        {hasExpired && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm font-medium text-destructive mb-2">Utgått</p>
            <div className="space-y-2">
              {(data?.expiredCourses || 0) > 0 && (
                <div 
                  onClick={() => navigate("/employees")}
                  className="flex items-center justify-between cursor-pointer hover:bg-destructive/5 rounded p-1 -m-1 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-destructive" />
                    <span className="text-sm">{data?.expiredCourses} utgåtte kurs</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              {(data?.expiredHmsCards || 0) > 0 && (
                <div 
                  onClick={() => navigate("/employees")}
                  className="flex items-center justify-between cursor-pointer hover:bg-destructive/5 rounded p-1 -m-1 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-destructive" />
                    <span className="text-sm">{data?.expiredHmsCards} utgåtte HMS-kort</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expiring soon */}
        {hasExpiringSoon && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
            <p className="text-sm font-medium text-warning mb-2">Utløper innen 30 dager</p>
            <div className="space-y-2">
              {(data?.expiringCoursesSoon || 0) > 0 && (
                <div 
                  onClick={() => navigate("/employees")}
                  className="flex items-center justify-between cursor-pointer hover:bg-warning/5 rounded p-1 -m-1 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-warning" />
                    <span className="text-sm">{data?.expiringCoursesSoon} kurs utløper snart</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              {(data?.expiringHmsCardsSoon || 0) > 0 && (
                <div 
                  onClick={() => navigate("/employees")}
                  className="flex items-center justify-between cursor-pointer hover:bg-warning/5 rounded p-1 -m-1 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-warning" />
                    <span className="text-sm">{data?.expiringHmsCardsSoon} HMS-kort utløper snart</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
