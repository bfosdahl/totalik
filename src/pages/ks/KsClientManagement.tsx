import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useKsProjectClient } from "@/hooks/useKsProjectClient";
import { KsClientInfo } from "@/components/ks/client/KsClientInfo";
import { KsClientCoordinators } from "@/components/ks/client/KsClientCoordinators";
import { KsClientChecklist } from "@/components/ks/client/KsClientChecklist";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";

export default function KsClientManagement() {
  const { projectId } = useParams<{ projectId: string }>();

  const {
    clientInfo,
    coordinators,
    checklistItems,
    isLoading,
    saveClientInfo,
    saveCoordinator,
    deleteCoordinator,
    updateChecklistItem,
    createChecklistItem,
  } = useKsProjectClient(projectId || "");

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Byggherre</h1>
          </div>
          <p className="text-muted-foreground">
            Samle all informasjon om byggherre, godkjenninger, kommunikasjon og krav etter byggherreforskriften
          </p>
        </div>

        <KsClientInfo clientInfo={clientInfo} onSave={saveClientInfo} />
        
        <KsClientCoordinators
          coordinators={coordinators}
          onSave={saveCoordinator}
          onDelete={deleteCoordinator}
        />

        <KsClientChecklist
          items={checklistItems}
          onUpdate={updateChecklistItem}
          onCreate={createChecklistItem}
        />
      </div>
    </AppLayout>
  );
}
