import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Loader2,
  CheckCircle2,
  X
} from "lucide-react";
import { useKsModule2ShaPlan } from "@/hooks/useKsModule2ShaPlan";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  projectId: string;
  onCancel: () => void;
}

export function Ks2ShaPlanUpload({ projectId, onCancel }: Props) {
  const { uploadExternalPlan, isSaving } = useKsModule2ShaPlan(projectId);
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploaderName, setUploaderName] = useState("");
  const [version, setVersion] = useState("1.0");
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    await uploadExternalPlan(file, uploaderName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Last opp ekstern SHA-plan</h2>
          <p className="text-muted-foreground">SHA-plan mottatt fra byggherre</p>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Last opp SHA-plan (PDF)</CardTitle>
          <CardDescription>Dra og slipp filen eller klikk for å velge</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? "border-blue-500 bg-blue-500/10" 
                : file 
                  ? "border-emerald-500 bg-emerald-500/10" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-emerald-500" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  Dra og slipp PDF-fil her
                </p>
                <p className="text-sm text-muted-foreground mb-4">eller</p>
                <label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">Velg fil</span>
                  </Button>
                </label>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Opplastingsinformasjon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Lastet opp av</Label>
              <Input 
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="Ditt navn"
              />
            </div>
            <div className="space-y-2">
              <Label>Versjon</Label>
              <Input 
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="f.eks. 1.0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-400">
                Hva skjer videre?
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• SHA-planen lagres i dokumentsenteret (mappe "20 SHA")</li>
                <li>• Du må bekrefte at planen er mottatt og implementert i vårt HMS-system</li>
                <li>• En tilpasning opprettes automatisk der du kan dokumentere hvordan dere ivaretar kravene</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Avbryt
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={!file || !uploaderName || isSaving}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Laster opp...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Last opp SHA-plan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
