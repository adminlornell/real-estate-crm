'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { useHydration } from '@/hooks/useHydration'
import MainNavigation from '@/components/navigation/MainNavigation'
import BackNavigation from '@/components/navigation/BackNavigation'
import PropertyForm from '@/components/properties/PropertyForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Calendar,
  Home,
  Car,
  TreePine,
  Ruler,
  DollarSign,
  FileText,
  Images,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import PropertyAgentManager from '@/components/properties/PropertyAgentManager'
import PropertyInterestedClients from '@/components/properties/PropertyInterestedClients'
import Image from 'next/image'

type Property = Database['public']['Tables']['properties']['Row']

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>
}

export default function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const isHydrated = useHydration()
  const { id } = use(params)
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [agentId, setAgentId] = useState<string>('')
  const [isAgentManagerExpanded, setIsAgentManagerExpanded] = useState(false)
  const [isClientsExpanded, setIsClientsExpanded] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && id) {
      fetchProperty()
    }
  }, [user, id])

  const fetchProperty = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get agent ID
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id || '')
        .single()

      if (agentError) {
        console.error('Agent fetch error:', agentError)
        setError('Agent not found')
        return
      }

      if (!agent) {
        setError('Agent not found')
        return
      }

      // First, try to fetch the property without agent filtering
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

      if (propertyError) {
        console.error('Property fetch error:', propertyError)
        setError('Property not found')
        return
      }

      // Check if the property belongs to the current agent
      if (propertyData.assigned_agent_id !== agent.id) {
        setError('You do not have permission to view this property')
        return
      }

      setProperty(propertyData)
      setAgentId(agent.id)
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setShowEditForm(true)
  }

  const handleEditSuccess = () => {
    setShowEditForm(false)
    // Refresh the property data
    fetchProperty()
  }

  const handleEditClose = () => {
    setShowEditForm(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property?')) return

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting property:', error)
        alert('Failed to delete property')
        return
      }

      router.push('/properties')
    } catch (err) {
      console.error('Error:', err)
      alert('An unexpected error occurred')
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavigation title="Property Details" />
        <main className="container mx-auto px-4 py-8">
          <BackNavigation fallbackPath="/properties" fallbackText="Properties" />
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading property details...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavigation title="Property Details" />
        <main className="container mx-auto px-4 py-8">
          <BackNavigation fallbackPath="/properties" fallbackText="Properties" />
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Property not found'}
            </h2>
            <Button onClick={() => router.push('/properties')}>
              Return to Properties
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const photos = property.photos as string[] || []

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation title="Property Details" />
      <main className="container mx-auto px-4 py-8">
        <BackNavigation fallbackPath="/properties" fallbackText="Properties" />
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {property.address}
            </h1>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleEdit}
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center text-gray-600 mb-4">
            <MapPin className="h-5 w-5 mr-2" />
            <span>{property.city}, {property.state} {property.zip_code}</span>
          </div>

          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {property.listing_status}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photos */}
            {photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Images className="h-5 w-5 mr-2" />
                    Photos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {photos.map((photo, index) => (
                      <div key={`photo-${property.id}-${index}`} className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative">
                        <Image
                          src={photo}
                          alt={`Property photo ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Bed className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-600">Bedrooms</span>
                    <span className="font-semibold">{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bath className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-600">Bathrooms</span>
                    <span className="font-semibold">{property.bathrooms}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Square className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-600">Sq Ft</span>
                    <span className="font-semibold">{property.square_feet?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Ruler className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-600">Lot Size</span>
                    <span className="font-semibold">{property.lot_size}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Property Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{property.property_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Year Built:</span>
                        <span className="font-medium">{property.year_built}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">MLS Number:</span>
                        <span className="font-medium">{property.mls_number}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Listing Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Listed:</span>
                        <span className="font-medium">
                          {property.listing_date ? new Date(property.listing_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {property.sold_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sold:</span>
                          <span className="font-medium">
                            {new Date(property.sold_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            {property.features && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TreePine className="h-5 w-5 mr-2" />
                    Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(property.features as string[]).map((feature, index) => (
                      <div key={`feature-${property.id}-${index}`} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {property.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{property.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {property.price ? formatCurrency(property.price) : 'Price not set'}
                </div>
                {property.price && property.square_feet && (
                  <div className="text-sm text-gray-600">
                    ${Math.round(property.price / property.square_feet)} per sq ft
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Virtual Tour */}
            {property.virtual_tour_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Virtual Tour</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => window.open(property.virtual_tour_url!, '_blank')}
                    className="w-full"
                  >
                    View Virtual Tour
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Agent Management */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsAgentManagerExpanded(!isAgentManagerExpanded)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Agent Management</CardTitle>
                  {isAgentManagerExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
              {isAgentManagerExpanded && (
                <CardContent className="pt-0">
                  <PropertyAgentManager
                    property={property}
                    currentAgentId={agentId}
                    onAgentChanged={fetchProperty}
                  />
                </CardContent>
              )}
            </Card>

            {/* Interested Clients */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsClientsExpanded(!isClientsExpanded)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Interested Clients</CardTitle>
                  {isClientsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
              {isClientsExpanded && (
                <CardContent className="pt-0">
                  <PropertyInterestedClients
                    property={property}
                    currentAgentId={agentId}
                  />
                </CardContent>
              )}
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Print Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Property Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <PropertyForm
              initialData={property}
              onSuccess={handleEditSuccess}
              onClose={handleEditClose}
            />
          </div>
        </div>
      )}
    </div>
  )
} 