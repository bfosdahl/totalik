import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildSundayReport,
  type SundayHistoryRow,
} from "@/utils/sundayComplianceCheck";
import { AlertTriangle, CalendarDays, Download, FileText, Loader2, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const STATUS_LABEL: Record<SundayHistoryRow["status"], string> = {
  ok: "OK",
  risk: "Risiko",
  breach: "Brudd",
};

function StatusBadge({ status }: { status: SundayHistoryRow["status"] }) {
  if (status === "breach") return <Badge variant="destructive">Brudd</Badge>;
  if (status === "risk")
    return (
      <Badge className="bg-amber-500 hover:bg-amber-500/90 text-white border-transparent">
        Risiko
      </Badge>
    );
  return <Badge variant="secondary">OK</Badge>;
}

export default function HrSundayReport() {
  const { profile, isCompanyAdmin, isSystemAdmin } = useAuth();
  const [rows, setRows] = useState<SundayHistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeks] = useState(26);

  useEffect(() => {
    if (!profile?.company_id) return;
    setIsLoading(true);
    buildSundayReport({ companyId: profile.company_id, weeks })
      .then(setRows)
      .finally(() => setIsLoading(false));
  }, [profile?.company_id, weeks]);

  const summary = useMemo(() => {
    return {
      breaches: rows.filter((r) => r.status === "breach").length,
      risks: rows.filter((r) => r.status === "risk").length,
      ok: rows.filter((r) => r.status === "ok").length,
      total: rows.length,
    };
  }, [rows]);

  if (!isCompanyAdmin && !isSystemAdmin) {
    return (
      <AppLayout>
        <Alert>
          <AlertTitle>Ingen tilgang</AlertTitle>
          <AlertDescription>
            Søndagsrapporten er forbeholdt administratorer.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Søndagsrapport – AML §10-8", 14, 16);
    doc.setFontSize(10);
    doc.text(
      `Periode: siste ${weeks} uker  •  Generert ${format(new Date(), "d. MMMM yyyy", { locale: nb })}`,
      14,
      23,
    );
    doc.text(
      `Brudd: ${summary.breaches}   Risiko: ${summary.risks}   OK: ${summary.ok}`,
      14,
      29,
    );

    autoTable(doc, {
      startY: 35,
      head: [["Ansatt", "Søndager jobbet", "Lengste rad", "På rad nå", "Status"]],
      body: rows.map((r) => [
        r.employee_name,
        `${r.worked_sundays.length} av ${r.total_sundays_in_window}`,
        String(r.longest_consecutive),
        String(r.consecutive_at_end),
        STATUS_LABEL[r.status],
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 64, 175] },
    });

    doc.save(`sondagsrapport-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-primary" />
              Søndagsrapport
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AML §10-8 – fri annenhver søndag (siste {weeks} uker)
            </p>
          </div>
          <Button onClick={handleExportPdf} disabled={isLoading || rows.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Last ned PDF
          </Button>
        </div>

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Hva viser denne rapporten?</AlertTitle>
          <AlertDescription>
            <p>
              Arbeidstilsynet krever at ansatte får fri annenhver søndag (AML §10-8).
              Rapporten ser på de siste {weeks} ukene og viser hvor mange søndager hver
              ansatt har jobbet, samt lengste sammenhengende rad. Brudd betyr 3 eller
              flere søndager på rad. Risiko betyr 2 søndager på rad.
            </p>
            <p className="mt-2">
              Unntak: Skriftlig avtale med ansatt om gjennomsnittsberegning over 26 uker
              (§10-8 fjerde ledd) tillater inntil hver søndag, så lenge halvparten av
              søndagene i perioden er fri.
            </p>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ansatte totalt</CardDescription>
              <CardTitle className="text-2xl">{summary.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-destructive">Brudd</CardDescription>
              <CardTitle className="text-2xl text-destructive">{summary.breaches}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-amber-600">Risiko</CardDescription>
              <CardTitle className="text-2xl text-amber-600">{summary.risks}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-emerald-600">OK</CardDescription>
              <CardTitle className="text-2xl text-emerald-600">{summary.ok}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detaljer per ansatt</CardTitle>
            <CardDescription>
              Sortert etter alvorlighet. Klikk PDF-knappen for å eksportere til
              Arbeidstilsynet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Laster data…
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShieldCheck className="w-10 h-10 mb-2 text-emerald-500" />
                Ingen søndagsvakter registrert i de siste {weeks} ukene.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ansatt</TableHead>
                      <TableHead className="text-right">Søndager jobbet</TableHead>
                      <TableHead className="text-right">Lengste rad</TableHead>
                      <TableHead className="text-right">På rad nå</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.employee_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {r.status === "breach" && (
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                            )}
                            {r.employee_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {r.worked_sundays.length} / {r.total_sundays_in_window}
                        </TableCell>
                        <TableCell className="text-right">{r.longest_consecutive}</TableCell>
                        <TableCell className="text-right">{r.consecutive_at_end}</TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
