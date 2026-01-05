import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ModuleType = "IK_HMS" | "IK_MAT" | "IK_ALKOHOL" | "IK_BYGG" | "PERSONALHANDBOK" | "GDPR" | "APENHETSLOVEN" | "AVDELINGER" | "KS" | "HR" | "TIMEREGISTRERING";

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
  const { profile, isLoading: authLoading } = useAuth();
  const [modules, setModules] = useState<CompanyModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Only use profile.company_id if we're not given a specific companyId
  const targetCompanyId = companyId || profile?.company_id;

  useEffect(() => {
    // CRITICAL: While auth is still loading, keep this hook loading
    // This prevents premature "no modules" state before we know the user's company
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    // Auth is done. If no targetCompanyId, user has no company - stop loading
    if (!targetCompanyId) {
      setModules([]);
      setIsLoading(false);
      return;
    }

    // Fetch modules for the company
    const fetchModules = async () => {
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
        setModules([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [targetCompanyId, authLoading]);

  const hasModule = (moduleType: ModuleType): boolean => {
    const module = modules.find(m => m.module_type === moduleType);
    return module?.is_active ?? false;
  };

  const hasAnyModule = (moduleTypes: ModuleType[]): boolean => {
    return moduleTypes.some(type => hasModule(type));
  };

  // Get the industry setting from IK_HMS module
  const getIndustry = (): string | null => {
    const ikhmsModule = modules.find(m => m.module_type === 'IK_HMS');
    return ikhmsModule?.settings?.industry || null;
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

  return { modules, isLoading, hasModule, hasAnyModule, getIndustry, refetch };
}
