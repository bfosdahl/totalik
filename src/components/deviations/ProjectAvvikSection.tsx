import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ProjectAvvikRow {
  id: string;
  avvik_number: string;
  title: string;
  status: string;
  severity: string;
  discovered_date: string;
  project_id: string;
  project_number: string | null;
  project_name: string | null;
}

const severityColor: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
};

const statusLabel: Record<string, string> = {
  open: "Åpen",
  in_progress: "Under arbeid",
  pending: "Venter",
  closed: "Lukket",
};

export function ProjectAvvikSection() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<ProjectAvvikRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!profile?.company_id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("ks_module2_avvik" as any)
        .select("id, avvik_number, title, status, severity, discovered_date, project_id, ks_module2_projects(project_number, project_name)")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setRows(
          (data as any[]).map((r) => ({
            id: r.id,
            avvik_number: r.avvik_number,
            title: r.title,
            status: r.status,
            severity: r.severity,
            discovered_date: r.discovered_date,
            project_id: r.project_id,
            project_number: r.ks_module2_projects?.project_number ?? null,
            project_name: r.ks_module2_projects?.project_name ?? null,
          }))
        );
      }
      setLoading(false);
    };
    fetch();
  }, [profile?.company_id]);

  const visible = showClosed ? rows : rows.filter((r) => r.status !== "closed");

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rows.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Prosjektavvik ({visible.length})
          </h2>
          <p className="text-xs text-muted-foreground">Avvik registrert på KS Bygg-prosjekter</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowClosed((s) => !s)}>
          {showClosed ? "Skjul lukkede" : "Vis lukkede"}
        </Button>
      </div>
      <div className="divide-y divide-border">
        {visible.map((r) => (
          <Link
            key={r.id}
            to={`/ks/project/${r.project_id}/avvik`}
            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">{r.avvik_number}</span>
                <Badge className={severityColor[r.severity] || "bg-muted"}>{r.severity}</Badge>
                <Badge variant="outline">{statusLabel[r.status] || r.status}</Badge>
              </div>
              <p className="font-medium mt-1 truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {r.project_number} · {r.project_name} · {format(new Date(r.discovered_date), "dd.MM.yyyy")}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
