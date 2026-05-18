DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    -- IK MAT (Fase 1)
    'ik_mat_suppliers',
    'ik_mat_checklist_responses',
    'ik_mat_custom_checklists',
    'ik_mat_cleaning_plan_responses',
    'ik_mat_custom_cleaning_tasks',
    'ik_mat_daily_rounds',
    'ik_mat_daily_round_completions',
    'ik_mat_daily_task_settings',
    'ik_mat_daily_task_completions',
    'ik_mat_scheduled_tasks',
    'ik_mat_task_completions',
    'ik_mat_traceability_records',
    'ik_mat_dismissed_auto_deviations',
    -- IK HMS (Fase 2)
    'company_routines',
    'company_risk_assessments',
    'company_action_plans',
    'action_plan_followups',
    'company_goals',
    'company_organization',
    'org_chart_nodes',
    'hms_sja',
    'hms_self_declarations',
    'hms_vernerunde_templates',
    'ik_hms_company_documents',
    'ik_hms_stoffkartotek',
    'chemical_risk_assessments',
    'company_chemical_entries',
    'equipment_exposure_assessments',
    'gdpr_documentation',
    'gdpr_checklist_responses',
    'company_aarshjul_activities',
    'company_aarshjul_default_overrides',
    'company_aarshjul_hidden_defaults',
    'company_laws_regulations'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS department_id uuid NULL REFERENCES public.company_departments(id) ON DELETE SET NULL',
      t
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (company_id, department_id)',
      'idx_' || t || '_company_dept', t
    );
  END LOOP;
END $$;