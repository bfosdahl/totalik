import { useState } from "react";
import { Plus, FileText, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useKsChangeOrders } from "@/hooks/useKsChangeOrders";
import { Skeleton } from "@/components/ui/skeleton";

interface KsChangeOrdersProps {
  projectId: string;
}

export function KsChangeOrders({ projectId }: KsChangeOrdersProps) {
  const { changeOrders, isLoading, createChangeOrder, updateChangeOrder } = useKsChangeOrders(projectId);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price_ex_vat: "",
    estimated_hours: "",
  });

  const handleCreate = async () => {
    if (!formData.title) return;

    const result = await createChangeOrder({
      project_id: projectId,
      title: formData.title,
      description: formData.description || null,
      price_ex_vat: formData.price_ex_vat ? parseFloat(formData.price_ex_vat) : null,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      customer_approved: false,
    });

    if (result) {
      setShowNewDialog(false);
      setFormData({ title: "", description: "", price_ex_vat: "", estimated_hours: "" });
    }
  };

  const handleApproval = async (id: string, approved: boolean) => {
    await updateChangeOrder(id, {
      customer_approved: approved,
      approved_at: approved ? new Date().toISOString() : null,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Endringsmeldinger</CardTitle>
            <CardDescription>{changeOrders.length} registrert for dette prosjektet</CardDescription>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ny endringsmelding
          </Button>
        </CardHeader>
        <CardContent>
          {changeOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Ingen endringsmeldinger registrert</p>
              <Button variant="outline" onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Opprett første endringsmelding
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {changeOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.title}</p>
                        {order.customer_approved ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Godkjent
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Venter godkjenning
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {order.price_ex_vat && <span>Pris: {order.price_ex_vat.toLocaleString("nb-NO")} kr</span>}
                        {order.estimated_hours && <span>{order.estimated_hours} timer</span>}
                        <span>{new Date(order.created_at).toLocaleDateString("nb-NO")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ny endringsmelding</DialogTitle>
            <DialogDescription>Registrer endring eller tillegg i prosjektet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tittel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="F.eks. Ekstra elektrisk tilkobling"
              />
            </div>
            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beskriv endringen..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Pris eks. mva (kr)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price_ex_vat}
                  onChange={(e) => setFormData({ ...formData, price_ex_vat: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="hours">Estimert timer</Label>
                <Input
                  id="hours"
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreate} disabled={!formData.title}>
              Opprett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedOrder?.title}</DialogTitle>
            <DialogDescription>Endringsmelding detaljer</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {selectedOrder.description && (
                <div>
                  <Label>Beskrivelse</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedOrder.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedOrder.price_ex_vat && (
                  <div>
                    <Label>Pris eks. mva</Label>
                    <p className="text-lg font-semibold">{selectedOrder.price_ex_vat.toLocaleString("nb-NO")} kr</p>
                  </div>
                )}
                {selectedOrder.estimated_hours && (
                  <div>
                    <Label>Estimert timer</Label>
                    <p className="text-lg font-semibold">{selectedOrder.estimated_hours} timer</p>
                  </div>
                )}
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-2">
                  {selectedOrder.customer_approved ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Godkjent av kunde {selectedOrder.approved_at && `- ${new Date(selectedOrder.approved_at).toLocaleDateString("nb-NO")}`}
                    </Badge>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={() => handleApproval(selectedOrder.id, true)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Marker som godkjent
                      </Button>
                      <Button variant="outline">Send til kunde</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}