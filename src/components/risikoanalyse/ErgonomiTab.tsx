import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Trash2,
  Edit,
  Activity,
  Volume2,
  Vibrate,
  Wrench,
} from "lucide-react";
import {
  useErgonomicRiskAssessments,
  useDeleteErgonomicAssessment,
  calculateErgonomicRiskLevel,
  ErgonomicAssessmentType,
} from "@/hooks/useErgonomicRiskAssessment";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ErgonomicAssessmentDialog } from "./ergonomi/ErgonomicAssessmentDialog";
import { NewErgonomicAssessmentDialog } from "./ergonomi/NewErgonomicAssessmentDialog";
import { EquipmentAssessment } from "./ergonomi/EquipmentAssessment";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ASSESSMENT_TYPE_CONFIG: Record<ErgonomicAssessmentType, {
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
}> = {
  muskel_skjelett: {
    label: "Muskel- og skjelett",
    icon: Activity,
    description: "Belastningsskader, tunge løft, arbeidsstillinger",
    color: "text-blue-600",
  },
  vibrasjon: {
    label: "Vibrasjoner",
    icon: Vibrate,
    description: "Hånd-arm og helkroppsvibrasjoner",
    color: "text-purple-600",
  },
  stoy: {
    label: "Støy",
    icon: Volume2,
    description: "Støyeksponering og hørselvern",
    color: "text-orange-600",
  },
};

export function ErgonomiTab() {
  const [mainTab, setMainTab] = useState("risikovurderinger");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<ErgonomicAssessmentType | "all">("all");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const { data: assessmentsData, isLoading } = useErgonomicRiskAssessments();
  const { mutate: deleteAssessment, isPending: isDeleting } = useDeleteErgonomicAssessment();

  // Ensure assessments is always an array
  const assessments = assessmentsData ?? [];

  // Filter assessments
  const filteredAssessments = assessments.filter((a) => {
    // Filter by type
    if (activeSubTab !== "all" && !a.assessment_type.includes(activeSubTab as any)) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        a.title?.toLowerCase().includes(query) ||
        a.work_area?.toLowerCase().includes(query) ||
        a.job_role?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Statistics
  const totalCount = assessments.length;
  const completedCount = assessments.filter((a) => a.status === "completed").length;
  const inProgressCount = assessments.filter((a) => a.status === "in_progress" || a.status === "draft").length;
  const highRiskCount = assessments.filter((a) => {
    const level = calculateErgonomicRiskLevel(a.consequence_severity || 0, a.probability || 0);
    return level.score > 10;
  }).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3" />
            Fullført
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3" />
            Pågående
          </Badge>
        );
      case "needs_review":
        return (
          <Badge variant="outline" className="gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="h-3 w-3" />
            Trenger gjennomgang
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Utkast
          </Badge>
        );
    }
  };

  const getRiskBadge = (severity: number | undefined, probability: number | undefined) => {
    const riskLevel = calculateErgonomicRiskLevel(severity || 0, probability || 0);
    
    if (riskLevel.score === 0) {
      return <span className="text-muted-foreground text-sm">-</span>;
    }

    return (
      <Badge variant="outline" className={cn(riskLevel.bg, riskLevel.color)}>
        R{riskLevel.score} - {riskLevel.level}
      </Badge>
    );
  };

  const getTypeIcon = (type: ErgonomicAssessmentType) => {
    const config = ASSESSMENT_TYPE_CONFIG[type];
    const Icon = config.icon;
    return <Icon className={cn("h-4 w-4", config.color)} />;
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteAssessment(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main tabs: Risikovurderinger vs Verktøy & Utstyr */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="risikovurderinger" className="gap-2">
            <Activity className="h-4 w-4" />
            Risikovurderinger
          </TabsTrigger>
          <TabsTrigger value="verktoy" className="gap-2">
            <Wrench className="h-4 w-4" />
            Verktøy & Utstyr
          </TabsTrigger>
        </TabsList>

        {/* ===== Risikovurderinger Tab ===== */}
        <TabsContent value="risikovurderinger" className="mt-6 space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{totalCount}</p>
                    <p className="text-sm text-muted-foreground">Totalt vurdert</p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                    <p className="text-sm text-muted-foreground">Fullført</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
                    <p className="text-sm text-muted-foreground">Pågående</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-600">{highRiskCount}</p>
                    <p className="text-sm text-muted-foreground">Høy risiko</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assessment List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Ergonomisk risikovurdering
                  </CardTitle>
                  <CardDescription>
                    Muskel- og skjelettplager, arbeidsstillinger og belastningsskader
                  </CardDescription>
                </div>
                <Button onClick={() => setShowNewDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ny vurdering
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Sub-tabs for assessment types */}
              <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as ErgonomicAssessmentType | "all")}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Alle</TabsTrigger>
                  <TabsTrigger value="muskel_skjelett" className="gap-1">
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Muskel-skjelett</span>
                  </TabsTrigger>
                  <TabsTrigger value="vibrasjon" className="gap-1">
                    <Vibrate className="h-4 w-4" />
                    <span className="hidden sm:inline">Vibrasjon</span>
                  </TabsTrigger>
                  <TabsTrigger value="stoy" className="gap-1">
                    <Volume2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Støy</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search */}
              {assessments.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk etter vurdering..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {/* Table or Empty State */}
              {assessments.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ingen ergonomiske risikovurderinger</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Opprett din første vurdering for muskel-skjelett, vibrasjon eller støy
                  </p>
                  <Button onClick={() => setShowNewDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ny vurdering
                  </Button>
                </div>
              ) : filteredAssessments.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Ingen vurderinger matcher søket
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Tittel</TableHead>
                        <TableHead>Område</TableHead>
                        <TableHead>Risikonivå</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sist oppdatert</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssessments.map((assessment) => (
                        <TableRow key={assessment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2 flex-wrap">
                              {assessment.assessment_type.map((t) => (
                                <span key={t} className="flex items-center gap-1">
                                  {getTypeIcon(t)}
                                  <span className="text-sm">
                                    {ASSESSMENT_TYPE_CONFIG[t]?.label || t}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{assessment.title}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {assessment.work_area || "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getRiskBadge(assessment.consequence_severity, assessment.probability)}
                          </TableCell>
                          <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(assessment.updated_at), "d. MMM yyyy", { locale: nb })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedAssessmentId(assessment.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirmId(assessment.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Om ergonomisk risikovurdering</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Ergonomisk risikovurdering følger Arbeidstilsynets metodikk for kartlegging og vurdering
                av fysiske belastninger i arbeidsmiljøet. Vurderingene dekker muskel- og skjelettplager,
                tunge løft, arbeidsstillinger og belastningsskader.
              </p>
              <p>
                For vurdering av vibrasjon og støy fra verktøy og utstyr, bruk fanen{" "}
                <button
                  className="text-primary underline font-medium"
                  onClick={() => setMainTab("verktoy")}
                >
                  Verktøy & Utstyr
                </button>
                {" "}som inkluderer kalkulatorer med automatiske varsler ved overskridelse av grenseverdier.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Verktøy & Utstyr Tab ===== */}
        <TabsContent value="verktoy" className="mt-6">
          <EquipmentAssessment />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NewErgonomicAssessmentDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />

      <ErgonomicAssessmentDialog
        assessmentId={selectedAssessmentId}
        open={!!selectedAssessmentId}
        onOpenChange={(open) => !open && setSelectedAssessmentId(null)}
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett risikovurdering?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne risikovurderingen? Handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Sletter..." : "Slett"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
