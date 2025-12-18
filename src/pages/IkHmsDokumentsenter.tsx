import { useState, useRef } from "react";
import { FileText, Upload, Download, Trash2, FolderOpen, Search, Plus, File, FileSpreadsheet, FileImage, Filter, Shield, UserCheck, AlertTriangle, ClipboardList, GraduationCap, FlaskConical, HeartPulse, FolderPlus, ChevronDown, ChevronRight, FileCheck, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useIkHmsCompanyDocuments, DOCUMENT_CATEGORIES, IK_HMS_CATEGORIES, IkHmsCompanyDocument } from "@/hooks/useIkHmsCompanyDocuments";
import { useAdminTemplatesForCustomers } from "@/hooks/useAdminTemplatesForCustomers";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

// Icon map for dynamic rendering
const iconMap: Record<string, React.ElementType> = {
  Shield,
  UserCheck,
  AlertTriangle,
  ClipboardList,
  GraduationCap,
  FlaskConical,
  HeartPulse,
  FolderPlus,
};

export default function IkHmsDokumentsenter() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { documents, isLoading, uploadDocument, deleteDocument, getDownloadUrl, isUploading } = useIkHmsCompanyDocuments();
  const { documents: adminDocuments, isLoading: adminLoading, getDocumentUrl } = useAdminTemplatesForCustomers();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Generelt");
  const [includeInPdf, setIncludeInPdf] = useState(true);
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [uploadDeadlineDays, setUploadDeadlineDays] = useState<number | undefined>(undefined);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["1", "2"]);
  const [expandedMyFolders, setExpandedMyFolders] = useState<string[]>(["1"]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const toggleMyFolder = (folderId: string) => {
    setExpandedMyFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  // Get templates by category
  const getTemplatesByCategory = (categoryName: string) => {
    return adminDocuments.filter(doc => doc.category === categoryName);
  };

  // Get company documents by category
  const getDocumentsByCategory = (categoryName: string) => {
    return documents.filter(doc => doc.category === categoryName);
  };

  // Open upload dialog with pre-selected category
  const openUploadForCategory = (categoryName: string) => {
    setCategory(categoryName);
    setIsUploadOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !documentName) return;
    
    uploadDocument({
      file: selectedFile,
      documentName,
      description: description || undefined,
      category,
      uploaderName: profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.email || "Ukjent",
      includeInPdf,
      requiresSignature,
      uploadDeadlineDays: requiresSignature ? uploadDeadlineDays : undefined,
    }, {
      onSuccess: () => {
        setIsUploadOpen(false);
        setSelectedFile(null);
        setDocumentName("");
        setDescription("");
        setCategory("Generelt");
        setIncludeInPdf(true);
        setRequiresSignature(false);
        setUploadDeadlineDays(undefined);
      }
    });
  };

  const handleDownload = async (doc: IkHmsCompanyDocument) => {
    const url = await getDownloadUrl(doc.file_path);
    if (url) {
      window.open(url, "_blank");
    }
  };

  const handleAdminDownload = async (filePath: string) => {
    const url = await getDocumentUrl(filePath);
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("Kunne ikke åpne dokument");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Ukjent størrelse";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-8 w-8 text-muted-foreground" />;
    if (fileType.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    if (fileType.includes("image")) return <FileImage className="h-8 w-8 text-blue-500" />;
    if (fileType.includes("word") || fileType.includes("document")) return <FileText className="h-8 w-8 text-blue-600" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  // Filter company documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "Alle" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
    <div className="space-y-6">
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)} 
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">Dokumentsenter</h1>
        <p className="text-muted-foreground mt-1">
          Last ned maler og administrer bedriftens dokumenter
        </p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Maler fra systemet</span>
            <span className="sm:hidden">Maler</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Mine dokumenter</span>
            <span className="sm:hidden">Dokumenter</span>
          </TabsTrigger>
        </TabsList>

        {/* Admin Templates Tab - Show all admin documents grouped by their actual category */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk i maler..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {adminLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Laster maler...
            </div>
          ) : adminDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Ingen maler tilgjengelig ennå</p>
              <p className="text-sm mt-1">Maler vil bli lagt til av systemadministrator</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group documents by their actual category */}
              {(() => {
                // Get unique categories from admin documents
                const categories = [...new Set(adminDocuments.map(doc => doc.category || "Generelt"))].sort();
                
                return categories.map((categoryName) => {
                  const categoryDocs = adminDocuments.filter(doc => (doc.category || "Generelt") === categoryName);
                  const isExpanded = expandedFolders.includes(categoryName);
                  
                  // Filter by search
                  const filteredCategoryDocs = categoryDocs.filter(doc =>
                    doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  // Skip if no docs match search
                  if (searchQuery && filteredCategoryDocs.length === 0) return null;

                  return (
                    <Collapsible
                      key={categoryName}
                      open={isExpanded}
                      onOpenChange={() => {
                        setExpandedFolders(prev => 
                          prev.includes(categoryName) 
                            ? prev.filter(id => id !== categoryName)
                            : [...prev, categoryName]
                        );
                      }}
                    >
                      <Card className="overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary">
                                <FolderOpen className="h-5 w-5 text-primary-foreground" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-base flex items-center gap-2">
                                  {categoryName}
                                  <Badge variant="secondary" className="ml-2">
                                    {categoryDocs.length} maler
                                  </Badge>
                                </CardTitle>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0 pb-4">
                            <div className="grid gap-2">
                              {(searchQuery ? filteredCategoryDocs : categoryDocs).map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  {getFileIcon(doc.file_type)}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{doc.document_name}</h4>
                                    {doc.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1">{doc.description}</p>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {formatFileSize(doc.file_size)}
                                    </span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAdminDownload(doc.file_path)}
                                    className="shrink-0"
                                  >
                                    <Download className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Last ned</span>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                });
              })()}
            </div>
          )}
        </TabsContent>

        {/* Company Documents Tab - Folder View */}
        <TabsContent value="documents" className="space-y-4">
          {/* Upload Dialog */}
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Last opp dokument</DialogTitle>
                <DialogDescription>
                  Velg en fil og legg til informasjon
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>Fil</Label>
                  <div
                    className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        {getFileIcon(selectedFile.type)}
                        <div className="text-left">
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Klikk for å velge fil eller dra og slipp
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                </div>
                <div>
                  <Label htmlFor="docName">Dokumentnavn</Label>
                  <Input
                    id="docName"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Gi dokumentet et navn"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Kategori / Mappe</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Legg til en beskrivelse..."
                    rows={2}
                  />
                </div>
                
                {/* PDF inclusion option */}
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="includeInPdf"
                    checked={includeInPdf}
                    onCheckedChange={(checked) => setIncludeInPdf(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="includeInPdf" className="text-sm font-medium cursor-pointer">
                      Inkluder i PDF-rapport
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Dokumentet vil inkluderes i handbok-eksporten
                    </p>
                  </div>
                  <FileCheck className="h-5 w-5 text-emerald-500" />
                </div>

                {/* Signature requirement option */}
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requiresSignature"
                      checked={requiresSignature}
                      onCheckedChange={(checked) => setRequiresSignature(checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="requiresSignature" className="text-sm font-medium cursor-pointer">
                        Krever signering
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Marker at dette dokumentet må signeres og lastes opp på nytt
                      </p>
                    </div>
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  
                  {requiresSignature && (
                    <div className="ml-6">
                      <Label htmlFor="deadline" className="text-sm">Frist for opplasting (dager)</Label>
                      <Input
                        id="deadline"
                        type="number"
                        min={1}
                        max={365}
                        value={uploadDeadlineDays || ""}
                        onChange={(e) => setUploadDeadlineDays(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="f.eks. 14"
                        className="mt-1 w-32"
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                  Avbryt
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || !documentName || isUploading}
                >
                  {isUploading ? "Laster opp..." : "Last opp"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Search and Add button */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk i dokumenter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Last opp
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Laster dokumenter...
            </div>
          ) : (
            <div className="grid gap-4">
              {IK_HMS_CATEGORIES.map((folder) => {
                const IconComponent = iconMap[folder.icon] || FolderOpen;
                const folderDocuments = getDocumentsByCategory(folder.name);
                const isExpanded = expandedMyFolders.includes(folder.id);
                
                // Filter by search
                const filteredFolderDocs = folderDocuments.filter(doc =>
                  doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                  <Collapsible
                    key={folder.id}
                    open={isExpanded}
                    onOpenChange={() => toggleMyFolder(folder.id)}
                  >
                    <Card className="overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${folder.color}`}>
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                {folder.id}. {folder.name}
                                <Badge variant="secondary" className="ml-2">
                                  {folderDocuments.length} dok
                                </Badge>
                              </CardTitle>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openUploadForCategory(folder.name);
                              }}
                              className="shrink-0"
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Last opp</span>
                            </Button>
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4">
                          {filteredFolderDocs.length === 0 ? (
                            <div 
                              className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => openUploadForCategory(folder.name)}
                            >
                              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Ingen dokumenter ennå</p>
                              <p className="text-xs mt-1">Klikk for å laste opp</p>
                            </div>
                          ) : (
                            <div className="grid gap-2">
                              {filteredFolderDocs.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  {getFileIcon(doc.file_type)}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{doc.document_name}</h4>
                                    {doc.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1">{doc.description}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-1 mt-1">
                                      <span className="text-xs text-muted-foreground">
                                        {formatFileSize(doc.file_size)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        • {format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}
                                      </span>
                                      {doc.include_in_pdf && (
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 text-emerald-600 border-emerald-300">
                                          <FileCheck className="h-2.5 w-2.5 mr-0.5" />
                                          PDF
                                        </Badge>
                                      )}
                                      {doc.requires_signature && (
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 text-amber-600 border-amber-300">
                                          <Clock className="h-2.5 w-2.5 mr-0.5" />
                                          Signering
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDownload(doc)}
                                      title="Last ned"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-destructive hover:text-destructive"
                                          title="Slett"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Slett dokument?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Er du sikker på at du vil slette "{doc.document_name}"? 
                                            Denne handlingen kan ikke angres.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={() => deleteDocument(doc)}
                                          >
                                            Slett
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </AppLayout>
  );
}
