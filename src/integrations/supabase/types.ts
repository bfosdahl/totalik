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
      audits: {
        Row: {
          area: string | null
          audit_number: string
          checklist_completed: number
          checklist_total: number
          company_id: string
          created_at: string
          description: string | null
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
          description?: string | null
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
          description?: string | null
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
          id: string
          logo_url: string | null
          name: string
          org_number: string | null
          phone: string | null
          postal_code: string | null
          status: Database["public"]["Enums"]["company_status"]
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
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
          description: string | null
          deviation_number: string
          due_date: string
          id: string
          immediate_actions: string | null
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
          description?: string | null
          deviation_number: string
          due_date: string
          id?: string
          immediate_actions?: string | null
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
          description?: string | null
          deviation_number?: string
          due_date?: string
          id?: string
          immediate_actions?: string | null
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
      employee_courses: {
        Row: {
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
          is_latest_version: boolean
          project_id: string
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
          is_latest_version?: boolean
          project_id: string
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
          is_latest_version?: boolean
          project_id?: string
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
          company_id: string
          contact_email: string
          contact_person: string
          contact_phone: string | null
          created_at: string
          id: string
          org_number: string | null
          project_id: string
          status: string
          subcontractor_name: string
          updated_at: string
          user_id: string | null
          work_description: string | null
          work_scope: string
        }
        Insert: {
          company_id: string
          contact_email: string
          contact_person: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          org_number?: string | null
          project_id: string
          status?: string
          subcontractor_name: string
          updated_at?: string
          user_id?: string | null
          work_description?: string | null
          work_scope: string
        }
        Update: {
          company_id?: string
          contact_email?: string
          contact_person?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          org_number?: string | null
          project_id?: string
          status?: string
          subcontractor_name?: string
          updated_at?: string
          user_id?: string | null
          work_description?: string | null
          work_scope?: string
        }
        Relationships: [
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
      ks_projects: {
        Row: {
          address: string | null
          ansvarlig_kontrollerende: string | null
          ansvarlig_kontrollerende_funksjon: string | null
          ansvarlig_prosjekterende: string | null
          ansvarlig_prosjekterende_funksjon: string | null
          ansvarlig_soker: string | null
          ansvarlig_soker_funksjon: string | null
          ansvarlig_utforende: string | null
          ansvarlig_utforende_funksjon: string | null
          ansvarsrolle: string | null
          client_name: string | null
          company_id: string
          created_at: string | null
          created_by_user_id: string | null
          end_date: string | null
          id: string
          name: string
          project_number: string | null
          start_date: string
          status: string | null
          tiltaksklasse: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          ansvarlig_kontrollerende?: string | null
          ansvarlig_kontrollerende_funksjon?: string | null
          ansvarlig_prosjekterende?: string | null
          ansvarlig_prosjekterende_funksjon?: string | null
          ansvarlig_soker?: string | null
          ansvarlig_soker_funksjon?: string | null
          ansvarlig_utforende?: string | null
          ansvarlig_utforende_funksjon?: string | null
          ansvarsrolle?: string | null
          client_name?: string | null
          company_id: string
          created_at?: string | null
          created_by_user_id?: string | null
          end_date?: string | null
          id?: string
          name: string
          project_number?: string | null
          start_date: string
          status?: string | null
          tiltaksklasse?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          ansvarlig_kontrollerende?: string | null
          ansvarlig_kontrollerende_funksjon?: string | null
          ansvarlig_prosjekterende?: string | null
          ansvarlig_prosjekterende_funksjon?: string | null
          ansvarlig_soker?: string | null
          ansvarlig_soker_funksjon?: string | null
          ansvarlig_utforende?: string | null
          ansvarlig_utforende_funksjon?: string | null
          ansvarsrolle?: string | null
          client_name?: string | null
          company_id?: string
          created_at?: string | null
          created_by_user_id?: string | null
          end_date?: string | null
          id?: string
          name?: string
          project_number?: string | null
          start_date?: string
          status?: string | null
          tiltaksklasse?: string | null
          updated_at?: string | null
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
          last_name: string | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          next_of_kin_relation: string | null
          phone: string | null
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
          last_name?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relation?: string | null
          phone?: string | null
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
          last_name?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relation?: string | null
          phone?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_project_number: { Args: never; Returns: string }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: { Args: { _user_id: string }; Returns: boolean }
      is_system_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "system_admin" | "company_admin" | "user" | "subcontractor"
      company_status: "active" | "inactive" | "suspended"
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
      app_role: ["system_admin", "company_admin", "user", "subcontractor"],
      company_status: ["active", "inactive", "suspended"],
    },
  },
} as const
