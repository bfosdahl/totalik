/**
 * Apply default HMS setup to a company.
 * This ensures every new company has working handbook content from day one.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  defaultGoals,
  defaultOrganization,
  defaultRisks,
  defaultRoutines,
  defaultActions,
} from "./defaultHmsSetup";

export async function applyDefaultHmsSetup(companyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Applying default HMS setup for company:", companyId);

    // 1. Insert default goals
    const goalsToInsert = defaultGoals.map((goal, index) => ({
      company_id: companyId,
      goal_text: goal.goal_text,
      is_predefined: goal.is_predefined,
      sort_order: index,
    }));

    const { error: goalsError } = await supabase
      .from("company_goals")
      .upsert(goalsToInsert, { onConflict: "company_id,sort_order", ignoreDuplicates: true });

    if (goalsError) {
      console.error("Error inserting goals:", goalsError);
      // Try insert without upsert
      await supabase.from("company_goals").insert(goalsToInsert);
    }

    // 2. Insert default organization
    const { error: orgError } = await supabase
      .from("company_organization")
      .upsert({
        company_id: companyId,
        template_id: defaultOrganization.template_id,
        custom_content: defaultOrganization.custom_content,
        is_custom: defaultOrganization.is_custom,
      }, { onConflict: "company_id" });

    if (orgError) {
      console.error("Error inserting organization:", orgError);
    }

    // 3. Insert default risks
    const { error: risksError } = await supabase
      .from("company_risk_assessments")
      .upsert([{
        company_id: companyId,
        risks: JSON.parse(JSON.stringify(defaultRisks)),
      }], { onConflict: "company_id" });

    if (risksError) {
      console.error("Error inserting risks:", risksError);
    }

    // 4. Insert default routines
    const { error: routinesError } = await supabase
      .from("company_routines")
      .upsert([{
        company_id: companyId,
        routines: JSON.parse(JSON.stringify(defaultRoutines)),
      }], { onConflict: "company_id" });

    if (routinesError) {
      console.error("Error inserting routines:", routinesError);
    }

    // 5. Insert default action plan
    const { error: actionsError } = await supabase
      .from("company_action_plans")
      .upsert([{
        company_id: companyId,
        actions: JSON.parse(JSON.stringify(defaultActions)),
      }], { onConflict: "company_id" });

    if (actionsError) {
      console.error("Error inserting actions:", actionsError);
    }

    console.log("Default HMS setup applied successfully for company:", companyId);
    return { success: true };

  } catch (error) {
    console.error("Error applying default HMS setup:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Check if a company already has HMS setup data
 */
export async function hasExistingHmsSetup(companyId: string): Promise<boolean> {
  try {
    // Check if company has any goals
    const { data: goals, error } = await supabase
      .from("company_goals")
      .select("id")
      .eq("company_id", companyId)
      .limit(1);

    if (error) {
      console.error("Error checking existing setup:", error);
      return false;
    }

    return (goals?.length ?? 0) > 0;
  } catch {
    return false;
  }
}
