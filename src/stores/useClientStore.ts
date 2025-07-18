import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { showToast } from '@/lib/toast'
import { reportCRMError, measurePerformance, addBreadcrumb } from '@/lib/sentry'

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
    set({ loading: true, error: null })
    
    return measurePerformance('fetchClients', 'db.query', async () => {
      try {
        addBreadcrumb('Starting client fetch', 'query', 'info', {
          agentId,
          filters: get().filters
        })
        
        let query = supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false })

        if (agentId) {
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

        if (error) throw error

        addBreadcrumb('Clients fetched successfully', 'query', 'info', {
          count: data?.length || 0
        })

        set({ clients: data || [], loading: false })
      } catch (error) {
        reportCRMError(error as Error, {
          entity: 'client',
          operation: 'read',
          component: 'ClientStore',
          entityId: agentId,
          userId: agentId
        })
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch clients'
        set({ 
          error: errorMessage,
          loading: false 
        })
        showToast.error(errorMessage)
      }
    })
  },

  createClient: async (client: ClientInsert) => {
    set({ loading: true, error: null })
    
    return measurePerformance('createClient', 'db.insert', async () => {
      try {
        addBreadcrumb('Creating new client', 'action', 'info', {
          firstName: client.first_name,
          lastName: client.last_name,
          email: client.email,
          clientType: client.client_type
        })
        
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

        addBreadcrumb('Client created successfully', 'action', 'info', {
          clientId: data.id,
          name: `${data.first_name} ${data.last_name}`
        })

        showToast.success('Client created successfully!')
        return data
      } catch (error) {
        reportCRMError(error as Error, {
          entity: 'client',
          operation: 'create',
          component: 'ClientStore',
          userId: client.assigned_agent_id || undefined
        })
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to create client'
        set({ 
          error: errorMessage,
          loading: false 
        })
        showToast.error(errorMessage)
        return null
      }
    })
  },

  updateClient: async (id: string, updates: ClientUpdate) => {
    set({ loading: true, error: null })
    
    return measurePerformance('updateClient', 'db.update', async () => {
      try {
        addBreadcrumb('Updating client', 'action', 'info', {
          clientId: id,
          updates: Object.keys(updates)
        })
        
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

        addBreadcrumb('Client updated successfully', 'action', 'info', {
          clientId: id,
          name: `${data.first_name} ${data.last_name}`
        })

        showToast.success('Client updated successfully!')
        return data
      } catch (error) {
        reportCRMError(error as Error, {
          entity: 'client',
          operation: 'update',
          component: 'ClientStore',
          entityId: id,
          userId: updates.assigned_agent_id || undefined
        })
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to update client'
        set({ 
          error: errorMessage,
          loading: false 
        })
        showToast.error(errorMessage)
        return null
      }
    })
  },

  deleteClient: async (id: string) => {
    set({ loading: true, error: null })
    
    return measurePerformance('deleteClient', 'db.delete', async () => {
      try {
        addBreadcrumb('Deleting client', 'action', 'warning', {
          clientId: id
        })
        
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

        addBreadcrumb('Client deleted successfully', 'action', 'info', {
          clientId: id
        })

        showToast.success('Client deleted successfully!')
        return true
      } catch (error) {
        reportCRMError(error as Error, {
          entity: 'client',
          operation: 'delete',
          component: 'ClientStore',
          entityId: id
        })
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete client'
        set({ 
          error: errorMessage,
          loading: false 
        })
        showToast.error(errorMessage)
        return false
      }
    })
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