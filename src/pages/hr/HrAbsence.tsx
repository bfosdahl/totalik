import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, HeartPulse, Download } from "lucide-react";

export default function HrAbsence() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fravær</h1>
            <p className="text-muted-foreground mt-1">
              Oversikt over sykefravær, egenmeldinger og permisjoner
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Eksporter
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Registrer fravær
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Totalt fravær i år</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0%</div>
            <div className="text-sm text-muted-foreground">Fraværsprosent</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Aktive sykemeldinger</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Ventende godkjenninger</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="sykdom">Sykdom</TabsTrigger>
            <TabsTrigger value="egenmelding">Egenmelding</TabsTrigger>
            <TabsTrigger value="permisjon">Permisjon</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <HeartPulse className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen fraværsregistreringer</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  Fravær vil vises her når de blir registrert
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}