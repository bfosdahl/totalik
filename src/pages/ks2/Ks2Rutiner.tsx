import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Plus, Search, Library, Check, ExternalLink } from "lucide-react";
import { useKsModule2ProjectTemplates } from "@/hooks/useKsModule2ProjectTemplates";
import { toast } from "sonner";

export default function Ks2Rutiner() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { routineTemplates, isLoading, markAsImplemented, unmarkAsImplemented } = useKsModule2ProjectTemplates(projectId);

  // Filter by search
  const filteredRoutines = routineTemplates.filter(pt =>
    pt.routine_template?.routine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pt.routine_template?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkImplemented = async (templateId: string, currentValue: boolean) => {
    try {
      if (currentValue) {
        await unmarkAsImplemented(templateId);
      } else {
        await markAsImplemented(templateId);
      }
    } catch (error) {
      toast.error("Kunne ikke oppdatere");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Rutinebank</h2>
          <p className="text-muted-foreground">Rutiner som gjelder for dette prosjektet</p>
        </div>
      </div>

      {/* Info about Malbibliotek if no routines */}
      {routineTemplates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen rutiner lagt til</h3>
            <p className="text-muted-foreground mb-4">
              Gå til Malbibliotek for å legge til rutiner som skal gjelde for dette prosjektet.
            </p>
            <Button onClick={() => navigate(`/ks2/project/${projectId}/maler`)}>
              <Plus className="h-4 w-4 mr-2" />
              Gå til Malbibliotek
            </Button>
          </CardContent>
        </Card>
      )}

      {routineTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Prosjektets rutiner ({filteredRoutines.length})
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk rutiner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/ks2/project/${projectId}/maler`)}
                >
                  <Library className="h-4 w-4 mr-2" />
                  Legg til flere
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRoutines.map((pt) => (
                <Card key={pt.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{pt.routine_template?.routine_name}</h4>
                          <Badge variant="outline">{pt.routine_template?.category}</Badge>
                          {pt.is_implemented && (
                            <Badge className="bg-green-500/10 text-green-500">
                              <Check className="h-3 w-3 mr-1" />
                              Implementert
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {pt.routine_template?.description || "Ingen beskrivelse"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`impl-${pt.id}`}
                            checked={pt.is_implemented}
                            onCheckedChange={() => handleMarkImplemented(pt.id, pt.is_implemented)}
                          />
                          <label
                            htmlFor={`impl-${pt.id}`}
                            className="text-sm cursor-pointer whitespace-nowrap"
                          >
                            Lest og implementert
                          </label>
                        </div>
                        {pt.routine_template?.file_path && (
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Åpne
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
