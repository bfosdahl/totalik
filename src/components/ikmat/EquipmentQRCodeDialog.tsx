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
import { Download, QrCode } from "lucide-react";
import { EQUIPMENT_TYPE_DEFAULTS } from "@/lib/temperatureGuidelines";
import type { TemperatureEquipment } from "@/hooks/useIkMatTemperature";
import { downloadQrAsPng } from "@/utils/qrCodeExport";

interface EquipmentQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: TemperatureEquipment | null;
}

export function EquipmentQRCodeDialog({
  open,
  onOpenChange,
  equipment,
}: EquipmentQRCodeDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  if (!equipment) return null;

  const baseUrl = window.location.origin;
  const qrUrl = `${baseUrl}/ik-mat/kontroll?action=log-temp&equipment=${equipment.id}`;
  const typeLabelForCaption =
    EQUIPMENT_TYPE_DEFAULTS[equipment.equipment_type as keyof typeof EQUIPMENT_TYPE_DEFAULTS]?.label ||
    equipment.equipment_type;

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    downloadQrAsPng({
      svg,
      filename: `QR-${equipment.name}`,
      title: equipment.name,
      subtitle: typeLabelForCaption,
    });
  };

  const typeLabel = EQUIPMENT_TYPE_DEFAULTS[equipment.equipment_type as keyof typeof EQUIPMENT_TYPE_DEFAULTS]?.label || equipment.equipment_type;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR-kode for {equipment.name}
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

          <div className="text-center">
            <p className="font-medium">{equipment.name}</p>
            <p className="text-sm text-muted-foreground">{typeLabel}</p>
            {equipment.location && (
              <p className="text-sm text-muted-foreground">📍 {equipment.location}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-[300px]">
            Skann denne QR-koden for å gå direkte til temperaturregistrering for dette utstyret.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lukk
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
