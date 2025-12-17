import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ClipboardList, CalendarCheck, FileCheck } from "lucide-react";
import { RisikovurderingOgHandlingsplan } from "@/components/risikoanalyse/RisikovurderingOgHandlingsplan";
import { OppfolgingTab } from "@/components/risikoanalyse/OppfolgingTab";
import { HmsSjaTab } from "@/components/risikoanalyse/HmsSjaTab";

const Risikoanalyse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "risiko-handlingsplan");

  useEffect(() => {
    if (tabParam === "oppfolging") {
      setActiveTab("oppfolging");
    } else if (tabParam === "sja") {
      setActiveTab("sja");
    } else {
      setActiveTab("risiko-handlingsplan");
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "risiko-handlingsplan") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };
  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Risikoanalyse</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Risikovurdering, handlingsplan, oppfølging og sikker jobb analyse
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50">
            <TabsTrigger 
              value="risiko-handlingsplan" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-background"
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Risikovurdering & Handlingsplan</span>
              <span className="sm:hidden">Risiko</span>
            </TabsTrigger>
            <TabsTrigger 
              value="oppfolging" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-background"
            >
              <CalendarCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Oppfølging</span>
              <span className="sm:hidden">Oppfølg.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sja" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-background"
            >
              <FileCheck className="h-4 w-4" />
              <span>SJA</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="risiko-handlingsplan" className="mt-6">
            <RisikovurderingOgHandlingsplan />
          </TabsContent>

          <TabsContent value="oppfolging" className="mt-6">
            <OppfolgingTab />
          </TabsContent>

          <TabsContent value="sja" className="mt-6">
            <HmsSjaTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Risikoanalyse;
