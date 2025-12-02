import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { KsProjectSubcontractors } from "@/components/ks/KsProjectSubcontractors";

export default function KsSubcontractorManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    navigate('/ks/projects');
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-16">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/ks/projects/${id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Underleverandører (UE)</h1>
            <p className="text-muted-foreground">
              Administrer underleverandører, gransking og dokumentasjon
            </p>
          </div>
        </div>

        <KsProjectSubcontractors projectId={id} />
      </div>
    </AppLayout>
  );
}