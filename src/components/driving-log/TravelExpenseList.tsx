import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Send, Trash2, Check, X, Download, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { TravelExpenseReport } from "@/hooks/useTravelExpenseReports";
import { generateTravelExpensePDF } from "@/utils/travelExpensePdf";
import { useAuth } from "@/contexts/AuthContext";

const statusLabels: Record<string, string> = {
  draft: "Utkast",
  submitted: "Sendt",
  approved: "Godkjent",
  rejected: "Avvist",
};

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  submitted: "secondary",
  approved: "default",
  rejected: "destructive",
};

interface TravelExpenseListProps {
  reports: TravelExpenseReport[];
  isLoading: boolean;
  onSubmit: (reportId: string) => void;
  onApprove: (reportId: string) => void;
  onReject: (data: { reportId: string; reason: string }) => void;
  onDelete: (reportId: string) => void;
  isAdmin: boolean;
}

export function TravelExpenseList({
  reports, isLoading, onSubmit, onApprove, onReject, onDelete, isAdmin,
}: TravelExpenseListProps) {
  const { profile } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewReport, setViewReport] = useState<TravelExpenseReport | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Laster reiseregninger...
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return null;
  }

  const handleDownloadPdf = (report: TravelExpenseReport) => {
    const userName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Ansatt";
    generateTravelExpensePDF(report, userName);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            Reiseregninger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr</TableHead>
                  <TableHead>Formål</TableHead>
                  <TableHead>Reisemål</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Beløp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell className="font-mono text-xs">{report.report_number}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{report.purpose}</TableCell>
                    <TableCell>{report.destination}</TableCell>
                    <TableCell className="text-xs">
                      {format(parseISO(report.departure_date), "dd.MM.yy")} – {format(parseISO(report.return_date), "dd.MM.yy")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(report.total_amount).toLocaleString("nb-NO", { minimumFractionDigits: 2 })} kr
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[report.status] || "outline"}>
                        {statusLabels[report.status] || report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewReport(report)} title="Se detaljer">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadPdf(report)} title="Last ned PDF">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        {report.status === "draft" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSubmit(report.id)} title="Send til godkjenning">
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(report.id)} title="Slett">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {report.status === "submitted" && isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => onApprove(report.id)} title="Godkjenn">
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setRejectId(report.id); setRejectReason(""); }} title="Avvis">
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View report details */}
      <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reiseregning {viewReport?.report_number}</DialogTitle>
            <DialogDescription>{viewReport?.purpose}</DialogDescription>
          </DialogHeader>
          {viewReport && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Reisemål:</span> {viewReport.destination}</div>
                <div><span className="text-muted-foreground">Avreisested:</span> {viewReport.departure_location}</div>
                <div><span className="text-muted-foreground">Avreise:</span> {format(parseISO(viewReport.departure_date), "dd.MM.yyyy")}</div>
                <div><span className="text-muted-foreground">Retur:</span> {format(parseISO(viewReport.return_date), "dd.MM.yyyy")}</div>
              </div>
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between"><span>Kjøregodtgjørelse ({viewReport.total_km} km)</span><span>{Number(viewReport.mileage_amount).toFixed(2)} kr</span></div>
                {Number(viewReport.passenger_supplement) > 0 && (
                  <div className="flex justify-between"><span>Passasjertillegg</span><span>{Number(viewReport.passenger_supplement).toFixed(2)} kr</span></div>
                )}
                {Number(viewReport.diet_amount) > 0 && (
                  <div className="flex justify-between"><span>Diett ({viewReport.diet_days} dager)</span><span>{Number(viewReport.diet_amount).toFixed(2)} kr</span></div>
                )}
                {Number(viewReport.accommodation_amount) > 0 && (
                  <div className="flex justify-between"><span>Overnatting ({viewReport.accommodation_days} netter)</span><span>{Number(viewReport.accommodation_amount).toFixed(2)} kr</span></div>
                )}
                {Number(viewReport.other_expenses_total) > 0 && (
                  <div className="flex justify-between"><span>Andre utlegg</span><span>{Number(viewReport.other_expenses_total).toFixed(2)} kr</span></div>
                )}
                <div className="flex justify-between font-bold border-t pt-2 text-base">
                  <span>Totalt</span>
                  <span className="text-primary">{Number(viewReport.total_amount).toFixed(2)} kr</span>
                </div>
              </div>
              {viewReport.rejection_reason && (
                <div className="bg-destructive/10 text-destructive rounded p-3 text-sm">
                  <strong>Avvisningsgrunn:</strong> {viewReport.rejection_reason}
                </div>
              )}
              {viewReport.approved_by_name && (
                <div className="text-muted-foreground text-xs">
                  Godkjent av {viewReport.approved_by_name} {viewReport.approved_at && format(parseISO(viewReport.approved_at), "dd.MM.yyyy HH:mm")}
                </div>
              )}
              {viewReport.notes && (
                <div className="text-muted-foreground"><strong>Merknad:</strong> {viewReport.notes}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett reiseregning</AlertDialogTitle>
            <AlertDialogDescription>Er du sikker på at du vil slette denne reiseregningen?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { if (deleteId) onDelete(deleteId); setDeleteId(null); }}>
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avvis reiseregning</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Grunn for avvisning *</Label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Skriv grunn for avvisning..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Avbryt</Button>
            <Button variant="destructive" onClick={() => { if (rejectId && rejectReason) { onReject({ reportId: rejectId, reason: rejectReason }); setRejectId(null); } }} disabled={!rejectReason}>
              Avvis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
