import { supabase } from "@/integrations/supabase/client";

export interface SeedProject {
  project_name: string;
  project_number: string;
  address: string;
  client_name: string;
  contractor_type: "total" | "hoved" | "under";
  description: string;
  status: "planned" | "active" | "handover" | "warranty" | "completed";
  contract_sum: number;
}

const SEED_PROJECTS: SeedProject[] = [
  {
    project_name: "Eksempel: Nybygg enebolig",
    project_number: "EKS-001",
    address: "Eksempelveien 1, 0001 Oslo",
    client_name: "Ola Nordmann",
    contractor_type: "total",
    description: "Dette er et eksempelprosjekt som viser hvordan du kan dokumentere et nybyggprosjekt. Prosjektet inkluderer oppføring av enebolig med garasje. Du kan redigere eller slette dette prosjektet.",
    status: "active",
    contract_sum: 4500000,
  },
  {
    project_name: "Eksempel: Totalrenovering bolig",
    project_number: "EKS-002",
    address: "Demonstrasjonsgate 15, 0002 Bergen",
    client_name: "Kari Hansen",
    contractor_type: "hoved",
    description: "Et eksempelprosjekt for totalrenovering av eldre bolig. Inkluderer nytt bad, kjøkken, elektrisk anlegg og etterisolering. Bruk dette som mal for dine egne renoveringsprosjekter.",
    status: "planned",
    contract_sum: 1800000,
  },
  {
    project_name: "Eksempel: Oppussing stue og kjøkken",
    project_number: "EKS-003",
    address: "Testveien 42, 0003 Trondheim",
    client_name: "Per Olsen",
    contractor_type: "under",
    description: "Et mindre prosjekt som viser hvordan du dokumenterer mindre oppdrag. Inkluderer maling, gulvlegging og montering av nytt kjøkken. Perfekt eksempel for småjobber.",
    status: "completed",
    contract_sum: 250000,
  },
  {
    project_name: "Eksempel: Tilbygg med ny stue",
    project_number: "EKS-004",
    address: "Prøvegata 8, 0004 Stavanger",
    client_name: "Anne Nilsen",
    contractor_type: "hoved",
    description: "Eksempelprosjekt for tilbygg på eksisterende bolig. Viser dokumentasjon for byggesøknad, fundamentering, bæresystem og ferdigstillelse.",
    status: "handover",
    contract_sum: 950000,
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
      console.log("Company already has projects, skipping seed creation");
      return true;
    }

    // Create seed projects
    const projectsToInsert = SEED_PROJECTS.map(project => ({
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
    }));

    const { error: insertError } = await supabase
      .from("ks_module2_projects")
      .insert(projectsToInsert);

    if (insertError) {
      console.error("Error creating seed projects:", insertError);
      return false;
    }

    console.log(`Created ${SEED_PROJECTS.length} seed projects for company ${companyId}`);
    return true;
  } catch (error) {
    console.error("Error in createSeedProjects:", error);
    return false;
  }
}
