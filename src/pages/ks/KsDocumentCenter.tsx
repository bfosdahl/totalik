import { useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Search, 
  FileImage,
  Shield,
  AlertTriangle,
  Package,
  FileSignature,
  GraduationCap,
  FileStack,
  ClipboardCheck,
  Printer,
  Eye,
  Layers,
  CheckCircle2,
  Camera,
  Building2,
  HardHat,
  Droplets,
  Paintbrush,
  FileCheck,
  Copy,
  Upload,
  Plus
} from "lucide-react";
import { useKsProjectDocuments } from "@/hooks/useKsProjectDocuments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { generateChecklistPdf } from "@/utils/ksChecklistPdf";
import { exportSingleKsSjaToPDF } from "@/utils/ksSjaExport";
import { toast } from "sonner";

const CATEGORY_CONFIG = {
  tegninger: { label: "Tegninger", icon: FileText, color: "bg-blue-500" },
  beskrivelser: { label: "Beskrivelser", icon: FileText, color: "bg-purple-500" },
  sha_plan: { label: "SHA-plan", icon: Shield, color: "bg-green-500" },
  bilder: { label: "Bilder", icon: FileImage, color: "bg-yellow-500" },
  endringsmeldinger: { label: "Endringsmeldinger", icon: AlertTriangle, color: "bg-orange-500" },
  fdv: { label: "FDV-dokumentasjon", icon: Package, color: "bg-cyan-500" },
  samsvar: { label: "Samsvarserklæringer", icon: FileSignature, color: "bg-emerald-500" },
  kompetanse: { label: "Kompetanse/Kurs", icon: GraduationCap, color: "bg-indigo-500" },
  egenkontroller: { label: "Egenkontroller (Auto)", icon: ClipboardCheck, color: "bg-teal-500" },
  sja_dokumenter: { label: "SJA-dokumenter (Auto)", icon: Shield, color: "bg-lime-500" },
  vernerunder: { label: "Vernerunder (Auto)", icon: Shield, color: "bg-violet-500" },
};

// Template categories
const templateCategories = [
  { id: "betong", label: "Betong", icon: Building2 },
  { id: "tommer", label: "Tømrer", icon: HardHat },
  { id: "vatrom", label: "Våtrom", icon: Droplets },
  { id: "maler", label: "Maler", icon: Paintbrush },
  { id: "sluttkontroll", label: "Sluttkontroll", icon: CheckCircle2 },
  { id: "fdv", label: "FDV", icon: FileCheck },
  { id: "annet", label: "Annet", icon: FileText },
];

// Example templates for download
const exampleTemplates = [
  {
    id: "1",
    name: "Betongstøp gulv på grunn",
    category: "betong",
    description: "Kontroll av betongstøp for gulv på grunn etter NS-standard",
    itemCount: 12,
    hasRequiredPhotos: true,
  },
  {
    id: "2",
    name: "Montering våtromsplater",
    category: "vatrom",
    description: "Sjekkliste for montering av våtromsplater iht. produsentens anvisning",
    itemCount: 15,
    hasRequiredPhotos: true,
  },
  {
    id: "3",
    name: "Sluttkontroll bad (NS 3600)",
    category: "vatrom",
    description: "Komplett sluttkontroll av våtrom etter NS 3600",
    itemCount: 24,
    hasRequiredPhotos: true,
  },
  {
    id: "4",
    name: "FDV-kontroll før overtakelse",
    category: "fdv",
    description: "Kontroll av FDV-dokumentasjon før overtakelse",
    itemCount: 18,
    hasRequiredPhotos: false,
  },
  {
    id: "5",
    name: "Tømrerarbeid - Yttervegg",
    category: "tommer",
    description: "Kontroll av tømrerarbeid for yttervegg",
    itemCount: 16,
    hasRequiredPhotos: true,
  },
];

