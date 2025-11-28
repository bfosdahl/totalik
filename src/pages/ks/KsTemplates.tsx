import { FileText, Info } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useKsTemplates } from "@/hooks/useKsProjects";
import { Skeleton } from "@/components/ui/skeleton";

export default function KsTemplates() {
  const { templates, isLoading } = useKsTemplates();

  // Group templates by phase
  const templatesByPhase = templates.reduce((acc, template) => {
    const phase = template.phase || "Generelt";
    if (!acc[phase]) {
      acc[phase] = [];
    }
    acc[phase].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  const phaseOrder = ["Før oppstart", "Råbygg", "Tett bygg", "Innvendig", "Ferdigbefaring", "Generelt"];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KS-maler</h1>
          <p className="text-muted-foreground">
            Forhåndsdefinerte sjekklister for kvalitetssikring
          </p>
        </div>

        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="flex items-start gap-3 pt-4">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">System-maler</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Disse malene er forhåndsdefinert for UTF – Tømrerarbeid og montering av trekonstruksjoner. 
                Du kan bruke dem som utgangspunkt når du starter sjekklister i prosjektene dine.
              </p>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {phaseOrder.map(phase => {
              const phaseTemplates = templatesByPhase[phase];
              if (!phaseTemplates || phaseTemplates.length === 0) return null;

              return (
                <div key={phase} className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Badge variant="outline">{phase}</Badge>
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {phaseTemplates.map(template => (
                      <Card key={template.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <CardTitle className="text-base">{template.name}</CardTitle>
                            </div>
                            {template.is_system_default && (
                              <Badge variant="secondary" className="text-xs">System</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>
                            {template.description || "Ingen beskrivelse"}
                          </CardDescription>
                          <p className="text-xs text-muted-foreground mt-2">
                            Fag: {template.trade}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}