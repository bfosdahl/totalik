import { useRef, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadQrAsPng, printQr } from "@/utils/qrCodeExport";

type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'periodic';

const FREQUENCY_CONFIG: Record<FrequencyType, { label: string; emoji: string; description: string }> = {
  daily: { label: 'Daglig', emoji: '📋', description: 'daglig renhold' },
  weekly: { label: 'Ukentlig', emoji: '📅', description: 'ukentlig renhold' },
  monthly: { label: 'Månedlig', emoji: '🗓️', description: 'månedlig renhold' },
  periodic: { label: 'Periodisk', emoji: '🔄', description: 'periodisk renhold' },
};

interface RenholdQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenholdQRCodeDialog({
  open,
  onOpenChange,
}: RenholdQRCodeDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyType>('daily');

  const baseUrl = window.location.origin;
  const config = FREQUENCY_CONFIG[selectedFrequency];

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    downloadQrAsPng({
      svg,
      filename: `QR-Renhold-${config.label}`,
      title: `${config.emoji} ${config.label} renhold`,
      subtitle: `Skann for ${config.description}`,
    });
  };

  const handlePrint = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    printQr({
      svg,
      title: `${config.emoji} ${config.label} renhold`,
      subtitle: `Skann QR-koden for ${config.description}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR-koder for renhold
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedFrequency} onValueChange={(v) => setSelectedFrequency(v as FrequencyType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily" className="text-xs">Daglig</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">Ukentlig</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Månedlig</TabsTrigger>
            <TabsTrigger value="periodic" className="text-xs">Periodisk</TabsTrigger>
          </TabsList>

          {(['daily', 'weekly', 'monthly', 'periodic'] as FrequencyType[]).map((freq) => (
            <TabsContent key={freq} value={freq}>
              <div className="flex flex-col items-center py-4 space-y-4">
                <div ref={freq === selectedFrequency ? qrRef : undefined} className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={`${baseUrl}/ik-mat/kontroll?tab=renholdsplan&frequency=${freq}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="text-center space-y-1">
                  <p className="font-medium text-lg">{FREQUENCY_CONFIG[freq].emoji} {FREQUENCY_CONFIG[freq].label} renhold</p>
                  <p className="text-sm text-muted-foreground">
                    Skriv ut og heng opp i aktuelt område
                  </p>
                </div>

                <p className="text-xs text-muted-foreground text-center max-w-[300px]">
                  Skann denne QR-koden med mobilen for å gå direkte til {FREQUENCY_CONFIG[freq].description}.
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>

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