export default function KsDocumentCenter() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadData, setUploadData] = useState({
    document_name: "",
    document_number: "",
    category: "tegninger" as any,
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get default tab from URL param
  const defaultTab = searchParams.get("tab") || "uploaded";

  const { documents, downloadDocument, uploadDocument, isUploading } = useKsProjectDocuments(projectId || "");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadData.document_name) {
        setUploadData(prev => ({ ...prev, document_name: file.name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadData.document_name || !uploadData.category) {
      toast.error("Fyll ut påkrevde felter");
      return;
    }
    
    uploadDocument({
      document_name: uploadData.document_name,
      document_number: uploadData.document_number || undefined,
      category: uploadData.category,
      description: uploadData.description || undefined,
      file: selectedFile,
    }, {
      onSuccess: () => {
        setShowUploadDialog(false);
        setUploadData({ document_name: "", document_number: "", category: "tegninger", description: "" });
        setSelectedFile(null);
      }
    });
  };

  const resetUploadForm = () => {
    setUploadData({ document_name: "", document_number: "", category: "tegninger", description: "" });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Generate signed URL for preview
  const handlePreviewDocument = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .createSignedUrl(doc.file_path, 3600); // 1 hour expiry
      
      if (error) throw error;
      
      setPreviewUrl(data.signedUrl);
      setPreviewDoc(doc);
    } catch (error) {
      console.error('Error creating preview URL:', error);
      toast.error('Kunne ikke forhåndsvise dokumentet');
    }
  };

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ["ks-project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ks_projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch checklists
  const { data: checklists = [] } = useQuery({
    queryKey: ["ks-checklists", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ks_checklists")
        .select(`
          *,
          template:ks_templates(name, phase),
          items:ks_checklist_items(
            *,
            template_item:ks_template_items(*),
            photos:ks_photos(*)
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch SJAs
  const { data: sjas = [] } = useQuery({
    queryKey: ["project-sjas", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ks_sja")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const handleDownloadChecklistPdf = async (checklist: any) => {
    try {
      // Prepare photos grouped by checklist item
      const photosByItem: Record<string, any[]> = {};
      checklist.items?.forEach((item: any) => {
        if (item.photos && item.photos.length > 0) {
          photosByItem[item.id] = item.photos;
        }
      });

      const checklistData = {
        id: checklist.id,
        created_at: checklist.created_at,
        filled_at: checklist.filled_at,
        phase: checklist.phase,
        template: {
          name: checklist.template?.name || "Sjekkliste",
          trade: checklist.template?.trade || null,
        },
        project: {
          name: project?.name || "Prosjekt",
          project_number: project?.project_number || null,
          address: project?.address || null,
        },
        items: checklist.items || [],
        photos: photosByItem,
      };
      await generateChecklistPdf(checklistData);
      toast.success("Sjekkliste-PDF lastet ned");
    } catch (error) {
      console.error("Error generating checklist PDF:", error);
      toast.error("Kunne ikke generere PDF");
    }
  };

  const handleDownloadSjaPdf = async (sja: any) => {
    try {
      await exportSingleKsSjaToPDF(sja);
      toast.success("SJA-PDF lastet ned");
    } catch (error) {
      console.error("Error generating SJA PDF:", error);
      toast.error("Kunne ikke generere PDF");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isPreviewable = (doc: any) => {
    const previewableTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return previewableTypes.includes(doc.file_type);
  };

  const filteredDocuments = documents.filter(doc => 
    doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredChecklists = checklists.filter(checklist =>
    checklist.template?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    checklist.template?.phase?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSjas = sjas.filter(sja =>
    sja.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sja.sja_nr?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/ks/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Dokumentsenter</h1>
            <p className="text-muted-foreground">
              {project?.name || "Prosjekt"}
            </p>
          </div>
          <Button onClick={() => { resetUploadForm(); setShowUploadDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Last opp dokument
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Skriv ut
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter dokumenter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="uploaded">
              Opplastede dokumenter ({filteredDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="checklists">
              Sjekklister ({filteredChecklists.length})
            </TabsTrigger>
            <TabsTrigger value="sja">
              SJA ({filteredSjas.length})
            </TabsTrigger>
            <TabsTrigger value="maler">
              Maler ({exampleTemplates.length})
            </TabsTrigger>
          </TabsList>

          {/* Uploaded Documents */}
          <TabsContent value="uploaded" className="space-y-4">
            {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
              const categoryDocs = filteredDocuments.filter(d => d.category === category);
              if (categoryDocs.length === 0) return null;

              const Icon = config.icon;

              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${config.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {config.label}
                    </CardTitle>
                    <CardDescription>
                      {categoryDocs.length} dokument{categoryDocs.length !== 1 ? 'er' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryDocs.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.document_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {doc.document_number && (
                                <Badge variant="outline" className="text-xs">
                                  {doc.document_number}
                                </Badge>
                              )}
                              <span>v{doc.version}</span>
                              <span>•</span>
                              <span>{format(new Date(doc.created_at), "dd.MM.yyyy", { locale: nb })}</span>
                              <span>•</span>
                              <span>{doc.uploaded_by_name}</span>
                            </div>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {isPreviewable(doc) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreviewDocument(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadDocument(doc)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredDocuments.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen dokumenter funnet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Checklists */}
          <TabsContent value="checklists" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Sjekklister
                </CardTitle>
                <CardDescription>
                  {filteredChecklists.length} sjekkliste{filteredChecklists.length !== 1 ? 'r' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredChecklists.map(checklist => (
                    <div
                      key={checklist.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{checklist.template?.name || "Sjekkliste"}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {checklist.template?.phase && (
                            <Badge variant="outline" className="text-xs">
                              {checklist.template.phase}
                            </Badge>
                          )}
                          {checklist.filled_at && (
                            <>
                              <span>•</span>
                              <span>Utført: {format(new Date(checklist.filled_at), "dd.MM.yyyy", { locale: nb })}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/ks/checklist/${checklist.id}`)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadChecklistPdf(checklist)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {filteredChecklists.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen sjekklister funnet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* SJA */}
          <TabsContent value="sja" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sikker Jobb Analyse
                </CardTitle>
                <CardDescription>
                  {filteredSjas.length} SJA{filteredSjas.length !== 1 ? '-er' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredSjas.map(sja => (
                    <div
                      key={sja.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{sja.title || "SJA"}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {sja.sja_nr && (
                            <Badge variant="outline" className="text-xs">
                              {sja.sja_nr}
                            </Badge>
                          )}
                          {sja.date && (
                            <>
                              <span>•</span>
                              <span>{format(new Date(sja.date), "dd.MM.yyyy", { locale: nb })}</span>
                            </>
                          )}
                          {sja.status && (
                            <>
                              <span>•</span>
                              <Badge variant={sja.status === "active" ? "default" : "secondary"} className="text-xs">
                                {sja.status === "active" ? "Aktiv" : sja.status === "completed" ? "Fullført" : "Arkivert"}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadSjaPdf(sja)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {filteredSjas.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen SJA funnet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Maler (Templates) */}
          <TabsContent value="maler" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Tilgjengelige maler
                </CardTitle>
                <CardDescription>
                  Velg en mal for å starte en ny egenkontroll
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {exampleTemplates.map(template => {
                    const category = templateCategories.find(c => c.id === template.category);
                    const CategoryIcon = category?.icon || FileText;
                    
                    return (
                      <Card key={template.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <CategoryIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              <Badge variant="secondary" className="mt-1">
                                {category?.label || template.category}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {template.description && (
                            <p className="text-sm text-muted-foreground">
                              {template.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              {template.itemCount} punkter
                            </span>
                            {template.hasRequiredPhotos && (
                              <span className="flex items-center gap-1">
                                <Camera className="h-4 w-4" />
                                Obl. bilder
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => navigate(`/ks/egenkontroller?template=${template.id}`)}
                            >
                              Bruk mal
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Dupliser"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => { setPreviewDoc(null); setPreviewUrl(""); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewDoc?.document_name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewDoc && previewUrl && (
              <>
                {previewDoc.file_type === 'application/pdf' && (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[70vh] border-0"
                    title={previewDoc.document_name}
                  />
                )}
                {previewDoc.file_type?.startsWith('image/') && (
                  <img
                    src={previewUrl}
                    alt={previewDoc.document_name}
                    className="w-full h-auto"
                  />
                )}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setPreviewDoc(null); setPreviewUrl(""); }}>
              Lukk
            </Button>
            <Button onClick={() => previewDoc && downloadDocument(previewDoc)}>
              <Download className="h-4 w-4 mr-2" />
              Last ned
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Last opp dokument</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Fil *</Label>
              <div 
                className="mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Klikk for å velge fil
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="document_name">Dokumentnavn *</Label>
              <Input
                id="document_name"
                value={uploadData.document_name}
                onChange={(e) => setUploadData(prev => ({ ...prev, document_name: e.target.value }))}
                placeholder="F.eks. Plantegning 1. etasje"
              />
            </div>

            <div>
              <Label htmlFor="category">Kategori *</Label>
              <Select
                value={uploadData.category}
                onValueChange={(value) => setUploadData(prev => ({ ...prev, category: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="document_number">Dokumentnummer (valgfritt)</Label>
              <Input
                id="document_number"
                value={uploadData.document_number}
                onChange={(e) => setUploadData(prev => ({ ...prev, document_number: e.target.value }))}
                placeholder="F.eks. DOK-001"
              />
            </div>

            <div>
              <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
              <Textarea
                id="description"
                value={uploadData.description}
                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kort beskrivelse av dokumentet..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || !selectedFile || !uploadData.document_name}
            >
              {isUploading ? "Laster opp..." : "Last opp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
