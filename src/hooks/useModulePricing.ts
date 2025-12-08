import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ModulePricing {
  id: string;
  module_type: string;
  module_name: string;
  description: string | null;
  price_monthly: number;
  is_active: boolean;
}

export function useModulePricing() {
  const { data: pricing, isLoading } = useQuery({
    queryKey: ["module-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_pricing")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data as ModulePricing[];
    },
  });

  const getPricing = (moduleType: string): ModulePricing | null => {
    return pricing?.find((p) => p.module_type === moduleType) || null;
  };

  return { pricing, isLoading, getPricing };
}
