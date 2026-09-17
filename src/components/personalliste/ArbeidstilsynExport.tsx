import { useState } from "react";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { format, subMonths, startOfDay, endOfDay } from "date-fns";
import { nb } from "date-fns/locale";
import { Download, FileArchive, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getLocalDateString } from "@/lib/dateUtils";
import { t } from "@/i18n/t";

/**
 * Fase 2 — Arbeidstilsyn-pakke
 * Samler alt Arbeidstilsynet ber om i én ZIP:
 *  - Timelister m/ start/stopp og pauser (XLSX + CSV)
 *  - Arbeidsplan
 *  - Ansattoversikt (fnr registrert ja/nei, bolig)
 *  - Personalliste-status akkurat nå
 *  - Pauserutine (skriftlig)
 *  - Ansettelsesavtaler (referanser)
 *  - README m/ forklaring til inspektør
 */
export function ArbeidstilsynExport({ companyId, companyName }: { companyId: string; companyName: string }) {
  const { toast } = useToast();
  const today = new Date();
  const [startDate, setStartDate] = useState(getLocalDateString(subMonths(today, 3)));
  const [endDate, setEndDate] = useState(getLocalDateString(today));
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const startISO = startOfDay(new Date(startDate)).toISOString();
      const endISO = endOfDay(new Date(endDate)).toISOString();

      // 1) Timelister m/ pauser
      const { data: entries = [], error: entErr } = await supabase
        .from("time_clock_entries")
        .select("id, user_name, guest_name, guest_employer, guest_national_id, is_guest_worker, clock_in, clock_out, break_start, break_end, total_break_minutes, hours_worked, status, notes")
        .eq("company_id", companyId)
        .gte("clock_in", startISO)
        .lte("clock_in", endISO)
        .order("clock_in");
      if (entErr) throw entErr;

      const entryIds = (entries || []).map((e: any) => e.id);
      const { data: breaks = [] } = await supabase
        .from("time_clock_breaks")
        .select("entry_id, break_start, break_end, is_paid")
        .in("entry_id", entryIds.length ? entryIds : ["00000000-0000-0000-0000-000000000000"]);
      const breakMap = new Map<string, any[]>();
      (breaks || []).forEach((b: any) => {
        const arr = breakMap.get(b.entry_id) || [];
        arr.push(b);
        breakMap.set(b.entry_id, arr);
      });

      // Fallback til time_entries (manuelle timer) for perioden
      const { data: manualHours = [] } = await supabase
        .from("time_entries")
        .select("user_name, entry_date, start_time, end_time, hours, description, status, hour_type")
        .eq("company_id", companyId)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate)
        .order("entry_date");

      // 2) Arbeidsplan
      const { data: schedules = [] } = await supabase
        .from("work_schedules")
        .select("employee_name, schedule_date, start_time, end_time, break_minutes, notes")
        .eq("company_id", companyId)
        .gte("schedule_date", startDate)
        .lte("schedule_date", endDate)
        .order("schedule_date");

      // 3) Ansatte
      const { data: profilesSafe = [] } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone, is_active")
        .eq("company_id", companyId);
      const { data: sens = [] } = await supabase.rpc("get_company_profiles_sensitive", { p_company_id: companyId });
      const sensMap = new Map((sens || []).map((s: any) => [s.id, s]));
      const profiles = (profilesSafe || []).map((p: any) => {
        const s: any = sensMap.get(p.id) || {};
        return { ...p, accommodation_provided: s.accommodation_provided ?? false, accommodation_address: s.accommodation_address ?? null };
      });

      const ids = (profiles || []).map((p) => p.id);
      const { data: nids = [] } = await supabase
        .from("profiles_national_id")
        .select("profile_id, id_type")
        .in("profile_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const nidMap = new Map((nids || []).map((n) => [n.profile_id, n]));

      // 4) Kontrakter (referanse)
      const { data: contracts = [] } = await supabase
        .from("employment_contracts")
        .select("employee_id, contract_type, start_date, end_date, position, working_hours_per_week, salary_amount, salary_type, employment_percentage, status")
        .eq("company_id", companyId);
      const nameMap = new Map(
        (profiles || []).map((p: any) => [p.id, `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || ""])
      );

      // 5) Bedriftsinnstillinger (pauserutine)
      const { data: company } = await supabase
        .from("companies")
        .select("name, org_number, break_policy_paid, break_policy_default_minutes, break_policy_description")
        .eq("id", companyId)
        .maybeSingle();

      // ─── Bygg ark ────────────────────────────────────────────────────────
      const fmt = (d: string | null) => (d ? format(new Date(d), "yyyy-MM-dd HH:mm", { locale: nb }) : "");
      const timerRows = (entries || []).map((e: any) => {
        const bList = breakMap.get(e.id) || [];
        const pauser = bList.length
          ? bList.map((b) => {
              const mins = b.break_end ? Math.round((new Date(b.break_end).getTime() - new Date(b.break_start).getTime()) / 60000) : null;
              return `${format(new Date(b.break_start), "HH:mm")}–${b.break_end ? format(new Date(b.break_end), "HH:mm") : "pågår"} (${mins ?? "?"} min)`;
            }).join(" | ")
          : e.break_start
            ? `${format(new Date(e.break_start), "HH:mm")}–${e.break_end ? format(new Date(e.break_end), "HH:mm") : "pågår"}`
            : "";
        return {
          Dato: format(new Date(e.clock_in), "yyyy-MM-dd"),
          Navn: e.user_name || e.guest_name,
          Type: e.is_guest_worker ? "Innleid" : "Ansatt",
          "Arbeidsgiver (v/innleid)": e.guest_employer || "",
          "Fnr innleid": e.guest_national_id || "",
          "Stemplet inn": fmt(e.clock_in),
          "Stemplet ut": fmt(e.clock_out),
          Pauser: pauser,
          "Pause min totalt": e.total_break_minutes ?? 0,
          "Timer arbeidet": e.hours_worked ?? "",
          Status: e.status,
          Notat: e.notes || "",
        };
      });

      const manuelleRows = (manualHours || []).map((r: any) => ({
        Dato: r.entry_date,
        Navn: r.user_name,
        Fra: r.start_time || "",
        Til: r.end_time || "",
        Timer: r.hours,
        Type: r.hour_type || "normal",
        Status: r.status,
        Beskrivelse: r.description || "",
      }));

      const plannedHours = (start?: string, end?: string, breakMin?: number) => {
        if (!start || !end) return "";
        const toMin = (t: string) => {
          const [h, m] = t.split(":").map(Number);
          return (h || 0) * 60 + (m || 0);
        };
        let diff = toMin(end) - toMin(start);
        if (diff < 0) diff += 24 * 60;
        diff -= breakMin || 0;
        return diff > 0 ? Math.round((diff / 60) * 100) / 100 : "";
      };

      const arbeidsplanRows = (schedules || []).map((s: any) => ({
        Dato: s.schedule_date,
        Navn: s.employee_name,
        Fra: s.start_time || "",
        Til: s.end_time || "",
        "Pause min": s.break_minutes ?? 0,
        "Planlagte timer": plannedHours(s.start_time, s.end_time, s.break_minutes),
        Notat: s.notes || "",
      }));

      const ansatteRows = (profiles || []).map((p: any) => ({
        Navn: `${p.first_name || ""} ${p.last_name || ""}`.trim(),
        "E-post": p.email,
        Telefon: p.phone || "",
        Aktiv: p.is_active ? "Ja" : "Nei",
        "Fnr/D-nr registrert": nidMap.get(p.id) ? `Ja (${(nidMap.get(p.id) as any).id_type})` : "Nei",
        "Bolig stilt av arbeidsgiver": p.accommodation_provided ? "Ja" : "Nei",
        "Adresse bolig": p.accommodation_address || "",
      }));

      const kontraktRows = (contracts || []).map((c: any) => ({
        Ansatt: nameMap.get(c.employee_id) || "",
        "Type kontrakt": c.contract_type,
        Stilling: c.position || "",
        "Stillingsprosent": c.employment_percentage ?? "",
        "Ukentlige timer": c.working_hours_per_week ?? "",
        Lønn: c.salary_amount ?? "",
        "Lønnstype": c.salary_type || "",
        Startdato: c.start_date || "",
        Sluttdato: c.end_date || "",
        Status: c.status,
      }));

      // ─── XLSX ────────────────────────────────────────────────────────────
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(timerRows), "Timelister (stempling)");
      if (manuelleRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(manuelleRows), "Timelister (manuelt)");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(arbeidsplanRows), "Arbeidsplan");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ansatteRows), "Ansatte");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kontraktRows), "Ansettelsesavtaler");
      const xlsxBuf = XLSX.write(wb, { type: "array", bookType: "xlsx" });

      // ─── CSV (Arbeidstilsynet ber uttrykkelig om CSV) ────────────────────
      const toCsv = (rows: any[]) => {
        if (!rows.length) return "";
        const headers = Object.keys(rows[0]);
        const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        return [headers.join(";"), ...rows.map((r) => headers.map((h) => esc(r[h])).join(";"))].join("\n");
      };

      // ─── README ──────────────────────────────────────────────────────────
      const orgnr = company?.org_number || "";
      const readme = `ARBEIDSTILSYN-PAKKE
====================
Bedrift: ${company?.name || companyName}
Org.nr:  ${orgnr}
Periode: ${startDate} til ${endDate}
Generert: ${format(new Date(), "yyyy-MM-dd HH:mm", { locale: nb })}

INNHOLD
-------
- 01-Timelister-og-oversikt.xlsx  (alle ark: stempling, manuelle timer, arbeidsplan, ansatte, kontrakter)
- 02-Timelister-stempling.csv     (CSV som spesifikt etterspurt av Arbeidstilsynet)
- 03-Timelister-manuelt.csv       (manuelt registrerte timer i perioden)
- 04-Arbeidsplan.csv
- 05-Ansatte.csv
- 06-Ansettelsesavtaler.csv       (nøkkeltall – selve PDF-ene ligger i systemet under HR > Ansettelsesavtaler)
- 07-Pauserutine.txt              (bedriftens skriftlige pauserutine)
- 08-Personalliste-akkurat-naa.csv (hvem som var stemplet inn da eksporten ble kjørt)

DEKKER FØLGENDE KRAV FRA ARBEIDSTILSYNET
-----------------------------------------
✔ Oversikt over arbeidede timer med start, stopp og pauser (AML § 10-7)
✔ Arbeidsplan / vaktliste
✔ Ansettelsesavtaler (nøkkelinfo – full PDF hentes i systemet)
✔ Skriftlig beskrivelse av hvordan pauser praktiseres
✔ CSV-eksport av digitale timelister
✔ Innkvarteringsadresse for ansatte som får bolig av arbeidsgiver

IKKE INKLUDERT (må hentes fra lønnssystem/bank)
------------------------------------------------
✗ Lønnsslipper — hentes fra lønnssystemet (Tripletex/Visma/Duett osv.)
✗ Kontoutskrift / dokumentasjon på at lønn er utbetalt — hentes fra nettbank
✗ Selve PDF-ene av signerte ansettelsesavtaler — logg inn i systemet og last ned per ansatt

KONTAKT
-------
Generert automatisk av TotalIK personalliste-modul.
`;

      const pauserutine = `PAUSERUTINE — ${company?.name || companyName}
========================================

Er pauser betalt? ${company?.break_policy_paid ? "Ja" : "Nei"}
Standard pauselengde: ${company?.break_policy_default_minutes ?? 30} minutter

Skriftlig beskrivelse
---------------------
${company?.break_policy_description || "(Ikke utfylt — legges inn under Personalliste > Innstillinger)"}

Lovkrav (AML § 10-9): Arbeidstaker som har arbeidstid på mer enn 5,5 timer har rett til minst én pause.
Ved arbeidstid på 8 timer eller mer skal pausene til sammen være minst en halv time.
`;

      // ─── Live personalliste ──────────────────────────────────────────────
      const { data: liveNow = [] } = await supabase
        .from("time_clock_entries")
        .select("user_name, guest_name, guest_employer, is_guest_worker, clock_in, break_start, break_end")
        .eq("company_id", companyId)
        .eq("status", "active");
      const liveRows = (liveNow || []).map((e: any) => ({
        Navn: e.user_name || e.guest_name,
        Type: e.is_guest_worker ? "Innleid" : "Ansatt",
        "Arbeidsgiver (v/innleid)": e.guest_employer || "",
        "Inne siden": format(new Date(e.clock_in), "yyyy-MM-dd HH:mm"),
        "På pause nå": e.break_start && !e.break_end ? "Ja" : "Nei",
      }));

      // ─── Bygg ZIP ────────────────────────────────────────────────────────
      const zip = new JSZip();
      zip.file("00-README.txt", readme);
      zip.file("01-Timelister-og-oversikt.xlsx", xlsxBuf);
      zip.file("02-Timelister-stempling.csv", toCsv(timerRows));
      if (manuelleRows.length) zip.file("03-Timelister-manuelt.csv", toCsv(manuelleRows));
      zip.file("04-Arbeidsplan.csv", toCsv(arbeidsplanRows));
      zip.file("05-Ansatte.csv", toCsv(ansatteRows));
      zip.file("06-Ansettelsesavtaler.csv", toCsv(kontraktRows));
      zip.file("07-Pauserutine.txt", pauserutine);
      zip.file("08-Personalliste-akkurat-naa.csv", toCsv(liveRows));

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Arbeidstilsyn-pakke_${(company?.name || companyName).replace(/\s+/g, "_")}_${startDate}_${endDate}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: t("auto.pakke_generert"), description: `${timerRows.length} stemplinger, ${manuelleRows.length} manuelle, ${arbeidsplanRows.length} planlagte skift.` });
    } catch (e: any) {
      toast({ title: t("auto.feil_ved_generering"), description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileArchive className="h-5 w-5 text-primary" />
          Arbeidstilsyn-pakke (eksport)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Ett klikk = ZIP‑fil med alt Arbeidstilsynet ber om: timelister m/ pauser, arbeidsplan, ansatte, kontrakter, pauserutine — som XLSX + CSV.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>{t("auto.fra_dato")}</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>{t("auto.til_dato")}</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 border p-3 text-xs space-y-1">
          <div className="flex items-center gap-1 font-medium">
            <Info className="h-3.5 w-3.5" /> {t("auto.ikke_inkludert_maa_hentes_andre_steder")}
          </div>
          <p>{t("auto.loennsslipper_loennssystem_tripletex_vis")}</p>
          <p>{t("auto.kontoutskrift_som_viser_loennsutbetaling")}</p>
          <p>{t("auto.signerte_pdf_ansettelsesavtaler_hr_anset")}</p>
        </div>

        <Button onClick={generate} disabled={busy} className="w-full md:w-auto">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {busy ? "Genererer pakke..." : "Generer Arbeidstilsyn‑pakke (.zip)"}
        </Button>
      </CardContent>
    </Card>
  );
}
