import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, SprayCan, Thermometer, Package, ClipboardList, CalendarDays, Route as RouteIcon, Play } from "lucide-react";
import { useIkMatDailyRounds } from "@/hooks/useIkMatDailyRounds";

// Import existing tab contents as components
import { SjekklisterTab } from "@/components/ikmat/kontroll/SjekklisterTab";
import { RenholdsplanTab } from "@/components/ikmat/kontroll/RenholdsplanTab";
import { TemperaturloggTab } from "@/components/ikmat/kontroll/TemperaturloggTab";
import { SporbarhetTab } from "@/components/ikmat/kontroll/SporbarhetTab";
import { KalenderTab } from "@/components/ikmat/kontroll/KalenderTab";
import { RunderTab } from "@/components/ikmat/kontroll/RunderTab";

const IkMatKontroll = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, isLoading } = useCompanyModules();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or default to kalender
  // If action=log-temp is present, switch to temperatur tab
  const action = searchParams.get("action");
  const initialTab = action === "log-temp" ? "temperatur" : (searchParams.get("tab") || "kalender");
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (!isLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, isLoading, navigate]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto py-8 space-y-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              Kontroll
            </h1>
            <p className="text-muted-foreground mt-1">
              Daglige kontroller, logging og dokumentasjon for matsikkerhet
            </p>
          </div>
          <QuickStartRoundButton onOpenRunder={() => handleTabChange("runder")} />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:max-w-4xl sm:grid-cols-6 h-auto p-1">
              <TabsTrigger value="kalender" className="gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Kalender</span>
              </TabsTrigger>
              <TabsTrigger value="runder" className="gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <RouteIcon className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Runder</span>
              </TabsTrigger>
              <TabsTrigger value="sjekklister" className="gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <ClipboardCheck className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Sjekklister</span>
              </TabsTrigger>
              <TabsTrigger value="renholdsplan" className="gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <SprayCan className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Renhold</span>
              </TabsTrigger>
              <TabsTrigger value="temperatur" className="gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <Thermometer className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Temp</span>
              </TabsTrigger>
              <TabsTrigger value="sporbarhet" className="gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <Package className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Mottak</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="kalender" className="mt-6">
            <KalenderTab />
          </TabsContent>

          <TabsContent value="runder" className="mt-6">
            <RunderTab />
          </TabsContent>

          <TabsContent value="sjekklister" className="mt-6">
            <SjekklisterTab />
          </TabsContent>

          <TabsContent value="renholdsplan" className="mt-6">
            <RenholdsplanTab />
          </TabsContent>

          <TabsContent value="temperatur" className="mt-6">
            <TemperaturloggTab />
          </TabsContent>

          <TabsContent value="sporbarhet" className="mt-6">
            <SporbarhetTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

function QuickStartRoundButton({ onOpenRunder }: { onOpenRunder: () => void }) {
  const navigate = useNavigate();
  const { rounds } = useIkMatDailyRounds();
  if (rounds.length === 0) return null;
  // If exactly one round, go straight to it; otherwise open the tab.
  const handleClick = () => {
    if (rounds.length === 1) {
      navigate(`/ik-mat/runde/${rounds[0].id}`);
    } else {
      onOpenRunder();
    }
  };
  return (
    <Button onClick={handleClick} size="sm" className="self-start sm:self-auto">
      <Play className="h-4 w-4 mr-2" />
      Start daglig runde
    </Button>
  );
}

export default IkMatKontroll;
