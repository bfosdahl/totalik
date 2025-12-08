import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Eye, 
  Trash2,
  FolderOpen,
  Image,
  File,
  Plus,
  Shield,
  Users,
  AlertTriangle,
  BookOpen,
  Beaker,
  HeartPulse,
  MoreHorizontal,
  FileCheck,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Ny papir-vennlig mappestruktur (8 hovedmapper)
const IK_HMS_FOLDERS = [
  { 
    id: "1", 
    name: "Grunnlag & Policy", 
    icon: BookOpen,
    color: "bg-blue-500",
    subfolders: [
      { id: "1.1", name: "HMS-policy" },
      { id: "1.2", name: "Visjon og mål" },
      { id: "1.3", name: "Organisasjonskart" },
    ]
  },
  { 
    id: "2", 
    name: "Verneombud", 
    icon: Shield,
    color: "bg-emerald-500",
    subfolders: [
      { id: "2.1", name: "Avtale om verneombud" },
      { id: "2.2", name: "Avtale om fritak for verneombud" },
      { id: "2.3", name: "Vernerunde sjekkliste (papir)" },
      { id: "2.4", name: "Årsrapport verneombud" },
    ]
  },
  { 
    id: "3", 
    name: "Risiko & SJA", 
    icon: AlertTriangle,
    color: "bg-amber-500",
    subfolders: [
      { id: "3.1", name: "SJA-mal papir" },
      { id: "3.2", name: "Risikovurdering papir" },
      { id: "3.3", name: "Fareidentifikasjon" },
    ]
  },
  { 
    id: "4", 
    name: "Rutiner", 
    icon: ClipboardList,
    color: "bg-purple-500",
    subfolders: [
      { id: "4.1", name: "Avviksskjema" },
      { id: "4.2", name: "Skademelding" },
      { id: "4.3", name: "Nestenulykke-melding" },
      { id: "4.4", name: "Fraværsskjema" },
    ]
  },
  { 
    id: "5", 
    name: "Opplæring & Kurs", 
    icon: Users,
    color: "bg-cyan-500",
    subfolders: [
      { id: "5.1", name: "Arbeidsavtale mal" },
      { id: "5.2", name: "Medarbeidersamtale mal" },
      { id: "5.3", name: "Kursbevis mal" },
      { id: "5.4", name: "Kompetanseoversikt" },
    ]
  },
  { 
    id: "6", 
    name: "Stoffkartotek", 
    icon: Beaker,
    color: "bg-orange-500",
    subfolders: [
      { id: "6.1", name: "Kjemikalieliste mal" },
      { id: "6.2", name: "Sikkerhetsdatablad – blank" },
    ]
  },
  { 
    id: "7", 
    name: "Beredskap & Førstehjelp", 
    icon: HeartPulse,
    color: "bg-red-500",
    subfolders: [
      { id: "7.1", name: "Beredskapsplan mal" },
      { id: "7.2", name: "Branninstruks" },
      { id: "7.3", name: "Førstehjelpsinstruks" },
    ]
  },
  { 
    id: "8", 
    name: "Diverse & Egendefinerte", 
    icon: MoreHorizontal,
    color: "bg-gray-500",
    subfolders: []
  },
];

interface AdminDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  category: string | null;
  is_mandatory: boolean | null;
  version: string | null;
  created_at: string;
  uploaded_by_name: string;
  valid_from?: string | null;
  valid_to?: string | null;
}

