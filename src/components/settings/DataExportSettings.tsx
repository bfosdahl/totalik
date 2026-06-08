import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, FileJson, Loader2, ShieldCheck } from "lucide-react";

interface Props {
  onBack: () => void;
}

// Hovedtabeller å eksportere – dekker brukerprodusert innhold
const EXPORT_TABLES = [
  "companies",
  "profiles",
  "company_departments",
  "company_modules",
  "company_routines",
  "company_ks_routines",
  "company_ks_documents",
  "company_module_documents",
  "company_goals",
  "company_action_plans",
  "company_vehicles",
  "company_ks_checklist_templates",
  "deviations",
  "audits",
  "audit_form_responses",
  "hms_sja",
  "hms_self_declarations",
  "hms_forsvarlighetsvurderinger",
  "ik_hms_stoffkartotek",
  "ik_hms_company_documents",
  "ks_module2_projects",
  "ks_module2_routines",
  "ks_module2_checklists",
  "ks_module2_sja",
  "ks_module2_meetings",
  "ks_module2_change_orders",
  "ks_module2_avvik",
  "ks_daily_reports",
  "ik_alkohol_licenses",
  "ik_alkohol_controls",
  "ik_alkohol_incidents",
  "ik_alkohol_routines",
  "ik_mat_suppliers",
  "ik_mat_temperature_logs",
  "ik_mat_checklist_responses",
  "ik_mat_traceability_records",
  "employee_courses",
  "employee_meetings",
  "employee_absence",
  "time_entries",
  "work_schedules",
  "driving_log_entries",
  "travel_expense_reports",
  "fdv_buildings",
  "fdv_controls",
  "fdv_documents",
  "personalhandbok_chapters",
  "anonymous_messages",
] as const;

export function DataExportSettings({ onBack }: Props) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: EXPORT_TABLES.length, current: "" });

  const handleExport = async () => {
    if (!profile?.company_id) return;
    setIsExporting(true);
    setProgress({ done: 0, total: EXPORT_TABLES.length, current: "" });

    const exportData: Record<string, any> = {
      meta: {
        exported_at: new Date().toISOString(),
        company_id: profile.company_id,
        exported_by: profile.email,
        format_version: "1.0",
      },
      tables: {},
    };

    for (let i = 0; i < EXPORT_TABLES.length; i++) {
      const table = EXPORT_TABLES[i];
      setProgress({ done: i, total: EXPORT_TABLES.length, current: table });
      try {
        const { data, error } = await supabase
          .from(table as any)
          .select("*")
          .eq(table === "companies" ? "id" : "company_id", profile.company_id);
        if (error) {
          exportData.tables[table] = { error: error.message };
        } else {
          exportData.tables[table] = { count: data?.length || 0, rows: data || [] };
        }
      } catch (e: any) {
        exportData.tables[table] = { error: e.message };
      }
    }

    setProgress({ done: EXPORT_TABLES.length, total: EXPORT_TABLES.length, current: "" });

    // Last ned som JSON-fil
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().split("T")[0];
    a.download = `totalik-eksport-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Eksport fullført",
      description: `${EXPORT_TABLES.length} tabeller eksportert`,
    });
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" />
        Tilbake
      </Button>

      <div className="flex items-center gap-3">
        <FileJson className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data og eksport</h1>
          <p className="text-muted-foreground text-sm">
            Last ned en full kopi av bedriftens data
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="font-medium">GDPR-vennlig datakopi</p>
            <p className="text-muted-foreground">
              Eksporten inneholder alle bedriftens hoveddata som rutiner, dokumenter,
              avvik, prosjekter, ansatte, kurs, timer og kjørebok i ett JSON-format.
              Du kan bruke filen som sikkerhetskopi eller for å oppfylle GDPR-krav om
              dataportabilitet.
            </p>
            <p className="text-muted-foreground">
              <strong>Merk:</strong> Filer (PDF-er, bilder, vedlegg) er ikke inkludert,
              kun metadata. Database-backup tas automatisk i bakgrunnen daglig.
            </p>
          </div>
        </div>

        {isExporting && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Eksporterer {progress.current || "..."}</span>
              <span className="text-muted-foreground ml-auto">
                {progress.done} / {progress.total}
              </span>
            </div>
            <div className="h-2 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Button onClick={handleExport} disabled={isExporting} className="gap-2">
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isExporting ? "Eksporterer..." : "Last ned alle data (JSON)"}
        </Button>
      </div>
    </div>
  );
}
