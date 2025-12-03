import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Camera,
  X,
  ImageIcon,
  Printer,
  Loader2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useKsChecklistItems, KsChecklist, KsTemplate } from "@/hooks/useKsProjects";
import { useKsProjectDocuments } from "@/hooks/useKsProjectDocuments";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { generateChecklistPdf, generateChecklistPdfBlob } from "@/utils/ksChecklistPdf";
import { useAuth } from "@/contexts/AuthContext";

export default function KsChecklistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [checklist, setChecklist] = useState<(KsChecklist & { template: KsTemplate }) | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, any[]>>({});
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  // Get document save function
  const { saveGeneratedDocument } = useKsProjectDocuments(projectId || "");

  const { items, isLoading: itemsLoading, updateItem } = useKsChecklistItems(id || null);

  useEffect(() => {
    const fetchChecklist = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('ks_checklists')
          .select(`
            *,
            template:ks_templates(*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setChecklist(data);
        setProjectId(data.project_id);
      } catch (error) {
        console.error('Error fetching checklist:', error);
        toast.error('Kunne ikke hente sjekkliste');
        navigate('/ks/projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecklist();
  }, [id, navigate]);

  // Initialize comments from items
  useEffect(() => {
    const initialComments: Record<string, string> = {};
    items.forEach(item => {
      if (item.comment) {
        initialComments[item.id] = item.comment;
      }
    });
    setComments(initialComments);
  }, [items]);

  // Fetch photos for each item
  useEffect(() => {
    const fetchPhotos = async () => {
      if (!items.length) return;
      
      try {
        const { data, error } = await supabase
          .from('ks_photos')
          .select('*')
          .in('checklist_item_id', items.map(i => i.id));
        
        if (error) throw error;
        
        const photosByItem: Record<string, any[]> = {};
        data?.forEach(photo => {
          if (!photosByItem[photo.checklist_item_id]) {
            photosByItem[photo.checklist_item_id] = [];
          }
          photosByItem[photo.checklist_item_id].push(photo);
        });
        
        setPhotos(photosByItem);
      } catch (error) {
        console.error('Error fetching photos:', error);
      }
    };
    
    fetchPhotos();
  }, [items]);

  const handleStatusChange = async (itemId: string, status: string) => {
    await updateItem(itemId, { status });
  };

  const handleCommentChange = async (itemId: string, comment: string) => {
    setComments(prev => ({ ...prev, [itemId]: comment }));
    // Auto-save comment
    await updateItem(itemId, { comment });
  };

  const handlePhotoUpload = async (itemId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploadingPhotos(prev => ({ ...prev, [itemId]: true }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const uploadedPhotos = [];
      
      for (const file of Array.from(files)) {
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${itemId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${projectId}/checklist-photos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-documents')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Save photo record to database
        const { data: photoData, error: dbError } = await supabase
          .from('ks_photos')
          .insert({
            checklist_item_id: itemId,
            file_path: filePath,
            taken_by_user_id: user.id,
            taken_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (dbError) throw dbError;
        
        uploadedPhotos.push(photoData);
      }
      
      // Update photos state
      setPhotos(prev => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), ...uploadedPhotos]
      }));
      
      toast.success(`${uploadedPhotos.length} bilde(r) lastet opp`);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Kunne ikke laste opp bilde');
    } finally {
      setUploadingPhotos(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleDeletePhoto = async (photoId: string, itemId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-documents')
        .remove([filePath]);
      
      if (storageError) throw storageError;
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('ks_photos')
        .delete()
        .eq('id', photoId);
      
      if (dbError) throw dbError;
      
      // Update photos state
      setPhotos(prev => ({
        ...prev,
        [itemId]: (prev[itemId] || []).filter(p => p.id !== photoId)
      }));
      
      toast.success('Bilde slettet');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Kunne ikke slette bilde');
    }
  };

  const getPhotoUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('project-documents')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handlePrintChecklist = async () => {
    if (!checklist) return;
    
    try {
      // Fetch project details
      const { data: projectData } = await supabase
        .from('ks_projects')
        .select('name, project_number, address')
        .eq('id', projectId)
        .single();
      
      await generateChecklistPdf({
        id: checklist.id,
        created_at: checklist.created_at,
        filled_at: checklist.filled_at,
        phase: checklist.phase,
        template: checklist.template,
        project: projectData || undefined,
        items: items,
        photos: photos,
      });
      
      toast.success('PDF generert');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Kunne ikke generere PDF');
    }
  };

  const handleCompleteChecklist = async () => {
    if (!checklist || !id || !projectId) return;

    setIsCompleting(true);
    
    try {
      // Fetch project details for PDF
      const { data: projectData } = await supabase
        .from('ks_projects')
        .select('name, project_number, address')
        .eq('id', projectId)
        .single();

      // Generate PDF blob
      const pdfData = await generateChecklistPdfBlob({
        id: checklist.id,
        created_at: checklist.created_at,
        filled_at: new Date().toISOString(),
        phase: checklist.phase,
        template: checklist.template,
        project: projectData || undefined,
        items: items,
        photos: photos,
      });

      // Save PDF to document center
      await saveGeneratedDocument({
        documentName: `Egenkontroll - ${checklist.template?.name || 'Sjekkliste'}`,
        category: 'egenkontroller',
        pdfBlob: pdfData.blob,
        sourceType: 'checklist',
        sourceId: id,
        description: `Fullført egenkontroll: ${checklist.template?.name}${checklist.phase ? ` (${checklist.phase})` : ''}`,
      });

      // Update checklist as completed
      const { error } = await supabase
        .from('ks_checklists')
        .update({ 
          filled_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setChecklist({
        ...checklist,
        filled_at: new Date().toISOString()
      });

      toast.success('Sjekkliste fullført og lagret i dokumentsenteret!');
    } catch (error) {
      console.error('Error completing checklist:', error);
      toast.error('Kunne ikke fullføre sjekkliste');
    } finally {
      setIsCompleting(false);
    }
  };

  const completedCount = items.filter(i => i.status && i.status !== 'pending').length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!checklist) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Sjekkliste ikke funnet</p>
          <Button onClick={() => navigate('/ks/projects')} className="mt-4">
            Tilbake til prosjekter
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.template_item?.category || "Generelt";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/ks/projects/${projectId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{checklist.template?.name}</h1>
            <p className="text-muted-foreground">
              {checklist.phase && `${checklist.phase} • `}
              Opprettet {new Date(checklist.created_at).toLocaleDateString("nb-NO")}
            </p>
          </div>
          <Button onClick={handlePrintChecklist}>
            <Printer className="h-4 w-4 mr-2" />
            Skriv ut sjekkliste
          </Button>
        </div>

        {/* Progress Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Fremdrift</CardTitle>
                <CardDescription>{completedCount} av {totalCount} punkter utfylt</CardDescription>
              </div>
              <span className="text-2xl font-bold">{progressPercentage}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Checklist Items */}
        {itemsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 p-0">
                  {/* Desktop Table Header */}
                  <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-3 bg-muted/50 border-y font-medium text-sm text-muted-foreground">
                    <div className="col-span-4">Kontrollpunkt</div>
                    <div className="col-span-1 text-center">Ja</div>
                    <div className="col-span-1 text-center">Nei</div>
                    <div className="col-span-1 text-center">N/A</div>
                    <div className="col-span-4">Kommentar</div>
                    <div className="col-span-1 text-center">Handlinger</div>
                  </div>

                  {/* Table Rows */}
                  {categoryItems
                    .sort((a, b) => (a.template_item?.order_index || 0) - (b.template_item?.order_index || 0))
                    .map((item, index) => (
                      <div key={item.id} className="border-b last:border-0">
                        {/* Desktop View */}
                        <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-4 items-start">
                          {/* Question */}
                          <div className="col-span-4 text-sm">
                            <span className="font-medium">{index + 1}. {item.template_item?.text}</span>
                            {item.template_item?.help_text && (
                              <p className="text-xs text-muted-foreground mt-1">{item.template_item.help_text}</p>
                            )}
                          </div>

                          {/* Radio Buttons */}
                          <div className="col-span-1 flex justify-center">
                            <input
                              type="radio"
                              name={`status-${item.id}`}
                              checked={item.status === 'OK'}
                              onChange={() => handleStatusChange(item.id, 'OK')}
                              className="h-4 w-4 cursor-pointer"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <input
                              type="radio"
                              name={`status-${item.id}`}
                              checked={item.status === 'AVVIK'}
                              onChange={() => handleStatusChange(item.id, 'AVVIK')}
                              className="h-4 w-4 cursor-pointer"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <input
                              type="radio"
                              name={`status-${item.id}`}
                              checked={item.status === 'IKKE_AKTUELT'}
                              onChange={() => handleStatusChange(item.id, 'IKKE_AKTUELT')}
                              className="h-4 w-4 cursor-pointer"
                            />
                          </div>

                          {/* Comment */}
                          <div className="col-span-4">
                            <Input
                              placeholder="Kommentar..."
                              value={comments[item.id] || ""}
                              onChange={(e) => handleCommentChange(item.id, e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>

                          {/* Actions - Photo Upload */}
                          <div className="col-span-1 flex justify-center">
                            <input
                              type="file"
                              ref={el => fileInputRefs.current[item.id] = el}
                              onChange={(e) => handlePhotoUpload(item.id, e.target.files)}
                              accept="image/*"
                              multiple
                              capture="environment"
                              className="hidden"
                            />
                            <Button 
                              size="icon"
                              variant="outline"
                              className="h-9 w-9"
                              onClick={() => fileInputRefs.current[item.id]?.click()}
                              disabled={uploadingPhotos[item.id]}
                            >
                              <Camera className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden p-4 space-y-4">
                          {/* Question */}
                          <div className="text-sm">
                            <span className="font-medium">{index + 1}. {item.template_item?.text}</span>
                            {item.template_item?.help_text && (
                              <p className="text-xs text-muted-foreground mt-1">{item.template_item.help_text}</p>
                            )}
                          </div>

                          {/* Status Radio Buttons */}
                          <div className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg">
                            <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center">
                              <input
                                type="radio"
                                name={`status-mobile-${item.id}`}
                                checked={item.status === 'OK'}
                                onChange={() => handleStatusChange(item.id, 'OK')}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">Ja</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center">
                              <input
                                type="radio"
                                name={`status-mobile-${item.id}`}
                                checked={item.status === 'AVVIK'}
                                onChange={() => handleStatusChange(item.id, 'AVVIK')}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">Nei</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center">
                              <input
                                type="radio"
                                name={`status-mobile-${item.id}`}
                                checked={item.status === 'IKKE_AKTUELT'}
                                onChange={() => handleStatusChange(item.id, 'IKKE_AKTUELT')}
                                className="h-4 w-4"
                              />
                              <span className="text-sm">N/A</span>
                            </label>
                          </div>

                          {/* Comment and Photo */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Kommentar..."
                              value={comments[item.id] || ""}
                              onChange={(e) => handleCommentChange(item.id, e.target.value)}
                              className="flex-1 text-sm"
                            />
                            <input
                              type="file"
                              ref={el => fileInputRefs.current[`mobile-${item.id}`] = el}
                              onChange={(e) => handlePhotoUpload(item.id, e.target.files)}
                              accept="image/*"
                              multiple
                              capture="environment"
                              className="hidden"
                            />
                            <Button 
                              size="icon"
                              variant="outline"
                              onClick={() => fileInputRefs.current[`mobile-${item.id}`]?.click()}
                              disabled={uploadingPhotos[item.id]}
                            >
                              <Camera className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Display uploaded photos */}
                        {photos[item.id]?.length > 0 && (
                          <div className="px-4 md:px-6 pb-4 space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              <ImageIcon className="h-4 w-4 inline mr-1" />
                              Bilder ({photos[item.id].length})
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {photos[item.id].map((photo) => (
                                <div key={photo.id} className="relative group">
                                  <img
                                    src={getPhotoUrl(photo.file_path)}
                                    alt="Checklist photo"
                                    className="w-full h-24 object-cover rounded border"
                                  />
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeletePhoto(photo.id, item.id, photo.file_path)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(photo.taken_at), "dd.MM.yyyy HH:mm", { locale: nb })}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Complete Checklist Button */}
        {!checklist.filled_at && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Fullfør sjekkliste</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {completedCount} av {totalCount} punkter er utfylt ({progressPercentage}%)
                  </p>
                </div>
                <Button 
                  onClick={handleCompleteChecklist}
                  size="lg"
                  disabled={progressPercentage < 100 || isCompleting}
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Lagrer...
                    </>
                  ) : (
                    'Fullfør sjekkliste'
                  )}
                </Button>
              </div>
              {progressPercentage < 100 && (
                <p className="text-sm text-amber-600 mt-3">
                  ⚠️ Du må fullføre alle sjekkpunkter før du kan markere sjekklisten som fullført
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Completed Status */}
        {checklist.filled_at && (
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-green-900 dark:text-green-100">
                    Sjekkliste fullført
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Utført {format(new Date(checklist.filled_at), "dd.MM.yyyy 'kl.' HH:mm", { locale: nb })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}