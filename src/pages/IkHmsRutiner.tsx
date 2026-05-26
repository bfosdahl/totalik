import { AppLayout } from "@/components/layout/AppLayout";
import { RutinerTab } from "@/components/risikoanalyse/RutinerTab";
import { useTranslate } from "@/hooks/useTranslate";
import { RoutineLibraryDialog } from "@/components/routines/RoutineLibraryDialog";
import { AiRoutineDialog } from "@/components/routines/AiRoutineDialog";

export default function IkHmsRutiner() {
  const { t } = useTranslate();
  
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
            <AiRoutineDialog module="ik_hms" />
            <RoutineLibraryDialog module="ik_hms" />
          </div>
        </div>
        
        <RutinerTab />
      </div>
    </AppLayout>
  );
}
