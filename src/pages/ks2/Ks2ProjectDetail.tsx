import { useParams, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";
import { Ks2ProjectSidebar } from "@/components/ks2/Ks2ProjectSidebar";
import { Ks2ProjectStatusBar } from "@/components/ks2/Ks2ProjectStatusBar";
import { Ks2EnhancedDashboard } from "@/components/ks2/Ks2EnhancedDashboard";
import { Ks2FloatingActions } from "@/components/ks2/Ks2FloatingActions";
import Ks2Egenkontroller from "./Ks2Egenkontroller";
import Ks2Sjekklister from "./Ks2Sjekklister";
import Ks2Rutiner from "./Ks2Rutiner";
import Ks2Dokumentasjon from "./Ks2Dokumentasjon";
import Ks2Prosjektinfo from "./Ks2Prosjektinfo";
import Ks2AvvikIntegrated from "./Ks2AvvikIntegrated";
import Ks2UavhengigKontroll from "./Ks2UavhengigKontroll";
import Ks2Malbibliotek from "./Ks2Malbibliotek";
import Ks2Prosjektrapport from "./Ks2Prosjektrapport";
import Ks2Underleverandorer from "./Ks2Underleverandorer";
import Ks2UnderleverandorDetail from "./Ks2UnderleverandorDetail";
import Ks2Endringsmeldinger from "./Ks2Endringsmeldinger";
import Ks2Timeregistrering from "./Ks2Timeregistrering";
import Ks2Fremdriftsplan from "./Ks2Fremdriftsplan";
import Ks2Reklamasjoner from "./Ks2Reklamasjoner";
import Ks2Okonomi from "./Ks2Okonomi";
import Ks2Motereferater from "./Ks2Motereferater";
// HMS Module imports
import Ks2HmsDashboard from "./Ks2HmsDashboard";
import Ks2HmsPlan from "./Ks2HmsPlan";
import Ks2ShaPlan from "./Ks2ShaPlan";
import Ks2Sja from "./Ks2Sja";
import Ks2Vernerunder from "./Ks2Vernerunder";
import Ks2Stoffkartotek from "./Ks2Stoffkartotek";
// Byggesak Module imports
import Ks2ByggesakDashboard from "./Ks2ByggesakDashboard";
import Ks2ByggesakBlanketter from "./Ks2ByggesakBlanketter";
import Ks2ByggesakEpost from "./Ks2ByggesakEpost";
import Ks2ByggesakForm from "./Ks2ByggesakForm";

export default function Ks2ProjectDetail() {
  const { projectId } = useParams();
  const location = useLocation();
  const [project, setProject] = useState<KsModule2Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

    fetchProject();
  }, [projectId]);

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
      case "/timeregistrering":
        return <Ks2Timeregistrering />;
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
