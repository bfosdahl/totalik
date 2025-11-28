import React from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FilePlus, FileText, Trash2, Edit, CheckCircle2, Clock } from "lucide-react";
import type { AuditFormResponse } from "@/hooks/useAuditFormResponses";

interface SavedFormsListProps {
  responses: AuditFormResponse[];
  onDelete: (id: string) => void;
  onSelect: (response: AuditFormResponse) => void;
  onCreateNew: () => void;
  isDeleting?: boolean;
  title?: string;
}

const SavedFormsList: React.FC<SavedFormsListProps> = ({
  responses,
  onDelete,
  onSelect,
  onCreateNew,
  isDeleting,
  title = "Lagrede skjemaer",
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "d. MMM yyyy", { locale: nb });
    } catch {
      return dateString;
    }
  };

  const drafts = responses.filter((r) => r.status === "draft");
  const completed = responses.filter((r) => r.status === "completed");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {title}
        </CardTitle>
        <Button onClick={onCreateNew} className="gap-2">
          <FilePlus className="w-4 h-4" />
          Start ny
        </Button>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Ingen lagrede skjemaer ennå. Klikk "Start ny" for å begynne.
          </p>
        ) : (
          <div className="space-y-4">
            {drafts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Utkast
                </h4>
                <div className="space-y-2">
                  {drafts.map((response) => (
                    <div
                      key={response.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="bg-warning/10 text-warning">
                            Utkast
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Opprettet: {formatDate(response.created_at)}
                          </span>
                        </div>
                        {response.revision_date && (
                          <p className="text-sm mt-1">
                            Revisjonsdato: {formatDate(response.revision_date)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelect(response)}
                          className="gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Fortsett
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Slette utkast?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Er du sikker på at du vil slette dette utkastet? Denne handlingen kan ikke angres.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(response.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Slett
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Fullførte ({completed.length})
                </h4>
                <div className="space-y-2">
                  {completed.map((response) => (
                    <div
                      key={response.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="bg-success/10 text-success">
                            Fullført
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(response.completed_at)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1">
                          {response.revision_date && (
                            <span>Revisjonsdato: {formatDate(response.revision_date)}</span>
                          )}
                          {response.auditor_name && (
                            <span className="text-muted-foreground">
                              Revisor: {response.auditor_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelect(response)}
                          className="gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Vis/Rediger
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Slette skjema?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Er du sikker på at du vil slette dette fullførte skjemaet? Det vil også fjernes fra IK-Handboken. Denne handlingen kan ikke angres.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(response.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Slett
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedFormsList;
