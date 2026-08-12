import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart3, Users } from "lucide-react";
import { NewSurveyDialog } from "@/components/hr/NewSurveyDialog";
import { t } from "@/i18n/t";

export default function HrSurveys() {
  const [showNewDialog, setShowNewDialog] = useState(false);

  const handleSurveyCreated = () => {
    // TODO: Refresh surveys list
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">{t("auto.medarbeiderundersoekelser")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("auto.opprett_og_analyser_medarbeiderundersoek")}
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowNewDialog(true)}>
            <Plus className="w-4 h-4" />
            Ny undersøkelse
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">{t("auto.aktive_undersoekelser")}</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0%</div>
            <div className="text-sm text-muted-foreground">{t("auto.svarprosent")}</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">{t("auto.totalt_svar")}</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">{t("auto.gjennomfoert_i_aar")}</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="active">{t("auto.aktive")}</TabsTrigger>
            <TabsTrigger value="draft">{t("auto.utkast")}</TabsTrigger>
            <TabsTrigger value="closed">{t("auto.avsluttet")}</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("auto.ingen_undersoekelser_enda")}</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  {t("auto.start_med_aa_opprette_en_medarbeiderunde")}
                </p>
                <Button onClick={() => setShowNewDialog(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Opprett undersøkelse
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <NewSurveyDialog 
        open={showNewDialog} 
        onOpenChange={setShowNewDialog} 
        onSuccess={handleSurveyCreated}
      />
    </AppLayout>
  );
}