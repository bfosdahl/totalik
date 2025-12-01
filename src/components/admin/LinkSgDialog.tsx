import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Building2, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface SGEnterprise {
  name: string;
  organizational_number: string;
  exp_date: Date | null;
  businessaddress: {
    line_1?: string;
    postal_town?: string;
  };
  valid_approval_areas: Array<{
    subject_area: string;
  }>;
}

interface LinkSgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  sgEnterprise: SGEnterprise;
  onLinked: () => void;
}

export function LinkSgDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  sgEnterprise,
  onLinked,
}: LinkSgDialogProps) {
  const [isLinking, setIsLinking] = useState(false);

  const handleLink = async () => {
    setIsLinking(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          sg_approved: true,
          sg_org_number: sgEnterprise.organizational_number,
          sg_expiry_date: sgEnterprise.exp_date?.toISOString().split('T')[0] || null,
          sg_approval_areas: sgEnterprise.valid_approval_areas.map(a => a.subject_area),
        })
        .eq("id", companyId);

      if (error) throw error;

      toast({
        title: "SG-godkjenning koblet",
        description: `${companyName} er nå koblet til SG-registeret`,
      });

      onLinked();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Feil ved kobling",
        description: error instanceof Error ? error.message : "Ukjent feil",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Koble SG-godkjenning</DialogTitle>
          <DialogDescription>
            Koble {companyName} til Sentral Godkjenning registeret
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-start gap-3 mb-3">
              <Building2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg">{sgEnterprise.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Org.nr: {sgEnterprise.organizational_number}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {sgEnterprise.exp_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Utløper: {format(sgEnterprise.exp_date, "d. MMMM yyyy", { locale: nb })}</span>
                </div>
              )}
              
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span>
                  {sgEnterprise.businessaddress.line_1 || 'Ikke oppgitt'}, {sgEnterprise.businessaddress.postal_town || 'Ikke oppgitt'}
                </span>
              </div>

              {sgEnterprise.valid_approval_areas.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="font-medium">Godkjenningsområder:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sgEnterprise.valid_approval_areas.map((area, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {area.subject_area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm">
              Dette vil oppdatere bedriftens profil med SG-godkjenningsinformasjon. 
              Informasjonen vil være synlig i prosjektrapporter og dokumentasjon.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleLink} disabled={isLinking}>
            {isLinking ? "Kobler..." : "Koble til bedrift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
