'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import MainNavigation from '@/components/navigation/MainNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { useBrowserBackButton } from '@/hooks/useBrowserBackButton'
import { 
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Filter,
  Search,
  DollarSign,
  Home,
  Briefcase,
  Star
} from 'lucide-react'
import BackNavigation from '@/components/navigation/BackNavigation'

type Client = Database['public']['Tables']['clients']['Row']

export default function RecentClientsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Handle browser back button for intuitive navigation
  useBrowserBackButton()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchClients()
    }
  }, [user, authLoading, router])

  const fetchClients = async () => {
    try {
      setLoading(true)
      
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id || '')
        .single()

      if (!agent) return

      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('assigned_agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(50) // Get last 50 clients

      if (clientsData) {
        setClients(clientsData)
        setFilteredClients(clientsData)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = clients

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(client => {
        const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
        return fullName.includes(searchTerm.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      })
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(client => client.client_type === typeFilter)
    }

    setFilteredClients(filtered)
  }, [searchTerm, typeFilter, clients])

  const getClientTypeColor = (type: string | null) => {
    switch (type) {
      case 'buyer':
        return 'bg-blue-100 text-blue-800'
      case 'seller':
        return 'bg-green-100 text-green-800'
      case 'both':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLeadSourceIcon = (source: string | null) => {
    switch (source) {
      case 'website':
        return <Home className="w-3 h-3" />
      case 'referral':
        return <Users className="w-3 h-3" />
      case 'social_media':
        return <Star className="w-3 h-3" />
      default:
        return <Briefcase className="w-3 h-3" />
    }
  }

  const formatBudgetRange = (budgetRange: any) => {
    if (!budgetRange) return null
    if (typeof budgetRange === 'string') return budgetRange
    if (typeof budgetRange === 'object' && budgetRange.min && budgetRange.max) {
      return `$${budgetRange.min.toLocaleString()} - $${budgetRange.max.toLocaleString()}`
    }
    return null
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation title="Recent Clients" />
      
      <main className="p-6">
        {/* Header */}
        <div className="mb-6">
          <BackNavigation />
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Users className="w-6 h-6" />
                <span>Recent Clients</span>
              </h1>
              <p className="text-gray-600 mt-1">View and manage your recently added clients</p>
            </div>
            <Button onClick={() => router.push('/clients')}>
              View All Clients
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="buyer">Buyers</option>
                  <option value="seller">Sellers</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No clients found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm || typeFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Start by adding your first client'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client) => (
              <Card 
                key={client.id}
                className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {client.first_name} {client.last_name}
                        </CardTitle>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getClientTypeColor(client.client_type)}`}>
                          {client.client_type || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate">{client.email || 'No email'}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Budget */}
                    {client.budget_range && formatBudgetRange(client.budget_range) && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span className="text-sm">Budget</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatBudgetRange(client.budget_range)}
                        </span>
                      </div>
                    )}

                    {/* Lead Source and Date */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        {getLeadSourceIcon(client.source)}
                        <span className="capitalize">{client.source || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(client.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
} 