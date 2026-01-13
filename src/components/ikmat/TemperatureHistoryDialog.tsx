import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIkMatTemperature, TemperatureLog } from "@/hooks/useIkMatTemperature";
import { History, Download, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { format, subDays } from "date-fns";
import { nb } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TemperatureHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemperatureHistoryDialog({
  open,
  onOpenChange,
}: TemperatureHistoryDialogProps) {
  const { company } = useAuth();
  const { fetchLogs, equipment } = useIkMatTemperature();
  
  const [logs, setLogs] = useState<TemperatureLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (open) {
      loadLogs();
    }
  }, [open, startDate, endDate]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLogs(startDate, endDate);
      setLogs(data);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (logs.length === 0) {
      toast.error("Ingen data å eksportere");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Title
    doc.setFontSize(18);
    doc.text("Temperaturlogg", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(company?.name || "Bedrift", pageWidth / 2, 28, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Periode: ${format(new Date(startDate), 'd. MMM yyyy', { locale: nb })} - ${format(new Date(endDate), 'd. MMM yyyy', { locale: nb })}`, pageWidth / 2, 35, { align: "center" });
    doc.text(`Generert: ${format(new Date(), 'd. MMM yyyy HH:mm', { locale: nb })}`, pageWidth / 2, 41, { align: "center" });

    // Summary
    const totalLogs = logs.length;
    const acceptableLogs = logs.filter(l => l.is_acceptable).length;
    const deviations = totalLogs - acceptableLogs;
    
    doc.setFontSize(11);
    doc.text(`Totalt ${totalLogs} målinger | ${acceptableLogs} OK | ${deviations} avvik`, 14, 52);

    // Table
    autoTable(doc, {
      startY: 58,
      head: [["Dato", "Tidspunkt", "Utstyr", "Temp.", "Status", "Registrert av", "Tiltak"]],
      body: logs.map(log => [
        format(new Date(log.measured_at), 'dd.MM.yyyy', { locale: nb }),
        format(new Date(log.measured_at), 'HH:mm', { locale: nb }),
        log.equipment?.name || 'Ukjent',
        `${log.temperature}°C`,
        log.is_acceptable ? 'OK' : 'AVVIK',
        log.measured_by_name,
        log.corrective_action || '-'
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        4: { 
          cellWidth: 15,
          fontStyle: 'bold'
        }
      },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.cell.raw === 'AVVIK') {
          data.cell.styles.textColor = [220, 53, 69];
        }
      }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Side ${i} av ${pageCount} | Dokument for Mattilsynet`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    const fileName = `Temperaturlogg-${company?.name?.replace(/\s+/g, '-') || 'bedrift'}-${startDate}-${endDate}.pdf`;
    doc.save(fileName);
    toast.success("PDF eksportert");
  };

  const getEquipmentName = (log: TemperatureLog) => {
    return log.equipment?.name || equipment.find(e => e.id === log.equipment_id)?.name || 'Ukjent';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Temperaturlogg historikk
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0">
          {/* Date filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Fra dato</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Til dato</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={loadLogs} disabled={isLoading}>
              {isLoading ? "Laster..." : "Oppdater"}
            </Button>
            <Button onClick={handleExportPDF} disabled={logs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Eksporter til PDF
            </Button>
          </div>

          {/* Summary */}
          {logs.length > 0 && (
            <div className="flex gap-4 text-sm">
              <span>Totalt: <strong>{logs.length}</strong> målinger</span>
              <span className="text-green-600">
                OK: <strong>{logs.filter(l => l.is_acceptable).length}</strong>
              </span>
              <span className="text-red-600">
                Avvik: <strong>{logs.filter(l => !l.is_acceptable).length}</strong>
              </span>
            </div>
          )}

          {/* Logs table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4" />
                <p>Ingen målinger funnet i valgt periode</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dato</TableHead>
                    <TableHead>Tidspunkt</TableHead>
                    <TableHead>Utstyr</TableHead>
                    <TableHead>Temperatur</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registrert av</TableHead>
                    <TableHead>Korrigerende tiltak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.measured_at), 'dd.MM.yyyy', { locale: nb })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.measured_at), 'HH:mm', { locale: nb })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getEquipmentName(log)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono ${log.is_acceptable ? '' : 'text-red-600 font-bold'}`}>
                          {log.temperature}°C
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.is_acceptable ? (
                          <Badge variant="success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Avvik
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{log.measured_by_name}</TableCell>
                      <TableCell className="max-w-[200px]">
                        {log.corrective_action || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