export default function AdminDocuments() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [documentForm, setDocumentForm] = useState({
    category: "",
    is_mandatory: false,
    version: "2025.1",
    requires_signature: false,
    upload_deadline_days: 7,
    include_in_pdf: true,
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ["admin-ik-hms-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as AdminDocument[];
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setDocumentForm({
      category: selectedFolder || "",
      is_mandatory: false,
      version: "2025.1",
      requires_signature: false,
      upload_deadline_days: 7,
      include_in_pdf: true,
    });
  };

  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/æ/gi, 'ae')
      .replace(/ø/gi, 'o')
      .replace(/å/gi, 'a')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Velg minst én fil");
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of selectedFiles) {
        try {
          const sanitizedName = sanitizeFileName(file.name);
          const filePath = `ik-hms/${Date.now()}_${sanitizedName}`;
          const documentName = file.name.split('.').slice(0, -1).join('.');

          const { error: uploadError } = await supabase.storage
            .from("admin-documents")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase
            .from("admin_documents")
            .insert({
              document_name: documentName,
              document_type: "IK-HMS",
              file_path: filePath,
              file_type: file.type,
              file_size: file.size,
              description: documentForm.requires_signature 
                ? `Krever signering. Frist: ${documentForm.upload_deadline_days} dager. Inkluder i PDF: ${documentForm.include_in_pdf ? 'Ja' : 'Nei'}`
                : null,
              category: documentForm.category || null,
              is_mandatory: documentForm.is_mandatory,
              version: documentForm.version,
              uploaded_by_name: "System Admin",
            });

          if (dbError) throw dbError;
          successCount++;
        } catch (error) {
          console.error("Upload error for file:", file.name, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} dokument${successCount > 1 ? 'er' : ''} lastet opp`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} fil${errorCount > 1 ? 'er' : ''} feilet`);
      }
      
      setUploadDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-ik-hms-documents"] });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Kunne ikke laste opp dokumenter");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (doc: AdminDocument) => {
      const { error: storageError } = await supabase.storage
        .from("admin-documents")
        .remove([doc.file_path]);
      
      if (storageError) console.error("Storage delete error:", storageError);

      const { error: dbError } = await supabase
        .from("admin_documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success("Dokument slettet");
      queryClient.invalidateQueries({ queryKey: ["admin-ik-hms-documents"] });
    },
    onError: () => {
      toast.error("Kunne ikke slette dokument");
    },
  });

  const downloadDocument = async (doc: AdminDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("admin-documents")
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.document_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Kunne ikke laste ned dokument");
    }
  };

  const previewDocument = async (doc: AdminDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("admin-documents")
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Kunne ikke åpne dokument");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return File;
    if (fileType.includes("image")) return Image;
    return FileText;
  };

  // Filter documents
  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFolder = !selectedFolder || doc.category?.startsWith(selectedFolder);
    const matchesCategoryFilter = categoryFilter === "all" || doc.category?.startsWith(categoryFilter);
    
    return matchesSearch && matchesFolder && matchesCategoryFilter;
  });

  // Get documents count per folder
  const getDocumentCount = (folderId: string) => {
    return documents?.filter(d => d.category?.startsWith(folderId)).length || 0;
  };

  const allFolderOptions = IK_HMS_FOLDERS.flatMap(folder => [
    { value: folder.id, label: `${folder.id}. ${folder.name}` },
    ...folder.subfolders.map(sub => ({ value: sub.id, label: `${sub.id} ${sub.name}` }))
  ]);

  const stats = {
    totalDocuments: documents?.length || 0,
    mandatoryDocuments: documents?.filter(d => d.is_mandatory).length || 0,
    foldersWithContent: new Set(documents?.map(d => d.category?.split('.')[0]).filter(Boolean)).size,
  };

  // Render folder card
  const renderFolderCard = (folder: typeof IK_HMS_FOLDERS[0]) => {
    const Icon = folder.icon;
    const docCount = getDocumentCount(folder.id);
    const isSelected = selectedFolder === folder.id;

    return (
      <Card 
        key={folder.id}
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2",
          isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-transparent"
        )}
        onClick={() => setSelectedFolder(isSelected ? null : folder.id)}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn("p-4 rounded-xl", folder.color)}>
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">{folder.id}. {folder.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {folder.subfolders.length > 0 
                  ? `${folder.subfolders.length} undermapper` 
                  : "Tom – legg til egne dokumenter"
                }
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">
                  {docCount} dokument{docCount !== 1 ? 'er' : ''}
                </Badge>
                {folder.subfolders.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {folder.subfolders.length} mapper
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Submapper */}
          {folder.subfolders.length > 0 && isSelected && (
            <div className="mt-4 pt-4 border-t space-y-2">
              {folder.subfolders.map(sub => (
                <div 
                  key={sub.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFolder(sub.id);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{sub.id} {sub.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {documents?.filter(d => d.category === sub.id).length || 0}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              setDocumentForm(prev => ({ ...prev, category: folder.id }));
              setUploadDialogOpen(true);
            }}
          >
            <Upload className="h-4 w-4" />
            Last opp ny fil her
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Render document card (large with preview)
  const renderDocumentCard = (doc: AdminDocument) => {
    const FileIcon = getFileIcon(doc.file_type);
    const isPDF = doc.file_type?.includes('pdf');
    const isImage = doc.file_type?.includes('image');
    const requiresSignature = doc.description?.includes('Krever signering');

    return (
      <Card key={doc.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Preview area */}
        <div 
          className="h-40 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center cursor-pointer relative group"
          onClick={() => previewDocument(doc)}
        >
          {isPDF ? (
            <div className="text-center">
              <FileText className="h-16 w-16 text-red-500 mx-auto" />
              <span className="text-xs text-muted-foreground mt-2 block">PDF</span>
            </div>
          ) : isImage ? (
            <Image className="h-16 w-16 text-blue-500" />
          ) : (
            <FileIcon className="h-16 w-16 text-muted-foreground" />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="h-8 w-8 text-white" />
          </div>
          {requiresSignature && (
            <Badge className="absolute top-2 right-2 bg-amber-500">
              <FileCheck className="h-3 w-3 mr-1" />
              Krever signering
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h4 className="font-medium truncate" title={doc.document_name}>
            {doc.document_name}
          </h4>
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {doc.category && (
              <Badge variant="outline" className="text-xs">
                {doc.category}
              </Badge>
            )}
            {doc.is_mandatory && (
              <Badge variant="destructive" className="text-xs">Obligatorisk</Badge>
            )}
            {doc.version && (
              <Badge variant="secondary" className="text-xs">v{doc.version}</Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            {formatFileSize(doc.file_size)} • {format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}
          </p>

          <div className="flex items-center gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => downloadDocument(doc)}
            >
              <Download className="h-4 w-4 mr-1" />
              Last ned
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => deleteMutation.mutate(doc)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <Shield className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dokumentsenter (IK-HMS)</h1>
              <p className="text-muted-foreground text-sm">
                Papir-vennlige maler for HMS-arbeid • Last ned, fyll ut, skann og last opp
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-emerald-500/50 text-emerald-600">
              <Shield className="h-3.5 w-3.5" />
              System Admin
            </Badge>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Last opp dokument
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Last opp dokumenter</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                      isDragging 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" 
                        : "border-muted-foreground/25 hover:border-emerald-500/50"
                    )}
                    onClick={() => document.getElementById('multi-file-input')?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Dra og slipp filer her
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      eller klikk for å velge filer (PDF, Word, Excel, bilder)
                    </p>
                    <Input
                      id="multi-file-input"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                  </div>

                  {/* Selected Files List */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Valgte filer ({selectedFiles.length})</Label>
                      <ScrollArea className="h-32 border rounded-md p-2">
                        <div className="space-y-1">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1">
                              <div className="flex items-center gap-2 truncate flex-1">
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({(file.size / 1024).toFixed(0)} KB)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => removeFile(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Mappe/Kategori</Label>
                    <Select
                      value={documentForm.category}
                      onValueChange={(v) => setDocumentForm(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg mappe" />
                      </SelectTrigger>
                      <SelectContent>
                        {allFolderOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Versjon</Label>
                      <Input
                        value={documentForm.version}
                        onChange={(e) => setDocumentForm(prev => ({ ...prev, version: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={documentForm.is_mandatory}
                        onCheckedChange={(v) => setDocumentForm(prev => ({ ...prev, is_mandatory: v }))}
                      />
                      <Label>Obligatorisk</Label>
                    </div>
                  </div>

                  {/* Signature and deadline options */}
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={documentForm.requires_signature}
                        onCheckedChange={(v) => setDocumentForm(prev => ({ ...prev, requires_signature: !!v }))}
                      />
                      <div>
                        <Label className="text-sm font-medium">Krever signering og opplasting</Label>
                        <p className="text-xs text-muted-foreground">Brukeren må laste ned, fylle ut, signere og laste opp igjen</p>
                      </div>
                    </div>

                    {documentForm.requires_signature && (
                      <div className="pl-6 space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm">Frist for opplasting (dager):</Label>
                          <Input
                            type="number"
                            value={documentForm.upload_deadline_days}
                            onChange={(e) => setDocumentForm(prev => ({ ...prev, upload_deadline_days: parseInt(e.target.value) || 7 }))}
                            className="w-20"
                            min={1}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={documentForm.include_in_pdf}
                        onCheckedChange={(v) => setDocumentForm(prev => ({ ...prev, include_in_pdf: !!v }))}
                      />
                      <div>
                        <Label className="text-sm font-medium">Inkluder i PDF-eksport</Label>
                        <p className="text-xs text-muted-foreground">Dokumentet kan inkluderes i samlet PDF-nedlasting</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleUpload} 
                    disabled={isUploading || selectedFiles.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isUploading 
                      ? "Laster opp..." 
                      : `Last opp ${selectedFiles.length} dokument${selectedFiles.length !== 1 ? 'er' : ''}`
                    }
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-emerald-500/20">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-600">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">Totalt dokumenter</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-600">{stats.mandatoryDocuments}</div>
              <p className="text-xs text-muted-foreground">Obligatoriske maler</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-600">{stats.foldersWithContent}</div>
              <p className="text-xs text-muted-foreground">Mapper med innhold</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i dokumenter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filtrer på kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle kategorier</SelectItem>
              {IK_HMS_FOLDERS.map(folder => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.id}. {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedFolder && (
            <Button variant="outline" onClick={() => setSelectedFolder(null)}>
              Vis alle mapper
            </Button>
          )}
        </div>

        {/* Folder grid */}
        {!selectedFolder && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {IK_HMS_FOLDERS.map(folder => renderFolderCard(folder))}
          </div>
        )}

        {/* Documents grid when folder is selected */}
        {selectedFolder && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedFolder(null)}>
                  ← Tilbake
                </Button>
                <h2 className="font-semibold">
                  Dokumenter i: {allFolderOptions.find(f => f.value === selectedFolder)?.label || selectedFolder}
                </h2>
              </div>
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setDocumentForm(prev => ({ ...prev, category: selectedFolder }));
                  setUploadDialogOpen(true);
                }}
              >
                <Upload className="h-4 w-4 mr-1" />
                Last opp fil her
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
              </div>
            ) : filteredDocuments && filteredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.map(doc => renderDocumentCard(doc))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">Ingen dokumenter i denne mappen</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Last opp ditt første dokument for å komme i gang
                  </p>
                  <Button 
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setDocumentForm(prev => ({ ...prev, category: selectedFolder }));
                      setUploadDialogOpen(true);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Last opp dokument
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Show documents grid when search is active and no folder selected */}
        {!selectedFolder && searchQuery && filteredDocuments && filteredDocuments.length > 0 && (
          <div>
            <h2 className="font-semibold mb-4">Søkeresultater ({filteredDocuments.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map(doc => renderDocumentCard(doc))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
