import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
  Eye,
  FileDown,
  FileWarning,
  Shield,
  Loader2,
  FileText
} from "lucide-react";
import { useKsModule2Avvik, KsModule2Avvik } from "@/hooks/useKsModule2Avvik";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { downloadKsModule2AvvikPdf, downloadKsModule2AvvikListPdf } from "@/utils/ksModule2AvvikPdf";
import { KsModule2Project } from "@/hooks/useKsModule2Projects";

const KS_CATEGORIES = [
  { value: "kvalitet", label: "Kvalitetsavvik" },
  { value: "ks", label: "KS-avvik" },
  { value: "tegning", label: "Tegningsavvik" },
  { value: "material", label: "Materialavvik" },
  { value: "annet", label: "Annet" },
];

const HMS_CATEGORIES = [
  { value: "Personlig verneutstyr", label: "Personlig verneutstyr" },
  { value: "Fallsikring", label: "Fallsikring" },
  { value: "Orden og ryddighet", label: "Orden og ryddighet" },
  { value: "Brannvern", label: "Brannvern" },
  { value: "Elektrisk sikkerhet", label: "Elektrisk sikkerhet" },
  { value: "Kjemikalier og farlige stoffer", label: "Kjemikalier og farlige stoffer" },
  { value: "Maskin og utstyr", label: "Maskin og utstyr" },
  { value: "Ergonomi", label: "Ergonomi" },
  { value: "Støy og vibrasjoner", label: "Støy og vibrasjoner" },
  { value: "Annet HMS", label: "Annet HMS" },
];

const HMS_CATEGORY_VALUES = HMS_CATEGORIES.map(c => c.value);

