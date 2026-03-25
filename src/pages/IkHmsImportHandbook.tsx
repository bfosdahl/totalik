import { AppLayout } from "@/components/layout/AppLayout";
import { HandbookImportUploader } from "@/components/setup/HandbookImportUploader";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function IkHmsImportHandbook() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  const companyId = profile?.company_id;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!companyId) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Ingen bedrift tilknyttet din bruker.</AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-4 sm:py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Importer HMS-håndbok</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Last opp en eksisterende HMS-håndbok for å overføre alt innhold til systemet — inkludert historiske avvik med originale datoer.
          </p>
        </div>

        <HandbookImportUploader
          companyId={companyId}
          onImportComplete={() => {
            navigate('/handbook');
          }}
        />
      </div>
    </AppLayout>
  );
}
