import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Users, 
  ClipboardCheck, 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  Send,
  Building2,
  FileArchive,
  Plus
} from "lucide-react";
import { 
  useProjectByggesak, 
  useByggesakForms, 
  useByggesakTemplates,
  useInitializeByggesak 
} from "@/hooks/useKsModule2Byggesak";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  not_started: { label: "Ikke startet", color: "bg-muted text-muted-foreground", icon: <Clock className="h-3 w-3" /> },
  draft: { label: "Utkast", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: <FileText className="h-3 w-3" /> },
  ready: { label: "Klar", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: <ClipboardCheck className="h-3 w-3" /> },
  signed: { label: "Signert", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 className="h-3 w-3" /> },
  sent: { label: "Sendt", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: <Send className="h-3 w-3" /> },
  uploaded: { label: "Opplastet", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <Download className="h-3 w-3" /> },
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  nabovarsel: { label: "Nabovarsel", icon: <Users className="h-5 w-5" />, color: "text-blue-600" },
  soknad: { label: "Søknader", icon: <FileText className="h-5 w-5" />, color: "text-indigo-600" },
  ansvarsrett: { label: "Ansvarsrett", icon: <Award className="h-5 w-5" />, color: "text-orange-600" },
  plan: { label: "Planer", icon: <ClipboardCheck className="h-5 w-5" />, color: "text-teal-600" },
  kontroll: { label: "Kontroll", icon: <CheckCircle2 className="h-5 w-5" />, color: "text-green-600" },
  ferdigattest: { label: "Ferdigattest", icon: <Building2 className="h-5 w-5" />, color: "text-emerald-600" },
  melding: { label: "Meldinger", icon: <AlertCircle className="h-5 w-5" />, color: "text-amber-600" },
  annet: { label: "Annet", icon: <FileText className="h-5 w-5" />, color: "text-gray-600" },
};

export default function Ks2ByggesakDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { company } = useAuth();
  const { projects } = useKsModule2Projects();
  const project = projects?.find(p => p.id === projectId);
  const { data: byggesak, isLoading: byggesakLoading } = useProjectByggesak(projectId || "");
  const { data: forms, isLoading: formsLoading } = useByggesakForms(byggesak?.id);
  const { data: templates } = useByggesakTemplates();
  const { initialize, isLoading: initLoading } = useInitializeByggesak(projectId || "", company?.id || "");

  const isLoading = byggesakLoading || formsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // If no byggesak exists, show initialization
  if (!byggesak) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="text-center space-y-2">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">Byggesak & Blanketter</h2>
          <p className="text-muted-foreground max-w-md">
            Start byggesaken for å få tilgang til alle blanketter for søknad, ansvarsrett, 
            nabovarsel, gjennomføringsplan og ferdigattest.
          </p>
        </div>
        <Button size="lg" onClick={initialize} disabled={initLoading}>
          {initLoading ? "Oppretter..." : "Start byggesak"}
        </Button>
      </div>
    );
  }

  // Calculate progress
  const totalForms = forms?.length || 0;
  const signedForms = forms?.filter(f => ["signed", "sent", "uploaded"].includes(f.status)).length || 0;
  const progressPercent = totalForms > 0 ? Math.round((signedForms / totalForms) * 100) : 0;

  // Group forms by category
  const formsByCategory = (forms || []).reduce((acc, form) => {
    if (!acc[form.form_category]) acc[form.form_category] = [];
    acc[form.form_category].push(form);
    return acc;
  }, {} as Record<string, typeof forms>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Byggesak & Blanketter</h1>
          <p className="text-muted-foreground">{project?.project_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileArchive className="h-4 w-4" />
            Last ned komplett pakke
          </Button>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fremdrift</p>
                <p className="text-2xl font-bold">{signedForms} av {totalForms}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress value={progressPercent} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Signerte</p>
                <p className="text-2xl font-bold">{signedForms}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Under arbeid</p>
                <p className="text-2xl font-bold">
                  {forms?.filter(f => f.status === "draft").length || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiltaksklasse</p>
                <p className="text-2xl font-bold">{byggesak.tiltaksklasse || "1"}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Info */}
      {(byggesak.gnr || byggesak.municipality) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Eiendomsinformasjon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-sm">
              {byggesak.municipality && (
                <div>
                  <p className="text-muted-foreground">Kommune</p>
                  <p className="font-medium">{byggesak.municipality}</p>
                </div>
              )}
              {byggesak.gnr && (
                <div>
                  <p className="text-muted-foreground">Gnr/Bnr</p>
                  <p className="font-medium">{byggesak.gnr}/{byggesak.bnr || "-"}</p>
                </div>
              )}
              {byggesak.property_address && (
                <div>
                  <p className="text-muted-foreground">Adresse</p>
                  <p className="font-medium">{byggesak.property_address}</p>
                </div>
              )}
              {byggesak.case_number && (
                <div>
                  <p className="text-muted-foreground">Saksnummer</p>
                  <p className="font-medium">{byggesak.case_number}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forms by Category */}
      <div className="space-y-6">
        {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
          const categoryForms = formsByCategory[category] || [];
          const availableTemplates = templates?.filter(t => 
            t.form_category === category && 
            !categoryForms.some(f => f.form_number === t.form_number)
          ) || [];

          if (categoryForms.length === 0 && availableTemplates.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={config.color}>{config.icon}</div>
                  <CardTitle className="text-lg">{config.label}</CardTitle>
                  {categoryForms.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {categoryForms.filter(f => ["signed", "sent", "uploaded"].includes(f.status)).length}/{categoryForms.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryForms.map(form => {
                    const statusConfig = STATUS_CONFIG[form.status] || STATUS_CONFIG.not_started;
                    return (
                      <Link
                        key={form.id}
                        to={`/ks/project/${projectId}/byggesak/form/${form.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{form.form_number} {form.form_name}</p>
                            {form.signed_at && (
                              <p className="text-xs text-muted-foreground">
                                Signert {new Date(form.signed_at).toLocaleDateString("nb-NO")}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={statusConfig.color}>
                          <span className="flex items-center gap-1">
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </Badge>
                      </Link>
                    );
                  })}

                  {availableTemplates.length > 0 && (
                    <div className="pt-2 border-t mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Legg til blankett:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableTemplates.map(template => (
                          <Button
                            key={template.id}
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                          >
                            <Plus className="h-3 w-3" />
                            {template.form_number}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hurtighandlinger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
              <Download className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Last ned offisielle skjemaer</p>
                <p className="text-xs text-muted-foreground">Fra DIBK</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
              <FileArchive className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Generer komplett pakke</p>
                <p className="text-xs text-muted-foreground">Alle signerte dokumenter</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3" disabled>
              <Send className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Send til Altinn</p>
                <p className="text-xs text-muted-foreground">Kommer snart</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
              <Building2 className="h-5 w-5 text-orange-600" />
              <div className="text-left">
                <p className="font-medium">Rediger byggesak</p>
                <p className="text-xs text-muted-foreground">Gnr, bnr, kommune</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
