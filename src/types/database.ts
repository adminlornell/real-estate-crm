export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          property_id: string
          address: string
          city: string
          state: string
          zip_code: string
          price: number | null
          bedrooms: number | null
          bathrooms: number | null
          square_feet: number | null
          lot_size: number | null
          year_built: number | null
          property_type: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | null
          listing_status: 'active' | 'pending' | 'sold' | 'withdrawn' | 'expired' | null
          listing_date: string | null
          sold_date: string | null
          assigned_agent_id: string | null
          mls_number: string | null
          description: string | null
          features: Json | null
          photos: Json | null
          virtual_tour_url: string | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          property_id: string
          address: string
          city: string
          state: string
          zip_code: string
          price?: number | null
          bedrooms?: number | null
          bathrooms?: number | null
          square_feet?: number | null
          lot_size?: number | null
          year_built?: number | null
          property_type?: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | null
          listing_status?: 'active' | 'pending' | 'sold' | 'withdrawn' | 'expired' | null
          listing_date?: string | null
          sold_date?: string | null
          assigned_agent_id?: string | null
          mls_number?: string | null
          description?: string | null
          features?: Json | null
          photos?: Json | null
          virtual_tour_url?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          property_id?: string
          address?: string
          city?: string
          state?: string
          zip_code?: string
          price?: number | null
          bedrooms?: number | null
          bathrooms?: number | null
          square_feet?: number | null
          lot_size?: number | null
          year_built?: number | null
          property_type?: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | null
          listing_status?: 'active' | 'pending' | 'sold' | 'withdrawn' | 'expired' | null
          listing_date?: string | null
          sold_date?: string | null
          assigned_agent_id?: string | null
          mls_number?: string | null
          description?: string | null
          features?: Json | null
          photos?: Json | null
          virtual_tour_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      agents: {
        Row: {
          id: string
          user_id: string
          agent_name: string
          email: string
          phone: string | null
          license_number: string | null
          hire_date: string | null
          territory: Json | null
          specialties: string[] | null
          commission_rate: number | null
          performance_metrics: Json | null
          profile_photo_url: string | null
          bio: string | null
          social_media: Json | null
          status: 'active' | 'inactive' | 'vacation' | null
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_name: string
          email: string
          phone?: string | null
          license_number?: string | null
          hire_date?: string | null
          territory?: Json | null
          specialties?: string[] | null
          commission_rate?: number | null
          performance_metrics?: Json | null
          profile_photo_url?: string | null
          bio?: string | null
          social_media?: Json | null
          status?: 'active' | 'inactive' | 'vacation' | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_name?: string
          email?: string
          phone?: string | null
          license_number?: string | null
          hire_date?: string | null
          territory?: Json | null
          specialties?: string[] | null
          commission_rate?: number | null
          performance_metrics?: Json | null
          profile_photo_url?: string | null
          bio?: string | null
          social_media?: Json | null
          status?: 'active' | 'inactive' | 'vacation' | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inquiries: {
        Row: {
          id: string
          inquirer_name: string
          email: string
          phone: string | null
          inquiry_date: string
          inquiry_source: 'website' | 'referral' | 'walk_in' | 'social_media' | 'advertisement' | null
          property_of_interest: string | null
          inquiry_type: 'buying' | 'selling' | 'renting' | null
          budget_min: number | null
          budget_max: number | null
          preferred_locations: string[] | null
          timeline: 'immediate' | '1_month' | '3_months' | '6_months' | '1_year' | null
          contact_preference: 'email' | 'phone' | 'text' | null
          lead_score: number | null
          follow_up_status: 'pending' | 'in_progress' | 'completed' | 'closed' | null
          assigned_agent_id: string | null
          notes: string | null
          client_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inquirer_name: string
          email: string
          phone?: string | null
          inquiry_date?: string
          inquiry_source?: 'website' | 'referral' | 'walk_in' | 'social_media' | 'advertisement' | null
          property_of_interest?: string | null
          inquiry_type?: 'buying' | 'selling' | 'renting' | null
          budget_min?: number | null
          budget_max?: number | null
          preferred_locations?: string[] | null
          timeline?: 'immediate' | '1_month' | '3_months' | '6_months' | '1_year' | null
          contact_preference?: 'email' | 'phone' | 'text' | null
          lead_score?: number | null
          follow_up_status?: 'pending' | 'in_progress' | 'completed' | 'closed' | null
          assigned_agent_id?: string | null
          notes?: string | null
          client_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inquirer_name?: string
          email?: string
          phone?: string | null
          inquiry_date?: string
          inquiry_source?: 'website' | 'referral' | 'walk_in' | 'social_media' | 'advertisement' | null
          property_of_interest?: string | null
          inquiry_type?: 'buying' | 'selling' | 'renting' | null
          budget_min?: number | null
          budget_max?: number | null
          preferred_locations?: string[] | null
          timeline?: 'immediate' | '1_month' | '3_months' | '6_months' | '1_year' | null
          contact_preference?: 'email' | 'phone' | 'text' | null
          lead_score?: number | null
          follow_up_status?: 'pending' | 'in_progress' | 'completed' | 'closed' | null
          assigned_agent_id?: string | null
          notes?: string | null
          client_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      showings: {
        Row: {
          id: string
          property_id: string
          client_id: string
          agent_id: string
          showing_date: string
          showing_time: string
          duration_minutes: number | null
          showing_type: 'in_person' | 'virtual' | 'drive_by' | null
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | null
          feedback: string | null
          interest_level: 'high' | 'medium' | 'low' | 'not_interested' | null
          follow_up_required: boolean | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          client_id: string
          agent_id: string
          showing_date: string
          showing_time: string
          duration_minutes?: number | null
          showing_type?: 'in_person' | 'virtual' | 'drive_by' | null
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | null
          feedback?: string | null
          interest_level?: 'high' | 'medium' | 'low' | 'not_interested' | null
          follow_up_required?: boolean | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          client_id?: string
          agent_id?: string
          showing_date?: string
          showing_time?: string
          duration_minutes?: number | null
          showing_type?: 'in_person' | 'virtual' | 'drive_by' | null
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | null
          feedback?: string | null
          interest_level?: 'high' | 'medium' | 'low' | 'not_interested' | null
          follow_up_required?: boolean | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          address: string | null
          client_type: 'buyer' | 'seller' | 'renter' | 'landlord' | null
          preferred_contact_method: 'email' | 'phone' | 'text' | null
          budget_range: Json | null
          preferences: Json | null
          source: string | null
          assigned_agent_id: string | null
          status: 'active' | 'inactive' | 'converted' | 'lost' | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          address?: string | null
          client_type?: 'buyer' | 'seller' | 'renter' | 'landlord' | null
          preferred_contact_method?: 'email' | 'phone' | 'text' | null
          budget_range?: Json | null
          preferences?: Json | null
          source?: string | null
          assigned_agent_id?: string | null
          status?: 'active' | 'inactive' | 'converted' | 'lost' | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          address?: string | null
          client_type?: 'buyer' | 'seller' | 'renter' | 'landlord' | null
          preferred_contact_method?: 'email' | 'phone' | 'text' | null
          budget_range?: Json | null
          preferences?: Json | null
          source?: string | null
          assigned_agent_id?: string | null
          status?: 'active' | 'inactive' | 'converted' | 'lost' | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}