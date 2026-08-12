import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, Check } from "lucide-react";
import { populateExampleProject } from "@/utils/ksModule2PopulateExampleProject";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { t } from "@/i18n/t";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Ks2PopulateExampleButtonProps {
  projectId: string;
  onComplete?: () => void;
}

export function Ks2PopulateExampleButton({ projectId, onComplete }: Ks2PopulateExampleButtonProps) {
  const { company, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handlePopulate = async () => {
    if (!company?.id) {
      toast.error(t("auto.ingen_bedrift_funnet"));
      return;
    }

    setIsLoading(true);
    try {
      const result = await populateExampleProject(projectId, company.id, user?.id);
      
      if (result.success) {
        setIsComplete(true);
        toast.success(t("auto.eksempeldata_lagt_til_last_siden_paa_nyt"));
        onComplete?.();
        // Reload after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(t("auto.kunne_ikke_legge_til_eksempeldata") + result.error);
      }
    } catch (error) {
      console.error("Error populating project:", error);
      toast.error(t("auto.en_feil_oppstod"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Check className="h-4 w-4 text-green-500" />
        Data lagt til!
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Legger til data...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Fyll med eksempeldata
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("auto.fyll_prosjekt_med_eksempeldata")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("auto.dette_vil_legge_til_komplett_eksempeldat")}
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>{t("auto.moetereferater_med_agenda_og_aksjoner")}</li>
              <li>{t("auto.oekonomi_med_budsjett_kostnader_og_faktu")}</li>
              <li>Egenkontroller (fullført, pågår, planlagt)</li>
              <li>{t("auto.avvik_og_reklamasjoner")}</li>
              <li>{t("auto.underleverandoerer_med_godkjenningsstatu")}</li>
              <li>{t("auto.sja_analyser")}</li>
              <li>{t("auto.vernerunder_med_funn")}</li>
              <li>{t("auto.endringsmeldinger")}</li>
              <li>{t("auto.stoffkartotek")}</li>
              <li>{t("auto.milepaeler")}</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
          <AlertDialogAction onClick={handlePopulate}>
            {t("auto.legg_til_eksempeldata")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
