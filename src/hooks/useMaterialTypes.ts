import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type MaterialUnit = "stk" | "m" | "kg" | "liter" | "pakke" | "rull" | "flaske" | "time";

export const MATERIAL_UNIT_LABELS: Record<MaterialUnit, string> = {
  stk: "Stk",
  m: "Meter",
  kg: "Kg",
  liter: "Liter",
  pakke: "Pakke",
  rull: "Rull",
  flaske: "Flaske",
  time: "Time",
};

export const MATERIAL_UNITS = Object.keys(MATERIAL_UNIT_LABELS) as MaterialUnit[];

export interface MaterialType {
  id: string;
  company_id: string;
  name: string;
  unit: string;
  unit_price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Vanlige materialer som foreslås hvis bedriften ikke har egen liste ennå */
export const MATERIAL_SUGGESTIONS: { name: string; unit: MaterialUnit }[] = [
  { name: "Sveisetråd", unit: "kg" },
  { name: "Kappeskiver", unit: "stk" },
  { name: "Slipeskiver", unit: "stk" },
  { name: "Spiker", unit: "pakke" },
  { name: "Skruer", unit: "pakke" },
  { name: "Gass", unit: "flaske" },
  { name: "Elektroder", unit: "stk" },
  { name: "Silikon", unit: "stk" },
  { name: "Tape", unit: "rull" },
  { name: "Kabel", unit: "m" },
];

export function useMaterialTypes(opts?: { onlyActive?: boolean }) {
  const { profile } = useAuth();
  const [types, setTypes] = useState<MaterialType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const onlyActive = opts?.onlyActive;

  const fetchTypes = useCallback(async () => {
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    let q = supabase
      .from("company_material_types")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (onlyActive) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) {
      console.error(error);
      toast.error("Kunne ikke hente materialliste");
    } else {
      setTypes((data || []) as MaterialType[]);
    }
    setIsLoading(false);
  }, [profile?.company_id, onlyActive]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const createType = async (input: { name: string; unit: string; unit_price?: number; is_active?: boolean; sort_order?: number }) => {
    if (!profile?.company_id) return false;
    const { error } = await supabase.from("company_material_types").insert({
      company_id: profile.company_id,
      name: input.name,
      unit: input.unit,
      unit_price: input.unit_price ?? 0,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? 100,
    });
    if (error) {
      toast.error("Kunne ikke opprette: " + error.message);
      return false;
    }
    toast.success("Material lagt til");
    await fetchTypes();
    return true;
  };

  const updateType = async (id: string, patch: Partial<Pick<MaterialType, "name" | "unit" | "unit_price" | "is_active" | "sort_order">>) => {
    const { error } = await supabase.from("company_material_types").update(patch).eq("id", id);
    if (error) {
      toast.error("Kunne ikke oppdatere: " + error.message);
      return false;
    }
    toast.success("Lagret");
    await fetchTypes();
    return true;
  };

  const deleteType = async (id: string) => {
    const { error } = await supabase.from("company_material_types").delete().eq("id", id);
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
