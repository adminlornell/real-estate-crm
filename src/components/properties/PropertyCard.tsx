'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { Database } from '@/types/database'
import { MapPin, Bed, Bath, Square, Calendar, Eye } from 'lucide-react'

type Property = Database['public']['Tables']['properties']['Row']

interface PropertyCardProps {
  property: Property
  onView?: (id: string) => void
  onEdit?: (property: Property) => void
  onDelete?: (id: string) => void
}

export default function PropertyCard({ property, onView, onEdit, onDelete }: PropertyCardProps) {
  const photos = property.photos as string[] || []

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-200 relative">
        {photos.length > 0 ? (
          <img 
            src={photos[0]} 
            alt={property.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-500">No image</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            property.listing_status === 'active' ? 'bg-green-100 text-green-800' :
            property.listing_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            property.listing_status === 'sold' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {property.listing_status?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {property.price ? formatCurrency(property.price) : 'Price not set'}
            </CardTitle>
            <p className="text-sm text-gray-600 flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {property.address}, {property.city}, {property.state}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <Bed className="w-4 h-4 mr-1" />
            {property.bedrooms || 0} bed
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1" />
            {property.bathrooms || 0} bath
          </div>
          <div className="flex items-center">
            <Square className="w-4 h-4 mr-1" />
            {property.square_feet?.toLocaleString() || 0} sq ft
          </div>
        </div>

        {property.description && (
          <p className="text-sm text-gray-700 mb-4 line-clamp-3">
            {property.description}
          </p>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            Listed: {property.created_at ? new Date(property.created_at).toLocaleDateString() : 'N/A'}
          </div>
          
          <div className="flex space-x-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(property.id)}
                className="flex items-center"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(property)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(property.id)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}