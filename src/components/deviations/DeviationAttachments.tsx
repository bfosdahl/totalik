import { useRef, useState, useEffect } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { 
  Paperclip, 
  Upload, 
  Trash2, 
  Download, 
  FileImage, 
  FileText,
  File,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeviationAttachments, DeviationAttachment } from "@/hooks/useDeviationAttachments";

interface DeviationAttachmentsProps {
  deviationId: string;
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  if (fileType.startsWith("image/")) return FileImage;
  if (fileType.includes("pdf") || fileType.includes("document")) return FileText;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Component to display attachment with async URL loading
function AttachmentItem({ 
  attachment, 
  getAttachmentUrl, 
  deleteAttachment 
}: { 
  attachment: DeviationAttachment; 
  getAttachmentUrl: (path: string) => Promise<string | null>;
  deleteAttachment: (attachment: DeviationAttachment) => Promise<boolean>;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const FileIcon = getFileIcon(attachment.file_type);
  const isImage = attachment.file_type?.startsWith("image/");

  useEffect(() => {
    if (isImage) {
      getAttachmentUrl(attachment.file_path).then(setImageUrl);
    }
  }, [attachment.file_path, isImage, getAttachmentUrl]);

  const handleDownload = async () => {
    const url = await getAttachmentUrl(attachment.file_path);
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group">
      {isImage && imageUrl ? (
        <img
          src={imageUrl}
          alt={attachment.file_name}
          className="w-10 h-10 object-cover rounded"
        />
      ) : (
        <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
          <FileIcon className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {attachment.file_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.file_size)} • {attachment.uploaded_by_name} • {format(new Date(attachment.created_at), "d. MMM yyyy", { locale: nb })}
        </p>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => deleteAttachment(attachment)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function DeviationAttachments({ deviationId }: DeviationAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    attachments,
    isLoading,
    isUploading,
    uploadAttachment,
    deleteAttachment,
    getAttachmentUrl,
  } = useDeviationAttachments(deviationId);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      await uploadAttachment(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          Vedlegg ({attachments.length})
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Last opp
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground pl-6">
          Ingen vedlegg lagt til
        </p>
      ) : (
        <div className="space-y-2 pl-6">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              getAttachmentUrl={getAttachmentUrl}
              deleteAttachment={deleteAttachment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
