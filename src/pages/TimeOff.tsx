import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimeOffRequests } from "@/hooks/useTimeOffRequests";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Check, X, Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function TimeOff() {
  const { profile, isCompanyAdmin, isSystemAdmin } = useAuth();
  const { requests, isLoading, createRequest, approveRequest, rejectRequest } = useTimeOffRequests();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    type: "ferie" as "ferie" | "sykdom" | "permisjon" | "annet",
    reason: "",
  });

  const isAdmin = isCompanyAdmin || isSystemAdmin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createRequest(formData);
    if (success) {
      setIsDialogOpen(false);
      setFormData({ start_date: "", end_date: "", type: "ferie", reason: "" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Godkjent</Badge>;
      case "rejected":
        return <Badge variant="destructive">Avslått</Badge>;
      default:
        return <Badge variant="secondary">Venter</Badge>;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "ferie": return "Ferie";
      case "sykdom": return "Sykdom";
      case "permisjon": return "Permisjon";
      case "annet": return "Annet";
      default: return type;
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const processedRequests = requests.filter(r => r.status !== "pending");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Laster ferieforespørsler...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feriplanlegger</h1>
          <p className="text-muted-foreground mt-1">
            Søk om ferie og se oversikt over ferieforespørsler
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Søk om ferie
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Ny ferieforespørsel</DialogTitle>
                <DialogDescription>
                  Fyll ut informasjon om ønsket friperiode
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Fra dato</Label>
                  <Input
                    id="start_date"
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Til dato</Label>
                  <Input
                    id="end_date"
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ferie">Ferie</SelectItem>
                      <SelectItem value="sykdom">Sykdom</SelectItem>
                      <SelectItem value="permisjon">Permisjon</SelectItem>
                      <SelectItem value="annet">Annet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Begrunnelse (valgfri)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Skriv eventuell begrunnelse..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button type="submit">Send forespørsel</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Venter på godkjenning</CardTitle>
            <CardDescription>
              {pendingRequests.length} forespørs{pendingRequests.length === 1 ? "el" : "ler"} venter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{request.employee_name}</span>
                      <Badge variant="outline">{getTypeName(request.type)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.start_date), "d. MMM yyyy", { locale: nb })} -{" "}
                      {format(new Date(request.end_date), "d. MMM yyyy", { locale: nb })}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    {isAdmin && request.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveRequest(request.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Godkjenn
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectRequest(request.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Avslå
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tidligere forespørsler</CardTitle>
          <CardDescription>
            Godkjente og avslåtte ferieforespørsler
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Ingen tidligere forespørsler
            </div>
          ) : (
            <div className="space-y-4">
              {processedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{request.employee_name}</span>
                      <Badge variant="outline">{getTypeName(request.type)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.start_date), "d. MMM yyyy", { locale: nb })} -{" "}
                      {format(new Date(request.end_date), "d. MMM yyyy", { locale: nb })}
                    </p>
                    {request.approved_by_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.status === "approved" ? "Godkjent" : "Avslått"} av {request.approved_by_name}
                      </p>
                    )}
                  </div>
                  <div>{getStatusBadge(request.status)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
