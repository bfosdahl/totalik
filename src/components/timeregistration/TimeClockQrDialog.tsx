import { useState, useEffect } from "react";
import { QrCode, Copy, Download, Plus, Trash2 } from "lucide-react";
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

interface TimeClockQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimeClockQrDialog({ open, onOpenChange }: TimeClockQrDialogProps) {
  const { qrCodes, generateQrCode, deleteQrCode } = useTimeClock();
  const [newName, setNewName] = useState("Hovedkontor");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Angi et navn for stemplingsstedet");
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
    toast.success("URL kopiert til utklippstavlen");
  };

  const downloadQrCode = (qrCode: TimeClockQrCode) => {
    // Generate QR code using Google Charts API
    const qrUrl = getQrUrl(qrCode.code);
    const googleQrUrl = `https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=${encodeURIComponent(qrUrl)}&choe=UTF-8`;
    
    const link = document.createElement("a");
    link.href = googleQrUrl;
    link.download = `qr-stempling-${qrCode.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.click();
    toast.success("QR-kode lastet ned");
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
            Generer QR-koder som ansatte kan skanne for å stemple inn/ut
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new QR code */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="qr-name" className="sr-only">
                Navn på stemplingssted
              </Label>
              <Input
                id="qr-name"
                placeholder="Navn (f.eks. Hovedkontor, Lager)"
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
              <p>Ingen QR-koder ennå</p>
              <p className="text-sm">Opprett en QR-kode for å komme i gang</p>
            </div>
          ) : (
            <div className="space-y-3">
              {qrCodes.map((qr) => (
                <Card key={qr.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* QR Code preview */}
                      <img
                        src={`https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=${encodeURIComponent(getQrUrl(qr.code))}&choe=UTF-8`}
                        alt={`QR-kode for ${qr.name}`}
                        className="w-20 h-20 rounded border"
                      />
                      
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
            <p className="font-medium mb-1">💡 Slik bruker du QR-koden:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Last ned eller skriv ut QR-koden</li>
              <li>Heng den opp ved inngangen til arbeidsplassen</li>
              <li>Ansatte skanner med telefonen for å stemple inn/ut</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
