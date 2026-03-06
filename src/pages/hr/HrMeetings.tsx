import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Calendar, CheckCircle2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ScheduleMeetingDialog } from "@/components/hr/ScheduleMeetingDialog";
import { format, parseISO, isAfter, addDays } from "date-fns";
import { nb } from "date-fns/locale";

interface HrMeeting {
  id: string;
  employee_name: string;
  meeting_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  completed_at: string | null;
}

const meetingTypeLabels: Record<string, string> = {
  medarbeidersamtale: "Medarbeidersamtale",
  utviklingssamtale: "Utviklingssamtale",
  oppfølging: "Oppfølging",
  prøvetid: "Prøvetid",
};

export default function HrMeetings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<HrMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("hr_meetings")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      setMeetings((data as HrMeeting[]) || []);
    } catch (error) {
      console.error("Error fetching hr meetings:", error);
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const markCompleted = async (id: string) => {
    try {
      const { error } = await supabase
        .from("hr_meetings")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Samtale markert som gjennomført" });
      fetchMeetings();
    } catch (error) {
      console.error("Error completing meeting:", error);
      toast({ title: "Feil", description: "Kunne ikke oppdatere", variant: "destructive" });
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      const { error } = await supabase.from("hr_meetings").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Samtale slettet" });
      fetchMeetings();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast({ title: "Feil", description: "Kunne ikke slette", variant: "destructive" });
    }
  };

  const planned = meetings.filter((m) => m.status === "planned");
  const completed = meetings.filter((m) => m.status === "completed");
  const today = new Date();
  const dueSoon = planned.filter((m) => {
    const d = parseISO(m.scheduled_date);
    return isAfter(addDays(today, 7), d) && isAfter(d, today);
  });
  const completedThisYear = completed.filter(
    (m) => m.completed_at && parseISO(m.completed_at).getFullYear() === today.getFullYear()
  );

  const renderMeetingCard = (meeting: HrMeeting) => (
    <Card key={meeting.id} className="p-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{meeting.employee_name}</span>
          <Badge variant="secondary" className="text-xs">
            {meetingTypeLabels[meeting.meeting_type] || meeting.meeting_type}
          </Badge>
          {meeting.status === "completed" && (
            <Badge variant="default" className="text-xs bg-green-600">Gjennomført</Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {format(parseISO(meeting.scheduled_date), "d. MMMM yyyy", { locale: nb })}
          {meeting.scheduled_time && ` kl. ${meeting.scheduled_time.slice(0, 5)}`}
          {meeting.location && ` · ${meeting.location}`}
        </div>
        {meeting.notes && (
          <p className="text-sm text-muted-foreground mt-1 truncate">{meeting.notes}</p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        {meeting.status === "planned" && (
          <Button size="icon" variant="ghost" onClick={() => markCompleted(meeting.id)} title="Marker som gjennomført">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={() => deleteMeeting(meeting.id)} title="Slett">
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );

  const emptyState = (message: string) => (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <UserCheck className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{message}</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          Start med å planlegge medarbeidersamtaler for å følge opp dine ansatte
        </p>
        <ScheduleMeetingDialog onCreated={fetchMeetings} trigger={
          <Button><Calendar className="w-4 h-4 mr-2" />Planlegg første samtale</Button>
        } />
      </div>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Medarbeidersamtaler</h1>
            <p className="text-muted-foreground mt-1">
              Planlegg og følg opp medarbeidersamtaler og utviklingssamtaler
            </p>
          </div>
          <ScheduleMeetingDialog onCreated={fetchMeetings} />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">{planned.length}</div>
            <div className="text-sm text-muted-foreground">Planlagte samtaler</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{completedThisYear.length}</div>
            <div className="text-sm text-muted-foreground">Gjennomført i år</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{dueSoon.length}</div>
            <div className="text-sm text-muted-foreground">Forfaller snart</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">
              {meetings.length > 0
                ? Math.round((completed.length / meetings.length) * 100) + "%"
                : "–"}
            </div>
            <div className="text-sm text-muted-foreground">Dekningsgrad</div>
          </Card>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Kommende</TabsTrigger>
            <TabsTrigger value="completed">Gjennomført</TabsTrigger>
            <TabsTrigger value="all">Alle</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {planned.length === 0
              ? emptyState("Ingen planlagte samtaler")
              : planned.map(renderMeetingCard)}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-3">
            {completed.length === 0
              ? emptyState("Ingen gjennomførte samtaler")
              : completed.map(renderMeetingCard)}
          </TabsContent>

          <TabsContent value="all" className="mt-4 space-y-3">
            {meetings.length === 0
              ? emptyState("Ingen samtaler registrert")
              : meetings.map(renderMeetingCard)}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
