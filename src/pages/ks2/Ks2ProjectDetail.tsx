import { useParams, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";
import { Ks2ProjectSidebar } from "@/components/ks2/Ks2ProjectSidebar";
import { Ks2ProjectStatusBar } from "@/components/ks2/Ks2ProjectStatusBar";
import { Ks2EnhancedDashboard } from "@/components/ks2/Ks2EnhancedDashboard";
import { Ks2FloatingActions } from "@/components/ks2/Ks2FloatingActions";

// Lazy-load sub-pages so they only load when the user navigates to them.
// This keeps the initial Ks2ProjectDetail bundle small.
const Ks2Egenkontroller = lazy(() => import("./Ks2Egenkontroller"));
const Ks2Sjekklister = lazy(() => import("./Ks2Sjekklister"));
const Ks2Rutiner = lazy(() => import("./Ks2Rutiner"));
const Ks2Dokumentasjon = lazy(() => import("./Ks2Dokumentasjon"));
const Ks2Prosjektinfo = lazy(() => import("./Ks2Prosjektinfo"));
const Ks2AvvikIntegrated = lazy(() => import("./Ks2AvvikIntegrated"));
const Ks2UavhengigKontroll = lazy(() => import("./Ks2UavhengigKontroll"));
const Ks2Malbibliotek = lazy(() => import("./Ks2Malbibliotek"));
const Ks2Prosjektrapport = lazy(() => import("./Ks2Prosjektrapport"));
const Ks2Underleverandorer = lazy(() => import("./Ks2Underleverandorer"));
const Ks2UnderleverandorDetail = lazy(() => import("./Ks2UnderleverandorDetail"));
const Ks2Endringsmeldinger = lazy(() => import("./Ks2Endringsmeldinger"));
const Ks2Timeregistrering = lazy(() => import("./Ks2Timeregistrering"));
const Ks2Mannskap = lazy(() => import("./Ks2Mannskap"));
const Ks2Fremdriftsplan = lazy(() => import("./Ks2Fremdriftsplan"));
const Ks2Reklamasjoner = lazy(() => import("./Ks2Reklamasjoner"));
const Ks2Okonomi = lazy(() => import("./Ks2Okonomi"));
const Ks2Motereferater = lazy(() => import("./Ks2Motereferater"));
const Ks2Dagsrapport = lazy(() => import("./Ks2Dagsrapport"));
const Ks2Befaring = lazy(() => import("./Ks2Befaring"));
const Ks2ProjectNotes = lazy(() => import("./Ks2ProjectNotes"));
const Ks2ProjectPhotos = lazy(() => import("./Ks2ProjectPhotos"));
// HMS Module imports
const Ks2HmsDashboard = lazy(() => import("./Ks2HmsDashboard"));
const Ks2HmsPlan = lazy(() => import("./Ks2HmsPlan"));
const Ks2ShaPlan = lazy(() => import("./Ks2ShaPlan"));
const Ks2Sja = lazy(() => import("./Ks2Sja"));
const Ks2Vernerunder = lazy(() => import("./Ks2Vernerunder"));
const Ks2Stoffkartotek = lazy(() => import("./Ks2Stoffkartotek"));
// Byggesak Module imports
const Ks2ByggesakDashboard = lazy(() => import("./Ks2ByggesakDashboard"));
const Ks2ByggesakBlanketter = lazy(() => import("./Ks2ByggesakBlanketter"));
const Ks2ByggesakEpost = lazy(() => import("./Ks2ByggesakEpost"));
const Ks2ByggesakForm = lazy(() => import("./Ks2ByggesakForm"));
// AI Chat
const Ks2ProjectChat = lazy(() => import("./Ks2ProjectChat"));

const SubPageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function Ks2ProjectDetail() {
  const { projectId } = useParams();
  const location = useLocation();
  const [project, setProject] = useState<KsModule2Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProject = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from("ks_module2_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data as KsModule2Project);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  // Refetch project data when navigating back to dashboard
  useEffect(() => {
    if (!isLoading && project) {
      fetchProject();
    }
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Prosjekt ikke funnet</h2>
          <p className="text-muted-foreground">
            Prosjektet du leter etter finnes ikke eller du har ikke tilgang.
          </p>
        </div>
      </div>
    );
  }

  // Determine current view based on path
  const basePath = `/ks/project/${projectId}`;
  const currentPath = location.pathname.replace(basePath, "") || "";

  const renderContent = () => {
    // Handle underleverandør detail route
    if (currentPath.startsWith("/underleverandorer/")) {
      const subId = currentPath.replace("/underleverandorer/", "");
      return <Ks2UnderleverandorDetail subcontractorId={subId} />;
    }

    switch (currentPath) {
      case "/egenkontroller":
        return <Ks2Egenkontroller />;
      case "/sjekklister":
        return <Ks2Sjekklister />;
      case "/rutiner":
        return <Ks2Rutiner />;
      case "/dokumentasjon":
        return <Ks2Dokumentasjon />;
      case "/prosjektinfo":
        return <Ks2Prosjektinfo />;
      case "/underleverandorer":
        return <Ks2Underleverandorer />;
      case "/endringsmeldinger":
        return <Ks2Endringsmeldinger />;
      case "/motereferater":
        return <Ks2Motereferater />;
      case "/dagsrapport":
        return <Ks2Dagsrapport />;
      case "/befaringer":
        return <Ks2Befaring />;
      case "/notater":
        return <Ks2ProjectNotes />;
      case "/bilder":
        return <Ks2ProjectPhotos />;
      case "/timeregistrering":
        return <Ks2Timeregistrering />;
      case "/mannskap":
        return <Ks2Mannskap />;
      case "/fremdriftsplan":
        return <Ks2Fremdriftsplan />;
      case "/reklamasjoner":
        return <Ks2Reklamasjoner />;
      case "/okonomi":
        return <Ks2Okonomi />;
      case "/avvik":
        return <Ks2AvvikIntegrated />;
      case "/uk":
        return <Ks2UavhengigKontroll />;
      case "/maler":
        return <Ks2Malbibliotek />;
      case "/rapport":
        return <Ks2Prosjektrapport />;
      // HMS Module routes
      case "/hms":
        return <Ks2HmsDashboard />;
      case "/hms/hms-plan":
        return <Ks2HmsPlan />;
      case "/hms/sha-plan":
        return <Ks2ShaPlan />;
      case "/hms/sja":
        return <Ks2Sja />;
      case "/hms/vernerunder":
        return <Ks2Vernerunder />;
      case "/hms/avvik":
        return <Ks2AvvikIntegrated />;
      case "/hms/stoffkartotek":
        return <Ks2Stoffkartotek />;
      // Byggesak Module routes
      case "/byggesak":
        return <Ks2ByggesakDashboard />;
      case "/byggesak/blanketter":
        return <Ks2ByggesakBlanketter />;
      case "/byggesak/epost":
        return <Ks2ByggesakEpost />;
      case "/chat":
        return <Ks2ProjectChat />;
      default:
        // Handle byggesak form route
        if (currentPath.startsWith("/byggesak/form/")) {
          return <Ks2ByggesakForm />;
        }
        return <Ks2EnhancedDashboard contractorType={project.contractor_type} projectAddress={project.address} noSubcontractors={(project as any).no_subcontractors} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Project Sidebar */}
      <Ks2ProjectSidebar
        projectName={project.project_name}
        projectNumber={project.project_number}
        contractorType={project.contractor_type}
        projectType={(project as any).project_type}
      />

      {/* Main Content */}
      <div className="lg:pl-[260px] transition-all duration-300">
        {/* Top Banner - improved mobile spacing */}
        <div className="border-b bg-card px-4 py-3 pl-14 lg:px-6 lg:py-4 lg:pl-6">
          <p className="text-xs text-muted-foreground font-medium">{project.project_number}</p>
          <h1 className="text-lg lg:text-xl font-semibold truncate">{project.project_name}</h1>
        </div>

        {/* Project Status Bar */}
        <Ks2ProjectStatusBar />

        {/* Page Content - extra bottom padding for mobile FAB */}
        <main className="p-4 md:p-6 pb-24 lg:pb-6">
          {renderContent()}
        </main>
      </div>

      {/* Floating Action Button for mobile */}
      <Ks2FloatingActions />
    </div>
  );
}
