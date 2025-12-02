import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, CheckCircle } from "lucide-react";

export default function MySurveys() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Min respons</h1>
          <p className="text-muted-foreground mt-1">
            Svar på medarbeiderundersøkelser og se dine tidligere svar
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Venter på svar</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Besvart i år</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm text-muted-foreground">Svarprosent</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Venter på svar</TabsTrigger>
            <TabsTrigger value="completed">Besvart</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen undersøkelser å svare på</h3>
                <p className="text-muted-foreground max-w-sm">
                  Du har ingen ventende undersøkelser akkurat nå. Nye undersøkelser vil vises her når de blir sendt ut.
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen besvarte undersøkelser</h3>
                <p className="text-muted-foreground max-w-sm">
                  Undersøkelser du har svart på vil vises her
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}