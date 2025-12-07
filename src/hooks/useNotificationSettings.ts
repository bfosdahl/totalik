import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NotificationSettings {
  id: string;
  user_id: string;
  company_id: string;
  push_enabled: boolean;
  notify_deadlines: boolean;
  notify_assignments: boolean;
  notify_status_changes: boolean;
  notify_days_before: number[];
  created_at: string;
  updated_at: string;
}

export function useNotificationSettings() {
  const { user, company } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["notification-settings", user?.id],
    queryFn: async () => {
      if (!user?.id || !company?.id) return null;

      // Try to get existing settings
      const { data, error } = await supabase
        .from("user_notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default ones
      if (!data) {
        const { data: newData, error: createError } = await supabase
          .from("user_notification_settings")
          .insert({
            user_id: user.id,
            company_id: company.id,
            push_enabled: true,
            notify_deadlines: true,
            notify_assignments: true,
            notify_status_changes: true,
            notify_days_before: [7, 3, 1],
          })
          .select()
          .single();

        if (createError) throw createError;
        return newData as NotificationSettings;
      }

      return data as NotificationSettings;
    },
    enabled: !!user?.id && !!company?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<NotificationSettings, "id" | "user_id" | "company_id" | "created_at" | "updated_at">>) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_notification_settings")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      toast.success("Varslingsinnstillinger lagret");
    },
    onError: (error) => {
      console.error("Error updating notification settings:", error);
      toast.error("Kunne ikke lagre innstillinger");
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
