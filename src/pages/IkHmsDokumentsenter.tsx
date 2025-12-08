import { useState, useRef } from "react";
import { FileText, Upload, Download, Trash2, FolderOpen, Search, Plus, File, FileSpreadsheet, FileImage, Filter } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useIkHmsCompanyDocuments, DOCUMENT_CATEGORIES, IkHmsCompanyDocument } from "@/hooks/useIkHmsCompanyDocuments";
import { useAdminTemplatesForCustomers } from "@/hooks/useAdminTemplatesForCustomers";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

// Template categories relevant for IK HMS
const TEMPLATE_CATEGORIES = [
  "Alle",
  "Arbeidsavtaler",
  "HMS-skjemaer",
  "Rutiner",
  "Risikovurdering",
  "Opplæring",
];

export default function IkHmsDokumentsenter() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }, {
      onSuccess: () => {
        setIsUploadOpen(false);
        setSelectedFile(null);
        setDocumentName("");
        setDescription("");
        setCategory("Generelt");
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

  // Filter admin templates
  const filteredTemplates = adminDocuments.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
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

        {/* Admin Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Maler og skjemaer</CardTitle>
              <CardDescription>
                Last ned standardiserte maler og skjemaer for HMS-arbeid. Disse er tilgjengelige for alle bedrifter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
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
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Ingen maler tilgjengelig ennå</p>
                  <p className="text-sm mt-1">Maler vil bli lagt til av systemadministrator</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredTemplates.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {getFileIcon(doc.file_type)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{doc.document_name}</h3>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{doc.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{doc.category || "Generelt"}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAdminDownload(doc.file_path)}
                        className="shrink-0"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Last ned</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Mine dokumenter</CardTitle>
                  <CardDescription>
                    Last opp og administrer bedriftens egne dokumenter
                  </CardDescription>
                </div>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Last opp dokument
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Last opp dokument</DialogTitle>
                      <DialogDescription>
                        Velg en fil og legg til beskrivelse
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
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
                                Klikk for å velge fil
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
                        <Label htmlFor="category">Kategori</Label>
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
                          rows={3}
                        />
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
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk i dokumenter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alle">Alle kategorier</SelectItem>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Laster dokumenter...
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Ingen dokumenter ennå</p>
                  <p className="text-sm mt-1">Last opp ditt første dokument</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {getFileIcon(doc.file_type)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{doc.document_name}</h3>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{doc.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{doc.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • {format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}
                          </span>
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
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
