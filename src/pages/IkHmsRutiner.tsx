import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RutinerTab } from "@/components/risikoanalyse/RutinerTab";
import { useTranslate } from "@/hooks/useTranslate";
import { RoutineLibraryDialog } from "@/components/routines/RoutineLibraryDialog";
import { AiRoutineDialog } from "@/components/routines/AiRoutineDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { RoutineTemplate } from "@/hooks/useRoutineLibrary";

export default function IkHmsRutiner() {
  const { t } = useTranslate();
  const { profile } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Adopter både AI-genererte og biblioteks-rutiner inn i company_routines (JSONB-array)
  // som RutinerTab faktisk leser fra. Dette fikser bugen der AI-rutiner ble lagret
  // i customer_routine_instances og dermed forsvant fra visningen.
  const handleAdopt = async (template: RoutineTemplate) => {
    if (!profile?.company_id) {
      toast.error("Mangler bedrift");
      return;
    }

    const { data: existing } = await supabase
      .from("company_routines")
      .select("id, routines")
      .eq("company_id", profile.company_id)
      .is("department_id", null)
      .maybeSingle();

    const current = Array.isArray(existing?.routines) ? (existing!.routines as any[]) : [];

    // Bygg en flat tekst-prosedyre fra steps + legal refs
    const stepsText = Array.isArray(template.steps)
      ? template.steps
          .map((s: any, i: number) =>
            typeof s === "string" ? `${i + 1}. ${s}` : `${i + 1}. ${s?.title || s?.text || ""}${s?.description ? ` – ${s.description}` : ""}`
          )
          .join("\n")
      : "";
    const legalText = Array.isArray(template.legal_refs) && template.legal_refs.length > 0
      ? template.legal_refs.map((l: any) => (typeof l === "string" ? l : l?.title || l?.reference || "")).filter(Boolean).join("\n")
      : "";

    const newItem = {
      id: crypto.randomUUID(),
      routine_number: `R${(current.length + 1).toString().padStart(3, "0")}`,
      routine_name: template.title,
      category: template.subcategory || "Helse, Miljø og Sikkerhet",
      purpose: template.purpose || template.description || "",
      responsibility: Array.isArray(template.target_roles) ? template.target_roles.join(", ") : "",
      procedure: stepsText,
      examples: legalText ? `Lovgrunnlag:\n${legalText}` : "",
      remember: template.frequency ? `Frekvens: ${template.frequency}` : "",
      is_predefined: false,
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
        .insert([{ company_id: profile.company_id, department_id: null, routines: JSON.parse(JSON.stringify(updated)) }]);
      if (error) throw error;
    }

    toast.success(`"${template.title}" lagt til i rutiner`);
    setRefreshKey((k) => k + 1);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("nav.routines")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("handbook.routinesDescription") || "Administrer bedriftens HMS-rutiner og prosedyrer"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <AiRoutineDialog module="ik_hms" onAdopt={handleAdopt} />
            <RoutineLibraryDialog module="ik_hms" onAdopt={handleAdopt} />
          </div>
        </div>

        <RutinerTab key={refreshKey} />
      </div>
    </AppLayout>
  );
}
