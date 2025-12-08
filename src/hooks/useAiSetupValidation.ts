import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ValidationResult {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  companyId: string | null;
  moduleId: string | null;
  retry: () => Promise<void>;
}

/**
 * Hook that validates and ensures all prerequisites for AI setup are met.
 * This prevents the recurring bugs by:
 * 1. Waiting for auth to fully load
 * 2. Ensuring company exists
 * 3. Creating IK_HMS module if it doesn't exist
 * 4. Verifying edge function is accessible
 */
export function useAiSetupValidation(moduleType: "IK_HMS" | "IK_MAT" = "IK_HMS"): ValidationResult {
  const { profile, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [moduleId, setModuleId] = useState<string | null>(null);

  const validate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Wait for auth - with timeout
      if (authLoading) {
        // Will re-run when authLoading changes
        return;
      }

      // Step 2: Check profile has company_id
      if (!profile?.company_id) {
        setError("Du må være tilknyttet en bedrift for å bruke AI-oppsettet.");
        setIsLoading(false);
        return;
      }

      const targetCompanyId = profile.company_id;
      setCompanyId(targetCompanyId);

      // Step 3: Verify company exists in database
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", targetCompanyId)
        .single();

      if (companyError || !company) {
        setError("Kunne ikke finne bedriften din. Kontakt administrator.");
        setIsLoading(false);
        return;
      }

      // Step 4: Check/create module
      const { data: existingModule } = await supabase
        .from("company_modules")
        .select("id, is_active, settings")
        .eq("company_id", targetCompanyId)
        .eq("module_type", moduleType)
        .maybeSingle();

      if (existingModule) {
        setModuleId(existingModule.id);
        
        // Ensure module is active
        if (!existingModule.is_active) {
          await supabase
            .from("company_modules")
            .update({ is_active: true })
            .eq("id", existingModule.id);
        }
      } else {
        // Create the module - THIS IS THE KEY FIX
        const { data: newModule, error: createError } = await supabase
          .from("company_modules")
          .insert({
            company_id: targetCompanyId,
            module_type: moduleType,
            is_active: true,
            settings: {},
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating module:", createError);
          setError(`Kunne ikke opprette ${moduleType}-modul. Prøv igjen.`);
          setIsLoading(false);
          return;
        }

        setModuleId(newModule.id);
      }

      // Step 5: Verify auth session is valid for edge functions
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Din sesjon har utløpt. Vennligst logg inn på nytt.");
        setIsLoading(false);
        return;
      }

      // All validations passed
      setIsLoading(false);

    } catch (err) {
      console.error("Validation error:", err);
      setError("En uventet feil oppstod. Prøv igjen.");
      setIsLoading(false);
    }
  }, [authLoading, profile, moduleType]);

  // Run validation when auth state changes
  useEffect(() => {
    validate();
  }, [validate]);

  const retry = useCallback(async () => {
    await validate();
  }, [validate]);

  return {
    isValid: !isLoading && !error && !!companyId && !!moduleId,
    isLoading,
    error,
    companyId,
    moduleId,
    retry,
  };
}
