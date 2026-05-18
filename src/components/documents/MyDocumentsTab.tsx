import { useState, useRef, useMemo } from "react";
import {
  FileText,
  Download,
  Upload,
  Trash2,
  File,
  FileSpreadsheet,
  FileImage,
  Plus,
  FolderOpen,
  Folder,
  FolderPlus,
  ChevronRight,
  MoreVertical,
  FolderInput,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanyModuleDocuments, ModuleDocumentType, CompanyModuleDocument } from "@/hooks/useCompanyModuleDocuments";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface MyDocumentsTabProps {
  moduleType: ModuleDocumentType;
  accentColor?: string;
}

const NEW_FOLDER_SENTINEL = "__new__";
const ROOT_SENTINEL = "__root__";

export function MyDocumentsTab({ moduleType, accentColor = "amber" }: MyDocumentsTabProps) {
  const { documents, isLoading, uploadDocument, deleteDocument, moveDocument, getDownloadUrl } = useCompanyModuleDocuments(moduleType);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [pendingFolders, setPendingFolders] = useState<string[]>([]);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<CompanyModuleDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [description, setDescription] = useState("");
  const [uploadFolder, setUploadFolder] = useState<string>(ROOT_SENTINEL);
  const [customFolderName, setCustomFolderName] = useState("");
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTargetFolder, setMoveTargetFolder] = useState<string>(ROOT_SENTINEL);
  const [moveCustomFolder, setMoveCustomFolder] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive folder list from documents + locally created (still empty) folders
  const folders = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.folder_name) set.add(d.folder_name);
    });
    pendingFolders.forEach((f) => set.add(f));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "nb"));
  }, [documents, pendingFolders]);

  const visibleDocuments = useMemo(() => {
    return documents.filter((d) => (d.folder_name ?? null) === currentFolder);
  }, [documents, currentFolder]);

  const folderDocCount = (folder: string) =>
    documents.filter((d) => d.folder_name === folder).length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.split(".").slice(0, -1).join("."));
      }
    }
  };

  const resolveSelectedFolder = (value: string, custom: string): string | null => {
    if (value === ROOT_SENTINEL) return null;
    if (value === NEW_FOLDER_SENTINEL) return custom.trim() || null;
    return value;
  };

  const openUploadDialog = () => {
    setUploadFolder(currentFolder ? currentFolder : ROOT_SENTINEL);
    setCustomFolderName("");
    setUploadDialogOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName.trim()) return;
    const folderName = resolveSelectedFolder(uploadFolder, customFolderName);

    await uploadDocument.mutateAsync({
      file: selectedFile,
      documentName: documentName.trim(),
      description: description.trim() || undefined,
      folderName: folderName || undefined,
    });

    // Remove from pending if it now has a real doc
    if (folderName) {
      setPendingFolders((prev) => prev.filter((f) => f !== folderName));
    }

    setUploadDialogOpen(false);
    setSelectedFile(null);
    setDocumentName("");
    setDescription("");
    setUploadFolder(ROOT_SENTINEL);
    setCustomFolderName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    if (!folders.includes(name)) {
      setPendingFolders((prev) => [...prev, name]);
    }
    setNewFolderName("");
    setNewFolderDialogOpen(false);
    setCurrentFolder(name);
  };

  const handleDownload = async (doc: CompanyModuleDocument) => {
    const url = await getDownloadUrl(doc.file_path);
    if (url) {
      window.open(url, "_blank");
    }
  };

  const handleDeleteClick = (doc: CompanyModuleDocument) => {
    setSelectedDocument(doc);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedDocument) {
      await deleteDocument.mutateAsync(selectedDocument);
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    }
  };

  const openMoveDialog = (doc: CompanyModuleDocument) => {
    setSelectedDocument(doc);
    setMoveTargetFolder(doc.folder_name || ROOT_SENTINEL);
    setMoveCustomFolder("");
    setMoveDialogOpen(true);
  };

  const handleConfirmMove = async () => {
    if (!selectedDocument) return;
    const target = resolveSelectedFolder(moveTargetFolder, moveCustomFolder);
    await moveDocument.mutateAsync({ id: selectedDocument.id, folderName: target });
    setMoveDialogOpen(false);
    setSelectedDocument(null);
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

  const spinnerColor = accentColor === "orange" ? "border-orange-500" : "border-amber-500";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Mine dokumenter</h3>
          <p className="text-sm text-muted-foreground">
            Organiser dine egne dokumenter i mapper
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setNewFolderDialogOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Ny mappe
          </Button>
          <Button onClick={openUploadDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Last opp
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => setCurrentFolder(null)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors ${
            currentFolder === null ? "font-medium" : "text-muted-foreground"
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          Mine dokumenter
        </button>
        {currentFolder && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="flex items-center gap-1.5 px-2 py-1 font-medium">
              <Folder className="h-4 w-4" />
              {currentFolder}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setCurrentFolder(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Tilbake
            </Button>
          </>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${spinnerColor} mx-auto mb-2`} />
          Laster dokumenter...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Folders (only at root) */}
          {currentFolder === null && folders.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => setCurrentFolder(folder)}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 hover:border-primary/50 transition-colors text-left"
                >
                  <Folder className="h-8 w-8 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{folder}</h4>
                    <p className="text-xs text-muted-foreground">
                      {folderDocCount(folder)} dokument{folderDocCount(folder) === 1 ? "" : "er"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {/* Documents in current view */}
          {visibleDocuments.length === 0 && (currentFolder !== null || folders.length === 0) ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-medium text-lg">
                  {currentFolder ? "Denne mappen er tom" : "Ingen dokumenter lastet opp"}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 mb-4">
                  Last opp dokumenter for enkel tilgang
                </p>
                <Button onClick={openUploadDialog} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Last opp dokument
                </Button>
              </CardContent>
            </Card>
          ) : visibleDocuments.length > 0 ? (
            <div className="grid gap-2">
              {currentFolder === null && (
                <p className="text-xs text-muted-foreground mt-2">Dokumenter uten mappe</p>
              )}
              {visibleDocuments.map((doc) => (
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}</span>
                      <span>•</span>
                      <span className="truncate">{doc.uploaded_by_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                      title="Last ned"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" title="Mer">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openMoveDialog(doc)}>
                          <FolderInput className="h-4 w-4 mr-2" />
                          Flytt til mappe
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(doc)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Slett
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* New folder dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ny mappe</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Mappenavn</Label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="F.eks. Sertifikater, Avtaler, Inspeksjoner"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
              }}
            />
            <p className="text-xs text-muted-foreground">
              Mappen vises permanent når du har lastet opp minst ett dokument i den.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Opprett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Last opp dokument</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fil</Label>
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
              />
            </div>
            <div className="space-y-2">
              <Label>Dokumentnavn</Label>
              <Input
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Skriv inn dokumentnavn"
              />
            </div>
            <div className="space-y-2">
              <Label>Mappe</Label>
              <Select value={uploadFolder} onValueChange={setUploadFolder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROOT_SENTINEL}>Ingen mappe (rot)</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_FOLDER_SENTINEL}>+ Ny mappe...</SelectItem>
                </SelectContent>
              </Select>
              {uploadFolder === NEW_FOLDER_SENTINEL && (
                <Input
                  value={customFolderName}
                  onChange={(e) => setCustomFolderName(e.target.value)}
                  placeholder="Navn på ny mappe"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Beskrivelse (valgfritt)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kort beskrivelse av dokumentet"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                !selectedFile ||
                !documentName.trim() ||
                uploadDocument.isPending ||
                (uploadFolder === NEW_FOLDER_SENTINEL && !customFolderName.trim())
              }
            >
              {uploadDocument.isPending ? "Laster opp..." : "Last opp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flytt til mappe</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Velg mappe</Label>
            <Select value={moveTargetFolder} onValueChange={setMoveTargetFolder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROOT_SENTINEL}>Ingen mappe (rot)</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
                <SelectItem value={NEW_FOLDER_SENTINEL}>+ Ny mappe...</SelectItem>
              </SelectContent>
            </Select>
            {moveTargetFolder === NEW_FOLDER_SENTINEL && (
              <Input
                value={moveCustomFolder}
                onChange={(e) => setMoveCustomFolder(e.target.value)}
                placeholder="Navn på ny mappe"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleConfirmMove}
              disabled={
                moveDocument.isPending ||
                (moveTargetFolder === NEW_FOLDER_SENTINEL && !moveCustomFolder.trim())
              }
            >
              {moveDocument.isPending ? "Flytter..." : "Flytt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett dokument</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{selectedDocument?.document_name}"?
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
