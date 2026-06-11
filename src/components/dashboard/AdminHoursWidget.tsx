import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminHoursSummary } from "@/hooks/useAdminHoursSummary";
import { Button } from "@/components/ui/button";

export function AdminHoursWidget() {
  const { isCompanyAdmin, isSystemAdmin } = useAuth();
  const navigate = useNavigate();

  const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const end = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { data, isLoading } = useAdminHoursSummary({ startDate: start, endDate: end });

  if (!isCompanyAdmin && !isSystemAdmin) return null;

  const totals = data?.totals;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-semibold">Timer denne måneden</h3>
            <p className="text-xs text-muted-foreground">Lønnsgrunnlag for hele bedriften</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/timer/oversikt")}>
          Se alle <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Stat label="Normal" value={totals?.normal ?? 0} tone="default" />
            <Stat label="50% overtid" value={totals?.overtime_50 ?? 0} tone="warning" />
            <Stat label="100% overtid" value={totals?.overtime_100 ?? 0} tone="destructive" />
          </div>
          <div className="flex items-center justify-between text-sm border-t pt-3">
            <span className="text-muted-foreground">
              {data?.perPerson.length ?? 0} personer · {data?.count ?? 0} føringer
            </span>
            <span className="font-semibold">
              Totalt {(totals?.total ?? 0).toLocaleString("nb-NO", { maximumFractionDigits: 1 })} t
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "default" | "warning" | "destructive" }) {
  const toneClass =
    tone === "warning"
      ? "text-orange-600 dark:text-orange-400"
      : tone === "destructive"
      ? "text-red-600 dark:text-red-400"
      : "text-foreground";
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${toneClass}`}>
        {value.toLocaleString("nb-NO", { maximumFractionDigits: 1 })}
        <span className="text-xs font-normal text-muted-foreground ml-1">t</span>
      </p>
    </div>
  );
}
