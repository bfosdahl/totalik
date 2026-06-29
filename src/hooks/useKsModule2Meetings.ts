import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MeetingParticipant {
  name: string;
  role?: string;
  email?: string;
  company?: string;
}

export interface MeetingItem {
  id: string;
  meeting_id: string;
  item_number: number;
  topic: string;
  discussion: string | null;
  decision: string | null;
  responsible_name: string | null;
  responsible_id: string | null;
  deadline: string | null;
  status: "open" | "in_progress" | "completed";
  linked_avvik_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  company_id: string;
  project_id: string;
  meeting_number: string;
  meeting_type: string;
  title: string;
  meeting_date: string;
  location: string | null;
  participants: MeetingParticipant[];
  agenda: string | null;
  notes: string | null;
  status: "draft" | "completed" | "sent";
  pdf_path: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  items?: MeetingItem[];
}

export interface NewMeetingInput {
  meeting_type: string;
  title: string;
  meeting_date: string;
  location?: string;
  participants?: MeetingParticipant[];
  agenda?: string;
  notes?: string;
}

export interface NewMeetingItemInput {
  topic: string;
  discussion?: string;
  decision?: string;
  responsible_name?: string;
  responsible_id?: string;
  deadline?: string;
  status?: "open" | "in_progress" | "completed";
  linked_avvik_id?: string;
}

export function useKsModule2Meetings(projectId: string | null) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMeetings = useCallback(async () => {
    if (!projectId) {
      setMeetings([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("ks_module2_meetings")
        .select("*")
        .eq("project_id", projectId)
        .order("meeting_date", { ascending: false });

      if (error) throw error;

      const meetingsData = (data || []).map(m => ({
        ...m,
        participants: Array.isArray(m.participants) ? m.participants as unknown as MeetingParticipant[] : [],
      })) as Meeting[];

      setMeetings(meetingsData);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke hente møtereferater",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const createMeeting = async (input: NewMeetingInput): Promise<Meeting | null> => {
    if (!profile?.company_id || !projectId) {
      toast({
        title: "Feil",
        description: "Mangler prosjekt eller bedriftsinformasjon",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from("ks_module2_meetings")
        .insert([{
          company_id: profile.company_id,
          project_id: projectId,
          meeting_type: input.meeting_type,
          title: input.title,
          meeting_date: input.meeting_date,
          location: input.location || null,
          participants: JSON.parse(JSON.stringify(input.participants || [])),
          agenda: input.agenda || null,
          notes: input.notes || null,
          created_by: profile.id,
          created_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Opprettet",
        description: "Møtereferat opprettet",
      });

      await fetchMeetings();
      return {
        ...data,
        participants: Array.isArray(data.participants) ? data.participants as unknown as MeetingParticipant[] : [],
      } as Meeting;
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke opprette møtereferat",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateMeeting = async (id: string, updates: Partial<NewMeetingInput & { status: string }>) => {
    try {
      setIsSaving(true);
      const dbUpdates: Record<string, unknown> = { ...updates };
      if (updates.participants) {
        dbUpdates.participants = updates.participants as unknown as Record<string, unknown>[];
      }
      const { error } = await supabase
        .from("ks_module2_meetings")
        .update(dbUpdates as any)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Oppdatert",
        description: "Møtereferat oppdatert",
      });

      await fetchMeetings();
      return true;
    } catch (error) {
      console.error("Error updating meeting:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere møtereferat",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ks_module2_meetings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Slettet",
        description: "Møtereferat slettet",
      });

      await fetchMeetings();
      return true;
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette møtereferat",
        variant: "destructive",
      });
      return false;
    }
  };

  // Meeting items functions
  const fetchMeetingItems = async (meetingId: string): Promise<MeetingItem[]> => {
    try {
      const { data, error } = await supabase
        .from("ks_module2_meeting_items")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("item_number", { ascending: true });

      if (error) throw error;
      return (data || []) as MeetingItem[];
    } catch (error) {
      console.error("Error fetching meeting items:", error);
      return [];
    }
  };

  const addMeetingItem = async (meetingId: string, input: NewMeetingItemInput): Promise<MeetingItem | null> => {
    try {
      // Get next item number
      const { data: existingItems } = await supabase
        .from("ks_module2_meeting_items")
        .select("item_number")
        .eq("meeting_id", meetingId)
        .order("item_number", { ascending: false })
        .limit(1);

      const nextNumber = existingItems && existingItems.length > 0 
        ? (existingItems[0].item_number + 1) 
        : 1;

      const { data, error } = await supabase
        .from("ks_module2_meeting_items")
        .insert([{
          meeting_id: meetingId,
          item_number: nextNumber,
          topic: input.topic,
          discussion: input.discussion || null,
          decision: input.decision || null,
          responsible_name: input.responsible_name || null,
          responsible_id: input.responsible_id || null,
          deadline: input.deadline || null,
          status: input.status || "open",
          linked_avvik_id: input.linked_avvik_id || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as MeetingItem;
    } catch (error) {
      console.error("Error adding meeting item:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke legge til sak",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateMeetingItem = async (itemId: string, updates: Partial<NewMeetingItemInput>) => {
    try {
      const { error } = await supabase
        .from("ks_module2_meeting_items")
        .update(updates)
        .eq("id", itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating meeting item:", error);
      return false;
    }
  };

  const deleteMeetingItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("ks_module2_meeting_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting meeting item:", error);
      return false;
    }
  };

  return {
    meetings,
    isLoading,
    isSaving,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    fetchMeetingItems,
    addMeetingItem,
    updateMeetingItem,
    deleteMeetingItem,
    refetch: fetchMeetings,
  };
}
