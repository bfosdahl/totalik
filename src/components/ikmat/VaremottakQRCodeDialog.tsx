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
import { t } from "@/i18n/t";

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
      title: t("auto.varemottak_2"),
      subtitle: t("auto.skann_for_aa_registrere_varemottak"),
    });
  };

  const handlePrint = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    printQr({
      svg,
      title: t("auto.varemottak_2"),
      subtitle: t("auto.skann_qr_koden_for_aa_registrere_varemot"),
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
            <p className="font-medium text-lg">{t("auto.varemottak_2")}</p>
            <p className="text-sm text-muted-foreground">
              {t("auto.skriv_ut_og_heng_opp_ved_varemottaket")}
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-[300px]">
            {t("auto.skann_denne_qr_koden_med_mobilen_for_aa_")}
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("auto.lukk")}
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
