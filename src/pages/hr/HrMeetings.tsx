import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, UserCheck, Calendar } from "lucide-react";

export default function HrMeetings() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Medarbeidersamtaler</h1>
            <p className="text-muted-foreground mt-1">
              Planlegg og følg opp medarbeidersamtaler og utviklingssamtaler
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Planlegg samtale
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Planlagte samtaler</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Gjennomført i år</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Forfaller snart</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm text-muted-foreground">Dekningsgrad</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Kommende</TabsTrigger>
            <TabsTrigger value="completed">Gjennomført</TabsTrigger>
            <TabsTrigger value="all">Alle</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <UserCheck className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen planlagte samtaler</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  Start med å planlegge medarbeidersamtaler for å følge opp dine ansatte
                </p>
                <Button>
                  <Calendar className="w-4 h-4 mr-2" />
                  Planlegg første samtale
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}