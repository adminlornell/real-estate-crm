'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { useAutoSave } from '@/hooks/useAutoSave'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { showToast } from '@/lib/toast'

type PropertyInsert = Database['public']['Tables']['properties']['Insert']
type Property = Database['public']['Tables']['properties']['Row']
type Agent = Database['public']['Tables']['agents']['Row']

interface PropertyFormProps {
  onClose: () => void
  onSuccess: () => void
  initialData?: Property | null
}

// Function to generate the next property ID
const generateNextPropertyId = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('property_id')
      .order('property_id', { ascending: false })
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      const lastId = data[0].property_id
      // Extract the number from the last ID (e.g., "PROP-006" -> 6)
      const match = lastId.match(/PROP-(\d+)/)
      if (match) {
        const lastNumber = parseInt(match[1])
        const nextNumber = lastNumber + 1
        return `PROP-${nextNumber.toString().padStart(3, '0')}`
      }
    }
    
    // If no properties exist or pattern doesn't match, start with PROP-001
    return 'PROP-001'
  } catch (error) {
    console.error('Error generating property ID:', error)
    // Fallback: try to generate a unique ID with timestamp
    const timestamp = Date.now().toString().slice(-6)
    return `PROP-${timestamp}`
  }
}

// Function to validate if a property ID is available
const validatePropertyId = async (propertyId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('id')
      .eq('property_id', propertyId)
      .limit(1)

    if (error) throw error
    return data.length === 0 // true if no existing property with this ID
  } catch (error) {
    console.error('Error validating property ID:', error)
    return false
  }
}

