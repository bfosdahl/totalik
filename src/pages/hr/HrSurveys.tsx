import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart3, Users } from "lucide-react";
import { NewSurveyDialog } from "@/components/hr/NewSurveyDialog";

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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Medarbeiderundersøkelser</h1>
            <p className="text-muted-foreground mt-1">
              Opprett og analyser medarbeiderundersøkelser og pulsmålinger
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
            <div className="text-sm text-muted-foreground">Aktive undersøkelser</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0%</div>
            <div className="text-sm text-muted-foreground">Svarprosent</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Totalt svar</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Gjennomført i år</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="active">Aktive</TabsTrigger>
            <TabsTrigger value="draft">Utkast</TabsTrigger>
            <TabsTrigger value="closed">Avsluttet</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen undersøkelser enda</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  Start med å opprette en medarbeiderundersøkelse for å samle inn tilbakemeldinger
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