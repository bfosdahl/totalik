INSERT INTO public.company_risk_assessments (company_id, risks)
SELECT cm.company_id, cm.settings->'generatedContent'->'risks'
FROM public.company_modules cm
WHERE cm.module_type='IK_HMS'
  AND jsonb_array_length(coalesce(cm.settings->'generatedContent'->'risks','[]'::jsonb))>0
  AND NOT EXISTS (SELECT 1 FROM public.company_risk_assessments x WHERE x.company_id=cm.company_id AND x.department_id IS NULL);

INSERT INTO public.company_action_plans (company_id, actions)
SELECT cm.company_id, cm.settings->'generatedContent'->'actions'
FROM public.company_modules cm
WHERE cm.module_type='IK_HMS'
  AND jsonb_array_length(coalesce(cm.settings->'generatedContent'->'actions','[]'::jsonb))>0
  AND NOT EXISTS (SELECT 1 FROM public.company_action_plans x WHERE x.company_id=cm.company_id AND x.department_id IS NULL);

INSERT INTO public.company_routines (company_id, routines)
SELECT cm.company_id, cm.settings->'generatedContent'->'routines'
FROM public.company_modules cm
WHERE cm.module_type='IK_HMS'
  AND jsonb_array_length(coalesce(cm.settings->'generatedContent'->'routines','[]'::jsonb))>0
  AND NOT EXISTS (SELECT 1 FROM public.company_routines x WHERE x.company_id=cm.company_id AND x.department_id IS NULL);

INSERT INTO public.company_organization (company_id, custom_content, is_custom)
SELECT cm.company_id, (cm.settings->'generatedContent'->'organization')::text, true
FROM public.company_modules cm
WHERE cm.module_type='IK_HMS'
  AND cm.settings->'generatedContent'->'organization' IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.company_organization x WHERE x.company_id=cm.company_id AND x.department_id IS NULL);