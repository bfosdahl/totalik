import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SignatureCanvas from "react-signature-canvas";
import { EmploymentContract } from "@/hooks/useEmploymentContracts";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Loader2, Check, Pen, RotateCcw } from "lucide-react";

interface ContractSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: EmploymentContract | null;
  signatureType: 'employee' | 'employer';
  onSign: (signature: string) => void;
  isSigning?: boolean;
}

const contractTypeLabels: Record<string, string> = {
  permanent: 'Fast ansettelse',
  temporary: 'Midlertidig ansettelse',
  project: 'Prosjektansettelse',
  probation: 'Prøvetidsavtale',
  apprentice: 'Lærlingkontrakt',
  internship: 'Praksisplass',
};

export function ContractSignatureDialog({
  open,
  onOpenChange,
  contract,
  signatureType,
  onSign,
  isSigning,
}: ContractSignatureDialogProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const resizeCanvas = useCallback(() => {
    if (signatureRef.current && containerRef.current) {
      const canvas = signatureRef.current.getCanvas();
      const container = containerRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = container.offsetWidth * ratio;
      canvas.height = 150 * ratio;
      canvas.style.width = `${container.offsetWidth}px`;
      canvas.style.height = '150px';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(resizeCanvas, 100);
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [open, resizeCanvas]);

  const handleClear = () => {
    signatureRef.current?.clear();
    setHasSignature(false);
  };

  const handleSignatureEnd = () => {
    setHasSignature(!signatureRef.current?.isEmpty());
  };

  const handleSign = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureData = signatureRef.current.toDataURL('image/png');
      onSign(signatureData);
    }
  };

  if (!contract) return null;

  const employeeName = contract.employee 
    ? `${contract.employee.first_name || ''} ${contract.employee.last_name || ''}`.trim()
    : 'Ukjent';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {signatureType === 'employer' ? 'Signer som arbeidsgiver' : 'Signer ansettelsesavtale'}
          </DialogTitle>
          <DialogDescription>
            Les gjennom avtaledetaljene og signer nederst
          </DialogDescription>
        </DialogHeader>

        {/* Contract Details */}
        <Card className="p-4 bg-muted/50">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{employeeName}</h3>
                <p className="text-muted-foreground">{contract.position}</p>
              </div>
              <Badge variant="outline">
                {contractTypeLabels[contract.contract_type] || contract.contract_type}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Stillingsprosent:</span>
                <span className="ml-2 font-medium">{contract.employment_percentage}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Startdato:</span>
                <span className="ml-2 font-medium">
                  {format(new Date(contract.start_date), 'd. MMMM yyyy', { locale: nb })}
                </span>
              </div>
              {contract.end_date && (
                <div>
                  <span className="text-muted-foreground">Sluttdato:</span>
                  <span className="ml-2 font-medium">
                    {format(new Date(contract.end_date), 'd. MMMM yyyy', { locale: nb })}
                  </span>
                </div>
              )}
              {contract.probation_period_months && (
                <div>
                  <span className="text-muted-foreground">Prøvetid:</span>
                  <span className="ml-2 font-medium">{contract.probation_period_months} måneder</span>
                </div>
              )}
            </div>

            {contract.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground">Notater:</span>
                  <p className="text-sm mt-1">{contract.notes}</p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Signature Status */}
        <div className="flex gap-4">
          <div className="flex-1 p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              {contract.signed_by_employer ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Pen className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Arbeidsgiver</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {contract.signed_by_employer ? 'Signert' : 'Venter på signatur'}
            </p>
          </div>
          <div className="flex-1 p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              {contract.signed_by_employee ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Pen className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Arbeidstaker</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {contract.signed_by_employee ? 'Signert' : 'Venter på signatur'}
            </p>
          </div>
        </div>

        {/* Signature Pad */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Din signatur</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Nullstill
            </Button>
          </div>
          <div
            ref={containerRef}
            className="border rounded-lg bg-white overflow-hidden"
          >
            <SignatureCanvas
              ref={signatureRef}
              penColor="black"
              canvasProps={{
                className: 'w-full cursor-crosshair',
                style: { touchAction: 'none' }
              }}
              onEnd={handleSignatureEnd}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Tegn signaturen din i feltet over
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSign} 
            disabled={!hasSignature || isSigning}
          >
            {isSigning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Signer avtale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
