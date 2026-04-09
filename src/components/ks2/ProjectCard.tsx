import { Star, AlertTriangle, Calendar, MapPin, Building2, TrendingUp, Copy, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
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

interface ProjectCardProps {
  project: KsModule2Project;
  onClick: () => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onCopy?: (project: KsModule2Project) => void;
  onDelete?: (id: string) => void;
  openDeviationsCount?: number;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  planned: { label: "Planlagt", className: "bg-muted text-muted-foreground" },
  active: { label: "Aktiv", className: "bg-success/20 text-success" },
  handover: { label: "Overtakelse", className: "bg-warning/20 text-warning" },
  warranty: { label: "Garanti", className: "bg-info/20 text-info" },
  completed: { label: "Avsluttet", className: "bg-secondary text-secondary-foreground" },
};

export function ProjectCard({ project, onClick, onToggleFavorite, onCopy, onDelete, openDeviationsCount = 0 }: ProjectCardProps) {
  const status = statusConfig[project.status] || statusConfig.planned;

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 active:scale-[0.98] relative overflow-hidden"
      onClick={onClick}
    >
      {/* Action buttons - always visible on mobile */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-60 md:opacity-0 md:group-hover:opacity-60 hover:opacity-100 hover:text-destructive transition-opacity"
                onClick={(e) => e.stopPropagation()}
                title="Slett prosjekt"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Slett prosjekt?</AlertDialogTitle>
                <AlertDialogDescription>
                  Er du sikker på at du vil slette "{project.project_name}"? 
                  Alle data knyttet til prosjektet vil bli slettet permanent. Denne handlingen kan ikke angres.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                  }}
                >
                  Slett prosjekt
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {onCopy && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-60 md:opacity-0 md:group-hover:opacity-60 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(project);
            }}
            title="Kopier prosjekt"
          >
            <Copy className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(project.id, project.is_favorite);
          }}
        >
          <Star
            className={cn(
              "h-4 w-4 transition-colors",
              project.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            )}
          />
        </Button>
      </div>

      <CardContent className="p-4 md:p-5">
        {/* Header */}
        <div className="mb-3 md:mb-4">
          <div className="flex items-start justify-between pr-20 md:pr-8">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">{project.project_number}</p>
              <h3 className="font-semibold text-sm md:text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {project.project_name}
              </h3>
            </div>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <Badge className={cn("text-xs", status.className)}>{status.label}</Badge>
            {(project as any).project_type === "small" && (
              <Badge variant="outline" className="text-xs">Lite prosjekt</Badge>
            )}
            {(project as any).project_type === "mini" && (
              <Badge variant="outline" className="text-xs">Mini</Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          {project.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{project.address}</span>
            </div>
          )}
          {project.client_name && (
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{project.client_name}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Fremdrift
            </span>
            <span className="text-sm font-semibold">{project.progress_percent}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${project.progress_percent}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          {/* Open deviations */}
          {openDeviationsCount > 0 ? (
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{openDeviationsCount} åpne avvik</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Ingen åpne avvik</span>
          )}

          {/* Last activity */}
          {project.last_activity_date && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(project.last_activity_date), "d. MMM yyyy", { locale: nb })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
