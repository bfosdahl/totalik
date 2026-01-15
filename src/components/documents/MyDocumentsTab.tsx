import { useState, useRef } from "react";
import { 
  FileText, 
  Download, 
  Upload, 
  Trash2, 
  File, 
  FileSpreadsheet, 
  FileImage,
  Plus,
  FolderOpen
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
import { useCompanyModuleDocuments, ModuleDocumentType, CompanyModuleDocument } from "@/hooks/useCompanyModuleDocuments";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface MyDocumentsTabProps {
  moduleType: ModuleDocumentType;
  accentColor?: string;
}

export function MyDocumentsTab({ moduleType, accentColor = "amber" }: MyDocumentsTabProps) {
  const { documents, isLoading, uploadDocument, deleteDocument, getDownloadUrl } = useCompanyModuleDocuments(moduleType);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<CompanyModuleDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.split(".").slice(0, -1).join("."));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName.trim()) return;

    await uploadDocument.mutateAsync({
      file: selectedFile,
      documentName: documentName.trim(),
      description: description.trim() || undefined,
    });

    setUploadDialogOpen(false);
    setSelectedFile(null);
    setDocumentName("");
    setDescription("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      {/* Header with upload button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mine dokumenter</h3>
          <p className="text-sm text-muted-foreground">
            Last opp og administrer dine egne dokumenter
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Last opp
        </Button>
      </div>

      {/* Documents list */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${spinnerColor} mx-auto mb-2`} />
          Laster dokumenter...
        </div>
      ) : documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-medium text-lg">Ingen dokumenter lastet opp</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              Last opp dine egne dokumenter for enkel tilgang
            </p>
            <Button onClick={() => setUploadDialogOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Last opp dokument
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {documents.map((doc) => (
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>•</span>
                  <span>{format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}</span>
                  <span>•</span>
                  <span>{doc.uploaded_by_name}</span>
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(doc)}
                  className="text-destructive hover:text-destructive"
                  title="Slett"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              disabled={!selectedFile || !documentName.trim() || uploadDocument.isPending}
            >
              {uploadDocument.isPending ? "Laster opp..." : "Last opp"}
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
