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
import { downloadQrAsPng, printQr } from "@/utils/qrCodeExport";
import { t } from "@/i18n/t";

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
    downloadQrAsPng({
      svg,
      filename: `QR-Runde-${roundName}`,
      title: `🛣️ ${roundName}`,
      subtitle: t("auto.skann_for_aa_starte_daglig_runde"),
    });
  };

  const handlePrint = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    printQr({
      svg,
      title: `🛣️ ${roundName}`,
      subtitle: t("auto.skann_qr_koden_og_gjennomfoer_hele_runde"),
    });
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
              {t("auto.skriv_ut_og_heng_opp_paa_kjoekkenet")}
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-[300px]">
            Når kunden skanner koden, åpnes en wizard som tar dem gjennom alle
            stasjoner i runden – én etter én med "Neste"-knapp.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("auto.lukk")}
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
