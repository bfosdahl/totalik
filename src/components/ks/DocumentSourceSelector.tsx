import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileCheck, FileText, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useKsProjectDocuments, NewKsProjectDocumentInput } from "@/hooks/useKsProjectDocuments";
import { useKsTemplates } from "@/hooks/useKsProjects";
import { useNavigate } from "react-router-dom";

interface DocumentSourceSelectorProps {
  projectId: string;
  onComplete?: () => void;
}

const DOCUMENT_CATEGORIES = [
  { value: "tegninger", label: "Tegninger" },
  { value: "beskrivelser", label: "Beskrivelser" },
  { value: "sha_plan", label: "SHA-plan" },
  { value: "bilder", label: "Bilder" },
  { value: "endringsmeldinger", label: "Endringsmeldinger" },
  { value: "fdv", label: "FDV-dokumentasjon" },
  { value: "samsvar", label: "Samsvarserklæringer" },
  { value: "kompetanse", label: "Kompetanse/Kurs" },
  { value: "maler", label: "Maler" },
];

export const DocumentSourceSelector = ({ projectId, onComplete }: DocumentSourceSelectorProps) => {
  const navigate = useNavigate();
  const [selectedSource, setSelectedSource] = useState<"upload" | "system" | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isSystemDialogOpen, setIsSystemDialogOpen] = useState(false);
  
  // Upload form state
  const [selectedCategory, setSelectedCategory] = useState("tegninger");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [description, setDescription] = useState("");

  const { uploadDocument, isUploading } = useKsProjectDocuments(projectId);
  const { templates } = useKsTemplates();

  const handleUploadClick = () => {
    setSelectedSource("upload");
    setIsUploadDialogOpen(true);
  };

  const handleSystemClick = () => {
    setSelectedSource("system");
    setIsSystemDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!documentName) {
        setDocumentName(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadSubmit = () => {
    if (!selectedFile || !documentName) return;

    const input: NewKsProjectDocumentInput = {
      document_name: documentName,
      document_number: documentNumber || undefined,
      category: selectedCategory as NewKsProjectDocumentInput['category'],
      description: description || undefined,
      file: selectedFile,
    };

    uploadDocument(input, {
      onSuccess: () => {
        setIsUploadDialogOpen(false);
        resetUploadForm();
        onComplete?.();
      },
    });
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setDocumentName("");
    setDocumentNumber("");
    setDescription("");
    setSelectedCategory("tegninger");
  };

  const handleGoToChecklists = () => {
    setIsSystemDialogOpen(false);
    navigate(`/ks/checklists?project=${projectId}`);
  };

  // Group templates by phase
  const templatesByPhase = templates.reduce((acc, template) => {
    const phase = template.phase || "Generelt";
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Upload Own Documents */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
            selectedSource === "upload" ? "border-primary ring-2 ring-primary/20" : ""
          }`}
          onClick={handleUploadClick}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base">Last opp egne dokumenter</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Bruk eksisterende dokumenter du allerede har
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                PDF, Word, Excel, bilder
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Inkluderes i prosjektperm
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Versjonskontroll
              </li>
            </ul>
            <Button className="w-full mt-4" variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Velg fil og last opp
            </Button>
          </CardContent>
        </Card>

        {/* Use System Checklists/Templates */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
            selectedSource === "system" ? "border-primary ring-2 ring-primary/20" : ""
          }`}
          onClick={handleSystemClick}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <FileCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-base">Bruk systemets sjekklister</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Opprett dokumentasjon med våre maler
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Ferdiglagde KS-maler
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Fyll ut digitalt
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Eksporter som PDF
              </li>
            </ul>
            <Button className="w-full mt-4" variant="outline" size="sm">
              <FileCheck className="h-4 w-4 mr-2" />
              Velg sjekkliste/mal
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Last opp dokument
            </DialogTitle>
            <DialogDescription>
              Last opp ditt eget dokument. Det vil bli lagret og kan inkluderes i prosjektpermen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fil *</Label>
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Dokumentnavn *</Label>
              <Input
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="F.eks. Sjekkliste grunnmur"
              />
            </div>

            <div className="space-y-2">
              <Label>Dokumentnummer / Referanse</Label>
              <Input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Valgfritt"
              />
            </div>

            <div className="space-y-2">
              <Label>Beskrivelse</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Valgfri beskrivelse"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleUploadSubmit}
              disabled={!selectedFile || !documentName || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Laster opp...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Last opp
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* System Templates Dialog */}
      <Dialog open={isSystemDialogOpen} onOpenChange={setIsSystemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Velg sjekkliste fra systemet
            </DialogTitle>
            <DialogDescription>
              Velg en sjekkliste-mal og fyll den ut digitalt. Den lagres automatisk og kan inkluderes i prosjektpermen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {Object.entries(templatesByPhase).map(([phase, phaseTemplates]) => (
              <div key={phase} className="space-y-2">
                <Badge variant="outline" className="mb-2">{phase}</Badge>
                <div className="grid gap-2">
                  {phaseTemplates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        setIsSystemDialogOpen(false);
                        navigate(`/ks/checklists?tab=maler`);
                      }}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{template.name}</p>
                            {template.description && (
                              <p className="text-xs text-muted-foreground">{template.description}</p>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsSystemDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleGoToChecklists}>
              <FileCheck className="h-4 w-4 mr-2" />
              Gå til alle sjekklister
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
