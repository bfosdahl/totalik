import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, SprayCan, Thermometer, Package, ClipboardList } from "lucide-react";

// Import existing tab contents as components
import { SjekklisterTab } from "@/components/ikmat/kontroll/SjekklisterTab";
import { RenholdsplanTab } from "@/components/ikmat/kontroll/RenholdsplanTab";
import { TemperaturloggTab } from "@/components/ikmat/kontroll/TemperaturloggTab";
import { SporbarhetTab } from "@/components/ikmat/kontroll/SporbarhetTab";

const IkMatKontroll = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, isLoading } = useCompanyModules();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or default to sjekklister
  const initialTab = searchParams.get("tab") || "sjekklister";
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            Kontroll
          </h1>
          <p className="text-muted-foreground mt-1">
            Daglige kontroller, logging og dokumentasjon for matsikkerhet
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="sjekklister" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Sjekklister</span>
            </TabsTrigger>
            <TabsTrigger value="renholdsplan" className="gap-2">
              <SprayCan className="h-4 w-4" />
              <span className="hidden sm:inline">Renhold</span>
            </TabsTrigger>
            <TabsTrigger value="temperatur" className="gap-2">
              <Thermometer className="h-4 w-4" />
              <span className="hidden sm:inline">Temperatur</span>
            </TabsTrigger>
            <TabsTrigger value="sporbarhet" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Varemottak</span>
            </TabsTrigger>
          </TabsList>

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

export default IkMatKontroll;
