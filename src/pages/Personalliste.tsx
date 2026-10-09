import { useState, useEffect } from "react";
import { clockWorkedHours, ongoingBreakMinutes } from "@/utils/timeCalc";
import { format, formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Clock, Users, UserPlus, Settings as SettingsIcon, Printer, RefreshCw, ShieldCheck, Coffee, LogOut, FileArchive, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { t } from "@/i18n/t";

/**
 * Personalliste
 * Dekker Skatteetatens krav (Bokføringsforskriften § 8-5-6) og Arbeidstilsynets
 * krav om oversikt over hvem som er på jobb, fnr, innkvartering, og pauser.
 */
export default function Personalliste() {
  const navigate = useNavigate();
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
        .select("id, first_name, last_name, email")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("first_name");
      if (error) throw error;
      const ids = (profiles || []).map((p) => p.id);
      const [{ data: nids }, { data: sens }] = await Promise.all([
        supabase.from("profiles_national_id").select("profile_id, id_type, national_id")
          .in("profile_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        supabase.rpc("get_company_profiles_sensitive", { p_company_id: companyId }),
      ]);
      const nidMap = new Map((nids || []).map((n) => [n.profile_id, n]));
      const sensMap = new Map((sens || []).map((s: any) => [s.id, s]));
      return (profiles || []).map((p) => {
        const s: any = sensMap.get(p.id) || {};
        return { ...p, accommodation_provided: s.accommodation_provided ?? false, accommodation_address: s.accommodation_address ?? null, national_id: nidMap.get(p.id) };
      });
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
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> {t("auto.tilbake")}
      </Button>
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
          <TabsTrigger value="employees">{t("auto.ansatte")}</TabsTrigger>
          <TabsTrigger value="export"><FileArchive className="mr-1 h-4 w-4" />Arbeidstilsyn</TabsTrigger>
          <TabsTrigger value="audit">{t("auto.endringslogg")}</TabsTrigger>
          <TabsTrigger value="settings"><SettingsIcon className="mr-1 h-4 w-4" />Innstillinger</TabsTrigger>
        </TabsList>

        {/* ─── LIVE ─────────────────────────────────────────────────────── */}
        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("auto.personer_i_lokalet_akkurat_naa")}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("auto.denne_skjermen_kan_vises_til_skatteetate")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto" className="text-xs">{t("auto.auto_oppdater")}</Label>
                <Switch id="auto" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                <Button variant="ghost" size="icon" onClick={() => refetchActive()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t("auto.ingen_er_stemplet_inn_akkurat_naa")}</p>
              ) : (
                <div className="space-y-2">
                  {activeEntries.map((e: any) => {
                    const onBreak = e.break_start && !e.break_end;
                    return (
                      <div key={e.id} className={`border rounded-lg p-3 flex items-center justify-between gap-3 ${onBreak ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200" : "bg-green-50 dark:bg-green-950/30 border-green-200"}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{e.user_name || e.guest_name}</span>
                            {e.is_guest_worker && <Badge variant="secondary">{t("auto.innleid")}</Badge>}
                            {e.guest_employer && <Badge variant="outline" className="text-xs">{e.guest_employer}</Badge>}
                            {onBreak && <Badge className="bg-amber-500"><Coffee className="mr-1 h-3 w-3" />{t("auto.paa_pause")}</Badge>}
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
              <CardTitle>{t("auto.foedselsnummer_og_innkvartering")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("auto.skatteetaten_krever_fnr_d_nr_paa_persona")}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {employees.map((emp: any) => (
                <EmployeeRow key={emp.id} employee={emp} companyId={companyId!} onSaved={() => qc.invalidateQueries({ queryKey: ["personalliste-employees"] })} />
              ))}
              {employees.length === 0 && (
                <p className="text-center text-muted-foreground py-6">{t("auto.ingen_aktive_ansatte_2")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── AUDIT ────────────────────────────────────────────────────── */}
        {/* ─── ARBEIDSTILSYN EKSPORT ────────────────────────────────────── */}
        <TabsContent value="export">
          <ArbeidstilsynExport companyId={companyId!} companyName={company?.name || ""} />
        </TabsContent>

        {/* ─── AUDIT ────────────────────────────────────────────────────── */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>{t("auto.endringslogg_for_stemplinger")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Bokføringsforskriften krever at endringer i elektronisk personalliste logges (hvem, hva, når).
              </p>
            </CardHeader>
            <CardContent>
              {auditEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t("auto.ingen_endringer_registrert")}</p>
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
          toast({ title: "Ugyldig ID", description: t("auto.fnr_d_nr_maa_vaere_6_20_tegn"), variant: "destructive" });
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
              <Label>{t("auto.type_id")}</Label>
              <Select value={idType} onValueChange={setIdType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fnr">{t("auto.foedselsnummer")}</SelectItem>
                  <SelectItem value="dnr">{t("auto.d_nummer")}</SelectItem>
                  <SelectItem value="passport">{t("auto.passnummer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("auto.nummer")}</Label>
              <Input value={nid} onChange={(e) => setNid(e.target.value)} placeholder={t("auto.11_siffer_for_fnr_dnr")} />
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <Label>{t("auto.arbeidsgiver_stiller_bolig_innkvartering")}</Label>
                <Switch checked={accProvided} onCheckedChange={setAccProvided} />
              </div>
              {accProvided && (
                <div className="mt-3">
                  <Label>{t("auto.adresse_til_boligen")}</Label>
                  <Textarea value={accAddress} onChange={(e) => setAccAddress(e.target.value)} rows={2} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("auto.avbryt")}</Button>
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
      toast({ title: t("auto.feil"), description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const clockOutGuest = async (id: string) => {
    const clockOut = new Date();
    const { data: entry } = await supabase
      .from("time_clock_entries")
      .select("clock_in, break_start, break_end, total_break_minutes, break_paid")
      .eq("id", id)
      .maybeSingle();
    const running = entry ? ongoingBreakMinutes(entry.break_start, entry.break_end, clockOut) : 0;
    const closedBreak = !!entry?.break_start && !entry?.break_end;
    const totalBreak = (entry?.total_break_minutes || 0) + running;
    const hours = entry
      ? clockWorkedHours(entry.clock_in, clockOut.toISOString(), entry.break_paid === true ? 0 : totalBreak)
      : null;
    const { error } = await supabase
      .from("time_clock_entries")
      .update({
        clock_out: clockOut.toISOString(),
        status: "completed",
        hours_worked: hours ? hours : null,
        ...(entry ? { total_break_minutes: totalBreak } : {}),
        ...(closedBreak ? { break_end: clockOut.toISOString() } : {}),
      } as any)
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
          <CardTitle>{t("auto.innleide_vikarer_uloennede")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("auto.personer_som_er_paa_jobb_hos_dere_uten_a")}</p>
        </div>
        <Button onClick={() => setOpen(true)}><UserPlus className="mr-2 h-4 w-4" />Stemple inn</Button>
      </CardHeader>
      <CardContent>
        {guestActive.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">{t("auto.ingen_innleide_er_inne_naa")}</p>
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
          <DialogHeader><DialogTitle>{t("auto.stemple_inn_innleid_vikar")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t("auto.navn_3")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>{t("auto.fnr_d_nr")}</Label><Input value={nid} onChange={(e) => setNid(e.target.value)} /></div>
            <div><Label>{t("auto.arbeidsgiver_vikarbyraa")}</Label><Input value={employer} onChange={(e) => setEmployer(e.target.value)} /></div>
            <div><Label>{t("auto.rolle_stilling")}</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder={t("auto.kokk_servitoer")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("auto.avbryt")}</Button>
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
        <CardTitle>{t("auto.personalliste_pauseregler")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <Label className="text-base">Aktiver personalliste (Skatteetaten)</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {t("auto.for_serveringssteder_m_fl_som_er_paalagt")}
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>{t("auto.er_pauser_betalt")}</Label>
            <Switch checked={paid} onCheckedChange={setPaid} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t("auto.arbeidstilsynet_spoer_om_dette")}</p>
        </div>
        <div>
          <Label>Standard pauselengde (minutter)</Label>
          <Input type="number" min={0} max={240} value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value || "0"))} />
        </div>
        <div>
          <Label>{t("auto.beskrivelse_av_pauserutine")}</Label>
          <Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("auto.f_eks_ansatte_tar_pauser_fortloepende_ve")} />
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Lagrer..." : "Lagre innstillinger"}</Button>
      </CardContent>
    </Card>
  );
}
