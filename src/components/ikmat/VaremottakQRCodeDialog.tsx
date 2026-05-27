import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, Printer } from "lucide-react";
import { downloadQrAsPng, printQr } from "@/utils/qrCodeExport";

interface VaremottakQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VaremottakQRCodeDialog({
  open,
  onOpenChange,
}: VaremottakQRCodeDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const baseUrl = window.location.origin;
  const qrUrl = `${baseUrl}/ik-mat/kontroll?tab=sporbarhet&action=ny`;

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    downloadQrAsPng({
      svg,
      filename: "QR-Varemottak",
      title: "📦 Varemottak",
      subtitle: "Skann for å registrere varemottak",
    });
  };

  const handlePrint = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    printQr({
      svg,
      title: "📦 Varemottak",
      subtitle: "Skann QR-koden for å registrere varemottak",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR-kode for varemottak
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-4">
          <div ref={qrRef} className="bg-white p-4 rounded-lg">
            <QRCodeSVG
              value={qrUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="text-center space-y-1">
            <p className="font-medium text-lg">📦 Varemottak</p>
            <p className="text-sm text-muted-foreground">
              Skriv ut og heng opp ved varemottaket
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-[300px]">
            Skann denne QR-koden med mobilen for å gå direkte til registrering av varemottak.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Skriv ut
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Last ned QR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
