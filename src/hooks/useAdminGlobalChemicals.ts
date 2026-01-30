import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { GlobalChemical, GlobalChemicalSdsVersion } from "./useGlobalChemicalRegistry";

export interface GlobalChemicalWithStats extends GlobalChemical {
  current_sds?: GlobalChemicalSdsVersion;
  company_count?: number;
  sds_versions?: GlobalChemicalSdsVersion[];
}

// Fetch all global chemicals for admin
export const useAllGlobalChemicals = () => {
  return useQuery({
    queryKey: ["admin-global-chemicals"],
    queryFn: async () => {
      // Get all global chemicals with their SDS versions
      const { data, error } = await supabase
        .from("global_chemicals" as any)
        .select(`
          *,
          global_chemical_sds_versions(*)
        `)
        .order("product_name", { ascending: true });

      if (error) throw error;

      // Get company usage counts
      const { data: usageData, error: usageError } = await supabase
        .from("company_chemical_entries" as any)
        .select("global_chemical_id");

      if (usageError) throw usageError;

      // Count usage per chemical
      const usageMap = new Map<string, number>();
      ((usageData as any[]) || []).forEach((entry) => {
        const id = entry.global_chemical_id;
        usageMap.set(id, (usageMap.get(id) || 0) + 1);
      });

      // Transform data
      return ((data as any[]) || []).map((chemical) => {
        const versions = chemical.global_chemical_sds_versions || [];
        const currentSds = versions.find((v: GlobalChemicalSdsVersion) => v.is_current);
        
        return {
          ...chemical,
          current_sds: currentSds,
          sds_versions: versions,
          company_count: usageMap.get(chemical.id) || 0,
          global_chemical_sds_versions: undefined,
        } as GlobalChemicalWithStats;
      });
    },
  });
};

// Admin operations for global chemicals
export const useAdminGlobalChemicals = () => {
  const queryClient = useQueryClient();

  // Create new global chemical
  const createChemical = useMutation({
    mutationFn: async ({
      productName,
      manufacturer,
      casNumber,
      dangerClasses,
      notes,
      sdsFile,
    }: {
      productName: string;
      manufacturer?: string;
      casNumber?: string;
      dangerClasses: string[];
      notes?: string;
      sdsFile?: File;
    }) => {
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

      return globalChemical;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-global-chemicals"] });
      toast.success("Kjemikalie opprettet i globalt register");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke opprette kjemikalie");
    },
  });

  // Update global chemical
  const updateChemical = useMutation({
    mutationFn: async ({
      id,
      productName,
      manufacturer,
      casNumber,
      dangerClasses,
      notes,
    }: {
      id: string;
      productName: string;
      manufacturer?: string;
      casNumber?: string;
      dangerClasses: string[];
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("global_chemicals" as any)
        .update({
          product_name: productName,
          manufacturer: manufacturer || null,
          cas_number: casNumber || null,
          danger_classes: dangerClasses,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-global-chemicals"] });
      toast.success("Kjemikalie oppdatert");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke oppdatere kjemikalie");
    },
  });

  // Delete global chemical
  const deleteChemical = useMutation({
    mutationFn: async (id: string) => {
      // First delete SDS files from storage
      const { data: versions } = await supabase
        .from("global_chemical_sds_versions" as any)
        .select("sds_file_path")
        .eq("global_chemical_id", id);

      if (versions && versions.length > 0) {
        const filePaths = versions.map((v: any) => v.sds_file_path);
        await supabase.storage.from("global-sds-files").remove(filePaths);
      }

      // Delete SDS versions
      await supabase
        .from("global_chemical_sds_versions" as any)
        .delete()
        .eq("global_chemical_id", id);

      // Delete company entries
      await supabase
        .from("company_chemical_entries" as any)
        .delete()
        .eq("global_chemical_id", id);

      // Delete the chemical
      const { error } = await supabase
        .from("global_chemicals" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-global-chemicals"] });
      toast.success("Kjemikalie slettet fra globalt register");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke slette kjemikalie");
    },
  });

  // Upload new SDS version
  const uploadSdsVersion = useMutation({
    mutationFn: async ({
      chemicalId,
      sdsFile,
      notes,
    }: {
      chemicalId: string;
      sdsFile: File;
      notes?: string;
    }) => {
      // Get current max version number
      const { data: existingVersions } = await supabase
        .from("global_chemical_sds_versions" as any)
        .select("version_number")
        .eq("global_chemical_id", chemicalId)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = existingVersions && existingVersions.length > 0 
        ? (existingVersions[0] as any).version_number + 1 
        : 1;

      // Mark all existing versions as not current
      await supabase
        .from("global_chemical_sds_versions" as any)
        .update({ is_current: false } as any)
        .eq("global_chemical_id", chemicalId);

      // Upload new file
      const sanitizedName = sdsFile.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[æÆ]/g, "ae")
        .replace(/[øØ]/g, "o")
        .replace(/[åÅ]/g, "a")
        .replace(/[^a-zA-Z0-9.-]/g, "_");

      const filePath = `${chemicalId}/${Date.now()}_v${nextVersion}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("global-sds-files")
        .upload(filePath, sdsFile);

      if (uploadError) throw uploadError;

      // Create new version record
      const { data, error } = await supabase
        .from("global_chemical_sds_versions" as any)
        .insert({
          global_chemical_id: chemicalId,
          version_number: nextVersion,
          sds_file_path: filePath,
          file_name: sdsFile.name,
          file_size: sdsFile.size,
          is_current: true,
          notes: notes || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-global-chemicals"] });
      toast.success("Ny SDS-versjon lastet opp");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunne ikke laste opp SDS");
    },
  });

  // Get SDS download URL
  const getSdsDownloadUrl = async (sdsFilePath: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from("global-sds-files")
        .createSignedUrl(sdsFilePath, 3600);

      return data?.signedUrl || null;
    } catch {
      return null;
    }
  };

  return {
    createChemical: createChemical.mutate,
    updateChemical: updateChemical.mutate,
    deleteChemical: deleteChemical.mutate,
    uploadSdsVersion: uploadSdsVersion.mutate,
    getSdsDownloadUrl,
    isCreating: createChemical.isPending,
    isUpdating: updateChemical.isPending,
    isDeleting: deleteChemical.isPending,
    isUploading: uploadSdsVersion.isPending,
  };
};
