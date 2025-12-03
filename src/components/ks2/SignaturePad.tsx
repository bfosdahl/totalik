import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eraser, Check, Pen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onClear?: () => void;
  existingSignature?: string;
  label?: string;
  className?: string;
}

export function SignaturePad({
  onSave,
  onClear,
  existingSignature,
  label = "Signatur",
  className,
}: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasExisting, setHasExisting] = useState(!!existingSignature);

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

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          <Pen className="h-4 w-4" />
          {label}
        </label>
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
                Tegn signaturen din her
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!isEmpty && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3 w-3" />
          Signatur registrert
        </div>
      )}
    </div>
  );
}
