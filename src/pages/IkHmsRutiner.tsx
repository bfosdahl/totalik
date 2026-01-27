import { AppLayout } from "@/components/layout/AppLayout";
import { RutinerTab } from "@/components/risikoanalyse/RutinerTab";
import { useTranslate } from "@/hooks/useTranslate";

export default function IkHmsRutiner() {
  const { t } = useTranslate();
  
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("nav.routines")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("handbook.routinesDescription") || "Administrer bedriftens HMS-rutiner og prosedyrer"}
          </p>
        </div>
        
        <RutinerTab />
      </div>
    </AppLayout>
  );
}
