import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKsModule2SubcontractorDocuments } from "@/hooks/useKsModule2Subcontractors";

const DOCUMENT_TYPES = [
  { value: 'contract', label: 'Kontrakt' },
  { value: 'insurance', label: 'Forsikring' },
  { value: 'certification', label: 'Sertifisering' },
  { value: 'competence', label: 'Kompetanse' },
  { value: 'hms_card', label: 'HMS-kort' },
  { value: 'other', label: 'Annet' },
] as const;

interface Ks2SubcontractorDocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcontractorId: string;
}

export function Ks2SubcontractorDocumentUpload({
  open,
  onOpenChange,
  subcontractorId,
}: Ks2SubcontractorDocumentUploadProps) {
  const { uploadDocument, isUploading } = useKsModule2SubcontractorDocuments(subcontractorId);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [documentName, setDocumentName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!documentName) {
        setDocumentName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = () => {
    if (!file || !documentType || !documentName) return;

    uploadDocument(
      {
        file,
        documentType: documentType as any,
        documentName,
        expiryDate: expiryDate || undefined,
      },
      {
        onSuccess: () => {
          setFile(null);
          setDocumentType("");
          setDocumentName("");
          setExpiryDate("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Last opp dokument
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Dokumenttype *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Velg type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentName">Dokumentnavn *</Label>
            <Input
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="F.eks. Skatteattest 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Utløpsdato</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Fil *</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{file.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Klikk for å velge fil
                  </p>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ position: 'relative' }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || !documentType || !documentName || isUploading}
            >
              {isUploading ? "Laster opp..." : "Last opp"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
