import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  FileCheck, 
  Plus, 
  Trash2, 
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  User,
  ChevronRight,
  Edit,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { useHmsSja, HmsSja, HmsSjaRisk, HmsSjaMeasure } from "@/hooks/useHmsSja";
import { useHmsSjaTemplates } from "@/hooks/useHmsSjaTemplates";
import { useEmployees } from "@/hooks/useEmployees";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { HmsSjaWizard } from "./HmsSjaWizard";

const RISK_LEVELS = [
  { value: "low", label: "Lav", color: "bg-green-100 text-green-700" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "Høy", color: "bg-orange-100 text-orange-700" },
  { value: "critical", label: "Kritisk", color: "bg-red-100 text-red-700" },
];

const STATUS_CONFIG = {
  draft: { label: "Utkast", color: "bg-gray-100 text-gray-700", icon: Edit },
  active: { label: "Aktiv", color: "bg-blue-100 text-blue-700", icon: Clock },
  completed: { label: "Fullført", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "Avbrutt", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

export function HmsSjaTab() {
  const { sjaList, isLoading, createSja, deleteSja } = useHmsSja();
  const { templates, deleteTemplate } = useHmsSjaTemplates();
  const { employees } = useEmployees();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedSja, setSelectedSja] = useState<HmsSja | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  
  const [newSja, setNewSja] = useState({
    title: "",
    description: "",
    location: "",
    planned_date: "",
    responsible_name: "",
    risk_level: "medium" as const,
  });

  const handleCreate = async () => {
    if (!newSja.title) {
      toast.error("Tittel er påkrevd");
      return;
    }

    // Build risks/measures from selected template, if any
    let risks: HmsSjaRisk[] = [];
    let measures: HmsSjaMeasure[] = [];
    let work_description: string | undefined;
    if (selectedTemplateId && selectedTemplateId !== "none") {
      const tmpl = templates.find((t) => t.id === selectedTemplateId);
      if (tmpl) {
        risks = tmpl.rows.map((r) => ({
          id: r.id || crypto.randomUUID(),
          description: r.risk,
          probability: 3,
          consequence: 3,
          ...({ activity: r.activity } as any),
        })) as any;
        measures = tmpl.rows
          .filter((r) => r.measure)
          .map((r) => ({
            id: crypto.randomUUID(),
            riskId: r.id,
            description: r.measure,
            responsible: "",
          }));
        work_description = tmpl.rows.map((r) => r.activity).filter(Boolean).join("; ");
      }
    }

    const result = await createSja.mutateAsync({
      title: newSja.title,
      description: newSja.description,
      location: newSja.location,
      planned_date: newSja.planned_date,
      responsible_name: newSja.responsible_name,
      risk_level: newSja.risk_level,
      risks,
      measures,
      work_description,
    });

    setShowNewDialog(false);
    setSelectedTemplateId("none");
    setNewSja({
      title: "",
      description: "",
      location: "",
      planned_date: "",
      responsible_name: "",
      risk_level: "medium",
    });

    // Open wizard for the new SJA
    if (result) {
      setSelectedSja(result as unknown as HmsSja);
      setShowWizard(true);
    }
  };

  const filteredList = sjaList.filter(sja =>
    sja.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sja.sja_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sja.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const stats = {
    total: sjaList.length,
    draft: sjaList.filter(s => s.status === "draft").length,
    active: sjaList.filter(s => s.status === "active").length,
    completed: sjaList.filter(s => s.status === "completed").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  if (showWizard && selectedSja) {
    return (
      <HmsSjaWizard 
        sja={selectedSja} 
        onClose={() => {
          setShowWizard(false);
          setSelectedSja(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Totalt SJA</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.draft}</div>
            <div className="text-sm text-muted-foreground">Utkast</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Aktive</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Fullført</div>
          </CardContent>
        </Card>
      </div>

      {/* Header with search and new button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter SJA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny SJA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Opprett ny Sikker Jobb Analyse</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tittel *</label>
                <Input 
                  placeholder="F.eks. Arbeid i høyden - tak"
                  value={newSja.title}
                  onChange={(e) => setNewSja(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Beskrivelse</label>
                <Textarea 
                  placeholder="Beskriv arbeidet som skal utføres..."
                  value={newSja.description}
                  onChange={(e) => setNewSja(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Lokasjon</label>
                  <Input 
                    placeholder="Hvor skal arbeidet utføres?"
                    value={newSja.location}
                    onChange={(e) => setNewSja(p => ({ ...p, location: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Planlagt dato</label>
                  <Input 
                    type="date"
                    value={newSja.planned_date}
                    onChange={(e) => setNewSja(p => ({ ...p, planned_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Ansvarlig</label>
                  <Select 
                    value={newSja.responsible_name}
                    onValueChange={(v) => setNewSja(p => ({ ...p, responsible_name: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg ansvarlig" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={`${emp.first_name} ${emp.last_name}`}>
                          {emp.first_name} {emp.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Risikonivå</label>
                  <Select 
                    value={newSja.risk_level}
                    onValueChange={(v: any) => setNewSja(p => ({ ...p, risk_level: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RISK_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>Avbryt</Button>
              <Button onClick={handleCreate} disabled={createSja.isPending}>
                {createSja.isPending ? "Oppretter..." : "Opprett og fortsett"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* SJA List */}
      {filteredList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">Ingen SJA-er funnet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? "Ingen treff på søket ditt" : "Opprett din første Sikker Jobb Analyse"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Opprett SJA
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map(sja => {
            const status = STATUS_CONFIG[sja.status];
            const riskLevel = RISK_LEVELS.find(r => r.value === sja.risk_level);
            const StatusIcon = status.icon;

            return (
              <Card 
                key={sja.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedSja(sja);
                  setShowWizard(true);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="mb-2 text-xs">
                        {sja.sja_number}
                      </Badge>
                      <CardTitle className="text-base truncate">{sja.title}</CardTitle>
                    </div>
                    <Badge className={cn("flex-shrink-0", status.color)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sja.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{sja.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    {sja.location && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {sja.location}
                      </span>
                    )}
                    {sja.planned_date && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(sja.planned_date), "d. MMM yyyy", { locale: nb })}
                      </span>
                    )}
                    {sja.responsible_name && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        {sja.responsible_name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge className={riskLevel?.color}>
                      Risiko: {riskLevel?.label}
                    </Badge>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSja(sja);
                          setShowWizard(true);
                        }}
                      >
                        {sja.status === "completed" ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Er du sikker på at du vil slette denne SJA-en?")) {
                            deleteSja.mutateAsync(sja.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
