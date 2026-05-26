import { supabase } from "@/integrations/supabase/client";
import type { RoutineTemplate } from "@/hooks/useRoutineLibrary";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const frequencyLabel = (frequency?: string | null) => {
  switch (frequency) {
    case "daglig": return "Daglig";
    case "ukentlig": return "Ukentlig";
    case "maanedlig": return "Månedlig";
    case "aarlig": return "Årlig";
    case "ved_behov": return "Ved behov";
    default: return frequency || "Ved behov";
  }
};

const normalizeStepText = (step: any, index: number) => {
  if (typeof step === "string") return `${index + 1}. ${step}`;
  const title = step?.title || step?.text || step?.label || "";
  const description = step?.description ? ` – ${step.description}` : "";
  return `${index + 1}. ${title}${description}`.trim();
};

const stepsToText = (steps: any[] | null | undefined) =>
  Array.isArray(steps) ? steps.map(normalizeStepText).filter(Boolean).join("\n") : "";

const legalRefsToText = (refs: any[] | null | undefined) =>
  Array.isArray(refs)
    ? refs.map((ref) => typeof ref === "string" ? ref : ref?.title || ref?.reference || "").filter(Boolean).join("\n")
    : "";

const isSameTitle = (a?: string | null, b?: string | null) =>
  (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

const adoptHmsRoutine = async (template: RoutineTemplate, companyId: string) => {
  const { data: existing, error: fetchError } = await supabase
    .from("company_routines")
    .select("id, routines")
    .eq("company_id", companyId)
    .is("department_id", null)
    .maybeSingle();
  if (fetchError) throw fetchError;

  const current = Array.isArray(existing?.routines) ? existing.routines as any[] : [];
  const alreadyVisible = current.some((routine) =>
    routine?.source_template_id === template.id || isSameTitle(routine?.routine_name, template.title)
  );
  if (alreadyVisible) return;

  const stepsText = stepsToText(template.steps);
  const legalText = legalRefsToText(template.legal_refs);
  const newItem = {
    id: crypto.randomUUID(),
    routine_number: `R${(current.length + 1).toString().padStart(3, "0")}`,
    routine_name: template.title,
    category: template.subcategory || "Helse, Miljø og Sikkerhet",
    purpose: template.purpose || template.description || "",
    responsibility: Array.isArray(template.target_roles) ? template.target_roles.join(", ") : "",
    procedure: stepsText,
    examples: legalText ? `Lovgrunnlag:\n${legalText}` : "",
    remember: template.frequency ? `Frekvens: ${frequencyLabel(template.frequency)}` : "",
    is_predefined: false,
    source_template_id: UUID_PATTERN.test(template.id) ? template.id : null,
    source_module: template.module,
  };

  const updated = [...current, newItem];
  if (existing) {
    const { error } = await supabase
      .from("company_routines")
      .update({ routines: JSON.parse(JSON.stringify(updated)), updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("company_routines")
      .insert([{ company_id: companyId, department_id: null, routines: JSON.parse(JSON.stringify(updated)) }]);
    if (error) throw error;
  }
};

const adoptIkMatRoutine = async (template: RoutineTemplate, companyId: string) => {
  const { data: moduleRow, error: fetchError } = await supabase
    .from("company_modules")
    .select("id, settings")
    .eq("company_id", companyId)
    .eq("module_type", "IK_MAT")
    .maybeSingle();
  if (fetchError) throw fetchError;

  const settings = (moduleRow?.settings as any) || {};
  const manual = settings.manualContent || {};
  const generated = settings.generatedContent || {};
  const current = Array.isArray(manual.routines) && manual.routines.length > 0
    ? manual.routines
    : (Array.isArray(generated.routines) ? generated.routines.map((routine: any, index: number) => ({ id: routine.id || `gen-${index}`, ...routine })) : []);

  if (current.some((routine: any) => routine?.source_template_id === template.id || isSameTitle(routine?.name, template.title))) return;

  const newRoutine = {
    id: `routine-${Date.now()}`,
    name: template.title,
    description: stepsToText(template.steps) || template.purpose || template.description || "",
    frequency: frequencyLabel(template.frequency),
    responsible: Array.isArray(template.target_roles) ? template.target_roles[0] || "" : "",
    templateNumber: template.template_number || undefined,
    subcategory: template.subcategory || undefined,
    createdAt: new Date().toISOString(),
    revisionCount: 0,
    source_template_id: UUID_PATTERN.test(template.id) ? template.id : null,
  };
  const updatedSettings = {
    ...settings,
    manualContent: { ...manual, routines: [...current, newRoutine] },
  };

  if (moduleRow) {
    const { error } = await supabase
      .from("company_modules")
      .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
      .eq("id", moduleRow.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("company_modules")
      .insert([{ company_id: companyId, module_type: "IK_MAT", is_active: true, settings: updatedSettings }]);
    if (error) throw error;
  }
};

const adoptIkAlkoholRoutine = async (template: RoutineTemplate, companyId: string) => {
  const category = template.subcategory || "dokumentasjon";
  const { data: existing, error: fetchError } = await supabase
    .from("ik_alkohol_routines")
    .select("id")
    .eq("company_id", companyId)
    .eq("category", category)
    .eq("routine_name", template.title)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (existing) return;

  const content = [
    template.purpose ? `Formål:\n${template.purpose}` : "",
    stepsToText(template.steps) ? `Sjekkliste:\n${stepsToText(template.steps)}` : "",
  ].filter(Boolean).join("\n\n") || template.description || "";

  const { error } = await supabase
    .from("ik_alkohol_routines")
    .insert([{ company_id: companyId, category, routine_name: template.title, content, description: template.description || null, is_active: true }]);
  if (error) throw error;
};

const adoptKsRoutine = async (template: RoutineTemplate, companyId: string) => {
  let query = supabase.from("company_ks_routines").select("id").eq("company_id", companyId).eq("is_deleted", false);
  query = UUID_PATTERN.test(template.id) ? query.eq("admin_template_id", template.id) : query.eq("routine_name", template.title);
  const { data: existing, error: fetchError } = await query.maybeSingle();
  if (fetchError) throw fetchError;
  if (existing) return;

  const stepsText = stepsToText(template.steps);
  const content = [
    template.purpose ? `Formål:\n${template.purpose}` : "",
    stepsText ? `Sjekkliste:\n${stepsText}` : "",
  ].filter(Boolean).join("\n\n") || template.description || "";

  const { error } = await supabase
    .from("company_ks_routines")
    .insert([{ company_id: companyId, routine_name: template.title, description: template.description || null, content, category: template.subcategory || "general", admin_template_id: UUID_PATTERN.test(template.id) ? template.id : null, routine_number: template.template_number || null }]);
  if (error) throw error;
};

export const adoptRoutineTemplateToVisibleSystem = async (template: RoutineTemplate, companyId: string) => {
  switch (template.module) {
    case "ik_hms":
      return adoptHmsRoutine(template, companyId);
    case "ik_mat":
      return adoptIkMatRoutine(template, companyId);
    case "ik_alkohol":
      return adoptIkAlkoholRoutine(template, companyId);
    case "ks_ik_bygg":
      return adoptKsRoutine(template, companyId);
    default:
      throw new Error("Ukjent rutinemodul");
  }
};