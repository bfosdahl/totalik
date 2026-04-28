import { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ClipboardList, CalendarCheck, FileCheck, BookOpen, FlaskConical, Activity, Loader2 } from "lucide-react";

// Lazy-load each tab so only the active one is fetched & mounted.
const RisikovurderingOgHandlingsplan = lazy(() =>
  import("@/components/risikoanalyse/RisikovurderingOgHandlingsplan").then(m => ({ default: m.RisikovurderingOgHandlingsplan }))
);
const OppfolgingTab = lazy(() =>
  import("@/components/risikoanalyse/OppfolgingTab").then(m => ({ default: m.OppfolgingTab }))
);
const HmsSjaTab = lazy(() =>
  import("@/components/risikoanalyse/HmsSjaTab").then(m => ({ default: m.HmsSjaTab }))
);
const RutinerTab = lazy(() =>
  import("@/components/risikoanalyse/RutinerTab").then(m => ({ default: m.RutinerTab }))
);
const KjemikalierTab = lazy(() =>
  import("@/components/risikoanalyse/KjemikalierTab").then(m => ({ default: m.KjemikalierTab }))
);
const ErgonomiTab = lazy(() =>
  import("@/components/risikoanalyse/ErgonomiTab").then(m => ({ default: m.ErgonomiTab }))
);

const TabFallback = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const Risikoanalyse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "risiko-handlingsplan");

  useEffect(() => {
    if (tabParam === "oppfolging") {
      setActiveTab("oppfolging");
    } else if (tabParam === "sja") {
      setActiveTab("sja");
    } else if (tabParam === "rutiner") {
      setActiveTab("rutiner");
    } else if (tabParam === "kjemikalier") {
      setActiveTab("kjemikalier");
    } else if (tabParam === "ergonomi") {
      setActiveTab("ergonomi");
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
                Risikovurdering, handlingsplan, oppfølging, rutiner og sikker jobb analyse
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="w-full overflow-x-auto pb-1">
            <TabsList className="inline-flex min-w-max w-max sm:w-full sm:grid sm:grid-cols-6 h-auto p-1 bg-muted/50 gap-1">
              <TabsTrigger
                value="risiko-handlingsplan"
                className="flex items-center gap-2 py-3 px-3 whitespace-nowrap data-[state=active]:bg-background"
              >
                <ClipboardList className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Risikovurdering</span>
                <span className="sm:hidden">Risiko</span>
              </TabsTrigger>
              <TabsTrigger
                value="kjemikalier"
                className="flex items-center gap-2 py-3 px-3 whitespace-nowrap data-[state=active]:bg-background"
              >
                <FlaskConical className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Kjemikalier</span>
                <span className="sm:hidden">Kjem.</span>
              </TabsTrigger>
              <TabsTrigger
                value="ergonomi"
                className="flex items-center gap-2 py-3 px-3 whitespace-nowrap data-[state=active]:bg-background"
              >
                <Activity className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Ergonomi</span>
                <span className="sm:hidden">Ergo.</span>
              </TabsTrigger>
              <TabsTrigger
                value="oppfolging"
                className="flex items-center gap-2 py-3 px-3 whitespace-nowrap data-[state=active]:bg-background"
              >
                <CalendarCheck className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Oppfølging</span>
                <span className="sm:hidden">Oppfølg.</span>
              </TabsTrigger>
              <TabsTrigger
                value="rutiner"
                className="flex items-center gap-2 py-3 px-3 whitespace-nowrap data-[state=active]:bg-background"
              >
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span>Rutiner</span>
              </TabsTrigger>
              <TabsTrigger
                value="sja"
                className="flex items-center gap-2 py-3 px-3 whitespace-nowrap data-[state=active]:bg-background"
              >
                <FileCheck className="h-4 w-4 flex-shrink-0" />
                <span>SJA</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Only render the active tab — saves queries & memory */}
          <Suspense fallback={<TabFallback />}>
            {activeTab === "risiko-handlingsplan" && (
              <TabsContent value="risiko-handlingsplan" forceMount className="mt-6">
                <RisikovurderingOgHandlingsplan />
              </TabsContent>
            )}
            {activeTab === "kjemikalier" && (
              <TabsContent value="kjemikalier" forceMount className="mt-6">
                <KjemikalierTab />
              </TabsContent>
            )}
            {activeTab === "ergonomi" && (
              <TabsContent value="ergonomi" forceMount className="mt-6">
                <ErgonomiTab />
              </TabsContent>
            )}
            {activeTab === "oppfolging" && (
              <TabsContent value="oppfolging" forceMount className="mt-6">
                <OppfolgingTab />
              </TabsContent>
            )}
            {activeTab === "rutiner" && (
              <TabsContent value="rutiner" forceMount className="mt-6">
                <RutinerTab />
              </TabsContent>
            )}
            {activeTab === "sja" && (
              <TabsContent value="sja" forceMount className="mt-6">
                <HmsSjaTab />
              </TabsContent>
            )}
          </Suspense>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Risikoanalyse;
