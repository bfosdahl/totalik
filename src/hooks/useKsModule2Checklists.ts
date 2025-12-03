import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ChecklistItem {
  id: string;
  text: string;
  type: "yes_no" | "number" | "text" | "photo" | "signature";
  required: boolean;
  value?: string | number | boolean | null;
  comment?: string;
  photos?: string[];
}

export interface KsModule2Checklist {
  id: string;
  project_id: string;
  company_id: string;
  title: string;
  template_name: string;
  responsible_user_id: string | null;
  responsible_user_name: string | null;
  deadline_date: string | null;
  status: "planned" | "in_progress" | "completed" | "rejected";
  progress_percent: number;
  completed_at: string | null;
  is_paper_version: boolean;
  paper_uploaded: boolean;
  paper_file_path: string | null;
  checklist_items: ChecklistItem[];
  signatures: any[];
  pdf_file_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplate {
  name: string;
  category: string;
  items: Omit<ChecklistItem, "value" | "comment" | "photos">[];
}

export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    name: "Betongstøp gulv",
    category: "Betong",
    items: [
      { id: "1", text: "Forskaling kontrollert og godkjent", type: "yes_no", required: true },
      { id: "2", text: "Armering montert iht. tegning", type: "yes_no", required: true },
      { id: "3", text: "Betongkvalitet dokumentert", type: "yes_no", required: true },
      { id: "4", text: "Temperatur ved støp (°C)", type: "number", required: true },
      { id: "5", text: "Herdetid registrert", type: "yes_no", required: true },
      { id: "6", text: "Dokumentasjonsbilde", type: "photo", required: true },
      { id: "7", text: "Signatur utførende", type: "signature", required: true },
    ],
  },
  {
    name: "Våtrom NS-3600",
    category: "Våtrom",
    items: [
      { id: "1", text: "Underlag kontrollert – jevnt og tørt", type: "yes_no", required: true },
      { id: "2", text: "Fall mot sluk kontrollert (mm/m)", type: "number", required: true },
      { id: "3", text: "Membran påført iht. produsentens anvisning", type: "yes_no", required: true },
      { id: "4", text: "Tetthetsprøve utført", type: "yes_no", required: true },
      { id: "5", text: "Slukmansjett montert og tettet", type: "yes_no", required: true },
      { id: "6", text: "Bilde av membran før flislegging", type: "photo", required: true },
      { id: "7", text: "Fliser lagt med korrekt fuge", type: "yes_no", required: true },
      { id: "8", text: "Signatur utførende", type: "signature", required: true },
    ],
  },
  {
    name: "Sluttkontroll leilighet",
    category: "Ferdigstillelse",
    items: [
      { id: "1", text: "Alle rom rengjort", type: "yes_no", required: true },
      { id: "2", text: "Elektrisk anlegg testet", type: "yes_no", required: true },
      { id: "3", text: "VVS-anlegg testet", type: "yes_no", required: true },
      { id: "4", text: "Ventilasjon kontrollert", type: "yes_no", required: true },
      { id: "5", text: "Dører og vinduer justert", type: "yes_no", required: true },
      { id: "6", text: "Overflater uten skader", type: "yes_no", required: true },
      { id: "7", text: "FDV-dokumentasjon overlevert", type: "yes_no", required: true },
      { id: "8", text: "Bilde av ferdig leilighet", type: "photo", required: true },
      { id: "9", text: "Signatur kontrollør", type: "signature", required: true },
    ],
  },
  {
    name: "Tømrer – innvendig",
    category: "Tømrer",
    items: [
      { id: "1", text: "Stenderverk montert iht. tegning", type: "yes_no", required: true },
      { id: "2", text: "Isolasjon lagt korrekt", type: "yes_no", required: true },
      { id: "3", text: "Dampsperre montert tett", type: "yes_no", required: true },
      { id: "4", text: "Gipsplater montert", type: "yes_no", required: true },
      { id: "5", text: "Sparklet og slipt", type: "yes_no", required: true },
      { id: "6", text: "Dokumentasjonsbilde", type: "photo", required: false },
      { id: "7", text: "Signatur utførende", type: "signature", required: true },
    ],
  },
  {
    name: "FDV-kontroll",
    category: "FDV",
    items: [
      { id: "1", text: "Produktdatablader samlet", type: "yes_no", required: true },
      { id: "2", text: "Brukerveiledninger vedlagt", type: "yes_no", required: true },
      { id: "3", text: "Garantidokumenter samlet", type: "yes_no", required: true },
      { id: "4", text: "Samsvarserklæringer komplett", type: "yes_no", required: true },
      { id: "5", text: "Tegninger as-built oppdatert", type: "yes_no", required: true },
      { id: "6", text: "Signatur ansvarlig", type: "signature", required: true },
    ],
  },
  {
    name: "Elektro – føringsveier",
    category: "Elektro",
    items: [
      { id: "1", text: "Kabelbroer montert iht. tegning", type: "yes_no", required: true },
      { id: "2", text: "Rør og kanaler lagt", type: "yes_no", required: true },
      { id: "3", text: "Branntetting utført", type: "yes_no", required: true },
      { id: "4", text: "Merking av kabler utført", type: "yes_no", required: true },
      { id: "5", text: "Dokumentasjonsbilde", type: "photo", required: true },
      { id: "6", text: "Signatur utførende", type: "signature", required: true },
    ],
  },
  {
    name: "Rørlegger – vannledninger",
    category: "Rør",
    items: [
      { id: "1", text: "Rør montert iht. tegning", type: "yes_no", required: true },
      { id: "2", text: "Trykkprøve utført (bar)", type: "number", required: true },
      { id: "3", text: "Isolasjon montert", type: "yes_no", required: true },
      { id: "4", text: "Merking utført", type: "yes_no", required: true },
      { id: "5", text: "Bilde av installasjon", type: "photo", required: true },
      { id: "6", text: "Signatur utførende", type: "signature", required: true },
    ],
  },
  {
    name: "Ventilasjon – kanaler",
    category: "Ventilasjon",
    items: [
      { id: "1", text: "Kanaler montert iht. tegning", type: "yes_no", required: true },
      { id: "2", text: "Tetthetsprøve utført", type: "yes_no", required: true },
      { id: "3", text: "Isolasjon montert", type: "yes_no", required: true },
      { id: "4", text: "Luftmengder innregulert", type: "yes_no", required: true },
      { id: "5", text: "Dokumentasjonsbilde", type: "photo", required: false },
      { id: "6", text: "Signatur utførende", type: "signature", required: true },
    ],
  },
  {
    name: "Tak – tekking",
    category: "Tak",
    items: [
      { id: "1", text: "Underlag kontrollert", type: "yes_no", required: true },
      { id: "2", text: "Fall mot sluk/renne OK", type: "yes_no", required: true },
      { id: "3", text: "Membran/tekking lagt iht. anvisning", type: "yes_no", required: true },
      { id: "4", text: "Beslag montert", type: "yes_no", required: true },
      { id: "5", text: "Sluk/avløp tettet", type: "yes_no", required: true },
      { id: "6", text: "Bilde av ferdig tak", type: "photo", required: true },
      { id: "7", text: "Signatur utførende", type: "signature", required: true },
    ],
  },
  {
    name: "Branntetning",
    category: "Brann",
    items: [
      { id: "1", text: "Gjennomføringer identifisert", type: "yes_no", required: true },
      { id: "2", text: "Riktig produkt benyttet", type: "yes_no", required: true },
      { id: "3", text: "Montert iht. monteringsanvisning", type: "yes_no", required: true },
      { id: "4", text: "Merking/skilting utført", type: "yes_no", required: true },
      { id: "5", text: "Bilde av tetning", type: "photo", required: true },
      { id: "6", text: "Signatur utførende", type: "signature", required: true },
    ],
  },
];

