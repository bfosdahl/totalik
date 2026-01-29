import { useState, useEffect } from "react";
import { FlaskConical, MapPin, Building2, AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useGlobalChemicalRegistry, CompanyChemicalEntry } from "@/hooks/useGlobalChemicalRegistry";
import { cn } from "@/lib/utils";

interface EditChemicalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: CompanyChemicalEntry;
  projectId: string;
}

const getDangerClassColor = (dangerClass: string): string => {
  const classColors: Record<string, string> = {
    "Brannfarlig": "bg-orange-100 text-orange-800 border-orange-300",
    "Oksiderende": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Eksplosiv": "bg-red-100 text-red-800 border-red-300",
    "Giftig": "bg-purple-100 text-purple-800 border-purple-300",
    "Etsende": "bg-rose-100 text-rose-800 border-rose-300",
    "Irriterende": "bg-amber-100 text-amber-800 border-amber-300",
    "Helseskadelig": "bg-pink-100 text-pink-800 border-pink-300",
    "Miljøskadelig": "bg-green-100 text-green-800 border-green-300",
    "Gass under trykk": "bg-blue-100 text-blue-800 border-blue-300",
  };
  return classColors[dangerClass] || "bg-gray-100 text-gray-800 border-gray-300";
};

export const EditChemicalEntryDialog = ({
  open,
  onOpenChange,
  entry,
  projectId,
}: EditChemicalEntryDialogProps) => {
  const [location, setLocation] = useState(entry.location || "");
  const [quantity, setQuantity] = useState(entry.quantity || "");
  const [customNotes, setCustomNotes] = useState(entry.custom_notes || "");

  const { updateCompanyEntry, isUpdating } = useGlobalChemicalRegistry(projectId);

  useEffect(() => {
    setLocation(entry.location || "");
    setQuantity(entry.quantity || "");
    setCustomNotes(entry.custom_notes || "");
  }, [entry]);

  const handleSave = () => {
    updateCompanyEntry({
      id: entry.id,
      location: location.trim() || undefined,
      quantity: quantity.trim() || undefined,
      customNotes: customNotes.trim() || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const chemical = entry.global_chemical;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Rediger stoffinformasjon
          </DialogTitle>
          <DialogDescription>
            Oppdater bedriftsspesifikk informasjon for dette stoffet
          </DialogDescription>
        </DialogHeader>

        {chemical && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FlaskConical className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{chemical.product_name}</h3>
                  {chemical.manufacturer && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {chemical.manufacturer}
                    </p>
                  )}
                  {chemical.cas_number && (
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      CAS: {chemical.cas_number}
                    </p>
                  )}
                  {chemical.danger_classes?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {chemical.danger_classes.map((dc, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className={cn("text-xs", getDangerClassColor(dc))}
                        >
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                          {dc}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="location">
              <MapPin className="h-3 w-3 inline mr-1" />
              Lagringssted
            </Label>
            <Input
              id="location"
              placeholder="F.eks. Kjemikalskap A, Lager 2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="quantity">Mengde</Label>
            <Input
              id="quantity"
              placeholder="F.eks. 5 liter, 2 kg"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="customNotes">Egne notater</Label>
            <Textarea
              id="customNotes"
              placeholder="Lokale risikovurderinger, bruksanvisninger, verneutstyr..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Disse notatene er kun synlige for din bedrift
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lagre endringer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
