'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { Plus, Search, Phone, Mail, User, Building, Heart, DollarSign, Edit } from 'lucide-react'
import ClientForm from '@/components/clients/ClientForm'
import QuickActions from '@/components/clients/QuickActions'
import LeadScoringSystem from '@/components/clients/LeadScoringSystem'
import { useHydration } from '@/hooks/useHydration'
import MainNavigation from '@/components/navigation/MainNavigation'

type Client = Database['public']['Tables']['clients']['Row']

export default function ClientsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const isHydrated = useHydration()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showClientForm, setShowClientForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [agentId, setAgentId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'list' | 'scoring'>('list')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm, selectedType, selectedStatus])

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      
      // Get agent ID
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user!.id)
        .single()

      if (!agent) return

      setAgentId(agent.id)

      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('assigned_agent_id', agent.id)
        .order('created_at', { ascending: false })

      if (clientsData) {
        setClients(clientsData)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddClient = () => {
    setEditingClient(null)
    setShowClientForm(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setShowClientForm(true)
  }

  const handleSaveClient = (savedClient: Client) => {
    if (editingClient) {
      // Update existing client in list
      setClients(prev => prev.map(c => c.id === savedClient.id ? savedClient : c))
    } else {
      // Add new client to list
      setClients(prev => [savedClient, ...prev])
    }
    setShowClientForm(false)
    setEditingClient(null)
  }

  const handleCancelForm = () => {
    setShowClientForm(false)
    setEditingClient(null)
  }

  const filterClients = () => {
    let filtered = clients

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
      )
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(client => client.client_type === selectedType)
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(client => client.status === selectedStatus)
    }

    setFilteredClients(filtered)
  }

  const getClientTypeIcon = (type: string) => {
    switch (type) {
      case 'buyer': return <User className="w-4 h-4" />
      case 'seller': return <Building className="w-4 h-4" />
      case 'renter': return <Heart className="w-4 h-4" />
      case 'investor': return <DollarSign className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'prospect': return 'bg-blue-100 text-blue-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Show loading state until hydrated and auth is resolved
  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If not authenticated after hydration, show loading while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation title="Clients" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('list')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Client List
              </button>
              <button
                onClick={() => setActiveTab('scoring')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scoring'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Lead Scoring
              </button>
            </nav>
          </div>

          {activeTab === 'list' ? (
            <>
              {/* Add Client Button */}
              <div className="mb-6 flex justify-end">
                <Button 
                  onClick={handleAddClient}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </div>
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              >
                <option value="all">All Types</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="renter">Renter</option>
                <option value="investor">Investor</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="prospect">Prospect</option>
                <option value="closed">Closed</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredClients.length} of {clients.length} clients
            {(searchTerm || selectedType !== 'all' || selectedStatus !== 'all') && (
              <span className="text-blue-600 ml-2">
                (filtered)
              </span>
            )}
          </p>
          {(searchTerm || selectedType !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedType('all')
                setSelectedStatus('all')
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={`client-loading-skeleton-${i}`} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Clients Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getClientTypeIcon(client.client_type || 'buyer')}
                      <CardTitle className="text-lg">
                        <button
                          onClick={() => router.push(`/clients/${client.id}`)}
                          className="hover:text-blue-600 transition-colors text-left"
                        >
                          {client.first_name} {client.last_name}
                        </button>
                      </CardTitle>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status || 'prospect')}`}>
                      {client.status || 'prospect'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {client.email}
                    </div>
                    {client.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {client.phone}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      {client.client_type || 'buyer'}
                    </div>
                    {client.budget_range && typeof client.budget_range === 'object' && (
                      <div className="text-sm text-gray-600">
                        Budget: ${(client.budget_range as { min?: number; max?: number }).min?.toLocaleString()} - ${(client.budget_range as { min?: number; max?: number }).max?.toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <QuickActions
                      clientId={client.id}
                      agentId={agentId}
                      clientName={`${client.first_name} ${client.last_name}`}
                      clientEmail={client.email || undefined}
                      clientPhone={client.phone || undefined}
                      variant="compact"
                    />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => router.push(`/clients/${client.id}`)}
                        className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition-all duration-200 hover:scale-105 hover:shadow-md"
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditClient(client)}
                        className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredClients.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedType !== 'all' || selectedStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first client'
              }
            </p>
            <Button 
              onClick={handleAddClient}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        )}
            </>
          ) : (
            <LeadScoringSystem />
          )}
        </main>

        {/* Client Form Modal */}
        {showClientForm && (
          <ClientForm
            client={editingClient}
            onSave={handleSaveClient}
            onCancel={handleCancelForm}
            agentId={agentId}
          />
        )}
      </div>
  )
} 