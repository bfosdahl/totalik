import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Camera, 
  Trash2, 
  Edit, 
  Download, 
  FileText, 
  Image as ImageIcon,
  X,
  Clock,
  Milestone
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useKsModule2TimelineEvents, TimelineEvent } from "@/hooks/useKsModule2TimelineEvents";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import jsPDF from "jspdf";

const CATEGORIES = [
  { value: "oppstart", label: "Oppstart", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "grunnarbeid", label: "Grunnarbeid", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  { value: "konstruksjon", label: "Konstruksjon", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "tekking", label: "Tekking", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "innvendig", label: "Innvendig arbeid", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  { value: "ferdigstillelse", label: "Ferdigstillelse", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  { value: "general", label: "Generelt", color: "bg-muted text-muted-foreground" },
];

interface Ks2ProjectTimelineProps {
  projectId: string;
}

export function Ks2ProjectTimeline({ projectId }: Ks2ProjectTimelineProps) {
  const { profile, company } = useAuth();
  const { events, isLoading, createEvent, updateEvent, deleteEvent, uploadPhoto, getPhotoUrl } = useKsModule2TimelineEvents(projectId);
  const { projects } = useKsModule2Projects();
  const project = projects.find(p => p.id === projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string[]>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: format(new Date(), "yyyy-MM-dd"),
    category: "general",
    photo_paths: [] as string[],
  });

  // Load photo URLs for display
  useEffect(() => {
    const loadPhotos = async () => {
      const urlMap: Record<string, string[]> = {};
      for (const event of events) {
        if (event.photo_paths && event.photo_paths.length > 0) {
          const urls: string[] = [];
          for (const path of event.photo_paths) {
            const url = await getPhotoUrl(path);
            if (url) urls.push(url);
          }
          urlMap[event.id] = urls;
        }
      }
      setPhotoUrls(urlMap);
    };
    
    if (events.length > 0) {
      loadPhotos();
    }
  }, [events]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_date: format(new Date(), "yyyy-MM-dd"),
      category: "general",
      photo_paths: [],
    });
    setEditingEvent(null);
  };

  const handleOpenDialog = (event?: TimelineEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description || "",
        event_date: event.event_date,
        category: event.category,
        photo_paths: event.photo_paths || [],
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    const newPaths: string[] = [...formData.photo_paths];

    for (const file of Array.from(files)) {
      const path = await uploadPhoto(file, projectId);
      if (path) newPaths.push(path);
    }

    setFormData({ ...formData, photo_paths: newPaths });
    setUploadingPhotos(false);
  };

  const removePhoto = (index: number) => {
    const newPaths = formData.photo_paths.filter((_, i) => i !== index);
    setFormData({ ...formData, photo_paths: newPaths });
  };

  const handleSubmit = async () => {
    if (!projectId || !company?.id) return;

    if (editingEvent) {
      await updateEvent.mutateAsync({
        id: editingEvent.id,
        ...formData,
      });
    } else {
      await createEvent.mutateAsync({
        project_id: projectId,
        company_id: company.id,
        title: formData.title,
        description: formData.description || null,
        event_date: formData.event_date,
        category: formData.category,
        photo_paths: formData.photo_paths,
        created_by_id: profile?.id || null,
        created_by_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null : null,
      });
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteEvent.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getCategoryBadge = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? <Badge className={cat.color}>{cat.label}</Badge> : null;
  };

  const exportToPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("Prosjekttidslinje", margin, yPos);
    yPos += 10;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(project?.project_name || "Prosjekt", margin, yPos);
    yPos += 6;
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Generert: ${format(new Date(), "d. MMMM yyyy", { locale: nb })}`, margin, yPos);
    pdf.setTextColor(0);
    yPos += 15;

    // Timeline events
    for (const event of events) {
      // Check if we need a new page
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      // Date badge
      pdf.setFillColor(230, 230, 230);
      pdf.roundedRect(margin, yPos - 4, 30, 8, 2, 2, "F");
      pdf.setFontSize(9);
      pdf.text(format(parseISO(event.event_date), "dd.MM.yyyy"), margin + 2, yPos + 1);

      // Title
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(event.title, margin + 35, yPos + 1);
      yPos += 8;

      // Category
      const cat = CATEGORIES.find(c => c.value === event.category);
      if (cat) {
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100);
        pdf.text(cat.label, margin + 35, yPos);
        pdf.setTextColor(0);
        yPos += 6;
      }

      // Description
      if (event.description) {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(event.description, pageWidth - margin * 2 - 35);
        pdf.text(lines, margin + 35, yPos);
        yPos += lines.length * 5;
      }

      // Photos indicator
      if (event.photo_paths && event.photo_paths.length > 0) {
        pdf.setFontSize(9);
        pdf.setTextColor(100);
        pdf.text(`📷 ${event.photo_paths.length} bilde${event.photo_paths.length > 1 ? 'r' : ''}`, margin + 35, yPos + 3);
        pdf.setTextColor(0);
        yPos += 8;
      }

      yPos += 10;
    }

    pdf.save(`prosjekttidslinje-${project?.project_number || projectId}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Milestone className="h-5 w-5" />
            Prosjekttidslinje
          </h2>
          <p className="text-sm text-muted-foreground">
            Dokumenter prosjektets utvikling med bilder
          </p>
        </div>
        <div className="flex gap-2">
          {events.length > 0 && (
            <Button variant="outline" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Last ned PDF
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Ny hendelse
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? "Rediger hendelse" : "Ny tidslinjehendelse"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tittel *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="F.eks. Grunnmur ferdigstøpt"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dato *</Label>
                    <Input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Beskrivelse</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Beskriv hva som ble gjort..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Bilder</Label>
                  <div className="mt-2 space-y-3">
                    {formData.photo_paths.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.photo_paths.map((path, index) => (
                          <div key={index} className="relative group">
                            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Camera className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {uploadingPhotos ? "Laster opp..." : "Legg til bilder"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhotos}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.title || !formData.event_date || createEvent.isPending || updateEvent.isPending}
                  >
                    {editingEvent ? "Lagre" : "Opprett"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Timeline */}
      {events.length > 0 ? (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex gap-4 group">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shrink-0">
                  <Clock className="h-4 w-4" />
                </div>

                {/* Event card */}
                <Card className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {format(parseISO(event.event_date), "d. MMMM yyyy", { locale: nb })}
                          </Badge>
                          {getCategoryBadge(event.category)}
                        </div>
                        <h3 className="font-semibold">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        )}
                        {/* Photos */}
                        {photoUrls[event.id] && photoUrls[event.id].length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {photoUrls[event.id].map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt={`Bilde ${i + 1}`}
                                className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setLightboxImage(url)}
                              />
                            ))}
                          </div>
                        )}
                        {event.created_by_name && (
                          <p className="text-xs text-muted-foreground">
                            Lagt til av {event.created_by_name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(event)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(event.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Milestone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen hendelser ennå</h3>
            <p className="text-muted-foreground mb-4">
              Legg til hendelser for å dokumentere prosjektets utvikling
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til første hendelse
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img 
            src={lightboxImage} 
            alt="Forstørret bilde" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett hendelse?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne hendelsen? Handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
