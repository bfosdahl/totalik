
CREATE OR REPLACE FUNCTION public.seed_hr_meeting_templates_for_company(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  source_template RECORD;
  source_question RECORD;
  new_template_id uuid;
  template_count int;
BEGIN
  -- Check if company already has templates
  SELECT count(*) INTO template_count FROM hr_meeting_templates WHERE company_id = p_company_id;
  IF template_count > 0 THEN
    RETURN;
  END IF;

  -- Copy templates from seed company
  FOR source_template IN
    SELECT * FROM hr_meeting_templates WHERE company_id = '4d172d1a-ff85-41e4-9178-fc638e2ba292'
  LOOP
    new_template_id := gen_random_uuid();
    INSERT INTO hr_meeting_templates (id, company_id, template_name, meeting_type, is_active, created_by)
    VALUES (new_template_id, p_company_id, source_template.template_name, source_template.meeting_type, source_template.is_active, source_template.created_by);

    FOR source_question IN
      SELECT * FROM hr_meeting_template_questions WHERE template_id = source_template.id ORDER BY sort_order
    LOOP
      INSERT INTO hr_meeting_template_questions (template_id, question_text, question_type, options, sort_order, is_required)
      VALUES (new_template_id, source_question.question_text, source_question.question_type, source_question.options, source_question.sort_order, source_question.is_required);
    END LOOP;
  END LOOP;
END;
$$;
