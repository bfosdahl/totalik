/**
 * Apply parsed IK/MAT handbook data to a company's matsikkerhetssystem.
 * Merges goals, organization, risks, HACCP, routines, cleaning plan
 * into company_modules.settings.generatedContent and inserts historiske avvik.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ParsedIkMatHandbookData {
  companyInfo?: {
    firmanavn?: string | null;
    organisasjonsnummer?: string | null;
    virksomhetstype?: string | null;
    beskrivelse?: string | null;
  } | null;
  organization?: {
    roles?: Array<{ title: string; name?: string; responsibilities?: string }>;
  } | null;
  goals?: string[];
  risks?: Array<{
    hazard: string;
    consequence?: string;
    probability?: string;
    riskLevel?: string;
    measures?: string;
  }>;
  haccp?: Array<{
    step: string;
    hazard: string;
    criticalLimit?: string;
    monitoring?: string;
    correctiveAction?: string;
    responsible?: string;
  }>;
  routines?: Array<{
    name: string;
    category?: string;
    description?: string;
    frequency?: string;
    responsible?: string;
  }>;
  cleaningPlan?: Array<{
    area: string;
    frequency?: string;
    method?: string;
    responsible?: string;
  }>;
  controlPoints?: Array<{
    name: string;
    frequency?: string;
    limit?: string;
    responsible?: string;
  }>;
  deviations?: Array<{
    tittel: string;
    beskrivelse?: string;
    kategori?: string;
    prioritet?: string;
    status?: string;
    dato?: string | null;
    korrigerendeTiltak?: string;
    forebyggendeTiltak?: string;
  }>;
  tilleggsinformasjon?: string | null;
}

export interface IkMatImportResult {
  success: boolean;
  error?: string;
  summary: {
    goals: number;
    risks: number;
    haccp: number;
    routines: number;
    cleaningPlan: number;
    deviations: number;
  };
}

const validPriorities = ["lav", "medium", "høy", "kritisk"];
const validStatuses = ["open", "in-progress", "resolved", "closed"];

function sanitizePriority(p?: string): string {
  if (p && validPriorities.includes(p)) return p;
  return "medium";
}

function sanitizeStatus(s?: string): string {
  const normalized = s?.replace("_", "-")?.toLowerCase();
  if (normalized && validStatuses.includes(normalized)) return normalized;
  return "open";
}

function sanitizeCategory(c?: string): string {
  const allowed = ["hygiene", "temperature", "procedure", "equipment", "other", "safety"];
  if (c && allowed.includes(c)) return c;
  return "other";
}

export async function applyIkMatHandbookImport(
  companyId: string,
  data: ParsedIkMatHandbookData,
): Promise<IkMatImportResult> {
  const summary = {
    goals: 0,
    risks: 0,
    haccp: 0,
    routines: 0,
    cleaningPlan: 0,
    deviations: 0,
  };

  try {
    // 1. Load existing IK_MAT module settings
    const { data: existingModule, error: loadError } = await supabase
      .from("company_modules")
      .select("settings")
      .eq("company_id", companyId)
      .eq("module_type", "IK_MAT")
      .maybeSingle();

    if (loadError) throw loadError;

    const existingSettings = (existingModule?.settings &&
        typeof existingModule.settings === "object" &&
        !Array.isArray(existingModule.settings))
      ? existingModule.settings as Record<string, any>
      : {};

    const existingGenerated: Record<string, any> =
      existingSettings.generatedContent || {};

    // 2. Build merged generatedContent (imported overrides empty, preserves manual edits via manualContent which lives separately)
    const goals = Array.isArray(data.goals) ? data.goals.filter(Boolean) : [];
    const risks = (data.risks || []).filter((r) => r?.hazard);
    const haccp = (data.haccp || []).filter((h) => h?.step);
    const routines = (data.routines || []).filter((r) => r?.name);
    const cleaningPlan = (data.cleaningPlan || []).filter((c) => c?.area);
    const controlPoints = (data.controlPoints || []).filter((c) => c?.name);
    const organization = data.organization?.roles?.length
      ? { roles: data.organization.roles.filter((r) => r?.title) }
      : existingGenerated.organization || { roles: [] };

    const merged = {
      ...existingGenerated,
      companyInfo: data.companyInfo || existingGenerated.companyInfo || null,
      organization,
      goals: goals.length ? goals : existingGenerated.goals || [],
      risks: risks.length ? risks : existingGenerated.risks || [],
      haccp: haccp.length ? haccp : existingGenerated.haccp || [],
      routines: routines.length ? routines : existingGenerated.routines || [],
      cleaningPlan: cleaningPlan.length
        ? cleaningPlan
        : existingGenerated.cleaningPlan || [],
      controlPoints: controlPoints.length
        ? controlPoints
        : existingGenerated.controlPoints || [],
      importedFromHandbook: true,
      importedAt: new Date().toISOString(),
    };

    summary.goals = goals.length;
    summary.risks = risks.length;
    summary.haccp = haccp.length;
    summary.routines = routines.length;
    summary.cleaningPlan = cleaningPlan.length;

    // 3. Upsert module settings (preserve any setupCompletedAt that was there)
    const newSettings = {
      ...existingSettings,
      generatedContent: merged,
      setupCompletedAt: existingSettings.setupCompletedAt ||
        new Date().toISOString(),
    };

    if (existingModule) {
      const { error: updateError } = await supabase
        .from("company_modules")
        .update({ settings: newSettings })
        .eq("company_id", companyId)
        .eq("module_type", "IK_MAT");
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("company_modules")
        .insert({
          company_id: companyId,
          module_type: "IK_MAT",
          settings: newSettings,
        });
      if (insertError) throw insertError;
    }

    // 4. Insert historiske avvik (deviations with type='ik_mat')
    if (Array.isArray(data.deviations) && data.deviations.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, primary_department_id")
        .eq("company_id", companyId)
        .limit(1)
        .maybeSingle();

      const reporterName = profileData
        ? [profileData.first_name, profileData.last_name]
          .filter(Boolean)
          .join(" ") || profileData.email || "Importert"
        : "Importert";

      const rows = data.deviations
        .filter((d) => d?.tittel)
        .map((d) => ({
          company_id: companyId,
          // deviation_number: null lets DB trigger generate IKM-NNN
          title: d.tittel.slice(0, 255),
          description: [
            d.beskrivelse || "",
            d.korrigerendeTiltak
              ? `\n\nKorrigerende tiltak: ${d.korrigerendeTiltak}`
              : "",
            d.forebyggendeTiltak
              ? `\n\nForebyggende tiltak: ${d.forebyggendeTiltak}`
              : "",
          ].join(""),
          category: sanitizeCategory(d.kategori),
          type: "ik_mat",
          priority: sanitizePriority(d.prioritet),
          status: sanitizeStatus(d.status),
          reporter_id: profileData?.id || null,
          reporter_name: reporterName,
          department_id: profileData?.primary_department_id || null,
          due_date: null,
          created_at: d.dato || undefined,
        }));

      if (rows.length > 0) {
        const { error: devError } = await supabase
          .from("deviations")
          .insert(rows);
        if (devError) {
          console.error("Deviation insert error:", devError);
          // don't fail whole import — partial success is fine
        } else {
          summary.deviations = rows.length;
        }
      }
    }

    return { success: true, summary };
  } catch (err) {
    console.error("applyIkMatHandbookImport error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Ukjent feil",
      summary,
    };
  }
}
