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
import { useAuth } from "@/contexts/AuthContext";
import { generateTimeReportPdf } from "@/utils/timeReportPdf";

interface TimeReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Begrens rapporten til ett KS-prosjekt */
  ksProjectId?: string;
}

const toISO = (d: Date) => format(d, "yyyy-MM-dd");

export function TimeReportDialog({ open, onOpenChange, ksProjectId }: TimeReportDialogProps) {
  const { user, profile, company, isCompanyAdmin, isSystemAdmin } = useAuth();
  const canSeeAll = isCompanyAdmin || isSystemAdmin;

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
      let query = supabase
        .from("time_entries")
        .select(
          "id, entry_date, user_name, user_id, hours, start_time, end_time, customer_name, project_name, project_number, subproject, tags, hour_type, overtime_segments, description"
        )
        .eq("company_id", profile.company_id)
        .gte("entry_date", fromDate)
        .lte("entry_date", toDate)
        .order("entry_date", { ascending: true });

      if (!canSeeAll) query = query.eq("user_id", user?.id ?? "");
      if (ksProjectId) query = query.eq("ks_project_id", ksProjectId);

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("Ingen timeføringer i valgt periode");
        return;
      }

      await generateTimeReportPdf({
        entries: data as any,
        companyName: company?.name || "Bedrift",
        logoUrl: (company as any)?.logo_url || null,
        startDate: new Date(fromDate),
        endDate: new Date(toDate),
        subtitle: canSeeAll
          ? undefined
          : `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || undefined,
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
              ? "Utskriftsvennlig timeliste for hele bedriften i valgt periode."
              : "Utskriftsvennlig timeliste for dine egne timer i valgt periode."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRange(thisWeek.from, thisWeek.to)}
            >
              Denne uken
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setRange(
                  startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
                  endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
                )
              }
            >
              Forrige uke
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRange(startOfMonth(new Date()), endOfMonth(new Date()))}
            >
              Denne måneden
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setRange(startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1)))
              }
            >
              Forrige måned
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRange(startOfMonth(subMonths(new Date(), 2)), endOfMonth(new Date()))}
            >
              Siste 3 måneder
            </Button>
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
