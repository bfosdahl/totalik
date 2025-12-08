import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, Check } from "lucide-react";
import { populateExampleProject } from "@/utils/ksModule2PopulateExampleProject";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
      toast.error("Ingen bedrift funnet");
      return;
    }

    setIsLoading(true);
    try {
      const result = await populateExampleProject(projectId, company.id, user?.id);
      
      if (result.success) {
        setIsComplete(true);
        toast.success("Eksempeldata lagt til! Last siden på nytt for å se endringene.");
        onComplete?.();
        // Reload after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error("Kunne ikke legge til eksempeldata: " + result.error);
      }
    } catch (error) {
      console.error("Error populating project:", error);
      toast.error("En feil oppstod");
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
          <AlertDialogTitle>Fyll prosjekt med eksempeldata?</AlertDialogTitle>
          <AlertDialogDescription>
            Dette vil legge til komplett eksempeldata i prosjektet:
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Møtereferater med agenda og aksjoner</li>
              <li>Økonomi med budsjett, kostnader og fakturaer</li>
              <li>Egenkontroller (fullført, pågår, planlagt)</li>
              <li>Avvik og reklamasjoner</li>
              <li>Underleverandører med godkjenningsstatus</li>
              <li>SJA-analyser</li>
              <li>Vernerunder med funn</li>
              <li>Endringsmeldinger</li>
              <li>Stoffkartotek</li>
              <li>Milepæler</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction onClick={handlePopulate}>
            Legg til eksempeldata
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
