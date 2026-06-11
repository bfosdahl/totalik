import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PersonHourSummary {
  user_id: string;
  user_name: string;
  normal: number;
  overtime_50: number;
  overtime_100: number;
  total: number;
}

export interface HoursSummary {
  perPerson: PersonHourSummary[];
  totals: { normal: number; overtime_50: number; overtime_100: number; total: number };
  count: number;
}

interface Options {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onlyApproved?: boolean;
  projectId?: string | null;
}

export function useAdminHoursSummary({ startDate, endDate, onlyApproved, projectId }: Options) {
  const { profile, isCompanyAdmin, isSystemAdmin } = useAuth();
  const companyId = profile?.company_id;
  const canSee = isCompanyAdmin || isSystemAdmin;

  return useQuery<HoursSummary>({
    queryKey: ["admin-hours-summary", companyId, startDate, endDate, onlyApproved, projectId],
    enabled: !!companyId && canSee,
    queryFn: async () => {
      let q = supabase
        .from("time_entries")
        .select("user_id,user_name,hours,hour_type,status")
        .eq("company_id", companyId)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate);

      if (onlyApproved) q = q.eq("status", "approved");
      if (projectId) q = q.eq("ks_project_id", projectId);

      const { data, error } = await q;
      if (error) throw error;

      const map = new Map<string, PersonHourSummary>();
      let tN = 0, t50 = 0, t100 = 0;

      for (const row of data || []) {
        const id = row.user_id as string;
        if (!map.has(id)) {
          map.set(id, { user_id: id, user_name: row.user_name || "Ukjent", normal: 0, overtime_50: 0, overtime_100: 0, total: 0 });
        }
        const p = map.get(id)!;
        const h = Number(row.hours) || 0;
        if (row.hour_type === "overtime_50") { p.overtime_50 += h; t50 += h; }
        else if (row.hour_type === "overtime_100") { p.overtime_100 += h; t100 += h; }
        else { p.normal += h; tN += h; }
        p.total = p.normal + p.overtime_50 + p.overtime_100;
      }

      const perPerson = Array.from(map.values()).sort((a, b) => b.total - a.total);
      return {
        perPerson,
        totals: { normal: tN, overtime_50: t50, overtime_100: t100, total: tN + t50 + t100 },
        count: data?.length || 0,
      };
    },
  });
}
