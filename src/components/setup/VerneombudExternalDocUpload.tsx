import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, X, Info } from "lucide-react";

interface VerneombudExternalDocUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  signedDate: string;
  onSignedDateChange: (date: string) => void;
  existingFileName?: string | null;
  disabled?: boolean;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function VerneombudExternalDocUpload({
  file,
  onFileChange,
  signedDate,
  onSignedDateChange,
  existingFileName,
  disabled,
}: VerneombudExternalDocUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex gap-2">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Er avtalen signert på papir eller på annen måte? Last opp en skannet kopi eller et
          bilde av den signerte avtalen som dokumentasjon. Da trenger dere ikke signere digitalt.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Dokumentasjon på signert avtale *</Label>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onFileChange(f);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />

        {file ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40">
            <FileText className="w-8 h-8 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => onFileChange(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            onClick={() => !disabled && inputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Klikk for å velge fil</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, bilde eller Word (maks 20MB)</p>
            {existingFileName && (
              <p className="text-xs text-primary mt-2">
                Allerede lastet opp: {existingFileName}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="externalSignedDate">Dato avtalen ble signert</Label>
        <Input
          id="externalSignedDate"
          type="date"
          value={signedDate}
          disabled={disabled}
          onChange={(e) => onSignedDateChange(e.target.value)}
        />
      </div>
    </div>
  );
}
