import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ModuleType = "IK_HMS" | "IK_MAT" | "IK_ALKOHOL" | "KS_BYGG" | "PERSONALHANDBOK";

export interface CompanyModule {
  id: string;
  company_id: string;
  module_type: string;
  is_active: boolean;
  settings: any;
  created_at: string;
  updated_at: string;
}

export function useCompanyModules(companyId?: string) {
  const { profile } = useAuth();
  const [modules, setModules] = useState<CompanyModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const targetCompanyId = companyId || profile?.company_id;

  useEffect(() => {
    const fetchModules = async () => {
      if (!targetCompanyId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("company_modules")
          .select("*")
          .eq("company_id", targetCompanyId);

        if (error) throw error;
        setModules(data || []);
      } catch (error) {
        console.error("Error fetching company modules:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [targetCompanyId]);

  const hasModule = (moduleType: ModuleType): boolean => {
    const module = modules.find(m => m.module_type === moduleType);
    return module?.is_active ?? false;
  };

  const hasAnyModule = (moduleTypes: ModuleType[]): boolean => {
    return moduleTypes.some(type => hasModule(type));
  };

  const refetch = async () => {
    if (!targetCompanyId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("company_modules")
        .select("*")
        .eq("company_id", targetCompanyId);

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error("Error fetching company modules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { modules, isLoading, hasModule, hasAnyModule, refetch };
}
