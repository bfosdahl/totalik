import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HardHat, 
  Plus, 
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText
} from "lucide-react";

interface Vernerunde {
  id: string;
  title: string;
  scheduledDate: string;
  completedDate?: string;
  responsible: string;
  status: "planned" | "in_progress" | "completed";
  findings: number;
  openFindings: number;
}

export default function Ks2Vernerunder() {
  const { projectId } = useParams();
  
  const [vernerunder] = useState<Vernerunde[]>([
    {
      id: "1",
      title: "Vernerunde uke 48",
      scheduledDate: "2024-11-29",
      completedDate: "2024-11-29",
      responsible: "Ola Nordmann",
      status: "completed",
      findings: 3,
      openFindings: 0,
    },
    {
      id: "2",
      title: "Vernerunde uke 49",
      scheduledDate: "2024-12-06",
      completedDate: "2024-12-06",
      responsible: "Kari Hansen",
      status: "completed",
      findings: 2,
      openFindings: 1,
    },
    {
      id: "3",
      title: "Vernerunde uke 50",
      scheduledDate: "2024-12-13",
      responsible: "Per Olsen",
      status: "planned",
      findings: 0,
      openFindings: 0,
    },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500">Fullført</Badge>;
      case "in_progress":
        return <Badge>Pågår</Badge>;
      case "planned":
        return <Badge variant="secondary">Planlagt</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-primary" />;
      case "planned":
        return <Calendar className="h-5 w-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const planned = vernerunder.filter(v => v.status === "planned");
  const completed = vernerunder.filter(v => v.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <HardHat className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Vernerunder & RUH</h2>
            <p className="text-muted-foreground">Planlegg og gjennomfør vernerunder</p>
          </div>
        </div>
        <Button className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="h-4 w-4 mr-2" />
          Planlegg vernerunde
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gjennomført</CardDescription>
            <CardTitle className="text-2xl text-emerald-500">{completed.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Planlagt</CardDescription>
            <CardTitle className="text-2xl">{planned.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Åpne funn</CardDescription>
            <CardTitle className="text-2xl text-amber-500">
              {vernerunder.reduce((acc, v) => acc + v.openFindings, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Alle ({vernerunder.length})</TabsTrigger>
          <TabsTrigger value="planned">Planlagt ({planned.length})</TabsTrigger>
          <TabsTrigger value="completed">Fullført ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {vernerunder.map((vr) => (
            <Card key={vr.id} className="hover:border-emerald-500/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(vr.status)}
                    <div>
                      <CardTitle className="text-lg">{vr.title}</CardTitle>
                      <CardDescription>
                        {vr.status === "completed" 
                          ? `Gjennomført: ${vr.completedDate}` 
                          : `Planlagt: ${vr.scheduledDate}`}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(vr.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Ansvarlig: {vr.responsible}</span>
                  </div>
                  {vr.status === "completed" && (
                    <>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{vr.findings} funn</span>
                      </div>
                      {vr.openFindings > 0 && (
                        <div className="flex items-center gap-2 text-amber-500">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{vr.openFindings} åpne</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  {vr.status === "planned" ? (
                    <Button variant="default" size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                      Start vernerunde
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      Vis detaljer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="planned" className="space-y-4">
          {planned.length > 0 ? (
            planned.map((vr) => (
              <Card key={vr.id}>
                {/* Same card content */}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(vr.status)}
                      <div>
                        <CardTitle className="text-lg">{vr.title}</CardTitle>
                        <CardDescription>Planlagt: {vr.scheduledDate}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(vr.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Ansvarlig: {vr.responsible}</span>
                  </div>
                  <Button variant="default" size="sm" className="mt-4 bg-emerald-500 hover:bg-emerald-600">
                    Start vernerunde
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen planlagte vernerunder
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completed.length > 0 ? (
            completed.map((vr) => (
              <Card key={vr.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(vr.status)}
                      <div>
                        <CardTitle className="text-lg">{vr.title}</CardTitle>
                        <CardDescription>Gjennomført: {vr.completedDate}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(vr.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Ansvarlig: {vr.responsible}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{vr.findings} funn</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4">
                    Vis detaljer
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen fullførte vernerunder
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
