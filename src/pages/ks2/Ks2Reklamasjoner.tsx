import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, AlertCircle, CheckCircle2, Clock, Trash2, Edit, FileWarning, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useKsModule2Claims, Claim } from "@/hooks/useKsModule2Claims";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";

const CATEGORIES = [
  { value: "construction", label: "Byggteknisk" },
  { value: "electrical", label: "Elektrisk" },
  { value: "plumbing", label: "Rørlegger" },
  { value: "surface", label: "Overflate/maling" },
  { value: "doors_windows", label: "Dører/vinduer" },
  { value: "roofing", label: "Tak" },
  { value: "outdoor", label: "Utomhus" },
  { value: "other", label: "Annet" },
];

const PRIORITIES = [
  { value: "low", label: "Lav", color: "bg-muted text-muted-foreground" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "high", label: "Høy", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "critical", label: "Kritisk", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

const STATUSES = [
  { value: "open", label: "Åpen", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "in_progress", label: "Under arbeid", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "resolved", label: "Løst", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "rejected", label: "Avvist", color: "bg-muted text-muted-foreground" },
];

export default function Ks2Reklamasjoner() {
  const { projectId } = useParams<{ projectId: string }>();
  const { company, profile } = useAuth();
  const { claims, isLoading, createClaim, updateClaim, deleteClaim, resolveClaim } = useKsModule2Claims(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [resolvingClaim, setResolvingClaim] = useState<Claim | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
    priority: "medium",
    reported_by: "",
    reported_date: format(new Date(), "yyyy-MM-dd"),
    deadline: "",
    responsible_name: "",
    cost_estimate: "",
  });

  const [resolveData, setResolveData] = useState({
    resolution: "",
    actual_cost: "",
  });

  // Stats
  const stats = useMemo(() => {
    const open = claims.filter(c => c.status === "open").length;
    const inProgress = claims.filter(c => c.status === "in_progress").length;
    const resolved = claims.filter(c => c.status === "resolved").length;
    const totalCost = claims.reduce((acc, c) => acc + (c.actual_cost || 0), 0);
    return { open, inProgress, resolved, totalCost };
  }, [claims]);

  // Filter claims
  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      const matchesSearch = claim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.claim_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (claim.reported_by?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [claims, searchQuery, statusFilter]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "other",
      priority: "medium",
      reported_by: "",
      reported_date: format(new Date(), "yyyy-MM-dd"),
      deadline: "",
      responsible_name: "",
      cost_estimate: "",
    });
    setEditingClaim(null);
  };

  const handleOpenDialog = (claim?: Claim) => {
    if (claim) {
      setEditingClaim(claim);
      setFormData({
        title: claim.title,
        description: claim.description || "",
        category: claim.category,
        priority: claim.priority,
        reported_by: claim.reported_by || "",
        reported_date: claim.reported_date,
        deadline: claim.deadline || "",
        responsible_name: claim.responsible_name || "",
        cost_estimate: claim.cost_estimate?.toString() || "",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleOpenResolve = (claim: Claim) => {
    setResolvingClaim(claim);
    setResolveData({
      resolution: claim.resolution || "",
      actual_cost: claim.actual_cost?.toString() || claim.cost_estimate?.toString() || "",
    });
    setResolveDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!projectId || !company?.id) return;

    const payload = {
      project_id: projectId,
      company_id: company.id,
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      priority: formData.priority,
      status: editingClaim?.status || "open",
      reported_by: formData.reported_by || null,
      reported_date: formData.reported_date,
      deadline: formData.deadline || null,
      responsible_name: formData.responsible_name || null,
      responsible_id: null,
      resolution: editingClaim?.resolution || null,
      resolved_at: editingClaim?.resolved_at || null,
      cost_estimate: formData.cost_estimate ? parseFloat(formData.cost_estimate) : null,
      actual_cost: editingClaim?.actual_cost || null,
      photos: editingClaim?.photos || null,
    };

    if (editingClaim) {
      await updateClaim.mutateAsync({ id: editingClaim.id, ...payload });
    } else {
      await createClaim.mutateAsync(payload);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleResolve = async () => {
    if (!resolvingClaim) return;

    await resolveClaim.mutateAsync({
      id: resolvingClaim.id,
      resolution: resolveData.resolution,
      actual_cost: resolveData.actual_cost ? parseFloat(resolveData.actual_cost) : undefined,
    });

    setResolveDialogOpen(false);
    setResolvingClaim(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteClaim.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (claim: Claim, newStatus: string) => {
    await updateClaim.mutateAsync({ id: claim.id, status: newStatus });
  };

  const getPriorityBadge = (priority: string) => {
    const opt = PRIORITIES.find(p => p.value === priority);
    return opt ? <Badge className={opt.color}>{opt.label}</Badge> : null;
  };

  const getStatusBadge = (status: string) => {
    const opt = STATUSES.find(s => s.value === status);
    return opt ? <Badge className={opt.color}>{opt.label}</Badge> : null;
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reklamasjoner</h1>
          <p className="text-muted-foreground">Håndter reklamasjoner etter overlevering</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Ny reklamasjon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClaim ? "Rediger reklamasjon" : "Ny reklamasjon"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tittel *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Kort beskrivelse av reklamasjonen"
                />
              </div>
              <div>
                <Label>Beskrivelse</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detaljert beskrivelse..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioritet</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((pri) => (
                        <SelectItem key={pri.value} value={pri.value}>
                          {pri.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rapportert av</Label>
                  <Input
                    value={formData.reported_by}
                    onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                    placeholder="Kundens navn"
                  />
                </div>
                <div>
                  <Label>Rapportert dato</Label>
                  <Input
                    type="date"
                    value={formData.reported_date}
                    onChange={(e) => setFormData({ ...formData, reported_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Frist</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Estimert kostnad (kr)</Label>
                  <Input
                    type="number"
                    value={formData.cost_estimate}
                    onChange={(e) => setFormData({ ...formData, cost_estimate: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label>Ansvarlig</Label>
                <Input
                  value={formData.responsible_name}
                  onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
                  placeholder="Hvem skal utbedre"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.title || createClaim.isPending || updateClaim.isPending}
                >
                  {editingClaim ? "Lagre" : "Opprett"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-xs text-muted-foreground">Åpne</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">Under arbeid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-xs text-muted-foreground">Løst</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCost.toLocaleString("nb-NO")}</p>
                <p className="text-xs text-muted-foreground">Total kostnad (kr)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk i reklamasjoner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrer status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statuser</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Claims list */}
      {filteredClaims.length > 0 ? (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr</TableHead>
                  <TableHead>Tittel</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Prioritet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Frist</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-mono text-sm">{claim.claim_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{claim.title}</p>
                        {claim.reported_by && (
                          <p className="text-xs text-muted-foreground">Fra: {claim.reported_by}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryLabel(claim.category)}</TableCell>
                    <TableCell>{getPriorityBadge(claim.priority)}</TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      {claim.deadline ? format(parseISO(claim.deadline), "d. MMM yyyy", { locale: nb }) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {claim.status !== "resolved" && (
                          <>
                            <Select
                              value={claim.status}
                              onValueChange={(v) => handleStatusChange(claim, v)}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUSES.filter(s => s.value !== "resolved").map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" onClick={() => handleOpenResolve(claim)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(claim)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteId(claim.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredClaims.map((claim) => (
              <Card key={claim.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-mono text-muted-foreground">{claim.claim_number}</p>
                      <h3 className="font-medium">{claim.title}</h3>
                      {claim.reported_by && (
                        <p className="text-sm text-muted-foreground">Fra: {claim.reported_by}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getStatusBadge(claim.status)}
                      {getPriorityBadge(claim.priority)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{getCategoryLabel(claim.category)}</span>
                    {claim.deadline && (
                      <span className="text-muted-foreground">
                        Frist: {format(parseISO(claim.deadline), "d. MMM", { locale: nb })}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    {claim.status !== "resolved" && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenResolve(claim)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Lukk
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(claim)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(claim.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileWarning className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen reklamasjoner</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Ingen reklamasjoner matcher søket"
                : "Det er ikke registrert noen reklamasjoner ennå"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Registrer reklamasjon
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resolve dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lukk reklamasjon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Løsning / tiltak utført *</Label>
              <Textarea
                value={resolveData.resolution}
                onChange={(e) => setResolveData({ ...resolveData, resolution: e.target.value })}
                placeholder="Beskriv hva som ble gjort for å løse reklamasjonen..."
                rows={4}
              />
            </div>
            <div>
              <Label>Faktisk kostnad (kr)</Label>
              <Input
                type="number"
                value={resolveData.actual_cost}
                onChange={(e) => setResolveData({ ...resolveData, actual_cost: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
                Avbryt
              </Button>
              <Button
                onClick={handleResolve}
                disabled={!resolveData.resolution || resolveClaim.isPending}
              >
                Lukk reklamasjon
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett reklamasjon?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne reklamasjonen? Handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
