import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, CheckCircle } from "lucide-react";
import { t } from "@/i18n/t";

export default function MySurveys() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("auto.min_respons")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("auto.svar_paa_medarbeiderundersoekelser_og_se")}
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">{t("auto.venter_paa_svar")}</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">{t("auto.besvart_i_aar")}</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm text-muted-foreground">{t("auto.svarprosent")}</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">{t("auto.venter_paa_svar")}</TabsTrigger>
            <TabsTrigger value="completed">{t("auto.besvart")}</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("auto.ingen_undersoekelser_aa_svare_paa")}</h3>
                <p className="text-muted-foreground max-w-sm">
                  {t("auto.du_har_ingen_ventende_undersoekelser_akk")}
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("auto.ingen_besvarte_undersoekelser")}</h3>
                <p className="text-muted-foreground max-w-sm">
                  {t("auto.undersoekelser_du_har_svart_paa_vil_vise")}
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}