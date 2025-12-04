import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ModuleType = "IK_HMS" | "IK_MAT" | "IK_ALKOHOL" | "IK_BYGG" | "PERSONALHANDBOK" | "GDPR" | "APENHETSLOVEN";

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

  // CRITICAL: Determine if we should still be in loading state
  // We're loading if:
  // 1. Auth is still loading, OR
  // 2. Auth is done but we don't have a companyId param AND profile doesn't have company_id yet
  const shouldWaitForAuth = authLoading || (!companyId && !profile?.company_id);

  useEffect(() => {
    // If we should wait for auth, keep loading state true and don't fetch
    if (shouldWaitForAuth) {
      setIsLoading(true);
      return;
    }

    // At this point, auth is done. If still no targetCompanyId, user has no company
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
  }, [targetCompanyId, shouldWaitForAuth]);

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
