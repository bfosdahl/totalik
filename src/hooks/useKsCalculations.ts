import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KsCalculation {
  id: string;
  company_id: string;
  project_id: string | null;
  calculation_number: string;
  title: string;
  description: string | null;
  client_name: string | null;
  status: string;
  created_by_id: string | null;
  created_by_name: string;
  markup_percent: number;
  vat_percent: number;
  total_hours_cost: number;
  total_materials_cost: number;
  total_equipment_cost: number;
  total_other_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface KsCalculationItem {
  id: string;
  calculation_id: string;
  category: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_percent: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export function useKsCalculations() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: calculations = [], isLoading } = useQuery({
    queryKey: ["ks-calculations", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("ks_calculations")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as KsCalculation[];
    },
    enabled: !!companyId,
  });

  const generateNumber = async (): Promise<string> => {
    if (!companyId) return "KALK-001";
    const { data } = await supabase
      .from("ks_calculations")
      .select("calculation_number")
      .eq("company_id", companyId)
      .like("calculation_number", "KALK-%");
    
    let maxNum = 0;
    if (data) {
      data.forEach((row: any) => {
        const match = row.calculation_number.match(/KALK-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
    }
    return `KALK-${String(maxNum + 1).padStart(3, "0")}`;
  };

  const createCalculation = useMutation({
    mutationFn: async (input: { title: string; description?: string; client_name?: string; project_id?: string }) => {
      if (!companyId || !profile) throw new Error("Mangler bedrift");
      const calcNumber = await generateNumber();
      const { data, error } = await supabase
        .from("ks_calculations")
        .insert({
          company_id: companyId,
          calculation_number: calcNumber,
          title: input.title,
          description: input.description || null,
          client_name: input.client_name || null,
          project_id: input.project_id || null,
          created_by_id: profile.id,
          created_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Ukjent",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-calculations"] });
      toast.success("Kalkyle opprettet");
    },
    onError: () => toast.error("Kunne ikke opprette kalkyle"),
  });

  const deleteCalculation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ks_calculations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-calculations"] });
      toast.success("Kalkyle slettet");
    },
    onError: () => toast.error("Kunne ikke slette kalkyle"),
  });

  const updateCalculation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KsCalculation> & { id: string }) => {
      const { error } = await supabase.from("ks_calculations").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-calculations"] });
    },
    onError: () => toast.error("Kunne ikke oppdatere kalkyle"),
  });

  const duplicateCalculation = useMutation({
    mutationFn: async (sourceId: string) => {
      if (!companyId || !profile) throw new Error("Mangler bedrift");
      // Get source calculation
      const { data: source, error: srcErr } = await supabase
        .from("ks_calculations")
        .select("*")
        .eq("id", sourceId)
        .single();
      if (srcErr || !source) throw srcErr || new Error("Fant ikke kalkyle");
      
      // Get source items
      const { data: sourceItems } = await supabase
        .from("ks_calculation_items")
        .select("*")
        .eq("calculation_id", sourceId)
        .order("sort_order", { ascending: true });

      const calcNumber = await generateNumber();
      const { data: newCalc, error: createErr } = await supabase
        .from("ks_calculations")
        .insert({
          company_id: companyId,
          calculation_number: calcNumber,
          title: `${source.title} (kopi)`,
          description: source.description,
          client_name: source.client_name,
          project_id: source.project_id,
          created_by_id: profile.id,
          created_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Ukjent",
          markup_percent: source.markup_percent,
          vat_percent: source.vat_percent,
        })
        .select()
        .single();
      if (createErr) throw createErr;

      // Copy items
      if (sourceItems && sourceItems.length > 0) {
        const newItems = sourceItems.map((item: any) => ({
          calculation_id: newCalc.id,
          category: item.category,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          discount_percent: item.discount_percent || 0,
          notes: item.notes,
          sort_order: item.sort_order,
        }));
        await supabase.from("ks_calculation_items").insert(newItems);
      }

      return newCalc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-calculations"] });
      toast.success("Kalkyle duplisert");
    },
    onError: () => toast.error("Kunne ikke duplisere kalkyle"),
  });

  return { calculations, isLoading, createCalculation, deleteCalculation, updateCalculation, duplicateCalculation };
}

export function useKsCalculationItems(calculationId: string | null) {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["ks-calculation-items", calculationId],
    queryFn: async () => {
      if (!calculationId) return [];
      const { data, error } = await supabase
        .from("ks_calculation_items")
        .select("*")
        .eq("calculation_id", calculationId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as KsCalculationItem[];
    },
    enabled: !!calculationId,
  });

  const addItem = useMutation({
    mutationFn: async (input: { category: string; description: string; unit?: string; quantity: number; unit_price: number }) => {
      if (!calculationId) throw new Error("No calculation");
      const { data, error } = await supabase
        .from("ks_calculation_items")
        .insert({ calculation_id: calculationId, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-calculation-items", calculationId] });
    },
    onError: () => toast.error("Kunne ikke legge til post"),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ks_calculation_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-calculation-items", calculationId] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KsCalculationItem> & { id: string }) => {
      const { error } = await supabase.from("ks_calculation_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ks-calculation-items", calculationId] });
    },
  });

  return { items, isLoading, addItem, deleteItem, updateItem };
}
