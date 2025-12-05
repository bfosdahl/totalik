import { useState, useRef, useEffect, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pen, Upload, Eraser, Save, Check, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SignatureManagerProps {
  employeeId: string;
  existingSignature?: string | null;
  canManage: boolean;
  onSignatureUpdated?: () => void;
}

export function SignatureManager({
  employeeId,
  existingSignature,
  canManage,
  onSignatureUpdated,
}: SignatureManagerProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"view" | "draw" | "upload">("view");
  const [isSaving, setIsSaving] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);

  // Resize canvas to match container width
  const resizeCanvas = useCallback(() => {
    if (sigCanvas.current && containerRef.current) {
      const canvas = sigCanvas.current.getCanvas();
      const container = containerRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      canvas.width = container.offsetWidth * ratio;
      canvas.height = 160 * ratio;
      canvas.style.width = `${container.offsetWidth}px`;
      canvas.style.height = "160px";
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
      
      sigCanvas.current.clear();
      setDrawnSignature(null);
    }
  }, []);

  // Resize on mount and when mode changes to draw
  useEffect(() => {
    if (mode === "draw") {
      // Small delay to ensure container is rendered
      const timer = setTimeout(resizeCanvas, 50);
      window.addEventListener("resize", resizeCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, [mode, resizeCanvas]);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setDrawnSignature(null);
  };

  const handleDrawEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.toDataURL("image/png");
      setDrawnSignature(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vennligst velg et bilde (PNG, JPG, etc.)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Bildet er for stort. Maks 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedSignature(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const signatureToSave = mode === "draw" ? drawnSignature : uploadedSignature;
    
    if (!signatureToSave) {
      toast.error("Ingen signatur å lagre");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ signature_data: signatureToSave })
        .eq("id", employeeId);

      if (error) throw error;

      toast.success("Signatur lagret");
      setMode("view");
      onSignatureUpdated?.();
    } catch (error) {
      console.error("Error saving signature:", error);
      toast.error("Kunne ikke lagre signatur");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ signature_data: null })
        .eq("id", employeeId);

      if (error) throw error;

      toast.success("Signatur slettet");
      onSignatureUpdated?.();
    } catch (error) {
      console.error("Error deleting signature:", error);
      toast.error("Kunne ikke slette signatur");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setMode("view");
    setDrawnSignature(null);
    setUploadedSignature(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Pen className="w-5 h-5" />
          Min signatur
        </CardTitle>
        <CardDescription>
          Din signatur brukes automatisk når du signerer sjekklister, vernerunder og andre dokumenter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "view" && (
          <>
            {existingSignature ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-background">
                  <img 
                    src={existingSignature} 
                    alt="Din signatur" 
                    className="max-h-32 mx-auto"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  Signatur registrert
                </div>
                {canManage && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => setMode("draw")}>
                      <Pen className="w-4 h-4 mr-2" />
                      Tegn ny signatur
                    </Button>
                    <Button variant="outline" onClick={() => setMode("upload")}>
                      <Upload className="w-4 h-4 mr-2" />
                      Last opp ny signatur
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                      <Eraser className="w-4 h-4 mr-2" />
                      Slett
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Ingen signatur registrert</p>
                  <p className="text-sm mt-1">Legg til signatur for raskere signering av dokumenter</p>
                </div>
                {canManage && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => setMode("draw")}>
                      <Pen className="w-4 h-4 mr-2" />
                      Tegn signatur
                    </Button>
                    <Button variant="outline" onClick={() => setMode("upload")}>
                      <Upload className="w-4 h-4 mr-2" />
                      Last opp signatur
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {mode === "draw" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Tegn signaturen din</Label>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <Eraser className="w-4 h-4 mr-1" />
                Slett
              </Button>
            </div>
            <Card className={cn(
              "relative overflow-hidden",
              !drawnSignature && "border-dashed"
            )}>
              <CardContent className="p-0">
                <div ref={containerRef} className="w-full">
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      className: "bg-background touch-none cursor-crosshair",
                    }}
                    onEnd={handleDrawEnd}
                    penColor="currentColor"
                    backgroundColor="transparent"
                  />
                </div>
                {!drawnSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-muted-foreground text-sm">
                      Tegn signaturen din her
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!drawnSignature || isSaving}>
                <Save className="w-4 h-4 mr-2" />
                Lagre signatur
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                Avbryt
              </Button>
            </div>
          </div>
        )}

        {mode === "upload" && (
          <div className="space-y-4">
            <div>
              <Label>Last opp signaturbilde</Label>
              <p className="text-sm text-muted-foreground mt-1">
                PNG eller JPG, maks 2MB. Bruk gjerne transparent bakgrunn.
              </p>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
            {uploadedSignature && (
              <div className="border rounded-lg p-4 bg-background">
                <img 
                  src={uploadedSignature} 
                  alt="Opplastet signatur" 
                  className="max-h-32 mx-auto"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!uploadedSignature || isSaving}>
                <Save className="w-4 h-4 mr-2" />
                Lagre signatur
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                Avbryt
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
