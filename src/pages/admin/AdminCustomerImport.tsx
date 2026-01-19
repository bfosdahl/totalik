import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  User,
  Mail,
  Phone,
  AlertTriangle,
  Target,
  Users,
  ClipboardList,
  Sparkles,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ExtractedData {
  firmanavn: string | null;
  epost: string | null;
  kontaktperson: string | null;
  telefon: string | null;
  organisasjonsnummer: string | null;
  farekilder: string[];
  hmsmal: string[];
  kursOgOpplaering: {
    harRutiner: boolean;
    beskrivelse: string | null;
  } | null;
  organisasjon: {
    dagligLeder: string | null;
    verneombud: string | null;
    andreRoller: Array<{ rolle: string; navn: string }>;
  } | null;
  avvikssystem: {
    harEgetSystem: boolean;
    beskrivelse: string | null;
  } | null;
  bransje: string | null;
  tilleggsinformasjon: string | null;
}

export default function AdminCustomerImport() {
  const { isSystemAdmin } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Kun PDF og bilder (PNG, JPG) er støttet");
        return;
      }
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("Filen er for stor. Maks 10MB");
        return;
      }
      setFile(selectedFile);
      setTextContent("");
      setExtractedData(null);
      setError(null);
    }
  }, []);

  const handleProcess = async () => {
    if (!file && !textContent.trim()) {
      toast.error("Last opp en fil eller lim inn tekst");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedData(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Du må være logget inn");
        return;
      }

      let requestBody: any = {};

      if (file) {
        // Convert file to base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        requestBody = {
          pdfBase64: base64,
          fileName: file.name
        };
      } else {
        requestBody = { textContent };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-customer-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(requestBody)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Parsing feilet');
      }

      if (result.success && result.data) {
        setExtractedData(result.data);
        toast.success("Dokumentet ble analysert!");
      } else {
        throw new Error('Ingen data returnert');
      }

    } catch (err) {
      console.error('Error processing document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ukjent feil';
      setError(errorMessage);
      toast.error(`Feil: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTextContent("");
    setExtractedData(null);
    setError(null);
  };

  const handleCreateCompany = () => {
    if (!extractedData) return;
    
    // Store extracted data in session storage for the create company flow
    sessionStorage.setItem('customer-import-data', JSON.stringify(extractedData));
    toast.success("Data lagret. Gå til bedriftsopprettelse for å fortsette.");
    navigate('/admin/companies');
  };

  if (!isSystemAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold">Ingen tilgang</h2>
            <p className="text-muted-foreground">Du må være systemadministrator for å bruke denne funksjonen.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Kunde-import
          </h1>
          <p className="text-muted-foreground">
            Last opp kunde-PDF eller lim inn tekst for å ekstrahere HMS-data automatisk
          </p>
        </div>
        {(file || textContent || extractedData) && (
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Start på nytt
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Last opp dokument
            </CardTitle>
            <CardDescription>
              Last opp en PDF eller bilde, eller lim inn tekst direkte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Fil (PDF, PNG, JPG)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Klikk for å laste opp eller dra og slipp
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, PNG eller JPG (maks 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">eller</span>
              <Separator className="flex-1" />
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <Label htmlFor="text-content">Lim inn tekst</Label>
              <Textarea
                id="text-content"
                placeholder="Lim inn tekst fra kundens dokument her..."
                value={textContent}
                onChange={(e) => {
                  setTextContent(e.target.value);
                  if (e.target.value) setFile(null);
                }}
                rows={8}
                className="resize-none"
              />
            </div>

            <Button 
              onClick={handleProcess} 
              disabled={isProcessing || (!file && !textContent.trim())}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyserer...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyser med AI
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Feil ved analyse</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Ekstrahert data
            </CardTitle>
            <CardDescription>
              Gjennomgå og godkjenn data før import
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!extractedData && !isProcessing && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Last opp et dokument for å se ekstrahert data her
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">AI analyserer dokumentet...</p>
              </div>
            )}

            {extractedData && (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {/* Company Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Bedriftsinformasjon
                    </h3>
                    <div className="grid gap-2 text-sm">
                      {extractedData.firmanavn && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Firma:</span>
                          <span className="font-medium">{extractedData.firmanavn}</span>
                        </div>
                      )}
                      {extractedData.organisasjonsnummer && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Org.nr:</span>
                          <span className="font-medium">{extractedData.organisasjonsnummer}</span>
                        </div>
                      )}
                      {extractedData.bransje && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bransje:</span>
                          <Badge variant="secondary">{extractedData.bransje}</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Kontaktinformasjon
                    </h3>
                    <div className="grid gap-2 text-sm">
                      {extractedData.kontaktperson && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{extractedData.kontaktperson}</span>
                        </div>
                      )}
                      {extractedData.epost && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{extractedData.epost}</span>
                        </div>
                      )}
                      {extractedData.telefon && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{extractedData.telefon}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Hazards */}
                  {extractedData.farekilder && extractedData.farekilder.length > 0 && (
                    <>
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Farekilder
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {extractedData.farekilder.map((farekilde, idx) => (
                            <Badge key={idx} variant="destructive" className="font-normal">
                              {farekilde}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* HMS Goals */}
                  {extractedData.hmsmal && extractedData.hmsmal.length > 0 && (
                    <>
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          HMS-mål
                        </h3>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {extractedData.hmsmal.map((mal, idx) => (
                            <li key={idx}>{mal}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Organization */}
                  {extractedData.organisasjon && (
                    <>
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Organisasjon
                        </h3>
                        <div className="grid gap-2 text-sm">
                          {extractedData.organisasjon.dagligLeder && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Daglig leder:</span>
                              <span className="font-medium">{extractedData.organisasjon.dagligLeder}</span>
                            </div>
                          )}
                          {extractedData.organisasjon.verneombud && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Verneombud:</span>
                              <span className="font-medium">{extractedData.organisasjon.verneombud}</span>
                            </div>
                          )}
                          {extractedData.organisasjon.andreRoller?.map((rolle, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-muted-foreground">{rolle.rolle}:</span>
                              <span className="font-medium">{rolle.navn}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Training */}
                  {extractedData.kursOgOpplaering && (
                    <>
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          Kurs og opplæring
                        </h3>
                        <div className="text-sm">
                          <Badge variant={extractedData.kursOgOpplaering.harRutiner ? "default" : "secondary"}>
                            {extractedData.kursOgOpplaering.harRutiner ? "Har rutiner" : "Mangler rutiner"}
                          </Badge>
                          {extractedData.kursOgOpplaering.beskrivelse && (
                            <p className="mt-2 text-muted-foreground">
                              {extractedData.kursOgOpplaering.beskrivelse}
                            </p>
                          )}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Additional Info */}
                  {extractedData.tilleggsinformasjon && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Tilleggsinformasjon</h3>
                      <p className="text-sm text-muted-foreground">
                        {extractedData.tilleggsinformasjon}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-4">
                    <Button onClick={handleCreateCompany} className="w-full">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Fortsett til bedriftsopprettelse
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
