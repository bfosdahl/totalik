import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eraser, Check, Pen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onClear?: () => void;
  existingSignature?: string;
  label?: string;
  className?: string;
  enableSavedSignature?: boolean; // Enable loading saved signature from profile
}

export function SignaturePad({
  onSave,
  onClear,
  existingSignature,
  label = "Signatur",
  className,
  enableSavedSignature = true,
}: SignaturePadProps) {
  const { profile } = useAuth();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasExisting, setHasExisting] = useState(!!existingSignature);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [usingSavedSignature, setUsingSavedSignature] = useState(false);

  useEffect(() => {
    if (enableSavedSignature && profile?.id) {
      supabase
        .rpc("get_profile_sensitive_full", { p_profile_id: profile.id })
        .then(({ data }) => {
          const s = Array.isArray(data) ? data[0] : data;
          if (s?.signature_data) setSavedSignature(s.signature_data);
        });
    }
  }, [enableSavedSignature, profile?.id]);

  useEffect(() => {
    if (existingSignature && sigCanvas.current) {
      sigCanvas.current.fromDataURL(existingSignature);
      setIsEmpty(false);
      setHasExisting(true);
    }
  }, [existingSignature]);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
    setHasExisting(false);
    setUsingSavedSignature(false);
    onClear?.();
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      const empty = sigCanvas.current.isEmpty();
      setIsEmpty(empty);
      if (!empty) {
        const dataUrl = sigCanvas.current.toDataURL("image/png");
        onSave(dataUrl);
      }
    }
  };

  const useSavedSignature = () => {
    if (savedSignature) {
      if (sigCanvas.current) {
        sigCanvas.current.fromDataURL(savedSignature);
      }
      setIsEmpty(false);
      setUsingSavedSignature(true);
      onSave(savedSignature);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Pen className="h-4 w-4" />
          {label}
        </label>
        <div className="flex items-center gap-2">
          {savedSignature && !usingSavedSignature && isEmpty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={useSavedSignature}
              className="text-primary"
            >
              <User className="h-4 w-4 mr-1" />
              Bruk min signatur
            </Button>
          )}
          {!isEmpty && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-muted-foreground"
            >
              <Eraser className="h-4 w-4 mr-1" />
              Slett
            </Button>
          )}
        </div>
      </div>

      <Card className={cn(
        "relative overflow-hidden",
        isEmpty && !hasExisting && "border-dashed"
      )}>
        <CardContent className="p-0">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: "w-full h-40 bg-background touch-none",
              style: { width: "100%", height: "160px" },
            }}
            onEnd={handleEnd}
            penColor="hsl(var(--foreground))"
            backgroundColor="transparent"
          />
          
          {isEmpty && !hasExisting && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-muted-foreground text-sm">
                {savedSignature ? "Tegn eller bruk lagret signatur" : "Tegn signaturen din her"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!isEmpty && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3 w-3" />
          {usingSavedSignature ? "Bruker lagret signatur" : "Signatur registrert"}
        </div>
      )}
    </div>
  );
}
