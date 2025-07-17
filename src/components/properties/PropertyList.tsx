'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { useAuth } from '@/contexts/AuthContext'
import PropertyCard from './PropertyCard'
import PropertyForm from './PropertyForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Filter, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Property = Database['public']['Tables']['properties']['Row']

export default function PropertyList() {
  const { user } = useAuth()
  const router = useRouter()
  const {
    properties,
    loading,
    error,
    filters,
    fetchProperties,
    deleteProperty,
    setFilters,
    clearError
  } = usePropertyStore()
  
  const [agentId, setAgentId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)

  useEffect(() => {
    if (user) {
      // Get agent ID from agents table
      const getAgentId = async () => {
        const { data } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (data) {
          setAgentId(data.id)
          fetchProperties(data.id)
        }
      }
      getAgentId()
    }
  }, [user, fetchProperties])

  useEffect(() => {
    if (agentId) {
      fetchProperties(agentId)
    }
  }, [filters, agentId, fetchProperties])

  const handleFilterChange = (key: string, value: string | number | null) => {
    setFilters({ [key]: value })
  }

  const handleView = (id: string) => {
    router.push(`/properties/${id}`)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      await deleteProperty(id)
    }
  }

  const handleEdit = (property: Property) => {
    setEditingProperty(property)
    setShowForm(true)
  }

  const handleSuccess = () => {
    if (agentId) {
      fetchProperties(agentId)
    }
    setShowForm(false)
    setEditingProperty(null)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProperty(null)
  }

  if (loading && properties.length === 0) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={`property-list-skeleton-${i}`} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Properties</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search properties by address, city, or MLS number..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </CardTitle>
            <button
              onClick={() => setFilters({
                status: 'all',
                city: '',
                minPrice: null,
                maxPrice: null,
                propertyType: 'all',
                search: '',
                bedrooms: null,
              })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Property Type
              </label>
              <select
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium"
              >
                <option value="all">All Types</option>
                <option value="single_family">Single Family</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="multi_family">Multi Family</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                City
              </label>
              <Input
                placeholder="Enter city..."
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Price Range
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : null)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Bedrooms
              </label>
              <select
                value={filters.bedrooms || 'all'}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value === 'all' ? null : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-medium"
              >
                <option value="all">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {properties.length} properties
          {(filters.search || filters.status !== 'all' || filters.city || filters.minPrice || filters.maxPrice || filters.propertyType !== 'all' || filters.bedrooms) && (
            <span className="text-blue-600 ml-2">
              (filtered)
            </span>
          )}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button
            onClick={clearError}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your filters or add a new property.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && properties.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-center">Loading...</p>
          </div>
        </div>
      )}

      {/* Property Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <PropertyForm
              onClose={handleCloseForm}
              onSuccess={handleSuccess}
              initialData={editingProperty}
            />
          </div>
        </div>
      )}
    </div>
  )
}