import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

interface ClientStore {
  clients: Client[]
  loading: boolean
  error: string | null
  selectedClient: Client | null
  filters: {
    status: string
    clientType: string
    search: string
  }
  
  // Actions
  fetchClients: (agentId?: string) => Promise<void>
  createClient: (client: ClientInsert) => Promise<Client | null>
  updateClient: (id: string, updates: ClientUpdate) => Promise<Client | null>
  deleteClient: (id: string) => Promise<boolean>
  setSelectedClient: (client: Client | null) => void
  setFilters: (filters: Partial<ClientStore['filters']>) => void
  clearError: () => void
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  loading: false,
  error: null,
  selectedClient: null,
  filters: {
    status: 'all',
    clientType: 'all',
    search: '',
  },

  fetchClients: async (agentId?: string) => {
    console.log('ClientStore: fetchClients called with agentId:', agentId)
    set({ loading: true, error: null })
    
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (agentId) {
        console.log('ClientStore: Filtering by agent ID:', agentId)
        query = query.eq('assigned_agent_id', agentId)
      }

      const { status, clientType, search } = get().filters

      if (status !== 'all') {
        query = query.eq('status', status)
      }
      
      if (clientType !== 'all') {
        query = query.eq('client_type', clientType)
      }
      
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data, error } = await query
      
      console.log('ClientStore: Query result - data:', data, 'error:', error)

      if (error) throw error

      console.log('ClientStore: Setting clients:', data?.length || 0, 'clients')
      set({ clients: data || [], loading: false })
    } catch (error) {
      console.error('ClientStore: Error fetching clients:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch clients',
        loading: false 
      })
    }
  },

  createClient: async (client: ClientInsert) => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single()

      if (error) throw error

      set(state => ({
        clients: [data, ...state.clients],
        loading: false
      }))

      return data
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create client',
        loading: false 
      })
      return null
    }
  },

  updateClient: async (id: string, updates: ClientUpdate) => {
    set({ loading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set(state => ({
        clients: state.clients.map(c => c.id === id ? data : c),
        selectedClient: state.selectedClient?.id === id ? data : state.selectedClient,
        loading: false
      }))

      return data
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update client',
        loading: false 
      })
      return null
    }
  },

  deleteClient: async (id: string) => {
    set({ loading: true, error: null })
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        clients: state.clients.filter(c => c.id !== id),
        selectedClient: state.selectedClient?.id === id ? null : state.selectedClient,
        loading: false
      }))

      return true
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete client',
        loading: false 
      })
      return false
    }
  },

  setSelectedClient: (client: Client | null) => {
    set({ selectedClient: client })
  },

  setFilters: (filters: Partial<ClientStore['filters']>) => {
    set(state => ({
      filters: { ...state.filters, ...filters }
    }))
  },

  clearError: () => {
    set({ error: null })
  },
}))