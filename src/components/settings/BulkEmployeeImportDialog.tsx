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

interface Row { email: string; firstName: string; lastName: string; admin: boolean; status?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");

function pick(obj: Record<string, unknown>, keys: string[]) {
  for (const [k, v] of Object.entries(obj)) if (keys.includes(norm(k))) return String(v ?? "").trim();
  return "";
}

export function BulkEmployeeImportDialog({
  open, onOpenChange, existingEmails, onDone,
}: { open: boolean; onOpenChange: (o: boolean) => void; existingEmails: string[]; onDone: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [sendNow, setSendNow] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => { setRows([]); setSendNow(false); };

  const handleFile = async (file: File) => {
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const existing = new Set(existingEmails.map((e) => e.toLowerCase()));
      const seen = new Set<string>();
      const parsed: Row[] = [];
      for (const r of data) {
        let email = pick(r, ["epost", "email", "mail", "epostadresse"]).toLowerCase();
        let firstName = pick(r, ["fornavn", "firstname", "first"]);
        let lastName = pick(r, ["etternavn", "lastname", "last"]);
        const full = pick(r, ["navn", "name", "fulltnavn"]);
        if (!firstName && full) { const p = full.split(/\s+/); firstName = p.shift() || ""; lastName = p.join(" "); }
        if (!email) {
          const found = Object.values(r).map(String).find((v) => EMAIL_RE.test(v.trim()));
          if (found) email = found.trim().toLowerCase();
        }
        if (!email && !firstName) continue;
        const role = norm(pick(r, ["rolle", "role"]));
        const row: Row = { email, firstName, lastName, admin: role.startsWith("admin") };
        if (!EMAIL_RE.test(email)) row.status = "Ugyldig e-post";
        else if (existing.has(email)) row.status = "Finnes allerede";
        else if (seen.has(email)) row.status = "Duplikat i filen";
        seen.add(email);
        parsed.push(row);
      }
      if (!parsed.length) toast.error("Fant ingen ansatte i filen");
      setRows(parsed);
    } catch {
      toast.error("Kunne ikke lese filen. Bruk Excel eller CSV.");
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["Fornavn", "Etternavn", "E-post", "Rolle"], ["Ola", "Nordmann", "ola@firma.no", "Ansatt"]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ansatte");
    XLSX.writeFile(wb, "ansatte-mal.xlsx");
  };

  const update = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch, status: patch.email !== undefined ? (EMAIL_RE.test(patch.email) ? undefined : "Ugyldig e-post") : r.status } : r)));

  const valid = rows.filter((r) => !r.status);

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
      else { ok++; next[i] = { ...r, status: "Lagt til" }; }
      setRows([...next]);
    }
    setBusy(false);
    toast.success(`${ok} ansatte lagt til${sendNow ? " og invitert" : " (ikke invitert)"}${fail ? `, ${fail} feilet` : ""}`);
    onDone();
    if (!fail) { reset(); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Importer ansatte</DialogTitle>
          <DialogDescription>Last opp Excel eller CSV med fornavn, etternavn og e-post. Du ser listen før noe lagres.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />Velg fil
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
            </label>
          </Button>
          <Button variant="ghost" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" />Last ned Excel-mal</Button>
        </div>

        {rows.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{valid.length} av {rows.length} klare til import</p>
            <div className="border rounded-lg divide-y">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.5fr_auto_auto] gap-2 p-2 items-center">
                  <Input value={r.firstName} placeholder="Fornavn" disabled={busy} onChange={(e) => update(i, { firstName: e.target.value })} />
                  <Input value={r.lastName} placeholder="Etternavn" disabled={busy} onChange={(e) => update(i, { lastName: e.target.value })} />
                  <Input value={r.email} placeholder="E-post" disabled={busy} onChange={(e) => update(i, { email: e.target.value.trim().toLowerCase() })} />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <Checkbox checked={r.admin} disabled={busy} onCheckedChange={(v) => update(i, { admin: v === true })} />Admin
                  </label>
                  <div className="flex items-center gap-1">
                    {r.status && <span className={`text-xs ${r.status === "Lagt til" ? "text-primary" : "text-destructive"}`}>{r.status}</span>}
                    <Button size="icon" variant="ghost" disabled={busy} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
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
