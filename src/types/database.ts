export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_type: string
          agent_id: string
          created_at: string | null
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          agent_id: string
          created_at?: string | null
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          agent_id?: string
          created_at?: string | null
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          agent_name: string
          bio: string | null
          commission_rate: number | null
          created_at: string | null
          email: string
          hire_date: string | null
          id: string
          license_number: string | null
          manager_id: string | null
          performance_metrics: Json | null
          phone: string | null
          profile_photo_url: string | null
          social_media: Json | null
          specialties: string[] | null
          status: string | null
          territory: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_name: string
          bio?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email: string
          hire_date?: string | null
          id?: string
          license_number?: string | null
          manager_id?: string | null
          performance_metrics?: Json | null
          phone?: string | null
          profile_photo_url?: string | null
          social_media?: Json | null
          specialties?: string[] | null
          status?: string | null
          territory?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_name?: string
          bio?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email?: string
          hire_date?: string | null
          id?: string
          license_number?: string | null
          manager_id?: string | null
          performance_metrics?: Json | null
          phone?: string | null
          profile_photo_url?: string | null
          social_media?: Json | null
          specialties?: string[] | null
          status?: string | null
          territory?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      client_property_interests: {
        Row: {
          added_by: string | null
          client_id: string
          created_at: string | null
          id: string
          interest_level: string | null
          notes: string | null
          property_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          added_by?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          interest_level?: string | null
          notes?: string | null
          property_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          added_by?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          interest_level?: string | null
          notes?: string | null
          property_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_property_interests_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_property_interests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_property_interests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          assigned_agent_id: string | null
          budget_range: Json | null
          client_type: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          preferences: Json | null
          preferred_contact_method: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_agent_id?: string | null
          budget_range?: Json | null
          client_type?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          preferences?: Json | null
          preferred_contact_method?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_agent_id?: string | null
          budget_range?: Json | null
          client_type?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          preferences?: Json | null
          preferred_contact_method?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          agent_id: string | null
          client_id: string | null
          communication_type: string | null
          completed_at: string | null
          content: string | null
          created_at: string | null
          direction: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          scheduled_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          agent_id?: string | null
          client_id?: string | null
          communication_type?: string | null
          completed_at?: string | null
          content?: string | null
          created_at?: string | null
          direction?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          scheduled_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          agent_id?: string | null
          client_id?: string | null
          communication_type?: string | null
          completed_at?: string | null
          content?: string | null
          created_at?: string | null
          direction?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          scheduled_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          document_id: string | null
          id: string
          ip_address: unknown | null
          signature_data: string | null
          signed_at: string | null
          signer_email: string | null
          signer_name: string
          signer_type: string
          user_agent: string | null
        }
        Insert: {
          document_id?: string | null
          id?: string
          ip_address?: unknown | null
          signature_data?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name: string
          signer_type: string
          user_agent?: string | null
        }
        Update: {
          document_id?: string | null
          id?: string
          ip_address?: unknown | null
          signature_data?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string
          signer_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          created_at: string | null
          description: string | null
          document_type: string
          id: string
          is_active: boolean | null
          name: string
          template_content: string
          template_fields: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_type: string
          id?: string
          is_active?: boolean | null
          name: string
          template_content: string
          template_fields?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          template_content?: string
          template_fields?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          agent_id: string | null
          client_id: string | null
          created_at: string | null
          created_by: string
          document_name: string
          document_status: string | null
          document_type: string | null
          expiration_date: string | null
          field_values: Json | null
          file_size: number | null
          file_url: string
          finalized_at: string | null
          id: string
          mime_type: string | null
          pdf_url: string | null
          property_id: string | null
          signature_required: boolean | null
          signature_status: string | null
          tags: string[] | null
          template_id: string | null
          title: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          agent_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by: string
          document_name: string
          document_status?: string | null
          document_type?: string | null
          expiration_date?: string | null
          field_values?: Json | null
          file_size?: number | null
          file_url: string
          finalized_at?: string | null
          id?: string
          mime_type?: string | null
          pdf_url?: string | null
          property_id?: string | null
          signature_required?: boolean | null
          signature_status?: string | null
          tags?: string[] | null
          template_id?: string | null
          title?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          agent_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string
          document_name?: string
          document_status?: string | null
          document_type?: string | null
          expiration_date?: string | null
          field_values?: Json | null
          file_size?: number | null
          file_url?: string
          finalized_at?: string | null
          id?: string
          mime_type?: string | null
          pdf_url?: string | null
          property_id?: string | null
          signature_required?: boolean | null
          signature_status?: string | null
          tags?: string[] | null
          template_id?: string | null
          title?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_creator"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          assigned_agent_id: string | null
          budget_max: number | null
          budget_min: number | null
          client_id: string | null
          contact_preference: string | null
          created_at: string | null
          email: string
          follow_up_status: string | null
          id: string
          inquirer_name: string
          inquiry_date: string | null
          inquiry_source: Database["public"]["Enums"]["inquiry_source"] | null
          inquiry_type: string | null
          lead_score: number | null
          notes: string | null
          phone: string | null
          preferred_locations: string[] | null
          property_of_interest: string | null
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_id?: string | null
          contact_preference?: string | null
          created_at?: string | null
          email: string
          follow_up_status?: string | null
          id?: string
          inquirer_name: string
          inquiry_date?: string | null
          inquiry_source?: Database["public"]["Enums"]["inquiry_source"] | null
          inquiry_type?: string | null
          lead_score?: number | null
          notes?: string | null
          phone?: string | null
          preferred_locations?: string[] | null
          property_of_interest?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          client_id?: string | null
          contact_preference?: string | null
          created_at?: string | null
          email?: string
          follow_up_status?: string | null
          id?: string
          inquirer_name?: string
          inquiry_date?: string | null
          inquiry_source?: Database["public"]["Enums"]["inquiry_source"] | null
          inquiry_type?: string | null
          lead_score?: number | null
          notes?: string | null
          phone?: string | null
          preferred_locations?: string[] | null
          property_of_interest?: string | null
          timeline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_property_of_interest_fkey"
            columns: ["property_of_interest"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          assigned_agent_id: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          created_at: string | null
          created_by: string
          description: string | null
          features: Json | null
          id: string
          listing_date: string | null
          listing_status: string | null
          lot_size: number | null
          mls_number: string | null
          photos: Json | null
          price: number | null
          property_id: string
          property_type: string | null
          sold_date: string | null
          square_feet: number | null
          state: string
          updated_at: string | null
          virtual_tour_url: string | null
          year_built: number | null
          zip_code: string
        }
        Insert: {
          address: string
          assigned_agent_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          created_at?: string | null
          created_by: string
          description?: string | null
          features?: Json | null
          id?: string
          listing_date?: string | null
          listing_status?: string | null
          lot_size?: number | null
          mls_number?: string | null
          photos?: Json | null
          price?: number | null
          property_id: string
          property_type?: string | null
          sold_date?: string | null
          square_feet?: number | null
          state: string
          updated_at?: string | null
          virtual_tour_url?: string | null
          year_built?: number | null
          zip_code: string
        }
        Update: {
          address?: string
          assigned_agent_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          features?: Json | null
          id?: string
          listing_date?: string | null
          listing_status?: string | null
          lot_size?: number | null
          mls_number?: string | null
          photos?: Json | null
          price?: number | null
          property_id?: string
          property_type?: string | null
          sold_date?: string | null
          square_feet?: number | null
          state?: string
          updated_at?: string | null
          virtual_tour_url?: string | null
          year_built?: number | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_properties_agent"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_properties_creator"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      showings: {
        Row: {
          agent_id: string
          client_id: string
          created_at: string | null
          duration_minutes: number | null
          feedback: string | null
          follow_up_required: boolean | null
          id: string
          interest_level: string | null
          notes: string | null
          property_id: string
          showing_date: string
          showing_time: string
          showing_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          client_id: string
          created_at?: string | null
          duration_minutes?: number | null
          feedback?: string | null
          follow_up_required?: boolean | null
          id?: string
          interest_level?: string | null
          notes?: string | null
          property_id: string
          showing_date: string
          showing_time: string
          showing_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          client_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          feedback?: string | null
          follow_up_required?: boolean | null
          id?: string
          interest_level?: string | null
          notes?: string | null
          property_id?: string
          showing_date?: string
          showing_time?: string
          showing_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "showings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          agent_id: string
          comment: string
          created_at: string | null
          id: string
          task_id: string
        }
        Insert: {
          agent_id: string
          comment: string
          created_at?: string | null
          id?: string
          task_id: string
        }
        Update: {
          agent_id?: string
          comment?: string
          created_at?: string | null
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          tasks: Json
          updated_at: string | null
          workflow_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tasks?: Json
          updated_at?: string | null
          workflow_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tasks?: Json
          updated_at?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          comments: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          status: string | null
          task_type: string | null
          template_id: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string | null
          task_type?: string | null
          template_id?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string | null
          task_type?: string | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_activity: {
        Args: {
          p_agent_id: string
          p_activity_type: string
          p_entity_type: string
          p_entity_id: string
          p_description: string
          p_metadata?: Json
        }
        Returns: string
      }
    }
    Enums: {
      inquiry_source:
        | "website"
        | "referral"
        | "walk_in"
        | "social_media"
        | "advertisement"
        | "cold_call"
        | "open_house"
      property_status:
        | "active"
        | "pending"
        | "sold"
        | "withdrawn"
        | "expired"
        | "coming_soon"
      user_role: "agent" | "team_lead" | "manager" | "admin" | "client"
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
      inquiry_source: [
        "website",
        "referral",
        "walk_in",
        "social_media",
        "advertisement",
        "cold_call",
        "open_house",
      ],
      property_status: [
        "active",
        "pending",
        "sold",
        "withdrawn",
        "expired",
        "coming_soon",
      ],
      user_role: ["agent", "team_lead", "manager", "admin", "client"],
    },
  },
} as const

// Additional type aliases for convenience
export type ClientPropertyInterest = Tables<'client_property_interests'>
export type ClientPropertyInterestInsert = TablesInsert<'client_property_interests'>
export type ClientPropertyInterestUpdate = TablesUpdate<'client_property_interests'>

// Interest level and status types
export type InterestLevel = 'high' | 'medium' | 'low'
export type InterestStatus = 'active' | 'inactive' | 'purchased' | 'not_interested'

// Property interest activity types
export type PropertyInterestActivityType = 
  | 'property_interest_added'
  | 'property_interest_updated'
  | 'property_interest_removed'
  | 'property_agent_assigned'
  | 'agent_property_assigned'

// Complete activity type union
export type ActivityType = 
  | 'property_created'
  | 'property_updated'
  | 'property_deleted'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_cancelled'
  | 'task_comment_added'
  | 'communication_logged'
  | 'showing_scheduled'
  | 'showing_completed'
  | 'document_uploaded'
  | 'document_created'
  | 'document_updated'
  | 'document_finalized'
  | 'document_signed'
  | 'template_applied'
  | 'template_used'
  | PropertyInterestActivityType