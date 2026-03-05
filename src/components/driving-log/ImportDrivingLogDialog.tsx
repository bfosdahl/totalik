import React, { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { parseExcelFile, importedRowToInput, ImportedRow } from "@/utils/drivingLogImport";
import { CreateDrivingLogInput } from "@/hooks/useDrivingLog";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const tripTypeLabels: Record<string, string> = {
  business: "Yrkeskjøring",
  commute: "Arbeidsreise",
  private: "Privat",
};

interface ImportDrivingLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (entries: CreateDrivingLogInput[]) => Promise<void>;
  isPending: boolean;
}

export function ImportDrivingLogDialog({ open, onOpenChange, onImport, isPending }: ImportDrivingLogDialogProps) {
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        toast.error("Ingen gyldige rader funnet i filen");
        return;
      }
      setRows(parsed);
      setFileName(file.name);
      setStep("preview");
    } catch {
      toast.error("Kunne ikke lese Excel-filen. Sjekk at formatet er riktig.");
    }
    // Reset input
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImport = async () => {
    const inputs = rows.map(importedRowToInput);
    await onImport(inputs);
    setStep("done");
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setRows([]);
      setFileName("");
      setStep("upload");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importer kjørebok fra Excel
          </DialogTitle>
          <DialogDescription>
            Last opp en Excel-fil med kjørebokdata. Filen bør ha samme format som den eksporterte kjøreboken.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Velg en Excel-fil (.xlsx) med kolonner som Dato, Formål, Turtype, Startsted, Sluttsted, Km.stand start, Km.stand slutt, osv.
            </p>
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
              <Upload className="w-4 h-4" />
              Velg fil
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        )}

        {step === "preview" && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span>{fileName}</span>
              <span>·</span>
              <span className="font-medium text-foreground">{rows.length} turer funnet</span>
            </div>

            <ScrollArea className="flex-1 max-h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dato</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Formål</TableHead>
                    <TableHead>Fra → Til</TableHead>
                    <TableHead className="text-right">Km</TableHead>
                    <TableHead>Bil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap">{row.trip_date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tripTypeLabels[row.trip_type] || row.trip_type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">{row.purpose || "—"}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {row.start_location} → {row.end_location || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.distance_km}</TableCell>
                      <TableCell className="text-sm">{row.vehicle_registration || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Sjekk at dataene ser riktige ut før du importerer. Duplikater blir ikke filtrert automatisk.</span>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setStep("upload"); setRows([]); }}>
                Velg annen fil
              </Button>
              <Button onClick={handleImport} disabled={isPending} className="gap-2">
                {isPending ? "Importerer..." : `Importer ${rows.length} turer`}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-medium">Import fullført!</p>
            <p className="text-sm text-muted-foreground">{rows.length} turer ble importert til kjøreboken.</p>
            <Button onClick={() => handleClose(false)}>Lukk</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
