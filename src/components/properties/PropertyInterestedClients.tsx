'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  UserPlus, 
  Heart, 
  HeartOff, 
  Search, 
  Mail, 
  Phone, 
  AlertTriangle,
  MessageSquare
} from 'lucide-react'

type Property = Database['public']['Tables']['properties']['Row']
type Client = Database['public']['Tables']['clients']['Row']
type ClientPropertyInterest = Database['public']['Tables']['client_property_interests']['Row']

interface ExtendedClientInterest extends ClientPropertyInterest {
  client: Client
}

interface PropertyInterestedClientsProps {
  property: Property
  currentAgentId: string
}

export default function PropertyInterestedClients({ 
  property, 
  currentAgentId 
}: PropertyInterestedClientsProps) {
  const [interestedClients, setInterestedClients] = useState<ExtendedClientInterest[]>([])
  const [availableClients, setAvailableClients] = useState<Client[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInterestedClients()
    fetchAvailableClients()
  }, [property.id])

  const fetchInterestedClients = async () => {
    try {
      setError(null)

      const { data, error: interestsError } = await supabase
        .from('client_property_interests')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('property_id', property.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (interestsError) {
        // Check if it's a table not found error
        if (interestsError.message?.includes('does not exist') || 
            interestsError.code === 'PGRST116' ||
            interestsError.message?.includes('client_property_interests')) {
          setError('Database table not found. Please run the migration to create the client_property_interests table.')
          return
        }
        throw interestsError
      }

      setInterestedClients(data || [])
    } catch (err: any) {
      console.error('Error fetching interested clients:', err)
      const errorMessage = err?.message || err?.toString() || 'Failed to load interested clients'
      setError(`Failed to load interested clients: ${errorMessage}`)
    }
  }

  const fetchAvailableClients = async () => {
    try {
      setIsLoading(true)

      const { data, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('assigned_agent_id', currentAgentId)
        .eq('status', 'active')
        .order('first_name')

      if (clientsError) throw clientsError

      setAvailableClients(data || [])
    } catch (err: any) {
      console.error('Error fetching available clients:', err)
      const errorMessage = err?.message || err?.toString() || 'Failed to load clients'
      setError(`Failed to load clients: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddInterest = async (clientId: string, interestLevel: 'high' | 'medium' | 'low') => {
    try {
      setIsUpdating(true)
      setError(null)

      // Check for existing interest (active or inactive)
      const { data: existingInterest, error: existingError } = await supabase
        .from('client_property_interests')
        .select('id, status, interest_level')
        .eq('client_id', clientId)
        .eq('property_id', property.id)
        .maybeSingle()

      if (existingInterest) {
        if (existingInterest.status === 'active') {
          throw new Error('This client already has an active interest record for this property')
        }
        
        // Update existing inactive record to active with new interest level
        const { error: updateError } = await supabase
          .from('client_property_interests')
          .update({
            interest_level: interestLevel,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInterest.id)

        if (updateError) throw updateError
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('client_property_interests')
          .insert({
            client_id: clientId,
            property_id: property.id,
            interest_level: interestLevel,
            added_by: currentAgentId,
            status: 'active'
          })

        if (insertError) throw insertError
      }

      await fetchInterestedClients()
      setShowAddModal(false)
    } catch (err: any) {
      console.error('Error adding client interest:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        error: err
      })
      const errorMessage = err?.message || err?.toString() || 'Failed to add client interest'
      setError(`Failed to add client interest: ${errorMessage}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveInterest = async (interestId: string) => {
    try {
      setIsUpdating(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('client_property_interests')
        .update({ status: 'inactive' })
        .eq('id', interestId)

      if (updateError) throw updateError

      await fetchInterestedClients()
    } catch (err: any) {
      console.error('Error removing client interest:', err)
      const errorMessage = err?.message || err?.toString() || 'Failed to remove client interest'
      setError(`Failed to remove client interest: ${errorMessage}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateInterestLevel = async (interestId: string, newLevel: 'high' | 'medium' | 'low') => {
    try {
      setIsUpdating(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('client_property_interests')
        .update({ interest_level: newLevel })
        .eq('id', interestId)

      if (updateError) throw updateError

      await fetchInterestedClients()
    } catch (err: any) {
      console.error('Error updating interest level:', err)
      const errorMessage = err?.message || err?.toString() || 'Failed to update interest level'
      setError(`Failed to update interest level: ${errorMessage}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const getInterestLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredAvailableClients = availableClients.filter(client => {
    const isAlreadyInterested = interestedClients.some(interest => interest.client_id === client.id)
    const matchesSearch = searchTerm === '' || 
      `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return !isAlreadyInterested && matchesSearch
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>Interested Clients</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading clients...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>Interested Clients</span>
              <span className="text-sm font-normal text-gray-600">
                ({interestedClients.length})
              </span>
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Add Client
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {interestedClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No interested clients yet</p>
              <p className="text-sm text-gray-500">Add clients who are interested in this property</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interestedClients.map((interest) => (
                <div
                  key={interest.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {interest.client.first_name} {interest.client.last_name}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>{interest.client.email}</span>
                            </div>
                            {interest.client.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>{interest.client.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getInterestLevelColor(interest.interest_level || 'medium')}`}>
                          {interest.interest_level || 'medium'} interest
                        </span>
                        <span className="text-xs text-gray-500">
                          Added {interest.created_at ? new Date(interest.created_at).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>

                      {interest.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center space-x-1 mb-1">
                            <MessageSquare className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-700 font-medium">Notes:</span>
                          </div>
                          <p className="text-gray-600">{interest.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <select
                        value={interest.interest_level || 'medium'}
                        onChange={(e) => handleUpdateInterestLevel(interest.id, e.target.value as 'high' | 'medium' | 'low')}
                        disabled={isUpdating}
                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveInterest(interest.id)}
                        disabled={isUpdating}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <HeartOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Interested Client
              </h3>
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="p-2"
              >
                ×
              </Button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredAvailableClients.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {searchTerm ? 'No clients found matching your search' : 'No available clients to add'}
                </p>
              ) : (
                filteredAvailableClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {client.first_name} {client.last_name}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{client.email}</span>
                        {client.phone && <span>{client.phone}</span>}
                        <span className="capitalize">{client.client_type}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddInterest(client.id, 'low')}
                        disabled={isUpdating}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Low
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAddInterest(client.id, 'medium')}
                        disabled={isUpdating}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Medium
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAddInterest(client.id, 'high')}
                        disabled={isUpdating}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        High
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}