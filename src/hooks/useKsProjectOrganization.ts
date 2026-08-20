import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrgRole {
  key: string;
  label: string;
  name: string;
  company: string;
  responsibilities: string;
}

export const CONTRACT_FORMS = [
  "Totalentreprise",
  "Hovedentreprise",
  "Generalentreprise",
  "Delte entrepriser",
  "Underentreprise",
] as const;

export const DEFAULT_ORG_ROLES: OrgRole[] = [
  {
    key: "byggherre",
    label: "Byggherre",
    name: "",
    company: "",
    responsibilities:
      "Har ansvar etter byggherreforskriften, herunder å utarbeide SHA-plan og oppnevne koordinatorer.",
  },
  {
    key: "byggherre_rep",
    label: "Byggherrens representant",
    name: "",
    company: "",
    responsibilities: "Utfører byggherrens plikter på byggherrens vegne.",
  },
  {
    key: "kp",
    label: "Koordinator prosjektering (KP)",
    name: "",
    company: "",
    responsibilities: "Koordinerer SHA i prosjekteringsfasen og sikrer at risiko vurderes tidlig.",
  },
  {
    key: "ku",
    label: "Koordinator utførelse (KU)",
    name: "",
    company: "",
    responsibilities: "Koordinerer SHA i utførelsesfasen, følger opp SHA-planen og vernerunder.",
  },
  {
    key: "prosjekterende",
    label: "Prosjekterende",
    name: "",
    company: "",
    responsibilities: "Ivaretar sikkerhet, helse og arbeidsmiljø i prosjekteringen av løsningene.",
  },
  {
    key: "entreprenor",
    label: "Entreprenør(er)",
    name: "",
    company: "",
    responsibilities: "Følger SHA-planen, gjennomfører egne risikovurderinger og melder avvik.",
  },
  {
    key: "hovedbedrift",
    label: "Hovedbedrift",
    name: "",
    company: "",
    responsibilities: "Samordner HMS-arbeidet på arbeidsplassen etter arbeidsmiljøloven § 2-2.",
  },
  {
    key: "prosjektleder",
    label: "Prosjekt-/bygge-/anleggsleder",
    name: "",
    company: "",
    responsibilities: "Overordnet ansvar for HMS i prosjektet og for at ressurser er tilgjengelige.",
  },
  {
    key: "hms_ansvarlig",
    label: "HMS-ansvarlig",
    name: "",
    company: "",
    responsibilities: "Daglig oppfølging av HMS-arbeidet. Gjennomfører vernerunder og følger opp avvik.",
  },
  {
    key: "verneombud",
    label: "Verneombud",
    name: "",
    company: "",
    responsibilities: "Ivaretar arbeidstakernes interesser i HMS-spørsmål. Deltar i vernerunder og HMS-møter.",
  },
];

function normalizeRoles(input: any): OrgRole[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const byKey = new Map<string, any>();
  input.forEach((r: any) => {
    const key = r?.key || DEFAULT_ORG_ROLES.find((d) => d.label === r?.role || d.label === r?.label)?.key;
    if (key) byKey.set(key, r);
  });
  const merged = DEFAULT_ORG_ROLES.map((d) => {
    const found = byKey.get(d.key);
    return found
      ? {
          ...d,
          name: found.name || "",
          company: found.company || "",
          responsibilities: found.responsibilities || d.responsibilities,
        }
      : d;
  });
  // keep extra custom roles that are not part of the defaults
  input.forEach((r: any) => {
    const key = r?.key;
    if (key && !DEFAULT_ORG_ROLES.some((d) => d.key === key)) {
      merged.push({
        key,
        label: r.label || r.role || key,
        name: r.name || "",
        company: r.company || "",
        responsibilities: r.responsibilities || "",
      });
    }
  });
  return merged;
}

/**
 * Shared project organization ("Organisering og ansvar").
 * Stored on the SHA plan (organization_data) and mirrored to the HMS plan
 * (responsibilities) so both views always show the same data.
 */
export function useKsProjectOrganization(projectId: string | undefined) {
  const [roles, setRoles] = useState<OrgRole[]>(DEFAULT_ORG_ROLES);
  const [contractForm, setContractForm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [{ data: sha }, { data: hms }] = await Promise.all([
        supabase
          .from("ks_module2_sha_plans")
          .select("id, organization_data")
          .eq("project_id", projectId)
          .eq("is_current_version", true)
          .maybeSingle(),
        supabase
          .from("ks_module2_hms_plans")
          .select("id, responsibilities")
          .eq("project_id", projectId)
          .maybeSingle(),
      ]);

      const orgData = (sha?.organization_data as any) || {};
      const fromSha = normalizeRoles(orgData.roles);
      const fromHms = normalizeRoles(hms?.responsibilities as any);
      setRoles(fromSha || fromHms || DEFAULT_ORG_ROLES);
      setContractForm(orgData.contract_form || "");
    } catch (error) {
      console.error("Error loading project organization:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (nextRoles: OrgRole[], nextContractForm: string) => {
      if (!projectId) return false;
      setIsSaving(true);
      try {
        const byKey = (k: string) => nextRoles.find((r) => r.key === k);
        const organization_data = {
          roles: nextRoles,
          contract_form: nextContractForm || null,
          // legacy shape kept for PDF/compatibility
          client: { name: byKey("byggherre")?.name || "", role: "Byggherre" },
          kp: { name: byKey("kp")?.name || "", role: "Koordinator prosjektering" },
          ku: { name: byKey("ku")?.name || "", role: "Koordinator utførelse" },
          projectLeader: { name: byKey("prosjektleder")?.name || "", role: "Prosjektleder" },
        };

        const { data: sha } = await supabase
          .from("ks_module2_sha_plans")
          .select("id")
          .eq("project_id", projectId)
          .eq("is_current_version", true)
          .maybeSingle();

        if (sha?.id) {
          const { error } = await supabase
            .from("ks_module2_sha_plans")
            .update({ organization_data: organization_data as any })
            .eq("id", sha.id);
          if (error) throw error;
        }

        const responsibilities = nextRoles.map((r) => ({
          key: r.key,
          role: r.label,
          label: r.label,
          name: r.name,
          company: r.company,
          responsibilities: r.responsibilities,
        }));

        const { data: hms } = await supabase
          .from("ks_module2_hms_plans")
          .select("id")
          .eq("project_id", projectId)
          .maybeSingle();

        if (hms?.id) {
          const { error } = await supabase
            .from("ks_module2_hms_plans")
            .update({ responsibilities: responsibilities as any })
            .eq("id", hms.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("ks_module2_hms_plans")
            .insert({ project_id: projectId, responsibilities: responsibilities as any });
          if (error) throw error;
        }

        setRoles(nextRoles);
        setContractForm(nextContractForm);
        toast.success("Organisering lagret i både HMS-plan og SHA-plan");
        return true;
      } catch (error: any) {
        console.error("Error saving project organization:", error);
        toast.error("Kunne ikke lagre organisering: " + (error?.message || "ukjent feil"));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [projectId]
  );

  return { roles, contractForm, isLoading, isSaving, save, reload: load };
}
