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
import { t } from "@/i18n/t";

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
        toast.error(t("auto.ingen_gyldige_rader_funnet_i_filen"));
        return;
      }
      setRows(parsed);
      setFileName(file.name);
      setStep("preview");
    } catch {
      toast.error(t("auto.kunne_ikke_lese_excel_filen_sjekk_at_for"));
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
            {t("auto.importer_kjoerebok_fra_excel")}
          </DialogTitle>
          <DialogDescription>
            {t("auto.last_opp_en_excel_fil_med_kjoerebokdata_")}
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
              {t("auto.velg_fil")}
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
                    <TableHead>{t("auto.dato")}</TableHead>
                    <TableHead>{t("auto.type")}</TableHead>
                    <TableHead>{t("auto.formaal")}</TableHead>
                    <TableHead>{t("auto.fra_til_3")}</TableHead>
                    <TableHead className="text-right">{t("auto.km")}</TableHead>
                    <TableHead>{t("auto.bil")}</TableHead>
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
              <span>{t("auto.sjekk_at_dataene_ser_riktige_ut_foer_du_")}</span>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setStep("upload"); setRows([]); }}>
                {t("auto.velg_annen_fil")}
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
            <p className="text-lg font-medium">{t("auto.import_fullfoert_2")}</p>
            <p className="text-sm text-muted-foreground">{rows.length} turer ble importert til kjøreboken.</p>
            <Button onClick={() => handleClose(false)}>{t("auto.lukk")}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
