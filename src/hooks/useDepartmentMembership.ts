import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DeptOption {
  id: string;
  name: string;
}

/**
 * Avdelinger i bedriften + hvilke avdelinger hver ansatt hører til.
 * Nøkkel i map er auth user_id. Avdelingsledere får kun egne avdelinger som valg.
 */
export function useDepartmentMembership() {
  const { profile, isCompanyAdmin, isSystemAdmin, adminDepartmentIds } = useAuth();
  const companyId = profile?.company_id;
  const seesAll = isCompanyAdmin || isSystemAdmin;

  const { data } = useQuery({
    queryKey: ["department-membership", companyId],
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [deptRes, profRes] = await Promise.all([
        supabase
          .from("company_departments")
          .select("id, name, is_active")
          .eq("company_id", companyId!)
          .order("name"),
        supabase
          .from("profiles")
          .select("id, user_id, primary_department_id")
          .eq("company_id", companyId!),
      ]);
      if (deptRes.error) throw deptRes.error;
      if (profRes.error) throw profRes.error;
      const departments = (deptRes.data || []).filter((d: any) => d.is_active !== false) as DeptOption[];
      const deptIds = departments.map((d) => d.id);
      const { data: ud } = deptIds.length
        ? await supabase.from("user_departments").select("user_id, department_id").in("department_id", deptIds)
        : { data: [] as any[] };

      const byProfileId = new Map<string, string>();
      const map: Record<string, string[]> = {};
      (profRes.data || []).forEach((p: any) => {
        byProfileId.set(p.id, p.user_id);
        map[p.user_id] = p.primary_department_id ? [p.primary_department_id] : [];
      });
      (ud || []).forEach((r: any) => {
        const authId = byProfileId.get(r.user_id) || r.user_id;
        if (!map[authId]) map[authId] = [];
        if (!map[authId].includes(r.department_id)) map[authId].push(r.department_id);
      });
      return { departments, map };
    },
  });

  const all = data?.departments || [];
  const departments = seesAll ? all : all.filter((d) => adminDepartmentIds.includes(d.id));
  const userDepartments = data?.map || {};
  const isInDepartment = (userId: string, deptId: string) =>
    (userDepartments[userId] || []).includes(deptId);

  return { departments, userDepartments, isInDepartment };
}
