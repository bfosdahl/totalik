import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";

export default function Ks2ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
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
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">Prosjekt ikke funnet</h2>
          <p className="text-muted-foreground mb-4">
            Prosjektet du leter etter finnes ikke eller du har ikke tilgang.
          </p>
          <Button onClick={() => navigate("/ks2")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til prosjekter
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/ks2")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake til prosjekter
        </Button>

        {/* Welcome card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{project.project_number}</p>
                <CardTitle className="text-2xl">Velkommen til {project.project_name}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Dette er prosjekt-detaljsiden. Flere funksjoner kommer i Fase 2.
            </p>
            {project.description && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Beskrivelse</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
