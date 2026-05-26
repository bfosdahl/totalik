import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RutinerTab } from "@/components/risikoanalyse/RutinerTab";
import { useTranslate } from "@/hooks/useTranslate";
import { RoutineLibraryDialog } from "@/components/routines/RoutineLibraryDialog";
import { AiRoutineDialog } from "@/components/routines/AiRoutineDialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { RoutineTemplate } from "@/hooks/useRoutineLibrary";
import { adoptRoutineTemplateToVisibleSystem } from "@/lib/adoptRoutineTemplate";

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

    await adoptRoutineTemplateToVisibleSystem(template, profile.company_id);

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
