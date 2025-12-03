import { useParams, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";
import { Ks2ProjectSidebar } from "@/components/ks2/Ks2ProjectSidebar";
import { Ks2ProjectDashboard } from "@/components/ks2/Ks2ProjectDashboard";
import Ks2Egenkontroller from "./Ks2Egenkontroller";
import Ks2Sjekklister from "./Ks2Sjekklister";
import Ks2Dokumentasjon from "./Ks2Dokumentasjon";
import Ks2Prosjektinfo from "./Ks2Prosjektinfo";
import Ks2Avvik from "./Ks2Avvik";

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
  const basePath = `/ks2/project/${projectId}`;
  const currentPath = location.pathname.replace(basePath, "") || "";

  const renderContent = () => {
    switch (currentPath) {
      case "/egenkontroller":
        return <Ks2Egenkontroller />;
      case "/sjekklister":
        return <Ks2Sjekklister />;
      case "/dokumentasjon":
        return <Ks2Dokumentasjon />;
      case "/prosjektinfo":
        return <Ks2Prosjektinfo />;
      case "/avvik":
        return <Ks2Avvik />;
      default:
        return <Ks2ProjectDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Project Sidebar */}
      <Ks2ProjectSidebar
        projectName={project.project_name}
        projectNumber={project.project_number}
      />

      {/* Main Content */}
      <div className="lg:pl-[260px] transition-all duration-300">
        {/* Top Banner */}
        <div className="border-b bg-card px-6 py-4 pl-16 lg:pl-6">
          <p className="text-xs text-muted-foreground font-medium">{project.project_number}</p>
          <h1 className="text-xl font-semibold">{project.project_name}</h1>
        </div>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
