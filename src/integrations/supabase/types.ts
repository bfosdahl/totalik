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
      audits: {
        Row: {
          area: string | null
          audit_number: string
          checklist_completed: number
          checklist_total: number
          company_id: string
          created_at: string
          department_id: string | null
          description: string | null
          form_type: string | null
          id: string
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
          department_id?: string | null
          description?: string | null
          form_type?: string | null
          id?: string
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
          department_id?: string | null
          description?: string | null
          form_type?: string | null
          id?: string
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
      companies: {
        Row: {
          accent_color: string | null
          address: string | null
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
          sg_approval_areas?: string[] | null
          sg_approved?: boolean | null
          sg_expiry_date?: string | null
          sg_org_number?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
        }
        Relationships: []
      }
      company_action_plans: {
        Row: {
          actions: Json
          company_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          company_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          company_id?: string
          created_at?: string
          id?: string
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
          goal_text: string
          id: string
          is_predefined: boolean | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          goal_text: string
          id?: string
          is_predefined?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          goal_text?: string
          id?: string
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
          description: string | null
          document_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          folder_id: string | null
          id: string
          is_template: boolean | null
          project_id: string | null
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
          folder_id?: string | null
          id?: string
          is_template?: boolean | null
          project_id?: string | null
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
          folder_id?: string | null
          id?: string
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
      company_ks_routines: {
        Row: {
          admin_template_id: string | null
          category: string
          company_id: string
          content: string
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          is_active: boolean | null
          routine_name: string
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
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean | null
          routine_name: string
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
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean | null
          routine_name?: string
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
      company_laws_regulations: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
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
        ]
      }
      company_modules: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          module_type: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          module_type: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
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
          id: string
          is_custom: boolean | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          custom_content: string
          id?: string
          is_custom?: boolean | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          custom_content?: string
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
        ]
      }
      company_risk_assessments: {
        Row: {
          company_id: string
          created_at: string
          id: string
          risks: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          risks?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
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
        ]
      }
      company_routines: {
        Row: {
          company_id: string
          created_at: string
          id: string
          routines: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          routines?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
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
          department_id: string | null
          description: string | null
          deviation_number: string
          due_date: string
          id: string
          immediate_actions: string | null
          incident_date: string | null
          incident_location: string | null
          incident_time: string | null
          incident_type: string | null
          involved_persons: string | null
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
          department_id?: string | null
          description?: string | null
          deviation_number: string
          due_date: string
          id?: string
          immediate_actions?: string | null
          incident_date?: string | null
          incident_location?: string | null
          incident_time?: string | null
          incident_type?: string | null
          involved_persons?: string | null
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
          department_id?: string | null
          description?: string | null
          deviation_number?: string
          due_date?: string
          id?: string
          immediate_actions?: string | null
          incident_date?: string | null
          incident_location?: string | null
          incident_time?: string | null
          incident_type?: string | null
          involved_persons?: string | null
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
          company_id: string
          contract_file_path: string | null
          contract_type: string
          created_at: string
          employee_id: string
          employment_percentage: number
          end_date: string | null
          id: string
          notes: string | null
          position: string
          probation_period_months: number | null
          signed_by_employee: boolean | null
          signed_by_employer: boolean | null
          signed_date: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_file_path?: string | null
          contract_type: string
          created_at?: string
          employee_id: string
          employment_percentage?: number
          end_date?: string | null
          id?: string
          notes?: string | null
          position: string
          probation_period_months?: number | null
          signed_by_employee?: boolean | null
          signed_by_employer?: boolean | null
          signed_date?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_file_path?: string | null
          contract_type?: string
          created_at?: string
          employee_id?: string
          employment_percentage?: number
          end_date?: string | null
          id?: string
          notes?: string | null
          position?: string
          probation_period_months?: number | null
          signed_by_employee?: boolean | null
          signed_by_employer?: boolean | null
          signed_date?: string | null
          start_date?: string
          status?: string
          updated_at?: string
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
      gdpr_checklist_responses: {
        Row: {
          checklist_type: string
          company_id: string
          completed_at: string | null
          completed_by_id: string | null
          completed_by_name: string
          created_at: string | null
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
        ]
      }
      gdpr_documentation: {
        Row: {
          company_id: string
          content: string | null
          created_at: string | null
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
        ]
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
        ]
      }
      hms_sja: {
        Row: {
          company_id: string
          completed_at: string | null
          completed_by_id: string | null
          completed_by_name: string | null
          created_at: string
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
            foreignKeyName: "hms_sja_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      ik_hms_company_documents: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
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
          id: string
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
          id?: string
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
          id?: string
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
        ]
      }
      ik_mat_custom_checklists: {
        Row: {
          checklist_name: string
          checklist_type: string
          checkpoints: Json
          company_id: string
          created_at: string | null
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
        ]
      }
      ik_mat_custom_cleaning_tasks: {
        Row: {
          area: string
          company_id: string
          created_at: string | null
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
        ]
      }
      ik_mat_traceability_records: {
        Row: {
          batch_number: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
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
          temp_password: string | null
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
          temp_password?: string | null
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
          temp_password?: string | null
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
          description: string | null
          gnr_bnr: string | null
          id: string
          is_favorite: boolean | null
          last_activity_date: string | null
          last_activity_description: string | null
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
          description?: string | null
          gnr_bnr?: string | null
          id?: string
          is_favorite?: boolean | null
          last_activity_date?: string | null
          last_activity_description?: string | null
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
          description?: string | null
          gnr_bnr?: string | null
          id?: string
          is_favorite?: boolean | null
          last_activity_date?: string | null
          last_activity_description?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
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
          status: string
          updated_at: string
          user_id: string
          user_name: string
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
          status?: string
          updated_at?: string
          user_id: string
          user_name: string
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
          status?: string
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
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
          company_id: string
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          employee_id: string
          employee_name: string
          end_time: string
          id: string
          notes: string | null
          schedule_date: string
          schedule_type: string
          start_time: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          employee_id: string
          employee_name: string
          end_time: string
          id?: string
          notes?: string | null
          schedule_date: string
          schedule_type?: string
          start_time: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          employee_id?: string
          employee_name?: string
          end_time?: string
          id?: string
          notes?: string | null
          schedule_date?: string
          schedule_type?: string
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
      copy_inspection_template_seeds: {
        Args: { target_company_id: string }
        Returns: undefined
      }
      generate_anonymous_message_number: {
        Args: { p_company_id: string }
        Returns: string
      }
      generate_forsvarlighetsvurdering_number: { Args: never; Returns: string }
      generate_hms_sja_number: { Args: never; Returns: string }
      generate_inspection_number: {
        Args: { p_company_id: string }
        Returns: string
      }
      generate_ks_module2_avvik_number: { Args: never; Returns: string }
      generate_ks_module2_change_order_number: { Args: never; Returns: string }
      generate_ks_module2_claim_number: { Args: never; Returns: string }
      generate_ks_module2_meeting_number: { Args: never; Returns: string }
      generate_ks_module2_project_number: { Args: never; Returns: string }
      generate_ks_module2_routine_number: { Args: never; Returns: string }
      generate_ks_module2_uk_number: { Args: never; Returns: string }
      generate_project_number: { Args: never; Returns: string }
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
      is_any_department_admin: { Args: { _user_id: string }; Returns: boolean }
      is_company_admin: { Args: { _user_id: string }; Returns: boolean }
      is_department_admin_for: {
        Args: { _department_id: string; _user_id: string }
        Returns: boolean
      }
      is_hms_responsible: { Args: { user_id: string }; Returns: boolean }
      is_leader_or_verneombud: { Args: { p_user_id: string }; Returns: boolean }
      is_system_admin: { Args: { _user_id: string }; Returns: boolean }
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
