import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Trash2, Loader2, ImageIcon, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Photo {
  id: string;
  file_path: string;
  file_name: string;
  description: string | null;
  created_at: string;
  url?: string;
}

interface SimpleProjectPhotosProps {
  projectId: string;
}

export function SimpleProjectPhotos({ projectId }: SimpleProjectPhotosProps) {
  const { profile } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    if (!projectId || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("ks_module2_project_photos")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get signed URLs for photos
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => {
          const { data: urlData } = await supabase.storage
            .from("ks-module2-files")
            .createSignedUrl(photo.file_path, 3600);
          return { 
            id: photo.id,
            file_path: photo.file_path,
            file_name: photo.file_name,
            description: photo.description,
            created_at: photo.created_at,
            url: urlData?.signedUrl 
          } as Photo;
        })
      );

      setPhotos(photosWithUrls);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [projectId, profile?.company_id]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !profile?.company_id) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `photos/${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("ks-module2-files")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("ks_module2_project_photos").insert({
          project_id: projectId,
          company_id: profile.company_id,
          file_path: fileName,
          file_name: file.name,
        });

        if (dbError) throw dbError;
      }

      toast.success(`${files.length} bilde(r) lastet opp`);
      fetchPhotos();
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Kunne ikke laste opp bilder");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (photo: Photo) => {
    try {
      await supabase.storage.from("ks-module2-files").remove([photo.file_path]);
      await supabase.from("ks_module2_project_photos").delete().eq("id", photo.id);
      
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setSelectedPhoto(null);
      toast.success("Bilde slettet");
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Kunne ikke slette bilde");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Bilder
          </CardTitle>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Last opp
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Ingen bilder ennå</p>
              <p className="text-sm text-muted-foreground">Last opp bilder fra prosjektet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={photo.file_name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm">Vis</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Preview Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.file_name}</DialogTitle>
          </DialogHeader>
          {selectedPhoto?.url && (
            <div className="space-y-4">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.file_name}
                className="w-full max-h-[60vh] object-contain rounded-lg"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedPhoto.created_at).toLocaleDateString("nb-NO")}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedPhoto.url, "_blank")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Last ned
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selectedPhoto)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slett
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
