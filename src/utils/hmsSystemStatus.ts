import { supabase } from "@/integrations/supabase/client";

export interface HmsSystemStatus {
  goals: string[];
  orgRoles: { role: string; persons: string[] }[];
  orgDescription: string | null;
  risks: { name: string; level?: string }[];
  routines: string[];
  laws: number;
  deviations: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    recent: { number: string; title: string; status: string; date: string }[];
  };
}

const asArray = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? (v as Record<string, unknown>[]) : [];

const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));

/** Henter faktisk innhold i IK/HMS-modulen for bruk i revisjonsrapporten. */
export async function fetchHmsSystemStatus(companyId: string): Promise<HmsSystemStatus> {
  const [goalsRes, nodesRes, personsRes, orgRes, riskRes, routineRes, lawRes, devRes, recentRes] =
    await Promise.all([
      supabase
        .from("company_goals")
        .select("goal_text, sort_order")
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true }),
      supabase
        .from("org_chart_nodes")
        .select("id, role_title, sort_order")
        .eq("company_id", companyId)
        .order("sort_order", { ascending: true }),
      supabase.from("org_chart_node_persons").select("node_id, person_name"),
      supabase
        .from("company_organization")
        .select("custom_content")
        .eq("company_id", companyId)
        .maybeSingle(),
      supabase.from("company_risk_assessments").select("risks").eq("company_id", companyId).maybeSingle(),
      supabase
        .from("company_routines")
        .select("routines")
        .eq("company_id", companyId),
      supabase
        .from("company_laws_regulations")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId),
      supabase.from("deviations").select("status").eq("company_id", companyId).eq("is_deleted", false),
      supabase
        .from("deviations")
        .select("deviation_number, title, status, created_at")
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const nodeIds = new Set((nodesRes.data || []).map((n) => n.id));
  const personsByNode = new Map<string, string[]>();
  for (const p of personsRes.data || []) {
    if (!nodeIds.has(p.node_id)) continue;
    const list = personsByNode.get(p.node_id) || [];
    list.push(p.person_name);
    personsByNode.set(p.node_id, list);
  }

  const statuses = (devRes.data || []).map((d) => d.status);
  const countBy = (s: string) => statuses.filter((x) => x === s).length;

  return {
    goals: (goalsRes.data || []).map((g) => g.goal_text).filter(Boolean),
    orgRoles: (nodesRes.data || []).map((n) => ({
      role: n.role_title,
      persons: personsByNode.get(n.id) || [],
    })),
    orgDescription: orgRes.data?.custom_content ? str(orgRes.data.custom_content) : null,
    risks: asArray(riskRes.data?.risks).map((r) => ({
      name: str(r.hazard_source_custom || r.hazard_source || r.name || r.title || r.risk || r.activity),
      level: str(r.riskLevel || r.level || r.risk_level) || undefined,
    })),
    routines: (routineRes.data || [])
      .flatMap((row) => asArray(row.routines))
      .map((r) => {
        const name = str(r.routine_name || r.title || r.name);
        const num = str(r.routine_number);
        return name ? (num ? `${num} ${name}` : name) : "";
      })
      .filter(Boolean),
    laws: lawRes.count || 0,
    deviations: {
      total: statuses.length,
      open: countBy("open"),
      inProgress: countBy("in-progress"),
      resolved: countBy("resolved"),
      closed: countBy("closed"),
      recent: (recentRes.data || []).map((d) => ({
        number: str(d.deviation_number),
        title: str(d.title),
        status: str(d.status),
        date: str(d.created_at),
      })),
    },
  };
}
