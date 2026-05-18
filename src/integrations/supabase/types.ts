export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      action_plan_followups: {
        Row: {
          action_description: string
          action_id: string
          company_id: string
          completed_at: string | null
          completed_by_id: string | null
          completed_by_name: string | null
          created_at: string
          department_id: string | null
          followup_date: string
          followup_type: string
          id: string
          notes: string | null
          reminder_days_before: number | null
          reminder_enabled: boolean | null
          reminder_sent: boolean | null
          risk_description: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action_description: string
          action_id: string
          company_id: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          department_id?: string | null
          followup_date: string
          followup_type?: string
          id?: string
          notes?: string | null
          reminder_days_before?: number | null
          reminder_enabled?: boolean | null
          reminder_sent?: boolean | null
          risk_description?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action_description?: string
          action_id?: string
          company_id?: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          department_id?: string | null
          followup_date?: string
          followup_type?: string
          id?: string
          notes?: string | null
          reminder_days_before?: number | null
          reminder_enabled?: boolean | null
          reminder_sent?: boolean | null
          risk_description?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_followups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plan_followups_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plan_followups_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_byggesak_templates: {
        Row: {
          created_at: string
          description: string | null
          form_category: string
          form_name: string
          form_number: string
          id: string
          is_active: boolean
          language: string
          pdf_file_path: string | null
          required_fields: Json | null
          sort_order: number | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          form_category?: string
          form_name: string
          form_number: string
          id?: string
          is_active?: boolean
          language?: string
          pdf_file_path?: string | null
          required_fields?: Json | null
          sort_order?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          form_category?: string
          form_name?: string
          form_number?: string
          id?: string
          is_active?: boolean
          language?: string
          pdf_file_path?: string | null
          required_fields?: Json | null
          sort_order?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          version?: string | null
        }
        Relationships: []
      }
      admin_checklist_templates: {
        Row: {
          attached_pdf_path: string | null
          category: string
          checkpoints: Json
          content_html: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_locked: boolean | null
          is_mandatory: boolean | null
          template_name: string
          template_number: string | null
          trade: string | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          version: string | null
        }
        Insert: {
          attached_pdf_path?: string | null
          category?: string
          checkpoints?: Json
          content_html?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean | null
          is_mandatory?: boolean | null
          template_name: string
          template_number?: string | null
          trade?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          version?: string | null
        }
        Update: {
          attached_pdf_path?: string | null
          category?: string
          checkpoints?: Json
          content_html?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean | null
          is_mandatory?: boolean | null
          template_name?: string
          template_number?: string | null
          trade?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          version?: string | null
        }
        Relationships: []
      }
      admin_document_folders: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          module_type: string | null
          name: string
          parent_folder_id: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          module_type?: string | null
          name: string
          parent_folder_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          module_type?: string | null
          name?: string
          parent_folder_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_document_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "admin_document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size: number | null
          file_type: string | null
          folder_id: string | null
          id: string
          is_mandatory: boolean | null
          template_number: string | null
          updated_at: string
          uploaded_by_name: string
          valid_from: string | null
          valid_to: string | null
          version: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          document_name: string
          document_type?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          folder_id?: string | null
          id?: string
          is_mandatory?: boolean | null
          template_number?: string | null
          updated_at?: string
          uploaded_by_name: string
          valid_from?: string | null
          valid_to?: string | null
          version?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          folder_id?: string | null
          id?: string
          is_mandatory?: boolean | null
          template_number?: string | null
          updated_at?: string
          uploaded_by_name?: string
          valid_from?: string | null
          valid_to?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "admin_document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_project_type_templates: {
        Row: {
          checklist_template_ids: string[] | null
          contractor_type: string | null
          created_at: string
          default_description: string | null
          description: string | null
          document_template_ids: string[] | null
          example_change_orders: Json | null
          example_client_name: string | null
          example_client_org_number: string | null
          example_content_level: string | null
          example_contract_sum: number | null
          example_deviations: Json | null
          example_meeting_notes: Json | null
          example_milestones: Json | null
          example_subcontractors: Json | null
          icon: string | null
          id: string
          include_example_content: boolean | null
          is_active: boolean | null
          routine_template_ids: string[] | null
          sort_order: number | null
          template_name: string
          updated_at: string
        }
        Insert: {
          checklist_template_ids?: string[] | null
          contractor_type?: string | null
          created_at?: string
          default_description?: string | null
          description?: string | null
          document_template_ids?: string[] | null
          example_change_orders?: Json | null
          example_client_name?: string | null
          example_client_org_number?: string | null
          example_content_level?: string | null
          example_contract_sum?: number | null
          example_deviations?: Json | null
          example_meeting_notes?: Json | null
          example_milestones?: Json | null
          example_subcontractors?: Json | null
          icon?: string | null
          id?: string
          include_example_content?: boolean | null
          is_active?: boolean | null
          routine_template_ids?: string[] | null
          sort_order?: number | null
          template_name: string
          updated_at?: string
        }
        Update: {
          checklist_template_ids?: string[] | null
          contractor_type?: string | null
          created_at?: string
          default_description?: string | null
          description?: string | null
          document_template_ids?: string[] | null
          example_change_orders?: Json | null
          example_client_name?: string | null
          example_client_org_number?: string | null
          example_content_level?: string | null
          example_contract_sum?: number | null
          example_deviations?: Json | null
          example_meeting_notes?: Json | null
          example_milestones?: Json | null
          example_subcontractors?: Json | null
          icon?: string | null
          id?: string
          include_example_content?: boolean | null
          is_active?: boolean | null
          routine_template_ids?: string[] | null
          sort_order?: number | null
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_routine_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          is_active: boolean
          is_locked: boolean | null
          is_mandatory: boolean | null
          routine_name: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          version: string | null
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean | null
          is_mandatory?: boolean | null
          routine_name: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          version?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean | null
          is_mandatory?: boolean | null
          routine_name?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          version?: string | null
        }
        Relationships: []
      }
      admin_routine_templates_v2: {
        Row: {
          attachments: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          frequency: string | null
          id: string
          is_global_default: boolean
          legal_refs: Json | null
          module: string
          purpose: string | null
          status: string
          steps: Json | null
          subcategory: string | null
          tags: string[] | null
          target_roles: string[] | null
          template_number: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          is_global_default?: boolean
          legal_refs?: Json | null
          module?: string
          purpose?: string | null
          status?: string
          steps?: Json | null
          subcategory?: string | null
          tags?: string[] | null
          target_roles?: string[] | null
          template_number?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          is_global_default?: boolean
          legal_refs?: Json | null
          module?: string
          purpose?: string | null
          status?: string
          steps?: Json | null
          subcategory?: string | null
          tags?: string[] | null
          target_roles?: string[] | null
          template_number?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      ai_rate_limits: {
        Row: {
          created_at: string
          function_name: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      ai_setup_industry_templates: {
        Row: {
          created_at: string
          id: string
          industry: string
          is_active: boolean
          suggestions: Json
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry: string
          is_active?: boolean
          suggestions?: Json
          template_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string
          is_active?: boolean
          suggestions?: Json
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_setup_responses: {
        Row: {
          company_id: string
          created_at: string
          function_name: string
          id: string
          message_hash: string
          response_content: string
        }
        Insert: {
          company_id: string
          created_at?: string
          function_name: string
          id?: string
          message_hash: string
          response_content: string
        }
        Update: {
          company_id?: string
          created_at?: string
          function_name?: string
          id?: string
          message_hash?: string
          response_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_setup_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_setup_suggestion_stats: {
        Row: {
          company_size_category: string | null
          created_at: string
          id: string
          industry: string
          suggestion_text: string
          suggestion_type: string
          times_accepted: number
          times_suggested: number
          updated_at: string
        }
        Insert: {
          company_size_category?: string | null
          created_at?: string
          id?: string
          industry: string
          suggestion_text: string
          suggestion_type: string
          times_accepted?: number
          times_suggested?: number
          updated_at?: string
        }
        Update: {
          company_size_category?: string | null
          created_at?: string
          id?: string
          industry?: string
          suggestion_text?: string
          suggestion_type?: string
          times_accepted?: number
          times_suggested?: number
          updated_at?: string
        }
        Relationships: []
      }
      anonymous_message_discussions: {
        Row: {
          comment: string
          company_id: string
          created_at: string
          id: string
          message_id: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          comment: string
          company_id: string
          created_at?: string
          id?: string
          message_id: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          comment?: string
          company_id?: string
          created_at?: string
          id?: string
          message_id?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_message_discussions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anonymous_message_discussions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "anonymous_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_messages: {
        Row: {
          category: string
          company_id: string
          created_at: string
          id: string
          message: string
          message_number: string
          priority: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          category?: string
          company_id: string
          created_at?: string
          id?: string
          message: string
          message_number: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          message?: string
          message_number?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_form_responses: {
        Row: {
          audit_id: string | null
          auditor_name: string | null
          company_id: string
          completed_at: string | null
          completed_by_id: string | null
          completed_by_name: string | null
          created_at: string
          department_id: string | null
          form_data: Json
          form_type: string
          id: string
          manager_name: string | null
          participants: string | null
          revision_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          audit_id?: string | null
          auditor_name?: string | null
          company_id: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          department_id?: string | null
          form_data?: Json
          form_type: string
          id?: string
          manager_name?: string | null
          participants?: string | null
          revision_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          audit_id?: string | null
          auditor_name?: string | null
          company_id?: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          department_id?: string | null
          form_data?: Json
          form_type?: string
          id?: string
          manager_name?: string | null
          participants?: string | null
          revision_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_form_responses_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_form_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_form_responses_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_form_responses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          changed_by: string | null
          company_id: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      audits: {
        Row: {
          area: string | null
          audit_number: string
          checklist_completed: number
          checklist_total: number
          company_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          department_id: string | null
          description: string | null
          form_type: string | null
          id: string
          is_deleted: boolean
          responsible_id: string | null
          responsible_name: string | null
          scheduled_date: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          audit_number: string
          checklist_completed?: number
          checklist_total?: number
          company_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          department_id?: string | null
          description?: string | null
          form_type?: string | null
          id?: string
          is_deleted?: boolean
          responsible_id?: string | null
          responsible_name?: string | null
          scheduled_date: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          audit_number?: string
          checklist_completed?: number
          checklist_total?: number
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          department_id?: string | null
          description?: string | null
          form_type?: string | null
          id?: string
          is_deleted?: boolean
          responsible_id?: string | null
          responsible_name?: string | null
          scheduled_date?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chemical_risk_assessments: {
        Row: {
          company_chemical_entry_id: string | null
          company_id: string
          created_at: string
          current_phase: number
          department_id: string | null
          existing_measures: Json | null
          exposed_workers_count: number | null
          exposure_duration: string | null
          exposure_level: string | null
          exposure_probability: number | null
          exposure_type: string | null
          hazard_identification: Json | null
          hazard_severity: number | null
          health_monitoring_details: string | null
          health_monitoring_required: boolean | null
          id: string
          ik_hms_stoffkartotek_id: string | null
          implemented_measures: Json | null
          phase_1_assessed_at: string | null
          phase_1_assessed_by_id: string | null
          phase_1_assessed_by_name: string | null
          phase_1_completed: boolean
          phase_1_conclusion: string | null
          phase_1_needs_further_assessment: boolean | null
          phase_2_assessed_at: string | null
          phase_2_assessed_by_id: string | null
          phase_2_assessed_by_name: string | null
          phase_2_completed: boolean
          phase_2_conclusion: string | null
          phase_2_measurement_method: string | null
          phase_2_measurements: Json | null
          phase_2_needs_detailed_assessment: boolean | null
          phase_3_assessed_at: string | null
          phase_3_assessed_by_id: string | null
          phase_3_assessed_by_name: string | null
          phase_3_completed: boolean
          phase_3_conclusion: string | null
          phase_3_measurements: Json | null
          phase_3_statistical_analysis: Json | null
          planned_measures: Json | null
          project_id: string | null
          required_ppe: Json | null
          risk_level: string | null
          status: string
          updated_at: string
          work_tasks: Json | null
        }
        Insert: {
          company_chemical_entry_id?: string | null
          company_id: string
          created_at?: string
          current_phase?: number
          department_id?: string | null
          existing_measures?: Json | null
          exposed_workers_count?: number | null
          exposure_duration?: string | null
          exposure_level?: string | null
          exposure_probability?: number | null
          exposure_type?: string | null
          hazard_identification?: Json | null
          hazard_severity?: number | null
          health_monitoring_details?: string | null
          health_monitoring_required?: boolean | null
          id?: string
          ik_hms_stoffkartotek_id?: string | null
          implemented_measures?: Json | null
          phase_1_assessed_at?: string | null
          phase_1_assessed_by_id?: string | null
          phase_1_assessed_by_name?: string | null
          phase_1_completed?: boolean
          phase_1_conclusion?: string | null
          phase_1_needs_further_assessment?: boolean | null
          phase_2_assessed_at?: string | null
          phase_2_assessed_by_id?: string | null
          phase_2_assessed_by_name?: string | null
          phase_2_completed?: boolean
          phase_2_conclusion?: string | null
          phase_2_measurement_method?: string | null
          phase_2_measurements?: Json | null
          phase_2_needs_detailed_assessment?: boolean | null
          phase_3_assessed_at?: string | null
          phase_3_assessed_by_id?: string | null
          phase_3_assessed_by_name?: string | null
          phase_3_completed?: boolean
          phase_3_conclusion?: string | null
          phase_3_measurements?: Json | null
          phase_3_statistical_analysis?: Json | null
          planned_measures?: Json | null
          project_id?: string | null
          required_ppe?: Json | null
          risk_level?: string | null
          status?: string
          updated_at?: string
          work_tasks?: Json | null
        }
        Update: {
          company_chemical_entry_id?: string | null
          company_id?: string
          created_at?: string
          current_phase?: number
          department_id?: string | null
          existing_measures?: Json | null
          exposed_workers_count?: number | null
          exposure_duration?: string | null
          exposure_level?: string | null
          exposure_probability?: number | null
          exposure_type?: string | null
          hazard_identification?: Json | null
          hazard_severity?: number | null
          health_monitoring_details?: string | null
          health_monitoring_required?: boolean | null
          id?: string
          ik_hms_stoffkartotek_id?: string | null
          implemented_measures?: Json | null
          phase_1_assessed_at?: string | null
          phase_1_assessed_by_id?: string | null
          phase_1_assessed_by_name?: string | null
          phase_1_completed?: boolean
          phase_1_conclusion?: string | null
          phase_1_needs_further_assessment?: boolean | null
          phase_2_assessed_at?: string | null
          phase_2_assessed_by_id?: string | null
          phase_2_assessed_by_name?: string | null
          phase_2_completed?: boolean
          phase_2_conclusion?: string | null
          phase_2_measurement_method?: string | null
          phase_2_measurements?: Json | null
          phase_2_needs_detailed_assessment?: boolean | null
          phase_3_assessed_at?: string | null
          phase_3_assessed_by_id?: string | null
          phase_3_assessed_by_name?: string | null
          phase_3_completed?: boolean
          phase_3_conclusion?: string | null
          phase_3_measurements?: Json | null
          phase_3_statistical_analysis?: Json | null
          planned_measures?: Json | null
          project_id?: string | null
          required_ppe?: Json | null
          risk_level?: string | null
          status?: string
          updated_at?: string
          work_tasks?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chemical_risk_assessments_company_chemical_entry_id_fkey"
            columns: ["company_chemical_entry_id"]
            isOneToOne: false
            referencedRelation: "company_chemical_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_risk_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_risk_assessments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_risk_assessments_ik_hms_stoffkartotek_id_fkey"
            columns: ["ik_hms_stoffkartotek_id"]
            isOneToOne: false
            referencedRelation: "ik_hms_stoffkartotek"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_risk_assessments_phase_1_assessed_by_id_fkey"
            columns: ["phase_1_assessed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_risk_assessments_phase_2_assessed_by_id_fkey"
            columns: ["phase_2_assessed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_risk_assessments_phase_3_assessed_by_id_fkey"
            columns: ["phase_3_assessed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chemical_risk_assessments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_error_logs: {
        Row: {
          component_stack: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          id: string
          metadata: Json | null
          source: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          accent_color: string | null
          address: string | null
          brreg_employee_count: number | null
          brreg_synced_at: string | null
          city: string | null
          created_at: string
          email: string | null
          employee_count: number | null
          has_departments: boolean
          id: string
          logo_url: string | null
          name: string
          org_number: string | null
          phone: string | null
          postal_code: string | null
          seller_id: string | null
          sg_approval_areas: string[] | null
          sg_approved: boolean | null
          sg_expiry_date: string | null
          sg_org_number: string | null
          status: Database["public"]["Enums"]["company_status"]
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          brreg_employee_count?: number | null
          brreg_synced_at?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          employee_count?: number | null
          has_departments?: boolean
          id?: string
          logo_url?: string | null
          name: string
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          seller_id?: string | null
          sg_approval_areas?: string[] | null
          sg_approved?: boolean | null
          sg_expiry_date?: string | null
          sg_org_number?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          brreg_employee_count?: number | null
          brreg_synced_at?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          employee_count?: number | null
          has_departments?: boolean
          id?: string
          logo_url?: string | null
          name?: string
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          seller_id?: string | null
          sg_approval_areas?: string[] | null
          sg_approved?: boolean | null
          sg_expiry_date?: string | null
          sg_org_number?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      company_aarshjul_activities: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          month: number
          name: string
          responsible: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          month: number
          name: string
          responsible?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          month?: number
          name?: string
          responsible?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_aarshjul_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_aarshjul_activities_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      company_aarshjul_default_overrides: {
        Row: {
          activity_id: string
          company_id: string
          created_at: string
          custom_months: number[]
          department_id: string | null
          id: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          company_id: string
          created_at?: string
          custom_months: number[]
          department_id?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          company_id?: string
          created_at?: string
          custom_months?: number[]
          department_id?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_aarshjul_default_overrides_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_aarshjul_default_overrides_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      company_aarshjul_hidden_defaults: {
        Row: {
          activity_id: string
          company_id: string
          department_id: string | null
          hidden_at: string
          id: string
        }
        Insert: {
          activity_id: string
          company_id: string
          department_id?: string | null
          hidden_at?: string
          id?: string
        }
        Update: {
          activity_id?: string
          company_id?: string
          department_id?: string | null
          hidden_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_aarshjul_hidden_defaults_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_aarshjul_hidden_defaults_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      company_action_plans: {
        Row: {
          actions: Json
          company_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          department_id: string | null
          id: string
          is_deleted: boolean
          updated_at: string
        }
        Insert: {
          actions?: Json
          company_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          department_id?: string | null
          id?: string
          is_deleted?: boolean
          updated_at?: string
        }
        Update: {
          actions?: Json
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          department_id?: string | null
          id?: string
          is_deleted?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_action_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_action_plans_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      company_chemical_entries: {
        Row: {
          company_id: string
          created_at: string
          custom_notes: string | null
          department_id: string | null
          global_chemical_id: string
          id: string
          last_updated: string
          location: string | null
          project_id: string | null
          quantity: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          custom_notes?: string | null
          department_id?: string | null
          global_chemical_id: string
          id?: string
          last_updated?: string
          location?: string | null
          project_id?: string | null
          quantity?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          custom_notes?: string | null
          department_id?: string | null
          global_chemical_id?: string
          id?: string
          last_updated?: string
          location?: string | null
          project_id?: string | null
          quantity?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_chemical_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_chemical_entries_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_chemical_entries_global_chemical_id_fkey"
            columns: ["global_chemical_id"]
            isOneToOne: false
            referencedRelation: "global_chemicals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_chemical_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      company_departments: {
        Row: {
          address: string | null
          city: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_number: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_number?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_number?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_favorite_colors: {
        Row: {
          color: string
          company_id: string
          created_at: string
          id: string
          name: string | null
        }
        Insert: {
          color: string
          company_id: string
          created_at?: string
          id?: string
          name?: string | null
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_favorite_colors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_goals: {
        Row: {
          company_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          department_id: string | null
          goal_text: string
          id: string
          is_deleted: boolean
          is_predefined: boolean | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          department_id?: string | null
          goal_text: string
          id?: string
          is_deleted?: boolean
          is_predefined?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          department_id?: string | null
          goal_text?: string
          id?: string
          is_deleted?: boolean
          is_predefined?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_goals_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ks_checklist_templates: {
        Row: {
          category: string
          checkpoints: Json
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          template_name: string
          trade: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          category?: string
          checkpoints?: Json
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          template_name: string
          trade?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          category?: string
          checkpoints?: Json
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          template_name?: string
          trade?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_ks_checklist_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ks_document_folders: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_folder_id: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_folder_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_folder_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_ks_document_folders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ks_document_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "company_ks_document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ks_documents: {
        Row: {
          company_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          document_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          folder_id: string | null
          id: string
          is_deleted: boolean
          is_template: boolean | null
          project_id: string | null
          updated_at: string
          uploaded_by_id: string | null
          uploaded_by_name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          document_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          folder_id?: string | null
          id?: string
          is_deleted?: boolean
          is_template?: boolean | null
          project_id?: string | null
          updated_at?: string
          uploaded_by_id?: string | null
          uploaded_by_name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          document_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          folder_id?: string | null
          id?: string
          is_deleted?: boolean
          is_template?: boolean | null
          project_id?: string | null
          updated_at?: string
          uploaded_by_id?: string | null
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_ks_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ks_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "company_ks_document_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ks_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ks_documents_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ks_goals: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          goal_text: string
          id: string
          sort_order: number | null
          status: string | null
          target_date: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          goal_text: string
          id?: string
          sort_order?: number | null
          status?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          goal_text?: string
          id?: string
          sort_order?: number | null
          status?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_ks_goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ks_organization: {
        Row: {
          company_id: string
          created_at: string
          custom_content: string
          id: string
          is_custom: boolean | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          custom_content?: string
          id?: string
          is_custom?: boolean | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          custom_content?: string
          id?: string
          is_custom?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_ks_organization_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ks_routines: {
        Row: {
          admin_template_id: string | null
          category: string
          company_id: string
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          file_path: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean
          routine_name: string
          routine_number: string | null
          sort_order: number | null
          updated_at: string
          version: string | null
        }
        Insert: {
          admin_template_id?: string | null
          category?: string
          company_id: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean
          routine_name: string
          routine_number?: string | null
          sort_order?: number | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          admin_template_id?: string | null
          category?: string
          company_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean
          routine_name?: string
          routine_number?: string | null
          sort_order?: number | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_ks_routines_admin_template_id_fkey"
            columns: ["admin_template_id"]
            isOneToOne: false
            referencedRelation: "admin_routine_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ks_routines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ks_selected_templates: {
        Row: {
          admin_template_id: string
          company_id: string
          id: string
          selected_at: string
          selected_by_id: string | null
          template_type: string
        }
        Insert: {
          admin_template_id: string
          company_id: string
          id?: string
          selected_at?: string
          selected_by_id?: string | null
          template_type: string
        }
        Update: {
          admin_template_id?: string
          company_id?: string
          id?: string
          selected_at?: string
          selected_by_id?: string | null
          template_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_ks_selected_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ks_selected_templates_selected_by_id_fkey"
            columns: ["selected_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ks_system_goals: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          goal_text: string
          goal_type: string
          id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          goal_text: string
          goal_type?: string
          id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          goal_text?: string
          goal_type?: string
          id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_ks_system_goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_laws_regulations: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          department_id: string | null
          description: string | null
          employee_threshold: number | null
          id: string
          is_employee_based: boolean | null
          is_manually_added: boolean | null
          law_name: string
          link: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          employee_threshold?: number | null
          id?: string
          is_employee_based?: boolean | null
          is_manually_added?: boolean | null
          law_name: string
          link?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          employee_threshold?: number | null
          id?: string
          is_employee_based?: boolean | null
          is_manually_added?: boolean | null
          law_name?: string
          link?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_laws_regulations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_laws_regulations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      company_module_documents: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          document_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          folder_name: string | null
          id: string
          module_type: string
          updated_at: string
          uploaded_by_id: string | null
          uploaded_by_name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          document_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          folder_name?: string | null
          id?: string
          module_type: string
          updated_at?: string
          uploaded_by_id?: string | null
          uploaded_by_name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          document_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          folder_name?: string | null
          id?: string
          module_type?: string
          updated_at?: string
          uploaded_by_id?: string | null
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_module_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_module_documents_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_modules: {
        Row: {
          company_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean
          module_type: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean
          module_type: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean
          module_type?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_notification_settings: {
        Row: {
          company_id: string
          course_expiry_days_before: number[]
          course_expiry_enabled: boolean
          created_at: string
          deviation_assignment_enabled: boolean
          deviation_deadline_days_before: number[]
          deviation_deadline_reminder_enabled: boolean
          hms_card_expiry_days_before: number[]
          hms_card_expiry_enabled: boolean
          id: string
          notify_company_admin: boolean
          notify_employee: boolean
          notify_hms_responsible: boolean
          updated_at: string
        }
        Insert: {
          company_id: string
          course_expiry_days_before?: number[]
          course_expiry_enabled?: boolean
          created_at?: string
          deviation_assignment_enabled?: boolean
          deviation_deadline_days_before?: number[]
          deviation_deadline_reminder_enabled?: boolean
          hms_card_expiry_days_before?: number[]
          hms_card_expiry_enabled?: boolean
          id?: string
          notify_company_admin?: boolean
          notify_employee?: boolean
          notify_hms_responsible?: boolean
          updated_at?: string
        }
        Update: {
          company_id?: string
          course_expiry_days_before?: number[]
          course_expiry_enabled?: boolean
          created_at?: string
          deviation_assignment_enabled?: boolean
          deviation_deadline_days_before?: number[]
          deviation_deadline_reminder_enabled?: boolean
          hms_card_expiry_days_before?: number[]
          hms_card_expiry_enabled?: boolean
          id?: string
          notify_company_admin?: boolean
          notify_employee?: boolean
          notify_hms_responsible?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_notification_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_organization: {
        Row: {
          company_id: string
          created_at: string
          custom_content: string
          department_id: string | null
          id: string
          is_custom: boolean | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          custom_content: string
          department_id?: string | null
          id?: string
          is_custom?: boolean | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          custom_content?: string
          department_id?: string | null
          id?: string
          is_custom?: boolean | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_organization_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_organization_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      company_project_templates: {
        Row: {
          company_id: string
          contractor_type: string | null
          created_at: string | null
          created_by: string | null
          default_checklists: Json | null
          default_description: string | null
          default_routines: Json | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          template_name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          contractor_type?: string | null
          created_at?: string | null
          created_by?: string | null
          default_checklists?: Json | null
          default_description?: string | null
          default_routines?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          template_name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          contractor_type?: string | null
          created_at?: string | null
          created_by?: string | null
          default_checklists?: Json | null
          default_description?: string | null
          default_routines?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_project_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_project_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_risk_assessments: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          id: string
          risks: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          id?: string
          risks?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          id?: string
          risks?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_risk_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_risk_assessments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      company_routines: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          id: string
          routines: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          id?: string
          routines?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          id?: string
          routines?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_routines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_routines_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_translations: {
        Row: {
          company_id: string | null
          content_hash: string
          content_type: string
          created_at: string
          id: string
          original_content: string
          source_language: string
          target_language: string
          translated_content: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          content_hash: string
          content_type?: string
          created_at?: string
          id?: string
          original_content: string
          source_language?: string
          target_language: string
          translated_content: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          content_hash?: string
          content_type?: string
          created_at?: string
          id?: string
          original_content?: string
          source_language?: string
          target_language?: string
          translated_content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_translations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_routine_instances: {
        Row: {
          company_id: string
          content: Json
          created_at: string
          id: string
          last_reviewed: string | null
          module: string
          next_due: string | null
          status: string
          template_id: string | null
          template_version: number | null
          title: string
          update_available: boolean
          updated_at: string
        }
        Insert: {
          company_id: string
          content?: Json
          created_at?: string
          id?: string
          last_reviewed?: string | null
          module: string
          next_due?: string | null
          status?: string
          template_id?: string | null
          template_version?: number | null
          title: string
          update_available?: boolean
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: Json
          created_at?: string
          id?: string
          last_reviewed?: string | null
          module?: string
          next_due?: string | null
          status?: string
          template_id?: string | null
          template_version?: number | null
          title?: string
          update_available?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_routine_instances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_routine_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "admin_routine_templates_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      department_action_plans: {
        Row: {
          actions: Json
          created_at: string
          department_id: string
          id: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          created_at?: string
          department_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          created_at?: string
          department_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_action_plans_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: true
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_goals: {
        Row: {
          created_at: string
          department_id: string
          goal_text: string
          id: string
          is_predefined: boolean | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          goal_text: string
          id?: string
          is_predefined?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          goal_text?: string
          id?: string
          is_predefined?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_goals_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_organization: {
        Row: {
          created_at: string
          custom_content: string
          department_id: string
          id: string
          is_custom: boolean | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_content?: string
          department_id: string
          id?: string
          is_custom?: boolean | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_content?: string
          department_id?: string
          id?: string
          is_custom?: boolean | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_organization_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: true
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_risk_assessments: {
        Row: {
          created_at: string
          department_id: string
          id: string
          risks: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          risks?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          risks?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_risk_assessments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: true
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_routines: {
        Row: {
          created_at: string
          department_id: string
          id: string
          routines: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          routines?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          routines?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_routines_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: true
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      deviation_attachments: {
        Row: {
          company_id: string
          created_at: string
          deviation_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_by: string | null
          uploaded_by_name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deviation_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
          uploaded_by_name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deviation_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "deviation_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviation_attachments_deviation_id_fkey"
            columns: ["deviation_id"]
            isOneToOne: false
            referencedRelation: "deviations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviation_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deviation_comments: {
        Row: {
          company_id: string
          content: string
          created_at: string
          deviation_id: string
          id: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          deviation_id: string
          id?: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          deviation_id?: string
          id?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      deviation_deadline_reminders: {
        Row: {
          company_id: string
          deviation_id: string
          id: string
          recipient_email: string
          reminder_type: string
          sent_at: string
        }
        Insert: {
          company_id: string
          deviation_id: string
          id?: string
          recipient_email: string
          reminder_type: string
          sent_at?: string
        }
        Update: {
          company_id?: string
          deviation_id?: string
          id?: string
          recipient_email?: string
          reminder_type?: string
          sent_at?: string
        }
        Relationships: []
      }
      deviations: {
        Row: {
          additional_info: string | null
          assignee_id: string | null
          assignee_name: string | null
          category: string
          company_id: string
          consequences: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          department_id: string | null
          description: string | null
          deviation_number: string
          due_date: string
          fdv_building_id: string | null
          id: string
          immediate_actions: string | null
          incident_date: string | null
          incident_location: string | null
          incident_time: string | null
          incident_type: string | null
          involved_persons: string | null
          is_deleted: boolean
          notify_arbeidstilsynet: boolean | null
          notify_insurance: boolean | null
          preventive_measures: string | null
          priority: string
          project_id: string | null
          receiver_signature: string | null
          reporter_contact: string | null
          reporter_id: string | null
          reporter_name: string
          reporter_signature: string | null
          responsible_receiver: string | null
          root_cause_analysis: string | null
          severity: string | null
          signed_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          additional_info?: string | null
          assignee_id?: string | null
          assignee_name?: string | null
          category: string
          company_id: string
          consequences?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          department_id?: string | null
          description?: string | null
          deviation_number: string
          due_date: string
          fdv_building_id?: string | null
          id?: string
          immediate_actions?: string | null
          incident_date?: string | null
          incident_location?: string | null
          incident_time?: string | null
          incident_type?: string | null
          involved_persons?: string | null
          is_deleted?: boolean
          notify_arbeidstilsynet?: boolean | null
          notify_insurance?: boolean | null
          preventive_measures?: string | null
          priority: string
          project_id?: string | null
          receiver_signature?: string | null
          reporter_contact?: string | null
          reporter_id?: string | null
          reporter_name: string
          reporter_signature?: string | null
          responsible_receiver?: string | null
          root_cause_analysis?: string | null
          severity?: string | null
          signed_at?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          additional_info?: string | null
          assignee_id?: string | null
          assignee_name?: string | null
          category?: string
          company_id?: string
          consequences?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          department_id?: string | null
          description?: string | null
          deviation_number?: string
          due_date?: string
          fdv_building_id?: string | null
          id?: string
          immediate_actions?: string | null
          incident_date?: string | null
          incident_location?: string | null
          incident_time?: string | null
          incident_type?: string | null
          involved_persons?: string | null
          is_deleted?: boolean
          notify_arbeidstilsynet?: boolean | null
          notify_insurance?: boolean | null
          preventive_measures?: string | null
          priority?: string
          project_id?: string | null
          receiver_signature?: string | null
          reporter_contact?: string | null
          reporter_id?: string | null
          reporter_name?: string
          reporter_signature?: string | null
          responsible_receiver?: string | null
          root_cause_analysis?: string | null
          severity?: string | null
          signed_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deviations_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_fdv_building_id_fkey"
            columns: ["fdv_building_id"]
            isOneToOne: false
            referencedRelation: "fdv_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deviations_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driving_log_entries: {
        Row: {
          company_id: string
          created_at: string
          distance_km: number | null
          end_location: string | null
          id: string
          notes: string | null
          odometer_end: number | null
          odometer_start: number
          passenger_count: number | null
          passengers: string | null
          purpose: string | null
          start_location: string
          status: string
          trip_date: string
          trip_type: string
          updated_at: string
          user_id: string
          vehicle_description: string | null
          vehicle_registration: string | null
          vehicle_type: string
          via_locations: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          distance_km?: number | null
          end_location?: string | null
          id?: string
          notes?: string | null
          odometer_end?: number | null
          odometer_start: number
          passenger_count?: number | null
          passengers?: string | null
          purpose?: string | null
          start_location: string
          status?: string
          trip_date?: string
          trip_type?: string
          updated_at?: string
          user_id: string
          vehicle_description?: string | null
          vehicle_registration?: string | null
          vehicle_type?: string
          via_locations?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          distance_km?: number | null
          end_location?: string | null
          id?: string
          notes?: string | null
          odometer_end?: number | null
          odometer_start?: number
          passenger_count?: number | null
          passengers?: string | null
          purpose?: string | null
          start_location?: string
          status?: string
          trip_date?: string
          trip_type?: string
          updated_at?: string
          user_id?: string
          vehicle_description?: string | null
          vehicle_registration?: string | null
          vehicle_type?: string
          via_locations?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driving_log_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driving_log_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driving_log_expenses: {
        Row: {
          amount: number
          category: string
          company_id: string
          created_at: string
          description: string
          id: string
          receipt_path: string | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          company_id: string
          created_at?: string
          description: string
          id?: string
          receipt_path?: string | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          receipt_path?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driving_log_expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driving_log_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "driving_log_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          company_name: string | null
          created_at: string
          delivered_at: string | null
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          resend_email_id: string | null
          sent_by: string | null
          status: string
          subject: string | null
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          company_name?: string | null
          created_at?: string
          delivered_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          resend_email_id?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          company_name?: string | null
          created_at?: string
          delivered_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          resend_email_id?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      employee_absence: {
        Row: {
          absence_type: string
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          employee_id: string
          end_date: string
          id: string
          medical_certificate_path: string | null
          notes: string | null
          reason: string | null
          registered_at: string
          registered_by: string | null
          start_date: string
          status: string
          total_days: number
          updated_at: string
        }
        Insert: {
          absence_type: string
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          medical_certificate_path?: string | null
          notes?: string | null
          reason?: string | null
          registered_at?: string
          registered_by?: string | null
          start_date: string
          status?: string
          total_days: number
          updated_at?: string
        }
        Update: {
          absence_type?: string
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          medical_certificate_path?: string | null
          notes?: string | null
          reason?: string | null
          registered_at?: string
          registered_by?: string | null
          start_date?: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_absence_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_absence_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_absence_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_absence_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_courses: {
        Row: {
          certificate_file_path: string | null
          certificate_number: string | null
          company_id: string
          completed_date: string
          course_name: string
          course_provider: string | null
          created_at: string
          employee_id: string
          expiry_date: string | null
          id: string
          notes: string | null
          reminder_sent_30_days: boolean | null
          reminder_sent_7_days: boolean | null
          status: string
          updated_at: string
          validity_years: number | null
        }
        Insert: {
          certificate_file_path?: string | null
          certificate_number?: string | null
          company_id: string
          completed_date: string
          course_name: string
          course_provider?: string | null
          created_at?: string
          employee_id: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          reminder_sent_30_days?: boolean | null
          reminder_sent_7_days?: boolean | null
          status?: string
          updated_at?: string
          validity_years?: number | null
        }
        Update: {
          certificate_file_path?: string | null
          certificate_number?: string | null
          company_id?: string
          completed_date?: string
          course_name?: string
          course_provider?: string | null
          created_at?: string
          employee_id?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          reminder_sent_30_days?: boolean | null
          reminder_sent_7_days?: boolean | null
          status?: string
          updated_at?: string
          validity_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_courses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_courses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          employee_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          updated_at: string
          uploaded_by: string | null
          uploaded_by_name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          employee_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          employee_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_meetings: {
        Row: {
          action_items: Json | null
          company_id: string
          completed_date: string | null
          created_at: string
          development_discussed: string | null
          employee_id: string
          employee_signature: string | null
          goals_discussed: string | null
          id: string
          leader_signature: string | null
          meeting_leader: string | null
          meeting_leader_name: string | null
          meeting_notes: string | null
          meeting_type: string
          other_topics: string | null
          scheduled_date: string
          signed_at: string | null
          status: string
          updated_at: string
          wellbeing_discussed: string | null
        }
        Insert: {
          action_items?: Json | null
          company_id: string
          completed_date?: string | null
          created_at?: string
          development_discussed?: string | null
          employee_id: string
          employee_signature?: string | null
          goals_discussed?: string | null
          id?: string
          leader_signature?: string | null
          meeting_leader?: string | null
          meeting_leader_name?: string | null
          meeting_notes?: string | null
          meeting_type?: string
          other_topics?: string | null
          scheduled_date: string
          signed_at?: string | null
          status?: string
          updated_at?: string
          wellbeing_discussed?: string | null
        }
        Update: {
          action_items?: Json | null
          company_id?: string
          completed_date?: string | null
          created_at?: string
          development_discussed?: string | null
          employee_id?: string
          employee_signature?: string | null
          goals_discussed?: string | null
          id?: string
          leader_signature?: string | null
          meeting_leader?: string | null
          meeting_leader_name?: string | null
          meeting_notes?: string | null
          meeting_type?: string
          other_topics?: string | null
          scheduled_date?: string
          signed_at?: string | null
          status?: string
          updated_at?: string
          wellbeing_discussed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_meetings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_meetings_meeting_leader_fkey"
            columns: ["meeting_leader"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_messages: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          recipient_id: string
          recipient_name: string
          sender_id: string
          sender_name: string
          subject: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          recipient_id: string
          recipient_name: string
          sender_id: string
          sender_name: string
          subject?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          recipient_id?: string
          recipient_name?: string
          sender_id?: string
          sender_name?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_surveys: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          is_anonymous: boolean | null
          questions: Json
          start_date: string
          status: string
          survey_description: string | null
          survey_title: string
          survey_type: string
          target_employee_ids: string[] | null
          target_group: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          is_anonymous?: boolean | null
          questions?: Json
          start_date: string
          status?: string
          survey_description?: string | null
          survey_title: string
          survey_type?: string
          target_employee_ids?: string[] | null
          target_group?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          is_anonymous?: boolean | null
          questions?: Json
          start_date?: string
          status?: string
          survey_description?: string | null
          survey_title?: string
          survey_type?: string
          target_employee_ids?: string[] | null
          target_group?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_surveys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_contracts: {
        Row: {
          break_duration_minutes: number | null
          client_company_name: string | null
          client_company_org_number: string | null
          collective_agreement_name: string | null
          collective_agreement_parties: string | null
          company_id: string
          contract_file_path: string | null
          contract_type: string
          created_at: string
          employee_id: string
          employee_signature: string | null
          employer_signature: string | null
          employment_percentage: number
          end_date: string | null
          has_collective_agreement: boolean | null
          has_multiple_workplaces: boolean | null
          holiday_pay_percentage: number | null
          id: string
          insurance_provisions: string | null
          is_staffing_agency: boolean | null
          notes: string | null
          notice_period_employee_months: number | null
          notice_period_employer_months: number | null
          other_allowances: string | null
          overtime_compensation: string | null
          payment_day: number | null
          payment_method: string | null
          pension_scheme: string | null
          position: string
          probation_period_months: number | null
          remote_work_allowed: boolean | null
          remote_work_details: string | null
          salary_amount: number | null
          salary_type: string | null
          shift_change_rules: string | null
          sick_pay_rules: string | null
          signed_by_employee: boolean | null
          signed_by_employer: boolean | null
          signed_date: string | null
          special_work_time_details: string | null
          special_work_time_exemptions: boolean | null
          start_date: string
          status: string
          temporary_reason: string | null
          termination_procedures: string | null
          training_provisions: string | null
          updated_at: string
          vacation_days: number | null
          vacation_rules: string | null
          variable_hours_description: string | null
          variable_working_hours: boolean | null
          work_description: string | null
          work_time_arrangement: string | null
          working_hours_per_day: number | null
          working_hours_per_week: number | null
          workplace_address: string | null
        }
        Insert: {
          break_duration_minutes?: number | null
          client_company_name?: string | null
          client_company_org_number?: string | null
          collective_agreement_name?: string | null
          collective_agreement_parties?: string | null
          company_id: string
          contract_file_path?: string | null
          contract_type: string
          created_at?: string
          employee_id: string
          employee_signature?: string | null
          employer_signature?: string | null
          employment_percentage?: number
          end_date?: string | null
          has_collective_agreement?: boolean | null
          has_multiple_workplaces?: boolean | null
          holiday_pay_percentage?: number | null
          id?: string
          insurance_provisions?: string | null
          is_staffing_agency?: boolean | null
          notes?: string | null
          notice_period_employee_months?: number | null
          notice_period_employer_months?: number | null
          other_allowances?: string | null
          overtime_compensation?: string | null
          payment_day?: number | null
          payment_method?: string | null
          pension_scheme?: string | null
          position: string
          probation_period_months?: number | null
          remote_work_allowed?: boolean | null
          remote_work_details?: string | null
          salary_amount?: number | null
          salary_type?: string | null
          shift_change_rules?: string | null
          sick_pay_rules?: string | null
          signed_by_employee?: boolean | null
          signed_by_employer?: boolean | null
          signed_date?: string | null
          special_work_time_details?: string | null
          special_work_time_exemptions?: boolean | null
          start_date: string
          status?: string
          temporary_reason?: string | null
          termination_procedures?: string | null
          training_provisions?: string | null
          updated_at?: string
          vacation_days?: number | null
          vacation_rules?: string | null
          variable_hours_description?: string | null
          variable_working_hours?: boolean | null
          work_description?: string | null
          work_time_arrangement?: string | null
          working_hours_per_day?: number | null
          working_hours_per_week?: number | null
          workplace_address?: string | null
        }
        Update: {
          break_duration_minutes?: number | null
          client_company_name?: string | null
          client_company_org_number?: string | null
          collective_agreement_name?: string | null
          collective_agreement_parties?: string | null
          company_id?: string
          contract_file_path?: string | null
          contract_type?: string
          created_at?: string
          employee_id?: string
          employee_signature?: string | null
          employer_signature?: string | null
          employment_percentage?: number
          end_date?: string | null
          has_collective_agreement?: boolean | null
          has_multiple_workplaces?: boolean | null
          holiday_pay_percentage?: number | null
          id?: string
          insurance_provisions?: string | null
          is_staffing_agency?: boolean | null
          notes?: string | null
          notice_period_employee_months?: number | null
          notice_period_employer_months?: number | null
          other_allowances?: string | null
          overtime_compensation?: string | null
          payment_day?: number | null
          payment_method?: string | null
          pension_scheme?: string | null
          position?: string
          probation_period_months?: number | null
          remote_work_allowed?: boolean | null
          remote_work_details?: string | null
          salary_amount?: number | null
          salary_type?: string | null
          shift_change_rules?: string | null
          sick_pay_rules?: string | null
          signed_by_employee?: boolean | null
          signed_by_employer?: boolean | null
          signed_date?: string | null
          special_work_time_details?: string | null
          special_work_time_exemptions?: boolean | null
          start_date?: string
          status?: string
          temporary_reason?: string | null
          termination_procedures?: string | null
          training_provisions?: string | null
          updated_at?: string
          vacation_days?: number | null
          vacation_rules?: string | null
          variable_hours_description?: string | null
          variable_working_hours?: boolean | null
          work_description?: string | null
          work_time_arrangement?: string | null
          working_hours_per_day?: number | null
          working_hours_per_week?: number | null
          workplace_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employment_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_exposure_assessments: {
        Row: {
          assessed_by_id: string | null
          assessed_by_name: string | null
          company_id: string
          created_at: string
          department_id: string | null
          id: string
          noise_lex8h: number | null
          noise_zone: string | null
          notes: string | null
          peak_noise_level: number | null
          status: string
          title: string
          tools: Json
          updated_at: string
          vibration_a8: number | null
          vibration_type: string
          vibration_zone: string | null
        }
        Insert: {
          assessed_by_id?: string | null
          assessed_by_name?: string | null
          company_id: string
          created_at?: string
          department_id?: string | null
          id?: string
          noise_lex8h?: number | null
          noise_zone?: string | null
          notes?: string | null
          peak_noise_level?: number | null
          status?: string
          title?: string
          tools?: Json
          updated_at?: string
          vibration_a8?: number | null
          vibration_type?: string
          vibration_zone?: string | null
        }
        Update: {
          assessed_by_id?: string | null
          assessed_by_name?: string | null
          company_id?: string
          created_at?: string
          department_id?: string | null
          id?: string
          noise_lex8h?: number | null
          noise_zone?: string | null
          notes?: string | null
          peak_noise_level?: number | null
          status?: string
          title?: string
          tools?: Json
          updated_at?: string
          vibration_a8?: number | null
          vibration_type?: string
          vibration_zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_exposure_assessments_assessed_by_id_fkey"
            columns: ["assessed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_exposure_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_exposure_assessments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ergonomic_risk_assessments: {
        Row: {
          assessed_at: string | null
          assessed_by_id: string | null
          assessed_by_name: string | null
          assessment_type: string[]
          company_id: string
          conclusion: string | null
          consequence_severity: number | null
          created_at: string
          department_id: string | null
          description: string | null
          equipment: string[] | null
          existing_measures: Json | null
          exposed_workers_count: number | null
          exposure_duration: string | null
          exposure_frequency: string | null
          follow_up_date: string | null
          health_monitoring_details: string | null
          health_monitoring_required: boolean | null
          id: string
          implemented_measures: Json | null
          job_role: string | null
          noise_exposure_time: number | null
          noise_level: number | null
          noise_peak_level: number | null
          noise_sources: Json | null
          planned_measures: Json | null
          probability: number | null
          project_id: string | null
          recommendations: string | null
          required_ppe: Json | null
          risk_factors: Json | null
          risk_level: string | null
          risk_score: number | null
          status: string
          title: string
          updated_at: string
          vibration_equipment: Json | null
          vibration_exposure_time: number | null
          vibration_level: number | null
          vibration_type: string | null
          work_area: string | null
        }
        Insert: {
          assessed_at?: string | null
          assessed_by_id?: string | null
          assessed_by_name?: string | null
          assessment_type: string[]
          company_id: string
          conclusion?: string | null
          consequence_severity?: number | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          equipment?: string[] | null
          existing_measures?: Json | null
          exposed_workers_count?: number | null
          exposure_duration?: string | null
          exposure_frequency?: string | null
          follow_up_date?: string | null
          health_monitoring_details?: string | null
          health_monitoring_required?: boolean | null
          id?: string
          implemented_measures?: Json | null
          job_role?: string | null
          noise_exposure_time?: number | null
          noise_level?: number | null
          noise_peak_level?: number | null
          noise_sources?: Json | null
          planned_measures?: Json | null
          probability?: number | null
          project_id?: string | null
          recommendations?: string | null
          required_ppe?: Json | null
          risk_factors?: Json | null
          risk_level?: string | null
          risk_score?: number | null
          status?: string
          title: string
          updated_at?: string
          vibration_equipment?: Json | null
          vibration_exposure_time?: number | null
          vibration_level?: number | null
          vibration_type?: string | null
          work_area?: string | null
        }
        Update: {
          assessed_at?: string | null
          assessed_by_id?: string | null
          assessed_by_name?: string | null
          assessment_type?: string[]
          company_id?: string
          conclusion?: string | null
          consequence_severity?: number | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          equipment?: string[] | null
          existing_measures?: Json | null
          exposed_workers_count?: number | null
          exposure_duration?: string | null
          exposure_frequency?: string | null
          follow_up_date?: string | null
          health_monitoring_details?: string | null
          health_monitoring_required?: boolean | null
          id?: string
          implemented_measures?: Json | null
          job_role?: string | null
          noise_exposure_time?: number | null
          noise_level?: number | null
          noise_peak_level?: number | null
          noise_sources?: Json | null
          planned_measures?: Json | null
          probability?: number | null
          project_id?: string | null
          recommendations?: string | null
          required_ppe?: Json | null
          risk_factors?: Json | null
          risk_level?: string | null
          risk_score?: number | null
          status?: string
          title?: string
          updated_at?: string
          vibration_equipment?: Json | null
          vibration_exposure_time?: number | null
          vibration_level?: number | null
          vibration_type?: string | null
          work_area?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ergonomic_risk_assessments_assessed_by_id_fkey"
            columns: ["assessed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ergonomic_risk_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ergonomic_risk_assessments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ergonomic_risk_assessments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fdv_building_roles: {
        Row: {
          building_id: string
          company_id: string
          created_at: string
          email: string | null
          external_actor: string | null
          id: string
          notes: string | null
          person_name: string | null
          phone: string | null
          profile_id: string | null
          role_type: string
          updated_at: string
        }
        Insert: {
          building_id: string
          company_id: string
          created_at?: string
          email?: string | null
          external_actor?: string | null
          id?: string
          notes?: string | null
          person_name?: string | null
          phone?: string | null
          profile_id?: string | null
          role_type: string
          updated_at?: string
        }
        Update: {
          building_id?: string
          company_id?: string
          created_at?: string
          email?: string | null
          external_actor?: string | null
          id?: string
          notes?: string | null
          person_name?: string | null
          phone?: string | null
          profile_id?: string | null
          role_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fdv_building_roles_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "fdv_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_building_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_building_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fdv_buildings: {
        Row: {
          address: string | null
          area_sqm: number | null
          building_type: string
          city: string | null
          company_id: string
          created_at: string
          external_contact_email: string | null
          external_contact_name: string | null
          external_contact_phone: string | null
          floors: number | null
          id: string
          image_url: string | null
          internal_contact_email: string | null
          internal_contact_name: string | null
          internal_contact_phone: string | null
          name: string
          notes: string | null
          owner_type: string
          postal_code: string | null
          status: string
          updated_at: string
          usage_type: string
        }
        Insert: {
          address?: string | null
          area_sqm?: number | null
          building_type?: string
          city?: string | null
          company_id: string
          created_at?: string
          external_contact_email?: string | null
          external_contact_name?: string | null
          external_contact_phone?: string | null
          floors?: number | null
          id?: string
          image_url?: string | null
          internal_contact_email?: string | null
          internal_contact_name?: string | null
          internal_contact_phone?: string | null
          name: string
          notes?: string | null
          owner_type?: string
          postal_code?: string | null
          status?: string
          updated_at?: string
          usage_type?: string
        }
        Update: {
          address?: string | null
          area_sqm?: number | null
          building_type?: string
          city?: string | null
          company_id?: string
          created_at?: string
          external_contact_email?: string | null
          external_contact_name?: string | null
          external_contact_phone?: string | null
          floors?: number | null
          id?: string
          image_url?: string | null
          internal_contact_email?: string | null
          internal_contact_name?: string | null
          internal_contact_phone?: string | null
          name?: string
          notes?: string | null
          owner_type?: string
          postal_code?: string | null
          status?: string
          updated_at?: string
          usage_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fdv_buildings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fdv_control_logs: {
        Row: {
          building_id: string
          company_id: string
          completed_at: string
          completed_by_id: string | null
          completed_by_name: string
          control_id: string
          created_at: string
          documentation_path: string | null
          findings: string | null
          id: string
          next_due_date: string | null
          notes: string | null
          status: string
        }
        Insert: {
          building_id: string
          company_id: string
          completed_at?: string
          completed_by_id?: string | null
          completed_by_name: string
          control_id: string
          created_at?: string
          documentation_path?: string | null
          findings?: string | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          status: string
        }
        Update: {
          building_id?: string
          company_id?: string
          completed_at?: string
          completed_by_id?: string | null
          completed_by_name?: string
          control_id?: string
          created_at?: string
          documentation_path?: string | null
          findings?: string | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fdv_control_logs_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "fdv_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_control_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_control_logs_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_control_logs_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "fdv_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      fdv_controls: {
        Row: {
          building_id: string
          company_id: string
          control_type: string
          created_at: string
          description: string | null
          documentation_path: string | null
          id: string
          interval_months: number
          last_completed_by_id: string | null
          last_completed_by_name: string | null
          last_completed_date: string | null
          name: string
          next_due_date: string | null
          notes: string | null
          reminder_days_before: number | null
          reminder_enabled: boolean | null
          responsible_id: string | null
          responsible_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          building_id: string
          company_id: string
          control_type: string
          created_at?: string
          description?: string | null
          documentation_path?: string | null
          id?: string
          interval_months?: number
          last_completed_by_id?: string | null
          last_completed_by_name?: string | null
          last_completed_date?: string | null
          name: string
          next_due_date?: string | null
          notes?: string | null
          reminder_days_before?: number | null
          reminder_enabled?: boolean | null
          responsible_id?: string | null
          responsible_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          building_id?: string
          company_id?: string
          control_type?: string
          created_at?: string
          description?: string | null
          documentation_path?: string | null
          id?: string
          interval_months?: number
          last_completed_by_id?: string | null
          last_completed_by_name?: string | null
          last_completed_date?: string | null
          name?: string
          next_due_date?: string | null
          notes?: string | null
          reminder_days_before?: number | null
          reminder_enabled?: boolean | null
          responsible_id?: string | null
          responsible_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fdv_controls_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "fdv_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_controls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_controls_last_completed_by_id_fkey"
            columns: ["last_completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_controls_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fdv_documents: {
        Row: {
          building_id: string | null
          category: string
          company_id: string
          created_at: string
          description: string | null
          document_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          updated_at: string
          uploaded_by_id: string | null
          uploaded_by_name: string
          valid_from: string | null
          valid_to: string | null
          version: string | null
        }
        Insert: {
          building_id?: string | null
          category: string
          company_id: string
          created_at?: string
          description?: string | null
          document_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          updated_at?: string
          uploaded_by_id?: string | null
          uploaded_by_name: string
          valid_from?: string | null
          valid_to?: string | null
          version?: string | null
        }
        Update: {
          building_id?: string | null
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          document_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          updated_at?: string
          uploaded_by_id?: string | null
          uploaded_by_name?: string
          valid_from?: string | null
          valid_to?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fdv_documents_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "fdv_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_documents_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fdv_floor_plans: {
        Row: {
          building_id: string
          company_id: string
          created_at: string
          created_by_name: string
          elements_json: string | null
          floor_name: string
          id: string
          image_url: string | null
          updated_at: string
        }
        Insert: {
          building_id: string
          company_id: string
          created_at?: string
          created_by_name: string
          elements_json?: string | null
          floor_name?: string
          id?: string
          image_url?: string | null
          updated_at?: string
        }
        Update: {
          building_id?: string
          company_id?: string
          created_at?: string
          created_by_name?: string
          elements_json?: string | null
          floor_name?: string
          id?: string
          image_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fdv_floor_plans_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "fdv_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_floor_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fdv_risk_assessments: {
        Row: {
          actions: Json | null
          assessed_at: string | null
          assessed_by_id: string | null
          assessed_by_name: string | null
          building_id: string
          category: string
          company_id: string
          consequence: number
          created_at: string
          existing_measures: string | null
          hazard_description: string
          id: string
          notes: string | null
          probability: number
          responsible_id: string | null
          responsible_name: string | null
          revision_date: string | null
          risk_score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          assessed_at?: string | null
          assessed_by_id?: string | null
          assessed_by_name?: string | null
          building_id: string
          category: string
          company_id: string
          consequence: number
          created_at?: string
          existing_measures?: string | null
          hazard_description: string
          id?: string
          notes?: string | null
          probability: number
          responsible_id?: string | null
          responsible_name?: string | null
          revision_date?: string | null
          risk_score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          assessed_at?: string | null
          assessed_by_id?: string | null
          assessed_by_name?: string | null
          building_id?: string
          category?: string
          company_id?: string
          consequence?: number
          created_at?: string
          existing_measures?: string | null
          hazard_description?: string
          id?: string
          notes?: string | null
          probability?: number
          responsible_id?: string | null
          responsible_name?: string | null
          revision_date?: string | null
          risk_score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fdv_risk_assessments_assessed_by_id_fkey"
            columns: ["assessed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_risk_assessments_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "fdv_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_risk_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fdv_risk_assessments_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_checklist_responses: {
        Row: {
          checklist_type: string
          company_id: string
          completed_at: string | null
          completed_by_id: string | null
          completed_by_name: string
          created_at: string | null
          department_id: string | null
          id: string
          notes: string | null
          responses: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          checklist_type: string
          company_id: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name: string
          created_at?: string | null
          department_id?: string | null
          id?: string
          notes?: string | null
          responses?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          checklist_type?: string
          company_id?: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string
          created_at?: string | null
          department_id?: string | null
          id?: string
          notes?: string | null
          responses?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gdpr_checklist_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gdpr_checklist_responses_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gdpr_checklist_responses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_documentation: {
        Row: {
          company_id: string
          content: string | null
          created_at: string | null
          department_id: string | null
          documentation_type: string
          id: string
          last_reviewed: string | null
          next_review_date: string | null
          responsible_person: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          content?: string | null
          created_at?: string | null
          department_id?: string | null
          documentation_type: string
          id?: string
          last_reviewed?: string | null
          next_review_date?: string | null
          responsible_person?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          content?: string | null
          created_at?: string | null
          department_id?: string | null
          documentation_type?: string
          id?: string
          last_reviewed?: string | null
          next_review_date?: string | null
          responsible_person?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gdpr_documentation_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gdpr_documentation_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      global_chemical_sds_versions: {
        Row: {
          file_name: string | null
          file_size: number | null
          global_chemical_id: string
          id: string
          is_current: boolean | null
          notes: string | null
          sds_file_path: string
          uploaded_at: string
          version_number: number
        }
        Insert: {
          file_name?: string | null
          file_size?: number | null
          global_chemical_id: string
          id?: string
          is_current?: boolean | null
          notes?: string | null
          sds_file_path: string
          uploaded_at?: string
          version_number?: number
        }
        Update: {
          file_name?: string | null
          file_size?: number | null
          global_chemical_id?: string
          id?: string
          is_current?: boolean | null
          notes?: string | null
          sds_file_path?: string
          uploaded_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "global_chemical_sds_versions_global_chemical_id_fkey"
            columns: ["global_chemical_id"]
            isOneToOne: false
            referencedRelation: "global_chemicals"
            referencedColumns: ["id"]
          },
        ]
      }
      global_chemicals: {
        Row: {
          cas_number: string | null
          created_at: string
          danger_classes: string[] | null
          id: string
          manufacturer: string | null
          notes: string | null
          product_name: string
          search_vector: unknown
          updated_at: string
        }
        Insert: {
          cas_number?: string | null
          created_at?: string
          danger_classes?: string[] | null
          id?: string
          manufacturer?: string | null
          notes?: string | null
          product_name: string
          search_vector?: unknown
          updated_at?: string
        }
        Update: {
          cas_number?: string | null
          created_at?: string
          danger_classes?: string[] | null
          id?: string
          manufacturer?: string | null
          notes?: string | null
          product_name?: string
          search_vector?: unknown
          updated_at?: string
        }
        Relationships: []
      }
      hms_card_requests: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          requested_by: string | null
          requested_by_name: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          requested_by?: string | null
          requested_by_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          requested_by?: string | null
          requested_by_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_card_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_card_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_card_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_forsvarlighetsvurderinger: {
        Row: {
          assessment_date: string
          assessment_number: string
          assessment_type: string
          company_id: string
          conclusion: string
          conclusion_justification: string | null
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          department_id: string | null
          description: string | null
          employer_name: string
          employer_signature: string | null
          employer_signed_at: string | null
          employer_title: string | null
          fatigue_assessment: string | null
          id: string
          next_review_date: string | null
          other_participants: string | null
          proposed_training_hours: number | null
          required_measures: Json | null
          review_frequency: string | null
          risk_factors: Json | null
          risk_justification: string | null
          risk_level: string | null
          status: string
          tillitsvalgt_name: string | null
          tillitsvalgt_signature: string | null
          tillitsvalgt_signed_at: string | null
          title: string
          training_justification: string | null
          training_topics: Json | null
          updated_at: string
          verneombud_name: string | null
          verneombud_signature: string | null
          verneombud_signed_at: string | null
          work_life_balance_assessment: string | null
          work_schedule_description: string | null
        }
        Insert: {
          assessment_date?: string
          assessment_number: string
          assessment_type: string
          company_id: string
          conclusion: string
          conclusion_justification?: string | null
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          department_id?: string | null
          description?: string | null
          employer_name: string
          employer_signature?: string | null
          employer_signed_at?: string | null
          employer_title?: string | null
          fatigue_assessment?: string | null
          id?: string
          next_review_date?: string | null
          other_participants?: string | null
          proposed_training_hours?: number | null
          required_measures?: Json | null
          review_frequency?: string | null
          risk_factors?: Json | null
          risk_justification?: string | null
          risk_level?: string | null
          status?: string
          tillitsvalgt_name?: string | null
          tillitsvalgt_signature?: string | null
          tillitsvalgt_signed_at?: string | null
          title: string
          training_justification?: string | null
          training_topics?: Json | null
          updated_at?: string
          verneombud_name?: string | null
          verneombud_signature?: string | null
          verneombud_signed_at?: string | null
          work_life_balance_assessment?: string | null
          work_schedule_description?: string | null
        }
        Update: {
          assessment_date?: string
          assessment_number?: string
          assessment_type?: string
          company_id?: string
          conclusion?: string
          conclusion_justification?: string | null
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          department_id?: string | null
          description?: string | null
          employer_name?: string
          employer_signature?: string | null
          employer_signed_at?: string | null
          employer_title?: string | null
          fatigue_assessment?: string | null
          id?: string
          next_review_date?: string | null
          other_participants?: string | null
          proposed_training_hours?: number | null
          required_measures?: Json | null
          review_frequency?: string | null
          risk_factors?: Json | null
          risk_justification?: string | null
          risk_level?: string | null
          status?: string
          tillitsvalgt_name?: string | null
          tillitsvalgt_signature?: string | null
          tillitsvalgt_signed_at?: string | null
          title?: string
          training_justification?: string | null
          training_topics?: Json | null
          updated_at?: string
          verneombud_name?: string | null
          verneombud_signature?: string | null
          verneombud_signed_at?: string | null
          work_life_balance_assessment?: string | null
          work_schedule_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_forsvarlighetsvurderinger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_forsvarlighetsvurderinger_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_forsvarlighetsvurderinger_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_self_declarations: {
        Row: {
          city: string | null
          company_address: string | null
          company_id: string
          company_name: string
          country: string | null
          created_at: string
          declaration_date: string
          department_id: string | null
          employee_rep_name: string | null
          employee_rep_signature: string | null
          employee_rep_signed_at: string | null
          id: string
          manager_name: string | null
          manager_signature: string | null
          manager_signed_at: string | null
          postal_code: string | null
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          company_address?: string | null
          company_id: string
          company_name: string
          country?: string | null
          created_at?: string
          declaration_date?: string
          department_id?: string | null
          employee_rep_name?: string | null
          employee_rep_signature?: string | null
          employee_rep_signed_at?: string | null
          id?: string
          manager_name?: string | null
          manager_signature?: string | null
          manager_signed_at?: string | null
          postal_code?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          company_address?: string | null
          company_id?: string
          company_name?: string
          country?: string | null
          created_at?: string
          declaration_date?: string
          department_id?: string | null
          employee_rep_name?: string | null
          employee_rep_signature?: string | null
          employee_rep_signed_at?: string | null
          id?: string
          manager_name?: string | null
          manager_signature?: string | null
          manager_signed_at?: string | null
          postal_code?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_self_declarations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_self_declarations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_sja: {
        Row: {
          company_id: string
          completed_at: string | null
          completed_by_id: string | null
          completed_by_name: string | null
          created_at: string
          department_id: string | null
          description: string | null
          emergency_procedures: string | null
          id: string
          leader_signature: string | null
          location: string | null
          measures: Json | null
          participants: string | null
          participants_signatures: Json | null
          planned_date: string | null
          ppe_required: string | null
          responsible_id: string | null
          responsible_name: string | null
          risk_level: string | null
          risks: Json | null
          sja_number: string
          status: string
          title: string
          updated_at: string
          work_description: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          emergency_procedures?: string | null
          id?: string
          leader_signature?: string | null
          location?: string | null
          measures?: Json | null
          participants?: string | null
          participants_signatures?: Json | null
          planned_date?: string | null
          ppe_required?: string | null
          responsible_id?: string | null
          responsible_name?: string | null
          risk_level?: string | null
          risks?: Json | null
          sja_number: string
          status?: string
          title: string
          updated_at?: string
          work_description?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          emergency_procedures?: string | null
          id?: string
          leader_signature?: string | null
          location?: string | null
          measures?: Json | null
          participants?: string | null
          participants_signatures?: Json | null
          planned_date?: string | null
          ppe_required?: string | null
          responsible_id?: string | null
          responsible_name?: string | null
          risk_level?: string | null
          risks?: Json | null
          sja_number?: string
          status?: string
          title?: string
          updated_at?: string
          work_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hms_sja_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_sja_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_sja_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_sja_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hms_vernerunde_templates: {
        Row: {
          checkpoints: Json
          company_id: string | null
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean
          is_system_template: boolean
          template_name: string
          updated_at: string
        }
        Insert: {
          checkpoints?: Json
          company_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_template?: boolean
          template_name: string
          updated_at?: string
        }
        Update: {
          checkpoints?: Json
          company_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_template?: boolean
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hms_vernerunde_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hms_vernerunde_templates_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_meeting_responses: {
        Row: {
          answer_json: Json | null
          answer_rating: number | null
          answer_text: string | null
          created_at: string
          id: string
          meeting_id: string
          question_id: string
        }
        Insert: {
          answer_json?: Json | null
          answer_rating?: number | null
          answer_text?: string | null
          created_at?: string
          id?: string
          meeting_id: string
          question_id: string
        }
        Update: {
          answer_json?: Json | null
          answer_rating?: number | null
          answer_text?: string | null
          created_at?: string
          id?: string
          meeting_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_meeting_responses_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "hr_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_meeting_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "hr_meeting_template_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_meeting_template_questions: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          options: Json | null
          question_text: string
          question_type: string
          sort_order: number
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          question_text: string
          question_type?: string
          sort_order?: number
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          question_text?: string
          question_type?: string
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_meeting_template_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "hr_meeting_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_meeting_templates: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          meeting_type: string
          template_name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          meeting_type?: string
          template_name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          meeting_type?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_meeting_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_meeting_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_meetings: {
        Row: {
          company_id: string
          completed_at: string | null
          completed_by_id: string | null
          created_at: string
          created_by: string | null
          employee_id: string | null
          employee_name: string
          id: string
          location: string | null
          meeting_type: string
          notes: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          completed_by_id?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          employee_name: string
          id?: string
          location?: string | null
          meeting_type?: string
          notes?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          completed_by_id?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          employee_name?: string
          id?: string
          location?: string | null
          meeting_type?: string
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_meetings_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_meetings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_meetings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "hr_meeting_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_attachments: {
        Row: {
          category: string
          company_id: string
          created_at: string
          document_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_by_id: string | null
          uploaded_by_name: string | null
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          document_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by_id?: string | null
          uploaded_by_name?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          document_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by_id?: string | null
          uploaded_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_attachments_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_compliance_checklist: {
        Row: {
          category: string
          company_id: string
          created_at: string
          evidence_description: string | null
          evidence_link: string | null
          fulfilled_at: string | null
          fulfilled_by_id: string | null
          fulfilled_by_name: string | null
          id: string
          is_fulfilled: boolean | null
          notes: string | null
          requirement_key: string
          requirement_text: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          company_id: string
          created_at?: string
          evidence_description?: string | null
          evidence_link?: string | null
          fulfilled_at?: string | null
          fulfilled_by_id?: string | null
          fulfilled_by_name?: string | null
          id?: string
          is_fulfilled?: boolean | null
          notes?: string | null
          requirement_key: string
          requirement_text: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          evidence_description?: string | null
          evidence_link?: string | null
          fulfilled_at?: string | null
          fulfilled_by_id?: string | null
          fulfilled_by_name?: string | null
          id?: string
          is_fulfilled?: boolean | null
          notes?: string | null
          requirement_key?: string
          requirement_text?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_compliance_checklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_compliance_checklist_fulfilled_by_id_fkey"
            columns: ["fulfilled_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_compliance_items: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          is_template: boolean | null
          points: number
          recommended_focus: string | null
          rule_reference: string
          sort_order: number | null
          updated_at: string
          violation_description: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          points?: number
          recommended_focus?: string | null
          rule_reference: string
          sort_order?: number | null
          updated_at?: string
          violation_description: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          points?: number
          recommended_focus?: string | null
          rule_reference?: string
          sort_order?: number | null
          updated_at?: string
          violation_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_compliance_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_controls: {
        Row: {
          checklist_items: Json
          company_id: string
          completed_by_id: string | null
          completed_by_name: string | null
          control_category: string
          control_date: string
          control_type: string
          created_at: string
          id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          checklist_items?: Json
          company_id: string
          completed_by_id?: string | null
          completed_by_name?: string | null
          control_category: string
          control_date?: string
          control_type: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          checklist_items?: Json
          company_id?: string
          completed_by_id?: string | null
          completed_by_name?: string | null
          control_category?: string
          control_date?: string
          control_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_controls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_controls_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_goals: {
        Row: {
          actions: string[] | null
          company_id: string
          created_at: string
          deadline: string | null
          description: string | null
          goal_text: string
          id: string
          is_predefined: boolean | null
          kpi_current: string | null
          kpi_metric: string | null
          kpi_target: string | null
          period: string | null
          responsible_id: string | null
          responsible_name: string | null
          sort_order: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          actions?: string[] | null
          company_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          goal_text: string
          id?: string
          is_predefined?: boolean | null
          kpi_current?: string | null
          kpi_metric?: string | null
          kpi_target?: string | null
          period?: string | null
          responsible_id?: string | null
          responsible_name?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          actions?: string[] | null
          company_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          goal_text?: string
          id?: string
          is_predefined?: boolean | null
          kpi_current?: string | null
          kpi_metric?: string | null
          kpi_target?: string | null
          period?: string | null
          responsible_id?: string | null
          responsible_name?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_goals_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_incidents: {
        Row: {
          company_id: string
          compliance_item_id: string | null
          created_at: string
          description: string
          handling: string | null
          id: string
          incident_date: string
          incident_number: string
          incident_time: string | null
          incident_type: string
          involved_parties: string | null
          learning_improvement: string | null
          license_id: string | null
          reported_by_id: string | null
          reported_by_name: string | null
          severity: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          compliance_item_id?: string | null
          created_at?: string
          description: string
          handling?: string | null
          id?: string
          incident_date: string
          incident_number: string
          incident_time?: string | null
          incident_type: string
          involved_parties?: string | null
          learning_improvement?: string | null
          license_id?: string | null
          reported_by_id?: string | null
          reported_by_name?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          compliance_item_id?: string | null
          created_at?: string
          description?: string
          handling?: string | null
          id?: string
          incident_date?: string
          incident_number?: string
          incident_time?: string | null
          incident_type?: string
          involved_parties?: string | null
          learning_improvement?: string | null
          license_id?: string | null
          reported_by_id?: string | null
          reported_by_name?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_incidents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_incidents_compliance_item_id_fkey"
            columns: ["compliance_item_id"]
            isOneToOne: false
            referencedRelation: "ik_alkohol_compliance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_incidents_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "ik_alkohol_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_incidents_reported_by_id_fkey"
            columns: ["reported_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_licenses: {
        Row: {
          company_id: string
          concept_category: string | null
          created_at: string
          deputy_email: string | null
          deputy_name: string | null
          deputy_phone: string | null
          id: string
          is_active: boolean | null
          license_number: string | null
          license_type: string
          manager_email: string | null
          manager_name: string | null
          manager_phone: string | null
          municipality: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          company_id: string
          concept_category?: string | null
          created_at?: string
          deputy_email?: string | null
          deputy_name?: string | null
          deputy_phone?: string | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          license_type?: string
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          municipality: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          company_id?: string
          concept_category?: string | null
          created_at?: string
          deputy_email?: string | null
          deputy_name?: string | null
          deputy_phone?: string | null
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          license_type?: string
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          municipality?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_licenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_lovverk: {
        Row: {
          category: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          municipality: string | null
          sort_order: number | null
          source: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category?: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          municipality?: string | null
          sort_order?: number | null
          source?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          municipality?: string | null
          sort_order?: number | null
          source?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_lovverk_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_organization: {
        Row: {
          company_id: string
          confirmed_at: string | null
          confirmed_signature: string | null
          created_at: string
          email: string | null
          employee_name: string
          id: string
          is_active: boolean | null
          license_id: string | null
          phone: string | null
          responsibilities: string[] | null
          role_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          confirmed_at?: string | null
          confirmed_signature?: string | null
          created_at?: string
          email?: string | null
          employee_name: string
          id?: string
          is_active?: boolean | null
          license_id?: string | null
          phone?: string | null
          responsibilities?: string[] | null
          role_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          confirmed_at?: string | null
          confirmed_signature?: string | null
          created_at?: string
          email?: string | null
          employee_name?: string
          id?: string
          is_active?: boolean | null
          license_id?: string | null
          phone?: string | null
          responsibilities?: string[] | null
          role_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_organization_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_organization_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "ik_alkohol_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_organization_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_reviews: {
        Row: {
          agenda_points: Json | null
          company_id: string
          completed_date: string | null
          created_at: string
          id: string
          license_id: string | null
          participants: string | null
          planned_date: string
          reminder_sent: boolean | null
          review_type: string
          status: string | null
          summary: string | null
          tasks: Json | null
          updated_at: string
        }
        Insert: {
          agenda_points?: Json | null
          company_id: string
          completed_date?: string | null
          created_at?: string
          id?: string
          license_id?: string | null
          participants?: string | null
          planned_date: string
          reminder_sent?: boolean | null
          review_type: string
          status?: string | null
          summary?: string | null
          tasks?: Json | null
          updated_at?: string
        }
        Update: {
          agenda_points?: Json | null
          company_id?: string
          completed_date?: string | null
          created_at?: string
          id?: string
          license_id?: string | null
          participants?: string | null
          planned_date?: string
          reminder_sent?: boolean | null
          review_type?: string
          status?: string | null
          summary?: string | null
          tasks?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_reviews_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "ik_alkohol_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_risk_control_history: {
        Row: {
          change_type: string
          changed_by_id: string | null
          changed_by_name: string | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          risk_control_id: string
        }
        Insert: {
          change_type: string
          changed_by_id?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          risk_control_id: string
        }
        Update: {
          change_type?: string
          changed_by_id?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          risk_control_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_risk_control_history_changed_by_id_fkey"
            columns: ["changed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_risk_control_history_risk_control_id_fkey"
            columns: ["risk_control_id"]
            isOneToOne: false
            referencedRelation: "ik_alkohol_risk_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_risk_controls: {
        Row: {
          challenges: string | null
          company_id: string
          compliance_item_id: string | null
          created_at: string
          deadline_period: string | null
          id: string
          license_id: string | null
          preventive_measures: string | null
          responsible_role: string | null
          status: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          challenges?: string | null
          company_id: string
          compliance_item_id?: string | null
          created_at?: string
          deadline_period?: string | null
          id?: string
          license_id?: string | null
          preventive_measures?: string | null
          responsible_role?: string | null
          status?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          challenges?: string | null
          company_id?: string
          compliance_item_id?: string | null
          created_at?: string
          deadline_period?: string | null
          id?: string
          license_id?: string | null
          preventive_measures?: string | null
          responsible_role?: string | null
          status?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_risk_controls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_risk_controls_compliance_item_id_fkey"
            columns: ["compliance_item_id"]
            isOneToOne: false
            referencedRelation: "ik_alkohol_compliance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_risk_controls_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "ik_alkohol_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_risks: {
        Row: {
          company_id: string
          consequence: number
          created_at: string
          existing_controls: string | null
          id: string
          is_risk_period: boolean | null
          last_reviewed_at: string | null
          measure_deadline: string | null
          measure_responsible_id: string | null
          measure_responsible_name: string | null
          measure_status: string | null
          penalty_points: number | null
          planned_measures: string[] | null
          probability: number
          residual_consequence: number | null
          residual_probability: number | null
          risk_area: string
          risk_description: string
          risk_level: string | null
          risk_period_days: string[] | null
          risk_period_times: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          consequence: number
          created_at?: string
          existing_controls?: string | null
          id?: string
          is_risk_period?: boolean | null
          last_reviewed_at?: string | null
          measure_deadline?: string | null
          measure_responsible_id?: string | null
          measure_responsible_name?: string | null
          measure_status?: string | null
          penalty_points?: number | null
          planned_measures?: string[] | null
          probability: number
          residual_consequence?: number | null
          residual_probability?: number | null
          risk_area: string
          risk_description: string
          risk_level?: string | null
          risk_period_days?: string[] | null
          risk_period_times?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          consequence?: number
          created_at?: string
          existing_controls?: string | null
          id?: string
          is_risk_period?: boolean | null
          last_reviewed_at?: string | null
          measure_deadline?: string | null
          measure_responsible_id?: string | null
          measure_responsible_name?: string | null
          measure_status?: string | null
          penalty_points?: number | null
          planned_measures?: string[] | null
          probability?: number
          residual_consequence?: number | null
          residual_probability?: number | null
          risk_area?: string
          risk_description?: string
          risk_level?: string | null
          risk_period_days?: string[] | null
          risk_period_times?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_risks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_risks_measure_responsible_id_fkey"
            columns: ["measure_responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_routines: {
        Row: {
          category: string
          company_id: string
          content: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          last_reviewed_at: string | null
          reviewed_by_id: string | null
          reviewed_by_name: string | null
          routine_name: string
          sort_order: number | null
          updated_at: string
          venue_type: string | null
        }
        Insert: {
          category: string
          company_id: string
          content: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          last_reviewed_at?: string | null
          reviewed_by_id?: string | null
          reviewed_by_name?: string | null
          routine_name: string
          sort_order?: number | null
          updated_at?: string
          venue_type?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          last_reviewed_at?: string | null
          reviewed_by_id?: string | null
          reviewed_by_name?: string | null
          routine_name?: string
          sort_order?: number | null
          updated_at?: string
          venue_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_routines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_routines_reviewed_by_id_fkey"
            columns: ["reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_shift_responsibilities: {
        Row: {
          company_id: string
          created_at: string
          id: string
          notes: string | null
          shift_date: string
          shift_time: string | null
          stedfortreder_id: string | null
          stedfortreder_name: string | null
          styrer_id: string | null
          styrer_name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          shift_date: string
          shift_time?: string | null
          stedfortreder_id?: string | null
          stedfortreder_name?: string | null
          styrer_id?: string | null
          styrer_name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          shift_date?: string
          shift_time?: string | null
          stedfortreder_id?: string | null
          stedfortreder_name?: string | null
          styrer_id?: string | null
          styrer_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_shift_responsibilities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_shift_responsibilities_stedfortreder_id_fkey"
            columns: ["stedfortreder_id"]
            isOneToOne: false
            referencedRelation: "ik_alkohol_organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_alkohol_shift_responsibilities_styrer_id_fkey"
            columns: ["styrer_id"]
            isOneToOne: false
            referencedRelation: "ik_alkohol_organization"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_training: {
        Row: {
          company_id: string
          completed_date: string | null
          created_at: string
          documentation_path: string | null
          employee_name: string
          expires_date: string | null
          id: string
          is_completed: boolean | null
          notes: string | null
          required_by: string | null
          role: string
          training_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_date?: string | null
          created_at?: string
          documentation_path?: string | null
          employee_name: string
          expires_date?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          required_by?: string | null
          role: string
          training_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_date?: string | null
          created_at?: string
          documentation_path?: string | null
          employee_name?: string
          expires_date?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          required_by?: string | null
          role?: string
          training_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_training_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_alkohol_training_records: {
        Row: {
          company_id: string
          created_at: string
          employee_name: string
          employee_user_id: string | null
          id: string
          signature_data: string | null
          signed_at: string | null
          signed_digitally: boolean
          training_description: string | null
          training_topic: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_name: string
          employee_user_id?: string | null
          id?: string
          signature_data?: string | null
          signed_at?: string | null
          signed_digitally?: boolean
          training_description?: string | null
          training_topic?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_name?: string
          employee_user_id?: string | null
          id?: string
          signature_data?: string | null
          signed_at?: string | null
          signed_digitally?: boolean
          training_description?: string | null
          training_topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_alkohol_training_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_hms_company_documents: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          department_id: string | null
          description: string | null
          document_name: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          include_in_pdf: boolean | null
          original_document_id: string | null
          requires_signature: boolean | null
          updated_at: string
          upload_deadline_days: number | null
          uploaded_by: string | null
          uploaded_by_name: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          document_name: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          include_in_pdf?: boolean | null
          original_document_id?: string | null
          requires_signature?: boolean | null
          updated_at?: string
          upload_deadline_days?: number | null
          uploaded_by?: string | null
          uploaded_by_name: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          document_name?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          include_in_pdf?: boolean | null
          original_document_id?: string | null
          requires_signature?: boolean | null
          updated_at?: string
          upload_deadline_days?: number | null
          uploaded_by?: string | null
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_hms_company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_hms_company_documents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_hms_company_documents_original_document_id_fkey"
            columns: ["original_document_id"]
            isOneToOne: false
            referencedRelation: "ik_hms_company_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_hms_stoffkartotek: {
        Row: {
          company_id: string
          created_at: string
          danger_classes: string[] | null
          deleted_at: string | null
          deleted_by: string | null
          department_id: string | null
          id: string
          is_deleted: boolean
          last_updated: string
          location: string | null
          manufacturer: string | null
          notes: string | null
          product_name: string
          sds_file_path: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          danger_classes?: string[] | null
          deleted_at?: string | null
          deleted_by?: string | null
          department_id?: string | null
          id?: string
          is_deleted?: boolean
          last_updated?: string
          location?: string | null
          manufacturer?: string | null
          notes?: string | null
          product_name: string
          sds_file_path?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          danger_classes?: string[] | null
          deleted_at?: string | null
          deleted_by?: string | null
          department_id?: string | null
          id?: string
          is_deleted?: boolean
          last_updated?: string
          location?: string | null
          manufacturer?: string | null
          notes?: string | null
          product_name?: string
          sds_file_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_hms_stoffkartotek_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_hms_stoffkartotek_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_checklist_responses: {
        Row: {
          checklist_name: string
          checklist_type: string
          company_id: string
          completed_at: string | null
          completed_by_id: string | null
          completed_by_name: string
          created_at: string | null
          department_id: string | null
          id: string
          notes: string | null
          responses: Json
          status: string
          updated_at: string | null
        }
        Insert: {
          checklist_name: string
          checklist_type: string
          company_id: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name: string
          created_at?: string | null
          department_id?: string | null
          id?: string
          notes?: string | null
          responses?: Json
          status?: string
          updated_at?: string | null
        }
        Update: {
          checklist_name?: string
          checklist_type?: string
          company_id?: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string
          created_at?: string | null
          department_id?: string | null
          id?: string
          notes?: string | null
          responses?: Json
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_checklist_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_checklist_responses_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_checklist_responses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_cleaning_plan_responses: {
        Row: {
          cleaning_records: Json
          company_id: string
          completed_at: string | null
          completed_by_id: string | null
          completed_by_name: string
          created_at: string | null
          department_id: string | null
          frequency_type: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          cleaning_records?: Json
          company_id: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name: string
          created_at?: string | null
          department_id?: string | null
          frequency_type?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          cleaning_records?: Json
          company_id?: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string
          created_at?: string | null
          department_id?: string | null
          frequency_type?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_cleaning_plan_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_cleaning_plan_responses_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_cleaning_plan_responses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_custom_checklists: {
        Row: {
          checklist_name: string
          checklist_type: string
          checkpoints: Json
          company_id: string
          created_at: string | null
          department_id: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          checklist_name: string
          checklist_type?: string
          checkpoints?: Json
          company_id: string
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          checklist_name?: string
          checklist_type?: string
          checkpoints?: Json
          company_id?: string
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_custom_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_custom_checklists_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_custom_cleaning_tasks: {
        Row: {
          area: string
          company_id: string
          created_at: string | null
          department_id: string | null
          frequency: string
          id: string
          method: string
          responsible: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          area: string
          company_id: string
          created_at?: string | null
          department_id?: string | null
          frequency: string
          id?: string
          method: string
          responsible: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          area?: string
          company_id?: string
          created_at?: string | null
          department_id?: string | null
          frequency?: string
          id?: string
          method?: string
          responsible?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_custom_cleaning_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_custom_cleaning_tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_daily_round_completions: {
        Row: {
          company_id: string
          completed_at: string
          completed_by_id: string | null
          completed_by_name: string
          created_at: string
          department_id: string | null
          id: string
          round_id: string
          started_at: string
          station_results: Json
          status: string
        }
        Insert: {
          company_id: string
          completed_at?: string
          completed_by_id?: string | null
          completed_by_name: string
          created_at?: string
          department_id?: string | null
          id?: string
          round_id: string
          started_at?: string
          station_results?: Json
          status?: string
        }
        Update: {
          company_id?: string
          completed_at?: string
          completed_by_id?: string | null
          completed_by_name?: string
          created_at?: string
          department_id?: string | null
          id?: string
          round_id?: string
          started_at?: string
          station_results?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_daily_round_completions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_daily_round_completions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_daily_round_completions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "ik_mat_daily_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_daily_rounds: {
        Row: {
          company_id: string
          created_at: string
          created_by_id: string | null
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          stations: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by_id?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          stations?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by_id?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          stations?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_daily_rounds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_daily_rounds_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_daily_task_completions: {
        Row: {
          company_id: string
          completed_at: string
          completed_by_id: string | null
          completed_by_name: string
          completed_date: string
          department_id: string | null
          id: string
          notes: string | null
          task_type: string
        }
        Insert: {
          company_id: string
          completed_at?: string
          completed_by_id?: string | null
          completed_by_name: string
          completed_date?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          task_type: string
        }
        Update: {
          company_id?: string
          completed_at?: string
          completed_by_id?: string | null
          completed_by_name?: string
          completed_date?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_daily_task_completions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_daily_task_completions_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_daily_task_completions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_daily_task_settings: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          frequency: string
          id: string
          is_active: boolean
          notify_all_users: boolean
          notify_user_ids: string[] | null
          reminder_enabled: boolean
          reminder_time: string
          task_name: string
          task_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          notify_all_users?: boolean
          notify_user_ids?: string[] | null
          reminder_enabled?: boolean
          reminder_time?: string
          task_name: string
          task_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          notify_all_users?: boolean
          notify_user_ids?: string[] | null
          reminder_enabled?: boolean
          reminder_time?: string
          task_name?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_daily_task_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_daily_task_settings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_dismissed_auto_deviations: {
        Row: {
          company_id: string
          department_id: string | null
          deviation_title: string
          dismissed_at: string
          dismissed_by_id: string | null
          id: string
        }
        Insert: {
          company_id: string
          department_id?: string | null
          deviation_title: string
          dismissed_at?: string
          dismissed_by_id?: string | null
          id?: string
        }
        Update: {
          company_id?: string
          department_id?: string | null
          deviation_title?: string
          dismissed_at?: string
          dismissed_by_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_dismissed_auto_deviations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_dismissed_auto_deviations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_poster_catalog: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ik_mat_scheduled_tasks: {
        Row: {
          company_id: string
          created_at: string
          day_of_month: number[] | null
          day_of_week: number[] | null
          department_id: string | null
          description: string | null
          frequency: string
          id: string
          is_active: boolean
          responsible: string | null
          task_type: string
          time_of_day: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          day_of_month?: number[] | null
          day_of_week?: number[] | null
          department_id?: string | null
          description?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          responsible?: string | null
          task_type?: string
          time_of_day?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          day_of_month?: number[] | null
          day_of_week?: number[] | null
          department_id?: string | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          responsible?: string | null
          task_type?: string
          time_of_day?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_scheduled_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_scheduled_tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_suppliers: {
        Row: {
          company_id: string
          contact_person: string | null
          contract_document_path: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          department_id: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          service_type: string
          supplier_name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          contact_person?: string | null
          contract_document_path?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          service_type: string
          supplier_name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          contact_person?: string | null
          contract_document_path?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          service_type?: string
          supplier_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_suppliers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_task_completions: {
        Row: {
          company_id: string
          completed_at: string | null
          completed_by_id: string | null
          completed_by_name: string
          created_at: string
          department_id: string | null
          id: string
          notes: string | null
          scheduled_date: string
          status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name: string
          created_at?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          scheduled_date: string
          status?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string
          created_at?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string
          status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_task_completions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_task_completions_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_task_completions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ik_mat_scheduled_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_temperature_equipment: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          equipment_type: string
          id: string
          is_active: boolean
          location: string | null
          max_temp: number | null
          measurement_frequency: string
          min_temp: number | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          equipment_type?: string
          id?: string
          is_active?: boolean
          location?: string | null
          max_temp?: number | null
          measurement_frequency?: string
          min_temp?: number | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          equipment_type?: string
          id?: string
          is_active?: boolean
          location?: string | null
          max_temp?: number | null
          measurement_frequency?: string
          min_temp?: number | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_temperature_equipment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_temperature_equipment_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_temperature_logs: {
        Row: {
          company_id: string
          corrective_action: string | null
          corrective_action_by: string | null
          created_at: string
          department_id: string | null
          equipment_id: string
          id: string
          is_acceptable: boolean
          measured_at: string
          measured_by_id: string | null
          measured_by_name: string
          measurement_time: string | null
          notes: string | null
          temperature: number
        }
        Insert: {
          company_id: string
          corrective_action?: string | null
          corrective_action_by?: string | null
          created_at?: string
          department_id?: string | null
          equipment_id: string
          id?: string
          is_acceptable?: boolean
          measured_at?: string
          measured_by_id?: string | null
          measured_by_name: string
          measurement_time?: string | null
          notes?: string | null
          temperature: number
        }
        Update: {
          company_id?: string
          corrective_action?: string | null
          corrective_action_by?: string | null
          created_at?: string
          department_id?: string | null
          equipment_id?: string
          id?: string
          is_acceptable?: boolean
          measured_at?: string
          measured_by_id?: string | null
          measured_by_name?: string
          measurement_time?: string | null
          notes?: string | null
          temperature?: number
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_temperature_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_temperature_logs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_temperature_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "ik_mat_temperature_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_temperature_logs_measured_by_id_fkey"
            columns: ["measured_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ik_mat_traceability_records: {
        Row: {
          batch_number: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          department_id: string | null
          document_path: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          product_name: string
          production_date: string | null
          receipt_date: string
          receipt_temperature: number | null
          supplier_name: string
          updated_at: string | null
        }
        Insert: {
          batch_number?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          document_path?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_name: string
          production_date?: string | null
          receipt_date?: string
          receipt_temperature?: number | null
          supplier_name: string
          updated_at?: string | null
        }
        Update: {
          batch_number?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          document_path?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_name?: string
          production_date?: string | null
          receipt_date?: string
          receipt_temperature?: number | null
          supplier_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ik_mat_traceability_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ik_mat_traceability_records_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_calculation_items: {
        Row: {
          calculation_id: string
          category: string
          created_at: string
          description: string
          discount_percent: number | null
          id: string
          notes: string | null
          quantity: number
          sort_order: number | null
          total_price: number | null
          unit: string | null
          unit_price: number
        }
        Insert: {
          calculation_id: string
          category?: string
          created_at?: string
          description: string
          discount_percent?: number | null
          id?: string
          notes?: string | null
          quantity?: number
          sort_order?: number | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number
        }
        Update: {
          calculation_id?: string
          category?: string
          created_at?: string
          description?: string
          discount_percent?: number | null
          id?: string
          notes?: string | null
          quantity?: number
          sort_order?: number | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "ks_calculation_items_calculation_id_fkey"
            columns: ["calculation_id"]
            isOneToOne: false
            referencedRelation: "ks_calculations"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_calculations: {
        Row: {
          calculation_number: string
          client_name: string | null
          company_id: string
          created_at: string
          created_by_id: string | null
          created_by_name: string
          description: string | null
          id: string
          markup_percent: number | null
          notes: string | null
          project_id: string | null
          status: string
          title: string
          total_equipment_cost: number | null
          total_hours_cost: number | null
          total_materials_cost: number | null
          total_other_cost: number | null
          updated_at: string
          vat_percent: number | null
        }
        Insert: {
          calculation_number: string
          client_name?: string | null
          company_id: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string
          description?: string | null
          id?: string
          markup_percent?: number | null
          notes?: string | null
          project_id?: string | null
          status?: string
          title: string
          total_equipment_cost?: number | null
          total_hours_cost?: number | null
          total_materials_cost?: number | null
          total_other_cost?: number | null
          updated_at?: string
          vat_percent?: number | null
        }
        Update: {
          calculation_number?: string
          client_name?: string | null
          company_id?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string
          description?: string | null
          id?: string
          markup_percent?: number | null
          notes?: string | null
          project_id?: string | null
          status?: string
          title?: string
          total_equipment_cost?: number | null
          total_hours_cost?: number | null
          total_materials_cost?: number | null
          total_other_cost?: number | null
          updated_at?: string
          vat_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_calculations_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_calculations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_change_orders: {
        Row: {
          approved_at: string | null
          created_at: string | null
          created_by_user_id: string | null
          customer_approved: boolean | null
          description: string | null
          estimated_hours: number | null
          id: string
          pdf_url: string | null
          price_ex_vat: number | null
          project_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          customer_approved?: boolean | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          pdf_url?: string | null
          price_ex_vat?: number | null
          project_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          customer_approved?: boolean | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          pdf_url?: string | null
          price_ex_vat?: number | null
          project_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_checklist_items: {
        Row: {
          checklist_id: string
          comment: string | null
          created_at: string | null
          id: string
          status: string | null
          template_item_id: string
          updated_at: string | null
        }
        Insert: {
          checklist_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          template_item_id: string
          updated_at?: string | null
        }
        Update: {
          checklist_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          template_item_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "ks_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_checklist_items_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "ks_template_items"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_checklists: {
        Row: {
          created_at: string | null
          filled_at: string | null
          filled_by_user_id: string | null
          id: string
          phase: string | null
          project_id: string
          template_id: string
        }
        Insert: {
          created_at?: string | null
          filled_at?: string | null
          filled_by_user_id?: string | null
          id?: string
          phase?: string | null
          project_id: string
          template_id: string
        }
        Update: {
          created_at?: string | null
          filled_at?: string | null
          filled_by_user_id?: string | null
          id?: string
          phase?: string | null
          project_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_checklists_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ks_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_daily_reports: {
        Row: {
          company_id: string
          created_at: string
          delay_reason: string | null
          deviations_today: Json | null
          equipment_used: Json | null
          hms_incidents: Json | null
          hms_observations: string | null
          id: string
          materials_received: Json | null
          notes: string | null
          on_schedule: boolean | null
          own_crew_count: number | null
          photos: Json | null
          precipitation: string | null
          progress_description: string | null
          progress_percentage: number | null
          project_id: string | null
          quality_controls: Json | null
          report_date: string
          report_number: string
          safety_meeting_held: boolean | null
          status: string
          subcontractor_attendance: Json | null
          subcontractor_crew: Json | null
          submitted_at: string | null
          temperature_celsius: number | null
          total_crew_count: number | null
          updated_at: string
          user_id: string
          user_name: string
          weather_conditions: string | null
          wind_conditions: string | null
          work_areas: string | null
          work_description: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          delay_reason?: string | null
          deviations_today?: Json | null
          equipment_used?: Json | null
          hms_incidents?: Json | null
          hms_observations?: string | null
          id?: string
          materials_received?: Json | null
          notes?: string | null
          on_schedule?: boolean | null
          own_crew_count?: number | null
          photos?: Json | null
          precipitation?: string | null
          progress_description?: string | null
          progress_percentage?: number | null
          project_id?: string | null
          quality_controls?: Json | null
          report_date?: string
          report_number?: string
          safety_meeting_held?: boolean | null
          status?: string
          subcontractor_attendance?: Json | null
          subcontractor_crew?: Json | null
          submitted_at?: string | null
          temperature_celsius?: number | null
          total_crew_count?: number | null
          updated_at?: string
          user_id: string
          user_name: string
          weather_conditions?: string | null
          wind_conditions?: string | null
          work_areas?: string | null
          work_description?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          delay_reason?: string | null
          deviations_today?: Json | null
          equipment_used?: Json | null
          hms_incidents?: Json | null
          hms_observations?: string | null
          id?: string
          materials_received?: Json | null
          notes?: string | null
          on_schedule?: boolean | null
          own_crew_count?: number | null
          photos?: Json | null
          precipitation?: string | null
          progress_description?: string | null
          progress_percentage?: number | null
          project_id?: string | null
          quality_controls?: Json | null
          report_date?: string
          report_number?: string
          safety_meeting_held?: boolean | null
          status?: string
          subcontractor_attendance?: Json | null
          subcontractor_crew?: Json | null
          submitted_at?: string | null
          temperature_celsius?: number | null
          total_crew_count?: number | null
          updated_at?: string
          user_id?: string
          user_name?: string
          weather_conditions?: string | null
          wind_conditions?: string | null
          work_areas?: string | null
          work_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_daily_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_hazardous_conditions: {
        Row: {
          closed_date: string | null
          company_id: string
          condition_number: string
          created_at: string | null
          deadline: string | null
          description: string
          discovered_date: string
          id: string
          location: string
          measures_taken: string | null
          photo_paths: string[] | null
          project_id: string
          responsible: string | null
          severity: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          closed_date?: string | null
          company_id: string
          condition_number: string
          created_at?: string | null
          deadline?: string | null
          description: string
          discovered_date: string
          id?: string
          location: string
          measures_taken?: string | null
          photo_paths?: string[] | null
          project_id: string
          responsible?: string | null
          severity: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          closed_date?: string | null
          company_id?: string
          condition_number?: string
          created_at?: string | null
          deadline?: string | null
          description?: string
          discovered_date?: string
          id?: string
          location?: string
          measures_taken?: string | null
          photo_paths?: string[] | null
          project_id?: string
          responsible?: string | null
          severity?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_hazardous_conditions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_hazardous_conditions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_hms_plan_progress: {
        Row: {
          completed_steps: string[] | null
          created_at: string | null
          current_step: number | null
          id: string
          is_completed: boolean | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          is_completed?: boolean | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          is_completed?: boolean | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_hms_plan_progress_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_inspection_photos: {
        Row: {
          file_name: string
          file_path: string
          id: string
          inspection_id: string
          uploaded_at: string | null
          uploaded_by_user_id: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          id?: string
          inspection_id: string
          uploaded_at?: string | null
          uploaded_by_user_id?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          id?: string
          inspection_id?: string
          uploaded_at?: string | null
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_inspection_photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "ks_project_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_inspection_results: {
        Row: {
          checkpoint_results: Json | null
          completed_at: string | null
          completed_by_name: string | null
          completed_by_user_id: string | null
          created_at: string | null
          id: string
          inspection_id: string
          notes: string | null
          template_id: string | null
        }
        Insert: {
          checkpoint_results?: Json | null
          completed_at?: string | null
          completed_by_name?: string | null
          completed_by_user_id?: string | null
          created_at?: string | null
          id?: string
          inspection_id: string
          notes?: string | null
          template_id?: string | null
        }
        Update: {
          checkpoint_results?: Json | null
          completed_at?: string | null
          completed_by_name?: string | null
          completed_by_user_id?: string | null
          created_at?: string | null
          id?: string
          inspection_id?: string
          notes?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_inspection_results_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "ks_project_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_inspection_results_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ks_inspection_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_inspection_template_items: {
        Row: {
          checkpoint_text: string
          created_at: string | null
          help_text: string | null
          id: string
          sort_order: number | null
          template_id: string
        }
        Insert: {
          checkpoint_text: string
          created_at?: string | null
          help_text?: string | null
          id?: string
          sort_order?: number | null
          template_id: string
        }
        Update: {
          checkpoint_text?: string
          created_at?: string | null
          help_text?: string | null
          id?: string
          sort_order?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_inspection_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ks_inspection_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_inspection_template_seeds: {
        Row: {
          checkpoints: Json
          created_at: string | null
          description: string | null
          id: string
          inspection_type: string
          template_name: string
        }
        Insert: {
          checkpoints: Json
          created_at?: string | null
          description?: string | null
          id?: string
          inspection_type: string
          template_name: string
        }
        Update: {
          checkpoints?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          inspection_type?: string
          template_name?: string
        }
        Relationships: []
      }
      ks_inspection_templates: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          inspection_type: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          inspection_type: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          inspection_type?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_inspection_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_access_log: {
        Row: {
          access_id: string
          action: string
          created_at: string
          email: string
          id: string
          ip_address: string | null
          project_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_id: string
          action: string
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          project_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_id?: string
          action?: string
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          project_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_access_log_access_id_fkey"
            columns: ["access_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_project_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_access_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_avvik: {
        Row: {
          avvik_number: string
          category: string
          closed_at: string | null
          closed_by_name: string | null
          company_id: string
          corrective_action: string | null
          created_at: string
          deadline: string | null
          description: string | null
          discovered_date: string
          id: string
          location: string | null
          photo_paths: string[] | null
          preventive_action: string | null
          project_id: string
          reported_by_name: string
          reported_by_user_id: string | null
          responsible_name: string | null
          responsible_user_id: string | null
          root_cause: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          avvik_number: string
          category?: string
          closed_at?: string | null
          closed_by_name?: string | null
          company_id: string
          corrective_action?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          discovered_date?: string
          id?: string
          location?: string | null
          photo_paths?: string[] | null
          preventive_action?: string | null
          project_id: string
          reported_by_name: string
          reported_by_user_id?: string | null
          responsible_name?: string | null
          responsible_user_id?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          avvik_number?: string
          category?: string
          closed_at?: string | null
          closed_by_name?: string | null
          company_id?: string
          corrective_action?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          discovered_date?: string
          id?: string
          location?: string | null
          photo_paths?: string[] | null
          preventive_action?: string | null
          project_id?: string
          reported_by_name?: string
          reported_by_user_id?: string | null
          responsible_name?: string | null
          responsible_user_id?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_avvik_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_avvik_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_byggesak: {
        Row: {
          application_type: string | null
          approved_at: string | null
          bnr: string | null
          building_type: string | null
          case_number: string | null
          company_id: string
          created_at: string
          created_by: string | null
          fnr: string | null
          gnr: string | null
          id: string
          municipality: string | null
          notes: string | null
          project_id: string
          property_address: string | null
          snr: string | null
          søker_role: string | null
          status: string
          submitted_at: string | null
          tiltaksklasse: string | null
          updated_at: string
        }
        Insert: {
          application_type?: string | null
          approved_at?: string | null
          bnr?: string | null
          building_type?: string | null
          case_number?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          fnr?: string | null
          gnr?: string | null
          id?: string
          municipality?: string | null
          notes?: string | null
          project_id: string
          property_address?: string | null
          snr?: string | null
          søker_role?: string | null
          status?: string
          submitted_at?: string | null
          tiltaksklasse?: string | null
          updated_at?: string
        }
        Update: {
          application_type?: string | null
          approved_at?: string | null
          bnr?: string | null
          building_type?: string | null
          case_number?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          fnr?: string | null
          gnr?: string | null
          id?: string
          municipality?: string | null
          notes?: string | null
          project_id?: string
          property_address?: string | null
          snr?: string | null
          søker_role?: string | null
          status?: string
          submitted_at?: string | null
          tiltaksklasse?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_byggesak_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_byggesak_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_byggesak_forms: {
        Row: {
          byggesak_id: string
          company_id: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          form_category: string
          form_data: Json | null
          form_name: string
          form_number: string
          id: string
          notes: string | null
          pdf_file_path: string | null
          project_id: string
          sent_at: string | null
          sent_to: string | null
          signature_data: Json | null
          signed_at: string | null
          signed_by_name: string | null
          status: string
          template_id: string | null
          updated_at: string
          uploaded_file_path: string | null
        }
        Insert: {
          byggesak_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          form_category: string
          form_data?: Json | null
          form_name: string
          form_number: string
          id?: string
          notes?: string | null
          pdf_file_path?: string | null
          project_id: string
          sent_at?: string | null
          sent_to?: string | null
          signature_data?: Json | null
          signed_at?: string | null
          signed_by_name?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          uploaded_file_path?: string | null
        }
        Update: {
          byggesak_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          form_category?: string
          form_data?: Json | null
          form_name?: string
          form_number?: string
          id?: string
          notes?: string | null
          pdf_file_path?: string | null
          project_id?: string
          sent_at?: string | null
          sent_to?: string | null
          signature_data?: Json | null
          signed_at?: string | null
          signed_by_name?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          uploaded_file_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_byggesak_forms_byggesak_id_fkey"
            columns: ["byggesak_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_byggesak"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_byggesak_forms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_byggesak_forms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_byggesak_forms_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "admin_byggesak_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_change_orders: {
        Row: {
          attachments: Json | null
          change_order_number: string
          company_id: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          customer_approved: boolean | null
          customer_approved_at: string | null
          customer_approved_by: string | null
          customer_signature: string | null
          description: string | null
          estimated_hours: number | null
          hourly_rate: number | null
          id: string
          internal_notes: string | null
          material_cost: number | null
          project_id: string
          reason: string | null
          requested_by: string | null
          requested_date: string | null
          status: string
          title: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          change_order_number: string
          company_id: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customer_approved?: boolean | null
          customer_approved_at?: string | null
          customer_approved_by?: string | null
          customer_signature?: string | null
          description?: string | null
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string
          internal_notes?: string | null
          material_cost?: number | null
          project_id: string
          reason?: string | null
          requested_by?: string | null
          requested_date?: string | null
          status?: string
          title: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          change_order_number?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customer_approved?: boolean | null
          customer_approved_at?: string | null
          customer_approved_by?: string | null
          customer_signature?: string | null
          description?: string | null
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string
          internal_notes?: string | null
          material_cost?: number | null
          project_id?: string
          reason?: string | null
          requested_by?: string | null
          requested_date?: string | null
          status?: string
          title?: string
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_change_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_checklist_reminders: {
        Row: {
          checklist_id: string
          company_id: string
          id: string
          project_id: string
          recipient_email: string
          reminder_type: string
          sent_at: string
        }
        Insert: {
          checklist_id: string
          company_id: string
          id?: string
          project_id: string
          recipient_email: string
          reminder_type: string
          sent_at?: string
        }
        Update: {
          checklist_id?: string
          company_id?: string
          id?: string
          project_id?: string
          recipient_email?: string
          reminder_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_checklist_reminders_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_checklist_reminders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_checklist_reminders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_checklist_templates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          checkpoints: Json
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          project_id: string | null
          template_name: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          checkpoints?: Json
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          project_id?: string | null
          template_name: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          checkpoints?: Json
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          project_id?: string | null
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_checklist_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_checklist_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_checklists: {
        Row: {
          checklist_items: Json
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          deadline_date: string | null
          id: string
          include_in_report: boolean
          is_paper_version: boolean
          paper_file_path: string | null
          paper_uploaded: boolean
          pdf_file_path: string | null
          progress_percent: number
          project_id: string
          responsible_user_id: string | null
          responsible_user_name: string | null
          signatures: Json
          status: string
          template_name: string
          title: string
          updated_at: string
        }
        Insert: {
          checklist_items?: Json
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deadline_date?: string | null
          id?: string
          include_in_report?: boolean
          is_paper_version?: boolean
          paper_file_path?: string | null
          paper_uploaded?: boolean
          pdf_file_path?: string | null
          progress_percent?: number
          project_id: string
          responsible_user_id?: string | null
          responsible_user_name?: string | null
          signatures?: Json
          status?: string
          template_name: string
          title: string
          updated_at?: string
        }
        Update: {
          checklist_items?: Json
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deadline_date?: string | null
          id?: string
          include_in_report?: boolean
          is_paper_version?: boolean
          paper_file_path?: string | null
          paper_uploaded?: boolean
          pdf_file_path?: string | null
          progress_percent?: number
          project_id?: string
          responsible_user_id?: string | null
          responsible_user_name?: string | null
          signatures?: Json
          status?: string
          template_name?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_checklists_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_claims: {
        Row: {
          actual_cost: number | null
          category: string
          claim_number: string
          company_id: string
          cost_estimate: number | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          photos: string[] | null
          priority: string
          project_id: string
          reported_by: string | null
          reported_date: string
          resolution: string | null
          resolved_at: string | null
          responsible_id: string | null
          responsible_name: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          category?: string
          claim_number: string
          company_id: string
          cost_estimate?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          photos?: string[] | null
          priority?: string
          project_id: string
          reported_by?: string | null
          reported_date?: string
          resolution?: string | null
          resolved_at?: string | null
          responsible_id?: string | null
          responsible_name?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          category?: string
          claim_number?: string
          company_id?: string
          cost_estimate?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          photos?: string[] | null
          priority?: string
          project_id?: string
          reported_by?: string | null
          reported_date?: string
          resolution?: string | null
          resolved_at?: string | null
          responsible_id?: string | null
          responsible_name?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_claims_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_claims_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_cost_entries: {
        Row: {
          amount: number
          category: string
          company_id: string
          created_at: string
          created_by: string | null
          date: string
          description: string
          file_name: string | null
          file_path: string | null
          id: string
          invoice_number: string | null
          project_id: string
          supplier: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          company_id: string
          created_at?: string
          created_by?: string | null
          date?: string
          description: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          invoice_number?: string | null
          project_id: string
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          invoice_number?: string | null
          project_id?: string
          supplier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_cost_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_cost_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_document_templates: {
        Row: {
          category: string
          company_id: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          title: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          version: string | null
        }
        Insert: {
          category?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          version?: string | null
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_document_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_documents: {
        Row: {
          company_id: string
          created_at: string
          document_name: string
          document_type: string
          file_path: string
          file_size: number | null
          file_type: string | null
          folder_path: string
          id: string
          include_in_report: boolean | null
          project_id: string
          source_id: string | null
          source_type: string | null
          updated_at: string
          uploaded_by: string | null
          uploaded_by_name: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          document_name: string
          document_type?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          folder_path?: string
          id?: string
          include_in_report?: boolean | null
          project_id: string
          source_id?: string | null
          source_type?: string | null
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          folder_path?: string
          id?: string
          include_in_report?: boolean | null
          project_id?: string
          source_id?: string | null
          source_type?: string | null
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_finances: {
        Row: {
          actual_labor: number | null
          actual_materials: number | null
          actual_other: number | null
          actual_subcontractors: number | null
          budget_labor: number | null
          budget_materials: number | null
          budget_other: number | null
          budget_subcontractors: number | null
          change_orders_sum: number | null
          company_id: string
          contract_sum: number | null
          created_at: string
          id: string
          invoiced_amount: number | null
          notes: string | null
          paid_amount: number | null
          project_id: string
          updated_at: string
        }
        Insert: {
          actual_labor?: number | null
          actual_materials?: number | null
          actual_other?: number | null
          actual_subcontractors?: number | null
          budget_labor?: number | null
          budget_materials?: number | null
          budget_other?: number | null
          budget_subcontractors?: number | null
          change_orders_sum?: number | null
          company_id: string
          contract_sum?: number | null
          created_at?: string
          id?: string
          invoiced_amount?: number | null
          notes?: string | null
          paid_amount?: number | null
          project_id: string
          updated_at?: string
        }
        Update: {
          actual_labor?: number | null
          actual_materials?: number | null
          actual_other?: number | null
          actual_subcontractors?: number | null
          budget_labor?: number | null
          budget_materials?: number | null
          budget_other?: number | null
          budget_subcontractors?: number | null
          change_orders_sum?: number | null
          company_id?: string
          contract_sum?: number | null
          created_at?: string
          id?: string
          invoiced_amount?: number | null
          notes?: string | null
          paid_amount?: number | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_finances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_finances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_hms_plans: {
        Row: {
          created_at: string
          general_measures: string
          goals: Json
          id: string
          project_id: string
          responsibilities: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          general_measures?: string
          goals?: Json
          id?: string
          project_id: string
          responsibilities?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          general_measures?: string
          goals?: Json
          id?: string
          project_id?: string
          responsibilities?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_hms_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_inspection_templates: {
        Row: {
          category: string | null
          checkpoints: Json
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          template_name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          checkpoints?: Json
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          template_name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          checkpoints?: Json
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_inspection_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_inspections: {
        Row: {
          approver_signature: string | null
          approver_signature_date: string | null
          checkpoint_responses: Json
          company_id: string
          completed_at: string | null
          completed_checkpoints: number | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          inspector_signature: string | null
          inspector_signature_date: string | null
          pdf_file_path: string | null
          project_id: string
          responsible_company: string | null
          responsible_id: string | null
          responsible_name: string | null
          status: string
          template_id: string | null
          title: string
          total_checkpoints: number | null
          updated_at: string
        }
        Insert: {
          approver_signature?: string | null
          approver_signature_date?: string | null
          checkpoint_responses?: Json
          company_id: string
          completed_at?: string | null
          completed_checkpoints?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          inspector_signature?: string | null
          inspector_signature_date?: string | null
          pdf_file_path?: string | null
          project_id: string
          responsible_company?: string | null
          responsible_id?: string | null
          responsible_name?: string | null
          status?: string
          template_id?: string | null
          title: string
          total_checkpoints?: number | null
          updated_at?: string
        }
        Update: {
          approver_signature?: string | null
          approver_signature_date?: string | null
          checkpoint_responses?: Json
          company_id?: string
          completed_at?: string | null
          completed_checkpoints?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          inspector_signature?: string | null
          inspector_signature_date?: string | null
          pdf_file_path?: string | null
          project_id?: string
          responsible_company?: string | null
          responsible_id?: string | null
          responsible_name?: string | null
          status?: string
          template_id?: string | null
          title?: string
          total_checkpoints?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_inspections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_inspections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_inspections_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_inspections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_inspection_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_invoices: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          description: string | null
          due_date: string | null
          file_name: string | null
          file_path: string | null
          id: string
          invoice_date: string
          invoice_number: string
          paid_date: string | null
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          paid_date?: string | null
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          paid_date?: string | null
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_meeting_items: {
        Row: {
          created_at: string
          deadline: string | null
          decision: string | null
          discussion: string | null
          id: string
          item_number: number
          linked_avvik_id: string | null
          meeting_id: string
          responsible_id: string | null
          responsible_name: string | null
          status: string | null
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          decision?: string | null
          discussion?: string | null
          id?: string
          item_number: number
          linked_avvik_id?: string | null
          meeting_id: string
          responsible_id?: string | null
          responsible_name?: string | null
          status?: string | null
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          decision?: string | null
          discussion?: string | null
          id?: string
          item_number?: number
          linked_avvik_id?: string | null
          meeting_id?: string
          responsible_id?: string | null
          responsible_name?: string | null
          status?: string | null
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_meeting_items_linked_avvik_id_fkey"
            columns: ["linked_avvik_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_avvik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_meeting_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_meetings: {
        Row: {
          agenda: string | null
          company_id: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          id: string
          location: string | null
          meeting_date: string
          meeting_number: string | null
          meeting_type: string
          notes: string | null
          participants: Json | null
          pdf_path: string | null
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          location?: string | null
          meeting_date: string
          meeting_number?: string | null
          meeting_type?: string
          notes?: string | null
          participants?: Json | null
          pdf_path?: string | null
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_number?: string | null
          meeting_type?: string
          notes?: string | null
          participants?: Json | null
          pdf_path?: string | null
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_milestones: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          parent_id: string | null
          progress: number | null
          project_id: string
          responsible_id: string | null
          responsible_name: string | null
          sort_order: number | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          parent_id?: string | null
          progress?: number | null
          project_id: string
          responsible_id?: string | null
          responsible_name?: string | null
          sort_order?: number | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          parent_id?: string | null
          progress?: number | null
          project_id?: string
          responsible_id?: string | null
          responsible_name?: string | null
          sort_order?: number | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_milestones_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_milestones_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_nabovarsel_recipients: {
        Row: {
          bnr: string | null
          company_id: string
          created_at: string
          email: string | null
          form_id: string
          gnr: string | null
          id: string
          neighbor_address: string | null
          neighbor_name: string
          notification_method: string | null
          phone: string | null
          project_id: string
          receipt_confirmed: boolean | null
          response_date: string | null
          response_status: string | null
          response_text: string | null
          sent_at: string | null
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          bnr?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          form_id: string
          gnr?: string | null
          id?: string
          neighbor_address?: string | null
          neighbor_name: string
          notification_method?: string | null
          phone?: string | null
          project_id: string
          receipt_confirmed?: boolean | null
          response_date?: string | null
          response_status?: string | null
          response_text?: string | null
          sent_at?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          bnr?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          form_id?: string
          gnr?: string | null
          id?: string
          neighbor_address?: string | null
          neighbor_name?: string
          notification_method?: string | null
          phone?: string | null
          project_id?: string
          receipt_confirmed?: boolean | null
          response_date?: string | null
          response_status?: string | null
          response_text?: string | null
          sent_at?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_nabovarsel_recipients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_nabovarsel_recipients_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_byggesak_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_nabovarsel_recipients_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_project_access: {
        Row: {
          access_level: Database["public"]["Enums"]["ks_module2_access_level"]
          company_name: string | null
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invited_at: string
          invited_by: string | null
          invited_by_name: string | null
          last_login: string | null
          login_count: number | null
          name: string
          project_id: string
          role_in_project: string
          status: string
          subcontractor_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["ks_module2_access_level"]
          company_name?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          invited_by_name?: string | null
          last_login?: string | null
          login_count?: number | null
          name: string
          project_id: string
          role_in_project?: string
          status?: string
          subcontractor_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["ks_module2_access_level"]
          company_name?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          invited_by_name?: string | null
          last_login?: string | null
          login_count?: number | null
          name?: string
          project_id?: string
          role_in_project?: string
          status?: string
          subcontractor_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_project_access_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_project_crew: {
        Row: {
          added_by: string | null
          company_id: string
          created_at: string
          display_name: string
          end_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          project_id: string
          project_role: string | null
          responsibilities: string | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          company_id: string
          created_at?: string
          display_name: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          project_id: string
          project_role?: string | null
          responsibilities?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          company_id?: string
          created_at?: string
          display_name?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          project_id?: string
          project_role?: string | null
          responsibilities?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_project_crew_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_project_crew_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_project_crew_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ks_module2_project_notes: {
        Row: {
          company_id: string
          content: string
          created_at: string
          created_by_name: string
          id: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          created_by_name: string
          id?: string
          project_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          created_by_name?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_project_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_project_photos: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          id: string
          project_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          id?: string
          project_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_project_photos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_project_templates: {
        Row: {
          admin_checklist_template_id: string | null
          admin_document_id: string | null
          admin_routine_template_id: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          implemented_at: string | null
          implemented_by_id: string | null
          implemented_by_name: string | null
          is_implemented: boolean | null
          linked_checklist_ids: Json | null
          notes: string | null
          project_id: string
          template_type: string
          updated_at: string
        }
        Insert: {
          admin_checklist_template_id?: string | null
          admin_document_id?: string | null
          admin_routine_template_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          implemented_at?: string | null
          implemented_by_id?: string | null
          implemented_by_name?: string | null
          is_implemented?: boolean | null
          linked_checklist_ids?: Json | null
          notes?: string | null
          project_id: string
          template_type: string
          updated_at?: string
        }
        Update: {
          admin_checklist_template_id?: string | null
          admin_document_id?: string | null
          admin_routine_template_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          implemented_at?: string | null
          implemented_by_id?: string | null
          implemented_by_name?: string | null
          is_implemented?: boolean | null
          linked_checklist_ids?: Json | null
          notes?: string | null
          project_id?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_project_templates_admin_checklist_template_id_fkey"
            columns: ["admin_checklist_template_id"]
            isOneToOne: false
            referencedRelation: "admin_checklist_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_project_templates_admin_document_id_fkey"
            columns: ["admin_document_id"]
            isOneToOne: false
            referencedRelation: "admin_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_project_templates_admin_routine_template_id_fkey"
            columns: ["admin_routine_template_id"]
            isOneToOne: false
            referencedRelation: "admin_routine_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_project_templates_implemented_by_id_fkey"
            columns: ["implemented_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_project_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_project_time_entries: {
        Row: {
          company_id: string
          created_at: string
          date: string
          description: string | null
          employee_id: string | null
          employee_name: string
          hours: number
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          date: string
          description?: string | null
          employee_id?: string | null
          employee_name: string
          hours: number
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          date?: string
          description?: string | null
          employee_id?: string | null
          employee_name?: string
          hours?: number
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_project_time_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_project_time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_project_time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_projects: {
        Row: {
          address: string | null
          client_contact_person: string | null
          client_email: string | null
          client_name: string | null
          client_org_number: string | null
          client_phone: string | null
          company_id: string
          contract_sum: number | null
          contractor_type: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          gnr_bnr: string | null
          id: string
          is_deleted: boolean
          is_favorite: boolean | null
          last_activity_date: string | null
          last_activity_description: string | null
          no_subcontractors: boolean
          planned_end_date: string | null
          planned_start_date: string | null
          progress_percent: number | null
          project_leader_id: string | null
          project_leader_name: string | null
          project_name: string
          project_number: string
          project_type: string | null
          sha_coordinator_kp: string | null
          sha_coordinator_ku: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_contact_person?: string | null
          client_email?: string | null
          client_name?: string | null
          client_org_number?: string | null
          client_phone?: string | null
          company_id: string
          contract_sum?: number | null
          contractor_type?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          gnr_bnr?: string | null
          id?: string
          is_deleted?: boolean
          is_favorite?: boolean | null
          last_activity_date?: string | null
          last_activity_description?: string | null
          no_subcontractors?: boolean
          planned_end_date?: string | null
          planned_start_date?: string | null
          progress_percent?: number | null
          project_leader_id?: string | null
          project_leader_name?: string | null
          project_name: string
          project_number: string
          project_type?: string | null
          sha_coordinator_kp?: string | null
          sha_coordinator_ku?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_contact_person?: string | null
          client_email?: string | null
          client_name?: string | null
          client_org_number?: string | null
          client_phone?: string | null
          company_id?: string
          contract_sum?: number | null
          contractor_type?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          gnr_bnr?: string | null
          id?: string
          is_deleted?: boolean
          is_favorite?: boolean | null
          last_activity_date?: string | null
          last_activity_description?: string | null
          no_subcontractors?: boolean
          planned_end_date?: string | null
          planned_start_date?: string | null
          progress_percent?: number | null
          project_leader_id?: string | null
          project_leader_name?: string | null
          project_name?: string
          project_number?: string
          project_type?: string | null
          sha_coordinator_kp?: string | null
          sha_coordinator_ku?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_projects_project_leader_id_fkey"
            columns: ["project_leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_routine_checklist_links: {
        Row: {
          created_at: string | null
          id: string
          routine_id: string
          template_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          routine_id: string
          template_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          routine_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_routine_checklist_links_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_routine_checklist_links_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_routines: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string | null
          company_id: string
          content: string | null
          created_at: string | null
          description: string | null
          document_name: string | null
          document_path: string | null
          id: string
          is_document: boolean | null
          name: string
          project_id: string
          responsible_role: string | null
          routine_number: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          company_id: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          document_name?: string | null
          document_path?: string | null
          id?: string
          is_document?: boolean | null
          name: string
          project_id: string
          responsible_role?: string | null
          routine_number: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          company_id?: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          document_name?: string | null
          document_path?: string | null
          id?: string
          is_document?: boolean | null
          name?: string
          project_id?: string
          responsible_role?: string | null
          routine_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_routines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_routines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_settings: {
        Row: {
          accent_color: string | null
          company_id: string
          created_at: string
          default_deadline_days: number | null
          email_notifications_enabled: boolean | null
          id: string
          logo_url: string | null
          updated_at: string
          weekly_report_enabled: boolean | null
        }
        Insert: {
          accent_color?: string | null
          company_id: string
          created_at?: string
          default_deadline_days?: number | null
          email_notifications_enabled?: boolean | null
          id?: string
          logo_url?: string | null
          updated_at?: string
          weekly_report_enabled?: boolean | null
        }
        Update: {
          accent_color?: string | null
          company_id?: string
          created_at?: string
          default_deadline_days?: number | null
          email_notifications_enabled?: boolean | null
          id?: string
          logo_url?: string | null
          updated_at?: string
          weekly_report_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_sha_plans: {
        Row: {
          change_routine_text: string | null
          client_contact_person: string | null
          client_name: string | null
          client_org_number: string | null
          client_signature: string | null
          client_signed_at: string | null
          client_signed_by: string | null
          company_id: string
          contractor_type: string | null
          created_at: string
          created_by: string | null
          entrepreneur_approved: boolean | null
          entrepreneur_approved_at: string | null
          entrepreneur_approved_by: string | null
          external_file_name: string | null
          external_file_path: string | null
          id: string
          is_current_version: boolean | null
          kp_signature: string | null
          kp_signed_at: string | null
          kp_signed_by: string | null
          ku_signature: string | null
          ku_signed_at: string | null
          ku_signed_by: string | null
          organization_data: Json | null
          plan_type: string
          planned_end_date: string | null
          planned_start_date: string | null
          previous_version_id: string | null
          project_address: string | null
          project_id: string
          project_name: string | null
          risk_areas: Json | null
          sha_coordinator_kp: string | null
          sha_coordinator_ku: string | null
          signed_pdf_path: string | null
          status: string
          template_id: string | null
          updated_at: string
          uploaded_at: string | null
          uploaded_by_name: string | null
          version_number: number | null
        }
        Insert: {
          change_routine_text?: string | null
          client_contact_person?: string | null
          client_name?: string | null
          client_org_number?: string | null
          client_signature?: string | null
          client_signed_at?: string | null
          client_signed_by?: string | null
          company_id: string
          contractor_type?: string | null
          created_at?: string
          created_by?: string | null
          entrepreneur_approved?: boolean | null
          entrepreneur_approved_at?: string | null
          entrepreneur_approved_by?: string | null
          external_file_name?: string | null
          external_file_path?: string | null
          id?: string
          is_current_version?: boolean | null
          kp_signature?: string | null
          kp_signed_at?: string | null
          kp_signed_by?: string | null
          ku_signature?: string | null
          ku_signed_at?: string | null
          ku_signed_by?: string | null
          organization_data?: Json | null
          plan_type?: string
          planned_end_date?: string | null
          planned_start_date?: string | null
          previous_version_id?: string | null
          project_address?: string | null
          project_id: string
          project_name?: string | null
          risk_areas?: Json | null
          sha_coordinator_kp?: string | null
          sha_coordinator_ku?: string | null
          signed_pdf_path?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          uploaded_at?: string | null
          uploaded_by_name?: string | null
          version_number?: number | null
        }
        Update: {
          change_routine_text?: string | null
          client_contact_person?: string | null
          client_name?: string | null
          client_org_number?: string | null
          client_signature?: string | null
          client_signed_at?: string | null
          client_signed_by?: string | null
          company_id?: string
          contractor_type?: string | null
          created_at?: string
          created_by?: string | null
          entrepreneur_approved?: boolean | null
          entrepreneur_approved_at?: string | null
          entrepreneur_approved_by?: string | null
          external_file_name?: string | null
          external_file_path?: string | null
          id?: string
          is_current_version?: boolean | null
          kp_signature?: string | null
          kp_signed_at?: string | null
          kp_signed_by?: string | null
          ku_signature?: string | null
          ku_signed_at?: string | null
          ku_signed_by?: string | null
          organization_data?: Json | null
          plan_type?: string
          planned_end_date?: string | null
          planned_start_date?: string | null
          previous_version_id?: string | null
          project_address?: string | null
          project_id?: string
          project_name?: string | null
          risk_areas?: Json | null
          sha_coordinator_kp?: string | null
          sha_coordinator_ku?: string | null
          signed_pdf_path?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          uploaded_at?: string | null
          uploaded_by_name?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_sha_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_sha_plans_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_sha_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_sha_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_sha_tilpasning: {
        Row: {
          additional_measures: Json | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          implementation_description: string | null
          linked_avvik_ids: string[] | null
          linked_sja_ids: string[] | null
          linked_vernerunde_ids: string[] | null
          project_id: string
          project_leader_signature: string | null
          project_leader_signed_at: string | null
          project_leader_signed_by: string | null
          sha_plan_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          additional_measures?: Json | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          implementation_description?: string | null
          linked_avvik_ids?: string[] | null
          linked_sja_ids?: string[] | null
          linked_vernerunde_ids?: string[] | null
          project_id: string
          project_leader_signature?: string | null
          project_leader_signed_at?: string | null
          project_leader_signed_by?: string | null
          sha_plan_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          additional_measures?: Json | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          implementation_description?: string | null
          linked_avvik_ids?: string[] | null
          linked_sja_ids?: string[] | null
          linked_vernerunde_ids?: string[] | null
          project_id?: string
          project_leader_signature?: string | null
          project_leader_signed_at?: string | null
          project_leader_signed_by?: string | null
          sha_plan_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_sha_tilpasning_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_sha_tilpasning_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_sha_tilpasning_sha_plan_id_fkey"
            columns: ["sha_plan_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_sha_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_sja: {
        Row: {
          company_id: string
          completed_at: string | null
          completed_by_id: string | null
          completed_by_name: string | null
          created_at: string
          id: string
          identified_risks: Json | null
          location: string | null
          notes: string | null
          overall_risk_level: string | null
          participants: string[] | null
          planned_date: string
          project_id: string
          responsible_id: string | null
          responsible_name: string
          risk_reducing_measures: Json | null
          signature_data: string | null
          sja_number: string
          status: string
          title: string
          updated_at: string
          work_description: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          id?: string
          identified_risks?: Json | null
          location?: string | null
          notes?: string | null
          overall_risk_level?: string | null
          participants?: string[] | null
          planned_date: string
          project_id: string
          responsible_id?: string | null
          responsible_name: string
          risk_reducing_measures?: Json | null
          signature_data?: string | null
          sja_number: string
          status?: string
          title: string
          updated_at?: string
          work_description?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          id?: string
          identified_risks?: Json | null
          location?: string | null
          notes?: string | null
          overall_risk_level?: string | null
          participants?: string[] | null
          planned_date?: string
          project_id?: string
          responsible_id?: string | null
          responsible_name?: string
          risk_reducing_measures?: Json | null
          signature_data?: string | null
          sja_number?: string
          status?: string
          title?: string
          updated_at?: string
          work_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_sja_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_sja_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_sja_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_sja_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_stoffkartotek: {
        Row: {
          company_id: string
          created_at: string
          danger_classes: string[] | null
          id: string
          last_updated: string | null
          location: string | null
          manufacturer: string | null
          notes: string | null
          product_name: string
          project_id: string
          sds_file_path: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          danger_classes?: string[] | null
          id?: string
          last_updated?: string | null
          location?: string | null
          manufacturer?: string | null
          notes?: string | null
          product_name: string
          project_id: string
          sds_file_path?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          danger_classes?: string[] | null
          id?: string
          last_updated?: string | null
          location?: string | null
          manufacturer?: string | null
          notes?: string | null
          product_name?: string
          project_id?: string
          sds_file_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_stoffkartotek_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_stoffkartotek_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_subcontractor_documents: {
        Row: {
          company_id: string
          created_at: string
          document_name: string
          document_type: string
          expiry_date: string | null
          file_path: string
          id: string
          subcontractor_id: string
          uploaded_by: string
        }
        Insert: {
          company_id: string
          created_at?: string
          document_name: string
          document_type: string
          expiry_date?: string | null
          file_path: string
          id?: string
          subcontractor_id: string
          uploaded_by: string
        }
        Update: {
          company_id?: string
          created_at?: string
          document_name?: string
          document_type?: string
          expiry_date?: string | null
          file_path?: string
          id?: string
          subcontractor_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_subcontractor_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_subcontractor_documents_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_subcontractor_evaluations: {
        Row: {
          certifications_comment: string | null
          company_id: string
          competence_comment: string | null
          conclusion_notes: string | null
          contract_comment: string | null
          created_at: string
          environmental_plan_comment: string | null
          evaluated_at: string
          evaluated_by: string
          has_competence_documentation: boolean | null
          has_environmental_plan: boolean | null
          has_liability_insurance: boolean | null
          has_quality_system: boolean | null
          has_references: boolean | null
          has_required_certifications: boolean | null
          has_signed_contract: boolean | null
          has_tax_certificate: boolean | null
          has_valid_hms_card: boolean | null
          has_valid_org_number: boolean | null
          hms_card_comment: string | null
          id: string
          liability_insurance_comment: string | null
          org_number_comment: string | null
          overall_conclusion: string | null
          quality_system_comment: string | null
          references_comment: string | null
          subcontractor_id: string
          tax_certificate_comment: string | null
          updated_at: string
        }
        Insert: {
          certifications_comment?: string | null
          company_id: string
          competence_comment?: string | null
          conclusion_notes?: string | null
          contract_comment?: string | null
          created_at?: string
          environmental_plan_comment?: string | null
          evaluated_at?: string
          evaluated_by: string
          has_competence_documentation?: boolean | null
          has_environmental_plan?: boolean | null
          has_liability_insurance?: boolean | null
          has_quality_system?: boolean | null
          has_references?: boolean | null
          has_required_certifications?: boolean | null
          has_signed_contract?: boolean | null
          has_tax_certificate?: boolean | null
          has_valid_hms_card?: boolean | null
          has_valid_org_number?: boolean | null
          hms_card_comment?: string | null
          id?: string
          liability_insurance_comment?: string | null
          org_number_comment?: string | null
          overall_conclusion?: string | null
          quality_system_comment?: string | null
          references_comment?: string | null
          subcontractor_id: string
          tax_certificate_comment?: string | null
          updated_at?: string
        }
        Update: {
          certifications_comment?: string | null
          company_id?: string
          competence_comment?: string | null
          conclusion_notes?: string | null
          contract_comment?: string | null
          created_at?: string
          environmental_plan_comment?: string | null
          evaluated_at?: string
          evaluated_by?: string
          has_competence_documentation?: boolean | null
          has_environmental_plan?: boolean | null
          has_liability_insurance?: boolean | null
          has_quality_system?: boolean | null
          has_references?: boolean | null
          has_required_certifications?: boolean | null
          has_signed_contract?: boolean | null
          has_tax_certificate?: boolean | null
          has_valid_hms_card?: boolean | null
          has_valid_org_number?: boolean | null
          hms_card_comment?: string | null
          id?: string
          liability_insurance_comment?: string | null
          org_number_comment?: string | null
          overall_conclusion?: string | null
          quality_system_comment?: string | null
          references_comment?: string | null
          subcontractor_id?: string
          tax_certificate_comment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_subcontractor_evaluations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_subcontractor_evaluations_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_subcontractor_inspections: {
        Row: {
          company_id: string
          corrective_actions: string | null
          created_at: string
          findings: string | null
          id: string
          inspection_date: string
          inspector_name: string
          photo_paths: string[] | null
          project_id: string
          status: string
          subcontractor_id: string
          updated_at: string
          work_area: string
        }
        Insert: {
          company_id: string
          corrective_actions?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          inspection_date: string
          inspector_name: string
          photo_paths?: string[] | null
          project_id: string
          status?: string
          subcontractor_id: string
          updated_at?: string
          work_area: string
        }
        Update: {
          company_id?: string
          corrective_actions?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          inspection_date?: string
          inspector_name?: string
          photo_paths?: string[] | null
          project_id?: string
          status?: string
          subcontractor_id?: string
          updated_at?: string
          work_area?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_subcontractor_inspections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_subcontractor_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_subcontractor_inspections_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_subcontractors: {
        Row: {
          approval_notes: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          company_id: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          contract_value: number | null
          created_at: string
          end_date: string | null
          firm_name: string
          id: string
          is_active: boolean
          org_number: string | null
          project_id: string
          start_date: string | null
          trade: string | null
          updated_at: string
          work_scope: string
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contract_value?: number | null
          created_at?: string
          end_date?: string | null
          firm_name: string
          id?: string
          is_active?: boolean
          org_number?: string | null
          project_id: string
          start_date?: string | null
          trade?: string | null
          updated_at?: string
          work_scope: string
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contract_value?: number | null
          created_at?: string
          end_date?: string | null
          firm_name?: string
          id?: string
          is_active?: boolean
          org_number?: string | null
          project_id?: string
          start_date?: string | null
          trade?: string | null
          updated_at?: string
          work_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_subcontractors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_subcontractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_template_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          acknowledged_by_name: string
          company_id: string
          created_at: string | null
          id: string
          notes: string | null
          project_id: string | null
          template_id: string
          template_type: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledged_by_name: string
          company_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          template_id: string
          template_type: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledged_by_name?: string
          company_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          template_id?: string
          template_type?: string
        }
        Relationships: []
      }
      ks_module2_template_notifications: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          notification_message: string
          template_id: string
          template_type: string
          version: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          notification_message: string
          template_id: string
          template_type: string
          version: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          notification_message?: string
          template_id?: string
          template_type?: string
          version?: string
        }
        Relationships: []
      }
      ks_module2_timeline_events: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          description: string | null
          event_date: string
          id: string
          photo_paths: string[] | null
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          description?: string | null
          event_date: string
          id?: string
          photo_paths?: string[] | null
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          description?: string | null
          event_date?: string
          id?: string
          photo_paths?: string[] | null
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_timeline_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_timeline_events_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_timeline_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_uk: {
        Row: {
          approved_at: string | null
          approved_by_name: string | null
          comments: string | null
          company_id: string
          control_area: string
          control_date: string | null
          controller_company: string | null
          controller_name: string | null
          created_at: string
          created_by_name: string
          created_by_user_id: string | null
          deadline: string | null
          description: string | null
          document_paths: string[] | null
          id: string
          project_id: string
          result: string | null
          status: string
          uk_number: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_name?: string | null
          comments?: string | null
          company_id: string
          control_area: string
          control_date?: string | null
          controller_company?: string | null
          controller_name?: string | null
          created_at?: string
          created_by_name: string
          created_by_user_id?: string | null
          deadline?: string | null
          description?: string | null
          document_paths?: string[] | null
          id?: string
          project_id: string
          result?: string | null
          status?: string
          uk_number: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by_name?: string | null
          comments?: string | null
          company_id?: string
          control_area?: string
          control_date?: string | null
          controller_company?: string | null
          controller_name?: string | null
          created_at?: string
          created_by_name?: string
          created_by_user_id?: string | null
          deadline?: string | null
          description?: string | null
          document_paths?: string[] | null
          id?: string
          project_id?: string
          result?: string | null
          status?: string
          uk_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_uk_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_uk_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_uk_checklist_items: {
        Row: {
          checkpoint_text: string
          company_id: string
          created_at: string
          created_by_name: string
          id: string
          notes: string | null
          photo_paths: string[] | null
          sort_order: number
          status: string
          uk_id: string
          updated_at: string
        }
        Insert: {
          checkpoint_text: string
          company_id: string
          created_at?: string
          created_by_name?: string
          id?: string
          notes?: string | null
          photo_paths?: string[] | null
          sort_order?: number
          status?: string
          uk_id: string
          updated_at?: string
        }
        Update: {
          checkpoint_text?: string
          company_id?: string
          created_at?: string
          created_by_name?: string
          id?: string
          notes?: string | null
          photo_paths?: string[] | null
          sort_order?: number
          status?: string
          uk_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_uk_checklist_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_uk_checklist_items_uk_id_fkey"
            columns: ["uk_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_uk"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_vernerunde_templates: {
        Row: {
          checkpoints: Json
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system_template: boolean
          project_id: string | null
          template_name: string
          updated_at: string
        }
        Insert: {
          checkpoints?: Json
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_template?: boolean
          project_id?: string | null
          template_name: string
          updated_at?: string
        }
        Update: {
          checkpoints?: Json
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_template?: boolean
          project_id?: string | null
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_vernerunde_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_vernerunde_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_module2_vernerunder: {
        Row: {
          checklist_responses: Json | null
          company_id: string
          completed_by_id: string | null
          completed_by_name: string | null
          completed_date: string | null
          created_at: string
          findings: Json | null
          id: string
          notes: string | null
          participants: string[] | null
          project_id: string
          responsible_id: string | null
          responsible_name: string
          scheduled_date: string
          signature_data: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
          vernerunde_number: string
        }
        Insert: {
          checklist_responses?: Json | null
          company_id: string
          completed_by_id?: string | null
          completed_by_name?: string | null
          completed_date?: string | null
          created_at?: string
          findings?: Json | null
          id?: string
          notes?: string | null
          participants?: string[] | null
          project_id: string
          responsible_id?: string | null
          responsible_name: string
          scheduled_date: string
          signature_data?: string | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
          vernerunde_number: string
        }
        Update: {
          checklist_responses?: Json | null
          company_id?: string
          completed_by_id?: string | null
          completed_by_name?: string | null
          completed_date?: string | null
          created_at?: string
          findings?: Json | null
          id?: string
          notes?: string | null
          participants?: string[] | null
          project_id?: string
          responsible_id?: string | null
          responsible_name?: string
          scheduled_date?: string
          signature_data?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          vernerunde_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_module2_vernerunder_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_vernerunder_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_vernerunder_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_vernerunder_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_module2_vernerunder_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_vernerunde_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_photos: {
        Row: {
          checklist_item_id: string
          file_path: string
          id: string
          taken_at: string | null
          taken_by_user_id: string | null
        }
        Insert: {
          checklist_item_id: string
          file_path: string
          id?: string
          taken_at?: string | null
          taken_by_user_id?: string | null
        }
        Update: {
          checklist_item_id?: string
          file_path?: string
          id?: string
          taken_at?: string | null
          taken_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_photos_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "ks_checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_actions: {
        Row: {
          created_at: string | null
          deadline: string | null
          description: string
          id: string
          priority: string | null
          project_id: string
          responsible: string | null
          risk_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          description: string
          id?: string
          priority?: string | null
          project_id: string
          responsible?: string | null
          risk_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          description?: string
          id?: string
          priority?: string | null
          project_id?: string
          responsible?: string | null
          risk_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_actions_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "ks_project_risks"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_activity_log: {
        Row: {
          activity_description: string
          activity_type: string
          company_id: string
          created_at: string | null
          id: string
          performed_by_name: string | null
          performed_by_user_id: string | null
          project_id: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          activity_description: string
          activity_type: string
          company_id: string
          created_at?: string | null
          id?: string
          performed_by_name?: string | null
          performed_by_user_id?: string | null
          project_id: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          activity_description?: string
          activity_type?: string
          company_id?: string
          created_at?: string | null
          id?: string
          performed_by_name?: string | null
          performed_by_user_id?: string | null
          project_id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_chat_messages: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_chat_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_client: {
        Row: {
          address: string | null
          city: string | null
          client_name: string
          client_type: string
          company_id: string
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          postal_code: string | null
          project_id: string
          project_manager: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_name: string
          client_type?: string
          company_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          project_id: string
          project_manager?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          client_name?: string
          client_type?: string
          company_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          project_id?: string
          project_manager?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_client_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_client_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_client_approvals: {
        Row: {
          approval_date: string
          approval_description: string | null
          approval_type: string
          approved_by_name: string
          company_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          notes: string | null
          project_id: string
          signature_data: string | null
        }
        Insert: {
          approval_date?: string
          approval_description?: string | null
          approval_type: string
          approved_by_name: string
          company_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          project_id: string
          signature_data?: string | null
        }
        Update: {
          approval_date?: string
          approval_description?: string | null
          approval_type?: string
          approved_by_name?: string
          company_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          project_id?: string
          signature_data?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_client_approvals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_client_approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_client_checklist: {
        Row: {
          checklist_item: string
          company_id: string
          completed_by_name: string | null
          completed_date: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          notes: string | null
          project_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          checklist_item: string
          company_id: string
          completed_by_name?: string | null
          completed_date?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          project_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          checklist_item?: string
          company_id?: string
          completed_by_name?: string | null
          completed_date?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          project_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_client_checklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_client_checklist_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_client_messages: {
        Row: {
          attachment_paths: string[] | null
          company_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_content: string
          message_type: string
          project_id: string
          sent_by_name: string
          sent_by_user_id: string | null
          subject: string
        }
        Insert: {
          attachment_paths?: string[] | null
          company_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_content: string
          message_type?: string
          project_id: string
          sent_by_name: string
          sent_by_user_id?: string | null
          subject: string
        }
        Update: {
          attachment_paths?: string[] | null
          company_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_content?: string
          message_type?: string
          project_id?: string
          sent_by_name?: string
          sent_by_user_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_client_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_client_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_client_messages_sent_by_user_id_fkey"
            columns: ["sent_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_coordinators: {
        Row: {
          company_id: string
          contract_document_path: string | null
          coordinator_company: string | null
          coordinator_name: string
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          project_id: string
          role_type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          contract_document_path?: string | null
          coordinator_company?: string | null
          coordinator_name: string
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          project_id: string
          role_type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          contract_document_path?: string | null
          coordinator_company?: string | null
          coordinator_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          project_id?: string
          role_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_coordinators_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_coordinators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_deviations: {
        Row: {
          additional_info: string | null
          ansvarlig: string | null
          avvik_nummer: string
          beskrivelse: string | null
          company_id: string
          consequences: string | null
          created_at: string
          frist: string | null
          id: string
          immediate_actions: string | null
          incident_location: string | null
          incident_time: string | null
          incident_type: string | null
          involved_persons: string | null
          is_subcontractor_deviation: boolean | null
          kategori: string
          notify_arbeidstilsynet: boolean | null
          notify_insurance: boolean | null
          oppdaget_dato: string
          oppdaget_sted: string | null
          preventive_measures: string | null
          prioritet: string
          project_id: string
          reporter_contact: string | null
          responsible_receiver: string | null
          root_cause_analysis: string | null
          severity: string | null
          status: string
          subcontractor_id: string | null
          tittel: string
          type: string
          updated_at: string
        }
        Insert: {
          additional_info?: string | null
          ansvarlig?: string | null
          avvik_nummer: string
          beskrivelse?: string | null
          company_id: string
          consequences?: string | null
          created_at?: string
          frist?: string | null
          id?: string
          immediate_actions?: string | null
          incident_location?: string | null
          incident_time?: string | null
          incident_type?: string | null
          involved_persons?: string | null
          is_subcontractor_deviation?: boolean | null
          kategori: string
          notify_arbeidstilsynet?: boolean | null
          notify_insurance?: boolean | null
          oppdaget_dato?: string
          oppdaget_sted?: string | null
          preventive_measures?: string | null
          prioritet: string
          project_id: string
          reporter_contact?: string | null
          responsible_receiver?: string | null
          root_cause_analysis?: string | null
          severity?: string | null
          status?: string
          subcontractor_id?: string | null
          tittel: string
          type?: string
          updated_at?: string
        }
        Update: {
          additional_info?: string | null
          ansvarlig?: string | null
          avvik_nummer?: string
          beskrivelse?: string | null
          company_id?: string
          consequences?: string | null
          created_at?: string
          frist?: string | null
          id?: string
          immediate_actions?: string | null
          incident_location?: string | null
          incident_time?: string | null
          incident_type?: string | null
          involved_persons?: string | null
          is_subcontractor_deviation?: boolean | null
          kategori?: string
          notify_arbeidstilsynet?: boolean | null
          notify_insurance?: boolean | null
          oppdaget_dato?: string
          oppdaget_sted?: string | null
          preventive_measures?: string | null
          prioritet?: string
          project_id?: string
          reporter_contact?: string | null
          responsible_receiver?: string | null
          root_cause_analysis?: string | null
          severity?: string | null
          status?: string
          subcontractor_id?: string | null
          tittel?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_deviations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_deviations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_deviations_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "ks_project_subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_documents: {
        Row: {
          category: string
          company_id: string
          created_at: string
          description: string | null
          document_name: string
          document_number: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          include_in_report: boolean | null
          is_latest_version: boolean
          project_id: string
          source_id: string | null
          source_type: string | null
          supersedes_document_id: string | null
          updated_at: string
          uploaded_by: string | null
          uploaded_by_name: string
          version: number
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          description?: string | null
          document_name: string
          document_number?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          include_in_report?: boolean | null
          is_latest_version?: boolean
          project_id: string
          source_id?: string | null
          source_type?: string | null
          supersedes_document_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name: string
          version?: number
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          document_name?: string
          document_number?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          include_in_report?: boolean | null
          is_latest_version?: boolean
          project_id?: string
          source_id?: string | null
          source_type?: string | null
          supersedes_document_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_documents_supersedes_document_id_fkey"
            columns: ["supersedes_document_id"]
            isOneToOne: false
            referencedRelation: "ks_project_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_goals: {
        Row: {
          created_at: string | null
          goal_text: string
          id: string
          is_predefined: boolean | null
          project_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          goal_text: string
          id?: string
          is_predefined?: boolean | null
          project_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          goal_text?: string
          id?: string
          is_predefined?: boolean | null
          project_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_inspections: {
        Row: {
          adresse: string | null
          beskrivelse: string | null
          city: string | null
          company_id: string
          created_at: string | null
          gyldig_til: string | null
          id: string
          inspection_date: string
          inspection_type: string
          kunde_navn: string | null
          område: string | null
          opprettet_av_navn: string | null
          opprettet_av_user_id: string | null
          planlagt_start: string | null
          postal_code: string | null
          pris: number | null
          project_id: string
          results: Json | null
          sluttdato: string | null
          startdato: string | null
          status: string
          template_id: string | null
          tidspunkt: string | null
          tittel: string | null
          updated_at: string | null
        }
        Insert: {
          adresse?: string | null
          beskrivelse?: string | null
          city?: string | null
          company_id: string
          created_at?: string | null
          gyldig_til?: string | null
          id?: string
          inspection_date: string
          inspection_type?: string
          kunde_navn?: string | null
          område?: string | null
          opprettet_av_navn?: string | null
          opprettet_av_user_id?: string | null
          planlagt_start?: string | null
          postal_code?: string | null
          pris?: number | null
          project_id: string
          results?: Json | null
          sluttdato?: string | null
          startdato?: string | null
          status?: string
          template_id?: string | null
          tidspunkt?: string | null
          tittel?: string | null
          updated_at?: string | null
        }
        Update: {
          adresse?: string | null
          beskrivelse?: string | null
          city?: string | null
          company_id?: string
          created_at?: string | null
          gyldig_til?: string | null
          id?: string
          inspection_date?: string
          inspection_type?: string
          kunde_navn?: string | null
          område?: string | null
          opprettet_av_navn?: string | null
          opprettet_av_user_id?: string | null
          planlagt_start?: string | null
          postal_code?: string | null
          pris?: number | null
          project_id?: string
          results?: Json | null
          sluttdato?: string | null
          startdato?: string | null
          status?: string
          template_id?: string | null
          tidspunkt?: string | null
          tittel?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_inspections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_inspections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ks_vernerunde_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_organization: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id?: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_organization_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_required_competencies: {
        Row: {
          competency_name: string
          created_at: string | null
          id: string
          is_required: boolean | null
          project_id: string
        }
        Insert: {
          competency_name: string
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          project_id: string
        }
        Update: {
          competency_name?: string
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_required_competencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_responsibilities: {
        Row: {
          ansvarlig_navn: string
          created_at: string | null
          funksjon: string
          id: string
          project_id: string
          role_type: string
          updated_at: string | null
        }
        Insert: {
          ansvarlig_navn: string
          created_at?: string | null
          funksjon: string
          id?: string
          project_id: string
          role_type: string
          updated_at?: string | null
        }
        Update: {
          ansvarlig_navn?: string
          created_at?: string | null
          funksjon?: string
          id?: string
          project_id?: string
          role_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_responsibilities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_risks: {
        Row: {
          consequence: number
          created_at: string | null
          deadline: string | null
          hazard: string
          id: string
          measures: string | null
          probability: number
          project_id: string
          responsible: string | null
          risk_score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          consequence: number
          created_at?: string | null
          deadline?: string | null
          hazard: string
          id?: string
          measures?: string | null
          probability: number
          project_id: string
          responsible?: string | null
          risk_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          consequence?: number
          created_at?: string | null
          deadline?: string | null
          hazard?: string
          id?: string
          measures?: string | null
          probability?: number
          project_id?: string
          responsible?: string | null
          risk_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_routines: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          routine_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          routine_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          routine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_routines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_routines_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "ks_routines"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_subcontractors: {
        Row: {
          approval_date: string | null
          approval_notes: string | null
          approval_status: string | null
          approved_by: string | null
          company_id: string
          contact_email: string
          contact_person: string
          contact_phone: string | null
          contract_value: number | null
          created_at: string
          end_date: string | null
          id: string
          org_number: string | null
          project_id: string
          start_date: string | null
          status: string
          subcontractor_name: string
          updated_at: string
          user_id: string | null
          work_description: string | null
          work_scope: string
        }
        Insert: {
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_by?: string | null
          company_id: string
          contact_email: string
          contact_person: string
          contact_phone?: string | null
          contract_value?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          org_number?: string | null
          project_id: string
          start_date?: string | null
          status?: string
          subcontractor_name: string
          updated_at?: string
          user_id?: string | null
          work_description?: string | null
          work_scope: string
        }
        Update: {
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_by?: string | null
          company_id?: string
          contact_email?: string
          contact_person?: string
          contact_phone?: string | null
          contract_value?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          org_number?: string | null
          project_id?: string
          start_date?: string | null
          status?: string
          subcontractor_name?: string
          updated_at?: string
          user_id?: string | null
          work_description?: string | null
          work_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_subcontractors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_subcontractors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_subcontractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_subcontractors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_project_team_members: {
        Row: {
          created_at: string | null
          employee_id: string | null
          employee_name: string
          id: string
          project_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          employee_name: string
          id?: string
          project_id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          employee_name?: string
          id?: string
          project_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_project_team_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_projects: {
        Row: {
          address: string | null
          aktive_rutiner: string[] | null
          ansvarlig_kontrollerende: string | null
          ansvarlig_kontrollerende_funksjon: string | null
          ansvarlig_prosjekterende: string | null
          ansvarlig_prosjekterende_funksjon: string | null
          ansvarlig_soker: string | null
          ansvarlig_soker_funksjon: string | null
          ansvarlig_soker_info: string | null
          ansvarlig_utforende: string | null
          ansvarlig_utforende_funksjon: string | null
          ansvarsrolle: string | null
          byggherre_kontakt: string | null
          byggherre_org_nr: string | null
          client_name: string | null
          company_id: string
          created_at: string | null
          created_by_user_id: string | null
          end_date: string | null
          ferdigbefaring_dato: string | null
          hva_skal_bygges: string | null
          id: string
          kompetanse_krav: string[] | null
          kontroll_for_lukking_dato: string | null
          motefrekvens: string | null
          name: string
          planlagte_milepeler: string | null
          project_number: string | null
          prosjekt_funksjon: string | null
          sluttbefaring_dato: string | null
          spesialkompetanse: string | null
          start_date: string
          status: string | null
          tiltaksklasse: string | null
          tiltaksomrade: string | null
          tiltakstype: string | null
          ue_kompetanse_krav: string | null
          ue_oppfolging_plan: string | null
          updated_at: string | null
          valgte_sjekklister: string[] | null
        }
        Insert: {
          address?: string | null
          aktive_rutiner?: string[] | null
          ansvarlig_kontrollerende?: string | null
          ansvarlig_kontrollerende_funksjon?: string | null
          ansvarlig_prosjekterende?: string | null
          ansvarlig_prosjekterende_funksjon?: string | null
          ansvarlig_soker?: string | null
          ansvarlig_soker_funksjon?: string | null
          ansvarlig_soker_info?: string | null
          ansvarlig_utforende?: string | null
          ansvarlig_utforende_funksjon?: string | null
          ansvarsrolle?: string | null
          byggherre_kontakt?: string | null
          byggherre_org_nr?: string | null
          client_name?: string | null
          company_id: string
          created_at?: string | null
          created_by_user_id?: string | null
          end_date?: string | null
          ferdigbefaring_dato?: string | null
          hva_skal_bygges?: string | null
          id?: string
          kompetanse_krav?: string[] | null
          kontroll_for_lukking_dato?: string | null
          motefrekvens?: string | null
          name: string
          planlagte_milepeler?: string | null
          project_number?: string | null
          prosjekt_funksjon?: string | null
          sluttbefaring_dato?: string | null
          spesialkompetanse?: string | null
          start_date: string
          status?: string | null
          tiltaksklasse?: string | null
          tiltaksomrade?: string | null
          tiltakstype?: string | null
          ue_kompetanse_krav?: string | null
          ue_oppfolging_plan?: string | null
          updated_at?: string | null
          valgte_sjekklister?: string[] | null
        }
        Update: {
          address?: string | null
          aktive_rutiner?: string[] | null
          ansvarlig_kontrollerende?: string | null
          ansvarlig_kontrollerende_funksjon?: string | null
          ansvarlig_prosjekterende?: string | null
          ansvarlig_prosjekterende_funksjon?: string | null
          ansvarlig_soker?: string | null
          ansvarlig_soker_funksjon?: string | null
          ansvarlig_soker_info?: string | null
          ansvarlig_utforende?: string | null
          ansvarlig_utforende_funksjon?: string | null
          ansvarsrolle?: string | null
          byggherre_kontakt?: string | null
          byggherre_org_nr?: string | null
          client_name?: string | null
          company_id?: string
          created_at?: string | null
          created_by_user_id?: string | null
          end_date?: string | null
          ferdigbefaring_dato?: string | null
          hva_skal_bygges?: string | null
          id?: string
          kompetanse_krav?: string[] | null
          kontroll_for_lukking_dato?: string | null
          motefrekvens?: string | null
          name?: string
          planlagte_milepeler?: string | null
          project_number?: string | null
          prosjekt_funksjon?: string | null
          sluttbefaring_dato?: string | null
          spesialkompetanse?: string | null
          start_date?: string
          status?: string | null
          tiltaksklasse?: string | null
          tiltaksomrade?: string | null
          tiltakstype?: string | null
          ue_kompetanse_krav?: string | null
          ue_oppfolging_plan?: string | null
          updated_at?: string | null
          valgte_sjekklister?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_routines: {
        Row: {
          category: string | null
          company_id: string
          created_at: string | null
          examples: string | null
          file_path: string | null
          id: string
          name: string
          notes: string | null
          procedure: string | null
          purpose: string | null
          responsibility: string | null
          routine_number: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string | null
          examples?: string | null
          file_path?: string | null
          id?: string
          name: string
          notes?: string | null
          procedure?: string | null
          purpose?: string | null
          responsibility?: string | null
          routine_number: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string | null
          examples?: string | null
          file_path?: string | null
          id?: string
          name?: string
          notes?: string | null
          procedure?: string | null
          purpose?: string | null
          responsibility?: string | null
          routine_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_routines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_safety_round_results: {
        Row: {
          checkpoint_id: string
          comment: string | null
          company_id: string
          created_at: string | null
          id: string
          photo_paths: string[] | null
          safety_round_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          checkpoint_id: string
          comment?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          photo_paths?: string[] | null
          safety_round_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          checkpoint_id?: string
          comment?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          photo_paths?: string[] | null
          safety_round_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_safety_round_results_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "ks_vernerunde_checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_safety_round_results_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_safety_round_results_safety_round_id_fkey"
            columns: ["safety_round_id"]
            isOneToOne: false
            referencedRelation: "ks_safety_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_safety_rounds: {
        Row: {
          actions_required: string | null
          company_id: string
          created_at: string | null
          deadline: string | null
          findings: string | null
          id: string
          participants: string | null
          photo_paths: string[] | null
          project_id: string
          responsible: string | null
          round_date: string
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          actions_required?: string | null
          company_id: string
          created_at?: string | null
          deadline?: string | null
          findings?: string | null
          id?: string
          participants?: string | null
          photo_paths?: string[] | null
          project_id: string
          responsible?: string | null
          round_date: string
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actions_required?: string | null
          company_id?: string
          created_at?: string | null
          deadline?: string | null
          findings?: string | null
          id?: string
          participants?: string | null
          photo_paths?: string[] | null
          project_id?: string
          responsible?: string | null
          round_date?: string
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_safety_rounds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_safety_rounds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_safety_rounds_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ks_vernerunde_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_self_declarations: {
        Row: {
          city: string | null
          company_address: string | null
          company_id: string
          company_name: string
          country: string | null
          created_at: string
          declaration_date: string | null
          id: string
          manager_name: string | null
          manager_signature: string | null
          manager_signed_at: string | null
          postal_code: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          company_address?: string | null
          company_id: string
          company_name: string
          country?: string | null
          created_at?: string
          declaration_date?: string | null
          id?: string
          manager_name?: string | null
          manager_signature?: string | null
          manager_signed_at?: string | null
          postal_code?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          company_address?: string | null
          company_id?: string
          company_name?: string
          country?: string | null
          created_at?: string
          declaration_date?: string | null
          id?: string
          manager_name?: string | null
          manager_signature?: string | null
          manager_signed_at?: string | null
          postal_code?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_self_declarations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_sja: {
        Row: {
          aktivitet: string | null
          company_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          date: string | null
          hazards_json: Json | null
          id: string
          identifisert_risiko: string | null
          location: string | null
          participants: string | null
          project_id: string | null
          risikoreduserende_tiltak: string | null
          sja_nr: string | null
          status: string | null
          tiltak_dato: string | null
          tiltak_navn: string | null
          tiltak_sted: string | null
          title: string
          updated_at: string | null
          utfort_dato: string | null
          utfort_navn: string | null
          utfort_sted: string | null
          work_description: string | null
        }
        Insert: {
          aktivitet?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          date?: string | null
          hazards_json?: Json | null
          id?: string
          identifisert_risiko?: string | null
          location?: string | null
          participants?: string | null
          project_id?: string | null
          risikoreduserende_tiltak?: string | null
          sja_nr?: string | null
          status?: string | null
          tiltak_dato?: string | null
          tiltak_navn?: string | null
          tiltak_sted?: string | null
          title: string
          updated_at?: string | null
          utfort_dato?: string | null
          utfort_navn?: string | null
          utfort_sted?: string | null
          work_description?: string | null
        }
        Update: {
          aktivitet?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          date?: string | null
          hazards_json?: Json | null
          id?: string
          identifisert_risiko?: string | null
          location?: string | null
          participants?: string | null
          project_id?: string | null
          risikoreduserende_tiltak?: string | null
          sja_nr?: string | null
          status?: string | null
          tiltak_dato?: string | null
          tiltak_navn?: string | null
          tiltak_sted?: string | null
          title?: string
          updated_at?: string | null
          utfort_dato?: string | null
          utfort_navn?: string | null
          utfort_sted?: string | null
          work_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_sja_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_sja_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_subcontractor_competence: {
        Row: {
          company_id: string
          created_at: string
          document_name: string
          document_number: string | null
          document_type: string
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          issue_date: string | null
          notes: string | null
          subcontractor_id: string
          updated_at: string
          uploaded_by: string | null
          uploaded_by_name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          document_name: string
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          subcontractor_id: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          document_name?: string
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          subcontractor_id?: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_subcontractor_competence_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_subcontractor_competence_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "ks_project_subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_subcontractor_competence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_subcontractor_contracts: {
        Row: {
          company_id: string
          contract_date: string | null
          contract_name: string
          contract_number: string | null
          contract_value: number | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          subcontractor_id: string
          updated_at: string
          uploaded_by: string | null
          uploaded_by_name: string
        }
        Insert: {
          company_id: string
          contract_date?: string | null
          contract_name: string
          contract_number?: string | null
          contract_value?: number | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          subcontractor_id: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name: string
        }
        Update: {
          company_id?: string
          contract_date?: string | null
          contract_name?: string
          contract_number?: string | null
          contract_value?: number | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          subcontractor_id?: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_subcontractor_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_subcontractor_contracts_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "ks_project_subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_subcontractor_contracts_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_subcontractor_evaluations: {
        Row: {
          andre_sertifikater: boolean | null
          andre_sertifikater_comment: string | null
          arbeidskapasitet: boolean | null
          arbeidskapasitet_comment: string | null
          company_id: string
          created_at: string | null
          endringer_siden_sist: boolean | null
          endringer_siden_sist_comment: string | null
          erfaring_kompetanse: boolean | null
          erfaring_kompetanse_comment: string | null
          evaluated_at: string | null
          evaluated_by: string | null
          evaluated_by_name: string
          forsikringer: boolean | null
          forsikringer_comment: string | null
          garantier: boolean | null
          garantier_comment: string | null
          godkjenning_for_arbeid: boolean | null
          godkjenning_for_arbeid_comment: string | null
          hms_system: boolean | null
          hms_system_comment: string | null
          id: string
          jobbet_for_oss_for: boolean | null
          jobbet_for_oss_for_comment: string | null
          kan_brukes: string | null
          konklusjon_notes: string | null
          kontrakt: boolean | null
          kontrakt_comment: string | null
          kvalitetssystem: boolean | null
          kvalitetssystem_comment: string | null
          lokal_godkjenning: boolean | null
          lokal_godkjenning_comment: string | null
          lonnsklausuler: boolean | null
          lonnsklausuler_comment: string | null
          okonomi: boolean | null
          okonomi_comment: string | null
          paseplikt: boolean | null
          paseplikt_comment: string | null
          referanseprosjekter: boolean | null
          referanseprosjekter_comment: string | null
          sentral_godkjenning: boolean | null
          sentral_godkjenning_comment: string | null
          subcontractor_id: string
          updated_at: string | null
        }
        Insert: {
          andre_sertifikater?: boolean | null
          andre_sertifikater_comment?: string | null
          arbeidskapasitet?: boolean | null
          arbeidskapasitet_comment?: string | null
          company_id: string
          created_at?: string | null
          endringer_siden_sist?: boolean | null
          endringer_siden_sist_comment?: string | null
          erfaring_kompetanse?: boolean | null
          erfaring_kompetanse_comment?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluated_by_name: string
          forsikringer?: boolean | null
          forsikringer_comment?: string | null
          garantier?: boolean | null
          garantier_comment?: string | null
          godkjenning_for_arbeid?: boolean | null
          godkjenning_for_arbeid_comment?: string | null
          hms_system?: boolean | null
          hms_system_comment?: string | null
          id?: string
          jobbet_for_oss_for?: boolean | null
          jobbet_for_oss_for_comment?: string | null
          kan_brukes?: string | null
          konklusjon_notes?: string | null
          kontrakt?: boolean | null
          kontrakt_comment?: string | null
          kvalitetssystem?: boolean | null
          kvalitetssystem_comment?: string | null
          lokal_godkjenning?: boolean | null
          lokal_godkjenning_comment?: string | null
          lonnsklausuler?: boolean | null
          lonnsklausuler_comment?: string | null
          okonomi?: boolean | null
          okonomi_comment?: string | null
          paseplikt?: boolean | null
          paseplikt_comment?: string | null
          referanseprosjekter?: boolean | null
          referanseprosjekter_comment?: string | null
          sentral_godkjenning?: boolean | null
          sentral_godkjenning_comment?: string | null
          subcontractor_id: string
          updated_at?: string | null
        }
        Update: {
          andre_sertifikater?: boolean | null
          andre_sertifikater_comment?: string | null
          arbeidskapasitet?: boolean | null
          arbeidskapasitet_comment?: string | null
          company_id?: string
          created_at?: string | null
          endringer_siden_sist?: boolean | null
          endringer_siden_sist_comment?: string | null
          erfaring_kompetanse?: boolean | null
          erfaring_kompetanse_comment?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluated_by_name?: string
          forsikringer?: boolean | null
          forsikringer_comment?: string | null
          garantier?: boolean | null
          garantier_comment?: string | null
          godkjenning_for_arbeid?: boolean | null
          godkjenning_for_arbeid_comment?: string | null
          hms_system?: boolean | null
          hms_system_comment?: string | null
          id?: string
          jobbet_for_oss_for?: boolean | null
          jobbet_for_oss_for_comment?: string | null
          kan_brukes?: string | null
          konklusjon_notes?: string | null
          kontrakt?: boolean | null
          kontrakt_comment?: string | null
          kvalitetssystem?: boolean | null
          kvalitetssystem_comment?: string | null
          lokal_godkjenning?: boolean | null
          lokal_godkjenning_comment?: string | null
          lonnsklausuler?: boolean | null
          lonnsklausuler_comment?: string | null
          okonomi?: boolean | null
          okonomi_comment?: string | null
          paseplikt?: boolean | null
          paseplikt_comment?: string | null
          referanseprosjekter?: boolean | null
          referanseprosjekter_comment?: string | null
          sentral_godkjenning?: boolean | null
          sentral_godkjenning_comment?: string | null
          subcontractor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_subcontractor_evaluations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_subcontractor_evaluations_evaluated_by_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_subcontractor_evaluations_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "ks_project_subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_subcontractor_inspections: {
        Row: {
          company_id: string
          corrective_actions: string | null
          created_at: string
          findings: string | null
          id: string
          inspection_date: string
          inspector_name: string
          photo_paths: string[] | null
          project_id: string
          status: string
          subcontractor_id: string
          updated_at: string
          work_area: string
        }
        Insert: {
          company_id: string
          corrective_actions?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          inspection_date: string
          inspector_name: string
          photo_paths?: string[] | null
          project_id: string
          status: string
          subcontractor_id: string
          updated_at?: string
          work_area: string
        }
        Update: {
          company_id?: string
          corrective_actions?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          inspection_date?: string
          inspector_name?: string
          photo_paths?: string[] | null
          project_id?: string
          status?: string
          subcontractor_id?: string
          updated_at?: string
          work_area?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_subcontractor_inspections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_subcontractor_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_subcontractor_inspections_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "ks_project_subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_template_items: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string | null
          help_text: string | null
          id: string
          order_index: number
          template_id: string
          text: string
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          help_text?: string | null
          id?: string
          order_index: number
          template_id: string
          text: string
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          help_text?: string | null
          id?: string
          order_index?: number
          template_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_template_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ks_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_templates: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_system_default: boolean | null
          name: string
          phase: string | null
          trade: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_default?: boolean | null
          name: string
          phase?: string | null
          trade?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_default?: boolean | null
          name?: string
          phase?: string | null
          trade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_vernerunde_checkpoints: {
        Row: {
          category: string | null
          company_id: string
          created_at: string | null
          id: string
          order_index: number
          template_id: string
          text: string
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          order_index?: number
          template_id: string
          text: string
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          order_index?: number
          template_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "ks_vernerunde_checkpoints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ks_vernerunde_checkpoints_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ks_vernerunde_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_vernerunde_templates: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_predefined: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_predefined?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_predefined?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_vernerunde_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      module_orders: {
        Row: {
          company_id: string
          created_at: string
          id: string
          module_type: string
          ordered_by_email: string
          ordered_by_id: string | null
          ordered_by_name: string
          price_monthly: number
          status: string
          terms_accepted: boolean
          terms_accepted_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          module_type: string
          ordered_by_email: string
          ordered_by_id?: string | null
          ordered_by_name: string
          price_monthly: number
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          module_type?: string
          ordered_by_email?: string
          ordered_by_id?: string | null
          ordered_by_name?: string
          price_monthly?: number
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      module_pricing: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          module_name: string
          module_type: string
          price_monthly: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          module_name: string
          module_type: string
          price_monthly: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          module_name?: string
          module_type?: string
          price_monthly?: number
          updated_at?: string
        }
        Relationships: []
      }
      nextcom_processed_orders: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          order_id: string
          processed_at: string | null
          result: Json | null
          status: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          order_id: string
          processed_at?: string | null
          result?: Json | null
          status?: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          order_id?: string
          processed_at?: string | null
          result?: Json | null
          status?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          body: string
          company_id: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          notification_type: string
          project_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          company_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          notification_type: string
          project_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          notification_type?: string
          project_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      org_chart_node_persons: {
        Row: {
          created_at: string
          id: string
          node_id: string
          person_email: string | null
          person_name: string
          profile_id: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          node_id: string
          person_email?: string | null
          person_name: string
          profile_id?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          node_id?: string
          person_email?: string | null
          person_name?: string
          profile_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_chart_node_persons_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "org_chart_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_chart_node_persons_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_chart_nodes: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          id: string
          is_root: boolean
          parent_node_id: string | null
          role_description: string | null
          role_title: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          id?: string
          is_root?: boolean
          parent_node_id?: string | null
          role_description?: string | null
          role_title: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          id?: string
          is_root?: boolean
          parent_node_id?: string | null
          role_description?: string | null
          role_title?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_chart_nodes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_chart_nodes_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_chart_nodes_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "org_chart_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      personalhandbok_chapters: {
        Row: {
          company_id: string
          content: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          is_default: boolean
          last_edited_by_id: string | null
          last_edited_by_name: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          company_id: string
          content?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_edited_by_id?: string | null
          last_edited_by_name?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_edited_by_id?: string | null
          last_edited_by_name?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "personalhandbok_chapters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personalhandbok_chapters_last_edited_by_id_fkey"
            columns: ["last_edited_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personalhandbok_confirmations: {
        Row: {
          company_id: string
          confirmed_at: string
          created_at: string
          handbook_version: number
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          confirmed_at?: string
          created_at?: string
          handbook_version?: number
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          confirmed_at?: string
          created_at?: string
          handbook_version?: number
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personalhandbok_confirmations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personalhandbok_confirmations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string | null
          hms_card_expiry_date: string | null
          hms_card_number: string | null
          hms_card_obtained: boolean | null
          hms_card_reminder_sent_30_days: boolean | null
          hms_card_reminder_sent_60_days: boolean | null
          hms_card_reminder_sent_7_days: boolean | null
          hms_card_reminder_sent_90_days: boolean | null
          hms_card_required: boolean | null
          id: string
          is_active: boolean
          is_assigned_to_main: boolean | null
          is_hms_responsible: boolean | null
          is_verneombud: boolean | null
          last_name: string | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          next_of_kin_relation: string | null
          phone: string | null
          preferred_language: string | null
          primary_department_id: string | null
          signature_data: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          hms_card_expiry_date?: string | null
          hms_card_number?: string | null
          hms_card_obtained?: boolean | null
          hms_card_reminder_sent_30_days?: boolean | null
          hms_card_reminder_sent_60_days?: boolean | null
          hms_card_reminder_sent_7_days?: boolean | null
          hms_card_reminder_sent_90_days?: boolean | null
          hms_card_required?: boolean | null
          id?: string
          is_active?: boolean
          is_assigned_to_main?: boolean | null
          is_hms_responsible?: boolean | null
          is_verneombud?: boolean | null
          last_name?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relation?: string | null
          phone?: string | null
          preferred_language?: string | null
          primary_department_id?: string | null
          signature_data?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          hms_card_expiry_date?: string | null
          hms_card_number?: string | null
          hms_card_obtained?: boolean | null
          hms_card_reminder_sent_30_days?: boolean | null
          hms_card_reminder_sent_60_days?: boolean | null
          hms_card_reminder_sent_7_days?: boolean | null
          hms_card_reminder_sent_90_days?: boolean | null
          hms_card_required?: boolean | null
          id?: string
          is_active?: boolean
          is_assigned_to_main?: boolean | null
          is_hms_responsible?: boolean | null
          is_verneombud?: boolean | null
          last_name?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relation?: string | null
          phone?: string | null
          preferred_language?: string | null
          primary_department_id?: string | null
          signature_data?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_primary_department_id_fkey"
            columns: ["primary_department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          company_id: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          company_id: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          company_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      setup_wizard_progress: {
        Row: {
          company_id: string
          completed_steps: string[] | null
          created_at: string
          current_step: number
          id: string
          is_completed: boolean | null
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_steps?: string[] | null
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_steps?: string[] | null
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setup_wizard_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_requests: {
        Row: {
          absence_reason: string | null
          company_id: string
          created_at: string
          handled_at: string | null
          handled_by_id: string | null
          handled_by_name: string | null
          id: string
          is_open_request: boolean | null
          proposed_date: string | null
          proposed_end_time: string | null
          proposed_location: string | null
          proposed_role: string | null
          proposed_start_time: string | null
          request_notes: string | null
          request_type: string
          requester_id: string
          requester_name: string
          response_notes: string | null
          schedule_id: string | null
          status: string
          target_employee_id: string | null
          target_employee_name: string | null
          updated_at: string
        }
        Insert: {
          absence_reason?: string | null
          company_id: string
          created_at?: string
          handled_at?: string | null
          handled_by_id?: string | null
          handled_by_name?: string | null
          id?: string
          is_open_request?: boolean | null
          proposed_date?: string | null
          proposed_end_time?: string | null
          proposed_location?: string | null
          proposed_role?: string | null
          proposed_start_time?: string | null
          request_notes?: string | null
          request_type: string
          requester_id: string
          requester_name: string
          response_notes?: string | null
          schedule_id?: string | null
          status?: string
          target_employee_id?: string | null
          target_employee_name?: string | null
          updated_at?: string
        }
        Update: {
          absence_reason?: string | null
          company_id?: string
          created_at?: string
          handled_at?: string | null
          handled_by_id?: string | null
          handled_by_name?: string | null
          id?: string
          is_open_request?: boolean | null
          proposed_date?: string | null
          proposed_end_time?: string | null
          proposed_location?: string | null
          proposed_role?: string | null
          proposed_start_time?: string | null
          request_notes?: string | null
          request_type?: string
          requester_id?: string
          requester_name?: string
          response_notes?: string | null
          schedule_id?: string | null
          status?: string
          target_employee_id?: string | null
          target_employee_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_requests_handled_by_id_fkey"
            columns: ["handled_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_requests_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_requests_target_employee_id_fkey"
            columns: ["target_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_tasks: {
        Row: {
          company_id: string
          completed_at: string | null
          completed_by_id: string | null
          completed_by_name: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          schedule_id: string
          task_name: string
          task_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          schedule_id: string
          task_name: string
          task_type?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          completed_by_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          schedule_id?: string
          task_name?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_tasks_completed_by_id_fkey"
            columns: ["completed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_tasks_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_project_inspections: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          findings: Json | null
          id: string
          inspection_date: string
          inspection_number: string
          location: string | null
          notes: string | null
          participants: string | null
          photos: string[] | null
          project_id: string
          status: string
          title: string
          updated_at: string
          weather: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          findings?: Json | null
          id?: string
          inspection_date?: string
          inspection_number: string
          location?: string | null
          notes?: string | null
          participants?: string | null
          photos?: string[] | null
          project_id: string
          status?: string
          title: string
          updated_at?: string
          weather?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          findings?: Json | null
          id?: string
          inspection_date?: string
          inspection_number?: string
          location?: string | null
          notes?: string | null
          participants?: string | null
          photos?: string[] | null
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simple_project_inspections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simple_project_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_project_notes: {
        Row: {
          company_id: string
          content: string
          created_at: string
          created_by_id: string | null
          created_by_name: string
          id: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string
          id?: string
          project_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simple_project_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simple_project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_project_photos: {
        Row: {
          caption: string | null
          company_id: string
          created_at: string
          created_by_id: string | null
          created_by_name: string
          file_path: string
          id: string
          project_id: string
        }
        Insert: {
          caption?: string | null
          company_id: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string
          file_path: string
          id?: string
          project_id: string
        }
        Update: {
          caption?: string | null
          company_id?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string
          file_path?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simple_project_photos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simple_project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_module2_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_work_schedules: {
        Row: {
          company_id: string
          created_at: string
          day_of_week: number
          employee_id: string
          end_time: string
          id: string
          is_active: boolean | null
          location: string | null
          shift_role: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          day_of_week: number
          employee_id: string
          end_time: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          shift_role?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          day_of_week?: number
          employee_id?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          shift_role?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "standard_work_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standard_work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          message: string
          status: string
          subject: string
          updated_at: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string | null
          id: string
          responses: Json
          submitted_at: string
          survey_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id?: string | null
          id?: string
          responses?: Json
          submitted_at?: string
          survey_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          responses?: Json
          submitted_at?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "employee_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string
          metric_value: number | null
          resolved_at: string | null
          resolved_by_id: string | null
          severity: string
          status: string
          threshold_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metric_value?: number | null
          resolved_at?: string | null
          resolved_by_id?: string | null
          severity?: string
          status?: string
          threshold_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metric_value?: number | null
          resolved_at?: string | null
          resolved_by_id?: string | null
          severity?: string
          status?: string
          threshold_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_resolved_by_id_fkey"
            columns: ["resolved_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_clock_entries: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          break_end: string | null
          break_start: string | null
          clock_in: string
          clock_out: string | null
          company_id: string
          created_at: string
          hours_worked: number | null
          id: string
          notes: string | null
          qr_code_id: string | null
          status: string
          total_break_minutes: number | null
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          break_end?: string | null
          break_start?: string | null
          clock_in?: string
          clock_out?: string | null
          company_id: string
          created_at?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          qr_code_id?: string | null
          status?: string
          total_break_minutes?: number | null
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          break_end?: string | null
          break_start?: string | null
          clock_in?: string
          clock_out?: string | null
          company_id?: string
          created_at?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          qr_code_id?: string | null
          status?: string
          total_break_minutes?: number | null
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_entries_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "time_clock_qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      time_clock_qr_codes: {
        Row: {
          code: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_qr_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_qr_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          company_id: string
          created_at: string
          department_id: string | null
          description: string | null
          entry_date: string
          hours: number
          id: string
          project_id: string | null
          project_name: string | null
          source: string | null
          status: string
          tripletex_synced: boolean | null
          tripletex_synced_at: string | null
          updated_at: string
          user_id: string
          user_name: string
          work_schedule_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          company_id: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          entry_date: string
          hours: number
          id?: string
          project_id?: string | null
          project_name?: string | null
          source?: string | null
          status?: string
          tripletex_synced?: boolean | null
          tripletex_synced_at?: string | null
          updated_at?: string
          user_id: string
          user_name: string
          work_schedule_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          company_id?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          entry_date?: string
          hours?: number
          id?: string
          project_id?: string | null
          project_name?: string | null
          source?: string | null
          status?: string
          tripletex_synced?: boolean | null
          tripletex_synced_at?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string
          work_schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_work_schedule_id_fkey"
            columns: ["work_schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off_requests: {
        Row: {
          approved_at: string | null
          approved_by_id: string | null
          approved_by_name: string | null
          company_id: string
          created_at: string
          employee_id: string
          employee_name: string
          end_date: string
          id: string
          notes: string | null
          reason: string | null
          start_date: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_id?: string | null
          approved_by_name?: string | null
          company_id: string
          created_at?: string
          employee_id: string
          employee_name: string
          end_date: string
          id?: string
          notes?: string | null
          reason?: string | null
          start_date: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by_id?: string | null
          approved_by_name?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          employee_name?: string
          end_date?: string
          id?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_approved_by_id_fkey"
            columns: ["approved_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transparency_act_assessments: {
        Row: {
          actions_taken: Json | null
          assessment_year: number
          company_id: string
          created_at: string | null
          id: string
          public_statement: string | null
          published_date: string | null
          responsible_person: string | null
          risk_areas: Json | null
          status: string | null
          supplier_assessments: Json | null
          updated_at: string | null
        }
        Insert: {
          actions_taken?: Json | null
          assessment_year: number
          company_id: string
          created_at?: string | null
          id?: string
          public_statement?: string | null
          published_date?: string | null
          responsible_person?: string | null
          risk_areas?: Json | null
          status?: string | null
          supplier_assessments?: Json | null
          updated_at?: string | null
        }
        Update: {
          actions_taken?: Json | null
          assessment_year?: number
          company_id?: string
          created_at?: string | null
          id?: string
          public_statement?: string | null
          published_date?: string | null
          responsible_person?: string | null
          risk_areas?: Json | null
          status?: string | null
          supplier_assessments?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transparency_act_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      transparency_act_requests: {
        Row: {
          company_id: string
          created_at: string | null
          handled_by_id: string | null
          handled_by_name: string | null
          id: string
          request_content: string
          request_date: string
          requester_email: string
          requester_name: string
          response_content: string | null
          response_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          handled_by_id?: string | null
          handled_by_name?: string | null
          id?: string
          request_content: string
          request_date?: string
          requester_email: string
          requester_name: string
          response_content?: string | null
          response_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          handled_by_id?: string | null
          handled_by_name?: string | null
          id?: string
          request_content?: string
          request_date?: string
          requester_email?: string
          requester_name?: string
          response_content?: string | null
          response_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transparency_act_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transparency_act_requests_handled_by_id_fkey"
            columns: ["handled_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_expense_items: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          receipt_path: string | null
          report_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description: string
          id?: string
          receipt_path?: string | null
          report_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          receipt_path?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_expense_items_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "travel_expense_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_expense_reports: {
        Row: {
          accommodation_amount: number | null
          accommodation_days: number
          accommodation_rate: number
          approved_at: string | null
          approved_by_id: string | null
          approved_by_name: string | null
          company_id: string
          created_at: string
          departure_date: string
          departure_location: string
          destination: string
          diet_amount: number | null
          diet_days: number
          diet_rate: number
          id: string
          linked_trip_ids: string[] | null
          mileage_amount: number | null
          mileage_rate: number
          notes: string | null
          other_expenses_total: number
          passenger_supplement: number
          purpose: string
          rejection_reason: string | null
          report_number: string
          return_date: string
          status: string
          submitted_at: string | null
          total_amount: number
          total_km: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accommodation_amount?: number | null
          accommodation_days?: number
          accommodation_rate?: number
          approved_at?: string | null
          approved_by_id?: string | null
          approved_by_name?: string | null
          company_id: string
          created_at?: string
          departure_date: string
          departure_location?: string
          destination: string
          diet_amount?: number | null
          diet_days?: number
          diet_rate?: number
          id?: string
          linked_trip_ids?: string[] | null
          mileage_amount?: number | null
          mileage_rate?: number
          notes?: string | null
          other_expenses_total?: number
          passenger_supplement?: number
          purpose: string
          rejection_reason?: string | null
          report_number: string
          return_date: string
          status?: string
          submitted_at?: string | null
          total_amount?: number
          total_km?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accommodation_amount?: number | null
          accommodation_days?: number
          accommodation_rate?: number
          approved_at?: string | null
          approved_by_id?: string | null
          approved_by_name?: string | null
          company_id?: string
          created_at?: string
          departure_date?: string
          departure_location?: string
          destination?: string
          diet_amount?: number | null
          diet_days?: number
          diet_rate?: number
          id?: string
          linked_trip_ids?: string[] | null
          mileage_amount?: number | null
          mileage_rate?: number
          notes?: string | null
          other_expenses_total?: number
          passenger_supplement?: number
          purpose?: string
          rejection_reason?: string | null
          report_number?: string
          return_date?: string
          status?: string
          submitted_at?: string | null
          total_amount?: number
          total_km?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_expense_reports_approved_by_id_fkey"
            columns: ["approved_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_expense_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_expense_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_departments: {
        Row: {
          created_at: string
          department_id: string
          id: string
          is_department_admin: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          is_department_admin?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          is_department_admin?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          company_id: string
          created_at: string
          id: string
          notify_assignments: boolean
          notify_days_before: number[]
          notify_deadlines: boolean
          notify_status_changes: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          notify_assignments?: boolean
          notify_days_before?: number[]
          notify_deadlines?: boolean
          notify_status_changes?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          notify_assignments?: boolean
          notify_days_before?: number[]
          notify_deadlines?: boolean
          notify_status_changes?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_provisioning_log: {
        Row: {
          all_verified: boolean | null
          auth_created: boolean | null
          company_id: string | null
          created_at: string | null
          created_by_id: string | null
          email: string
          email_sent: boolean | null
          error_message: string | null
          id: string
          profile_updated: boolean | null
          reset_link_generated: boolean | null
          role: string
          role_assigned: boolean | null
          source: string
        }
        Insert: {
          all_verified?: boolean | null
          auth_created?: boolean | null
          company_id?: string | null
          created_at?: string | null
          created_by_id?: string | null
          email: string
          email_sent?: boolean | null
          error_message?: string | null
          id?: string
          profile_updated?: boolean | null
          reset_link_generated?: boolean | null
          role?: string
          role_assigned?: boolean | null
          source?: string
        }
        Update: {
          all_verified?: boolean | null
          auth_created?: boolean | null
          company_id?: string | null
          created_at?: string | null
          created_by_id?: string | null
          email?: string
          email_sent?: boolean | null
          error_message?: string | null
          id?: string
          profile_updated?: boolean | null
          reset_link_generated?: boolean | null
          role?: string
          role_assigned?: boolean | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_provisioning_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_terms_acceptance: {
        Row: {
          accepted_at: string
          created_at: string
          id: string
          ip_address: string | null
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verneombud_agreements: {
        Row: {
          company_id: string
          created_at: string
          election_date: string | null
          election_method: string | null
          employer_name: string | null
          employer_signature: string | null
          employer_signed_at: string | null
          id: string
          notes: string | null
          status: string | null
          term_end: string | null
          term_start: string | null
          training_completed: boolean | null
          training_date: string | null
          updated_at: string
          verneombud_email: string | null
          verneombud_name: string
          verneombud_phone: string | null
          verneombud_signature: string | null
          verneombud_signed_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          election_date?: string | null
          election_method?: string | null
          employer_name?: string | null
          employer_signature?: string | null
          employer_signed_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          term_end?: string | null
          term_start?: string | null
          training_completed?: boolean | null
          training_date?: string | null
          updated_at?: string
          verneombud_email?: string | null
          verneombud_name: string
          verneombud_phone?: string | null
          verneombud_signature?: string | null
          verneombud_signed_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          election_date?: string | null
          election_method?: string | null
          employer_name?: string | null
          employer_signature?: string | null
          employer_signed_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          term_end?: string | null
          term_start?: string | null
          training_completed?: boolean | null
          training_date?: string | null
          updated_at?: string
          verneombud_email?: string | null
          verneombud_name?: string
          verneombud_phone?: string | null
          verneombud_signature?: string | null
          verneombud_signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verneombud_agreements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      verneombud_exemption_agreements: {
        Row: {
          agreement_date: string
          company_id: string
          created_at: string
          employee_signatures: Json | null
          employer_name: string
          employer_signature: string | null
          employer_signed_at: string | null
          id: string
          notes: string | null
          status: string
          total_employees: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          agreement_date?: string
          company_id: string
          created_at?: string
          employee_signatures?: Json | null
          employer_name: string
          employer_signature?: string | null
          employer_signed_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_employees: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          agreement_date?: string
          company_id?: string
          created_at?: string
          employee_signatures?: Json | null
          employer_name?: string
          employer_signature?: string | null
          employer_signed_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_employees?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verneombud_exemption_agreements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          break_minutes: number | null
          company_id: string
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          employee_id: string
          employee_name: string
          end_time: string
          id: string
          is_overtime: boolean | null
          is_responsible: boolean | null
          location: string | null
          notes: string | null
          overtime_reason: string | null
          schedule_date: string
          schedule_type: string
          shift_role: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          break_minutes?: number | null
          company_id: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          employee_id: string
          employee_name: string
          end_time: string
          id?: string
          is_overtime?: boolean | null
          is_responsible?: boolean | null
          location?: string | null
          notes?: string | null
          overtime_reason?: string | null
          schedule_date: string
          schedule_type?: string
          shift_role?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          break_minutes?: number | null
          company_id?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          employee_id?: string
          employee_name?: string
          end_time?: string
          id?: string
          is_overtime?: boolean | null
          is_responsible?: boolean | null
          location?: string | null
          notes?: string | null
          overtime_reason?: string | null
          schedule_date?: string
          schedule_type?: string
          shift_role?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_schedules_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_company_admin_role: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_function_name: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      complete_fdv_control: {
        Args: {
          p_building_id: string
          p_company_id: string
          p_completed_by_id: string
          p_completed_by_name: string
          p_control_id: string
          p_findings?: string
          p_next_due_date?: string
          p_notes?: string
          p_status: string
        }
        Returns: undefined
      }
      copy_inspection_template_seeds: {
        Args: { target_company_id: string }
        Returns: undefined
      }
      generate_anonymous_message_number: {
        Args: { p_company_id: string }
        Returns: string
      }
      generate_audit_number: { Args: never; Returns: string }
      generate_checklist_template_number: {
        Args: { p_category: string }
        Returns: string
      }
      generate_deviation_number: {
        Args: { p_prefix?: string }
        Returns: string
      }
      generate_document_template_number: {
        Args: { p_category: string }
        Returns: string
      }
      generate_forsvarlighetsvurdering_number: { Args: never; Returns: string }
      generate_hms_sja_number: { Args: never; Returns: string }
      generate_inspection_number: {
        Args: { p_company_id: string }
        Returns: string
      }
      generate_ks_daily_report_number: { Args: never; Returns: string }
      generate_ks_module2_avvik_number: { Args: never; Returns: string }
      generate_ks_module2_change_order_number: { Args: never; Returns: string }
      generate_ks_module2_claim_number: { Args: never; Returns: string }
      generate_ks_module2_meeting_number: { Args: never; Returns: string }
      generate_ks_module2_project_number: { Args: never; Returns: string }
      generate_ks_module2_routine_number: { Args: never; Returns: string }
      generate_ks_module2_sja_number: { Args: never; Returns: string }
      generate_ks_module2_uk_number: { Args: never; Returns: string }
      generate_ks_module2_vernerunde_number: { Args: never; Returns: string }
      generate_project_number: { Args: never; Returns: string }
      generate_routine_template_number: {
        Args: { p_module: string }
        Returns: string
      }
      generate_travel_expense_report_number: { Args: never; Returns: string }
      get_admin_department_ids: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_guest_project_access: {
        Args: { project_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invoke_cron_edge_function: {
        Args: { function_name: string }
        Returns: number
      }
      is_any_department_admin: { Args: { _user_id: string }; Returns: boolean }
      is_company_admin: { Args: { _user_id: string }; Returns: boolean }
      is_department_admin_for: {
        Args: { _department_id: string; _user_id: string }
        Returns: boolean
      }
      is_hms_responsible: { Args: { user_id: string }; Returns: boolean }
      is_leader_or_verneombud: { Args: { p_user_id: string }; Returns: boolean }
      is_system_admin: { Args: { _user_id: string }; Returns: boolean }
      seed_hr_meeting_templates_for_company: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      user_can_manage_fdv: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_any_role: { Args: { _user_id: string }; Returns: boolean }
      user_has_fdv_access: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      user_owns_ks2_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "system_admin"
        | "company_admin"
        | "user"
        | "subcontractor"
        | "department_admin"
      company_status: "active" | "inactive" | "suspended"
      ks_module2_access_level: "none" | "guest" | "full_ue"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "system_admin",
        "company_admin",
        "user",
        "subcontractor",
        "department_admin",
      ],
      company_status: ["active", "inactive", "suspended"],
      ks_module2_access_level: ["none", "guest", "full_ue"],
    },
  },
} as const
