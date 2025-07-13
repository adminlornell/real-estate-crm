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
  Home, 
  Building, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Filter,
  Search,
  Bed,
  Bath,
  Square,
  Tag
} from 'lucide-react'
import BackNavigation from '@/components/navigation/BackNavigation'

type Property = Database['public']['Tables']['properties']['Row']

export default function RecentPropertiesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Handle browser back button for intuitive navigation
  useBrowserBackButton()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchProperties()
    }
  }, [user, authLoading, router])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (!agent) return

      const { data: propertiesData } = await supabase
        .from('properties')
        .select('*')
        .eq('assigned_agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(50) // Get last 50 properties

      if (propertiesData) {
        setProperties(propertiesData)
        setFilteredProperties(propertiesData)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = properties

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(property => 
        property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.state?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.listing_status === statusFilter)
    }

    setFilteredProperties(filtered)
  }, [searchTerm, statusFilter, properties])

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sold':
        return 'bg-blue-100 text-blue-800'
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
      <MainNavigation title="Recent Properties" />
      
      <main className="p-6">
        {/* Header */}
        <div className="mb-6">
          <BackNavigation />
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Home className="w-6 h-6" />
                <span>Recent Properties</span>
              </h1>
              <p className="text-gray-600 mt-1">View and manage your recently added properties</p>
            </div>
            <Button onClick={() => router.push('/properties')}>
              View All Properties
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
                  placeholder="Search by address, city, or state..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No properties found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Start by adding your first property'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredProperties.map((property) => (
              <Card 
                key={property.id}
                className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => router.push(`/properties/${property.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {property.address || 'No Address'}
                        </CardTitle>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {property.city}, {property.state} {property.zip_code}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="text-sm">Price</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${property.price?.toLocaleString() || 'N/A'}
                      </span>
                    </div>

                    {/* Property Type */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <Tag className="w-4 h-4 mr-1" />
                        <span className="text-sm">Type</span>
                      </div>
                      <span className="text-sm text-gray-900 capitalize">
                        {property.property_type || 'N/A'}
                      </span>
                    </div>

                    {/* Property Details */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {property.bedrooms && (
                        <div className="flex items-center">
                          <Bed className="w-4 h-4 mr-1" />
                          {property.bedrooms}
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center">
                          <Bath className="w-4 h-4 mr-1" />
                          {property.bathrooms}
                        </div>
                      )}
                      {property.square_feet && (
                        <div className="flex items-center">
                          <Square className="w-4 h-4 mr-1" />
                          {property.square_feet.toLocaleString()} sqft
                        </div>
                      )}
                    </div>

                    {/* Status and Date */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.listing_status)}`}>
                        {property.listing_status || 'Unknown'}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(property.created_at)}
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