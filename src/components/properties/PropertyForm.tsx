'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePropertyStore } from '@/stores/usePropertyStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type PropertyInsert = Database['public']['Tables']['properties']['Insert']
type Agent = Database['public']['Tables']['agents']['Row']

interface PropertyFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function PropertyForm({ onClose, onSuccess }: PropertyFormProps) {
  const { user } = useAuth()
  const { createProperty } = usePropertyStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agents, setAgents] = useState<Agent[]>([])
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    property_id: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    lot_size: '',
    year_built: '',
    property_type: 'single_family',
    listing_status: 'active',
    mls_number: '',
    description: '',
    assigned_agent_id: '',
  })

  useEffect(() => {
    if (user) {
      fetchAgents()
      getCurrentAgentId()
    }
  }, [user])

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
        setFormData(prev => ({ ...prev, assigned_agent_id: data.id }))
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
      if (!currentAgentId) {
        throw new Error('Unable to determine current agent')
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
        listing_date: new Date().toISOString(),
      }

      const result = await createProperty(propertyData)
      
      if (result) {
        onSuccess()
        onClose()
      } else {
        setError('Failed to create property')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add New Property</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Property ID"
              name="property_id"
              value={formData.property_id}
              onChange={handleInputChange}
              required
            />

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
              {loading ? 'Creating...' : 'Create Property'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 