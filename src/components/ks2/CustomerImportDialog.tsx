import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { decodeCsvBytes } from "@/utils/employeeImport";
import {
  CUSTOMER_FIELDS, TEMPLATE_HEADERS, TEMPLATE_EXAMPLE, STATUS_NEW, STATUS_EXISTS, STATUS_DUPLICATE,
  suggestMapping, findCustomerHeaderRow, buildCustomers, countStatuses, chunk,
  type CustomerMapping, type ImportedCustomer,
} from "@/utils/customerImport";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  existing: { name: string; org_number: string | null }[];
}

const NONE = "none";

export function CustomerImportDialog({ open, onOpenChange, companyId, existing }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<unknown[][]>([]);
  const [headerIndex, setHeaderIndex] = useState(-1);
  const [mapping, setMapping] = useState<CustomerMapping>({});
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState<{ row: number; name: string; error: string }[]>([]);

  const reset = () => {
    setFileName(""); setRows([]); setHeaderIndex(-1); setMapping({}); setChecked(new Set());
    setProgress(0); setFailed([]);
  };

  const header = headerIndex >= 0 ? rows[headerIndex] || [] : [];
  const customers = useMemo(
    () => (headerIndex >= 0 && mapping.name !== undefined ? buildCustomers(rows, headerIndex, mapping, existing) : []),
    [rows, headerIndex, mapping, existing],
  );
  const counts = countStatuses(customers);

  const applyDefaultChecks = (list: ImportedCustomer[]) =>
    setChecked(new Set(list.filter((c) => c.status === STATUS_NEW).map((c) => c.rowNumber)));

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    reset();
    try {
      const isCsv = /\.csv$/i.test(file.name);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const wb = isCsv
        ? XLSX.read(decodeCsvBytes(bytes), { type: "string", raw: true })
        : XLSX.read(bytes, { type: "array" });
      const sheet = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "", raw: false });
      const h = findCustomerHeaderRow(sheet);
      if (h < 0) {
        toast.error("Fant ingen kolonne for kundenavn (f.eks. «Navn» eller «Kunde») i filen");
        return;
      }
      const m = suggestMapping(sheet[h], sheet.slice(h + 1, h + 11));
      setFileName(file.name);
      setRows(sheet);
      setHeaderIndex(h);
      setMapping(m);
      applyDefaultChecks(buildCustomers(sheet, h, m, existing));
    } catch {
      toast.error("Kunne ikke lese filen");
    }
  };

  const setField = (field: string, value: string) => {
    const next = { ...mapping };
    if (value === NONE) delete next[field as keyof CustomerMapping];
    else next[field as keyof CustomerMapping] = Number(value);
    // A separate Postnr/Sted choice replaces a combined column suggestion.
    if ((field === "postnr" || field === "sted") && next.postnr !== undefined && next.sted !== undefined) delete next.postnrSted;
    setMapping(next);
    if (next.name !== undefined) applyDefaultChecks(buildCustomers(rows, headerIndex, next, existing));
  };

  const toggle = (rowNumber: number, on: boolean) => {
    const s = new Set(checked);
    if (on) s.add(rowNumber); else s.delete(rowNumber);
    setChecked(s);
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]);
    // Keep postnr and org.nr as text so leading zeros survive.
    ["F2", "H2"].forEach((a) => { if (ws[a]) ws[a].t = "s"; });
    XLSX.utils.book_append_sheet(wb, ws, "Kunder");
    XLSX.writeFile(wb, "kunder-mal.xlsx");
  };

  const handleImport = async () => {
    const selected = customers.filter((c) => checked.has(c.rowNumber) && c.name);
    if (!selected.length) { toast.error("Ingen rader valgt"); return; }
    setSaving(true); setProgress(0); setFailed([]);
    const fails: { row: number; name: string; error: string }[] = [];
    let ok = 0;
    const batches = chunk(selected, 100);
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const payload = batch.map((c) => ({
        company_id: companyId,
        created_by: user?.id ?? null,
        name: c.name,
        contact_person: c.contact_person || null,
        email: c.email || null,
        phone: c.phone || null,
        address: c.address || null,
        org_number: c.org_number || null,
      }));
      const { error } = await supabase.from("company_customers").insert(payload);
      if (error) batch.forEach((c) => fails.push({ row: c.rowNumber, name: c.name, error: error.message }));
      else ok += batch.length;
      setProgress(Math.round(((i + 1) / batches.length) * 100));
    }
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ["company-customers", companyId] });
    const skipped = customers.length - ok;
    if (fails.length) {
      setFailed(fails);
      toast.warning(`${ok} kunder importert, ${skipped} hoppet over`);
      return;
    }
    toast.success(`${ok} kunder importert, ${skipped} hoppet over`);
    reset();
    onOpenChange(false);
  };

  const statusVariant = (s: string) =>
    s === STATUS_NEW ? "default" : s === STATUS_EXISTS ? "secondary" : s === STATUS_DUPLICATE ? "outline" : "destructive";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) { if (!o) reset(); onOpenChange(o); } }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Importer kunder</DialogTitle>
          <DialogDescription>Last opp en Excel- eller CSV-fil med kundene dine.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleFile(e.target.files?.[0])} disabled={saving} />
            <Button type="button" variant="link" className="gap-1 px-0" onClick={downloadTemplate}>
              <Download className="h-4 w-4" /> Last ned Excel-mal
            </Button>
          </div>
          {fileName && <p className="text-sm text-muted-foreground break-all">Fil: {fileName}</p>}

          {headerIndex >= 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CUSTOMER_FIELDS.map((f) => {
                const combined = (f.key === "postnr" || f.key === "sted") && mapping[f.key] === undefined && mapping.postnrSted !== undefined;
                return (
                  <div key={f.key} className="space-y-1 min-w-0">
                    <Label>{f.label}{f.required ? " *" : ""}</Label>
                    <Select value={mapping[f.key] !== undefined ? String(mapping[f.key]) : NONE} onValueChange={(v) => setField(f.key, v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {!f.required && <SelectItem value={NONE}>Ikke importer</SelectItem>}
                        {header.map((h, i) => (
                          <SelectItem key={i} value={String(i)}>{String(h || `Kolonne ${i + 1}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {combined && (
                      <p className="text-xs text-muted-foreground">Hentes fra «{String(header[mapping.postnrSted!] || `Kolonne ${mapping.postnrSted! + 1}`)}» (postnr + sted)</p>
                    )}
                  </div>
                );
              })}
              <div className="space-y-1 min-w-0 sm:col-span-2">
                <Label>Postnr + sted i samme kolonne</Label>
                <Select value={mapping.postnrSted !== undefined ? String(mapping.postnrSted) : NONE} onValueChange={(v) => setField("postnrSted", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Ikke importer</SelectItem>
                    {header.map((h, i) => (
                      <SelectItem key={i} value={String(i)}>{String(h || `Kolonne ${i + 1}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Bruk denne hvis postnummer og sted står i samme celle, f.eks. «0585 Oslo».</p>
              </div>
            </div>
          )}

          {headerIndex >= 0 && mapping.name === undefined && (
            <p className="text-sm text-destructive">Velg hvilken kolonne som er Navn.</p>
          )}

          {customers.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge>{counts.nye} nye</Badge>
                {counts.finnes > 0 && <Badge variant="secondary">{counts.finnes} finnes</Badge>}
                {counts.dubletter > 0 && <Badge variant="outline">{counts.dubletter} dubletter</Badge>}
                {counts.utenNavn > 0 && <Badge variant="destructive">{counts.utenNavn} uten navn</Badge>}
              </div>
              <div className="border rounded-md overflow-x-auto max-h-[40vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead>Status</TableHead>
                      <TableHead>Navn</TableHead>
                      <TableHead>Kontaktperson</TableHead>
                      <TableHead>E-post</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Org.nr</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((c) => (
                      <TableRow key={c.rowNumber}>
                        <TableCell>
                          <Checkbox
                            checked={checked.has(c.rowNumber)}
                            disabled={!c.name || saving}
                            onCheckedChange={(v) => toggle(c.rowNumber, v === true)}
                            aria-label={`Velg rad ${c.rowNumber}`}
                          />
                        </TableCell>
                        <TableCell><Badge variant={statusVariant(c.status)} className="whitespace-nowrap">{c.status}</Badge></TableCell>
                        <TableCell className="whitespace-nowrap">{c.name || "–"}</TableCell>
                        <TableCell className="whitespace-nowrap">{c.contact_person}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {c.emailInvalid ? (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="h-3 w-3" /> Ugyldig e-post, lagres tom
                            </span>
                          ) : c.email}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{c.phone}</TableCell>
                        <TableCell className="whitespace-nowrap">{c.address}</TableCell>
                        <TableCell className="whitespace-nowrap">{c.org_number}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {saving && (
            <div className="space-y-1">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">Importerer… {progress}%</p>
            </div>
          )}

          {failed.length > 0 && (
            <div className="rounded-md border border-destructive p-3 text-sm space-y-1">
              <p className="font-medium text-destructive">Disse radene ble ikke importert:</p>
              <ul className="list-disc pl-5 break-words">
                {failed.map((f) => <li key={f.row}>Rad {f.row}: {f.name} – {f.error}</li>)}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={saving}>Avbryt</Button>
          <Button onClick={handleImport} disabled={saving || checked.size === 0 || mapping.name === undefined}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Importer {checked.size} kunder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
