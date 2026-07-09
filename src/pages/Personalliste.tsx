import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Clock, Users, UserPlus, Settings as SettingsIcon, Printer, RefreshCw, ShieldCheck, Coffee, LogOut, FileArchive } from "lucide-react";
import { ArbeidstilsynExport } from "@/components/personalliste/ArbeidstilsynExport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

/**
 * Personalliste
 * Dekker Skatteetatens krav (Bokføringsforskriften § 8-5-6) og Arbeidstilsynets
 * krav om oversikt over hvem som er på jobb, fnr, innkvartering, og pauser.
 */
export default function Personalliste() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const companyId = profile?.company_id;
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ─── Live: hvem er inne nå ───────────────────────────────────────────────
  const { data: activeEntries = [], refetch: refetchActive } = useQuery({
    queryKey: ["personalliste-active", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("time_clock_entries")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "active")
        .order("clock_in", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    refetchInterval: autoRefresh ? 15000 : false,
  });

  // ─── Bedriftsinnstillinger ───────────────────────────────────────────────
  const { data: company } = useQuery({
    queryKey: ["company-personalliste", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, personalliste_enabled, break_policy_paid, break_policy_default_minutes, break_policy_description")
        .eq("id", companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // ─── Ansatte + fnr + innkvartering ───────────────────────────────────────
  const { data: employees = [] } = useQuery({
    queryKey: ["personalliste-employees", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, accommodation_provided, accommodation_address")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("first_name");
      if (error) throw error;
      const ids = (profiles || []).map((p) => p.id);
      const { data: nids } = await supabase
        .from("profiles_national_id")
        .select("profile_id, id_type, national_id")
        .in("profile_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const nidMap = new Map((nids || []).map((n) => [n.profile_id, n]));
      return (profiles || []).map((p) => ({ ...p, national_id: nidMap.get(p.id) }));
    },
    enabled: !!companyId,
  });

  // ─── Endringslogg (audit) ────────────────────────────────────────────────
  const { data: auditEntries = [] } = useQuery({
    queryKey: ["personalliste-audit", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("audit_log")
        .select("id, table_name, action, changed_by, created_at, old_data, new_data")
        .eq("company_id", companyId)
        .in("table_name", ["time_clock_entries", "time_clock_breaks"])
        .neq("action", "INSERT")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Personalliste
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sanntid‑oversikt for Skatteetaten (Bokføringsforskriften § 8‑5‑6) og Arbeidstilsynet (AML § 10‑7)
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Skriv ut
        </Button>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="live"><Users className="mr-1 h-4 w-4" />Inne nå ({activeEntries.length})</TabsTrigger>
          <TabsTrigger value="guest"><UserPlus className="mr-1 h-4 w-4" />Innleid/vikar</TabsTrigger>
          <TabsTrigger value="employees">Ansatte</TabsTrigger>
          <TabsTrigger value="export"><FileArchive className="mr-1 h-4 w-4" />Arbeidstilsyn</TabsTrigger>
          <TabsTrigger value="audit">Endringslogg</TabsTrigger>
          <TabsTrigger value="settings"><SettingsIcon className="mr-1 h-4 w-4" />Innstillinger</TabsTrigger>
        </TabsList>

        {/* ─── LIVE ─────────────────────────────────────────────────────── */}
        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Personer i lokalet akkurat nå</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Denne skjermen kan vises til Skatteetaten ved uanmeldt kontroll
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto" className="text-xs">Auto‑oppdater</Label>
                <Switch id="auto" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                <Button variant="ghost" size="icon" onClick={() => refetchActive()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Ingen er stemplet inn akkurat nå</p>
              ) : (
                <div className="space-y-2">
                  {activeEntries.map((e: any) => {
                    const onBreak = e.break_start && !e.break_end;
                    return (
                      <div key={e.id} className={`border rounded-lg p-3 flex items-center justify-between gap-3 ${onBreak ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200" : "bg-green-50 dark:bg-green-950/30 border-green-200"}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{e.user_name || e.guest_name}</span>
                            {e.is_guest_worker && <Badge variant="secondary">Innleid</Badge>}
                            {e.guest_employer && <Badge variant="outline" className="text-xs">{e.guest_employer}</Badge>}
                            {onBreak && <Badge className="bg-amber-500"><Coffee className="mr-1 h-3 w-3" />På pause</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Inne siden {format(new Date(e.clock_in), "HH:mm", { locale: nb })} ·{" "}
                            {formatDistanceToNow(new Date(e.clock_in), { locale: nb, addSuffix: false })}
                            {e.total_break_minutes ? ` · ${e.total_break_minutes} min pause totalt` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4 border-t pt-3">
                Oppdatert: {format(new Date(), "HH:mm:ss", { locale: nb })}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── GUEST / INNLEID ──────────────────────────────────────────── */}
        <TabsContent value="guest">
          <GuestWorkerPanel companyId={companyId!} activeEntries={activeEntries} />
        </TabsContent>

        {/* ─── ANSATTE ──────────────────────────────────────────────────── */}
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Fødselsnummer og innkvartering</CardTitle>
              <p className="text-xs text-muted-foreground">
                Skatteetaten krever fnr/D‑nr på personalliste. Arbeidstilsynet spør etter adresse hvis arbeidsgiver stiller bolig.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {employees.map((emp: any) => (
                <EmployeeRow key={emp.id} employee={emp} companyId={companyId!} onSaved={() => qc.invalidateQueries({ queryKey: ["personalliste-employees"] })} />
              ))}
              {employees.length === 0 && (
                <p className="text-center text-muted-foreground py-6">Ingen aktive ansatte</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── AUDIT ────────────────────────────────────────────────────── */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Endringslogg for stemplinger</CardTitle>
              <p className="text-xs text-muted-foreground">
                Bokføringsforskriften krever at endringer i elektronisk personalliste logges (hvem, hva, når).
              </p>
            </CardHeader>
            <CardContent>
              {auditEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Ingen endringer registrert</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {auditEntries.map((a: any) => (
                    <div key={a.id} className="border rounded p-2 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs bg-muted px-1 rounded">{a.action}</span>{" "}
                        <span className="text-xs text-muted-foreground">{a.table_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(a.created_at), "dd.MM.yyyy HH:mm", { locale: nb })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── INNSTILLINGER ────────────────────────────────────────────── */}
        <TabsContent value="settings">
          <PersonallistaeSettingsCard companyId={companyId!} company={company} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════

function EmployeeRow({ employee, companyId, onSaved }: { employee: any; companyId: string; onSaved: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [nid, setNid] = useState(employee.national_id?.national_id ?? "");
  const [idType, setIdType] = useState(employee.national_id?.id_type ?? "fnr");
  const [accProvided, setAccProvided] = useState(!!employee.accommodation_provided);
  const [accAddress, setAccAddress] = useState(employee.accommodation_address ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const nidSchema = z.string().trim().min(6).max(20);
      if (nid) {
        const parsed = nidSchema.safeParse(nid);
        if (!parsed.success) {
          toast({ title: "Ugyldig ID", description: "Fnr/D‑nr må være 6–20 tegn", variant: "destructive" });
          setSaving(false);
          return;
        }
        const { error: nidErr } = await supabase
          .from("profiles_national_id")
          .upsert(
            { profile_id: employee.id, company_id: companyId, national_id: nid, id_type: idType },
            { onConflict: "profile_id" }
          );
        if (nidErr) throw nidErr;
      }
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ accommodation_provided: accProvided, accommodation_address: accProvided ? accAddress : null })
        .eq("id", employee.id);
      if (pErr) throw pErr;
      toast({ title: "Lagret" });
      setOpen(false);
      onSaved();
    } catch (e: any) {
      toast({ title: "Feil ved lagring", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full border rounded-lg p-3 flex items-center justify-between hover:bg-accent text-left"
      >
        <div>
          <div className="font-medium">{employee.first_name} {employee.last_name}</div>
          <div className="text-xs text-muted-foreground flex gap-3 mt-0.5">
            <span>Fnr/D‑nr: {employee.national_id ? "✓ registrert" : "Mangler"}</span>
            <span>Bolig: {employee.accommodation_provided ? "Ja" : "Nei"}</span>
          </div>
        </div>
        <Badge variant={employee.national_id ? "default" : "destructive"}>
          {employee.national_id ? "OK" : "Fyll ut"}
        </Badge>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{employee.first_name} {employee.last_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type ID</Label>
              <Select value={idType} onValueChange={setIdType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fnr">Fødselsnummer</SelectItem>
                  <SelectItem value="dnr">D‑nummer</SelectItem>
                  <SelectItem value="passport">Passnummer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nummer</Label>
              <Input value={nid} onChange={(e) => setNid(e.target.value)} placeholder="11 siffer for fnr/dnr" />
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <Label>Arbeidsgiver stiller bolig/innkvartering</Label>
                <Switch checked={accProvided} onCheckedChange={setAccProvided} />
              </div>
              {accProvided && (
                <div className="mt-3">
                  <Label>Adresse til boligen</Label>
                  <Textarea value={accAddress} onChange={(e) => setAccAddress(e.target.value)} rows={2} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Lagrer..." : "Lagre"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GuestWorkerPanel({ companyId, activeEntries }: { companyId: string; activeEntries: any[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nid, setNid] = useState("");
  const [employer, setEmployer] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  const guestActive = activeEntries.filter((e: any) => e.is_guest_worker);

  const clockInGuest = async () => {
    const schema = z.object({
      name: z.string().trim().min(2).max(100),
      employer: z.string().trim().min(1).max(100),
    });
    const parsed = schema.safeParse({ name, employer });
    if (!parsed.success) {
      toast({ title: "Fyll ut navn og arbeidsgiver", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("time_clock_entries").insert({
        company_id: companyId,
        is_guest_worker: true,
        guest_name: name,
        guest_national_id: nid || null,
        guest_employer: employer,
        guest_role: role || null,
        user_name: name,
        status: "active",
      } as any);
      if (error) throw error;
      toast({ title: "Innleid stemplet inn" });
      setOpen(false);
      setName(""); setNid(""); setEmployer(""); setRole("");
      qc.invalidateQueries({ queryKey: ["personalliste-active"] });
    } catch (e: any) {
      toast({ title: "Feil", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const clockOutGuest = async (id: string) => {
    const clockOut = new Date();
    const { data: entry } = await supabase.from("time_clock_entries").select("clock_in").eq("id", id).maybeSingle();
    const hours = entry ? (clockOut.getTime() - new Date(entry.clock_in).getTime()) / 3_600_000 : null;
    const { error } = await supabase
      .from("time_clock_entries")
      .update({ clock_out: clockOut.toISOString(), status: "completed", hours_worked: hours ? Math.round(hours * 100) / 100 : null } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Stemplet ut" });
      qc.invalidateQueries({ queryKey: ["personalliste-active"] });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Innleide / vikarer / ulønnede</CardTitle>
          <p className="text-xs text-muted-foreground">Personer som er på jobb hos dere uten å være ansatt her</p>
        </div>
        <Button onClick={() => setOpen(true)}><UserPlus className="mr-2 h-4 w-4" />Stemple inn</Button>
      </CardHeader>
      <CardContent>
        {guestActive.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">Ingen innleide er inne nå</p>
        ) : (
          <div className="space-y-2">
            {guestActive.map((e: any) => (
              <div key={e.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{e.guest_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.guest_employer} {e.guest_role ? `· ${e.guest_role}` : ""} · Inne siden {format(new Date(e.clock_in), "HH:mm")}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => clockOutGuest(e.id)}>
                  <LogOut className="mr-1 h-4 w-4" />Ut
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader><DialogTitle>Stemple inn innleid / vikar</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Navn *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Fnr / D‑nr</Label><Input value={nid} onChange={(e) => setNid(e.target.value)} /></div>
            <div><Label>Arbeidsgiver / vikarbyrå *</Label><Input value={employer} onChange={(e) => setEmployer(e.target.value)} /></div>
            <div><Label>Rolle / stilling</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Kokk, servitør, ..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
            <Button onClick={clockInGuest} disabled={saving}>{saving ? "..." : "Stemple inn"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PersonallistaeSettingsCard({ companyId, company }: { companyId: string; company: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [enabled, setEnabled] = useState(!!company?.personalliste_enabled);
  const [paid, setPaid] = useState(!!company?.break_policy_paid);
  const [minutes, setMinutes] = useState(company?.break_policy_default_minutes ?? 30);
  const [desc, setDesc] = useState(company?.break_policy_description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setEnabled(!!company.personalliste_enabled);
      setPaid(!!company.break_policy_paid);
      setMinutes(company.break_policy_default_minutes ?? 30);
      setDesc(company.break_policy_description ?? "");
    }
  }, [company]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({
        personalliste_enabled: enabled,
        break_policy_paid: paid,
        break_policy_default_minutes: minutes,
        break_policy_description: desc || null,
      })
      .eq("id", companyId);
    setSaving(false);
    if (error) {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lagret" });
      qc.invalidateQueries({ queryKey: ["company-personalliste"] });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalliste & pauseregler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <Label className="text-base">Aktiver personalliste (Skatteetaten)</Label>
            <p className="text-xs text-muted-foreground mt-1">
              For serveringssteder m.fl. som er pålagt å føre personalliste
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>Er pauser betalt?</Label>
            <Switch checked={paid} onCheckedChange={setPaid} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Arbeidstilsynet spør om dette.</p>
        </div>
        <div>
          <Label>Standard pauselengde (minutter)</Label>
          <Input type="number" min={0} max={240} value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value || "0"))} />
        </div>
        <div>
          <Label>Beskrivelse av pauserutine</Label>
          <Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="F.eks.: Ansatte tar pauser fortløpende ved lav trafikk, minimum 30 min ved skift over 5,5 t." />
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Lagrer..." : "Lagre innstillinger"}</Button>
      </CardContent>
    </Card>
  );
}
