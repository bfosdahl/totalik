import { useRef } from "react";
import { 
  Upload, 
  Trash2, 
  FileImage, 
  FileText,
  File,
  Loader2,
  Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PendingFile {
  id: string;
  file: File;
  preview?: string;
}

interface DeviationFileUploadProps {
  files: PendingFile[];
  onFilesChange: (files: PendingFile[]) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return FileImage;
  if (fileType.includes("pdf") || fileType.includes("document")) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DeviationFileUpload({ 
  files, 
  onFilesChange, 
  isUploading = false,
  disabled = false 
}: DeviationFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    const newFiles: PendingFile[] = Array.from(selectedFiles).map(file => {
      const pendingFile: PendingFile = {
        id: crypto.randomUUID(),
        file,
      };
      
      // Create preview for images
      if (file.type.startsWith("image/")) {
        pendingFile.preview = URL.createObjectURL(file);
      }
      
      return pendingFile;
    });

    onFilesChange([...files, ...newFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    onFilesChange(files.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          Vedlegg {files.length > 0 && `(${files.length})`}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          disabled={disabled || isUploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Legg til filer
        </Button>
      </div>

      {files.length === 0 ? (
        <p className="text-xs text-muted-foreground pl-6">
          Ingen vedlegg lagt til ennå
        </p>
      ) : (
        <div className="space-y-2 pl-6">
          {files.map((pendingFile) => {
            const FileIcon = getFileIcon(pendingFile.file.type);
            const isImage = pendingFile.file.type.startsWith("image/");

            return (
              <div 
                key={pendingFile.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 group"
              >
                {isImage && pendingFile.preview ? (
                  <img
                    src={pendingFile.preview}
                    alt={pendingFile.file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
                    <FileIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {pendingFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(pendingFile.file.size)}
                  </p>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(pendingFile.id)}
                  disabled={disabled || isUploading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}