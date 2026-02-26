import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AlkoholLovverk {
  id: string;
  company_id: string;
  category: "nasjonal" | "kommunal" | "veileder";
  title: string;
  description: string | null;
  url: string | null;
  source: string | null;
  municipality: string | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AlkoholComplianceItem {
  id: string;
  company_id: string;
  requirement_key: string;
  requirement_text: string;
  category: string;
  is_fulfilled: boolean;
  fulfilled_at: string | null;
  fulfilled_by_name: string | null;
  evidence_description: string | null;
  evidence_link: string | null;
  notes: string | null;
  sort_order: number;
}

// Default national laws that should be populated for every company
export const DEFAULT_NATIONAL_LAWS: Omit<AlkoholLovverk, "id" | "company_id" | "created_at" | "updated_at">[] = [
  {
    category: "nasjonal",
    title: "Alkoholloven",
    description: "Lov om omsetning av alkoholholdig drikk m.v. (LOV-1989-06-02-27)",
    url: "https://lovdata.no/dokument/NL/lov/1989-06-02-27",
    source: "Lovdata",
    municipality: null,
    is_default: true,
    is_active: true,
    sort_order: 1,
  },
  {
    category: "nasjonal",
    title: "Alkoholforskriften",
    description: "Forskrift om omsetning av alkoholholdig drikk mv. (FOR-2005-06-08-538)",
    url: "https://lovdata.no/dokument/SF/forskrift/2005-06-08-538",
    source: "Lovdata",
    municipality: null,
    is_default: true,
    is_active: true,
    sort_order: 2,
  },
  {
    category: "nasjonal",
    title: "Serveringsloven",
    description: "Lov om serveringsvirksomhet (LOV-1997-06-13-55)",
    url: "https://lovdata.no/dokument/NL/lov/1997-06-13-55",
    source: "Lovdata",
    municipality: null,
    is_default: true,
    is_active: true,
    sort_order: 3,
  },
  {
    category: "nasjonal",
    title: "Internkontrollforskriften",
    description: "Forskrift om systematisk helse-, miljø- og sikkerhetsarbeid (FOR-1996-12-06-1127)",
    url: "https://lovdata.no/dokument/SF/forskrift/1996-12-06-1127",
    source: "Lovdata",
    municipality: null,
    is_default: true,
    is_active: true,
    sort_order: 4,
  },
  {
    category: "nasjonal",
    title: "Prikksystemet (Alkoholloven §1-8)",
    description: "Kommunalt prikksystem for brudd på alkoholloven. 12 prikker i løpet av to år medfører inndragning av bevillingen.",
    url: "https://lovdata.no/dokument/NL/lov/1989-06-02-27/KAPITTEL_1#§1-8",
    source: "Lovdata",
    municipality: null,
    is_default: true,
    is_active: true,
    sort_order: 5,
  },
  {
    category: "veileder",
    title: "Helsedirektoratets veileder til alkoholloven",
    description: "Offisiell veileder med kommentarer til alkoholloven og tilhørende forskrifter",
    url: "https://www.helsedirektoratet.no/veiledere/alkoholloven",
    source: "Helsedirektoratet",
    municipality: null,
    is_default: true,
    is_active: true,
    sort_order: 10,
  },
  {
    category: "veileder",
    title: "Guide til god internkontroll etter alkoholloven",
    description: "Helsedirektoratets praktiske guide med råd for alle stedstyper",
    url: "https://www.helsedirektoratet.no/tema/alkohol/guide-til-god-internkontroll-etter-alkoholloven",
    source: "Helsedirektoratet",
    municipality: null,
    is_default: true,
    is_active: true,
    sort_order: 11,
  },
  {
    category: "veileder",
    title: "Ansvarlig vertskap – e-læringskurs",
    description: "Gratis e-læringskurs for ansatte i serveringsbransjen fra Helsedirektoratet",
    url: "https://kurs.helsedirektoratet.no/",
    source: "Helsedirektoratet",
    municipality: null,
    is_default: true,
    is_active: true,
    sort_order: 12,
  },
];

// IK Alkohol compliance requirements
export const IK_ALKOHOL_REQUIREMENTS = [
  {
    requirement_key: "internkontrollrutiner",
    requirement_text: "Bedriften skal kunne fremvise internkontrollrutiner for alkohol",
    category: "rutiner",
    sort_order: 1,
    evidence_link: "/ik-alkohol/rutiner",
  },
  {
    requirement_key: "alkohollovverk",
    requirement_text: "Bedriften skal ha alkohollovverk tilgjengelig",
    category: "lovverk",
    sort_order: 2,
    evidence_link: "/ik-alkohol/lovverk",
  },
  {
    requirement_key: "kommunale_retningslinjer",
    requirement_text: "Bedriften skal ha alkoholpolitiske retningslinjer for kommunen tilgjengelig",
    category: "lovverk",
    sort_order: 3,
    evidence_link: "/ik-alkohol/lovverk",
  },
  {
    requirement_key: "risikoanalyse",
    requirement_text: "Bedriften skal dokumentere risikoanalyse/internkontroll utformet for egen virksomhet",
    category: "dokumentasjon",
    sort_order: 4,
    evidence_link: "/ik-alkohol/risikoanalyse",
  },
  {
    requirement_key: "ansatt_kunnskap",
    requirement_text: "Bedriften skal dokumentere at de ansatte har tilstrekkelig kunnskap om krav til virksomheten og internkontroll",
    category: "opplaering",
    sort_order: 5,
    evidence_link: "/ik-alkohol/internkontroll?tab=opplaering",
  },
  {
    requirement_key: "opplaeringsrutiner",
    requirement_text: "Bedriften skal kunne dokumentere opplæringsrutiner for de ansatte",
    category: "opplaering",
    sort_order: 6,
    evidence_link: "/ik-alkohol/rutiner",
  },
  {
    requirement_key: "kunnskapsprover",
    requirement_text: "Bedriften skal kunne dokumentere kunnskapsprøver for styrer og stedfortreder, gjennomførte kurs/opplæring for de ansatte eller møtereferater",
    category: "opplaering",
    sort_order: 7,
    evidence_link: "/ik-alkohol/internkontroll?tab=opplaering",
  },
  {
    requirement_key: "avviksrutiner",
    requirement_text: "Bedriften skal kunne dokumentere rutiner, prosedyrer, instrukser for å forebygge, avdekke og rette opp avvik",
    category: "rutiner",
    sort_order: 8,
    evidence_link: "/ik-alkohol/rutiner",
  },
  {
    requirement_key: "avviksskjemaer",
    requirement_text: "Bedriften skal kunne dokumentere avviksskjemaer for å forebygge, avdekke og rette opp avvik",
    category: "rutiner",
    sort_order: 9,
    evidence_link: "/ik-alkohol/hendelser",
  },
  {
    requirement_key: "systematisk_gjennomgang",
    requirement_text: "Bedriften skal kunne dokumentere systematisk og jevnlig gjennomgang av internkontrollen",
    category: "kontroll",
    sort_order: 10,
    evidence_link: "/ik-alkohol/internkontroll?tab=revidering",
  },
  {
    requirement_key: "aarlig_revidering",
    requirement_text: "Bedriften skal kunne dokumentere årlig revidering av internkontrollen",
    category: "kontroll",
    sort_order: 11,
    evidence_link: "/ik-alkohol/internkontroll?tab=revidering",
  },
];

export function useIkAlkoholLovverk() {
  const { company, profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch lovverk
  const { data: lovverk = [], isLoading: lovverkLoading } = useQuery({
    queryKey: ["ik-alkohol-lovverk", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("ik_alkohol_lovverk")
        .select("*")
        .eq("company_id", company.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as AlkoholLovverk[];
    },
    enabled: !!company?.id,
  });

  // Fetch compliance checklist
  const { data: complianceChecklist = [], isLoading: checklistLoading } = useQuery({
    queryKey: ["ik-alkohol-compliance-checklist", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("ik_alkohol_compliance_checklist")
        .select("*")
        .eq("company_id", company.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as AlkoholComplianceItem[];
    },
    enabled: !!company?.id,
  });

  // Initialize default laws
  const initializeDefaults = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error("No company");
      
      // Check if already initialized
      const { data: existing } = await supabase
        .from("ik_alkohol_lovverk")
        .select("id")
        .eq("company_id", company.id)
        .eq("is_default", true)
        .limit(1);
      
      if (existing && existing.length > 0) return;

      const rows = DEFAULT_NATIONAL_LAWS.map(law => ({
        ...law,
        company_id: company.id,
      }));

      const { error } = await supabase
        .from("ik_alkohol_lovverk")
        .insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-lovverk"] });
    },
  });

  // Initialize compliance checklist
  const initializeChecklist = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error("No company");
      
      const { data: existing } = await supabase
        .from("ik_alkohol_compliance_checklist")
        .select("id")
        .eq("company_id", company.id)
        .limit(1);
      
      if (existing && existing.length > 0) return;

      const rows = IK_ALKOHOL_REQUIREMENTS.map(req => ({
        company_id: company.id,
        requirement_key: req.requirement_key,
        requirement_text: req.requirement_text,
        category: req.category,
        sort_order: req.sort_order,
        evidence_link: req.evidence_link,
        is_fulfilled: false,
      }));

      const { error } = await supabase
        .from("ik_alkohol_compliance_checklist")
        .insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-compliance-checklist"] });
    },
  });

  // Add lovverk entry
  const addLovverk = useMutation({
    mutationFn: async (entry: Partial<AlkoholLovverk>) => {
      if (!company?.id) throw new Error("No company");
      const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = entry as any;
      const { error } = await supabase
        .from("ik_alkohol_lovverk")
        .insert({ title: rest.title || "Uten tittel", ...rest, company_id: company.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-lovverk"] });
      toast.success("Lovverk lagt til");
    },
    onError: () => toast.error("Kunne ikke legge til lovverk"),
  });

  // Update lovverk entry
  const updateLovverk = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlkoholLovverk> & { id: string }) => {
      const { error } = await supabase
        .from("ik_alkohol_lovverk")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-lovverk"] });
      toast.success("Lovverk oppdatert");
    },
    onError: () => toast.error("Kunne ikke oppdatere"),
  });

  // Delete lovverk entry
  const deleteLovverk = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ik_alkohol_lovverk")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-lovverk"] });
      toast.success("Lovverk slettet");
    },
    onError: () => toast.error("Kunne ikke slette"),
  });

  // Toggle compliance item
  const toggleCompliance = useMutation({
    mutationFn: async ({ id, is_fulfilled }: { id: string; is_fulfilled: boolean }) => {
      const { error } = await supabase
        .from("ik_alkohol_compliance_checklist")
        .update({
          is_fulfilled,
          fulfilled_at: is_fulfilled ? new Date().toISOString() : null,
          fulfilled_by_name: is_fulfilled
            ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
            : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ik-alkohol-compliance-checklist"] });
    },
  });

  return {
    lovverk,
    complianceChecklist,
    isLoading: lovverkLoading || checklistLoading,
    initializeDefaults,
    initializeChecklist,
    addLovverk,
    updateLovverk,
    deleteLovverk,
    toggleCompliance,
  };
}
