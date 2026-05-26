import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CompanyVehicle {
  id: string;
  company_id: string;
  license_plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vehicle_type: string;
  default_for_user_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VehicleInput {
  license_plate: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vehicle_type?: string;
  default_for_user_id?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export function useCompanyVehicles() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["company-vehicles", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from("company_vehicles" as any)
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("is_deleted", false)
        .order("license_plate", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as CompanyVehicle[];
    },
    enabled: !!profile?.company_id,
  });

  const create = useMutation({
    mutationFn: async (input: VehicleInput) => {
      if (!profile?.company_id) throw new Error("Mangler bedrift");
      const { data, error } = await supabase
        .from("company_vehicles" as any)
        .insert({
          ...input,
          company_id: profile.company_id,
          created_by: profile.user_id,
          vehicle_type: input.vehicle_type || "company",
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-vehicles"] });
      toast.success("Bil lagt til");
    },
    onError: (err: any) => toast.error(err.message || "Kunne ikke lagre bil"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: VehicleInput & { id: string }) => {
      const { data, error } = await supabase
        .from("company_vehicles" as any)
        .update(input as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-vehicles"] });
      toast.success("Bil oppdatert");
    },
    onError: (err: any) => toast.error(err.message || "Kunne ikke oppdatere"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("company_vehicles" as any)
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: profile?.user_id,
          is_active: false,
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-vehicles"] });
      toast.success("Bil arkivert");
    },
    onError: (err: any) => toast.error(err.message || "Kunne ikke slette"),
  });

  return {
    vehicles: list.data || [],
    isLoading: list.isLoading,
    create,
    update,
    remove,
  };
}