export default function PropertyForm({ onClose, onSuccess, initialData }: PropertyFormProps) {
  const { user } = useAuth()
  const { createProperty, updateProperty } = usePropertyStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agents, setAgents] = useState<Agent[]>([])
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState(false)
  const isEditing = !!initialData

  const [formData, setFormData] = useState({
    property_id: initialData?.property_id || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip_code: initialData?.zip_code || '',
    price: initialData?.price?.toString() || '',
    bedrooms: initialData?.bedrooms?.toString() || '',
    bathrooms: initialData?.bathrooms?.toString() || '',
    square_feet: initialData?.square_feet?.toString() || '',
    lot_size: initialData?.lot_size?.toString() || '',
    year_built: initialData?.year_built?.toString() || '',
    property_type: initialData?.property_type || 'single_family',
    listing_status: initialData?.listing_status || 'active',
    mls_number: initialData?.mls_number || '',
    description: initialData?.description || '',
    assigned_agent_id: initialData?.assigned_agent_id || '',
  })

  // Auto-save functionality
  const autoSaveKey = isEditing ? `property_edit_${initialData?.id}` : 'property_new'
  const { clearSavedData, hasSavedData } = useAutoSave({
    key: autoSaveKey,
    data: formData,
    enabled: !isEditing, // Only auto-save for new properties
    onRestore: (savedData) => {
      if (!isEditing && savedData) {
        setFormData(savedData)
        showToast.success('Draft restored from auto-save')
      }
    },
  })

  useEffect(() => {
    if (user) {
      fetchAgents()
      getCurrentAgentId()
      
      // Generate property ID for new properties
      if (!isEditing && !formData.property_id) {
        generatePropertyId()
      }
    }
  }, [user])

  const generatePropertyId = async () => {
    setGeneratingId(true)
    setError('')
    try {
      let attempts = 0
      let nextId = ''
      let isAvailable = false
      
      // Try up to 3 times to generate a unique ID
      while (!isAvailable && attempts < 3) {
        nextId = await generateNextPropertyId()
        isAvailable = await validatePropertyId(nextId)
        
        if (!isAvailable) {
          attempts++
          // If the sequential ID is taken, try with a timestamp suffix
          if (attempts === 2) {
            const timestamp = Date.now().toString().slice(-4)
            nextId = `PROP-${nextId.split('-')[1]}-${timestamp}`
            isAvailable = await validatePropertyId(nextId)
          }
        }
      }
      
      if (isAvailable) {
        setFormData(prev => ({ ...prev, property_id: nextId }))
      } else {
        throw new Error('Unable to generate unique property ID')
      }
    } catch (error) {
      console.error('Error generating property ID:', error)
      setError('Failed to generate property ID. Please try again.')
    } finally {
      setGeneratingId(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('status', 'active')
        .order('agent_name')

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const getCurrentAgentId = async () => {
    try {
      const { data } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (data) {
        setCurrentAgentId(data.id)
        if (!initialData) {
          setFormData(prev => ({ ...prev, assigned_agent_id: data.id }))
        }
      }
    } catch (error) {
      console.error('Error getting current agent:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Debug: Check authentication state
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Current session:', session?.user?.id)
      console.log('Context user:', user?.id)
      
      if (!currentAgentId) {
        throw new Error('Unable to determine current agent')
      }

      if (!formData.property_id) {
        throw new Error('Property ID is required')
      }

      console.log('Creating property with:', {
        currentAgentId,
        user_id: user?.id,
        session_user_id: session?.user?.id,
        property_id: formData.property_id
      })

      // Debug: Verify agent exists and belongs to user
      const { data: agentVerification, error: agentError } = await supabase
        .from('agents')
        .select('id, user_id, agent_name')
        .eq('id', currentAgentId)
        .single()

      console.log('Agent verification:', { agentVerification, agentError })
      
      if (agentError || !agentVerification) {
        throw new Error('Agent verification failed')
      }

      if (agentVerification.user_id !== user?.id) {
        throw new Error('Agent does not belong to current user')
      }

      const propertyData: PropertyInsert = {
        property_id: formData.property_id,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        price: formData.price ? parseFloat(formData.price) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        square_feet: formData.square_feet ? parseInt(formData.square_feet) : null,
        lot_size: formData.lot_size ? parseFloat(formData.lot_size) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        property_type: formData.property_type as any,
        listing_status: formData.listing_status as any,
        mls_number: formData.mls_number || null,
        description: formData.description || null,
        assigned_agent_id: formData.assigned_agent_id || currentAgentId,
        created_by: currentAgentId,
        listing_date: isEditing ? initialData.listing_date : new Date().toISOString(),
      }

      let result
      if (isEditing) {
        result = await updateProperty(initialData.id, propertyData)
      } else {
        result = await createProperty(propertyData)
      }
      
      if (result) {
        clearSavedData() // Clear auto-saved data on successful submission
        onSuccess()
        onClose()
      } else {
        setError(`Failed to ${isEditing ? 'update' : 'create'} property`)
      }
    } catch (error) {
      console.error('Property creation/update error:', error)
      
      // Provide more specific error messages
      let errorMessage = 'An error occurred'
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Check for common RLS policy errors
        if (error.message.includes('new row violates row-level security policy')) {
          errorMessage = 'You do not have permission to create properties. Please contact your administrator.'
        } else if (error.message.includes('duplicate key value')) {
          errorMessage = 'A property with this ID already exists. Please try generating a new ID.'
        } else if (error.message.includes('violates foreign key constraint')) {
          errorMessage = 'Invalid agent assignment. Please select a valid agent.'
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Property' : 'Add New Property'}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Input
                  label="Property ID"
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleInputChange}
                  disabled={true}
                  required
                  className="bg-gray-50 flex-1"
                />
                {!isEditing && (
                  <Button
                    type="button"
                    onClick={generatePropertyId}
                    disabled={generatingId}
                    className="mt-6 px-3 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300"
                  >
                    {generatingId ? '...' : '↻'}
                  </Button>
                )}
              </div>
              {generatingId && (
                <p className="text-sm text-blue-600 mt-1">Generating property ID...</p>
              )}
              {!isEditing && !generatingId && (
                <p className="text-sm text-gray-500 mt-1">Auto-generated sequential ID (click ↻ to regenerate)</p>
              )}
              {isEditing && (
                <p className="text-sm text-gray-500 mt-1">Property ID cannot be changed when editing</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Agent
              </label>
              <select
                name="assigned_agent_id"
                value={formData.assigned_agent_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Agent</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.agent_name} ({agent.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
            />

            <Input
              label="State"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              maxLength={2}
              required
            />

            <Input
              label="Zip Code"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
            />

            <Input
              label="MLS Number"
              name="mls_number"
              value={formData.mls_number}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Bedrooms"
              name="bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={handleInputChange}
            />

            <Input
              label="Bathrooms"
              name="bathrooms"
              type="number"
              step="0.5"
              value={formData.bathrooms}
              onChange={handleInputChange}
            />

            <Input
              label="Square Feet"
              name="square_feet"
              type="number"
              value={formData.square_feet}
              onChange={handleInputChange}
            />

            <Input
              label="Year Built"
              name="year_built"
              type="number"
              value={formData.year_built}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="single_family">Single Family</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="multi_family">Multi Family</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Listing Status
              </label>
              <select
                name="listing_status"
                value={formData.listing_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Property description..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Property' : 'Create Property')
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 