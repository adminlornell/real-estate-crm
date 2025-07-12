import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Property = Database['public']['Tables']['properties']['Row']
type PropertyInsert = Database['public']['Tables']['properties']['Insert']
type PropertyUpdate = Database['public']['Tables']['properties']['Update']

interface PropertyStore {
  properties: Property[]
  loading: boolean
  error: string | null
  selectedProperty: Property | null
  filters: {
    status: string
    city: string
    minPrice: number | null
    maxPrice: number | null
    propertyType: string
    search: string
    bedrooms: number | null
  }
  
  // Actions
  fetchProperties: (agentId?: string) => Promise<void>
  createProperty: (property: PropertyInsert) => Promise<Property | null>
  updateProperty: (id: string, updates: PropertyUpdate) => Promise<Property | null>
  deleteProperty: (id: string) => Promise<boolean>
  setSelectedProperty: (property: Property | null) => void
  setFilters: (filters: Partial<PropertyStore['filters']>) => void
  clearError: () => void
}

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  properties: [],
  loading: false,
  error: null,
  selectedProperty: null,
  filters: {
    status: 'all',
    city: '',
    minPrice: null,
    maxPrice: null,
    propertyType: 'all',
    search: '',
    bedrooms: null,
  },

  fetchProperties: async (agentId?: string) => {
    set({ loading: true, error: null })
    
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })

      if (agentId) {
        query = query.eq('assigned_agent_id', agentId)
      }

      const { status, city, minPrice, maxPrice, propertyType, search, bedrooms } = get().filters

      if (status !== 'all') {
        query = query.eq('listing_status', status)
      }
      
      if (city) {
        query = query.ilike('city', `%${city}%`)
      }
      
      if (minPrice !== null) {
        query = query.gte('price', minPrice)
      }
      
      if (maxPrice !== null) {
        query = query.lte('price', maxPrice)
      }
      
      if (propertyType !== 'all') {
        query = query.eq('property_type', propertyType)
      }

      if (bedrooms !== null) {
        query = query.gte('bedrooms', bedrooms)
      }

      if (search) {
        query = query.or(`address.ilike.%${search}%,city.ilike.%${search}%,mls_number.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      set({ properties: data || [], loading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch properties',
        loading: false 
      })
    }
  },

  createProperty: async (property: PropertyInsert) => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert(property)
        .select()
        .single()

      if (error) throw error

      set(state => ({
        properties: [data, ...state.properties],
        loading: false
      }))

      return data
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create property',
        loading: false 
      })
      return null
    }
  },

  updateProperty: async (id: string, updates: PropertyUpdate) => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set(state => ({
        properties: state.properties.map(p => p.id === id ? data : p),
        selectedProperty: state.selectedProperty?.id === id ? data : state.selectedProperty,
        loading: false
      }))

      return data
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update property',
        loading: false 
      })
      return null
    }
  },

  deleteProperty: async (id: string) => {
    set({ loading: true, error: null })
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        properties: state.properties.filter(p => p.id !== id),
        selectedProperty: state.selectedProperty?.id === id ? null : state.selectedProperty,
        loading: false
      }))

      return true
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete property',
        loading: false 
      })
      return false
    }
  },

  setSelectedProperty: (property: Property | null) => {
    set({ selectedProperty: property })
  },

  setFilters: (filters: Partial<PropertyStore['filters']>) => {
    set(state => ({
      filters: { ...state.filters, ...filters }
    }))
  },

  clearError: () => {
    set({ error: null })
  },
}))