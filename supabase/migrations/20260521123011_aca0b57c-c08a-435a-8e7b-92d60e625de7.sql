
-- Tighten SELECT policies on system-managed tables to require a company profile
-- (consistent with admin_routine_templates / admin_checklist_templates pattern)

-- admin_documents
DROP POLICY IF EXISTS "Authenticated users can view admin documents" ON public.admin_documents;
DROP POLICY IF EXISTS "Authenticated users can read admin documents" ON public.admin_documents;
DROP POLICY IF EXISTS "All authenticated users can view admin documents" ON public.admin_documents;
CREATE POLICY "Users with company profile can view admin documents"
ON public.admin_documents FOR SELECT TO authenticated
USING (
  public.is_system_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.company_id IS NOT NULL
  )
);

-- ai_setup_industry_templates
DROP POLICY IF EXISTS "Authenticated users can view industry templates" ON public.ai_setup_industry_templates;
DROP POLICY IF EXISTS "All authenticated users can view industry templates" ON public.ai_setup_industry_templates;
DROP POLICY IF EXISTS "Authenticated can view industry templates" ON public.ai_setup_industry_templates;
CREATE POLICY "Users with company profile can view industry templates"
ON public.ai_setup_industry_templates FOR SELECT TO authenticated
USING (
  public.is_system_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.company_id IS NOT NULL
  )
);

-- ai_setup_suggestion_stats — restrict to system_admin only (cross-tenant analytics)
DROP POLICY IF EXISTS "Authenticated users can view suggestion stats" ON public.ai_setup_suggestion_stats;
DROP POLICY IF EXISTS "All authenticated users can view suggestion stats" ON public.ai_setup_suggestion_stats;
DROP POLICY IF EXISTS "Authenticated can view suggestion stats" ON public.ai_setup_suggestion_stats;
CREATE POLICY "Only system admins can view suggestion stats"
ON public.ai_setup_suggestion_stats FOR SELECT TO authenticated
USING (public.is_system_admin(auth.uid()));

-- ks_module2_document_templates — keep tenant rows visible to their company,
-- but restrict system templates to users that belong to any company
DROP POLICY IF EXISTS "Users can view document templates" ON public.ks_module2_document_templates;
DROP POLICY IF EXISTS "Users can view their company document templates" ON public.ks_module2_document_templates;
DROP POLICY IF EXISTS "Users view document templates" ON public.ks_module2_document_templates;
CREATE POLICY "Users view company and system document templates"
ON public.ks_module2_document_templates FOR SELECT TO authenticated
USING (
  public.is_system_admin(auth.uid())
  OR (
    company_id = public.get_user_company_id(auth.uid())
  )
  OR (
    is_system_template = true
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.company_id IS NOT NULL
    )
  )
);
