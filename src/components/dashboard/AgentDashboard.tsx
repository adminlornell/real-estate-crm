'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Database } from '@/types/database'
import { Home, Users, Calendar, TrendingUp, DollarSign, Phone, MapPin, Mail, Building } from 'lucide-react'
import RecentActivities from './RecentActivities'

type Property = Database['public']['Tables']['properties']['Row']
type Client = Database['public']['Tables']['clients']['Row']
type Showing = Database['public']['Tables']['showings']['Row']

interface DashboardStats {
  totalProperties: number
  activeProperties: number
  totalClients: number
  pendingShowings: number
  pendingTasks: number
  monthlyRevenue: number
}

export default function AgentDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeProperties: 0,
    totalClients: 0,
    pendingShowings: 0,
    pendingTasks: 0,
    monthlyRevenue: 0,
  })
  const [recentProperties, setRecentProperties] = useState<Property[]>([])
  const [recentClients, setRecentClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Check if user exists and has an id
      if (!user?.id) {
        console.error('User not found or missing ID')
        return
      }
      
      // Get agent ID from agents table
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!agent) return

      // Fetch properties
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('assigned_agent_id', agent.id)
        .order('created_at', { ascending: false })

      // Fetch clients
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('assigned_agent_id', agent.id)
        .order('created_at', { ascending: false })

      // Fetch showings
      const { data: showings } = await supabase
        .from('showings')
        .select('*')
        .eq('agent_id', agent.id)
        .gte('showing_date', new Date().toISOString().split('T')[0])
        .order('showing_date', { ascending: true })

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', agent.id)
        .eq('status', 'pending')

      // Calculate stats
      const totalProperties = properties?.length || 0
      const activeProperties = properties?.filter(p => p.listing_status === 'active').length || 0
      const totalClients = clients?.length || 0
      const pendingShowings = showings?.filter(s => s.status === 'scheduled').length || 0
      const pendingTasks = tasks?.length || 0
      
      // Calculate monthly revenue (mock calculation)
      const soldProperties = properties?.filter(p => p.listing_status === 'sold') || []
      const monthlyRevenue = soldProperties.reduce((sum, p) => sum + (p.price || 0) * 0.03, 0)

      setStats({
        totalProperties,
        activeProperties,
        totalClients,
        pendingShowings,
        pendingTasks,
        monthlyRevenue,
      })

      setRecentProperties(properties?.slice(0, 5) || [])
      setRecentClients(clients?.slice(0, 5) || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (path: string) => {
    router.push(path)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
          <Card key={`dashboard-loading-${i}`} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          className="group cursor-pointer hover:shadow-xl hover:shadow-blue-600/10 transition-all duration-200 hover:scale-105 hover:border-blue-200"
          onClick={() => handleCardClick('/properties')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalProperties}</div>
            <p className="text-xs text-gray-600 font-medium">
              {stats.activeProperties} active listings
            </p>
          </CardContent>
        </Card>

        <Card 
          className="group cursor-pointer hover:shadow-xl hover:shadow-blue-600/10 transition-all duration-200 hover:scale-105 hover:border-blue-200"
          onClick={() => handleCardClick('/clients')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalClients}</div>
            <p className="text-xs text-gray-600 font-medium">
              Active client relationships
            </p>
          </CardContent>
        </Card>

        <Card 
          className="group cursor-pointer hover:shadow-xl hover:shadow-blue-600/10 transition-all duration-200 hover:scale-105 hover:border-blue-200"
          onClick={() => handleCardClick('/properties')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">Upcoming Showings</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.pendingShowings}</div>
            <p className="text-xs text-gray-600 font-medium">
              Scheduled this week
            </p>
          </CardContent>
        </Card>

        <Card 
          className="group cursor-pointer hover:shadow-xl hover:shadow-blue-600/10 transition-all duration-200 hover:scale-105 hover:border-blue-200"
          onClick={() => handleCardClick('/tasks')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">Pending Tasks</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</div>
            <p className="text-xs text-gray-600 font-medium">
              Require your attention
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleCardClick('/reports')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${stats.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Commission earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              <Link href="/dashboard/recent-properties" className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
                <Home className="w-5 h-5" />
                <span>Recent Properties</span>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProperties.map((property) => (
                <div 
                  key={property.id} 
                  className="flex items-center space-x-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
                  onClick={() => handleCardClick(`/properties/${property.id}`)}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{property.address}</p>
                    <div className="flex items-center space-x-1 text-xs text-gray-600 font-medium">
                      <MapPin className="w-3 h-3" />
                      <span>{property.city}, {property.state} • {property.listing_status}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    ${property.price?.toLocaleString() || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              <Link href="/dashboard/recent-clients" className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
                <Users className="w-5 h-5" />
                <span>Recent Clients</span>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClients.map((client) => (
                <div 
                  key={client.id} 
                  className="flex items-center space-x-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
                  onClick={() => handleCardClick(`/clients/${client.id}`)}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {client.first_name} {client.last_name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-600 font-medium">
                      <Mail className="w-3 h-3" />
                      <span>{client.email}</span>
                      <span className="text-gray-400">•</span>
                      <span className="capitalize">{client.client_type}</span>
                    </div>
                  </div>
                  {client.phone && (
                    <div className="text-sm">
                      <Phone className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <RecentActivities />
      </div>
    </div>
  )
}