const SEVERITIES = [
  { value: "low", label: "Lav", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "high", label: "Høy", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "critical", label: "Kritisk", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

const STATUSES = [
  { value: "open", label: "Åpen", icon: AlertTriangle, color: "text-yellow-600" },
  { value: "in_progress", label: "Under arbeid", icon: Clock, color: "text-blue-600" },
  { value: "closed", label: "Lukket", icon: CheckCircle2, color: "text-green-600" },
];

export default function Ks2AvvikIntegrated() {
  const { projectId } = useParams();
  const { profile, company } = useAuth();
  const { avvikList, isLoading, createAvvik, updateAvvik, deleteAvvik, closeAvvik, isCreating, isUpdating } = useKsModule2Avvik(projectId || null);
  
  const [avvikType, setAvvikType] = useState<"ks" | "hms">("ks");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [selectedAvvik, setSelectedAvvik] = useState<KsModule2Avvik | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<KsModule2Project | null>(null);
  const [viewAvvik, setViewAvvik] = useState<KsModule2Avvik | null>(null);
  const [closingAvvik, setClosingAvvik] = useState<KsModule2Avvik | null>(null);
  const [closeComment, setCloseComment] = useState("");
  const [isClosing, setIsClosing] = useState(false);

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

  // Filter avvik based on type (KS or HMS)
  const ksAvvik = avvikList.filter(a => !HMS_CATEGORY_VALUES.includes(a.category));
  const hmsAvvik = avvikList.filter(a => HMS_CATEGORY_VALUES.includes(a.category));
  const currentAvvikList = avvikType === "ks" ? ksAvvik : hmsAvvik;

  const filteredAvvik = currentAvvikList.filter(avvik => {
    const matchesSearch = avvik.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      avvik.avvik_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || avvik.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openCount = currentAvvikList.filter(a => a.status === "open").length;
  const inProgressCount = currentAvvikList.filter(a => a.status === "in_progress").length;
  const closedCount = currentAvvikList.filter(a => a.status === "closed").length;

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
        setNewAvvik({ title: "", description: "", category: avvikType === "ks" ? "kvalitet" : "Personlig verneutstyr", severity: "medium", location: "", deadline: "", responsible_name: "", corrective_action: "", root_cause: "" });
        setPendingPhotos([]);
        setIsNewDialogOpen(false);
      }
    });
  };

  const handleCloseAvvik = (avvik: KsModule2Avvik) => {
    setClosingAvvik(avvik);
    setCloseComment("");
  };

  const handleConfirmClose = async () => {
    if (!closingAvvik) return;
    if (!closeComment.trim()) {
      toast.error("Skriv en kort kommentar om hvordan avviket ble løst");
      return;
    }
    setIsClosing(true);
    try {
      const closedByName = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.email || "Ukjent";
      const existing = closingAvvik.corrective_action || "";
      const newAction = existing
        ? `${existing}\n\n🔒 Lukkekommentar (${closedByName}): ${closeComment.trim()}`
        : `🔒 Lukkekommentar (${closedByName}): ${closeComment.trim()}`;
      await new Promise<void>((resolve, reject) => {
        updateAvvik(
          { id: closingAvvik.id, corrective_action: newAction },
          { onSuccess: () => resolve(), onError: (e) => reject(e) } as any
        );
      });
      closeAvvik({ id: closingAvvik.id, closedByName });
      setClosingAvvik(null);
      setCloseComment("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsClosing(false);
    }
  };

  const handleDeleteAvvik = (id: string) => {
    if (confirm("Er du sikker på at du vil slette dette avviket?")) {
      deleteAvvik(id);
    }
  };

  const handleDeleteAvvik = (id: string) => {
    if (confirm("Er du sikker på at du vil slette dette avviket?")) {
      deleteAvvik(id);
    }
  };

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
    if (!project || !company || currentAvvikList.length === 0) return;
    downloadKsModule2AvvikListPdf(
      currentAvvikList,
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

  const getSeverityBadge = (severity: string) => {
    const sev = SEVERITIES.find(s => s.value === severity);
    return <Badge className={sev?.color || ""}>{sev?.label || severity}</Badge>;
  };

  const getStatusInfo = (status: string) => {
    return STATUSES.find(s => s.value === status) || STATUSES[0];
  };

  const openNewDialog = () => {
    // Set default category based on current type
    setNewAvvik(prev => ({
      ...prev,
      category: avvikType === "ks" ? "kvalitet" : "Personlig verneutstyr"
    }));
    setIsNewDialogOpen(true);
  };

  const currentCategories = avvikType === "ks" ? KS_CATEGORIES : HMS_CATEGORIES;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Avviksregister</h1>
          <p className="text-muted-foreground">
            Registrer og følg opp avvik i prosjektet
          </p>
        </div>
        <div className="flex gap-2">
          {currentAvvikList.length > 0 && (
            <Button variant="outline" onClick={handleDownloadAllAvvikPdf}>
              <FileDown className="h-4 w-4 mr-2" />
              Eksporter alle
            </Button>
          )}
          <Button onClick={openNewDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Nytt avvik
          </Button>
        </div>
      </div>

      {/* Type Tabs - KS vs HMS */}
      <Tabs value={avvikType} onValueChange={(v) => setAvvikType(v as "ks" | "hms")} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ks" className="gap-2">
            <FileWarning className="h-4 w-4" />
            KS-avvik ({ksAvvik.length})
          </TabsTrigger>
          <TabsTrigger value="hms" className="gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            HMS-avvik ({hmsAvvik.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ks" className="mt-0 space-y-6">
          <AvvikContent
            avvikList={filteredAvvik}
            openCount={openCount}
            inProgressCount={inProgressCount}
            closedCount={closedCount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            getSeverityBadge={getSeverityBadge}
            getStatusInfo={getStatusInfo}
            handleCloseAvvik={handleCloseAvvik}
            handleDeleteAvvik={handleDeleteAvvik}
            handleDownloadAvvikPdf={handleDownloadAvvikPdf}
            project={project}
            company={company}
            accentColor="primary"
          />
        </TabsContent>

        <TabsContent value="hms" className="mt-0 space-y-6">
          <AvvikContent
            avvikList={filteredAvvik}
            openCount={openCount}
            inProgressCount={inProgressCount}
            closedCount={closedCount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            getSeverityBadge={getSeverityBadge}
            getStatusInfo={getStatusInfo}
            handleCloseAvvik={handleCloseAvvik}
            handleDeleteAvvik={handleDeleteAvvik}
            handleDownloadAvvikPdf={handleDownloadAvvikPdf}
            project={project}
            company={company}
            accentColor="emerald"
          />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={(open) => {
        setIsNewDialogOpen(open);
        if (!open) {
          setPendingPhotos([]);
          setNewAvvik({ title: "", description: "", category: avvikType === "ks" ? "kvalitet" : "Personlig verneutstyr", severity: "medium", location: "", deadline: "", responsible_name: "", corrective_action: "", root_cause: "" });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {avvikType === "ks" ? (
                <><FileWarning className="h-5 w-5" /> Registrer nytt KS-avvik</>
              ) : (
                <><Shield className="h-5 w-5 text-emerald-500" /> Registrer nytt HMS-avvik</>
              )}
            </DialogTitle>
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
                    {currentCategories.map(cat => (
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleCreateAvvik} 
              disabled={isCreating || !newAvvik.title}
              className={avvikType === "hms" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {isCreating ? "Oppretter..." : "Opprett avvik"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted component for avvik list content
function AvvikContent({
  avvikList,
  openCount,
  inProgressCount,
  closedCount,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  getSeverityBadge,
  getStatusInfo,
  handleCloseAvvik,
  handleDeleteAvvik,
  handleDownloadAvvikPdf,
  project,
  company,
  accentColor,
}: {
  avvikList: KsModule2Avvik[];
  openCount: number;
  inProgressCount: number;
  closedCount: number;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  getSeverityBadge: (s: string) => JSX.Element;
  getStatusInfo: (s: string) => { value: string; label: string; icon: any; color: string };
  handleCloseAvvik: (a: KsModule2Avvik) => void;
  handleDeleteAvvik: (id: string) => void;
  handleDownloadAvvikPdf: (a: KsModule2Avvik) => void;
  project: KsModule2Project | null;
  company: any;
  accentColor: "primary" | "emerald";
}) {
  const bgColors = accentColor === "emerald" 
    ? { open: "bg-red-100", progress: "bg-amber-100", closed: "bg-emerald-100" }
    : { open: "bg-yellow-100", progress: "bg-blue-100", closed: "bg-green-100" };
  const iconColors = accentColor === "emerald"
    ? { open: "text-red-600", progress: "text-amber-600", closed: "text-emerald-600" }
    : { open: "text-yellow-600", progress: "text-blue-600", closed: "text-green-600" };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${bgColors.open}`}>
                <AlertTriangle className={`h-5 w-5 ${iconColors.open}`} />
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
              <div className={`p-2 rounded-full ${bgColors.progress}`}>
                <Clock className={`h-5 w-5 ${iconColors.progress}`} />
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
              <div className={`p-2 rounded-full ${bgColors.closed}`}>
                <CheckCircle2 className={`h-5 w-5 ${iconColors.closed}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{closedCount}</p>
                <p className="text-sm text-muted-foreground">Lukket</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter avvik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statuser</SelectItem>
            <SelectItem value="open">Åpne</SelectItem>
            <SelectItem value="in_progress">Under arbeid</SelectItem>
            <SelectItem value="closed">Lukket</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Avvik List */}
      {avvikList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen avvik funnet</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== "all" 
                ? "Prøv å justere søket eller filteret"
                : "Registrer ditt første avvik ved å klikke på knappen over"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {avvikList.map((avvik) => {
            const statusInfo = getStatusInfo(avvik.status);
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={avvik.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-mono text-muted-foreground">{avvik.avvik_number}</span>
                        {getSeverityBadge(avvik.severity)}
                        <Badge variant="outline">{avvik.category}</Badge>
                      </div>
                      <CardTitle className="text-lg">{avvik.title}</CardTitle>
                      {avvik.location && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {avvik.location}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                      <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {avvik.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{avvik.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(avvik.discovered_date), "dd.MM.yyyy")}</span>
                    </div>
                    {avvik.responsible_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{avvik.responsible_name}</span>
                      </div>
                    )}
                    {avvik.deadline && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Frist: {format(new Date(avvik.deadline), "dd.MM.yyyy")}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadAvvikPdf(avvik)}>
                      <FileDown className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    {avvik.status !== "closed" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCloseAvvik(avvik)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Lukk
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteAvvik(avvik.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Slett
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
