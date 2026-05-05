/**
 * Apply HMS setup from imported PDF data to a company.
 * This uses the extracted data from AI parsing instead of default content.
 */

import { supabase } from "@/integrations/supabase/client";
import { buildCanonicalOrganizationContent, normalizeHmsRoutines, type NormalizedHmsRoutine } from "@/lib/hmsImportNormalizers";

export interface ImportedHmsData {
  firmanavn: string | null;
  epost: string | null;
  kontaktperson: string | null;
  telefon: string | null;
  organisasjonsnummer: string | null;
  farekilder: string[];
  hmsmal: string[];
  kursOgOpplaering: {
    harRutiner: boolean;
    beskrivelse: string | null;
  } | null;
  organisasjon: {
    dagligLeder: string | null;
    verneombud: string | null;
    andreRoller: Array<{ rolle: string; navn: string }>;
  } | null;
  avvikssystem: {
    harEgetSystem: boolean;
    beskrivelse: string | null;
  } | null;
  bransje: string | null;
  tilleggsinformasjon: string | null;
}

export async function applyImportedHmsSetup(
  companyId: string, 
  importedData: ImportedHmsData
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PDF-Import] Applying imported HMS setup for company:', companyId);

    // 1. Insert goals from hmsmal
    if (importedData.hmsmal && importedData.hmsmal.length > 0) {
      const goalsToInsert = importedData.hmsmal.map((goal, index) => ({
        company_id: companyId,
        goal_text: goal,
        is_predefined: false,
        sort_order: index,
      }));

      const { error: goalsError } = await supabase
        .from("company_goals")
        .insert(goalsToInsert);

      if (goalsError) {
        console.error("[PDF-Import] Error inserting goals:", goalsError);
      } else {
        console.log(`[PDF-Import] Inserted ${goalsToInsert.length} goals`);
      }
    }

    // 2. Insert organization data
    if (importedData.organisasjon) {
      // Build organization content based on imported data
      const orgContent = buildOrganizationContent(importedData);
      
      const { error: orgError } = await supabase
        .from("company_organization")
        .insert({
          company_id: companyId,
          template_id: null,
          custom_content: orgContent,
          is_custom: true,
        });

      if (orgError) {
        console.error("[PDF-Import] Error inserting organization:", orgError);
      } else {
        console.log("[PDF-Import] Inserted organization");
      }
    }

    // 3. Insert risks from farekilder
    if (importedData.farekilder && importedData.farekilder.length > 0) {
      // Transform to nested format compatible with RisikovurderingOgHandlingsplan
      const nestedRisks = importedData.farekilder.map((farekilde, index) => ({
        id: crypto.randomUUID(),
        hazard_source: 'annet',
        hazard_source_custom: farekilde,
        events: [{
          id: crypto.randomUUID(),
          description: farekilde,
          consequence: 2, // Default medium consequence
          probability: 2, // Default medium probability
          measures: '',
          responsible: '',
          deadline: '',
          status: 'planlagt' as const,
        }],
        created_at: new Date().toISOString(),
        created_by: 'PDF-import',
        is_predefined: false,
      }));

      const { error: risksError } = await supabase
        .from("company_risk_assessments")
        .insert({
          company_id: companyId,
          risks: JSON.parse(JSON.stringify(nestedRisks)),
        });

      if (risksError) {
        console.error("[PDF-Import] Error inserting risks:", risksError);
      } else {
        console.log(`[PDF-Import] Inserted ${nestedRisks.length} risks`);
      }
    }

    // 4. Insert routines based on imported data (kursOgOpplaering, avvikssystem)
    const routines = buildRoutinesFromImport(importedData);
    if (routines.length > 0) {
      const { error: routinesError } = await supabase
        .from("company_routines")
        .insert({
          company_id: companyId,
          routines: JSON.parse(JSON.stringify(routines)),
        });

      if (routinesError) {
        console.error("[PDF-Import] Error inserting routines:", routinesError);
      } else {
        console.log(`[PDF-Import] Inserted ${routines.length} routines`);
      }
    }

    // 5. Insert empty action plan
    const { error: actionsError } = await supabase
      .from("company_action_plans")
      .insert({
        company_id: companyId,
        actions: [],
      });

    if (actionsError) {
      console.error("[PDF-Import] Error inserting action plan:", actionsError);
    }

    // 6. Mark setup as complete in company_modules settings
    const { error: moduleError } = await supabase
      .from("company_modules")
      .update({
        settings: {
          setupComplete: true,
          setupSource: 'pdf-import',
          setupDate: new Date().toISOString(),
          importedBransje: importedData.bransje,
        }
      })
      .eq("company_id", companyId)
      .eq("module_type", "IK_HMS");

    if (moduleError) {
      console.error("[PDF-Import] Error updating module settings:", moduleError);
    }

    console.log('[PDF-Import] Successfully applied imported HMS setup');
    return { success: true };

  } catch (error) {
    console.error("[PDF-Import] Error applying imported HMS setup:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

function buildOrganizationContent(data: ImportedHmsData): string {
  return buildCanonicalOrganizationContent(data.organisasjon);
}

function buildRoutinesFromImport(data: ImportedHmsData): NormalizedHmsRoutine[] {
  const routines: Array<Record<string, unknown>> = [];

  // Kurs og opplæring rutine
  if (data.kursOgOpplaering) {
    routines.push({
      id: crypto.randomUUID(),
      routine_name: 'Rutine for kurs og opplæring',
      purpose: data.kursOgOpplaering.harRutiner 
        ? 'Bedriften har etablerte rutiner for opplæring'
        : 'Bedriften trenger å etablere rutiner for opplæring',
      category: 'opplæring',
      procedure: data.kursOgOpplaering.beskrivelse || 'Ingen beskrivelse tilgjengelig',
    });
  }

  // Avvikshåndtering rutine
  if (data.avvikssystem) {
    routines.push({
      id: crypto.randomUUID(),
      routine_name: 'Rutine for avvikshåndtering',
      purpose: data.avvikssystem.harEgetSystem
        ? 'Bedriften har eget system for avvikshåndtering'
        : 'Bedriften bruker Total-IKs avvikssystem',
      category: 'avvik',
      procedure: data.avvikssystem.beskrivelse || 'Avvik skal rapporteres og behandles fortløpende.',
    });
  }

  // Add a generic HMS routine
  routines.push({
    id: crypto.randomUUID(),
    routine_name: 'Generell HMS-rutine',
    purpose: 'Overordnet rutine for helse, miljø og sikkerhet',
    category: 'hms',
    procedure: data.tilleggsinformasjon || 'HMS-arbeidet skal gjennomføres systematisk i henhold til forskrift om systematisk HMS-arbeid.',
  });

  return normalizeHmsRoutines(routines);
}

/**
 * Get imported data from session storage if available
 */
export function getImportedHmsData(): ImportedHmsData | null {
  try {
    const stored = sessionStorage.getItem('customer-import-data');
    if (!stored) return null;
    return JSON.parse(stored) as ImportedHmsData;
  } catch {
    return null;
  }
}

/**
 * Clear imported data from session storage
 */
export function clearImportedHmsData(): void {
  sessionStorage.removeItem('customer-import-data');
}
