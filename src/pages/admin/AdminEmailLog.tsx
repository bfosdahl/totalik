import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Mail, CheckCircle, Eye, MousePointerClick, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string | null;
  email_type: string;
  status: string;
  resend_email_id: string | null;
  sent_by: string | null;
  company_name: string | null;
  metadata: Record<string, unknown> | null;
  error_message: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Mail }> = {
  sent: { label: "Sendt", variant: "secondary", icon: Mail },
  delivered: { label: "Levert", variant: "default", icon: CheckCircle },
  opened: { label: "Åpnet", variant: "default", icon: Eye },
  clicked: { label: "Klikket", variant: "default", icon: MousePointerClick },
  bounced: { label: "Bounced", variant: "destructive", icon: AlertTriangle },
  failed: { label: "Feilet", variant: "destructive", icon: XCircle },
  complained: { label: "Klaget", variant: "destructive", icon: AlertTriangle },
  delayed: { label: "Forsinket", variant: "outline", icon: RefreshCw },
};

export default function AdminEmailLog() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["email-logs", search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (search) {
        query = query.or(
          `recipient_email.ilike.%${search}%,subject.ilike.%${search}%,recipient_name.ilike.%${search}%,company_name.ilike.%${search}%`
        );
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as EmailLog[];
    },
  });

  // Stats
  const stats = {
    total: logs.length,
    delivered: logs.filter((l) => ["delivered", "opened", "clicked"].includes(l.status)).length,
    opened: logs.filter((l) => ["opened", "clicked"].includes(l.status)).length,
    failed: logs.filter((l) => ["bounced", "failed", "complained"].includes(l.status)).length,
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status] || { label: status, variant: "outline" as const, icon: Mail };
    return (
      <Badge variant={config.variant} className="gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 lg:ml-[280px] p-4 sm:p-6 lg:p-8"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">E-postlogg</h1>
              <p className="text-muted-foreground">Oversikt over alle sendte e-poster og status</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Oppdater
            </Button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Totalt sendt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Levert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Åpnet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.opened}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Feilet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter e-post, emne, navn eller bedrift..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrer status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="sent">Sendt</SelectItem>
                <SelectItem value="delivered">Levert</SelectItem>
                <SelectItem value="opened">Åpnet</SelectItem>
                <SelectItem value="clicked">Klikket</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="failed">Feilet</SelectItem>
                <SelectItem value="complained">Klaget</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>Ingen e-poster funnet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mottaker</TableHead>
                      <TableHead className="hidden md:table-cell">Emne</TableHead>
                      <TableHead className="hidden lg:table-cell">Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Tidspunkt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedLog(log)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm truncate max-w-[200px]">
                              {log.recipient_name || log.recipient_email}
                            </p>
                            {log.recipient_name && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {log.recipient_email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm truncate max-w-[250px] block">{log.subject || "–"}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">{log.email_type}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={log.status} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(log.created_at), "dd.MM.yy HH:mm", { locale: nb })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>E-postdetaljer</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Mottaker</p>
                    <p className="font-medium">{selectedLog.recipient_name || "–"}</p>
                    <p>{selectedLog.recipient_email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <StatusBadge status={selectedLog.status} />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Emne</p>
                    <p className="font-medium">{selectedLog.subject || "–"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p>{selectedLog.email_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sendt av</p>
                    <p>{selectedLog.sent_by || "–"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bedrift</p>
                    <p>{selectedLog.company_name || "–"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sendt</p>
                    <p>{format(new Date(selectedLog.created_at), "dd.MM.yyyy HH:mm:ss", { locale: nb })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Resend ID</p>
                    <p className="text-xs font-mono break-all">{selectedLog.resend_email_id || "–"}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Tidslinje</p>
                  <div className="space-y-2 text-sm">
                    <TimelineItem label="Sendt" time={selectedLog.created_at} />
                    <TimelineItem label="Levert" time={selectedLog.delivered_at} />
                    <TimelineItem label="Åpnet" time={selectedLog.opened_at} />
                    <TimelineItem label="Klikket" time={selectedLog.clicked_at} />
                    {selectedLog.bounced_at && <TimelineItem label="Bounced" time={selectedLog.bounced_at} error />}
                  </div>
                </div>

                {selectedLog.error_message && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-destructive mb-1">Feilmelding</p>
                    <p className="text-sm bg-destructive/10 p-3 rounded-md">{selectedLog.error_message}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.main>
    </div>
  );
}

function TimelineItem({ label, time, error }: { label: string; time: string | null; error?: boolean }) {
  if (!time) return null;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${error ? "bg-destructive" : "bg-primary"}`} />
      <span className="text-muted-foreground w-16">{label}</span>
      <span>{format(new Date(time), "dd.MM.yy HH:mm:ss", { locale: nb })}</span>
    </div>
  );
}
