import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { CreditCard, Building2, User, Calendar, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface HmsRequest {
  id: string;
  employee_id: string;
  company_id: string;
  status: string;
  notes: string | null;
  requested_by_name: string;
  created_at: string;
  updated_at: string;
  employee: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  company: {
    name: string;
  } | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Venter", variant: "secondary", icon: Clock },
  in_progress: { label: "Under behandling", variant: "default", icon: Loader2 },
  completed: { label: "Fullført", variant: "outline", icon: CheckCircle },
  rejected: { label: "Avvist", variant: "destructive", icon: XCircle },
};

export default function AdminHmsRequests() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-hms-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hms_card_requests")
        .select(`
          *,
          employee:profiles!hms_card_requests_employee_id_fkey(first_name, last_name, email),
          company:companies!hms_card_requests_company_id_fkey(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as HmsRequest[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("hms_card_requests")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hms-requests"] });
      toast.success("Status oppdatert");
    },
    onError: () => {
      toast.error("Kunne ikke oppdatere status");
    },
  });

  const filteredRequests = statusFilter === "all" 
    ? requests 
    : requests.filter(r => r.status === statusFilter);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    inProgress: requests.filter(r => r.status === "in_progress").length,
    completed: requests.filter(r => r.status === "completed").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HMS-kort forespørsler</h1>
          <p className="text-muted-foreground">
            Behandle forespørsler om hjelp til HMS-kort bestilling
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Venter</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under behandling</CardTitle>
              <Loader2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fullført</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Alle forespørsler</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer på status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statuser</SelectItem>
                  <SelectItem value="pending">Venter</SelectItem>
                  <SelectItem value="in_progress">Under behandling</SelectItem>
                  <SelectItem value="completed">Fullført</SelectItem>
                  <SelectItem value="rejected">Avvist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Ingen forespørsler funnet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ansatt</TableHead>
                      <TableHead>Bedrift</TableHead>
                      <TableHead>Forespurt av</TableHead>
                      <TableHead>Dato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => {
                      const status = statusConfig[request.status] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      const employeeName = request.employee
                        ? `${request.employee.first_name || ""} ${request.employee.last_name || ""}`.trim() || "Ukjent"
                        : "Ukjent";

                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{employeeName}</div>
                                {request.employee?.email && (
                                  <div className="text-xs text-muted-foreground">
                                    {request.employee.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              {request.company?.name || "Ukjent"}
                            </div>
                          </TableCell>
                          <TableCell>{request.requested_by_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {format(new Date(request.created_at), "d. MMM yyyy", { locale: nb })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={request.status}
                              onValueChange={(value) =>
                                updateStatusMutation.mutate({ id: request.id, status: value })
                              }
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Venter</SelectItem>
                                <SelectItem value="in_progress">Under behandling</SelectItem>
                                <SelectItem value="completed">Fullført</SelectItem>
                                <SelectItem value="rejected">Avvist</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
