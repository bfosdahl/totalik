import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  comment?: string;
}

export interface ControlEntry {
  id: string;
  company_id: string;
  control_type: 'daily' | 'monthly' | 'yearly';
  control_category: string;
  control_date: string;
  checklist_items: ChecklistItem[];
  notes: string | null;
  completed_by_id: string | null;
  completed_by_name: string | null;
  status: 'draft' | 'completed';
  created_at: string;
  updated_at: string;
}

// Predefined checklists per category
export const DAILY_CHECKLISTS: Record<string, ChecklistItem[]> = {
  "Alderskontroll": [
    { id: "d1-1", text: "Legitimasjonskontroll utført", checked: false },
    { id: "d1-2", text: "Ansatte kjenner aldersgrenser (18 øl/vin, 20 brennevin)", checked: false },
    { id: "d1-3", text: "Stikkprøve gjennomført av leder", checked: false },
  ],
  "Beruselseskontroll": [
    { id: "d2-1", text: "Ingen skjenking til åpenbart påvirket person", checked: false },
    { id: "d2-2", text: "Ingen innslipp av åpenbart berusede", checked: false },
    { id: "d2-3", text: "Servering stoppet ved tegn på overstadig beruselse", checked: false },
  ],
  "Tidskontroll": [
    { id: "d3-1", text: "Skjenking stoppet til fastsatt klokkeslett", checked: false },
    { id: "d3-2", text: "Alkohol fjernet fra bord innen 30 min etter skjenkestopp", checked: false },
  ],
  "Bemanning": [
    { id: "d4-1", text: "Styrer eller stedfortreder tilgjengelig", checked: false },
    { id: "d4-2", text: "Ansatte med skjenkeansvar har tilstrekkelig opplæring", checked: false },
  ],
  "Orden og sikkerhet": [
    { id: "d5-1", text: "Situasjonsvurdering gjennomført", checked: false },
    { id: "d5-2", text: "Konflikter håndtert forsvarlig", checked: false },
    { id: "d5-3", text: "Eventuell vaktrapport skrevet", checked: false },
  ],
  "Daglig avviksregistrering": [
    { id: "d6-1", text: "Forsøk på kjøp av mindreårige registrert", checked: false },
    { id: "d6-2", text: "Bortvisninger registrert", checked: false },
    { id: "d6-3", text: "Avviste legitimasjoner registrert", checked: false },
    { id: "d6-4", text: "Kontroll fra politi/kommune dokumentert", checked: false },
  ],
};

export const MONTHLY_CHECKLISTS: Record<string, ChecklistItem[]> = {
  "Gjennomgang av avvik": [
    { id: "m1-1", text: "Avviksrapporter gjennomgått", checked: false },
    { id: "m1-2", text: "Rutiner kontrollert – følges de?", checked: false },
    { id: "m1-3", text: "Tiltak iverksatt ved behov", checked: false },
  ],
  "Opplæringsstatus": [
    { id: "m2-1", text: "Nye ansatte registrert", checked: false },
    { id: "m2-2", text: "Opplæring i alkoholloven gjennomført", checked: false },
    { id: "m2-3", text: "Gjennomgang av interne rutiner utført", checked: false },
    { id: "m2-4", text: "Dokumentert signatur innhentet", checked: false },
  ],
  "Risikoanalyse": [
    { id: "m3-1", text: "Risikobildet vurdert – har det endret seg?", checked: false },
    { id: "m3-2", text: "Nye arrangementer vurdert", checked: false },
    { id: "m3-3", text: "Utvidede åpningstider vurdert", checked: false },
    { id: "m3-4", text: "Endret klientell vurdert", checked: false },
  ],
  "Skjenkekultur": [
    { id: "m4-1", text: "Mønster i avvik vurdert", checked: false },
    { id: "m4-2", text: "Behov for mer opplæring vurdert", checked: false },
  ],
  "Bevillingsdokumenter": [
    { id: "m5-1", text: "Bevilling henger synlig", checked: false },
    { id: "m5-2", text: "Styrer/stedfortreder korrekt registrert hos kommunen", checked: false },
  ],
};

export const YEARLY_CHECKLISTS: Record<string, ChecklistItem[]> = {
  "Årlig intern gjennomgang": [
    { id: "y1-1", text: "Internkontrollsystemet gjennomgått", checked: false },
    { id: "y1-2", text: "Rutiner oppdaterte", checked: false },
    { id: "y1-3", text: "Risikoanalyse oppdatert", checked: false },
    { id: "y1-4", text: "Dokumentasjon komplett", checked: false },
  ],
  "Kunnskapsprøve": [
    { id: "y2-1", text: "Ny styrer har bestått kunnskapsprøve", checked: false },
    { id: "y2-2", text: "Ny stedfortreder har bestått kunnskapsprøve", checked: false },
  ],
  "Rapportering til kommune": [
    { id: "y3-1", text: "Omsetningsoppgave innsendt", checked: false },
    { id: "y3-2", text: "Bevillingsgebyr betalt", checked: false },
  ],
};

export function useIkAlkoholControls() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: controls = [], isLoading } = useQuery({
    queryKey: ["ik-alkohol-controls", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("ik_alkohol_controls" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("control_date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ControlEntry[];
    },
    enabled: !!companyId,
  });

  const saveControl = useMutation({
    mutationFn: async (entry: Omit<ControlEntry, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("ik_alkohol_controls" as any)
        .insert(entry as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-controls"] });
      toast.success("Kontroll lagret");
    },
    onError: (e: any) => toast.error("Kunne ikke lagre: " + e.message),
  });

  const deleteControl = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ik_alkohol_controls" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-controls"] });
      toast.success("Kontroll slettet");
    },
    onError: (e: any) => toast.error("Kunne ikke slette: " + e.message),
  });

  return { controls, isLoading, saveControl, deleteControl, companyId };
}
