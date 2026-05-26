import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GlobalChemical {
  id: string;
  product_name: string;
  cas_number: string | null;
  manufacturer: string | null;
  danger_classes: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GlobalChemicalSdsVersion {
  id: string;
  global_chemical_id: string;
  version_number: number;
  sds_file_path: string;
  file_name: string | null;
  file_size: number | null;
  uploaded_at: string;
  is_current: boolean;
  notes: string | null;
}

export interface CompanyChemicalEntry {
  id: string;
  company_id: string;
  project_id: string | null;
  global_chemical_id: string;
  location: string | null;
  custom_notes: string | null;
  quantity: string | null;
  last_updated: string;
  created_at: string;
  updated_at: string;
  // Joined data
  global_chemical?: GlobalChemical;
  current_sds?: GlobalChemicalSdsVersion;
}

export interface GlobalChemicalWithSds extends GlobalChemical {
  current_sds?: GlobalChemicalSdsVersion;
}

// Search for chemicals in the global registry
export const useSearchGlobalChemicals = (searchQuery: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["global-chemicals-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      // Search by product name, CAS number, or manufacturer
      // Use LEFT JOIN (no !inner) to include chemicals without SDS files
      const { data, error } = await supabase
        .from("global_chemicals" as any)
        .select(`
          *,
          global_chemical_sds_versions(*)
        `)
        .or(`product_name.ilike.%${searchQuery}%,cas_number.ilike.%${searchQuery}%,manufacturer.ilike.%${searchQuery}%`)
        .order("product_name", { ascending: true })
        .limit(20);

      if (error) throw error;

      // Transform to include current SDS
      return ((data as any[]) || []).map(chemical => {
        const versions = chemical.global_chemical_sds_versions || [];
        const currentSds = versions.find((v: GlobalChemicalSdsVersion) => v.is_current);
        return {
          ...chemical,
          current_sds: currentSds,
          global_chemical_sds_versions: undefined
        } as GlobalChemicalWithSds;
      });
    },
    enabled: enabled && searchQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });
};

// Get company's chemical entries for a project
export const useCompanyChemicals = (projectId: string | null) => {
  const { company } = useAuth();

  return useQuery({
    queryKey: ["company-chemicals", projectId, company?.id],
    queryFn: async () => {
      if (!projectId || !company?.id) return [];

      const { data, error } = await supabase
        .from("company_chemical_entries" as any)
        .select(`
          *,
          global_chemicals:global_chemical_id(
            *,
            global_chemical_sds_versions(*)
          )
        `)
        .eq("project_id", projectId)
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data structure
      return ((data as any[]) || []).map(entry => {
        const globalChemical = entry.global_chemicals;
        const versions = globalChemical?.global_chemical_sds_versions || [];
        const currentSds = versions.find((v: GlobalChemicalSdsVersion) => v.is_current);
        
        return {
          ...entry,
          global_chemical: {
            ...globalChemical,
            global_chemical_sds_versions: undefined
          },
          current_sds: currentSds,
          global_chemicals: undefined
        } as CompanyChemicalEntry;
      });
    },
    enabled: !!projectId && !!company?.id,
  });
};

