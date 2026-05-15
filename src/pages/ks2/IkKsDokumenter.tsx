import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FolderPlus,
  FileText, 
  Trash2, 
  Download,
  Upload,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Loader2,
  Search,
  Link2
} from "lucide-react";
import { useCompanyKsDocuments, CompanyKsDocument, CompanyKsDocumentFolder } from "@/hooks/useCompanyKsDocuments";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
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
import { Textarea } from "@/components/ui/textarea";

export default function IkKsDokumenter() {
  const { 
    documents, 
    folders, 
    isLoading, 
    isSaving, 
    uploadDocument, 
    updateDocument,
    deleteDocument, 
    getDocumentUrl,
    createFolder,
    deleteFolder,
    getDocumentsByFolder 
  } = useCompanyKsDocuments();
  const { projects } = useKsModule2Projects();
  
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    documentName: "",
    description: "",
    folderId: "",
    projectId: "",
  });
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadData(prev => ({ ...prev, documentName: file.name }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await uploadDocument(selectedFile, {
      documentName: uploadData.documentName || selectedFile.name,
      description: uploadData.description,
      folderId: uploadData.folderId && uploadData.folderId !== "__none__" ? uploadData.folderId : undefined,
      projectId: uploadData.projectId && uploadData.projectId !== "__none__" ? uploadData.projectId : undefined,
    });
    setSelectedFile(null);
    setUploadData({ documentName: "", description: "", folderId: "", projectId: "" });
    setShowUploadDialog(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName);
    setNewFolderName("");
    setShowFolderDialog(false);
  };

  const handleDownload = async (doc: CompanyKsDocument) => {
    const url = await getDocumentUrl(doc.file_path);
    if (url) {
      window.open(url, "_blank");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocuments = searchQuery
    ? documents.filter(d => 
        d.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents;

  const rootDocuments = getDocumentsByFolder(null);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">KS Dokumentsenter</h1>
            <p className="text-muted-foreground mt-1">
              Bedriftens dokumenter og maler for kvalitetssikring
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Ny mappe
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opprett mappe</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Mappenavn</label>
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="F.eks. Tegninger"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
                      Avbryt
                    </Button>
                    <Button onClick={handleCreateFolder} disabled={isSaving || !newFolderName.trim()}>
                      Opprett
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Last opp
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Last opp dokument</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="w-full h-24 border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {selectedFile ? (
                        <div className="text-center">
                          <FileText className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-sm">{selectedFile.name}</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Klikk for å velge fil</span>
                        </div>
                      )}
                    </Button>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dokumentnavn</label>
                    <Input
                      value={uploadData.documentName}
                      onChange={(e) => setUploadData({ ...uploadData, documentName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Beskrivelse</label>
                    <Textarea
                      value={uploadData.description}
                      onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mappe (valgfritt)</label>
                    <Select
                      value={uploadData.folderId}
                      onValueChange={(value) => setUploadData({ ...uploadData, folderId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg mappe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ingen mappe</SelectItem>
                        {folders.map(folder => (
                          <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Koble til prosjekt (valgfritt)</label>
                    <Select
                      value={uploadData.projectId}
                      onValueChange={(value) => setUploadData({ ...uploadData, projectId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg prosjekt" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ingen prosjekt</SelectItem>
                        {projects?.map(project => (
                          <SelectItem key={project.id} value={project.id}>{project.project_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                      Avbryt
                    </Button>
                    <Button onClick={handleUpload} disabled={isSaving || !selectedFile}>
                      {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Last opp
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk i dokumenter..."
            className="pl-9"
          />
        </div>

        {/* Folders and documents */}
        <div className="space-y-2">
          {folders.map(folder => (
            <FolderItem
              key={folder.id}
              folder={folder}
              documents={getDocumentsByFolder(folder.id)}
              isExpanded={expandedFolders.has(folder.id)}
              onToggle={() => toggleFolder(folder.id)}
              onDownload={handleDownload}
              onDelete={deleteDocument}
              onDeleteFolder={() => deleteFolder(folder.id)}
              formatFileSize={formatFileSize}
              isSaving={isSaving}
            />
          ))}

          {/* Root documents (no folder) */}
          {rootDocuments.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Uten mappe ({rootDocuments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {rootDocuments.map(doc => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      onDownload={() => handleDownload(doc)}
                      onDelete={() => deleteDocument(doc.id)}
                      formatFileSize={formatFileSize}
                      isSaving={isSaving}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {documents.length === 0 && folders.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">Ingen dokumenter ennå</h3>
                <p className="text-muted-foreground mb-4">
                  Last opp dokumenter og maler for kvalitetssikring
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Last opp dokument
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function FolderItem({
  folder,
  documents,
  isExpanded,
  onToggle,
  onDownload,
  onDelete,
  onDeleteFolder,
  formatFileSize,
  isSaving,
}: {
  folder: CompanyKsDocumentFolder;
  documents: CompanyKsDocument[];
  isExpanded: boolean;
  onToggle: () => void;
  onDownload: (doc: CompanyKsDocument) => void;
  onDelete: (id: string) => void;
  onDeleteFolder: () => void;
  formatFileSize: (bytes: number | null) => string;
  isSaving: boolean;
}) {
  return (
    <Card>
      <CardHeader 
        className="py-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-5 h-5 text-amber-500" />
            ) : (
              <Folder className="w-5 h-5 text-amber-500" />
            )}
            <CardTitle className="text-sm font-medium">{folder.name}</CardTitle>
            <Badge variant="secondary" className="text-xs">{documents.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder();
            }}
            disabled={isSaving}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Ingen dokumenter i denne mappen</p>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  onDownload={() => onDownload(doc)}
                  onDelete={() => onDelete(doc.id)}
                  formatFileSize={formatFileSize}
                  isSaving={isSaving}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function DocumentRow({
  doc,
  onDownload,
  onDelete,
  formatFileSize,
  isSaving,
}: {
  doc: CompanyKsDocument;
  onDownload: () => void;
  onDelete: () => void;
  formatFileSize: (bytes: number | null) => string;
  isSaving: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{doc.document_name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatFileSize(doc.file_size)}</span>
            {doc.project && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  {doc.project.project_name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDownload}>
          <Download className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={isSaving}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
