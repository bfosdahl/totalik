import { useState, useRef } from "react";
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

  // Create URL that deep-links to temperature registration for this equipment
  const baseUrl = window.location.origin;
  const qrUrl = `${baseUrl}/ik-mat/kontroll?action=log-temp&equipment=${equipment.id}`;

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    // Create canvas and draw SVG
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 400;
    canvas.width = size;
    canvas.height = size + 80; // Extra space for text

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw QR code
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);

      // Add equipment name below QR code
      ctx.fillStyle = "#000000";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(equipment.name, size / 2, size + 35);

      // Add type
      ctx.font = "16px Arial";
      ctx.fillStyle = "#666666";
      const typeLabel = EQUIPMENT_TYPE_DEFAULTS[equipment.equipment_type as keyof typeof EQUIPMENT_TYPE_DEFAULTS]?.label || equipment.equipment_type;
      ctx.fillText(typeLabel, size / 2, size + 60);

      // Download
      const link = document.createElement("a");
      link.download = `QR-${equipment.name.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
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
