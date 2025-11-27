import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface DeviationAttachment {
  id: string;
  deviation_id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string;
  created_at: string;
}

export function useDeviationAttachments(deviationId: string | null) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [attachments, setAttachments] = useState<DeviationAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAttachments = async () => {
    if (!deviationId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("deviation_attachments")
        .select("*")
        .eq("deviation_id", deviationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data as DeviationAttachment[]);
    } catch (error: any) {
      console.error("Error fetching attachments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [deviationId]);

  const uploadAttachment = async (file: File) => {
    if (!deviationId || !profile?.company_id) {
      toast({
        title: "Feil",
        description: "Kan ikke laste opp fil",
        variant: "destructive",
      });
      return false;
    }

    setIsUploading(true);
    try {
      // Create unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${deviationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("deviation-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get display name
      const uploaderName = profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile.email || "Ukjent";

      // Save attachment record
      const { error: insertError } = await supabase
        .from("deviation_attachments")
        .insert({
          deviation_id: deviationId,
          company_id: profile.company_id,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: profile.id,
          uploaded_by_name: uploaderName,
        });

      if (insertError) throw insertError;

      toast({
        title: "Fil lastet opp",
        description: `${file.name} ble lastet opp`,
      });

      await fetchAttachments();
      return true;
    } catch (error: any) {
      console.error("Error uploading attachment:", error);
      toast({
        title: "Feil ved opplasting",
        description: error.message || "Kunne ikke laste opp filen",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAttachment = async (attachment: DeviationAttachment) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("deviation-attachments")
        .remove([attachment.file_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      // Delete record
      const { error: dbError } = await supabase
        .from("deviation_attachments")
        .delete()
        .eq("id", attachment.id);

      if (dbError) throw dbError;

      toast({
        title: "Fil slettet",
        description: `${attachment.file_name} ble slettet`,
      });

      await fetchAttachments();
      return true;
    } catch (error: any) {
      console.error("Error deleting attachment:", error);
      toast({
        title: "Feil ved sletting",
        description: error.message || "Kunne ikke slette filen",
        variant: "destructive",
      });
      return false;
    }
  };

  const getAttachmentUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from("deviation-attachments")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  return {
    attachments,
    isLoading,
    isUploading,
    uploadAttachment,
    deleteAttachment,
    getAttachmentUrl,
    refetch: fetchAttachments,
  };
}
