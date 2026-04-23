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
import { Download, Printer, QrCode, Route } from "lucide-react";

interface DailyRoundQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: string;
  roundName: string;
}

export function DailyRoundQrDialog({
  open,
  onOpenChange,
  roundId,
  roundName,
}: DailyRoundQrDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const baseUrl = window.location.origin;
  const qrUrl = `${baseUrl}/ik-mat/runde/${roundId}`;

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 400;
    canvas.width = size;
    canvas.height = size + 100;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`🛣️ ${roundName}`, size / 2, size + 35);
      ctx.font = "14px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText("Skann for å starte daglig runde", size / 2, size + 60);

      const link = document.createElement("a");
      link.download = `QR-Runde-${roundName.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>QR-kode ${roundName}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:Arial,sans-serif;">
          <div style="text-align:center;">
            ${svgData}
            <h2 style="margin-top:20px;">🛣️ ${roundName}</h2>
            <p style="color:#666;">Skann QR-koden og gjennomfør hele runden i én flyt</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR-kode for runde
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 space-y-4">
          <div ref={qrRef} className="bg-white p-4 rounded-lg">
            <QRCodeSVG value={qrUrl} size={220} level="H" includeMargin />
          </div>
          <div className="text-center space-y-1">
            <p className="font-medium text-lg flex items-center justify-center gap-2">
              <Route className="h-5 w-5" /> {roundName}
            </p>
            <p className="text-sm text-muted-foreground">
              Skriv ut og heng opp på kjøkkenet
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-[300px]">
            Når kunden skanner koden, åpnes en wizard som tar dem gjennom alle
            stasjoner i runden – én etter én med "Neste"-knapp.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Skriv ut
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" /> Last ned
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
