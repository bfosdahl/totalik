import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type AllowanceUnit = "hour" | "day" | "km" | "piece" | "fixed";

export interface AllowanceType {
  id: string;
  company_id: string;
  name: string;
  unit: AllowanceUnit;
  rate: number;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const ALLOWANCE_UNIT_LABELS: Record<AllowanceUnit, string> = {
  hour: "Time",
  day: "Dag",
  km: "Kilometer",
  piece: "Stk",
  fixed: "Fast beløp",
};

export function useAllowanceTypes(opts?: { onlyActive?: boolean }) {
  const { profile } = useAuth();
  const [types, setTypes] = useState<AllowanceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTypes = useCallback(async () => {
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    let q = supabase
      .from("company_allowance_types")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (opts?.onlyActive) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) {
      console.error(error);
      toast.error("Kunne ikke hente tilleggssatser");
    } else {
      setTypes((data || []) as AllowanceType[]);
    }
    setIsLoading(false);
  }, [profile?.company_id, opts?.onlyActive]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const createType = async (input: Omit<AllowanceType, "id" | "company_id" | "created_at" | "updated_at" | "is_default" | "sort_order"> & { sort_order?: number }) => {
    if (!profile?.company_id) return false;
    const { error } = await supabase.from("company_allowance_types").insert({
      company_id: profile.company_id,
      name: input.name,
      unit: input.unit,
      rate: input.rate,
      is_active: input.is_active,
      sort_order: input.sort_order ?? 100,
    });
    if (error) {
      toast.error("Kunne ikke opprette: " + error.message);
      return false;
    }
    toast.success("Tilleggssats opprettet");
    await fetchTypes();
    return true;
  };

  const updateType = async (id: string, patch: Partial<Omit<AllowanceType, "id" | "company_id" | "created_at" | "updated_at">>) => {
    const { error } = await supabase.from("company_allowance_types").update(patch).eq("id", id);
    if (error) {
      toast.error("Kunne ikke oppdatere: " + error.message);
      return false;
    }
    toast.success("Lagret");
    await fetchTypes();
    return true;
  };

  const deleteType = async (id: string) => {
    const { error } = await supabase.from("company_allowance_types").delete().eq("id", id);
    if (error) {
      toast.error("Kunne ikke slette: " + error.message);
      return false;
    }
    toast.success("Slettet");
    await fetchTypes();
    return true;
  };

  return { types, isLoading, createType, updateType, deleteType, refetch: fetchTypes };
}
