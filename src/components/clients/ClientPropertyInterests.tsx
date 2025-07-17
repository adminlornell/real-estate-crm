'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Heart, 
  HeartOff, 
  Home, 
  Search, 
  MapPin, 
  DollarSign, 
  AlertTriangle,
  Plus,
  Bed,
  Bath
} from 'lucide-react'

type Client = Database['public']['Tables']['clients']['Row']
type Property = Database['public']['Tables']['properties']['Row']
type ClientPropertyInterest = Database['public']['Tables']['client_property_interests']['Row']

interface ExtendedPropertyInterest extends ClientPropertyInterest {
  property: Property
}

interface ClientPropertyInterestsProps {
  client: Client
  currentAgentId: string
}

export default function ClientPropertyInterests({ 
  client, 
  currentAgentId 
}: ClientPropertyInterestsProps) {
  const [propertyInterests, setPropertyInterests] = useState<ExtendedPropertyInterest[]>([])
  const [availableProperties, setAvailableProperties] = useState<Property[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPropertyInterests()
    fetchAvailableProperties()
  }, [client.id])

  const fetchPropertyInterests = async () => {
    try {
      setError(null)

      const { data, error: interestsError } = await supabase
        .from('client_property_interests')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('client_id', client.id)
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

      setPropertyInterests(data || [])
    } catch (err: any) {
      console.error('Error fetching property interests:', err)
      const errorMessage = err?.message || err?.toString() || 'Failed to load property interests'
      setError(`Failed to load property interests: ${errorMessage}`)
    }
  }

  const fetchAvailableProperties = async () => {
    try {
      setIsLoading(true)

      const { data, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('assigned_agent_id', currentAgentId)
        .in('listing_status', ['active', 'pending'])
        .order('created_at', { ascending: false })

      if (propertiesError) throw propertiesError

      setAvailableProperties(data || [])
    } catch (err: any) {
      console.error('Error fetching available properties:', err)
      const errorMessage = err?.message || err?.toString() || 'Failed to load properties'
      setError(`Failed to load properties: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddInterest = async (propertyId: string, interestLevel: 'high' | 'medium' | 'low') => {
    try {
      setIsUpdating(true)
      setError(null)

      // Check for existing interest (active or inactive)
      const { data: existingInterest, error: existingError } = await supabase
        .from('client_property_interests')
        .select('id, status, interest_level')
        .eq('client_id', client.id)
        .eq('property_id', propertyId)
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

        if (updateError) {
          console.error('Supabase update error:', updateError)
          throw updateError
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('client_property_interests')
          .insert({
            client_id: client.id,
            property_id: propertyId,
            interest_level: interestLevel,
            added_by: currentAgentId,
            status: 'active'
          })

        if (insertError) {
          console.error('Supabase insert error:', insertError)
          throw insertError
        }
      }

      await fetchPropertyInterests()
      setShowAddModal(false)
    } catch (err: any) {
      console.error('Error adding property interest:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        error: err
      })
      const errorMessage = err?.message || err?.toString() || 'Failed to add property interest'
      setError(`Failed to add property interest: ${errorMessage}`)
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

      await fetchPropertyInterests()
    } catch (err: any) {
      console.error('Error removing property interest:', err)
      const errorMessage = err?.message || err?.toString() || 'Failed to remove property interest'
      setError(`Failed to remove property interest: ${errorMessage}`)
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

      await fetchPropertyInterests()
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const filteredAvailableProperties = availableProperties.filter(property => {
    const isAlreadyInterested = propertyInterests.some(interest => interest.property_id === property.id)
    const matchesSearch = searchTerm === '' || 
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${property.city}, ${property.state}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    return !isAlreadyInterested && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading property interests...</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Property Interests</h3>
            <span className="text-sm font-normal text-gray-600">
              ({propertyInterests.length})
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Property
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {propertyInterests.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No property interests yet</p>
            <p className="text-sm text-gray-500">Add properties this client is interested in</p>
          </div>
        ) : (
          <div className="space-y-3">
            {propertyInterests.map((interest) => (
              <div
                key={interest.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3 mb-3">
                      <Home className="w-5 h-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {interest.property.address}
                        </h4>
                        <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{interest.property.city}, {interest.property.state} {interest.property.zip_code}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      {interest.property.price && (
                        <div className="flex items-center space-x-1 text-sm">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="font-medium">{formatCurrency(interest.property.price)}</span>
                        </div>
                      )}
                      {interest.property.bedrooms && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Bed className="w-3 h-3" />
                          <span>{interest.property.bedrooms} bed</span>
                        </div>
                      )}
                      {interest.property.bathrooms && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Bath className="w-3 h-3" />
                          <span>{interest.property.bathrooms} bath</span>
                        </div>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${interest.property.listing_status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                        {interest.property.listing_status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getInterestLevelColor(interest.interest_level || 'medium')}`}>
                        {interest.interest_level || 'medium'} interest
                      </span>
                                              <span className="text-xs text-gray-500">
                          Added {interest.created_at ? new Date(interest.created_at).toLocaleDateString() : 'Unknown'}
                        </span>
                    </div>
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
      </div>

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Property Interest
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
                  placeholder="Search properties by address or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
              {filteredAvailableProperties.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {searchTerm ? 'No properties found matching your search' : 'No available properties to add'}
                </p>
              ) : (
                filteredAvailableProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-start space-x-3">
                        <Home className="w-5 h-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {property.address}
                          </h4>
                          <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{property.city}, {property.state} {property.zip_code}</span>
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            {property.price && (
                              <div className="flex items-center space-x-1 text-sm">
                                <DollarSign className="w-3 h-3 text-green-600" />
                                <span className="font-medium">{formatCurrency(property.price)}</span>
                              </div>
                            )}
                            {property.bedrooms && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Bed className="w-3 h-3" />
                                <span>{property.bedrooms} bed</span>
                              </div>
                            )}
                            {property.bathrooms && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Bath className="w-3 h-3" />
                                <span>{property.bathrooms} bath</span>
                              </div>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${property.listing_status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                              {property.listing_status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleAddInterest(property.id, 'low')}
                        disabled={isUpdating}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Low
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAddInterest(property.id, 'medium')}
                        disabled={isUpdating}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Medium
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAddInterest(property.id, 'high')}
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