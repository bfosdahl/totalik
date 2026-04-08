import { useState } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useKsModule2ChangeOrders, KsModule2ChangeOrder } from "@/hooks/useKsModule2ChangeOrders";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, FileText, Check, X, Trash2, Edit, Download, Search } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { SignaturePad } from "@/components/ks2/SignaturePad";
import { useIsMobile } from "@/hooks/use-mobile";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Utkast", variant: "secondary" },
  pending: { label: "Venter på godkjenning", variant: "outline" },
  approved: { label: "Godkjent", variant: "default" },
  rejected: { label: "Avvist", variant: "destructive" },
  completed: { label: "Fullført", variant: "default" },
};

export default function Ks2Endringsmeldinger() {
  const { projectId } = useParams<{ projectId: string }>();
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const { projects } = useKsModule2Projects();
  const project = projects.find((p) => p.id === projectId);

  const {
    changeOrders,
    isLoading,
    createChangeOrder,
    updateChangeOrder,
    deleteChangeOrder,
    approveChangeOrder,
    isCreating,
  } = useKsModule2ChangeOrders(projectId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<KsModule2ChangeOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reason: "",
    requested_by: "",
    estimated_hours: "",
    hourly_rate: "",
    material_cost: "",
    internal_notes: "",
  });

  // Approval state
  const [approvalName, setApprovalName] = useState("");
  const [approvalSignature, setApprovalSignature] = useState("");

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      reason: "",
      requested_by: "",
      estimated_hours: "",
      hourly_rate: "",
      material_cost: "",
      internal_notes: "",
    });
  };

  const handleCreate = () => {
    if (!projectId || !profile?.company_id) return;

    const hoursRaw = parseFloat(formData.estimated_hours);
    const rateRaw = parseFloat(formData.hourly_rate);
    const materialsRaw = parseFloat(formData.material_cost);

    if (formData.estimated_hours && isNaN(hoursRaw)) {
      toast.error("Ugyldig verdi for estimerte timer");
      return;
    }
    if (formData.hourly_rate && isNaN(rateRaw)) {
      toast.error("Ugyldig verdi for timepris");
      return;
    }
    if (formData.material_cost && isNaN(materialsRaw)) {
      toast.error("Ugyldig verdi for materialkostnad");
      return;
    }

    const hours = hoursRaw || 0;
    const rate = rateRaw || 0;
    const materials = materialsRaw || 0;
    const totalCost = hours * rate + materials;

    createChangeOrder({
      project_id: projectId,
      company_id: profile.company_id,
      title: formData.title,
      description: formData.description || null,
      reason: formData.reason || null,
      requested_by: formData.requested_by || null,
      estimated_hours: hours || null,
      hourly_rate: rate || null,
      material_cost: materials || null,
      total_cost: totalCost || null,
      status: "draft",
      internal_notes: formData.internal_notes || null,
      created_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
    });

    setIsCreateOpen(false);
    resetForm();
  };

  const handleSendForApproval = (order: KsModule2ChangeOrder) => {
    updateChangeOrder({ id: order.id, status: "pending" });
  };

  const handleApprove = () => {
    if (!selectedOrder) return;
    approveChangeOrder({
      id: selectedOrder.id,
      approvedBy: approvalName,
      signature: approvalSignature,
    });
    setIsApproveOpen(false);
    setSelectedOrder(null);
    setApprovalName("");
    setApprovalSignature("");
  };

  const handleReject = (order: KsModule2ChangeOrder) => {
    updateChangeOrder({ id: order.id, status: "rejected" });
  };

  const filteredOrders = changeOrders.filter((order) => {
    const matchesSearch =
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.change_order_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalApproved = changeOrders
    .filter((o) => o.customer_approved)
    .reduce((sum, o) => sum + (o.total_cost || 0), 0);

  const totalPending = changeOrders
    .filter((o) => o.status === "pending")
    .reduce((sum, o) => sum + (o.total_cost || 0), 0);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Endringsmeldinger</h1>
          <p className="text-muted-foreground text-sm">
            {project?.project_name || "Prosjekt"}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny endringsmelding
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ny endringsmelding</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Tittel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="F.eks. Ekstra stikkontakter i kjøkken"
                />
              </div>
              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detaljert beskrivelse av endringen..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="reason">Årsak til endring</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="F.eks. Kundens ønske"
                />
              </div>
              <div>
                <Label htmlFor="requested_by">Bestilt av</Label>
                <Input
                  id="requested_by"
                  value={formData.requested_by}
                  onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                  placeholder="Navn på bestiller"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated_hours">Timer</Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    step="0.5"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Timepris (kr)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="material_cost">Materialkostnad (kr)</Label>
                <Input
                  id="material_cost"
                  type="number"
                  value={formData.material_cost}
                  onChange={(e) => setFormData({ ...formData, material_cost: e.target.value })}
                  placeholder="0"
                />
              </div>
              {(formData.estimated_hours || formData.hourly_rate || formData.material_cost) && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Estimert totalkostnad:</p>
                  <p className="text-lg font-semibold">
                    {(
                      (parseFloat(formData.estimated_hours) || 0) *
                        (parseFloat(formData.hourly_rate) || 0) +
                      (parseFloat(formData.material_cost) || 0)
                    ).toLocaleString("nb-NO")}{" "}
                    kr
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="internal_notes">Interne notater</Label>
                <Textarea
                  id="internal_notes"
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  placeholder="Notater som kun er synlige for bedriften..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreate} disabled={!formData.title || isCreating}>
                {isCreating ? "Oppretter..." : "Opprett"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Totalt</p>
            <p className="text-2xl font-bold">{changeOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Venter godkjenning</p>
            <p className="text-2xl font-bold text-amber-600">
              {changeOrders.filter((o) => o.status === "pending").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Godkjent sum</p>
            <p className="text-2xl font-bold text-green-600">
              {totalApproved.toLocaleString("nb-NO")} kr
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ventende sum</p>
            <p className="text-2xl font-bold text-amber-600">
              {totalPending.toLocaleString("nb-NO")} kr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk på tittel eller nummer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Alle statuser" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statuser</SelectItem>
            <SelectItem value="draft">Utkast</SelectItem>
            <SelectItem value="pending">Venter på godkjenning</SelectItem>
            <SelectItem value="approved">Godkjent</SelectItem>
            <SelectItem value="rejected">Avvist</SelectItem>
            <SelectItem value="completed">Fullført</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen endringsmeldinger</h3>
            <p className="text-muted-foreground mb-4">
              Opprett en ny endringsmelding for å registrere tilleggsarbeid.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ny endringsmelding
            </Button>
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {order.change_order_number}
                    </p>
                    <h3 className="font-medium">{order.title}</h3>
                  </div>
                  <Badge variant={STATUS_CONFIG[order.status]?.variant || "secondary"}>
                    {STATUS_CONFIG[order.status]?.label || order.status}
                  </Badge>
                </div>
                {order.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {order.description}
                  </p>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {order.requested_date
                      ? format(new Date(order.requested_date), "d. MMM yyyy", { locale: nb })
                      : "-"}
                  </span>
                  <span className="font-semibold">
                    {order.total_cost?.toLocaleString("nb-NO") || 0} kr
                  </span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  {order.status === "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleSendForApproval(order)}
                    >
                      Send til godkjenning
                    </Button>
                  )}
                  {order.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsApproveOpen(true);
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Godkjenn
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(order)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteChangeOrder(order.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nr.</TableHead>
                <TableHead>Tittel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bestilt av</TableHead>
                <TableHead>Dato</TableHead>
                <TableHead className="text-right">Beløp</TableHead>
                <TableHead className="text-right">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.change_order_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.title}</p>
                      {order.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {order.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_CONFIG[order.status]?.variant || "secondary"}>
                      {STATUS_CONFIG[order.status]?.label || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.requested_by || "-"}</TableCell>
                  <TableCell>
                    {order.requested_date
                      ? format(new Date(order.requested_date), "d. MMM yyyy", { locale: nb })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {order.total_cost?.toLocaleString("nb-NO") || 0} kr
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {order.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendForApproval(order)}
                        >
                          Send til godkjenning
                        </Button>
                      )}
                      {order.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsApproveOpen(true);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(order)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteChangeOrder(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kundegodkjenning</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-mono text-sm text-muted-foreground">
                  {selectedOrder.change_order_number}
                </p>
                <p className="font-medium">{selectedOrder.title}</p>
                <p className="text-lg font-bold mt-2">
                  {selectedOrder.total_cost?.toLocaleString("nb-NO") || 0} kr
                </p>
              </div>
              <div>
                <Label htmlFor="approvalName">Godkjent av (kundens navn) *</Label>
                <Input
                  id="approvalName"
                  value={approvalName}
                  onChange={(e) => setApprovalName(e.target.value)}
                  placeholder="Ola Nordmann"
                />
              </div>
              <div>
                <Label>Kundens signatur</Label>
                <SignaturePad
                  onSave={setApprovalSignature}
                  existingSignature={approvalSignature}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleApprove} disabled={!approvalName}>
              <Check className="h-4 w-4 mr-2" />
              Godkjenn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
