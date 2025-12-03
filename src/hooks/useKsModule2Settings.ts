import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface KsModule2Settings {
  id: string;
  company_id: string;
  default_deadline_days: number;
  email_notifications_enabled: boolean;
  weekly_report_enabled: boolean;
  logo_url: string | null;
  accent_color: string;
  created_at: string;
  updated_at: string;
}

export function useKsModule2Settings() {
  const { company } = useAuth();
  const companyId = company?.id;
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["ks-module2-settings", companyId],
    queryFn: async () => {
      // First try to get existing settings
      const { data, error } = await supabase
        .from("ks_module2_settings" as any)
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default ones
      if (!data) {
        const { data: newData, error: createError } = await supabase
          .from("ks_module2_settings" as any)
          .insert({
            company_id: companyId,
            default_deadline_days: 7,
            email_notifications_enabled: true,
            weekly_report_enabled: true,
            accent_color: "#5B6BFF",
          })
          .select()
          .single();

        if (createError) throw createError;
        return newData as unknown as KsModule2Settings;
      }

      return data as unknown as KsModule2Settings;
    },
    enabled: !!companyId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<KsModule2Settings, "id" | "company_id" | "created_at" | "updated_at">>) => {
      const { data, error } = await supabase
        .from("ks_module2_settings" as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-module2-settings"] });
      toast.success("Innstillinger lagret");
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
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
