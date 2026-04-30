import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, ClipboardCheck, Calendar, CheckCircle2, Clock, Trash2, Pencil, FileSearch } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import { IkMatRevisjonDialog } from "./IkMatRevisjonDialog";

interface IkMatAudit {
  id: string;
  audit_number: string;
  title: string;
  status: string;
  scheduled_date: string;
  responsible_name: string | null;
  checklist_total: number;
  checklist_completed: number;
  description: string | null;
}

const statusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-success/15 text-success hover:bg-success/15"><CheckCircle2 className="h-3 w-3 mr-1" />Fullført</Badge>;
    case "in-progress":
      return <Badge className="bg-warning/15 text-warning hover:bg-warning/15"><Clock className="h-3 w-3 mr-1" />Pågår</Badge>;
    case "overdue":
      return <Badge variant="destructive">Forfalt</Badge>;
    default:
      return <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />Planlagt</Badge>;
  }
};

export const RevisjonTab = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const [audits, setAudits] = useState<IkMatAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAudits = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("audits")
      .select("id, audit_number, title, status, scheduled_date, responsible_name, checklist_total, checklist_completed, description")
      .eq("company_id", companyId)
      .eq("area", "IK_MAT")
      .eq("is_deleted", false)
      .order("scheduled_date", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Kunne ikke hente revisjoner");
    } else {
      setAudits((data || []) as IkMatAudit[]);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("audits")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", deleteId);
    if (error) {
      toast.error("Kunne ikke slette");
    } else {
      toast.success("Revisjon slettet");
      setAudits((prev) => prev.filter((a) => a.id !== deleteId));
    }
    setDeleteId(null);
  };

  const lastCompleted = audits.find((a) => a.status === "completed");
  const inProgress = audits.filter((a) => a.status === "in-progress").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-primary" />
                Intern revisjon — IK MAT
              </CardTitle>
              <CardDescription>
                Årlig gjennomgang av internkontrollen. Sjekker at rutiner brukes som tiltenkt og oppfyller regelverket (Mattilsynet, IK-mat-forskriften).
              </CardDescription>
            </div>
            <Button onClick={() => { setEditId(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ny revisjon
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Siste fullførte</p>
              <p className="text-lg font-semibold mt-1">
                {lastCompleted
                  ? format(new Date(lastCompleted.scheduled_date), "d. MMM yyyy", { locale: nb })
                  : "Ingen ennå"}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Pågående</p>
              <p className="text-lg font-semibold mt-1">{inProgress}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Totalt registrert</p>
              <p className="text-lg font-semibold mt-1">{audits.length}</p>
            </div>
          </div>

          {!loading && audits.length === 0 && (
            <Alert className="mt-6">
              <ClipboardCheck className="h-4 w-4" />
              <AlertDescription>
                Ingen revisjoner registrert ennå. Rutinen anbefaler at intern revisjon gjennomføres minst én gang per år (typisk januar). Klikk "Ny revisjon" for å starte.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {audits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revisjonshistorikk</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nr</TableHead>
                    <TableHead>Tittel</TableHead>
                    <TableHead>Dato</TableHead>
                    <TableHead>Ansvarlig</TableHead>
                    <TableHead>Fremdrift</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.audit_number}</TableCell>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>{format(new Date(a.scheduled_date), "d. MMM yyyy", { locale: nb })}</TableCell>
                      <TableCell>{a.responsible_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.checklist_completed}/{a.checklist_total}
                      </TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditId(a.id); setDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(a.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <IkMatRevisjonDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditId(null); }}
        existingAuditId={editId}
        onSaved={fetchAudits}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett revisjon?</AlertDialogTitle>
            <AlertDialogDescription>
              Revisjonen flyttes til papirkurven og kan gjenopprettes derfra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Slett</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
