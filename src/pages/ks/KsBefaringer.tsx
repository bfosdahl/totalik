import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useKsInspections } from "@/hooks/useKsInspections";
import { useKsProjects } from "@/hooks/useKsProjects";
import { Calendar, MapPin, DollarSign, Plus, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusMap = {
  aktiv: { label: "Aktiv", variant: "default" as const },
  tilbud_opprettet: { label: "Tilbud opprettet", variant: "secondary" as const },
  faktura_opprettet: { label: "Faktura opprettet", variant: "outline" as const },
  fakturert: { label: "Fakturert", variant: "default" as const },
  utløpt: { label: "Utløpt", variant: "destructive" as const },
};

export default function KsBefaringer() {
  const { inspections, isLoading, createInspection } = useKsInspections();
  const { projects } = useKsProjects();
  const [activeTab, setActiveTab] = useState<string>("alle");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [formData, setFormData] = useState({
    project_id: "",
    inspection_date: format(new Date(), "yyyy-MM-dd"),
    beskrivelse: "",
    adresse: "",
    postal_code: "",
    city: "",
    kunde_navn: "",
    gyldig_til: "",
    status: "aktiv" as const,
    pris: "",
  });

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const twelveMonthsAgo = subMonths(now, 12);

    const recentInspections = inspections.filter((inspection) => {
      const inspectionDate = new Date(inspection.inspection_date);
      return inspectionDate >= twelveMonthsAgo;
    });

    const opprettet = recentInspections.length;
    const opprettetSum = recentInspections.reduce((sum, i) => sum + (i.pris || 0), 0);
    const tilbudOpprettet = recentInspections.filter((i) => 
      i.status === "tilbud_opprettet" || i.status === "faktura_opprettet" || i.status === "fakturert"
    ).length;
    const tilbudSum = recentInspections
      .filter((i) => i.status === "tilbud_opprettet" || i.status === "faktura_opprettet" || i.status === "fakturert")
      .reduce((sum, i) => sum + (i.pris || 0), 0);

    return { opprettet, opprettetSum, tilbudOpprettet, tilbudSum };
  }, [inspections]);

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const count = inspections.filter((inspection) => {
        const inspectionDate = new Date(inspection.inspection_date);
        return isWithinInterval(inspectionDate, { start: monthStart, end: monthEnd });
      }).length;

      months.push({
        month: format(date, "MMM yy", { locale: nb }),
        count,
      });
    }
    return months;
  }, [inspections]);

  // Filter inspections by status
  const filteredInspections = useMemo(() => {
    if (activeTab === "alle") return inspections;
    return inspections.filter((i) => i.status === activeTab);
  }, [inspections, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createInspection({
      project_id: formData.project_id,
      inspection_date: formData.inspection_date,
      beskrivelse: formData.beskrivelse || null,
      adresse: formData.adresse || null,
      postal_code: formData.postal_code || null,
      city: formData.city || null,
      kunde_navn: formData.kunde_navn || null,
      gyldig_til: formData.gyldig_til || null,
      status: formData.status,
      pris: formData.pris ? parseFloat(formData.pris) : null,
      opprettet_av_user_id: null,
      opprettet_av_navn: null,
    });
    setShowNewDialog(false);
    setFormData({
      project_id: "",
      inspection_date: format(new Date(), "yyyy-MM-dd"),
      beskrivelse: "",
      adresse: "",
      postal_code: "",
      city: "",
      kunde_navn: "",
      gyldig_til: "",
      status: "aktiv",
      pris: "",
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Laster befaringer...</div>
        </div>
      </AppLayout>
    );
  }

  const maxCount = Math.max(...monthlyData.map((d) => d.count), 1);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Befaringer</h1>
            <p className="text-muted-foreground">
              Kundebefaringer og salgsmøter knyttet til prosjekter
            </p>
          </div>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Legg til
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ny befaring</DialogTitle>
                <DialogDescription>
                  Opprett en ny kundebefaring knyttet til et prosjekt
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="project_id">Prosjekt *</Label>
                    <Select
                      value={formData.project_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, project_id: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg prosjekt" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.project_number} - {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="inspection_date">Befaringsdato *</Label>
                    <Input
                      id="inspection_date"
                      type="date"
                      value={formData.inspection_date}
                      onChange={(e) =>
                        setFormData({ ...formData, inspection_date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="gyldig_til">Gyldig til</Label>
                    <Input
                      id="gyldig_til"
                      type="date"
                      value={formData.gyldig_til}
                      onChange={(e) =>
                        setFormData({ ...formData, gyldig_til: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="kunde_navn">Kundenavn</Label>
                    <Input
                      id="kunde_navn"
                      value={formData.kunde_navn}
                      onChange={(e) =>
                        setFormData({ ...formData, kunde_navn: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input
                      id="adresse"
                      value={formData.adresse}
                      onChange={(e) =>
                        setFormData({ ...formData, adresse: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="postal_code">Postnummer</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) =>
                        setFormData({ ...formData, postal_code: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Sted</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="beskrivelse">Beskrivelse</Label>
                    <Textarea
                      id="beskrivelse"
                      value={formData.beskrivelse}
                      onChange={(e) =>
                        setFormData({ ...formData, beskrivelse: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="pris">Pris (kr)</Label>
                    <Input
                      id="pris"
                      type="number"
                      step="0.01"
                      value={formData.pris}
                      onChange={(e) =>
                        setFormData({ ...formData, pris: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aktiv">Aktiv</SelectItem>
                        <SelectItem value="tilbud_opprettet">Tilbud opprettet</SelectItem>
                        <SelectItem value="faktura_opprettet">Faktura opprettet</SelectItem>
                        <SelectItem value="fakturert">Fakturert</SelectItem>
                        <SelectItem value="utløpt">Utløpt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit">Opprett befaring</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Befaringer opprettet</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.opprettet}</div>
              <p className="text-xs text-muted-foreground">Siste 12 måneder</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Befaringer opprettet sum</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.opprettetSum.toLocaleString("nb-NO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">kr</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tilbud opprettet</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tilbudOpprettet}</div>
              <p className="text-xs text-muted-foreground">Siste 12 måneder</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tilbud opprettet sum</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.tilbudSum.toLocaleString("nb-NO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">kr</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Befaringer siste 12 måneder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-primary/20 rounded-t relative" style={{
                    height: `${(data.count / maxCount) * 100}%`,
                    minHeight: data.count > 0 ? "20px" : "0px"
                  }}>
                    {data.count > 0 && (
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-medium">
                        {data.count}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{data.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inspections Table */}
        <Card>
          <CardHeader>
            <CardTitle>Befaringer</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="alle">Alle</TabsTrigger>
                <TabsTrigger value="aktiv">Aktive</TabsTrigger>
                <TabsTrigger value="tilbud_opprettet">Tilbud opprettet</TabsTrigger>
                <TabsTrigger value="faktura_opprettet">Faktura opprettet</TabsTrigger>
                <TabsTrigger value="fakturert">Fakturert</TabsTrigger>
                <TabsTrigger value="utløpt">Utløpt</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredInspections.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen befaringer funnet</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Opprettet</TableHead>
                          <TableHead>Beskrivelse</TableHead>
                          <TableHead>Adresse</TableHead>
                          <TableHead>Gyldig til</TableHead>
                          <TableHead>Kunde</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Pris</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInspections.map((inspection) => (
                          <TableRow key={inspection.id}>
                            <TableCell>
                              {format(new Date(inspection.inspection_date), "dd.MM.yyyy", {
                                locale: nb,
                              })}
                            </TableCell>
                            <TableCell>{inspection.beskrivelse || "-"}</TableCell>
                            <TableCell>
                              {inspection.adresse ? (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span>{inspection.adresse}</span>
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {inspection.gyldig_til
                                ? format(new Date(inspection.gyldig_til), "dd.MM.yyyy", {
                                    locale: nb,
                                  })
                                : "-"}
                            </TableCell>
                            <TableCell>{inspection.kunde_navn || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={statusMap[inspection.status].variant}>
                                {statusMap[inspection.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {inspection.pris
                                ? `${inspection.pris.toLocaleString("nb-NO", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} kr`
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
