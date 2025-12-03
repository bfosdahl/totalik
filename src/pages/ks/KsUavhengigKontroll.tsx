import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Building2,
  Calendar,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

// Status configuration
const statusConfig = {
  planlagt: { label: "Planlagt", variant: "secondary" as const, icon: Clock },
  utfort: { label: "Utført", variant: "default" as const, icon: CheckCircle2 },
  godkjent: { label: "Godkjent", variant: "outline" as const, icon: CheckCircle2 },
  avvist: { label: "Avvist", variant: "destructive" as const, icon: XCircle },
};

// Control types for 2025+ requirements
const controlTypes = [
  { value: "vatrom", label: "Våtrom" },
  { value: "lufttetthet", label: "Lufttetthet" },
  { value: "bygningsfysikk", label: "Bygningsfysikk" },
  { value: "konstruksjon", label: "Konstruksjon" },
  { value: "geoteknikk", label: "Geoteknikk" },
  { value: "brann", label: "Brann" },
  { value: "annet", label: "Annet" },
];

interface UavhengigKontroll {
  id: string;
  title: string;
  controlType: string;
  controllerName: string;
  controllerCompany: string;
  plannedDate: string;
  completedDate?: string;
  status: keyof typeof statusConfig;
  reportUrl?: string;
  comment?: string;
  projectId?: string;
  projectName?: string;
}

export default function KsUavhengigKontroll() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [kontroller, setKontroller] = useState<UavhengigKontroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedKontroll, setSelectedKontroll] = useState<UavhengigKontroll | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    controlType: "",
    controllerName: "",
    controllerCompany: "",
    plannedDate: "",
    projectId: "",
  });

  // Fetch kontroller from database
  useEffect(() => {
    const fetchKontroller = async () => {
      if (!profile?.company_id) return;

      try {
        // For now, use mock data as we haven't created the table yet
        // In production, this would fetch from ks_uavhengig_kontroll table
        const mockData: UavhengigKontroll[] = [
          {
            id: "1",
            title: "Våtromskontroll - Bad 1. etasje",
            controlType: "vatrom",
            controllerName: "Per Hansen",
            controllerCompany: "Uavhengig Kontroll AS",
            plannedDate: "2025-01-15",
            status: "planlagt",
            projectName: "Enebolig Drammen",
          },
          {
            id: "2",
            title: "Lufttetthetsmåling",
            controlType: "lufttetthet",
            controllerName: "Kari Olsen",
            controllerCompany: "Byggkontroll Nord",
            plannedDate: "2025-01-10",
            completedDate: "2025-01-10",
            status: "godkjent",
            reportUrl: "/reports/lufttetthet-rapport.pdf",
            projectName: "Leilighetsbygg Oslo",
          },
          {
            id: "3",
            title: "Brannsikkerhet - Rømningsveier",
            controlType: "brann",
            controllerName: "Ole Nordmann",
            controllerCompany: "Brannkonsult AS",
            plannedDate: "2025-01-08",
            completedDate: "2025-01-09",
            status: "avvist",
            comment: "Mangler godkjent dokumentasjon på branndører i korridor.",
            projectName: "Næringsbygg Bergen",
          },
        ];

        setKontroller(mockData);
      } catch (error) {
        console.error("Error fetching kontroller:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKontroller();
  }, [profile?.company_id]);

  // Filter kontroller
  const filteredKontroller = kontroller.filter((k) => {
    if (searchQuery && !k.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedStatus !== "all" && k.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const handleCreateKontroll = async () => {
    if (!formData.title || !formData.controlType || !formData.controllerName) {
      toast.error("Fyll ut alle påkrevde felt");
      return;
    }

    try {
      // In production, this would insert into ks_uavhengig_kontroll table
      const newKontroll: UavhengigKontroll = {
        id: Date.now().toString(),
        ...formData,
        status: "planlagt",
      };

      setKontroller((prev) => [newKontroll, ...prev]);
      setShowNewDialog(false);
      setFormData({
        title: "",
        controlType: "",
        controllerName: "",
        controllerCompany: "",
        plannedDate: "",
        projectId: "",
      });
      toast.success("Uavhengig kontroll opprettet");
    } catch (error) {
      console.error("Error creating kontroll:", error);
      toast.error("Kunne ikke opprette kontroll");
    }
  };

  const handleUploadReport = async (kontrollId: string) => {
    // This would handle file upload in production
    toast.info("Filopplasting kommer snart");
  };

  const handleStatusChange = async (kontrollId: string, newStatus: keyof typeof statusConfig) => {
    setKontroller((prev) =>
      prev.map((k) =>
        k.id === kontrollId
          ? {
              ...k,
              status: newStatus,
              completedDate: newStatus !== "planlagt" ? new Date().toISOString() : undefined,
            }
          : k
      )
    );
    toast.success(`Status oppdatert til ${statusConfig[newStatus].label}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Uavhengig kontroll</h1>
            <p className="text-muted-foreground">
              Nye krav fra 2025 - Dokumenter og spor uavhengige kontroller
            </p>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ny kontroll
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Nye lovkrav fra 2025
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Uavhengig kontroll skal dokumenteres med kontrollør, firma, dato, 
                  og kontrollrapport. Alle kontroller må godkjennes eller avvises med begrunnelse.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk i kontroller..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statuser</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kontroll</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Kontrollør</TableHead>
                  <TableHead>Planlagt dato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rapport</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Laster...
                    </TableCell>
                  </TableRow>
                ) : filteredKontroller.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground">Ingen kontroller funnet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKontroller.map((kontroll) => {
                    const StatusIcon = statusConfig[kontroll.status].icon;
                    return (
                      <TableRow key={kontroll.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{kontroll.title}</p>
                            {kontroll.projectName && (
                              <p className="text-xs text-muted-foreground">
                                {kontroll.projectName}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {controlTypes.find((t) => t.value === kontroll.controlType)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{kontroll.controllerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {kontroll.controllerCompany}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(kontroll.plannedDate), "dd. MMM yyyy", { locale: nb })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[kontroll.status].variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[kontroll.status].label}
                          </Badge>
                          {kontroll.comment && kontroll.status === "avvist" && (
                            <p className="text-xs text-red-600 mt-1 max-w-48 truncate">
                              {kontroll.comment}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {kontroll.reportUrl ? (
                            <Button variant="link" size="sm" className="p-0 h-auto">
                              <FileText className="h-4 w-4 mr-1" />
                              Se rapport
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUploadReport(kontroll.id)}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Last opp
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={kontroll.status}
                            onValueChange={(val) =>
                              handleStatusChange(kontroll.id, val as keyof typeof statusConfig)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* New Kontroll Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ny uavhengig kontroll</DialogTitle>
              <DialogDescription>
                Registrer en ny uavhengig kontroll for prosjektet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tittel *</Label>
                <Input
                  placeholder="F.eks. Våtromskontroll - Bad 1. etasje"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type kontroll *</Label>
                <Select
                  value={formData.controlType}
                  onValueChange={(val) => setFormData({ ...formData, controlType: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg type" />
                  </SelectTrigger>
                  <SelectContent>
                    {controlTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kontrollør (navn) *</Label>
                  <Input
                    placeholder="Navn på kontrollør"
                    value={formData.controllerName}
                    onChange={(e) => setFormData({ ...formData, controllerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Firma</Label>
                  <Input
                    placeholder="Firmanavn"
                    value={formData.controllerCompany}
                    onChange={(e) => setFormData({ ...formData, controllerCompany: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Planlagt dato</Label>
                <Input
                  type="date"
                  value={formData.plannedDate}
                  onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreateKontroll}>Opprett kontroll</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