export function useKsModule2Checklists(projectId: string) {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<KsModule2Checklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchChecklists = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const { data, error } = await (supabase
        .from("ks_module2_checklists" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }) as any);

      if (error) throw error;
      setChecklists((data as KsModule2Checklist[]) || []);
    } catch (error) {
      console.error("Error fetching checklists:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  const createChecklist = async (input: {
    title: string;
    template_name: string;
    responsible_user_id?: string;
    responsible_user_name?: string;
    deadline_date?: string;
    checklist_items: ChecklistItem[];
    is_paper_version?: boolean;
  }) => {
    if (!profile?.company_id || !projectId) return null;

    try {
      setIsSaving(true);
      const { data, error } = await (supabase
        .from("ks_module2_checklists" as any)
        .insert([{
          project_id: projectId,
          company_id: profile.company_id,
          title: input.title,
          template_name: input.template_name,
          responsible_user_id: input.responsible_user_id || null,
          responsible_user_name: input.responsible_user_name || null,
          deadline_date: input.deadline_date || null,
          checklist_items: input.checklist_items,
          is_paper_version: input.is_paper_version || false,
          status: input.is_paper_version ? "planned" : "planned",
          created_by: user?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Egenkontroll opprettet" });
      await fetchChecklists();
      return data as unknown as KsModule2Checklist;
    } catch (error) {
      console.error("Error creating checklist:", error);
      toast({ title: "Feil", description: "Kunne ikke opprette egenkontroll", variant: "destructive" });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateChecklist = async (id: string, updates: Partial<KsModule2Checklist>) => {
    try {
      setIsSaving(true);
      const { error } = await (supabase
        .from("ks_module2_checklists" as any)
        .update(updates)
        .eq("id", id) as any);

      if (error) throw error;
      await fetchChecklists();
      return true;
    } catch (error) {
      console.error("Error updating checklist:", error);
      toast({ title: "Feil", description: "Kunne ikke oppdatere", variant: "destructive" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const completeChecklist = async (id: string, items: ChecklistItem[], signatures: any[]) => {
    try {
      setIsSaving(true);
      const { error } = await (supabase
        .from("ks_module2_checklists" as any)
        .update({
          checklist_items: items,
          signatures,
          status: "completed",
          progress_percent: 100,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Egenkontroll fullført!" });
      await fetchChecklists();
      return true;
    } catch (error) {
      console.error("Error completing checklist:", error);
      toast({ title: "Feil", description: "Kunne ikke fullføre", variant: "destructive" });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteChecklist = async (id: string) => {
    try {
      const { error } = await (supabase
        .from("ks_module2_checklists" as any)
        .delete()
        .eq("id", id) as any);

      if (error) throw error;
      toast({ title: "Egenkontroll slettet" });
      await fetchChecklists();
      return true;
    } catch (error) {
      console.error("Error deleting checklist:", error);
      toast({ title: "Feil", description: "Kunne ikke slette", variant: "destructive" });
      return false;
    }
  };

  // Calculate stats
  const stats = {
    total: checklists.length,
    completed: checklists.filter(c => c.status === "completed").length,
    inProgress: checklists.filter(c => c.status === "in_progress").length,
    planned: checklists.filter(c => c.status === "planned").length,
    overdue: checklists.filter(c => 
      c.status !== "completed" && 
      c.deadline_date && 
      new Date(c.deadline_date) < new Date()
    ).length,
    waitingPaper: checklists.filter(c => c.is_paper_version && !c.paper_uploaded).length,
    progressPercent: checklists.length > 0 
      ? Math.round((checklists.filter(c => c.status === "completed").length / checklists.length) * 100)
      : 0,
  };

  return {
    checklists,
    isLoading,
    isSaving,
    stats,
    createChecklist,
    updateChecklist,
    completeChecklist,
    deleteChecklist,
    refetch: fetchChecklists,
  };
}
