import { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

import {
  type ImportedEmployee, parseEmployeeRows, validateEmployees, decodeCsvBytes, MISSING_EMAIL,
} from "@/utils/employeeImport";

type Row = ImportedEmployee;
const ADDED = "Lagt til";

export function BulkEmployeeImportDialog({
  open, onOpenChange, existingEmails, onDone,
}: { open: boolean; onOpenChange: (o: boolean) => void; existingEmails: string[]; onDone: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [sendNow, setSendNow] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => { setRows([]); setSendNow(false); };

  // Re-check e-post status for every row not yet imported (duplicates depend on the other rows).
  const revalidate = (rs: Row[]) => {
    const done = rs.filter((r) => r.status === ADDED);
    const checked = validateEmployees(rs.filter((r) => r.status !== ADDED), [...existingEmails, ...done.map((r) => r.email)]);
    let k = 0;
    return rs.map((r) => (r.status === ADDED ? r : checked[k++]));
  };

  const [parsing, setParsing] = useState(false);
  const handleFile = async (file: File) => {
    try {
      let parsed: Row[];
      if (file.name.toLowerCase().endsWith(".pdf")) {
        if (file.size > 10 * 1024 * 1024) { toast.error("PDF er for stor (maks 10 MB)"); return; }
        setParsing(true);
        const buf = new Uint8Array(await file.arrayBuffer());
        let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        const { data: res, error } = await supabase.functions.invoke("parse-employee-file", { body: { base64: btoa(bin) } });
        setParsing(false);
        if (error || res?.error) { toast.error(res?.error || "Kunne ikke lese PDF"); return; }
        const found: { firstName?: unknown; lastName?: unknown; email?: unknown; admin?: unknown }[] = res.employees || [];
        parsed = found
          .map((e) => ({
            firstName: String(e.firstName ?? "").trim(),
            lastName: String(e.lastName ?? "").trim(),
            email: String(e.email ?? "").trim().toLowerCase(),
            admin: e.admin === true,
          }))
          .filter((e: Row) => e.firstName || e.lastName || e.email);
      } else {
        const buf = await file.arrayBuffer();
        // CSV: decode ourselves (UTF-8 with/without BOM, else Windows-1252) and keep cells as text (no date conversion).
        const wb = file.name.toLowerCase().endsWith(".csv")
          ? XLSX.read(decodeCsvBytes(new Uint8Array(buf)), { type: "string", raw: true })
          : XLSX.read(buf, { type: "array" });
        const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "", raw: false });
        parsed = parseEmployeeRows(sheetRows);
      }
      if (!parsed.length) toast.error("Fant ingen ansatte i filen. Sjekk at den har en overskriftsrad med f.eks. Navn/Fornavn og E-post.");
      setRows(validateEmployees(parsed, existingEmails));
    } catch {
      setParsing(false);
      toast.error("Kunne ikke lese filen. Bruk Excel, CSV eller PDF.");
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["Fornavn", "Etternavn", "E-post", "Stilling", "Rolle"], ["Ola", "Nordmann", "ola@firma.no", "Tømrer", "Ansatt"]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ansatte");
    XLSX.writeFile(wb, "ansatte-mal.xlsx");
  };

  const update = (i: number, patch: Partial<Row>) =>
    setRows((rs) => revalidate(rs.map((r, j) => (j === i ? { ...r, ...patch } : r))));

  const remove = (i: number) => setRows((rs) => revalidate(rs.filter((_, j) => j !== i)));

  const valid = rows.filter((r) => !r.status);
  const missingEmail = rows.filter((r) => r.status === MISSING_EMAIL).length;

  const handleImport = async () => {
    setBusy(true);
    let ok = 0; let fail = 0;
    const next = [...rows];
    for (let i = 0; i < next.length; i++) {
      const r = next[i];
      if (r.status) continue;
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: r.email, firstName: r.firstName, lastName: r.lastName, role: r.admin ? "company_admin" : "user", sendEmail: sendNow },
      });
      if (error || data?.error) { fail++; next[i] = { ...r, status: data?.error || "Feilet" }; }
      else { ok++; next[i] = { ...r, status: ADDED }; }
      setRows([...next]);
    }
    setBusy(false);
    toast.success(`${ok} ansatte lagt til${sendNow ? " og invitert" : " (ikke invitert)"}${fail ? `, ${fail} feilet` : ""}`);
    onDone();
    if (!fail) { reset(); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Importer ansatte</DialogTitle>
          <DialogDescription>Last opp Excel, CSV eller PDF med navn og e-post (gjerne stilling). Overskriftsraden finnes automatisk, også under titler. Du ser listen før noe lagres.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              {parsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}{parsing ? "Leser PDF..." : "Velg fil"}
              <input type="file" accept=".xlsx,.xls,.csv,.pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
            </label>
          </Button>
          <Button variant="ghost" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" />Last ned Excel-mal</Button>
        </div>

        {rows.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{valid.length} av {rows.length} klare til import</p>
            {missingEmail > 0 && (
              <p className="text-sm text-destructive">
                {missingEmail} {missingEmail === 1 ? "ansatt mangler" : "ansatte mangler"} e-post. Fyll inn e-post for å importere, eller fjern raden.
              </p>
            )}
            <div className="border rounded-lg divide-y">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.5fr_auto_10rem] gap-2 p-2 items-center">
                  <Input value={r.firstName} placeholder="Fornavn" disabled={busy} onChange={(e) => update(i, { firstName: e.target.value })} />
                  <Input value={r.lastName} placeholder="Etternavn" disabled={busy} onChange={(e) => update(i, { lastName: e.target.value })} />
                  <Input value={r.email} placeholder="E-post" aria-invalid={r.status === MISSING_EMAIL || undefined} disabled={busy} onChange={(e) => update(i, { email: e.target.value.trim().toLowerCase() })} />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <Checkbox checked={r.admin} disabled={busy} onCheckedChange={(v) => update(i, { admin: v === true })} />Admin
                  </label>
                  <div className="flex items-center gap-1 min-w-0">
                    {r.status
                      ? <span className={`text-xs leading-tight ${r.status === ADDED ? "text-primary" : "text-destructive"}`}>{r.status}</span>
                      : r.title && <span className="text-xs text-muted-foreground truncate" title={r.title}>{r.title}</span>}
                    <Button size="icon" variant="ghost" className="ml-auto shrink-0" disabled={busy} aria-label="Fjern rad" onClick={() => remove(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg border p-3">
          <Checkbox id="bulk-send" checked={sendNow} onCheckedChange={(v) => setSendNow(v === true)} />
          <div>
            <Label htmlFor="bulk-send">Send brukerinfo på e-post nå</Label>
            <p className="text-xs text-muted-foreground">Står av: ansatte lagres som «Ikke invitert». Du kan sende invitasjon senere fra listen.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button disabled={busy || valid.length === 0} onClick={handleImport}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Importer {valid.length} ansatte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
