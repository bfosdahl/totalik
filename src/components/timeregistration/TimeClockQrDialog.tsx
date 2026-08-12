import { useState, useRef } from "react";
import { QrCode, Copy, Download, Plus, Trash2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useTimeClock, TimeClockQrCode } from "@/hooks/useTimeClock";
import { t } from "@/i18n/t";

interface TimeClockQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimeClockQrDialog({ open, onOpenChange }: TimeClockQrDialogProps) {
  const { qrCodes, generateQrCode, deleteQrCode } = useTimeClock();
  const [newName, setNewName] = useState("Hovedkontor");
  const [isCreating, setIsCreating] = useState(false);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error(t("auto.angi_et_navn_for_stemplingsstedet"));
      return;
    }
    setIsCreating(true);
    await generateQrCode(newName.trim());
    setNewName("");
    setIsCreating(false);
  };

  const getQrUrl = (code: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/stemple?kode=${code}`;
  };

  const copyUrl = (code: string) => {
    navigator.clipboard.writeText(getQrUrl(code));
    toast.success(t("auto.url_kopiert_til_utklippstavlen"));
  };

  const downloadQrCode = (qrCode: TimeClockQrCode) => {
    const canvas = canvasRefs.current[qrCode.id];
    if (!canvas) {
      toast.error(t("auto.kunne_ikke_laste_ned_qr_koden"));
      return;
    }
    
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-stempling-${qrCode.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.click();
    toast.success(t("auto.qr_kode_lastet_ned"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR-kode stempling
          </DialogTitle>
          <DialogDescription>
            {t("auto.generer_qr_koder_som_ansatte_kan_skanne_")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new QR code */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="qr-name" className="sr-only">
                {t("auto.navn_paa_stemplingssted")}
              </Label>
              <Input
                id="qr-name"
                placeholder={t("auto.navn_f_eks_hovedkontor_lager")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-1" />
              Opprett
            </Button>
          </div>

          {/* List of QR codes */}
          {qrCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t("auto.ingen_qr_koder_ennaa")}</p>
              <p className="text-sm">{t("auto.opprett_en_qr_kode_for_aa_komme_i_gang")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {qrCodes.map((qr) => (
                <Card key={qr.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* QR Code preview */}
                      <div className="w-20 h-20 rounded border bg-white p-1 overflow-hidden">
                        <QRCodeCanvas
                          value={getQrUrl(qr.code)}
                          size={400}
                          level="H"
                          style={{ width: '72px', height: '72px' }}
                          ref={(el) => {
                            if (el) canvasRefs.current[qr.id] = el;
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{qr.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {getQrUrl(qr.code)}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyUrl(qr.code)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Kopier URL
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadQrCode(qr)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Last ned
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteQrCode(qr.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-1">{t("auto.slik_bruker_du_qr_koden")}</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>{t("auto.last_ned_eller_skriv_ut_qr_koden")}</li>
              <li>{t("auto.heng_den_opp_ved_inngangen_til_arbeidspl")}</li>
              <li>{t("auto.ansatte_skanner_med_telefonen_for_aa_ste")}</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
