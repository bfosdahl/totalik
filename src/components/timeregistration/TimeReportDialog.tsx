import { useState } from "react";
import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAll";
import { useAuth } from "@/contexts/AuthContext";
import { generateTimeReportPdf } from "@/utils/timeReportPdf";
import { useDepartmentMembership } from "@/hooks/useDepartmentMembership";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Begrens rapporten til ett KS-prosjekt */
  ksProjectId?: string;
}

const toISO = (d: Date) => format(d, "yyyy-MM-dd");

export function TimeReportDialog({ open, onOpenChange, ksProjectId }: TimeReportDialogProps) {
  const { user, profile, company, isCompanyAdmin, isSystemAdmin, isDepartmentAdmin } = useAuth();
  const canSeeAll = isCompanyAdmin || isSystemAdmin || isDepartmentAdmin;
  const { departments, isInDepartment } = useDepartmentMembership();
  const [deptId, setDeptId] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const { data: projects = [] } = useQuery({
    queryKey: ["report-projects", profile?.company_id],
    enabled: open && canSeeAll && !ksProjectId && Boolean(profile?.company_id),
    queryFn: async () => {
      const { data } = await supabase
        .from("ks_module2_projects")
        .select("id, project_name")
        .eq("company_id", profile!.company_id!)
        .order("project_name");
      return (data || []) as { id: string; project_name: string }[];
    },
  });

  const thisWeek = {
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: endOfWeek(new Date(), { weekStartsOn: 1 }),
  };
  const [fromDate, setFromDate] = useState(toISO(thisWeek.from));
  const [toDate, setToDate] = useState(toISO(thisWeek.to));
  const [isGenerating, setIsGenerating] = useState(false);

  const setRange = (from: Date, to: Date) => {
    setFromDate(toISO(from));
    setToDate(toISO(to));
  };

  const handleGenerate = async () => {
    if (!profile?.company_id) return;
    if (fromDate > toDate) {
      toast.error("Fra-dato kan ikke være etter til-dato");
      return;
    }
    setIsGenerating(true);
    try {
      const pid = ksProjectId || (projectId !== "all" ? projectId : null);
      const raw = await fetchAllRows<any>(() => {
        let query = supabase
          .from("time_entries")
          .select(
            "id, entry_date, user_name, user_id, hours, start_time, end_time, customer_name, project_name, project_number, subproject, tags, hour_type, overtime_segments, description"
          )
          .eq("company_id", profile.company_id)
          .gte("entry_date", fromDate)
          .lte("entry_date", toDate)
          .order("entry_date", { ascending: true })
          .order("id");

        if (!canSeeAll) query = query.eq("user_id", user?.id ?? "");
        if (pid) query = query.eq("ks_project_id", pid);
        return query;
      });
      const data = (raw || []).filter(
        (e: any) =>
          deptId === "all"
            ? isCompanyAdmin || isSystemAdmin || e.user_id === user?.id || departments.some((d) => isInDepartment(e.user_id, d.id))
            : isInDepartment(e.user_id, deptId)
      );
      const deptName = departments.find((d) => d.id === deptId)?.name;
      const projName = projects.find((p) => p.id === projectId)?.project_name;
      const filterLabel = [deptName, projName].filter(Boolean).join(" • ");

      if (!data || data.length === 0) {
        toast.error("Ingen timeføringer i valgt periode");
        return;
      }

      // Grupper timer per avdeling → ansatt
      let departmentGroups: { department: string; rows: { name: string; hours: number }[] }[] | undefined;
      if (canSeeAll) {
        const groupDepts = deptId === "all" ? departments : departments.filter((d) => d.id === deptId);
        const buckets = new Map<string, Map<string, number>>();
        const add = (dept: string, name: string, h: number) => {
          const m = buckets.get(dept) ?? new Map<string, number>();
          m.set(name, (m.get(name) || 0) + h);
          buckets.set(dept, m);
        };
        (data as any[]).forEach((e) => {
          const name = e.user_name || "Ukjent";
          const h = Number(e.hours) || 0;
          const hit = groupDepts.filter((d) => isInDepartment(e.user_id, d.id));
          if (hit.length === 0) add("Uten avdeling", name, h);
          else hit.forEach((d) => add(d.name, name, h));
        });
        departmentGroups = [...buckets.entries()]
          .sort((a, b) => (a[0] === "Uten avdeling" ? 1 : b[0] === "Uten avdeling" ? -1 : a[0].localeCompare(b[0], "nb")))
          .map(([department, m]) => ({
            department,
            rows: [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "nb")).map(([name, hours]) => ({ name, hours })),
          }));
      }

      await generateTimeReportPdf({
        entries: data as any,
        companyName: company?.name || "Bedrift",
        logoUrl: (company as any)?.logo_url || null,
        startDate: new Date(fromDate),
        endDate: new Date(toDate),
        subtitle: canSeeAll
          ? filterLabel || undefined
          : `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || undefined,
        departmentGroups,
      });
      toast.success("Timerapport lastet ned");
      onOpenChange(false);
    } catch (err) {
      console.error("Timerapport feilet:", err);
      toast.error("Kunne ikke lage timerapporten");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Timerapport (PDF)</DialogTitle>
          <DialogDescription>
            {canSeeAll
              ? "Velg periode, avdeling og prosjekt. Rapporten viser bare de som har ført timer."
              : "Utskriftsvennlig timeliste for dine egne timer i valgt periode."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "I dag", from: () => new Date(), to: () => new Date() },
              { label: "Denne uken", from: () => thisWeek.from, to: () => thisWeek.to },
              {
                label: "Forrige uke",
                from: () => startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
                to: () => endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
              },
              {
                label: "Siste 2 uker",
                from: () => startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
                to: () => endOfWeek(new Date(), { weekStartsOn: 1 }),
              },
              { label: "Denne måneden", from: () => startOfMonth(new Date()), to: () => endOfMonth(new Date()) },
              {
                label: "Forrige måned",
                from: () => startOfMonth(subMonths(new Date(), 1)),
                to: () => endOfMonth(subMonths(new Date(), 1)),
              },
              {
                label: "Siste 3 måneder",
                from: () => startOfMonth(subMonths(new Date(), 2)),
                to: () => endOfMonth(new Date()),
              },
            ].map((p) => (
              <Button
                key={p.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRange(p.from(), p.to())}
              >
                {p.label}
              </Button>
            ))}
          </div>


          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="report-from">Fra dato</Label>
              <Input
                id="report-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-to">Til dato</Label>
              <Input
                id="report-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          {canSeeAll && (departments.length > 0 || (!ksProjectId && projects.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {departments.length > 0 && (
                <div className="space-y-2">
                  <Label>Avdeling</Label>
                  <Select value={deptId} onValueChange={setDeptId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isCompanyAdmin || isSystemAdmin ? "Alle avdelinger" : "Mine avdelinger"}</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!ksProjectId && projects.length > 0 && (
                <div className="space-y-2">
                  <Label>Prosjekt</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle prosjekter</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? "Lager rapport..." : "Last ned PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
