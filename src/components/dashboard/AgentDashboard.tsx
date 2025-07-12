'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Database } from '@/types/database'
import { Home, Users, Calendar, TrendingUp, DollarSign, Phone } from 'lucide-react'

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
      // Get agent ID from agents table
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProperties} active listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Active client relationships
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Showings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingShowings}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              Require your attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Commission earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProperties.map((property) => (
                <div key={property.id} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{property.address}</p>
                    <p className="text-xs text-gray-500">
                      {property.city}, {property.state} • {property.listing_status}
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    ${property.price?.toLocaleString() || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClients.map((client) => (
                <div key={client.id} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {client.first_name} {client.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {client.email} • {client.client_type}
                    </p>
                  </div>
                  <div className="text-sm">
                    {client.phone && (
                      <Phone className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}