import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image, Plus, Trash2, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface ProjectPhoto {
  id: string;
  file_path: string;
  caption: string | null;
  created_by_name: string;
  created_at: string;
}

export default function Ks2ProjectPhotos() {
  const { projectId } = useParams();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["project-photos", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simple_project_photos" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ProjectPhoto[];
    },
    enabled: !!projectId,
  });

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !profile?.company_id) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const filePath = `${profile.company_id}/${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("ks-module2-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("simple_project_photos" as any).insert({
          project_id: projectId,
          company_id: profile.company_id,
          file_path: filePath,
          caption: file.name,
          created_by_id: profile.user_id,
          created_by_name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
        });

        if (dbError) throw dbError;
      }

      queryClient.invalidateQueries({ queryKey: ["project-photos", projectId] });
      toast.success(`${files.length} bilde(r) lastet opp`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Kunne ikke laste opp bilde");
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = useMutation({
    mutationFn: async (photo: ProjectPhoto) => {
      await supabase.storage.from("ks-module2-files").remove([photo.file_path]);
      const { error } = await supabase.from("simple_project_photos" as any).delete().eq("id", photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-photos", projectId] });
      toast.success("Bilde slettet");
    },
  });

  const getImageUrl = (filePath: string) => {
    const { data } = supabase.storage.from("ks-module2-files").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getSignedUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from("ks-module2-files").createSignedUrl(filePath, 3600);
    return data?.signedUrl || "";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Image className="h-6 w-6" />
          Bilder
        </h2>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Last opp bilder
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Image className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Ingen bilder ennå</p>
            <p className="text-sm text-muted-foreground">Last opp bilder fra prosjektet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onDelete={() => deletePhoto.mutate(photo)}
              getSignedUrl={getSignedUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoCard({
  photo,
  onDelete,
  getSignedUrl,
}: {
  photo: ProjectPhoto;
  onDelete: () => void;
  getSignedUrl: (path: string) => Promise<string>;
}) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    getSignedUrl(photo.file_path).then(setUrl);
  }, [photo.file_path]);

  return (
    <Card className="overflow-hidden group relative">
      <div className="aspect-square bg-muted">
        {url ? (
          <img src={url} alt={photo.caption || ""} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs text-muted-foreground truncate">{photo.caption}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(photo.created_at), "d. MMM yyyy", { locale: nb })}
        </p>
      </div>
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </Card>
  );
}
