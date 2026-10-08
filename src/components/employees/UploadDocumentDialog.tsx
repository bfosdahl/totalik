import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X } from "lucide-react";
import { useEmployeeDocuments } from "@/hooks/useEmployees";
import { t } from "@/i18n/t";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  uploaderName: string;
}

export function UploadDocumentDialog({ 
  open, 
  onOpenChange, 
  employeeId,
  uploaderName 
}: UploadDocumentDialogProps) {
  const { uploadDocument } = useEmployeeDocuments(employeeId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    uploadDocument.mutate({
      file: selectedFile,
      description,
      employeeId,
      uploaderName,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setSelectedFile(null);
        setDescription("");
      },
    });
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("auto.last_opp_dokument")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-10 h-10 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {t("auto.klikk_eller_dra_og_slipp_fil_her")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, Word, Excel eller bilder (maks 10MB)
                </p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("auto.beskrivelse")}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("auto.kort_beskrivelse_av_dokumentet_2")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button type="submit" disabled={!selectedFile || uploadDocument.isPending}>
              {uploadDocument.isPending ? "Laster opp..." : "Last opp"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}