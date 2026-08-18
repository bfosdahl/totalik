import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Search, ShieldOff, CalendarClock } from "lucide-react";
import { getLocalDateString } from "@/lib/dateUtils";

interface CompanyRow {
  id: string;
  name: string;
  org_number: string | null;
  status: "active" | "inactive" | "suspended" | null;
  license_months: number | null;
  license_start_date: string | null;
  license_months_manual: boolean | null;
  scheduled_termination_date: string | null;
  termination_warning_sent_at: string | null;
  terminated_at: string | null;
  termination_source: string | null;
  termination_order_id: string | null;
}

interface StatusRow {
  statusId: number;
  statusName?: string;
  count: number;
  examples: string[];
}


function formatNo(date?: string | null) {
  if (!date) return "-";
  const [y, m, d] = date.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export default function AdminLicenses() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [statusIds, setStatusIds] = useState("");
  const [statusNames, setStatusNames] = useState("");
  const [statuses, setStatuses] = useState<StatusRow[]>([]);

  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<Record<string, unknown>[]>([]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: comps }, { data: setting }] = await Promise.all([
      supabase
        .from("companies")
        .select(
          "id, name, org_number, status, license_months, license_start_date, license_months_manual, scheduled_termination_date, termination_warning_sent_at, terminated_at, termination_source, termination_order_id",
        )
        .or("scheduled_termination_date.not.is.null,terminated_at.not.is.null")
        .order("scheduled_termination_date", { ascending: true }),
      supabase.from("system_settings").select("value").eq("key", "nextcom_termination_status_ids").maybeSingle(),
    ]);

    setCompanies((comps as CompanyRow[]) || []);
    const ids = ((setting?.value as { status_ids?: number[] } | null)?.status_ids || []) as number[];
    setStatusIds(ids.join(", "));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveStatusIds = async () => {
    const ids = statusIds
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);

    setBusy("save");
    const { error } = await supabase
      .from("system_settings")
      .update({ value: { status_ids: ids } })
      .eq("key", "nextcom_termination_status_ids");
    setBusy(null);

    if (error) {
      toast({ title: "Kunne ikke lagre", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Lagret", description: `Statuskoder: ${ids.join(", ") || "ingen"}` });
  };

  const callSync = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    const { data, error } = await supabase.functions.invoke("nextcom-license-sync", { body });
    setBusy(null);
    if (error) {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
      return null;
    }
    return data as Record<string, unknown>;
  };

  const scanStatuses = async () => {
    const data = await callSync({ mode: "scan_statuses" }, "scan");
    if (data?.statuses) setStatuses(data.statuses as StatusRow[]);
  };

  const lookupOrder = async () => {
    const data = await callSync({ mode: "lookup_order", query: lookupQuery }, "lookup");
    if (data?.matches) setLookupResults(data.matches as Record<string, unknown>[]);
  };

  const runSync = async (dryRun: boolean) => {
    const data = await callSync({ dry_run: dryRun }, dryRun ? "dry" : "sync");
    if (!data) return;
    toast({
      title: dryRun ? "Testkjøring fullført" : "Synk fullført",
      description: `${data.terminated_orders ?? 0} avsluttede ordre, ${data.scheduled ?? 0} planlagt stengt`,
    });
    if (!dryRun) loadData();
  };

  const runEnforcement = async (dryRun: boolean) => {
    setBusy(dryRun ? "enforce-dry" : "enforce");
    const { data, error } = await supabase.functions.invoke("enforce-license-terminations", {
      body: { dry_run: dryRun },
    });
    setBusy(null);
    if (error) {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
      return;
    }
    const res = data as Record<string, unknown>;
    toast({
      title: dryRun ? "Testkjøring fullført" : "Kjøring fullført",
      description: `${res.warnings_sent ?? 0} varsler, ${res.terminated ?? 0} stengt`,
    });
    if (!dryRun) loadData();
  };

  const updateCompany = async (id: string, patch: Partial<CompanyRow>) => {
    const { error } = await supabase.from("companies").update(patch).eq("id", id);
    if (error) {
      toast({ title: "Kunne ikke oppdatere", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Oppdatert" });
    loadData();
  };

  const today = getLocalDateString();

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold">Lisenser og oppsigelser</h1>
          <p className="text-muted-foreground text-sm">
            Ordre merket «avsluttet kundeforhold» i NextCom gir automatisk stenging ved lisensens utløp
            (opprettelsesdato + 12/24/36 mnd).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">NextCom-statuskode</CardTitle>
            <CardDescription>
              Legg inn statuskoden (statusId) som tilsvarer «avsluttet kundeforhold» (hvit). Flere koder skilles med komma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex-1">
                <Label htmlFor="statusIds">Statuskoder</Label>
                <Input id="statusIds" value={statusIds} onChange={(e) => setStatusIds(e.target.value)} placeholder="f.eks. 98" />
              </div>
              <Button onClick={saveStatusIds} disabled={busy === "save"}>
                {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lagre"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={scanStatuses} disabled={busy === "scan"}>
                {busy === "scan" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Vis statuskoder i bruk
              </Button>
            </div>

            {statuses.length > 0 && (
              <div className="space-y-2 text-sm">
                {statuses.map((s) => (
                  <div key={s.statusId} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">statusId {s.statusId}</Badge>
                      <span className="text-muted-foreground">{s.count} ordre</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-words">{s.examples.join(" · ")}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t space-y-2">
              <Label htmlFor="lookup">Finn statuskode via en bestemt ordre</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="lookup"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Bedriftsnavn, org.nr, e-post eller ordre-ID"
                />
                <Button variant="outline" onClick={lookupOrder} disabled={busy === "lookup" || !lookupQuery.trim()}>
                  {busy === "lookup" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {lookupResults.map((m, i) => (
                <div key={i} className="rounded-lg border p-3 text-sm">
                  <div className="font-medium break-words">{String(m.company)}</div>
                  <div className="text-xs text-muted-foreground break-words">
                    Ordre #{String(m.id)} · statusId <strong>{String(m.statusId)}</strong> · opprettet {formatNo(String(m.insertedDate))}
                  </div>
                  <div className="text-xs text-muted-foreground break-words">{String(m.products ?? "")}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kjør jobber manuelt</CardTitle>
            <CardDescription>Synk henter avsluttede ordre. Stengejobben varsler 14 dager før og stenger på dato.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => runSync(true)} disabled={busy === "dry"}>
              {busy === "dry" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Test synk
            </Button>
            <Button size="sm" onClick={() => runSync(false)} disabled={busy === "sync"}>
              {busy === "sync" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Kjør synk
            </Button>
            <Button variant="outline" size="sm" onClick={() => runEnforcement(true)} disabled={busy === "enforce-dry"}>
              {busy === "enforce-dry" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Test stenging
            </Button>
            <Button variant="destructive" size="sm" onClick={() => runEnforcement(false)} disabled={busy === "enforce"}>
              {busy === "enforce" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Kjør stenging
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="w-4 h-4" /> Planlagte stenginger
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : companies.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen bedrifter er markert for stenging.</p>
            ) : (
              <div className="space-y-3">
                {companies.map((c) => {
                  const isTerminated = !!c.terminated_at || c.status === "inactive";
                  const isDue = !isTerminated && !!c.scheduled_termination_date && c.scheduled_termination_date <= today;
                  return (
                    <div key={c.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium break-words">{c.name}</span>
                        {isTerminated ? (
                          <Badge variant="destructive">Stengt</Badge>
                        ) : isDue ? (
                          <Badge variant="destructive">Forfalt</Badge>
                        ) : (
                          <Badge variant="outline">Planlagt</Badge>
                        )}
                        {c.termination_warning_sent_at && <Badge variant="secondary">Varslet</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground break-words">
                        Org.nr {c.org_number || "-"} · lisensstart {formatNo(c.license_start_date)} ·{" "}
                        {c.license_months || "?"} mnd · stenges {formatNo(c.scheduled_termination_date)}
                        {c.termination_order_id ? ` · ordre #${c.termination_order_id}` : ""}
                      </div>
                      <div className="flex flex-wrap gap-2 items-end">
                        <div>
                          <Label className="text-xs">Lisenslengde (mnd)</Label>
                          <Input
                            className="h-8 w-24"
                            type="number"
                            defaultValue={c.license_months ?? ""}
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (val && val !== c.license_months) {
                                updateCompany(c.id, { license_months: val, license_months_manual: true });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Stengedato</Label>
                          <Input
                            className="h-8"
                            type="date"
                            defaultValue={c.scheduled_termination_date ?? ""}
                            onBlur={(e) => {
                              if (e.target.value && e.target.value !== c.scheduled_termination_date) {
                                updateCompany(c.id, { scheduled_termination_date: e.target.value });
                              }
                            }}
                          />
                        </div>
                        {isTerminated ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateCompany(c.id, {
                                status: "active",
                                terminated_at: null,
                                scheduled_termination_date: null,
                                termination_warning_sent_at: null,
                              })
                            }
                          >
                            Gjenåpne
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              updateCompany(c.id, {
                                scheduled_termination_date: null,
                                termination_warning_sent_at: null,
                                termination_source: "manual_cancel",
                              })
                            }
                          >
                            <ShieldOff className="w-4 h-4 mr-1" /> Avbryt stenging
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
