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
          assignee_id: string | null
          assignee_name: string | null
          category: string
          company_id: string
          created_at: string
          description: string | null
          deviation_number: string
          due_date: string
          id: string
          priority: string
          reporter_id: string | null
          reporter_name: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          assignee_name?: string | null
          category: string
          company_id: string
          created_at?: string
          description?: string | null
          deviation_number: string
          due_date: string
          id?: string
          priority: string
          reporter_id?: string | null
          reporter_name: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          assignee_name?: string | null
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          deviation_number?: string
          due_date?: string
          id?: string
          priority?: string
          reporter_id?: string | null
          reporter_name?: string
          status?: string
          title?: string
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
      ks_projects: {
        Row: {
          address: string | null
          ansvarsrolle: string | null
          client_name: string | null
          company_id: string
          created_at: string | null
          created_by_user_id: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string
          status: string | null
          tiltaksklasse: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          ansvarsrolle?: string | null
          client_name?: string | null
          company_id: string
          created_at?: string | null
          created_by_user_id?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          status?: string | null
          tiltaksklasse?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          ansvarsrolle?: string | null
          client_name?: string | null
          company_id?: string
          created_at?: string | null
          created_by_user_id?: string | null
          end_date?: string | null
          id?: string
          name?: string
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
      ks_sja: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          hazards_json: Json | null
          id: string
          project_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          hazards_json?: Json | null
          id?: string
          project_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          hazards_json?: Json | null
          id?: string
          project_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ks_sja_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ks_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ks_template_items: {
        Row: {
          category: string | null
          created_at: string | null
          help_text: string | null
          id: string
          order_index: number
          template_id: string
          text: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          help_text?: string | null
          id?: string
          order_index: number
          template_id: string
          text: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          help_text?: string | null
          id?: string
          order_index?: number
          template_id?: string
          text?: string
        }
        Relationships: [
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
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_default?: boolean | null
          name?: string
          phase?: string | null
          trade?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      app_role: "system_admin" | "company_admin" | "user"
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
      app_role: ["system_admin", "company_admin", "user"],
      company_status: ["active", "inactive", "suspended"],
    },
  },
} as const
