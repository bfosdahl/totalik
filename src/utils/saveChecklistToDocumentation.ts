import { supabase } from "@/integrations/supabase/client";
import { generateKsModule2ChecklistPdf } from "./ksModule2ChecklistPdf";
import { KsModule2Checklist, ChecklistItem } from "@/hooks/useKsModule2Checklists";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";
import { format } from "date-fns";

interface Company {
  name: string;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  org_number?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface SaveChecklistOptions {
  checklist: KsModule2Checklist;
  project: KsModule2Project;
  company: Company;
  uploadedByName: string;
}

/**
 * Generates a PDF from a completed checklist and saves it to the documentation folder
 * Returns the document ID if successful, null otherwise
 */
export async function saveChecklistToDocumentation(options: SaveChecklistOptions): Promise<string | null> {
  const { checklist, project, company, uploadedByName } = options;

  try {
    // Generate the PDF
    const { blob, fileName } = await generateKsModule2ChecklistPdf({
      checklist,
      project,
      company,
    });

    // Create a unique file path
    const storagePath = `${project.id}/30/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("ks-module2-documents")
      .upload(storagePath, blob, {
        contentType: "application/pdf",
      });

    if (uploadError) {
      console.error("Error uploading checklist PDF:", uploadError);
      return null;
    }

    // Create document record in database
    const { data: docData, error: dbError } = await supabase
      .from("ks_module2_documents")
      .insert({
        company_id: project.company_id,
        project_id: project.id,
        document_name: fileName,
        document_type: "egenkontroll",
        folder_path: "30",
        file_path: storagePath,
        file_size: blob.size,
        file_type: "application/pdf",
        source_type: "egenkontroll",
        source_id: checklist.id,
        include_in_report: true,
        uploaded_by_name: uploadedByName,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Error saving checklist document record:", dbError);
      // Try to clean up the uploaded file
      await supabase.storage.from("ks-module2-documents").remove([storagePath]);
      return null;
    }

    // Update the checklist with the PDF path
    await supabase
      .from("ks_module2_checklists" as any)
      .update({ pdf_file_path: storagePath })
      .eq("id", checklist.id);

    return docData?.id || null;
  } catch (error) {
    console.error("Error saving checklist to documentation:", error);
    return null;
  }
}

/**
 * Helper to download a checklist PDF (for viewing completed checklists)
 */
export async function downloadChecklistPdf(options: Omit<SaveChecklistOptions, "uploadedByName">): Promise<void> {
  const { checklist, project, company } = options;

  try {
    const { blob, fileName } = await generateKsModule2ChecklistPdf({
      checklist,
      project,
      company,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading checklist PDF:", error);
    throw error;
  }
}