// Hook for all chemical operations
export const useGlobalChemicalRegistry = (projectId: string | null) => {
  const queryClient = useQueryClient();
  const { company } = useAuth();

  // Add existing global chemical to company's registry
  const addExistingChemical = useMutation({
    mutationFn: async ({ 
      globalChemicalId, 
      location, 
      customNotes,
      quantity
    }: { 
      globalChemicalId: string; 
      location?: string; 
      customNotes?: string;
      quantity?: string;
    }) => {
      if (!company?.id || !projectId) throw new Error("Mangler bedrift eller prosjekt");

      const { data, error } = await supabase
        .from("company_chemical_entries" as any)
        .insert({
          company_id: company.id,
          project_id: projectId,
          global_chemical_id: globalChemicalId,
          location: location || null,
          custom_notes: customNotes || null,
          quantity: quantity || null,
          last_updated: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") { // Unique constraint violation
          throw new Error("Dette stoffet er allerede lagt til i prosjektet");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-chemicals", projectId] });
      toast.success("Stoff lagt til fra registeret");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke legge til stoff");
    },
  });

  // Create new global chemical with SDS and add to company registry
  const createNewChemical = useMutation({
    mutationFn: async ({
      productName,
      manufacturer,
      casNumber,
      dangerClasses,
      notes,
      sdsFile,
      location,
      customNotes,
      quantity
    }: {
      productName: string;
      manufacturer?: string;
      casNumber?: string;
      dangerClasses: string[];
      notes?: string;
      sdsFile?: File;
      location?: string;
      customNotes?: string;
      quantity?: string;
    }) => {
      if (!company?.id || !projectId) throw new Error("Mangler bedrift eller prosjekt");

      // 1. Create global chemical
      const { data: globalChemical, error: chemError } = await supabase
        .from("global_chemicals" as any)
        .insert({
          product_name: productName,
          manufacturer: manufacturer || null,
          cas_number: casNumber || null,
          danger_classes: dangerClasses,
          notes: notes || null,
        } as any)
        .select()
        .single();

      if (chemError) throw chemError;

      // 2. Upload SDS file if provided
      if (sdsFile && (globalChemical as any).id) {
        const sanitizedName = sdsFile.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[æÆ]/g, "ae")
          .replace(/[øØ]/g, "o")
          .replace(/[åÅ]/g, "a")
          .replace(/[^a-zA-Z0-9.-]/g, "_");
        
        const filePath = `${(globalChemical as any).id}/${Date.now()}_${sanitizedName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("global-sds-files")
          .upload(filePath, sdsFile);

        if (uploadError) {
          console.error("SDS upload error:", uploadError);
        } else {
          // Create SDS version record
          await supabase
            .from("global_chemical_sds_versions" as any)
            .insert({
              global_chemical_id: (globalChemical as any).id,
              version_number: 1,
              sds_file_path: filePath,
              file_name: sdsFile.name,
              file_size: sdsFile.size,
              is_current: true,
            } as any);
        }
      }

      // 3. Add to company's registry
      const { data: companyEntry, error: entryError } = await supabase
        .from("company_chemical_entries" as any)
        .insert({
          company_id: company.id,
          project_id: projectId,
          global_chemical_id: (globalChemical as any).id,
          location: location || null,
          custom_notes: customNotes || null,
          quantity: quantity || null,
          last_updated: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (entryError) throw entryError;

      return { globalChemical, companyEntry };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-chemicals", projectId] });
      queryClient.invalidateQueries({ queryKey: ["global-chemicals-search"] });
      toast.success("Nytt stoff opprettet og lagt til");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke opprette stoff");
    },
  });

  // Update company chemical entry (location, notes, etc.)
  const updateCompanyEntry = useMutation({
    mutationFn: async ({ 
      id, 
      location, 
      customNotes,
      quantity
    }: { 
      id: string; 
      location?: string; 
      customNotes?: string;
      quantity?: string;
    }) => {
      const { data, error } = await supabase
        .from("company_chemical_entries" as any)
        .update({
          location: location ?? null,
          custom_notes: customNotes ?? null,
          quantity: quantity ?? null,
          last_updated: new Date().toISOString(),
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-chemicals", projectId] });
      toast.success("Stoff oppdatert");
    },
    onError: () => {
      toast.error("Kunne ikke oppdatere stoff");
    },
  });

  // Remove chemical from company's registry
  const removeFromRegistry = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from("company_chemical_entries" as any)
        .delete()
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-chemicals", projectId] });
      toast.success("Stoff fjernet fra stoffkartoteket");
    },
    onError: () => {
      toast.error("Kunne ikke fjerne stoff");
    },
  });

  // Get SDS download URL. Tries the primary bucket first, then falls back to the alternative
  // (some SDS files were uploaded to ik-hms-sds before the global-sds-files migration).
  const getSdsDownloadUrl = async (sdsFilePath: string, isGlobal: boolean = true): Promise<string | null> => {
    const buckets = isGlobal
      ? ["global-sds-files", "ik-hms-sds"]
      : ["ik-hms-sds", "global-sds-files"];

    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(sdsFilePath, 3600);
        if (error) {
          console.warn(`[SDS] bucket=${bucket} path=${sdsFilePath} error=${error.message}`);
          continue;
        }
        if (data?.signedUrl) return data.signedUrl;
      } catch (e: any) {
        console.warn(`[SDS] bucket=${bucket} exception=${e?.message}`);
      }
    }
    console.error(`[SDS] No signed URL found for path=${sdsFilePath}`);
    return null;
  };

  return {
    addExistingChemical: addExistingChemical.mutate,
    createNewChemical: createNewChemical.mutate,
    updateCompanyEntry: updateCompanyEntry.mutate,
    removeFromRegistry: removeFromRegistry.mutate,
    getSdsDownloadUrl,
    isAdding: addExistingChemical.isPending,
    isCreating: createNewChemical.isPending,
    isUpdating: updateCompanyEntry.isPending,
    isRemoving: removeFromRegistry.isPending,
  };
};
