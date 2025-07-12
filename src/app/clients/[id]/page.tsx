'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import CommunicationTimeline from '@/components/clients/CommunicationTimeline'
import { HydrationGuard } from '@/hooks/useHydration'
import MainNavigation from '@/components/navigation/MainNavigation'
import BackNavigation from '@/components/navigation/BackNavigation'
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  Calendar,
  User,
  DollarSign,
  Tag,
  Building,
  Heart
} from 'lucide-react'

type Client = Database['public']['Tables']['clients']['Row']

export default function ClientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [client, setClient] = useState<Client | null>(null)
  const [agentId, setAgentId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && id) {
      fetchClientDetails()
    }
  }, [user, id])

  const fetchClientDetails = async () => {
    try {
      setIsLoading(true)
      
      // Get agent ID
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (!agent) return

      setAgentId(agent.id)

      // Fetch client
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('assigned_agent_id', agent.id)
        .single()

      if (clientData) {
        setClient(clientData)
      }
    } catch (error) {
      console.error('Error fetching client:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getClientTypeIcon = (type: string) => {
    switch (type) {
      case 'buyer': return <User className="w-5 h-5" />
      case 'seller': return <Building className="w-5 h-5" />
      case 'renter': return <Heart className="w-5 h-5" />
      case 'investor': return <DollarSign className="w-5 h-5" />
      default: return <User className="w-5 h-5" />
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }



  return (
    <HydrationGuard>
      {loading || !user ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : isLoading ? (
        <div className="min-h-screen bg-gray-50">
          <MainNavigation title="Client Details" />
          <BackNavigation backPath="/clients" backLabel="Back to Clients" />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      ) : !client ? (
        <div className="min-h-screen bg-gray-50">
          <MainNavigation title="Client Not Found" />
          <BackNavigation backPath="/clients" backLabel="Back to Clients" />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-600">The client you're looking for doesn't exist or you don't have permission to view it.</p>
            </div>
          </main>
        </div>
      ) : (
          <div className="min-h-screen bg-gray-50">
        <MainNavigation title={`${client.first_name} ${client.last_name}`} />
        
        <BackNavigation backPath="/clients" backLabel="Back to Clients">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {getClientTypeIcon(client.client_type || 'buyer')}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status || 'prospect')}`}>
                {client.status || 'prospect'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Text
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </BackNavigation>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{client.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm">{client.client_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status || 'prospect')}`}>
                    {client.status || 'prospect'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contact Method:</span>
                  <span className="text-sm">{client.preferred_contact_method}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Source:</span>
                  <span className="text-sm">{client.source}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{formatDate(client.created_at)}</span>
                </div>
              </CardContent>
            </Card>

            {client.budget_range && typeof client.budget_range === 'object' && (
              <Card>
                <CardHeader>
                  <CardTitle>Budget Range</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    ${(client.budget_range as any).min?.toLocaleString() || 'N/A'} - ${(client.budget_range as any).max?.toLocaleString() || 'N/A'}
                  </div>
                </CardContent>
              </Card>
            )}

            {client.tags && client.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {client.preferences && (
              <Card>
                <CardHeader>
                  <CardTitle>Preferences & Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap">
                    {typeof client.preferences === 'string' 
                      ? client.preferences 
                      : JSON.stringify(client.preferences, null, 2)
                    }
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Communication Timeline */}
          <div className="lg:col-span-2">
            <CommunicationTimeline
              clientId={client.id}
              agentId={agentId}
            />
          </div>
        </div>
      </main>
    </div>
      )}
    </HydrationGuard>
  )
} 