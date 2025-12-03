import { QrCode, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useKsModule2Projects } from "@/hooks/useKsModule2Projects";
import { toast } from "sonner";

interface Ks2AccessQrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function Ks2AccessQrCodeDialog({ 
  open, 
  onOpenChange, 
  projectId 
}: Ks2AccessQrCodeDialogProps) {
  const [copied, setCopied] = useState(false);
  const { projects } = useKsModule2Projects();
  const project = projects.find(p => p.id === projectId);
  
  const loginUrl = `${window.location.origin}/auth?redirect=/ks2/project/${projectId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(loginUrl)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(loginUrl);
    setCopied(true);
    toast.success("Lenke kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR-kode for innlogging
          </DialogTitle>
          <DialogDescription>
            Underleverandører kan skanne denne koden for rask innlogging
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {project && (
            <div className="text-center">
              <p className="text-sm font-medium">{project.project_number}</p>
              <p className="text-sm text-muted-foreground">{project.project_name}</p>
            </div>
          )}

          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <img 
                src={qrCodeUrl} 
                alt="QR Code for project login" 
                className="w-48 h-48"
              />
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Skann med mobilen for å gå direkte til innloggingssiden
          </p>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={copyLink}
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Kopier lenke
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open(loginUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
