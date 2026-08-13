import { supabase } from "@/integrations/supabase/client";

import { populateExampleProject } from "./ksModule2PopulateExampleProject";
import { t } from "@/i18n/t";

export interface SeedProject {
  project_name: string;
  project_number: string;
  address: string;
  client_name: string;
  contractor_type: "total" | "hoved" | "under";
  description: string;
  status: "planned" | "active" | "handover" | "warranty" | "completed";
  contract_sum: number;
  populateWithData?: boolean;
}

const SEED_PROJECTS: SeedProject[] = [
  {
    project_name: "Eksempel: Nybygg enebolig",
    project_number: "EKS-001",
    address: "Eksempelveien 1, 0001 Oslo",
    client_name: "Ola Nordmann",
    contractor_type: "total",
    description: t("auto.dette_er_et_eksempelprosjekt_som_viser_h"),
    status: "active",
    contract_sum: 4500000,
  },
  {
    project_name: "Eksempel: Totalrenovering bolig",
    project_number: "EKS-002",
    address: "Demonstrasjonsgate 15, 0002 Bergen",
    client_name: "Kari Hansen",
    contractor_type: "hoved",
    description: t("auto.et_eksempelprosjekt_for_totalrenovering_"),
    status: "planned",
    contract_sum: 1800000,
  },
  {
    project_name: "Eksempel: Oppussing stue og kjøkken",
    project_number: "EKS-003",
    address: "Testveien 42, 0003 Trondheim",
    client_name: "Per Olsen",
    contractor_type: "under",
    description: t("auto.et_mindre_prosjekt_som_viser_hvordan_du_"),
    status: "completed",
    contract_sum: 250000,
  },
  {
    project_name: "Eksempel: Tilbygg med ny stue",
    project_number: "EKS-004",
    address: "Prøvegata 8, 0004 Stavanger",
    client_name: "Anne Nilsen",
    contractor_type: "hoved",
    description: t("auto.eksempelprosjekt_for_tilbygg_paa_eksiste"),
    status: "handover",
    contract_sum: 950000,
  },
  {
    project_name: "Komplett eksempelprosjekt: Villa Solberg",
    project_number: "DEMO-2024",
    address: "Solbergveien 25, 1440 Drøbak",
    client_name: "Erik og Maria Solberg",
    contractor_type: "total",
    description: t("auto.et_fullstendig_utfylt_demonstrasjonspros"),
    status: "active",
    contract_sum: 5800000,
    populateWithData: true,
  },
];

export async function createSeedProjects(companyId: string, userId?: string): Promise<boolean> {
  try {
    // Check if company already has projects (avoid duplicates)
    const { data: existingProjects, error: checkError } = await supabase
      .from("ks_module2_projects")
      .select("id")
      .eq("company_id", companyId)
      .limit(1);

    if (checkError) {
      console.error("Error checking existing projects:", checkError);
      return false;
    }

    // If company already has projects, don't add seeds
    if (existingProjects && existingProjects.length > 0) {
      return true;
    }

    // Create seed projects one by one to get IDs for population
    for (const project of SEED_PROJECTS) {
      const { data: insertedProject, error: insertError } = await supabase
        .from("ks_module2_projects")
        .insert({
          company_id: companyId,
          created_by: userId || null,
          project_name: project.project_name,
          project_number: project.project_number,
          address: project.address,
          client_name: project.client_name,
          contractor_type: project.contractor_type,
          description: project.description,
          status: project.status,
          contract_sum: project.contract_sum,
          progress_percent: project.status === "completed" ? 100 : project.status === "handover" ? 95 : project.status === "active" ? 35 : 0,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating seed project:", insertError);
        continue;
      }

      // If this project should be populated with example data
      if (project.populateWithData && insertedProject) {
        await populateExampleProject(insertedProject.id, companyId, userId);
      }
    }

    return true;
  } catch (error) {
    console.error("Error in createSeedProjects:", error);
    return false;
  }
}
