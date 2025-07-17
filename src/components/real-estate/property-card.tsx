"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Eye, Heart, MapPin, Bed, Bath, Square, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Property } from "@/types/database"

interface PropertyCardProps {
  property: Property & {
    agent?: {
      name: string
      avatar?: string
      id: string
    }
    photos?: string[]
    interested_clients_count?: number
    showings_count?: number
  }
  onViewDetails?: (property: Property) => void
  onToggleFavorite?: (propertyId: string) => void
  isFavorite?: boolean
  showAgentInfo?: boolean
  className?: string
}

export function PropertyCard({ 
  property, 
  onViewDetails, 
  onToggleFavorite, 
  isFavorite = false,
  showAgentInfo = true,
  className = ""
}: PropertyCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "available":
        return "default"
      case "sold":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "text-green-600"
      case "sold":
        return "text-red-600"
      case "pending":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card className={`w-full max-w-sm overflow-hidden hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <div className="relative h-48 bg-muted overflow-hidden">
        {property.photos && property.photos.length > 0 ? (
          <img 
            src={property.photos[0]} 
            alt={property.title}
            className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
            <Square className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge 
            variant={getStatusVariant(property.status)}
            className="capitalize"
          >
            {property.status}
          </Badge>
          {onToggleFavorite && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
              onClick={() => onToggleFavorite(property.id)}
            >
              <Heart 
                className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
              />
            </Button>
          )}
        </div>

        {property.photos && property.photos.length > 1 && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="text-xs">
              +{property.photos.length - 1} photos
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1 text-lg">{property.title}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {property.city}, {property.state}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold text-primary">
          {formatCurrency(property.price)}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {property.bedrooms} bed
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {property.bathrooms} bath
          </div>
          <div className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            {property.square_feet?.toLocaleString()} sq ft
          </div>
        </div>

        {(property.interested_clients_count || property.showings_count) && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {property.interested_clients_count && (
                <span>{property.interested_clients_count} interested</span>
              )}
              {property.showings_count && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {property.showings_count} showings
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-3">
        {showAgentInfo && property.agent && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={property.agent.avatar} />
              <AvatarFallback className="text-xs">
                {property.agent.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{property.agent.name}</span>
          </div>
        )}
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onViewDetails?.(property)}
          className="ml-auto"
        >
          <Eye className="h-3 w-3 mr-1" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}