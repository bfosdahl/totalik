import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { t } from "@/i18n/t";

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
    { id: "d1-1", text: t("auto.legitimasjonskontroll_utfoert"), checked: false },
    { id: "d1-2", text: t("auto.ansatte_kjenner_aldersgrenser_18_oel_vin"), checked: false },
    { id: "d1-3", text: t("auto.stikkproeve_gjennomfoert_av_leder"), checked: false },
  ],
  "Beruselseskontroll": [
    { id: "d2-1", text: t("auto.ingen_skjenking_til_aapenbart_paavirket_"), checked: false },
    { id: "d2-2", text: t("auto.ingen_innslipp_av_aapenbart_berusede"), checked: false },
    { id: "d2-3", text: t("auto.servering_stoppet_ved_tegn_paa_overstadi"), checked: false },
  ],
  "Tidskontroll": [
    { id: "d3-1", text: t("auto.skjenking_stoppet_til_fastsatt_klokkesle"), checked: false },
    { id: "d3-2", text: "Alkohol fjernet fra bord innen 30 min etter skjenkestopp", checked: false },
  ],
  "Bemanning": [
    { id: "d4-1", text: t("auto.styrer_eller_stedfortreder_tilgjengelig"), checked: false },
    { id: "d4-2", text: t("auto.ansatte_med_skjenkeansvar_har_tilstrekke"), checked: false },
  ],
  "Orden og sikkerhet": [
    { id: "d5-1", text: t("auto.situasjonsvurdering_gjennomfoert"), checked: false },
    { id: "d5-2", text: t("auto.konflikter_haandtert_forsvarlig"), checked: false },
    { id: "d5-3", text: "Eventuell vaktrapport skrevet", checked: false },
  ],
  "Daglig avviksregistrering": [
    { id: "d6-1", text: t("auto.forsoek_paa_kjoep_av_mindreaarige_regist"), checked: false },
    { id: "d6-2", text: "Bortvisninger registrert", checked: false },
    { id: "d6-3", text: "Avviste legitimasjoner registrert", checked: false },
    { id: "d6-4", text: "Kontroll fra politi/kommune dokumentert", checked: false },
  ],
};

export const MONTHLY_CHECKLISTS: Record<string, ChecklistItem[]> = {
  "Gjennomgang av avvik": [
    { id: "m1-1", text: t("auto.avviksrapporter_gjennomgaatt"), checked: false },
    { id: "m1-2", text: t("auto.rutiner_kontrollert_foelges_de"), checked: false },
    { id: "m1-3", text: t("auto.tiltak_iverksatt_ved_behov"), checked: false },
  ],
  "Opplæringsstatus": [
    { id: "m2-1", text: "Nye ansatte registrert", checked: false },
    { id: "m2-2", text: t("auto.opplaering_i_alkoholloven_gjennomfoert"), checked: false },
    { id: "m2-3", text: t("auto.gjennomgang_av_interne_rutiner_utfoert"), checked: false },
    { id: "m2-4", text: "Dokumentert signatur innhentet", checked: false },
  ],
  "Risikoanalyse": [
    { id: "m3-1", text: t("auto.risikobildet_vurdert_har_det_endret_seg"), checked: false },
    { id: "m3-2", text: "Nye arrangementer vurdert", checked: false },
    { id: "m3-3", text: t("auto.utvidede_aapningstider_vurdert"), checked: false },
    { id: "m3-4", text: "Endret klientell vurdert", checked: false },
  ],
  "Skjenkekultur": [
    { id: "m4-1", text: "Mønster i avvik vurdert", checked: false },
    { id: "m4-2", text: t("auto.behov_for_mer_opplaering_vurdert"), checked: false },
  ],
  "Bevillingsdokumenter": [
    { id: "m5-1", text: "Bevilling henger synlig", checked: false },
    { id: "m5-2", text: "Styrer/stedfortreder korrekt registrert hos kommunen", checked: false },
  ],
};

export const YEARLY_CHECKLISTS: Record<string, ChecklistItem[]> = {
  "Årlig intern gjennomgang": [
    { id: "y1-1", text: t("auto.internkontrollsystemet_gjennomgaatt"), checked: false },
    { id: "y1-2", text: "Rutiner oppdaterte", checked: false },
    { id: "y1-3", text: "Risikoanalyse oppdatert", checked: false },
    { id: "y1-4", text: "Dokumentasjon komplett", checked: false },
  ],
  "Kunnskapsprøve": [
    { id: "y2-1", text: t("auto.ny_styrer_har_bestaatt_kunnskapsproeve"), checked: false },
    { id: "y2-2", text: t("auto.ny_stedfortreder_har_bestaatt_kunnskapsp"), checked: false },
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
