import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Plus, 
  Search,
  Calendar,
  User,
  MapPin,
  FileText
} from "lucide-react";

interface HmsAvvik {
  id: string;
  number: string;
  title: string;
  description: string;
  location: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "closed";
  reportedBy: string;
  reportedDate: string;
  assignedTo?: string;
}

export default function Ks2HmsAvvik() {
  const { projectId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [avvik] = useState<HmsAvvik[]>([
    {
      id: "1",
      number: "HMS-001",
      title: "Manglende verneutstyr",
      description: "Observert personell uten hjelm i arbeidsområde",
      location: "Byggeplass A",
      category: "Personlig verneutstyr",
      severity: "high",
      status: "open",
      reportedBy: "Kari Hansen",
      reportedDate: "2024-12-01",
      assignedTo: "Ola Nordmann",
    },
    {
      id: "2",
      number: "HMS-002",
      title: "Rydding av arbeidsområde",
      description: "Materialer og verktøy ligger i gangveier",
      location: "2. etasje",
      category: "Orden og ryddighet",
      severity: "medium",
      status: "closed",
      reportedBy: "Per Olsen",
      reportedDate: "2024-11-25",
    },
    {
      id: "3",
      number: "HMS-003",
      title: "Manglende sikring ved kant",
      description: "Rekkverk manglet ved åpning i dekke",
      location: "3. etasje",
      category: "Fallsikring",
      severity: "critical",
      status: "in_progress",
      reportedBy: "Ola Nordmann",
      reportedDate: "2024-11-28",
      assignedTo: "Per Olsen",
    },
  ]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Kritisk</Badge>;
      case "high":
        return <Badge className="bg-red-500">Høy</Badge>;
      case "medium":
        return <Badge className="bg-amber-500">Middels</Badge>;
      case "low":
        return <Badge className="bg-emerald-500">Lav</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive">Åpen</Badge>;
      case "in_progress":
        return <Badge>Under behandling</Badge>;
      case "closed":
        return <Badge variant="secondary">Lukket</Badge>;
      default:
        return null;
    }
  };

  const filteredAvvik = avvik.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAvvik = avvik.filter(a => a.status === "open" || a.status === "in_progress");
  const closedAvvik = avvik.filter(a => a.status === "closed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <AlertTriangle className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">HMS-avvik & Uønskede hendelser</h2>
            <p className="text-muted-foreground">Registrer og følg opp HMS-avvik</p>
          </div>
        </div>
        <Button className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="h-4 w-4 mr-2" />
          Registrer avvik
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totalt</CardDescription>
            <CardTitle className="text-2xl">{avvik.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Åpne</CardDescription>
            <CardTitle className="text-2xl text-red-500">
              {avvik.filter(a => a.status === "open").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Under behandling</CardDescription>
            <CardTitle className="text-2xl text-amber-500">
              {avvik.filter(a => a.status === "in_progress").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lukket</CardDescription>
            <CardTitle className="text-2xl text-emerald-500">
              {closedAvvik.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter avvik..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">Åpne ({openAvvik.length})</TabsTrigger>
          <TabsTrigger value="closed">Lukket ({closedAvvik.length})</TabsTrigger>
          <TabsTrigger value="all">Alle ({avvik.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {openAvvik.length > 0 ? (
            openAvvik.map((a) => (
              <Card key={a.id} className="hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-muted-foreground">{a.number}</span>
                        {getSeverityBadge(a.severity)}
                      </div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        {a.location}
                      </CardDescription>
                    </div>
                    {getStatusBadge(a.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{a.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{a.reportedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Rapportert av: {a.reportedBy}</span>
                    </div>
                    {a.assignedTo && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Tildelt: {a.assignedTo}</span>
                      </div>
                    )}
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
                Ingen åpne HMS-avvik
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          {closedAvvik.length > 0 ? (
            closedAvvik.map((a) => (
              <Card key={a.id} className="hover:border-emerald-500/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-muted-foreground">{a.number}</span>
                        {getSeverityBadge(a.severity)}
                      </div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                    </div>
                    {getStatusBadge(a.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm">
                    Vis detaljer
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen lukkede HMS-avvik
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredAvvik.map((a) => (
            <Card key={a.id} className="hover:border-emerald-500/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-muted-foreground">{a.number}</span>
                      {getSeverityBadge(a.severity)}
                    </div>
                    <CardTitle className="text-lg">{a.title}</CardTitle>
                  </div>
                  {getStatusBadge(a.status)}
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">
                  Vis detaljer
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
