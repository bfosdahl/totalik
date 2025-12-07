import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Calendar,
  User,
  MapPin,
  Trash2,
  Camera,
  X,
  Image,
  Eye,
  FileDown,
} from "lucide-react";
import { useKsModule2Avvik, KsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { downloadKsModule2AvvikPdf, downloadKsModule2AvvikListPdf } from "@/utils/ksModule2AvvikPdf";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";

const CATEGORIES = [
  { value: "kvalitet", label: "Kvalitetsavvik" },
  { value: "hms", label: "HMS-avvik" },
  { value: "ks", label: "KS-avvik" },
  { value: "tegning", label: "Tegningsavvik" },
  { value: "material", label: "Materialavvik" },
  { value: "annet", label: "Annet" },
];

const SEVERITIES = [
  { value: "low", label: "Lav", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "Høy", color: "bg-orange-100 text-orange-800" },
  { value: "critical", label: "Kritisk", color: "bg-red-100 text-red-800" },
];

const STATUSES = [
  { value: "open", label: "Åpen", icon: AlertTriangle, color: "text-yellow-600" },
  { value: "in_progress", label: "Under arbeid", icon: Clock, color: "text-blue-600" },
  { value: "closed", label: "Lukket", icon: CheckCircle2, color: "text-green-600" },
];

export default function Ks2Avvik() {
  const { projectId } = useParams();
  const { profile, company } = useAuth();
  const { avvikList, isLoading, createAvvik, updateAvvik, deleteAvvik, closeAvvik, isCreating, isUpdating } = useKsModule2Avvik(projectId || null);
  
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [selectedAvvik, setSelectedAvvik] = useState<KsModule2Avvik | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<KsModule2Project | null>(null);

  useEffect(() => {
    if (projectId) {
      supabase
        .from("ks_module2_projects")
        .select("*")
        .eq("id", projectId)
        .single()
        .then(({ data }) => {
          if (data) setProject(data as KsModule2Project);
        });
    }
  }, [projectId]);

  const handleDownloadAvvikPdf = (avvik: KsModule2Avvik) => {
    if (!project || !company) return;
    downloadKsModule2AvvikPdf({
      avvik,
      project,
      company: {
        name: company.name,
        address: company.address,
        postal_code: company.postal_code,
        city: company.city,
        org_number: company.org_number,
        phone: company.phone,
        email: company.email,
      },
    });
    toast.success("PDF lastet ned");
  };

  const handleDownloadAllAvvikPdf = () => {
    if (!project || !company || avvikList.length === 0) return;
    downloadKsModule2AvvikListPdf(
      avvikList,
      project,
      {
        name: company.name,
        address: company.address,
        postal_code: company.postal_code,
        city: company.city,
        org_number: company.org_number,
        phone: company.phone,
        email: company.email,
      }
    );
    toast.success("PDF lastet ned");
  };
  
  const [newAvvik, setNewAvvik] = useState({
    title: "",
    description: "",
    category: "kvalitet",
    severity: "medium",
    location: "",
    deadline: "",
    responsible_name: "",
    corrective_action: "",
    root_cause: "",
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingPhotos(true);
    const uploadedPaths: string[] = [];
    
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('ks-module2-avvik-photos')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('ks-module2-avvik-photos')
          .createSignedUrl(fileName, 86400); // 24 hour expiry
          
        if (signedUrlError) throw signedUrlError;
        uploadedPaths.push(signedUrlData.signedUrl);
      }
      
      setPendingPhotos(prev => [...prev, ...uploadedPaths]);
      toast.success(`${files.length} bilde(r) lastet opp`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Kunne ikke laste opp bilder');
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePendingPhoto = (index: number) => {
    setPendingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateAvvik = () => {
    if (!newAvvik.title || !projectId) return;
    
    createAvvik({
      project_id: projectId,
      title: newAvvik.title,
      description: newAvvik.description || null,
      category: newAvvik.category,
      severity: newAvvik.severity,
      status: "open",
      location: newAvvik.location || null,
      discovered_date: new Date().toISOString().split("T")[0],
      deadline: newAvvik.deadline || null,
      responsible_name: newAvvik.responsible_name || null,
      responsible_user_id: null,
      reported_by_name: profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile?.email || "Ukjent",
      root_cause: newAvvik.root_cause || null,
      corrective_action: newAvvik.corrective_action || null,
      preventive_action: null,
      photo_paths: pendingPhotos.length > 0 ? pendingPhotos : null,
    }, {
      onSuccess: () => {
        setNewAvvik({ title: "", description: "", category: "kvalitet", severity: "medium", location: "", deadline: "", responsible_name: "", corrective_action: "", root_cause: "" });
        setPendingPhotos([]);
        setIsNewDialogOpen(false);
      }
    });
  };

  const handleCloseAvvik = (avvik: KsModule2Avvik) => {
    const closedByName = profile?.first_name && profile?.last_name 
      ? `${profile.first_name} ${profile.last_name}` 
      : profile?.email || "Ukjent";
    closeAvvik({ id: avvik.id, closedByName });
  };

  const handleDeleteAvvik = (id: string) => {
    if (confirm("Er du sikker på at du vil slette dette avviket?")) {
      deleteAvvik(id);
    }
  };

  const filteredAvvik = avvikList.filter(avvik => {
    const matchesSearch = avvik.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      avvik.avvik_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || avvik.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openCount = avvikList.filter(a => a.status === "open").length;
  const inProgressCount = avvikList.filter(a => a.status === "in_progress").length;
  const closedCount = avvikList.filter(a => a.status === "closed").length;

  const getSeverityBadge = (severity: string) => {
    const sev = SEVERITIES.find(s => s.value === severity);
    return <Badge className={sev?.color || ""}>{sev?.label || severity}</Badge>;
  };

  const getStatusInfo = (status: string) => {
    return STATUSES.find(s => s.value === status) || STATUSES[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Laster avvik...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Avvik fra KS</h1>
          <p className="text-muted-foreground">
            Registrer og følg opp avvik i prosjektet
          </p>
        </div>
        <div className="flex gap-2">
          {avvikList.length > 0 && (
            <Button variant="outline" onClick={handleDownloadAllAvvikPdf}>
              <FileDown className="h-4 w-4 mr-2" />
              Eksporter alle
            </Button>
          )}
          <Dialog open={isNewDialogOpen} onOpenChange={(open) => {
            setIsNewDialogOpen(open);
            if (!open) {
              setPendingPhotos([]);
              setNewAvvik({ title: "", description: "", category: "kvalitet", severity: "medium", location: "", deadline: "", responsible_name: "", corrective_action: "", root_cause: "" });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nytt avvik
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrer nytt avvik</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tittel *</Label>
                <Input
                  value={newAvvik.title}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Kort beskrivelse av avviket"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={newAvvik.category}
                    onValueChange={(v) => setNewAvvik(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alvorlighetsgrad</Label>
                  <Select
                    value={newAvvik.severity}
                    onValueChange={(v) => setNewAvvik(prev => ({ ...prev, severity: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map(sev => (
                        <SelectItem key={sev.value} value={sev.value}>{sev.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea
                  value={newAvvik.description}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detaljert beskrivelse av avviket..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lokasjon</Label>
                  <Input
                    value={newAvvik.location}
                    onChange={(e) => setNewAvvik(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Hvor ble det oppdaget?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frist</Label>
                  <Input
                    type="date"
                    value={newAvvik.deadline}
                    onChange={(e) => setNewAvvik(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ansvarlig</Label>
                <Input
                  value={newAvvik.responsible_name}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, responsible_name: e.target.value }))}
                  placeholder="Hvem er ansvarlig for å lukke avviket?"
                />
              </div>

              <div className="space-y-2">
                <Label>Årsak</Label>
                <Textarea
                  value={newAvvik.root_cause}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, root_cause: e.target.value }))}
                  placeholder="Hva er årsaken til avviket?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Korrigerende tiltak</Label>
                <Textarea
                  value={newAvvik.corrective_action}
                  onChange={(e) => setNewAvvik(prev => ({ ...prev, corrective_action: e.target.value }))}
                  placeholder="Hvilke tiltak skal gjennomføres?"
                  rows={2}
                />
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-2">
                <Label>Bilder</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhotos}
                    >
                      {uploadingPhotos ? "Laster opp..." : "Last opp bilder"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Du kan laste opp flere bilder samtidig
                    </p>
                  </div>
                  
                  {pendingPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {pendingPhotos.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Bilde ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removePendingPhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleCreateAvvik} disabled={isCreating || !newAvvik.title}>
                  {isCreating ? "Oppretter..." : "Opprett avvik"}
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-sm text-muted-foreground">Åpne</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-sm text-muted-foreground">Under arbeid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{closedCount}</p>
                <p className="text-sm text-muted-foreground">Lukket</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter avvik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statuser</SelectItem>
            {STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bildeoversikt</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Avvik List */}
      {filteredAvvik.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ingen avvik funnet</p>
            <p className="text-sm">Registrer et nytt avvik for å komme i gang</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAvvik.map((avvik) => {
            const statusInfo = getStatusInfo(avvik.status);
            const StatusIcon = statusInfo.icon;
            const hasPhotos = avvik.photo_paths && avvik.photo_paths.length > 0;

            return (
              <Card key={avvik.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                        <Badge variant="outline">{avvik.avvik_number}</Badge>
                        {getSeverityBadge(avvik.severity)}
                        <Badge variant="secondary">
                          {CATEGORIES.find(c => c.value === avvik.category)?.label || avvik.category}
                        </Badge>
                        {hasPhotos && (
                          <Badge variant="outline" className="gap-1">
                            <Image className="h-3 w-3" />
                            {avvik.photo_paths!.length}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{avvik.title}</h3>
                      {avvik.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{avvik.description}</p>
                      )}
                      
                      {/* Show photos if available */}
                      {hasPhotos && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {avvik.photo_paths!.slice(0, 4).map((url, index) => (
                            <button
                              key={index}
                              onClick={() => setPreviewImage(url)}
                              className="relative group"
                            >
                              <img
                                src={url}
                                alt={`Bilde ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-md border hover:border-primary transition-colors"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                                <Eye className="h-4 w-4 text-white" />
                              </div>
                            </button>
                          ))}
                          {avvik.photo_paths!.length > 4 && (
                            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center text-sm text-muted-foreground">
                              +{avvik.photo_paths!.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {avvik.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {avvik.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(avvik.discovered_date), "d. MMM yyyy", { locale: nb })}
                        </div>
                        {avvik.responsible_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {avvik.responsible_name}
                          </div>
                        )}
                        {avvik.deadline && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Frist: {format(new Date(avvik.deadline), "d. MMM yyyy", { locale: nb })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownloadAvvikPdf(avvik)}
                        title="Last ned PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      {avvik.status !== "closed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseAvvik(avvik)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Lukk
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteAvvik(avvik.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}