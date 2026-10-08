import { supabase } from "@/integrations/supabase/client";
import { firstCas, sdsExtraToDb, type SdsExtra } from "@/lib/sdsFields";

// Sanitize a file name for use as a storage key: drop diacritics, map æøå to
// ae/o/a and replace anything outside a-zA-Z0-9.- with an underscore.
export function sanitizeSdsFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[æÆ]/g, "ae")
    .replace(/[øØ]/g, "o")
    .replace(/[åÅ]/g, "a")
    .replace(/[^a-zA-Z0-9.-]/g, "_");
}

export interface GlobalChemicalSdsInput {
  productName: string;
  manufacturer?: string;
  casNumber?: string;
  dangerClasses: string[];
  notes?: string;
  sdsExtra?: SdsExtra;
  sdsFile?: File;
}

// Insert a global chemical, then upload its SDS (if any) to global-sds-files
// and record it as version 1. A failed upload is logged and does not fail the
// chemical creation. Returns the inserted global chemical row.
export async function createGlobalChemicalWithSds(
  input: GlobalChemicalSdsInput,
): Promise<any> {
  const { productName, manufacturer, casNumber, dangerClasses, notes, sdsExtra, sdsFile } =
    input;

  const extra = sdsExtra ? sdsExtraToDb(sdsExtra) : null;
  const first = sdsExtra ? firstCas(sdsExtra.cas_numbers) : "";

  // 1. Create global chemical
  const { data: globalChemical, error: chemError } = await supabase
    .from("global_chemicals" as any)
    .insert({
      product_name: productName,
      manufacturer: manufacturer || null,
      cas_number: (casNumber || first) || null,
      danger_classes: dangerClasses,
      notes: notes || null,
      ...(extra ?? {}),
    } as any)
    .select()
    .single();

  if (chemError) throw chemError;

  // 2. Upload SDS file if provided
  if (sdsFile && (globalChemical as any).id) {
    const sanitizedName = sanitizeSdsFileName(sdsFile.name);

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
}
