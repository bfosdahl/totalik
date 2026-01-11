/**
 * Apply default HMS setup to a department.
 * This ensures every new department has working handbook content from day one.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  defaultGoals,
  defaultOrganization,
  defaultRisks,
  defaultRoutines,
  defaultActions,
} from "./defaultHmsSetup";

export async function applyDefaultDepartmentHmsSetup(departmentId: string): Promise<{ success: boolean; error?: string }> {
  try {

    // 1. Insert default goals
    const { data: existingGoals } = await supabase
      .from("department_goals")
      .select("id")
      .eq("department_id", departmentId)
      .limit(1);

    if (!existingGoals || existingGoals.length === 0) {
      const goalsToInsert = defaultGoals.map((goal, index) => ({
        department_id: departmentId,
        goal_text: goal.goal_text,
        is_predefined: goal.is_predefined,
        sort_order: index,
      }));

      const { error: goalsError } = await supabase
        .from("department_goals")
        .insert(goalsToInsert);

      if (goalsError) {
        console.error("Error inserting department goals:", goalsError);
      }
    }

    // 2. Insert default organization
    const { data: existingOrg } = await supabase
      .from("department_organization")
      .select("id")
      .eq("department_id", departmentId)
      .limit(1);

    if (!existingOrg || existingOrg.length === 0) {
      const { error: orgError } = await supabase
        .from("department_organization")
        .insert({
          department_id: departmentId,
          template_id: defaultOrganization.template_id,
          custom_content: defaultOrganization.custom_content,
          is_custom: defaultOrganization.is_custom,
        });

      if (orgError) {
        console.error("Error inserting department organization:", orgError);
      }
    }

    // 3. Insert default risks
    const { data: existingRisks } = await supabase
      .from("department_risk_assessments")
      .select("id")
      .eq("department_id", departmentId)
      .limit(1);

    if (!existingRisks || existingRisks.length === 0) {
      const { error: risksError } = await supabase
        .from("department_risk_assessments")
        .insert({
          department_id: departmentId,
          risks: JSON.parse(JSON.stringify(defaultRisks)),
        });

      if (risksError) {
        console.error("Error inserting department risks:", risksError);
      }
    }

    // 4. Insert default routines
    const { data: existingRoutines } = await supabase
      .from("department_routines")
      .select("id")
      .eq("department_id", departmentId)
      .limit(1);

    if (!existingRoutines || existingRoutines.length === 0) {
      const { error: routinesError } = await supabase
        .from("department_routines")
        .insert({
          department_id: departmentId,
          routines: JSON.parse(JSON.stringify(defaultRoutines)),
        });

      if (routinesError) {
        console.error("Error inserting department routines:", routinesError);
      }
    }

    // 5. Insert default action plan
    const { data: existingActions } = await supabase
      .from("department_action_plans")
      .select("id")
      .eq("department_id", departmentId)
      .limit(1);

    if (!existingActions || existingActions.length === 0) {
      const { error: actionsError } = await supabase
        .from("department_action_plans")
        .insert({
          department_id: departmentId,
          actions: JSON.parse(JSON.stringify(defaultActions)),
        });

      if (actionsError) {
        console.error("Error inserting department actions:", actionsError);
      }
    }

    return { success: true };

  } catch (error) {
    console.error("Error applying default department HMS setup:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Check if a department already has HMS setup data
 */
export async function hasExistingDepartmentHmsSetup(departmentId: string): Promise<boolean> {
  try {
    // Check if department has any goals
    const { data: goals, error } = await supabase
      .from("department_goals")
      .select("id")
      .eq("department_id", departmentId)
      .limit(1);

    if (error) {
      console.error("Error checking existing department setup:", error);
      return false;
    }

    return (goals?.length ?? 0) > 0;
  } catch {
    return false;
  }
}
